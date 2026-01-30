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
  const { totalBills, pendingBills, paidBills, exemptedBills, waivedBills, exemptedAmount, taxCollection, taxCollectionAmount } =
    useBillMetrics(bills);

  const isToday = dayjs(selectedDate).isSame(dayjs(), 'day');
  const prefix = isToday ? "Today's " : '';

  const cards = useMemo(() => {
    const allCards = [
      { title: `${prefix}${t('totalBills', 'Total Bills')}`, count: totalBills },
      { title: `${prefix}${t('pendingBills', 'Pending Bills')}`, count: pendingBills },
      { title: `${prefix}${t('paidBills', 'Collection')}`, count: paidBills },
      { title: `${prefix}${t('waivedBills', 'Waived/Discounts Bills')}`, count: waivedBills },
    ];

    // Only show exempted bills if the amount is greater than 0
    if (exemptedAmount > 0) {
      allCards.push({
        title: `${prefix}${t('exemptedBills', 'Exempted Bills')}`,
        count: exemptedBills,
      });
    }

    // Only show tax collection if the amount is greater than 0
    if (taxCollectionAmount > 0) {
      allCards.push({
        title: `${prefix}${t('taxCollection', 'Tax Collection')}`,
        count: taxCollection,
      });
    }

    return allCards;
  }, [
    totalBills,
    paidBills,
    pendingBills,
    waivedBills,
    exemptedBills,
    exemptedAmount,
    taxCollection,
    taxCollectionAmount,
    prefix,
    t,
  ]);

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
