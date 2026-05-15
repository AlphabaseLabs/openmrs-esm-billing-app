import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MetricsCardsLayout, type MetricCardDefinition } from '../../metrics-cards/metrics-cards.component';
import { convertToCurrency } from '../../helpers';
import { type PaymentHistoryMetricsData } from '../billing-history/history.resource';
import { type PaymentHistoryEntry, summarizePaymentHistoryEntries } from './payment-history.utils';

interface PaymentHistoryMetricsProps {
  entries?: Array<PaymentHistoryEntry>;
  metrics?: PaymentHistoryMetricsData;
  isLoading?: boolean;
  error?: unknown;
}

export const PaymentHistoryMetrics = ({
  entries = [],
  metrics,
  isLoading = false,
  error = null,
}: PaymentHistoryMetricsProps) => {
  const { t } = useTranslation();
  const resolvedMetrics = useMemo(() => {
    if (metrics) {
      return {
        totalPayments: convertToCurrency(metrics.totalPayments),
        cash: convertToCurrency(metrics.cash),
        others: convertToCurrency(metrics.others),
        topPayee: metrics.topPayeeName || '--',
        topPayeeAmount: metrics.topPayeeName ? convertToCurrency(metrics.topPayeeAmount) : null,
      };
    }

    const summary = summarizePaymentHistoryEntries(entries);
    return {
      totalPayments: convertToCurrency(summary.totalPayments),
      cash: convertToCurrency(summary.cash),
      others: convertToCurrency(summary.others),
      topPayee: summary.topPayee?.name ?? '--',
      topPayeeAmount: summary.topPayee ? convertToCurrency(summary.topPayee.total) : null,
    };
  }, [entries, metrics]);

  const cards = useMemo<Array<MetricCardDefinition>>(
    () => [
      { title: t('totalPayments', 'Total Payments'), value: resolvedMetrics.totalPayments },
      { title: t('cash', 'Cash'), value: resolvedMetrics.cash },
      { title: t('others', 'Others'), value: resolvedMetrics.others },
      {
        title: t('topPayee', 'Top Payee'),
        value: resolvedMetrics.topPayee,
        secondaryValue: resolvedMetrics.topPayeeAmount,
      },
    ],
    [resolvedMetrics, t],
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
