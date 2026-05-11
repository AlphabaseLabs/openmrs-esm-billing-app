import dayjs from 'dayjs';
import { type Filter, type MappedBill } from '../../types';
import { filterBills } from './filters/bill-filter';

export function extractServiceName(billableService: string): string {
  const parts = billableService.split(':');
  if (parts.length === 1) {
    return billableService.trim();
  }
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return parts[0].trim().match(uuidPattern) ? parts[1].trim() : parts[0].trim();
}

export function normalizeBillsForHistory(bills: Array<MappedBill>) {
  return bills.map((bill) => ({
    ...bill,
    lineItems: bill.lineItems.map((item) => ({
      ...item,
      billableService: extractServiceName(item.billableService),
    })),
  }));
}

export function getLatestPaymentTimestamp(bill: MappedBill) {
  const paymentTimestamps =
    bill.payments
      ?.filter((payment) => !payment.voided && payment.dateCreated)
      .map((payment) => dayjs(payment.dateCreated).valueOf()) ?? [];
  const fallbackTimestamp = dayjs(bill.dateCreatedUnformatted ?? bill.dateCreated).valueOf();

  return paymentTimestamps.length ? Math.max(...paymentTimestamps) : fallbackTimestamp;
}

export function getFilteredBillsForHistory(bills: Array<MappedBill>, filters: Filter) {
  return filterBills(normalizeBillsForHistory(bills), filters);
}
