import { useCallback } from 'react';
import { type Filter } from '../../types';
import {
  fetchPaymentHistoryForExport,
  type PaymentHistoryEntry,
  usePaymentHistoryList,
  usePaymentHistoryMetrics as usePaymentHistoryMetricsResource,
} from '../billing-history/history.resource';
import { useBillingHistoryFilterContext } from '../billing-history/useBillingHistoryFilterContext';

interface UsePaymentHistoryEntriesOptions {
  page?: number;
  pageSize?: number;
}

export const usePaymentHistoryEntries = (filters: Filter, options: UsePaymentHistoryEntriesOptions = {}) => {
  const { dateRange, appliedTimesheet } = useBillingHistoryFilterContext();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 10;
  const listResponse = usePaymentHistoryList({
    filters,
    dateRange,
    page,
    pageSize,
    timesheetUuid: appliedTimesheet?.uuid,
  });

  const exportRows = useCallback(
    () =>
      fetchPaymentHistoryForExport({
        filters,
        dateRange,
        timesheetUuid: appliedTimesheet?.uuid,
      }),
    [appliedTimesheet?.uuid, dateRange, filters],
  );

  return {
    entries: listResponse.entries,
    totalCount: listResponse.totalCount,
    error: listResponse.error,
    isLoading: listResponse.isLoading,
    isValidating: listResponse.isValidating,
    mutate: listResponse.mutate,
    exportRows,
  };
};

export const usePaymentHistoryMetrics = (filters: Filter) => {
  const { dateRange, appliedTimesheet } = useBillingHistoryFilterContext();
  return usePaymentHistoryMetricsResource({
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

export const matchesPaymentHistoryEntrySearch = (entry: PaymentHistoryEntry, search: string) => {
  return matchesSearch(
    search,
    entry.paymentDate,
    entry.patientName,
    entry.identifier,
    entry.invoiceId,
    entry.paymentMethod,
    entry.referenceId,
    `${entry.paymentAmount ?? ''}`,
  );
};
