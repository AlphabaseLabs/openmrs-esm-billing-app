import React, { useEffect, useMemo, useState } from 'react';
import { Button, InlineLoading, InlineNotification, TextInput } from '@carbon/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { navigate, restBaseUrl, showSnackbar } from '@openmrs/esm-framework';
import { CardHeader } from '@openmrs/esm-patient-common-lib';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { mutate } from 'swr';
import { z } from 'zod';
import { convertToCurrency } from '../../helpers';
import { type LineItem, type PaymentFormValue, PaymentStatus, type MappedBill } from '../../types';
import { InvoiceBreakDown } from './invoice-breakdown/invoice-breakdown.component';
import PaymentForm from './payment-form/payment-form.component';
import PaymentHistory from './payment-history/payment-history.component';
import styles from './payments.scss';
import { usePaymentSchema } from '../../hooks/usePaymentSchema';
import { updateBillAdditionalDiscount, usePaymentModes } from '../../billing.resource';
import {
  createEmptyPaymentRow,
  PaymentAiWorkspaceHeaderAction,
  useAiPaymentsIntegration,
} from './ai-payments.integration';
import { getLineItemAmountDue } from '../editable-line-item-cells/utils';
import { extractErrorMessagesFromResponse } from '../../utils';

type PaymentProps = {
  bill: MappedBill;
  selectedLineItems: Array<LineItem>;
  showDiscardButton?: boolean;
  discardDestination?: string;
  onDiscard?: () => void | Promise<void>;
};

