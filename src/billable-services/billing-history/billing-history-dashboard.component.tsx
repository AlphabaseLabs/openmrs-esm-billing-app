import React, { useMemo } from 'react';
import { Dashboard, CloudMonitoring } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { BillingHistoryFilterProvider, useBillingHistoryFilterContext } from './useBillingHistoryFilterContext';
import { BillingHistoryFilters } from './filters/billing-history-filters.component';
import { BillHistoryViewer } from './bill-history-viewer.component';
import PaymentMethodDistribution from './payment-method-distribution.component';
import MetricsCards from '../../metrics-cards/metrics-cards.component';
import { useBillingHistoryMetrics } from './useBillingHistoryBills';
import { HistoryDashboardShell, type HistoryDashboardTab } from './history-dashboard-shell.component';

const BillingHistoryDashboardContent = () => {
  const { t } = useTranslation();
  const { filters } = useBillingHistoryFilterContext();
  const { metrics, isLoading, error } = useBillingHistoryMetrics(filters);
  const tabs = useMemo<Array<HistoryDashboardTab>>(
    () => [
      {
        id: 'billing-history',
        label: t('billingHistory', 'Billing History'),
        icon: Dashboard,
        content: <BillHistoryViewer />,
      },
      {
        id: 'payment-mode-summary',
        label: t('paymentModeSummary', 'Payment Mode Summary'),
        icon: CloudMonitoring,
        content: <PaymentMethodDistribution paymentMethodTotals={metrics.paymentMethodTotals} isLoading={isLoading} />,
      },
    ],
    [isLoading, metrics.paymentMethodTotals, t],
  );

  return (
    <HistoryDashboardShell
      filters={<BillingHistoryFilters />}
      metrics={<MetricsCards metrics={metrics} isLoading={isLoading} error={error} />}
      tabs={tabs}
      tabsAriaLabel={t('listOfTabs', 'List of tabs on billing history')}
    />
  );
};

export const BillingHistoryDashboard = () => {
  return (
    <BillingHistoryFilterProvider>
      <BillingHistoryDashboardContent />
    </BillingHistoryFilterProvider>
  );
};
