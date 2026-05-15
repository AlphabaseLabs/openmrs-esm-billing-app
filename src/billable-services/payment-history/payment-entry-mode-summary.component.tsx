import React, { useMemo } from 'react';
import { type PaymentMethodTotal } from '../billing-history/history.resource';
import { summarizePaymentHistoryEntries, type PaymentHistoryEntry } from './payment-history.utils';
import { PaymentMethodSummaryTable } from '../billing-history/payment-method-summary-table.component';

interface PaymentEntryModeSummaryProps {
  entries?: Array<PaymentHistoryEntry>;
  paymentMethodTotals?: Array<PaymentMethodTotal>;
  isLoading: boolean;
}

export const PaymentEntryModeSummary = ({
  entries = [],
  paymentMethodTotals,
  isLoading,
}: PaymentEntryModeSummaryProps) => {
  const resolvedTotals = useMemo(
    () => paymentMethodTotals ?? summarizePaymentHistoryEntries(entries).paymentMethodTotals,
    [entries, paymentMethodTotals],
  );

  return <PaymentMethodSummaryTable isLoading={isLoading} paymentMethodTotals={resolvedTotals} />;
};
