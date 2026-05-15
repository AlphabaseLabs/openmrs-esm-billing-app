import { useCallback } from 'react';
import { type Filter } from '../../types';
import {
  fetchBillingHistoryForExport,
  type BillingHistoryRow,
  useBillingHistoryList,
  useBillingHistoryMetrics as useBillingHistoryMetricsResource,
} from './history.resource';
import { useBillingHistoryFilterContext } from './useBillingHistoryFilterContext';

interface UseBillingHistoryBillsOptions {
  page?: number;
  pageSize?: number;
}

export const useBillingHistoryBills = (filters: Filter, options: UseBillingHistoryBillsOptions = {}) => {
  const { dateRange, appliedTimesheet } = useBillingHistoryFilterContext();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 10;
  const listResponse = useBillingHistoryList({
    filters,
    dateRange,
    page,
    pageSize,
    timesheetUuid: appliedTimesheet?.uuid,
  });

  const exportRows = useCallback(
    () =>
      fetchBillingHistoryForExport({
        filters,
        dateRange,
        timesheetUuid: appliedTimesheet?.uuid,
      }),
    [appliedTimesheet?.uuid, dateRange, filters],
  );

  return {
    bills: listResponse.rows,
    totalCount: listResponse.totalCount,
    error: listResponse.error,
    isLoading: listResponse.isLoading,
    isValidating: listResponse.isValidating,
    mutate: listResponse.mutate,
    exportRows,
  };
};

export const useBillingHistoryMetrics = (filters: Filter) => {
  const { dateRange, appliedTimesheet } = useBillingHistoryFilterContext();
  return useBillingHistoryMetricsResource({
    filters,
    dateRange,
    timesheetUuid: appliedTimesheet?.uuid,
  });
};

const matchesSearch = (search: string, ...values: Array<string | number | null | undefined>) => {
  const trimmedSearch = search.trim().toLowerCase();
  if (!trimmedSearch) {
    return true;
  }

  return values.some((value) => `${value ?? ''}`.toLowerCase().includes(trimmedSearch));
};

export const matchesBillingHistoryRowSearch = (row: BillingHistoryRow, search: string) => {
  return matchesSearch(
    search,
    row.dateCreated,
    row.receiptNumber,
    row.patientName,
    row.identifier,
    row.status,
    row.billedItems,
    row.referenceCodes,
  );
};
