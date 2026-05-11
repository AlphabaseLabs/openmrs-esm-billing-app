import React from 'react';
import { Dashboard, CloudMonitoring } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { BillingHistoryFilterProvider, useBillingHistoryFilterContext } from './useBillingHistoryFilterContext';
import { BillingHistoryFilters } from './filters/billing-history-filters.component';
import { BillHistoryViewerContent } from './bill-history-viewer.component';
import PaymentMethodDistribution from './payment-method-distribution.component';
import MetricsCards from '../../metrics-cards/metrics-cards.component';
import { useBillingHistoryBills } from './useBillingHistoryBills';
import { HistoryDashboardShell, type HistoryDashboardTab } from './history-dashboard-shell.component';

const BillingHistoryDashboardContent = () => {
  const { t } = useTranslation();
  const { filters } = useBillingHistoryFilterContext();
  const { bills: filteredBills, isLoading, error } = useBillingHistoryBills(filters);
  const tabs = React.useMemo<Array<HistoryDashboardTab>>(
    () => [
      {
        id: 'billing-history',
        label: t('billingHistory', 'Billing History'),
        icon: Dashboard,
        content: <BillHistoryViewerContent bills={filteredBills} isLoading={isLoading} />,
      },
      {
        id: 'payment-mode-summary',
        label: t('paymentModeSummary', 'Payment Mode Summary'),
        icon: CloudMonitoring,
        content: <PaymentMethodDistribution bills={filteredBills} isLoading={isLoading} />,
      },
    ],
    [filteredBills, isLoading, t],
  );

  return (
    <HistoryDashboardShell
      filters={<BillingHistoryFilters />}
      metrics={<MetricsCards bills={filteredBills} isLoading={isLoading} error={error} />}
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
