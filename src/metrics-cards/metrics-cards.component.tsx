import { InlineLoading, Layer, Tile } from '@carbon/react';
import { ErrorState } from '@openmrs/esm-patient-common-lib';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { convertToCurrency } from '../helpers';
import { type MappedBill } from '../types';
import { type BillingHistoryMetricsData } from '../billable-services/billing-history/history.resource';
import styles from './metrics-cards.scss';
import { useBillMetrics } from './metrics.resource';

export interface MetricCardDefinition {
  title: string;
  value: string;
  secondaryValue?: string | null;
}

interface MetricsCardsProps {
  bills?: Array<MappedBill>;
  metrics?: BillingHistoryMetricsData;
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

type ResolvedBillingMetrics = {
  totalBills: string;
  pendingBills: string;
  totalPayments: string;
  exemptedBills: string;
  totalDiscount: string;
  waivedBills: string;
  exemptedAmount: number;
  waivedAmount: number;
  taxCollection: string;
  taxCollectionAmount: number;
};

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
        <Layer key={card.title} className={styles.cardContainer}>
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

export default function MetricsCards({ bills = [], metrics, isLoading = false, error = null }: MetricsCardsProps) {
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

  const resolvedMetrics = useMemo<ResolvedBillingMetrics>(() => {
    if (metrics) {
      return {
        totalBills: convertToCurrency(metrics.totalBills),
        pendingBills: convertToCurrency(metrics.totalDue),
        totalPayments: convertToCurrency(metrics.totalPayments),
        exemptedBills: convertToCurrency(metrics.exemptedAmount),
        totalDiscount: convertToCurrency(metrics.totalDiscount),
        waivedBills: convertToCurrency(metrics.waivedAmount),
        exemptedAmount: metrics.exemptedAmount,
        waivedAmount: metrics.waivedAmount,
        taxCollection: convertToCurrency(metrics.taxCollectionAmount),
        taxCollectionAmount: metrics.taxCollectionAmount,
      };
    }

    return {
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
    };
  }, [
    exemptedAmount,
    exemptedBills,
    metrics,
    pendingBills,
    taxCollection,
    taxCollectionAmount,
    totalBills,
    totalDiscount,
    totalPayments,
    waivedAmount,
    waivedBills,
  ]);

  const cards = useMemo(() => {
    const allCards: Array<MetricCardDefinition> = [
      { title: t('totalBills', 'Total Bills'), value: resolvedMetrics.totalBills },
      { title: t('totalPayments', 'Total Payments'), value: resolvedMetrics.totalPayments },
      { title: t('totalDue', 'Total Due'), value: resolvedMetrics.pendingBills },
      { title: t('totalDiscount', 'Total Discount'), value: resolvedMetrics.totalDiscount },
    ];

    if (resolvedMetrics.waivedAmount > 0) {
      allCards.push({ title: t('waivedBills', 'Waived Bills'), value: resolvedMetrics.waivedBills });
    }

    if (resolvedMetrics.exemptedAmount > 0) {
      allCards.push({
        title: t('exemptedBills', 'Exempted Bills'),
        value: resolvedMetrics.exemptedBills,
      });
    }

    if (resolvedMetrics.taxCollectionAmount > 0) {
      allCards.push({
        title: t('taxCollection', 'Tax Collection'),
        value: resolvedMetrics.taxCollection,
      });
    }

    return allCards;
  }, [resolvedMetrics, t]);

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