const Payments: React.FC<PaymentProps> = ({
  bill,
  selectedLineItems,
  showDiscardButton = true,
  discardDestination,
  onDiscard,
}) => {
  const { t } = useTranslation();
  const paymentSchema = usePaymentSchema(bill);
  const paymentFormSchema = useMemo(() => z.object({ payment: z.array(paymentSchema) }), [paymentSchema]);
  const { paymentModes, isLoading: isLoadingPaymentModes, error: paymentModesError } = usePaymentModes();
  const currentAdditionalDiscount = bill.additionalDiscount ?? 0;
  const [additionalDiscountDraft, setAdditionalDiscountDraft] = useState(String(currentAdditionalDiscount));
  const [isSavingAdditionalDiscount, setIsSavingAdditionalDiscount] = useState(false);

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
    () => selectedLineItems.filter((item) => item.paymentStatus !== PaymentStatus.PAID),
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
  const summaryTotalAmount = bill.totalAmount ?? 0;

  const selectedLineItemsAmountDue = useMemo(
    () =>
      selectedUnpaidLineItems.reduce((currentAmount, lineItem) => currentAmount + getLineItemAmountDue(lineItem), 0),
    [selectedUnpaidLineItems],
  );
  const selectedLineItemsRequiredPayment = Math.min(selectedLineItemsAmountDue, Math.max(amountDue, 0));
  const additionalDiscountEligibleAmount = useMemo(
    () =>
      (bill.lineItems ?? [])
        .filter(
          (lineItem) =>
            !lineItem.voided &&
            (lineItem.paymentStatus === PaymentStatus.PENDING || lineItem.paymentStatus === PaymentStatus.POSTED),
        )
        .reduce((total, lineItem) => total + getLineItemAmountDue(lineItem), 0),
    [bill.lineItems],
  );
  const additionalDiscountInputMax = Math.max(additionalDiscountEligibleAmount, currentAdditionalDiscount);
  const parsedAdditionalDiscount = additionalDiscountDraft.trim() === '' ? Number.NaN : Number(additionalDiscountDraft);
  const hasChangedAdditionalDiscount =
    Number.isFinite(parsedAdditionalDiscount) && parsedAdditionalDiscount !== currentAdditionalDiscount;
  const isAdditionalDiscountValid =
    Number.isFinite(parsedAdditionalDiscount) &&
    parsedAdditionalDiscount >= 0 &&
    parsedAdditionalDiscount <= additionalDiscountInputMax;

  useEffect(() => {
    setAdditionalDiscountDraft(String(currentAdditionalDiscount));
  }, [bill.uuid, currentAdditionalDiscount]);

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
    hasSelectedUnpaidLineItems && hasEnteredPaymentAmount && !isFullyPaid && bill.lineItems.length > 1;
  const showAiPaymentsAction = bill.status !== PaymentStatus.PAID;
  const isProcessPaymentDisabled = !hasEnteredPaymentAmount || hasAmountPaidExceeded || isSubmittingPayments;
  const isAdditionalDiscountSubmitDisabled =
    isSavingAdditionalDiscount || bill.closed || !hasChangedAdditionalDiscount || !isAdditionalDiscountValid;

  const refreshBillData = () =>
    mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/cashier/bill`), undefined, {
      revalidate: true,
    });

  const handleAdditionalDiscountSubmit = async () => {
    if (!isAdditionalDiscountValid || !hasChangedAdditionalDiscount) {
      return;
    }

    setIsSavingAdditionalDiscount(true);

    try {
      await updateBillAdditionalDiscount(bill.uuid, parsedAdditionalDiscount);
      await refreshBillData();
      showSnackbar({
        title: t('additionalDiscountSaved', 'Additional discount saved'),
        subtitle: t('additionalDiscountSavedSubtitle', 'Invoice additional discount was updated successfully'),
        kind: 'success',
        timeoutInMs: 3000,
      });
    } catch (error: any) {
      showSnackbar({
        title: t('additionalDiscountSaveFailed', 'Additional discount update failed'),
        subtitle: error?.responseBody
          ? extractErrorMessagesFromResponse(error.responseBody)
          : (error?.message ?? t('additionalDiscountSaveFailedFallback', 'Unable to update additional discount')),
        kind: 'error',
        timeoutInMs: 5000,
        isLowContrast: true,
      });
    } finally {
      setIsSavingAdditionalDiscount(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className={styles.wrapper}>
        <div className={styles.paymentContainer}>
          <div className={styles.paymentHeader}>
            <CardHeader title={t('payments', 'Payments')}>
              {showAiPaymentsAction ? (
                <PaymentAiWorkspaceHeaderAction onLaunchAiPayments={launchAiPaymentsWorkspace} />
              ) : null}
            </CardHeader>
          </div>
          <div>
            {bill && <PaymentHistory bill={bill} />}
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
          <div className={styles.additionalDiscountForm}>
            <TextInput
              className={styles.additionalDiscountInput}
              disabled={bill.closed || isSavingAdditionalDiscount}
              id={`${bill.uuid}-additional-discount`}
              invalid={additionalDiscountDraft.trim() !== '' && !isAdditionalDiscountValid}
              invalidText={t('additionalDiscountInvalid', 'Discount must be between 0 and {{amount}}', {
                amount: convertToCurrency(additionalDiscountInputMax),
              })}
              labelText={t('additionalDiscount', 'Additional discount')}
              max={additionalDiscountInputMax}
              min={0}
              onChange={(event) => setAdditionalDiscountDraft(event.target.value)}
              step="0.01"
              type="number"
              value={additionalDiscountDraft}
            />
            <Button
              disabled={isAdditionalDiscountSubmitDisabled}
              kind="tertiary"
              onClick={() => void handleAdditionalDiscountSubmit()}
              size="sm"
              type="button">
              {isSavingAdditionalDiscount ? t('saving', 'Saving...') : t('apply', 'Apply')}
            </Button>
          </div>
          <InvoiceBreakDown
            label={t('totalAmount', 'Total amount')}
            value={convertToCurrency(summaryTotalAmount)}
            tooltip={t('lineItemTotals', 'Line item total after line-item discounts and tax')}
          />
          <InvoiceBreakDown label={t('discount', 'Discount')} value={convertToCurrency(bill.totalDiscounts ?? 0)} />
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
    </FormProvider>
  );
};

export default Payments;
