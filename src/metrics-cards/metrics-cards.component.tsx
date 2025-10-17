import { InlineLoading, Layer, Tile } from '@carbon/react';
import { ErrorState } from '@openmrs/esm-patient-common-lib';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBills } from '../billing.resource';
import SelectedDateContext from '../hooks/selectedDateContext';
import styles from './metrics-cards.scss';
import { useBillMetrics } from './metrics.resource';

export default function MetricsCards() {
  const { t } = useTranslation();
  const { selectedDate } = useContext(SelectedDateContext);

  // Convert selectedDate string to Date objects for start and end of day
  const startDate = dayjs(selectedDate).startOf('day').toDate();
  const endDate = dayjs(selectedDate).endOf('day').toDate();

  const { bills, isLoading, error } = useBills('', '', startDate, endDate);
  const { totalBills, pendingBills, paidBills, exemptedBills } = useBillMetrics(bills);

  const cards = useMemo(
    () => [
      { title: t('todayTotalBills', "Today's Total Bills"), count: totalBills },
      { title: t('todayPaidBills', "Today's Paid Bills"), count: paidBills },
      { title: t('todayPendingBills', "Today's Pending Bills"), count: pendingBills },
      { title: t('todayExemptedBills', "Today's Exempted Bills"), count: exemptedBills },
    ],
    [totalBills, paidBills, pendingBills, exemptedBills, t],
  );

  if (isLoading) {
    return (
      <section className={styles.container}>
        <InlineLoading
          status="active"
          iconDescription="Loading"
          description={t('loadingBillMetrics', 'Loading bill metrics...')}
        />
      </section>
    );
  }

  if (error) {
    return <ErrorState headerTitle={t('billMetrics', 'Bill metrics')} error={error} />;
  }
  return (
    <section className={styles.container}>
      {cards.map((card) => (
        <Layer key={card.title} className={classNames(styles.cardContainer)}>
          <Tile className={styles.tileContainer}>
            <div className={styles.tileHeader}>
              <div className={styles.headerLabelContainer}>
                <label className={styles.headerLabel}>{card.title}</label>
              </div>
            </div>
            <div>
              <p className={styles.totalsValue}>{card.count}</p>
            </div>
          </Tile>
        </Layer>
      ))}
    </section>
  );
}
