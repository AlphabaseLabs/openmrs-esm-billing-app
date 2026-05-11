import React from 'react';
import { useTranslation } from 'react-i18next';
import BillingHeader from '../../billing-header/billing-header.component';
import { BillingHistoryDashboard } from './billing-history-dashboard.component';

interface BillingHistoryProps {
  showHeader?: boolean;
}

export const BillingHistory: React.FC<BillingHistoryProps> = ({ showHeader = true }) => {
  const { t } = useTranslation();

  return (
    <div>
      {showHeader ? <BillingHeader title={t('billingHistory', 'Billing History')} /> : null}
      <BillingHistoryDashboard />
    </div>
  );
};
