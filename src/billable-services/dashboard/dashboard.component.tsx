import React from 'react';
import { useTranslation } from 'react-i18next';
import BillingHeader from '../../billing-header/billing-header.component';
import ClinicalCharges from '../clinical-charges.component';
import styles from './dashboard.scss';

interface ChargeItemsDashboardProps {
  showHeader?: boolean;
}

export const ChargeItemsDashboard: React.FC<ChargeItemsDashboardProps> = ({ showHeader = true }) => {
  const { t } = useTranslation();

  return (
    <main className={styles.container}>
      {showHeader ? <BillingHeader title={t('chargeItems', 'Charge Items')} /> : null}
      <main className={styles.servicesTableContainer}>
        <ClinicalCharges />
      </main>
    </main>
  );
};
