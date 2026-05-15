import { ErrorState } from '@openmrs/esm-framework';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EmptyPatientBill from '../../past-patient-bills/patient-bills-dashboard/empty-patient-bill.component';
import { type PaymentHistoryEntry } from '../billing-history/history.resource';
import { HistoryTableSkeleton, type HistoryTableHeader } from '../billing-history/history-table.utils';
import { PaymentEntryHistoryTable } from './payment-entry-history-table.component';
import { useBillingHistoryFilterContext } from '../billing-history/useBillingHistoryFilterContext';
import { usePaymentHistoryEntries } from './usePaymentHistoryEntries';

interface PaymentEntryHistoryViewerContentProps {
  entries: Array<PaymentHistoryEntry>;
  totalCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: unknown;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onExport: (search: string) => Promise<Array<PaymentHistoryEntry>>;
}

const columnStyles = {
  paymentDate: { inlineSize: '12rem', whiteSpace: 'nowrap' },
  invoiceId: { inlineSize: '9rem', whiteSpace: 'nowrap' },
  paymentAmount: { inlineSize: '9rem', whiteSpace: 'nowrap' },
} as const;

export const PaymentEntryHistoryViewerContent = ({
  entries,
  totalCount,
  isLoading,
  isRefreshing,
  error,
  page,
  pageSize,
  onPageChange,
  onExport,
}: PaymentEntryHistoryViewerContentProps) => {
  const { t } = useTranslation();

  const headers = useMemo<Array<HistoryTableHeader>>(
    () => [
      { header: t('paymentDate', 'Payment date'), key: 'paymentDate' },
      { header: t('invoiceNumberShort', 'Invoice #'), key: 'invoiceId' },
      { header: t('patientName', 'Patient name'), key: 'patientName' },
      { header: t('identifier', 'Identifier'), key: 'identifier' },
      { header: t('paymentAmount', 'Payment amount'), key: 'paymentAmount' },
      { header: t('paymentMethod', 'Payment method'), key: 'paymentMethod' },
      { header: t('referenceCodes', 'Reference codes'), key: 'referenceId' },
    ],
    [t],
  );

  if (error) {
    return <ErrorState error={error} headerTitle={t('paymentHistory', 'Payment History')} />;
  }

  if (isLoading) {
    return (
      <HistoryTableSkeleton
        columnStyles={columnStyles}
        compactWidthKeys={['paymentDate', 'invoiceId']}
        headers={headers}
        title={t('paymentHistory', 'Payment History')}
      />
    );
  }

  if (totalCount === 0) {
    return (
      <EmptyPatientBill
        title={t('noPaymentHistory', 'No payment history')}
        subTitle={t('noPaymentHistorySubtitle', 'No payment history loaded for the selected filters')}
      />
    );
  }

  return (
    <PaymentEntryHistoryTable
      headers={headers}
      rows={entries}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      isRefreshing={isRefreshing}
      onPageChange={onPageChange}
      onExport={onExport}
    />
  );
};

export const PaymentEntryHistoryViewer = () => {
  const { filters, dateRange, appliedTimesheet } = useBillingHistoryFilterContext();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { entries, totalCount, isLoading, isValidating, error, exportRows } = usePaymentHistoryEntries(filters, {
    page,
    pageSize,
  });

  useEffect(() => {
    setPage(1);
  }, [appliedTimesheet?.uuid, dateRange, filters]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, pageSize, totalCount]);

  return (
    <PaymentEntryHistoryViewerContent
      entries={entries}
      totalCount={totalCount}
      isLoading={isLoading}
      isRefreshing={isValidating}
      error={error}
      page={page}
      pageSize={pageSize}
      onPageChange={(nextPage, nextPageSize) => {
        setPage(nextPage);
        setPageSize(nextPageSize);
      }}
      onExport={exportRows}
    />
  );
};
