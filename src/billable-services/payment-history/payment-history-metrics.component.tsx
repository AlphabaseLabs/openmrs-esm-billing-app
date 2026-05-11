import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MetricsCardsLayout, type MetricCardDefinition } from '../../metrics-cards/metrics-cards.component';
import { type PaymentHistoryEntry } from './payment-history.utils';
import { usePaymentHistoryMetrics } from './payment-history-metrics.resource';

interface PaymentHistoryMetricsProps {
  entries: Array<PaymentHistoryEntry>;
  isLoading?: boolean;
  error?: unknown;
}

export const PaymentHistoryMetrics = ({ entries, isLoading = false, error = null }: PaymentHistoryMetricsProps) => {
  const { t } = useTranslation();
  const { totalPayments, cash, others, topPayee, topPayeeAmount } = usePaymentHistoryMetrics(entries);

  const cards = useMemo<Array<MetricCardDefinition>>(
    () => [
      { title: t('totalPayments', 'Total Payments'), value: totalPayments },
      { title: t('cash', 'Cash'), value: cash },
      { title: t('others', 'Others'), value: others },
      { title: t('topPayee', 'Top Payee'), value: topPayee, secondaryValue: topPayeeAmount },
    ],
    [cash, others, t, topPayee, topPayeeAmount, totalPayments],
  );

  return (
    <MetricsCardsLayout
      cards={cards}
      isLoading={isLoading}
      error={error}
      loadingDescription={t('loadingPaymentMetrics', 'Loading payment metrics...')}
      errorHeaderTitle={t('paymentMetrics', 'Payment metrics')}
    />
  );
};
