import dayjs from 'dayjs';
import { useBills } from '../../billing.resource';
import { type Filter } from '../../types';
import { getFilteredBillsForHistory, getLatestPaymentTimestamp } from './billing-history.utils';
import { useBillingHistoryFilterContext } from './useBillingHistoryFilterContext';

export const useBillingHistoryBills = (filters: Filter) => {
  const { dateRange } = useBillingHistoryFilterContext();
  const { bills, isLoading, isValidating, error } = useBills(
    filters.patientUuid ?? '',
    filters.billStatus ?? '',
    dayjs(dateRange[0]).startOf('day').toDate(),
    dayjs(dateRange[1]).endOf('day').toDate(),
  );

  const filteredBills = getFilteredBillsForHistory(bills ?? [], filters);
  const sortedBills = filteredBills
    .slice()
    .sort((leftBill, rightBill) => getLatestPaymentTimestamp(rightBill) - getLatestPaymentTimestamp(leftBill));

  return { bills: sortedBills, isLoading, isValidating, error };
};
