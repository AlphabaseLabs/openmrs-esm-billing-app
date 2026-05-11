import { InlineLoading, Layer, Tile } from '@carbon/react';
import { ErrorState } from '@openmrs/esm-patient-common-lib';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type MappedBill } from '../types';
import styles from './metrics-cards.scss';
import { useBillMetrics } from './metrics.resource';

export interface MetricCardDefinition {
  title: string;
  value: string;
  secondaryValue?: string | null;
}

interface MetricsCardsProps {
  bills: Array<MappedBill>;
  isLoading?: boolean;
  error?: unknown;
}

interface MetricsCardsLayoutProps {
  cards: Array<MetricCardDefinition>;
  isLoading?: boolean;
  error?: unknown;
  loadingDescription: string;
  errorHeaderTitle: string;
}

export const MetricsCardsLayout = ({
  cards,
  isLoading = false,
  error = null,
  loadingDescription,
  errorHeaderTitle,
}: MetricsCardsLayoutProps) => {
  if (isLoading) {
    return (
      <section className={styles.container}>
        <InlineLoading status="active" iconDescription="Loading" description={loadingDescription} />
      </section>
    );
  }

  if (error) {
    return <ErrorState headerTitle={errorHeaderTitle} error={error} />;
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
              <p className={styles.totalsValue}>{card.value}</p>
              {card.secondaryValue ? <p className={styles.totalsLabel}>{card.secondaryValue}</p> : null}
            </div>
          </Tile>
        </Layer>
      ))}
    </section>
  );
};

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
    const allCards: Array<MetricCardDefinition> = [
      { title: t('totalBills', 'Total Bills'), value: totalBills },
      { title: t('totalPayments', 'Total Payments'), value: totalPayments },
      { title: t('totalDue', 'Total Due'), value: pendingBills },
      { title: t('totalDiscount', 'Total Discount'), value: totalDiscount },
    ];

    if (waivedAmount > 0) {
      allCards.push({ title: t('waivedBills', 'Waived Bills'), value: waivedBills });
    }

    if (exemptedAmount > 0) {
      allCards.push({
        title: t('exemptedBills', 'Exempted Bills'),
        value: exemptedBills,
      });
    }

    if (taxCollectionAmount > 0) {
      allCards.push({
        title: t('taxCollection', 'Tax Collection'),
        value: taxCollection,
      });
    }

    return allCards;
  }, [
    exemptedAmount,
    exemptedBills,
    pendingBills,
    t,
    taxCollection,
    taxCollectionAmount,
    totalBills,
    totalDiscount,
    totalPayments,
    waivedAmount,
    waivedBills,
  ]);

  return (
    <MetricsCardsLayout
      cards={cards}
      isLoading={isLoading}
      error={error}
      loadingDescription={t('loadingBillMetrics', 'Loading bill metrics...')}
      errorHeaderTitle={t('billMetrics', 'Bill metrics')}
    />
  );
}
