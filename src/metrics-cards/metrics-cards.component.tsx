import { InlineLoading, Layer, Tile } from '@carbon/react';
import { ErrorState } from '@openmrs/esm-patient-common-lib';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type MappedBill } from '../types';
import styles from './metrics-cards.scss';
import { useBillMetrics } from './metrics.resource';

interface MetricsCardsProps {
  bills: Array<MappedBill>;
  isLoading?: boolean;
  error?: unknown;
}

export default function MetricsCards({ bills, isLoading = false, error = null }: MetricsCardsProps) {
  const { t } = useTranslation();
  const {
    totalBills,
    pendingBills,
    totalPayments,
    exemptedBills,
    totalDiscount,
    waivedBills,
    exemptedAmount,
    waivedAmount,
    taxCollection,
    taxCollectionAmount,
  } = useBillMetrics(bills);

  const cards = useMemo(() => {
    const allCards = [
      { title: t('totalBills', 'Total Bills'), count: totalBills },
      { title: t('totalPayments', 'Total Payments'), count: totalPayments },
      { title: t('totalDue', 'Total Due'), count: pendingBills },
      { title: t('totalDiscount', 'Total Discount'), count: totalDiscount },
    ];

    if (waivedAmount > 0) {
      allCards.push({ title: t('waivedBills', 'Waived Bills'), count: waivedBills });
    }

    // Only show exempted bills if the amount is greater than 0
    if (exemptedAmount > 0) {
      allCards.push({
        title: t('exemptedBills', 'Exempted Bills'),
        count: exemptedBills,
      });
    }

    // Only show tax collection if the amount is greater than 0
    if (taxCollectionAmount > 0) {
      allCards.push({
        title: t('taxCollection', 'Tax Collection'),
        count: taxCollection,
      });
    }

    return allCards;
  }, [
    totalBills,
    totalPayments,
    pendingBills,
    totalDiscount,
    waivedBills,
    exemptedBills,
    exemptedAmount,
    waivedAmount,
    taxCollection,
    taxCollectionAmount,
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
