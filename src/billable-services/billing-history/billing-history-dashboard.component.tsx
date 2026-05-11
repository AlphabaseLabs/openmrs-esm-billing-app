import React from 'react';
import { Dashboard, CloudMonitoring } from '@carbon/react/icons';
import { Tabs, TabList, Tab, TabPanels, TabPanel, Layer } from '@carbon/react';
import styles from './billing-history-dashboard.scss';
import { useTranslation } from 'react-i18next';
import { BillingHistoryFilterProvider, useBillingHistoryFilterContext } from './useBillingHistoryFilterContext';
import { BillingHistoryFilters } from './filters/billing-history-filters.component';
import { BillHistoryViewerContent } from './bill-history-viewer.component';
import PaymentMethodDistribution from './payment-method-distribution.component';
import MetricsCards from '../../metrics-cards/metrics-cards.component';
import { useBillingHistoryBills } from './useBillingHistoryBills';

const BillingHistoryDashboardContent = () => {
  const { t } = useTranslation();
  const { filters } = useBillingHistoryFilterContext();
  const { bills: filteredBills, isLoading, error } = useBillingHistoryBills(filters);

  return (
    <>
      <BillingHistoryFilters />
      <MetricsCards bills={filteredBills} isLoading={isLoading} error={error} />
      <Layer className={styles.paymentDashboard}>
        <Tabs>
          <TabList
            aria-label={t('listOfTabs', 'List of tabs on billing history')}
            className={styles.compactTabList}
            contained>
            <Tab renderIcon={Dashboard}>{t('billingHistory', 'Billing History')}</Tab>
            <Tab renderIcon={CloudMonitoring}>{t('paymentModeSummary', 'Payment Mode Summary')}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <BillHistoryViewerContent bills={filteredBills} isLoading={isLoading} />
            </TabPanel>
            <TabPanel>
              <PaymentMethodDistribution bills={filteredBills} isLoading={isLoading} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Layer>
    </>
  );
};

export const BillingHistoryDashboard = () => {
  return (
    <BillingHistoryFilterProvider>
      <BillingHistoryDashboardContent />
    </BillingHistoryFilterProvider>
  );
};
