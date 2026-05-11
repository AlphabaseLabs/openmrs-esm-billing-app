import React from 'react';
import { Dashboard, CloudMonitoring } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import {
  BillingHistoryFilterProvider,
  useBillingHistoryFilterContext,
} from '../billing-history/useBillingHistoryFilterContext';
import { BillingHistoryFilters } from '../billing-history/filters/billing-history-filters.component';
import { PaymentEntryHistoryViewerContent } from './payment-entry-history-viewer.component';
import { PaymentEntryModeSummary } from './payment-entry-mode-summary.component';
import { PaymentHistoryMetrics } from './payment-history-metrics.component';
import { usePaymentHistoryEntries } from './usePaymentHistoryEntries';
import { HistoryDashboardShell, type HistoryDashboardTab } from '../billing-history/history-dashboard-shell.component';

const PaymentHistoryDashboardContent = () => {
  const { t } = useTranslation();
  const { filters } = useBillingHistoryFilterContext();
  const { entries, isLoading, error } = usePaymentHistoryEntries(filters);
  const tabs = React.useMemo<Array<HistoryDashboardTab>>(
    () => [
      {
        id: 'payment-history',
        label: t('paymentHistory', 'Payment History'),
        icon: Dashboard,
        content: <PaymentEntryHistoryViewerContent entries={entries} isLoading={isLoading} error={error} />,
      },
      {
        id: 'payment-mode-summary',
        label: t('paymentModeSummary', 'Payment Mode Summary'),
        icon: CloudMonitoring,
        content: <PaymentEntryModeSummary entries={entries} isLoading={isLoading} />,
      },
    ],
    [entries, error, isLoading, t],
  );

  return (
    <HistoryDashboardShell
      filters={<BillingHistoryFilters dateFilterSource="payment" />}
      metrics={<PaymentHistoryMetrics entries={entries} isLoading={isLoading} error={error} />}
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
