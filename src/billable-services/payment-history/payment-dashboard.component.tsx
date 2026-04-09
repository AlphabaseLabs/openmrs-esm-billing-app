import React from 'react';
import { Dashboard, CloudMonitoring } from '@carbon/react/icons';
import { Tabs, TabList, Tab, TabPanels, TabPanel, Layer } from '@carbon/react';
import styles from './payment-dashboard.scss';
import { useTranslation } from 'react-i18next';
import { PaymentFilterProvider, usePaymentFilterContext } from './usePaymentFilterContext';
import { PaymentFilters } from './filters/payment-filters.component';
import { PaymentHistoryViewerContent } from './payment-history-viewer.component';
import PaymentMethodDistribution from './payment-method-distribution.component';
import MetricsCards from '../../metrics-cards/metrics-cards.component';
import { usePaymentTransactionHistory } from './usePaymentTransactionHistory';

const PaymentDashboardContent = () => {
  const { t } = useTranslation();
  const { filters } = usePaymentFilterContext();
  const { bills: filteredBills, isLoading, error } = usePaymentTransactionHistory(filters);

  return (
    <>
      <PaymentFilters />
      <MetricsCards bills={filteredBills} isLoading={isLoading} error={error} />
      <Layer className={styles.paymentDashboard}>
        <Tabs>
          <TabList
            aria-label={t('listOfTabs', 'List of tabs on transactions')}
            className={styles.compactTabList}
            contained>
            <Tab renderIcon={Dashboard}>{t('transactionHistory', 'Transaction History')}</Tab>
            <Tab renderIcon={CloudMonitoring}>{t('paymentModeSummary', 'Payment Mode Summary')}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <PaymentHistoryViewerContent bills={filteredBills} isLoading={isLoading} />
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

export const PaymentDashboard = () => {
  return (
    <PaymentFilterProvider>
      <PaymentDashboardContent />
    </PaymentFilterProvider>
  );
};
