import { type MappedBill, PaymentStatus } from '../../types';
import {
  canEditLineItem,
  getLineItemDiscountAmount,
  getLineItemTaxAmount,
  getLineItemTotal,
  parseEditableNumber,
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
    expect(canEditLineItem({ ...testLineItem, paymentStatus: PaymentStatus.PAID }, false)).toBe(false);
    expect(canEditLineItem(testLineItem, true)).toBe(false);
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
  });
});
