import React, { useMemo } from 'react';
import { Button, InlineLoading, InlineNotification } from '@carbon/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { navigate } from '@openmrs/esm-framework';
import { CardHeader } from '@openmrs/esm-patient-common-lib';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { convertToCurrency } from '../../helpers';
import { type LineItem, type PaymentFormValue, PaymentStatus, type MappedBill } from '../../types';
import { InvoiceBreakDown } from './invoice-breakdown/invoice-breakdown.component';
import PaymentForm from './payment-form/payment-form.component';
import PaymentHistory from './payment-history/payment-history.component';
import styles from './payments.scss';
import { usePaymentSchema } from '../../hooks/usePaymentSchema';
import { usePaymentModes } from '../../billing.resource';
import {
  createEmptyPaymentRow,
  PaymentAiWorkspaceHeaderAction,
  useAiPaymentsIntegration,
} from './ai-payments.integration';
import { getLineItemAmountDue } from '../editable-line-item-cells/utils';
import { getActiveBillingRecords } from '../../billing-voided-utils';

type PaymentProps = {
  bill: MappedBill;
  selectedLineItems: Array<LineItem>;
  showDiscardButton?: boolean;
  showTaxSummary?: boolean;
  discardDestination?: string;
  onDiscard?: () => void | Promise<void>;
  onRefreshBill?: () => unknown;
  paymentContentHeader?: React.ReactNode;
  summaryContentHeader?: React.ReactNode;
};

