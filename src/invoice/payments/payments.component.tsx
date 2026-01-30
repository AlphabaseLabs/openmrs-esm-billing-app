import React from 'react';
import { Button, InlineNotification } from '@carbon/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { navigate, showSnackbar } from '@openmrs/esm-framework';
import { CardHeader } from '@openmrs/esm-patient-common-lib';
import { FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { mutate } from 'swr';
import { z } from 'zod';
import { processBillPayment } from '../../billing.resource';
import { convertToCurrency } from '../../helpers';
import { useClockInStatus } from '../../payment-points/use-clock-in-status';
import { type LineItem, type PaymentFormValue, PaymentStatus, type MappedBill } from '../../types';
import { extractErrorMessagesFromResponse } from '../../utils';
import { InvoiceBreakDown } from './invoice-breakdown/invoice-breakdown.component';
import PaymentForm from './payment-form/payment-form.component';
import PaymentHistory from './payment-history/payment-history.component';
import styles from './payments.scss';
import { createPaymentPayload } from './utils';
import { usePaymentSchema } from '../../hooks/usePaymentSchema';

type PaymentProps = {
  bill: MappedBill;
  selectedLineItems: Array<LineItem>;
};

const Payments: React.FC<PaymentProps> = ({ bill, selectedLineItems }) => {
  const { t } = useTranslation();
  const paymentSchema = usePaymentSchema(bill);
  const { globalActiveSheet } = useClockInStatus();

  const methods = useForm<PaymentFormValue>({
    mode: 'onSubmit',
    defaultValues: { payment: [] },
    resolver: zodResolver(z.object({ payment: z.array(paymentSchema) })),
  });

  const formArrayMethods = useFieldArray({ name: 'payment', control: methods.control });

  const formValues = useWatch({
    name: 'payment',
    control: methods.control,
  });

  // const totalAmountTendered = bill.tenderedAmount;
  const totalAmountTendered = formValues?.reduce((curr: number, prev) => Number(prev.amount) + curr, 0) ?? 0;
  const amountDue = bill.balance;

  // selected line items amount due
  const selectedLineItemsAmountDue =
    selectedLineItems
      .filter((item) => item.paymentStatus !== PaymentStatus.PAID)
      .reduce((curr: number, prev) => curr + Number(prev.price * prev.quantity) +
        Number(prev.taxes?.reduce((acc, tax) => acc + tax.amount, 0) -
          Number(prev.discounts?.reduce((acc, discount) => acc + discount.amount, 0))), 0);

  const handleNavigateToBillingDashboard = () =>
    navigate({
      to: window.getOpenmrsSpaBase() + 'home/billing',
    });

  const handleProcessPayment = () => {
    const { remove } = formArrayMethods;
    const paymentPayload = createPaymentPayload(
      bill,
      bill.patientUuid,
      formValues,
      amountDue,
      selectedLineItems,
      globalActiveSheet,
    );
    remove();

    processBillPayment(paymentPayload, bill.uuid).then(
      (resp) => {
        showSnackbar({
          title: t('billPayment', 'Bill payment'),
          subtitle: 'Bill payment processing has been successful',
          kind: 'success',
          timeoutInMs: 3000,
        });
        const url = `/ws/rest/v1/cashier/bill/${bill.uuid}`;
        mutate((key) => typeof key === 'string' && key.startsWith(url), undefined, { revalidate: true });
      },
      (error) => {
        showSnackbar({
          title: t('failedBillPayment', 'Bill payment failed'),
          subtitle: `An unexpected error occurred while processing your bill payment. Please contact the system administrator and provide them with the following error details: ${extractErrorMessagesFromResponse(
            error.responseBody,
          )}`,
          kind: 'error',
          timeoutInMs: 3000,
          isLowContrast: true,
        });
      },
    );
  };

  const amountDueDisplay = (amount: number) => (amount < 0 ? 'Client balance' : 'Amount Due');

  const isFullyPaid = totalAmountTendered >= selectedLineItemsAmountDue;
  const hasAmountPaidExceeded =
    bill.balance > 0 && formValues.some((item) => Number(item.amount) > bill.balance);

  const isPaymentInvalid = !isFullyPaid && formValues.some((item) => item.amount !== 0) && bill.lineItems.length > 1;

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
                  'Amount paid {{totalAmountTendered}} should not be greater than amount due {{amountDue}} for selected line items',
                  {
                    totalAmountTendered: convertToCurrency(totalAmountTendered),
                    selectedLineItemsAmountDue: convertToCurrency(selectedLineItemsAmountDue),
                  },
                )}
                lowContrast
                kind="warning"
                className={styles.paymentError}
              />
            )}
            <PaymentForm {...formArrayMethods} disablePayment={amountDue <= 0} amountDue={amountDue} />
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.paymentTotals}>
          <InvoiceBreakDown label={t('subtotal', 'Subtotal')} value={convertToCurrency(bill.totalAmountWithoutTaxAndDiscount)} />
          <InvoiceBreakDown label={t('totalDiscounts', 'Total Discounts')} value={convertToCurrency(bill.totalDiscounts)} />
          <InvoiceBreakDown label={t('totalTaxes', 'Total Taxes')} value={convertToCurrency(bill.totalTax)} />
          <InvoiceBreakDown label={t('totalAmount', 'Total Amount')} value={convertToCurrency(bill.totalAmount)} />
          {bill.totalDeposits > 0 && <InvoiceBreakDown label={t('totalDeposits', 'Total Deposits')} value={convertToCurrency(bill.totalDeposits)} />}
          <InvoiceBreakDown label={t('totalTendered', 'Total Tendered')} value={convertToCurrency(bill.tenderedAmount + totalAmountTendered)} />
          <InvoiceBreakDown
            hasBalance={amountDue < 0}
            label={amountDueDisplay(amountDue)}
            value={convertToCurrency(amountDue)}
          />
          <div className={styles.processPayments}>
            <Button onClick={handleNavigateToBillingDashboard} kind="secondary">
              {t('discard', 'Discard')}
            </Button>
            {/* Process Payment is disabled when ANY of these are true:
                1. No payment rows (formValues empty)
                2. Form invalid: usePaymentSchema validates each row (method required, amount > 0 and amount <= bill.balance per row, referenceCode when method requires it)
                3. Overpayment: any single row has amount > bill.balance (hasAmountPaidExceeded) */}
            <Button
              onClick={() => handleProcessPayment()}
              disabled={!formValues?.length || !methods.formState.isValid || hasAmountPaidExceeded}>
              {t('processPayment', 'Process Payment')}
            </Button>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default Payments;
