import { useMemo } from 'react';
import { convertToCurrency } from '../../helpers';
import { summarizePaymentHistoryEntries, type PaymentHistoryEntry } from './payment-history.utils';

export type PaymentHistoryMetrics = {
  totalPayments: string;
  cash: string;
  others: string;
  topPayee: string;
  topPayeeAmount: string | null;
};

export const usePaymentHistoryMetrics = (entries: Array<PaymentHistoryEntry>): PaymentHistoryMetrics =>
  useMemo(() => {
    const { totalPayments, cash, others, topPayee } = summarizePaymentHistoryEntries(entries);

    return {
      totalPayments: convertToCurrency(totalPayments),
      cash: convertToCurrency(cash),
      others: convertToCurrency(others),
      topPayee: topPayee?.name ?? '--',
      topPayeeAmount: topPayee ? convertToCurrency(topPayee.total) : null,
    };
  }, [entries]);
