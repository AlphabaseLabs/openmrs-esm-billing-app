import React from 'react';
import { Button, InlineNotification } from '@carbon/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { navigate, showSnackbar, useConfig } from '@openmrs/esm-framework';
import { CardHeader } from '@openmrs/esm-patient-common-lib';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { mutate } from 'swr';
import { z } from 'zod';
import { processBillPayment } from '../../billing.resource';
import { processPaymentMethodTaxExpenses } from '../../accounting.resource';
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
import { type BillingConfig } from '../../config-schema';

type PaymentProps = {
  bill: MappedBill;
  selectedLineItems: Array<LineItem>;
};

const Payments: React.FC<PaymentProps> = ({ bill, selectedLineItems }) => {
  const { t } = useTranslation();
  const { paymentMethodTaxes } = useConfig<BillingConfig>();
  const paymentSchema = usePaymentSchema(bill);
  const { globalActiveSheet } = useClockInStatus();

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
  const amountDue = bill.balance;

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
    navigate({
      to: window.getOpenmrsSpaBase() + 'home/billing',
    });

  const handleProcessPayment = () => {
    const paymentPayload = createPaymentPayload(
      bill,
      bill.patientUuid,
      formValues,
      amountDue,
      selectedLineItems,
      globalActiveSheet,
    );

    processBillPayment(paymentPayload, bill.uuid).then(
      (resp) => {
        showSnackbar({
          title: t('billPayment', 'Bill payment'),
          subtitle: 'Bill payment processing has been successful',
          kind: 'success',
          timeoutInMs: 3000,
        });

        // Create allocation-based payment method tax expenses (if configured)
        const updatedBill = resp?.data;
        if (paymentMethodTaxes?.enabled && updatedBill?.payments) {
          processPaymentMethodTaxExpenses({
            previousBill: { uuid: bill.uuid, id: bill.id, payments: bill.payments ?? [] },
            updatedBill: { uuid: bill.uuid, id: updatedBill?.id ?? bill.id, payments: updatedBill?.payments ?? [] },
            paymentMethodTaxes,
          }).catch((err) => {
            showSnackbar({
              title: t('paymentTaxAccountingWarning', 'Payment tax accounting warning'),
              kind: 'warning',
              subtitle:
                err?.message ??
                t(
                  'paymentTaxAccountingWarningSubtitle',
                  'Payment completed, but an error occurred while posting payment tax expenses.',
                ),
              timeoutInMs: 5000,
            });
          });
        }

        const url = `/ws/rest/v1/cashier/bill/${bill.uuid}`;
        mutate((key) => typeof key === 'string' && key.startsWith(url), undefined, { revalidate: true });
        methods.reset({ payment: [{ method: null, amount: undefined, referenceCode: '' }] });
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

  const isFullyPaid = !hasSelectedUnpaidLineItems || totalNewPayments >= selectedLineItemsAmountDue;
  const hasAmountPaidExceeded = bill.balance > 0 && formValues.some((item) => Number(item.amount) > bill.balance);
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
            label={t('subtotal', 'Subtotal')}
            value={convertToCurrency(bill.totalAmountWithoutTaxAndDiscount)}
          />
          <InvoiceBreakDown
            label={t('totalDiscounts', 'Total Discounts')}
            value={convertToCurrency(bill.totalDiscounts)}
          />
          <InvoiceBreakDown label={t('totalTaxes', 'Total Taxes')} value={convertToCurrency(bill.totalTax)} />
          <InvoiceBreakDown label={t('totalAmount', 'Total Amount')} value={convertToCurrency(bill.totalAmount)} />
          {bill.totalDeposits > 0 && (
            <InvoiceBreakDown
              label={t('totalDeposits', 'Total Deposits')}
              value={convertToCurrency(bill.totalDeposits)}
            />
          )}
          <InvoiceBreakDown
            label={t('totalTendered', 'Total Tendered')}
            value={convertToCurrency(bill.totalActualPayments)}
          />
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
                1. No payment rows (not applicable with the default row)
                2. Form invalid: usePaymentSchema validates each row (method required, amount > 0 and amount <= bill.balance per row, referenceCode when method requires it)
                3. Overpayment: any single row has amount > bill.balance (hasAmountPaidExceeded) */}
            <Button
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
