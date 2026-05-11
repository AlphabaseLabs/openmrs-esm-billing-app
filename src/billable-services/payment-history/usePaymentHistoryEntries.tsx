import dayjs from 'dayjs';
import { useMemo } from 'react';
import { type Filter } from '../../types';
import { useBillingHistoryFilterContext } from '../billing-history/useBillingHistoryFilterContext';
import { useBillingHistoryBills } from '../billing-history/useBillingHistoryBills';
import { buildPaymentHistoryEntries } from './payment-history.utils';

export const usePaymentHistoryEntries = (filters: Filter) => {
  const { dateRange } = useBillingHistoryFilterContext();
  const rangeStart = useMemo(() => dayjs(dateRange[0]).startOf('day').toDate(), [dateRange]);
  const rangeEnd = useMemo(() => dayjs(dateRange[1]).endOf('day').toDate(), [dateRange]);
  const { bills, isLoading, isValidating, error } = useBillingHistoryBills(filters, { dateFilterSource: 'payment' });
  const entries = useMemo(() => buildPaymentHistoryEntries(bills, rangeStart, rangeEnd), [bills, rangeEnd, rangeStart]);

  return { entries, isLoading, isValidating, error };
};
