import dayjs from 'dayjs';
import { useBills } from '../../billing.resource';
import { type Filter, type MappedBill } from '../../types';
import { filterBills } from './filters/bill-filter';
import { usePaymentFilterContext } from './usePaymentFilterContext';

function extractServiceName(billableService: string): string {
  const parts = billableService.split(':');
  if (parts.length === 1) {
    return billableService.trim();
  }
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return parts[0].trim().match(uuidPattern) ? parts[1].trim() : parts[0].trim();
}

function getLatestPaymentTimestamp(bill: MappedBill) {
  const paymentTimestamps =
    bill.payments
      ?.filter((payment) => !payment.voided && payment.dateCreated)
      .map((payment) => dayjs(payment.dateCreated).valueOf()) ?? [];
  const fallbackTimestamp = dayjs(bill.dateCreatedUnformatted ?? bill.dateCreated).valueOf();

  return paymentTimestamps.length ? Math.max(...paymentTimestamps) : fallbackTimestamp;
}

export const usePaymentTransactionHistory = (filters: Filter) => {
  const { dateRange } = usePaymentFilterContext();
  const { bills, isLoading, isValidating, error } = useBills(
    filters.patientUuid ?? '',
    filters.billStatus ?? '',
    dayjs(dateRange[0]).startOf('day').toDate(),
    dayjs(dateRange[1]).endOf('day').toDate(),
  );

  const normalizedBills = (bills ?? []).map((bill) => ({
    ...bill,
    lineItems: bill.lineItems.map((item) => ({
      ...item,
      billableService: extractServiceName(item.billableService),
    })),
  }));

  const filteredBills = filterBills(normalizedBills, filters);
  const sortedBills = filteredBills
    .slice()
    .sort((leftBill, rightBill) => getLatestPaymentTimestamp(rightBill) - getLatestPaymentTimestamp(leftBill));

  return { bills: sortedBills, isLoading, isValidating, error };
};
