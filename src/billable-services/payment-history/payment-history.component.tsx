import React from 'react';
import { useTranslation } from 'react-i18next';
import BillingHeader from '../../billing-header/billing-header.component';
import { PaymentHistoryDashboard } from './payment-history-dashboard.component';

interface PaymentHistoryProps {
  showHeader?: boolean;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ showHeader = true }) => {
  const { t } = useTranslation();

  return (
    <div>
      {showHeader ? <BillingHeader title={t('paymentHistory', 'Payment History')} /> : null}
      <PaymentHistoryDashboard />
    </div>
  );
};
