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
  totalDiscount: string;
  waivedBills: string;
  exemptedAmount: number;
  totalDiscountAmount: number;
  waivedAmount: number;
  taxCollection: string;
  taxCollectionAmount: number;
} => {
  const { paidTotal, pendingTotal, cumulativeTotal, exemptedTotal, discountTotal, waivedTotal, taxTotal } =
    calculateBillTotals(bills);
  return {
    totalBills: convertToCurrency(cumulativeTotal),
    pendingBills: convertToCurrency(pendingTotal),
    paidBills: convertToCurrency(paidTotal),
    exemptedBills: convertToCurrency(exemptedTotal),
    totalDiscount: convertToCurrency(discountTotal),
    waivedBills: convertToCurrency(waivedTotal),
    exemptedAmount: exemptedTotal,
    totalDiscountAmount: discountTotal,
    waivedAmount: waivedTotal,
    taxCollection: convertToCurrency(taxTotal),
    taxCollectionAmount: taxTotal,
  };
};

const calculateBillTotals = (bills: Array<MappedBill>) => {
  let paidTotal = 0;
  let pendingTotal = 0;
  let cumulativeTotal = 0;
  let exemptedTotal = 0;
  let discountTotal = 0;
  let waivedTotal = 0;
  let taxTotal = 0;

  bills.forEach((bill) => {
    const amount = Number(bill.totalAmount ?? 0);
    const discountAmount = Number(bill.billLineItemDiscounts ?? 0);
    const waivedAmount = Number(bill.totalWaived ?? 0);
    const actualPayments = bill.payments?.length
      ? bill.payments
          .filter((payment) => payment.instanceType?.name !== 'Waiver')
          .reduce((sum, payment) => sum + (Number(payment.amountTendered) || 0), 0)
      : Number(bill.totalActualPayments ?? 0);
    const pendingAmount = Math.max(0, amount - actualPayments - waivedAmount);

    // Collection: sum of all payments received (partial or full)
    paidTotal += actualPayments;

    if (bill.status === PaymentStatus.PAID) {
      taxTotal += Number(bill.totalTax ?? 0);
    } else if (bill.status === PaymentStatus.EXEMPTED) {
      exemptedTotal += amount;
    }
    pendingTotal += pendingAmount;
    cumulativeTotal += amount;
    discountTotal += discountAmount;
    waivedTotal += waivedAmount;
  });

  return { paidTotal, pendingTotal, cumulativeTotal, exemptedTotal, discountTotal, waivedTotal, taxTotal };
};

export default calculateBillTotals;
