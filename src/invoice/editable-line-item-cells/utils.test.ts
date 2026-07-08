import { type MappedBill, PaymentStatus } from '../../types';
import {
  canEditLineItem,
  getLineItemAmountDue,
  getLineItemDiscountAmount,
  getLineItemTaxAmount,
  getLineItemTotal,
  parseEditableNumber,
  recalculateLineItem,
  recomputeBillWithAdditionalDiscount,
  recomputeBillWithLineItem,
} from './utils';
import { testDiscountedLineItem, testLineItem } from './editable-cell-test-utils';

describe('editable line item utils', () => {
  it('parses editable numeric values', () => {
    expect(parseEditableNumber('2,000')).toBe(2000);
    expect(parseEditableNumber('')).toBeNull();
    expect(parseEditableNumber('invalid')).toBeNull();
  });

  it('prevents editing finalized rows', () => {
    expect(canEditLineItem(testLineItem, false)).toBe(true);
    expect(canEditLineItem({ ...testLineItem, paymentStatus: PaymentStatus.PAID }, false)).toBe(true);
    expect(canEditLineItem(testLineItem, true)).toBe(false);
    expect(canEditLineItem({ ...testLineItem, paymentStatus: PaymentStatus.EXEMPTED }, false)).toBe(false);
    expect(canEditLineItem({ ...testLineItem, paymentStatus: PaymentStatus.CANCELLED }, false)).toBe(false);
    expect(canEditLineItem({ ...testLineItem, paymentStatus: PaymentStatus.ADJUSTED }, false)).toBe(false);
  });

  it('calculates line item totals', () => {
    const lineItem = {
      ...testDiscountedLineItem,
      taxes: [{ amount: 100, baseAmount: 1500 }],
    };

    expect(getLineItemDiscountAmount(lineItem)).toBe(500);
    expect(getLineItemTaxAmount(lineItem)).toBe(100);
    expect(getLineItemTotal(lineItem)).toBe(1600);
  });

  it('recomputes bill totals after a line item change', () => {
    const bill = {
      uuid: 'bill',
      lineItems: [testLineItem],
      payments: [],
      status: PaymentStatus.PENDING,
      totalActualPayments: 0,
    } as MappedBill;

    const updatedBill = recomputeBillWithLineItem(bill, { ...testLineItem, price: 2500 });

    expect(updatedBill.totalAmount).toBe(2500);
    expect(updatedBill.balance).toBe(2500);
    expect(updatedBill.totalAmountWithoutTaxAndDiscount).toBe(2500);
    expect(updatedBill.status).toBe(PaymentStatus.PENDING);
  });

  it('calculates remaining line item amount due', () => {
    expect(getLineItemAmountDue({ ...testLineItem, total: 2500, totalAllocated: 2000 })).toBe(500);
    expect(getLineItemAmountDue({ ...testLineItem, total: 2000, totalAllocated: 2500 })).toBe(0);
  });

  it('marks an edited paid line as posted when edited total exceeds allocated amount', () => {
    const recalculatedLineItem = recalculateLineItem({
      ...testLineItem,
      paymentStatus: PaymentStatus.PAID,
      price: 2500,
      totalAllocated: 2000,
    });

    expect(recalculatedLineItem.total).toBe(2500);
    expect(recalculatedLineItem.paymentStatus).toBe(PaymentStatus.POSTED);
  });

  it('keeps an edited line paid when allocated amount covers the edited total', () => {
    const recalculatedLineItem = recalculateLineItem({
      ...testLineItem,
      paymentStatus: PaymentStatus.PAID,
      price: 2000,
      totalAllocated: 2500,
    });

    expect(recalculatedLineItem.paymentStatus).toBe(PaymentStatus.PAID);
  });

  it('marks an edited unpaid line as pending when it has no allocation', () => {
    const recalculatedLineItem = recalculateLineItem({
      ...testLineItem,
      price: 2500,
      totalAllocated: 0,
    });

    expect(recalculatedLineItem.paymentStatus).toBe(PaymentStatus.PENDING);
  });

  it('recomputes paid bill balance and status when an edited paid line creates a gap', () => {
    const paidLineItem = {
      ...testLineItem,
      paymentStatus: PaymentStatus.PAID,
      totalAllocated: 2000,
      total: 2000,
    };
    const bill = {
      uuid: 'bill',
      lineItems: [paidLineItem],
      payments: [],
      status: PaymentStatus.PAID,
      totalActualPayments: 2000,
      totalAmount: 2000,
      balance: 0,
    } as MappedBill;

    const updatedBill = recomputeBillWithLineItem(bill, { ...paidLineItem, price: 2500 });

    expect(updatedBill.lineItems[0].paymentStatus).toBe(PaymentStatus.POSTED);
    expect(updatedBill.totalAmount).toBe(2500);
    expect(updatedBill.balance).toBe(500);
    expect(updatedBill.status).toBe(PaymentStatus.POSTED);
  });

  it('ignores legacy additional discount after a line item change', () => {
    const bill = {
      uuid: 'bill',
      lineItems: [testDiscountedLineItem],
      payments: [],
      status: PaymentStatus.PENDING,
      additionalDiscount: 100,
      totalActualPayments: 200,
      totalWaived: 50,
      totalDeposits: 25,
    } as MappedBill;

    const updatedBill = recomputeBillWithLineItem(bill, {
      ...testDiscountedLineItem,
      price: 2000,
      quantity: 1,
      discounts: [{ amount: 250, baseAmount: 2000 }],
      taxes: [{ amount: 50, baseAmount: 1750 }],
    });

    expect(updatedBill.totalAmount).toBe(1800);
    expect(updatedBill.billLineItemDiscounts).toBe(250);
    expect(updatedBill.additionalDiscount).toBe(0);
    expect(updatedBill.totalDiscounts).toBe(250);
    expect(updatedBill.balance).toBe(1525);
    expect(updatedBill.status).toBe(PaymentStatus.POSTED);
  });

  it('keeps Discounts line-sourced when the legacy additional discount recompute helper is called', () => {
    const lineItem = {
      ...testDiscountedLineItem,
      discounts: [{ amount: 250, baseAmount: 2000 }],
      total: 1750,
    };
    const bill = {
      uuid: 'bill',
      lineItems: [lineItem],
      payments: [],
      status: PaymentStatus.PENDING,
      totalAmount: 1750,
      billLineItemDiscounts: 250,
      totalActualPayments: 200,
      totalWaived: 50,
      totalDeposits: 25,
      additionalDiscount: 0,
      totalDiscounts: 250,
      balance: 1475,
    } as MappedBill;

    const updatedBill = recomputeBillWithAdditionalDiscount(bill, 100);

    expect(updatedBill.lineItems[0]).toBe(lineItem);
    expect(updatedBill.additionalDiscount).toBe(0);
    expect(updatedBill.totalDiscounts).toBe(250);
    expect(updatedBill.balance).toBe(1475);
    expect(updatedBill.status).toBe(PaymentStatus.POSTED);
  });
});
