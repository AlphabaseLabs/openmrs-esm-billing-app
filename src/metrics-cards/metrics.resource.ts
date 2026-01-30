import { convertToCurrency } from '../helpers';
import { type MappedBill, PaymentStatus } from '../types';

/**
 * A custom hook for calculating bill metrics.
 *
 * This hook takes in an array of bills and calculates the total amount for different
 * bill statuses (cumulative, pending, paid) using provided helper functions.
 *
 * @param {Array<Object>} bills - An array of bill objects. Each bill object should have a `status` and `lineItems` properties.
 *
 */

export const useBillMetrics = (
  bills: Array<MappedBill>,
): {
  totalBills: string;
  pendingBills: string;
  paidBills: string;
  exemptedBills: string;
  waivedBills: string;
  exemptedAmount: number;
  taxCollection: string;
  taxCollectionAmount: number;
} => {
  const { paidTotal, pendingTotal, cumulativeTotal, exemptedTotal, waivedTotal, taxTotal } =
    calculateBillTotals(bills);
  return {
    totalBills: convertToCurrency(cumulativeTotal),
    pendingBills: convertToCurrency(pendingTotal),
    paidBills: convertToCurrency(paidTotal),
    exemptedBills: convertToCurrency(exemptedTotal),
    waivedBills: convertToCurrency(waivedTotal),
    exemptedAmount: exemptedTotal,
    taxCollection: convertToCurrency(taxTotal),
    taxCollectionAmount: taxTotal,
  };
};

const calculateBillTotals = (bills: Array<MappedBill>) => {
  let paidTotal = 0;
  let pendingTotal = 0;
  let cumulativeTotal = 0;
  let exemptedTotal = 0;
  let waivedTotal = 0;
  let taxTotal = 0;

  bills.forEach((bill) => {
    const amount = bill.totalAmount;
    const waivedAmount = bill.totalWaived;
    const actualPayments = bill.totalActualPayments;
    const balanceDue = bill.balance ?? Math.max(0, amount - actualPayments);

    // Collection: sum of all payments received (partial or full)
    paidTotal += actualPayments;

    if (bill.status === PaymentStatus.PAID) {
      taxTotal += bill.totalTax;
    } else if (bill.status === PaymentStatus.PENDING) {
      // Pending: amount still owed, not the full bill amount
      pendingTotal += balanceDue;
    } else if (bill.status === PaymentStatus.EXEMPTED) {
      exemptedTotal += amount;
    }
    cumulativeTotal += amount;
    waivedTotal += waivedAmount;
  });

  return { paidTotal, pendingTotal, cumulativeTotal, exemptedTotal, waivedTotal, taxTotal };
};

export default calculateBillTotals;
