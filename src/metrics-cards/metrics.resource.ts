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
} => {
  const { paidTotal, pendingTotal, cumulativeTotal, exemptedTotal, waivedTotal } = calculateBillTotals(bills);
  return {
    totalBills: convertToCurrency(cumulativeTotal),
    pendingBills: convertToCurrency(pendingTotal),
    paidBills: convertToCurrency(paidTotal),
    exemptedBills: convertToCurrency(exemptedTotal),
    waivedBills: convertToCurrency(waivedTotal),
    exemptedAmount: exemptedTotal,
  };
};

const calculateBillTotals = (bills: Array<MappedBill>) => {
  let paidTotal = 0;
  let pendingTotal = 0;
  let cumulativeTotal = 0;
  let exemptedTotal = 0;
  let waivedTotal = 0;

  bills.forEach((bill) => {
    const amount = bill.totalAmount || 0; // Ensure totalAmount is a valid number
    const waivedAmount = bill.totalWaived || 0;
    
    if (bill.status === PaymentStatus.PAID) {
      paidTotal += amount;
    } else if (bill.status === PaymentStatus.PENDING) {
      pendingTotal += amount;
    } else if (bill.status === PaymentStatus.EXEMPTED) {
      exemptedTotal += amount;
    }
    cumulativeTotal += amount; // Add to cumulative total regardless of status
    waivedTotal += waivedAmount;
  });

  return { paidTotal, pendingTotal, cumulativeTotal, exemptedTotal, waivedTotal };
};

export default calculateBillTotals;
