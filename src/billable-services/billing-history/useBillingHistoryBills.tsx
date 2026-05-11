import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useBills } from '../../billing.resource';
import { type Filter } from '../../types';
import { getFilteredBillsForHistory, getLatestPaymentTimestamp } from './billing-history.utils';
import { useBillingHistoryFilterContext } from './useBillingHistoryFilterContext';

type BillingHistoryBillDateSource = 'bill' | 'payment';

interface UseBillingHistoryBillsOptions {
  dateFilterSource?: BillingHistoryBillDateSource;
}

export const useBillingHistoryBills = (filters: Filter, options: UseBillingHistoryBillsOptions = {}) => {
  const { dateRange } = useBillingHistoryFilterContext();
  const dateFilterSource = options.dateFilterSource ?? 'bill';
  const rangeStart = useMemo(() => dayjs(dateRange[0]).startOf('day').valueOf(), [dateRange]);
  const rangeEnd = useMemo(() => dayjs(dateRange[1]).endOf('day').valueOf(), [dateRange]);
  const queryStartDate = useMemo(
    () => (dateFilterSource === 'payment' ? new Date(0) : dayjs(dateRange[0]).startOf('day').toDate()),
    [dateFilterSource, dateRange],
  );
  const queryEndDate = useMemo(() => dayjs(dateRange[1]).endOf('day').toDate(), [dateRange]);
  const { bills, isLoading, isValidating, error } = useBills(
    filters.patientUuid ?? '',
    filters.billStatus ?? '',
    queryStartDate,
    queryEndDate,
  );

  const filteredBills = useMemo(() => getFilteredBillsForHistory(bills ?? [], filters), [bills, filters]);
  const scopedBills = useMemo(
    () =>
      dateFilterSource === 'payment'
        ? filteredBills.filter((bill) =>
            (bill.payments ?? []).some((payment) => {
              if (payment?.voided) {
                return false;
              }

              const paymentTimestamp = dayjs(payment?.dateCreated).valueOf();
              return (
                Number.isFinite(paymentTimestamp) && paymentTimestamp >= rangeStart && paymentTimestamp <= rangeEnd
              );
            }),
          )
        : filteredBills,
    [dateFilterSource, filteredBills, rangeEnd, rangeStart],
  );
  const sortedBills = useMemo(
    () =>
      scopedBills
        .slice()
        .sort((leftBill, rightBill) => getLatestPaymentTimestamp(rightBill) - getLatestPaymentTimestamp(leftBill)),
    [scopedBills],
  );

  return { bills: sortedBills, isLoading, isValidating, error };
};
