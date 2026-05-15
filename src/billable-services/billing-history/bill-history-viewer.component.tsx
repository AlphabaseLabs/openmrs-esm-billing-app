import { ErrorState } from '@openmrs/esm-framework';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EmptyPatientBill from '../../past-patient-bills/patient-bills-dashboard/empty-patient-bill.component';
import { type BillingHistoryRow } from './history.resource';
import { BillHistoryTable } from './bill-history-table.component';
import { HistoryTableSkeleton, type HistoryTableHeader } from './history-table.utils';
import { useBillingHistoryFilterContext } from './useBillingHistoryFilterContext';
import { useBillingHistoryBills } from './useBillingHistoryBills';

interface BillHistoryViewerContentProps {
  rows: Array<BillingHistoryRow>;
  totalCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: unknown;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onExport: (search: string) => Promise<Array<BillingHistoryRow>>;
}

const columnStyles = {
  dateCreated: { inlineSize: '12rem', whiteSpace: 'nowrap' },
  receiptNumber: { inlineSize: '9rem', whiteSpace: 'nowrap' },
  billedItems: { inlineSize: '16rem' },
} as const;

export const BillHistoryViewerContent = ({
  rows,
  totalCount,
  isLoading,
  isRefreshing,
  error,
  page,
  pageSize,
  onPageChange,
  onExport,
}: BillHistoryViewerContentProps) => {
  const { t } = useTranslation();

  const headers = useMemo<Array<HistoryTableHeader>>(
    () => [
      { header: t('billDate', 'Bill date'), key: 'dateCreated' },
      { header: t('invoiceNumberShort', 'Invoice #'), key: 'receiptNumber' },
      { header: t('patientName', 'Patient name'), key: 'patientName' },
      { header: t('identifier', 'Identifier'), key: 'identifier' },
      { header: t('totalAmount', 'Total amount'), key: 'totalAmount' },
      { header: t('billingHistoryTotalDiscount', 'Total discount'), key: 'totalDiscount' },
      { header: t('totalPaid', 'Total paid'), key: 'totalPaid' },
      { header: t('billingHistoryAmountDue', 'Amount due'), key: 'amountDue' },
      { header: t('billingHistoryStatus', 'Status'), key: 'status' },
      { header: t('billingHistoryLineItems', 'Billed items'), key: 'billedItems' },
      { header: t('referenceCodes', 'Reference codes'), key: 'referenceCodes' },
    ],
    [t],
  );

  if (error) {
    return <ErrorState error={error} headerTitle={t('billingHistory', 'Billing History')} />;
  }

  if (isLoading) {
    return (
      <HistoryTableSkeleton
        columnStyles={columnStyles}
        compactWidthKeys={['dateCreated', 'receiptNumber']}
        headers={headers}
        title={t('billingHistory', 'Billing History')}
      />
    );
  }

  if (totalCount === 0) {
    return (
      <EmptyPatientBill
        title={t('noBillingHistory', 'No billing history')}
        subTitle={t('noBillingHistorySubtitle', 'No billing history loaded for the selected filters')}
      />
    );
  }

  return (
    <BillHistoryTable
      headers={headers}
      rows={rows}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      isRefreshing={isRefreshing}
      onPageChange={onPageChange}
      onExport={onExport}
    />
  );
};

export const BillHistoryViewer = () => {
  const { filters, dateRange, appliedTimesheet } = useBillingHistoryFilterContext();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { bills, totalCount, isLoading, isValidating, error, exportRows } = useBillingHistoryBills(filters, {
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
    <BillHistoryViewerContent
      rows={bills}
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
