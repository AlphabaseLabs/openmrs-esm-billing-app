import { type LineItem, PaymentStatus } from '../../types';
import {
  formatDiscountPercent,
  getBulkDiscountMaximum,
  getLineDiscountMaximum,
  parseEditableNumber,
  roundMoneyAmount,
  validateFixedDiscountInput,
  validatePercentDiscountInput,
} from './discount-amount-validation';
import { testLineItem } from './editable-cell-test-utils';

const createLineItem = (overrides: Partial<LineItem> = {}) =>
  ({
    ...testLineItem,
    uuid: overrides.uuid ?? testLineItem.uuid,
    price: overrides.price ?? testLineItem.price,
    quantity: overrides.quantity ?? testLineItem.quantity,
    paymentStatus: overrides.paymentStatus ?? PaymentStatus.PENDING,
    voided: overrides.voided ?? false,
    ...overrides,
  }) as LineItem;

describe('discount amount validation', () => {
  it('parses editable numeric text and rejects non-numeric input', () => {
    expect(parseEditableNumber('2,000.50')).toBe(2000.5);
    expect(parseEditableNumber(' 25 ')).toBe(25);
    expect(parseEditableNumber('')).toBeNull();
    expect(parseEditableNumber('abc')).toBeNull();
  });

  it('rounds money values to two decimal places', () => {
    expect(roundMoneyAmount(12.345)).toBe(12.35);
    expect(roundMoneyAmount(Number.NaN)).toBe(0);
  });

  it('treats blank fixed amount input as zero', () => {
    expect(validateFixedDiscountInput('', 100)).toEqual({ valid: true, amount: 0 });
  });

  it('rejects invalid fixed amount input before producing an amount', () => {
    expect(validateFixedDiscountInput('abc', 100)).toEqual({ valid: false, reason: 'invalid-number' });
    expect(validateFixedDiscountInput('-1', 100)).toEqual({ valid: false, reason: 'negative' });
    expect(validateFixedDiscountInput('101', 100)).toEqual({ valid: false, reason: 'over-maximum' });
  });

  it('validates typed percent without clamping and converts valid percent to an amount', () => {
    expect(validatePercentDiscountInput('abc', 200)).toEqual({ valid: false, reason: 'invalid-number' });
    expect(validatePercentDiscountInput('-1', 200)).toEqual({ valid: false, reason: 'negative' });
    expect(validatePercentDiscountInput('120', 200)).toEqual({ valid: false, reason: 'over-100' });
    expect(validatePercentDiscountInput('12.5', 200)).toEqual({ valid: true, percent: 12.5, amount: 25 });
  });

  it('calculates inline maximum from line subtotal', () => {
    expect(getLineDiscountMaximum(createLineItem({ price: 125.255, quantity: 2 }))).toBe(250.51);
  });

  it('calculates Bulk maximum from current discounts plus unpaid pending and posted capacity', () => {
    expect(
      getBulkDiscountMaximum([
        createLineItem({
          uuid: 'pending',
          price: 100,
          quantity: 2,
          totalAllocated: 50,
          paymentStatus: PaymentStatus.PENDING,
        }),
        createLineItem({
          uuid: 'posted',
          price: 50,
          quantity: 1,
          discounts: [{ amount: 10, baseAmount: 50 }],
          totalAllocated: 15,
          paymentStatus: PaymentStatus.POSTED,
        }),
        createLineItem({ uuid: 'paid', price: 25, quantity: 1, paymentStatus: PaymentStatus.PAID }),
        createLineItem({
          uuid: 'paid-discounted',
          price: 25,
          quantity: 1,
          discounts: [{ amount: 20, baseAmount: 25 }],
          paymentStatus: PaymentStatus.PAID,
        }),
        createLineItem({ uuid: 'cancelled', price: 200, quantity: 1, paymentStatus: PaymentStatus.CANCELLED }),
        createLineItem({ uuid: 'voided', price: 200, quantity: 1, voided: true }),
      ]),
    ).toBe(205);
  });

  it('formats percent display consistently', () => {
    expect(formatDiscountPercent(10)).toBe('10');
    expect(formatDiscountPercent(10.12345)).toBe('10.1235');
    expect(formatDiscountPercent(0.00001)).toBe('<0.0001');
  });
});