const Payments: React.FC<PaymentProps> = ({
  bill,
  selectedLineItems,
  showDiscardButton = true,
  showTaxSummary = true,
  discardDestination,
  onDiscard,
  onRefreshBill,
  paymentContentHeader,
  summaryContentHeader,
}) => {
  const { t } = useTranslation();
  const paymentSchema = usePaymentSchema(bill);
  const paymentFormSchema = useMemo(() => z.object({ payment: z.array(paymentSchema) }), [paymentSchema]);
  const { paymentModes, isLoading: isLoadingPaymentModes, error: paymentModesError } = usePaymentModes();

  const methods = useForm<PaymentFormValue>({
    mode: 'onChange',
    defaultValues: { payment: [createEmptyPaymentRow()] },
    resolver: zodResolver(paymentFormSchema),
  });

  const formValues = useWatch({
    name: 'payment',
    control: methods.control,
  });

  const selectedUnpaidLineItems = useMemo(
    () => getActiveBillingRecords(selectedLineItems).filter((item) => item.paymentStatus !== PaymentStatus.PAID),
    [selectedLineItems],
  );

  const { fields, isSubmittingPayments, launchAiPaymentsWorkspace, processPayments, removePaymentRow } =
    useAiPaymentsIntegration({
      bill,
      formMethods: methods,
      paymentModes,
      selectedLineItems: selectedUnpaidLineItems,
    });

  const hasSelectedUnpaidLineItems = selectedUnpaidLineItems.length > 0;
  const hasEnteredPaymentAmount = formValues?.some((item) => Number(item.amount ?? 0) > 0) ?? false;
  const totalNewPayments = formValues?.reduce((curr: number, prev) => Number(prev.amount ?? 0) + curr, 0) ?? 0;
  const amountDue = bill.balance ?? 0;
  const summaryTotalAmount = bill.totalAmountWithoutTaxAndDiscount ?? bill.totalAmount ?? 0;

  const selectedLineItemsAmountDue = useMemo(
    () =>
      selectedUnpaidLineItems.reduce((currentAmount, lineItem) => currentAmount + getLineItemAmountDue(lineItem), 0),
    [selectedUnpaidLineItems],
  );
  const selectedLineItemsRequiredPayment = Math.min(selectedLineItemsAmountDue, Math.max(amountDue, 0));
  const handleNavigateToBillingDashboard = () =>
    onDiscard
      ? onDiscard()
      : navigate({
          to: discardDestination ?? window.getOpenmrsSpaBase() + 'home/billing',
        });

  const amountDueDisplay = (amount: number) => (amount < 0 ? 'Client balance' : 'Amount due');
  const isFullyPaid = !hasSelectedUnpaidLineItems || totalNewPayments >= selectedLineItemsRequiredPayment;
  const hasAmountPaidExceeded = amountDue > 0 && totalNewPayments > amountDue;
  const isPaymentInvalid =
    hasSelectedUnpaidLineItems &&
    hasEnteredPaymentAmount &&
    !isFullyPaid &&
    getActiveBillingRecords(bill.lineItems).length > 1;
  const showAiPaymentsAction = bill.status !== PaymentStatus.PAID;
  const isProcessPaymentDisabled = !hasEnteredPaymentAmount || hasAmountPaidExceeded || isSubmittingPayments;

  return (
    <FormProvider {...methods}>
      <div className={styles.wrapper}>
        <div className={styles.paymentContainer}>
          {paymentContentHeader}
          <div className={styles.paymentHeader}>
            <CardHeader title={t('payments', 'Payments')}>
              {showAiPaymentsAction ? (
                <PaymentAiWorkspaceHeaderAction onLaunchAiPayments={launchAiPaymentsWorkspace} />
              ) : null}
            </CardHeader>
          </div>
          <div>
            {bill && <PaymentHistory bill={bill} onRefreshBill={onRefreshBill} />}
            {isPaymentInvalid && (
              <InlineNotification
                title={t('incompletePayment', 'Incomplete payment')}
                subtitle={t(
                  'incompletePaymentSubtitle',
                  'Please ensure all selected line items are fully paid, Total amount expected is {{selectedLineItemsAmountDue}}',
                  {
                    selectedLineItemsAmountDue: convertToCurrency(selectedLineItemsRequiredPayment),
                  },
                )}
                lowContrast
                kind="error"
                className={styles.paymentError}
              />
            )}
            {hasAmountPaidExceeded && (
              <InlineNotification
                title={t('overPayment', 'Over payment')}
                subtitle={t(
                  'overPaymentSubtitle',
                  'Amount paid {{totalNewPayments}} should not be greater than amount due {{amountDue}} for selected line items',
                  {
                    totalNewPayments: convertToCurrency(totalNewPayments),
                    amountDue: convertToCurrency(amountDue),
                  },
                )}
                lowContrast
                kind="warning"
                className={styles.paymentError}
              />
            )}
            <PaymentForm
              disablePayment={amountDue <= 0}
              error={paymentModesError}
              fields={fields}
              isLoading={isLoadingPaymentModes}
              onRemovePaymentRow={removePaymentRow}
              paymentModes={paymentModes}
            />
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.paymentTotals}>
          {summaryContentHeader}
          <div>
            <InvoiceBreakDown label={t('totalAmount', 'Total amount')} value={convertToCurrency(summaryTotalAmount)} />
            <InvoiceBreakDown label={t('discounts', 'Discounts')} value={convertToCurrency(bill.totalDiscounts ?? 0)} />
            {showTaxSummary ? (
              <InvoiceBreakDown label={t('tax', 'Tax')} value={convertToCurrency(bill.totalTax ?? 0)} />
            ) : null}
            <InvoiceBreakDown
              label={t('totalTendered', 'Total tendered')}
              value={convertToCurrency(bill.totalActualPayments ?? 0)}
            />
            <InvoiceBreakDown
              hasBalance={amountDue < 0}
              label={amountDueDisplay(amountDue)}
              value={convertToCurrency(amountDue ?? 0)}
            />
            <div className={styles.processPayments}>
              {showDiscardButton ? (
                <Button type="button" onClick={handleNavigateToBillingDashboard} kind="secondary">
                  {t('discard', 'Discard')}
                </Button>
              ) : null}
              <Button type="button" onClick={() => void processPayments(t)} disabled={isProcessPaymentDisabled}>
                {isSubmittingPayments ? (
                  <span className={styles.processButtonContent}>
                    {t('processingPayments', 'Processing...')}
                    <InlineLoading status="active" iconDescription={t('loading', 'Loading')} />
                  </span>
                ) : (
                  t('processPayment', 'Process Payment')
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default Payments;
