import React from 'react';
import { Button, InlineNotification } from '@carbon/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { navigate, showSnackbar } from '@openmrs/esm-framework';
import { CardHeader } from '@openmrs/esm-patient-common-lib';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { mutate } from 'swr';
import { z } from 'zod';
import { addPaymentToBill } from '../../billing.resource';
import { convertToCurrency } from '../../helpers';
import { type LineItem, type PaymentFormValue, PaymentStatus, type MappedBill } from '../../types';
import { extractErrorMessagesFromResponse } from '../../utils';
import { InvoiceBreakDown } from './invoice-breakdown/invoice-breakdown.component';
import PaymentForm from './payment-form/payment-form.component';
import PaymentHistory from './payment-history/payment-history.component';
import styles from './payments.scss';
import { usePaymentSchema } from '../../hooks/usePaymentSchema';

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

  const methods = useForm<PaymentFormValue>({
    mode: 'onChange',
    defaultValues: { payment: [{ method: null, amount: undefined, referenceCode: '' }] },
    resolver: zodResolver(z.object({ payment: z.array(paymentSchema) })),
  });

  const formValues = useWatch({
    name: 'payment',
    control: methods.control,
  });

  const selectedUnpaidLineItems = selectedLineItems.filter((item) => item.paymentStatus !== PaymentStatus.PAID);
  const hasSelectedUnpaidLineItems = selectedUnpaidLineItems.length > 0;
  const hasEnteredPaymentAmount = formValues?.some((item) => Number(item.amount ?? 0) > 0) ?? false;
  const totalNewPayments = formValues?.reduce((curr: number, prev) => Number(prev.amount ?? 0) + curr, 0) ?? 0;
  const amountDue = bill.balance ?? 0;
  const summaryTotalAmount = (bill.totalAmountWithoutTaxAndDiscount ?? 0) + (bill.totalTax ?? 0);

  // selected line items amount due
  const selectedLineItemsAmountDue = selectedUnpaidLineItems.reduce(
    (curr: number, prev) =>
      curr +
      Number(prev.price * prev.quantity) +
      Number(
        prev.taxes?.reduce((acc, tax) => acc + tax.amount, 0) -
          Number(prev.discounts?.reduce((acc, discount) => acc + discount.amount, 0)),
      ),
    0,
  );

  const handleNavigateToBillingDashboard = () =>
    onDiscard
      ? onDiscard()
      : navigate({
          to: discardDestination ?? window.getOpenmrsSpaBase() + 'home/billing',
        });

  const handleProcessPayment = async () => {
    const currentPayment = formValues?.[0];
    if (!currentPayment?.method || !currentPayment.amount) {
      return;
    }

    const paymentPayload = {
      amount: Number(bill.totalAmount ?? bill.balance ?? currentPayment.amount),
      amountTendered: Number(currentPayment.amount),
      attributes:
        currentPayment.method.attributeTypes?.flatMap((attribute) =>
          attribute.uuid
            ? [
                {
                  attributeType: attribute.uuid,
                  value: currentPayment.referenceCode ?? '',
                },
              ]
            : [],
        ) ?? [],
      instanceType: currentPayment.method.uuid,
    };

    try {
      await addPaymentToBill(bill.uuid, paymentPayload);

      showSnackbar({
        title: t('billPayment', 'Bill payment'),
        subtitle: 'Bill payment processing has been successful',
        kind: 'success',
        timeoutInMs: 3000,
      });

      const url = `/ws/rest/v1/cashier/bill/${bill.uuid}`;
      await mutate((key) => typeof key === 'string' && key.startsWith(url));
      methods.reset({ payment: [{ method: null, amount: undefined, referenceCode: '' }] });
    } catch (error) {
      showSnackbar({
        title: t('failedBillPayment', 'Bill payment failed'),
        subtitle: `An unexpected error occurred while processing your bill payment. Please contact the system administrator and provide them with the following error details: ${extractErrorMessagesFromResponse(
          error.responseBody,
        )}`,
        kind: 'error',
        timeoutInMs: 3000,
        isLowContrast: true,
      });
    }
  };

  const amountDueDisplay = (amount: number) => (amount < 0 ? 'Client balance' : 'Amount due');

  const isFullyPaid = !hasSelectedUnpaidLineItems || totalNewPayments >= selectedLineItemsAmountDue;
  const hasAmountPaidExceeded = amountDue > 0 && formValues.some((item) => Number(item.amount) > amountDue);
  const isPaymentInvalid =
    hasSelectedUnpaidLineItems && hasEnteredPaymentAmount && !isFullyPaid && bill.lineItems.length > 1;

  return (
    <FormProvider {...methods}>
      <div className={styles.wrapper}>
        <div className={styles.paymentContainer}>
          <CardHeader title={t('payments', 'Payments')}>
            <span></span>
          </CardHeader>
          <div>
            {bill && <PaymentHistory bill={bill} />}
            {isPaymentInvalid && (
              <InlineNotification
                title={t('incompletePayment', 'Incomplete payment')}
                subtitle={t(
                  'incompletePaymentSubtitle',
                  'Please ensure all selected line items are fully paid, Total amount expected is {{selectedLineItemsAmountDue}}',
                  {
                    selectedLineItemsAmountDue: convertToCurrency(selectedLineItemsAmountDue),
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
                    selectedLineItemsAmountDue: convertToCurrency(selectedLineItemsAmountDue),
                  },
                )}
                lowContrast
                kind="warning"
                className={styles.paymentError}
              />
            )}
            <PaymentForm disablePayment={amountDue <= 0} />
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.paymentTotals}>
          <InvoiceBreakDown
            label={t('totalAmount', 'Total amount')}
            value={convertToCurrency(summaryTotalAmount)}
            tooltip={t('pricePlusTax', 'Price + tax')}
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
            {/* Process Payment is disabled when ANY of these are true:
                1. No payment rows (not applicable with the default row)
                2. Form invalid: usePaymentSchema validates each row (method required, amount > 0 and amount <= bill.balance per row, referenceCode when method requires it)
                3. Overpayment: any single row has amount > bill.balance (hasAmountPaidExceeded) */}
            <Button
              type="button"
              onClick={() => handleProcessPayment()}
              disabled={!methods.formState.isValid || hasAmountPaidExceeded}>
              {t('processPayment', 'Process Payment')}
            </Button>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default Payments;
