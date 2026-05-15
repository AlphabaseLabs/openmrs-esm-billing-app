import React, { useMemo } from 'react';
import { Dashboard, CloudMonitoring } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import {
  BillingHistoryFilterProvider,
  useBillingHistoryFilterContext,
} from '../billing-history/useBillingHistoryFilterContext';
import { BillingHistoryFilters } from '../billing-history/filters/billing-history-filters.component';
import { PaymentEntryHistoryViewer } from './payment-entry-history-viewer.component';
import { PaymentEntryModeSummary } from './payment-entry-mode-summary.component';
import { PaymentHistoryMetrics } from './payment-history-metrics.component';
import { HistoryDashboardShell, type HistoryDashboardTab } from '../billing-history/history-dashboard-shell.component';
import { usePaymentHistoryMetrics } from './usePaymentHistoryEntries';

const PaymentHistoryDashboardContent = () => {
  const { t } = useTranslation();
  const { filters } = useBillingHistoryFilterContext();
  const { metrics, isLoading, error } = usePaymentHistoryMetrics(filters);
  const tabs = useMemo<Array<HistoryDashboardTab>>(
    () => [
      {
        id: 'payment-history',
        label: t('paymentHistory', 'Payment History'),
        icon: Dashboard,
        content: <PaymentEntryHistoryViewer />,
      },
      {
        id: 'payment-mode-summary',
        label: t('paymentModeSummary', 'Payment Mode Summary'),
        icon: CloudMonitoring,
        content: <PaymentEntryModeSummary paymentMethodTotals={metrics.paymentMethodTotals} isLoading={isLoading} />,
      },
    ],
    [isLoading, metrics.paymentMethodTotals, t],
  );

  return (
    <HistoryDashboardShell
      filters={<BillingHistoryFilters />}
      metrics={<PaymentHistoryMetrics metrics={metrics} isLoading={isLoading} error={error} />}
      tabs={tabs}
      tabsAriaLabel={t('listOfTabs', 'List of tabs on payment history')}
    />
  );
};

export const PaymentHistoryDashboard = () => {
  return (
    <BillingHistoryFilterProvider>
      <PaymentHistoryDashboardContent />
    </BillingHistoryFilterProvider>
  );
};
