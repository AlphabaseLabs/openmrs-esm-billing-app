import React from 'react';
import BillingHeader from '../billing-header/billing-header.component';
import { useTranslation } from 'react-i18next';
import PaymentModeDashboard from './payment-mode-dashboard.compont';

const PaymentModeHome: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <BillingHeader title={t('paymentModes', 'Payment Modes')} />
      <PaymentModeDashboard />
    </>
  );
};

export default PaymentModeHome;
