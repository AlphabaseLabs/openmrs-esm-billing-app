import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { omrsDateFormat } from '../constants';
import BillingHeader from '../billing-header/billing-header.component';
import MetricsCards from '../metrics-cards/metrics-cards.component';
import SelectedDateContext from '../hooks/selectedDateContext';
import styles from './billing-dashboard.scss';

import { ClockOutStrip } from './clock-out-strip.component';
import { UserHasAccess } from '@openmrs/esm-framework';

import BillingTabs from '../billing-tabs/billling-tabs.component';

function BillingDashboard() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().startOf('day').format(omrsDateFormat));

  const params = useParams();

  useEffect(() => {
    if (params.date) {
      setSelectedDate(dayjs(params.date).startOf('day').format(omrsDateFormat));
    }
  }, [params.date]);

  return (
    <SelectedDateContext.Provider value={{ selectedDate, setSelectedDate }}>
      <main className={styles.container}>
        <BillingHeader title={t('home', 'Home')} />
        <ClockOutStrip />
        <UserHasAccess privilege="o3: View Billing Metrics">
          <MetricsCards />
        </UserHasAccess>
        <section className={styles.billsTableContainer}>
          <BillingTabs />
        </section>
      </main>
    </SelectedDateContext.Provider>
  );
}

export default BillingDashboard;
