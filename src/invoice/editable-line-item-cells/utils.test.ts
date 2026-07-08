import { type LineItem, type MappedBill, PaymentStatus } from '../../types';
import {
  applyBulkDiscountDraft,
  canEditLineItem,
  getBulkDiscountMaximum,
  getBulkDiscountTotal,
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

const createLineItem = (overrides: Partial<LineItem> = {}) =>
  ({
    ...testLineItem,
    uuid: overrides.uuid ?? testLineItem.uuid,
    display: overrides.display ?? testLineItem.display,
    item: overrides.item ?? testLineItem.item,
    billableService: overrides.billableService ?? testLineItem.billableService,
    price: overrides.price ?? testLineItem.price,
    quantity: overrides.quantity ?? testLineItem.quantity,
    paymentStatus: overrides.paymentStatus ?? PaymentStatus.PENDING,
    discounts: overrides.discounts ?? [],
    taxes: overrides.taxes ?? [],
    totalAllocated: overrides.totalAllocated ?? 0,
    totalDiscount:
      overrides.totalDiscount ??
      (overrides.discounts ?? []).reduce((total, discount) => total + (discount?.amount ?? 0), 0),
    voided: overrides.voided ?? false,
    ...overrides,
  }) as LineItem;

const createBill = (lineItems: Array<LineItem>) =>
  ({
    uuid: 'bill',
    lineItems,
    payments: [],
    status: PaymentStatus.PENDING,
    totalActualPayments: 0,
  }) as MappedBill;

const findLineItem = (bill: MappedBill, uuid: string) => {
  const lineItem = bill.lineItems.find((item) => item.uuid === uuid);

  if (!lineItem) {
    throw new Error(`Missing line item ${uuid}`);
  }

  return lineItem;
};

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

  it('derives Bulk discount from active line-item discounts', () => {
    const activeDiscountedLine = createLineItem({
      uuid: 'active-discounted',
      price: 100,
      discounts: [{ amount: 25, baseAmount: 100 }],
    });
    const legacyDiscountLine = createLineItem({
      uuid: 'legacy-discount',
      price: 100,
      discounts: undefined,
      totalDiscount: 10,
    });
    const voidedDiscountLine = createLineItem({
      uuid: 'voided-discount',
      price: 100,
      discounts: [{ amount: 50, baseAmount: 100 }],
      totalDiscount: 50,
      voided: true,
    });

    expect(getBulkDiscountTotal([activeDiscountedLine, legacyDiscountLine, voidedDiscountLine])).toBe(35);
    expect(getBulkDiscountMaximum([activeDiscountedLine, legacyDiscountLine, voidedDiscountLine])).toBe(200);
  });

  it('applies positive Bulk discount deltas top-to-bottom within line subtotal capacity', () => {
    const bill = createBill([
      createLineItem({
        uuid: 'first',
        price: 100,
        discounts: [{ amount: 80, baseAmount: 100, sponsor: 'old-sponsor' }],
      }),
      createLineItem({ uuid: 'second', price: 50 }),
      createLineItem({ uuid: 'third', price: 10, discounts: [{ amount: 10, baseAmount: 10 }] }),
    ]);

    const draft = applyBulkDiscountDraft(bill, 130, {
      sponsor: 'bulk-sponsor',
      description: 'Bulk increase',
    });

    expect(getLineItemDiscountAmount(findLineItem(draft.bill, 'first'))).toBe(100);
    expect(getLineItemDiscountAmount(findLineItem(draft.bill, 'second'))).toBe(20);
    expect(getLineItemDiscountAmount(findLineItem(draft.bill, 'third'))).toBe(10);
    expect(draft.remainingDelta).toBe(0);
    expect(draft.lineItemUpdates.map((update) => update.lineItem.uuid)).toEqual(['first', 'second']);
    expect(draft.lineItemUpdates[0].discounts).toEqual([
      expect.objectContaining({
        amount: 100,
        baseAmount: 100,
        sponsor: 'bulk-sponsor',
        description: 'Bulk increase',
      }),
    ]);
  });

  it('reports remaining positive Bulk discount delta when line subtotal capacity is exhausted', () => {
    const bill = createBill([
      createLineItem({ uuid: 'first', price: 100, discounts: [{ amount: 80, baseAmount: 100 }] }),
      createLineItem({ uuid: 'second', price: 50 }),
      createLineItem({ uuid: 'third', price: 10, discounts: [{ amount: 10, baseAmount: 10 }] }),
    ]);

    const draft = applyBulkDiscountDraft(bill, 200);

    expect(getBulkDiscountTotal(draft.bill.lineItems)).toBe(160);
    expect(draft.remainingDelta).toBe(40);
  });

  it('applies negative Bulk discount deltas bottom-up by pending, posted, then paid status groups', () => {
    const bill = createBill([
      createLineItem({
        uuid: 'pending-top',
        price: 100,
        discounts: [{ amount: 10, baseAmount: 100, sponsor: 'pending-top-sponsor' }],
        paymentStatus: PaymentStatus.PENDING,
      }),
      createLineItem({
        uuid: 'posted-top',
        price: 100,
        discounts: [{ amount: 20, baseAmount: 100, sponsor: 'posted-top-sponsor' }],
        paymentStatus: PaymentStatus.POSTED,
      }),
      createLineItem({
        uuid: 'paid-top',
        price: 100,
        discounts: [{ amount: 30, baseAmount: 100, sponsor: 'paid-top-sponsor' }],
        paymentStatus: PaymentStatus.PAID,
      }),
      createLineItem({
        uuid: 'pending-bottom',
        price: 100,
        discounts: [{ amount: 40, baseAmount: 100, sponsor: 'pending-bottom-sponsor' }],
        paymentStatus: PaymentStatus.PENDING,
      }),
      createLineItem({
        uuid: 'posted-bottom',
        price: 100,
        discounts: [{ amount: 50, baseAmount: 100, sponsor: 'posted-bottom-sponsor' }],
        paymentStatus: PaymentStatus.POSTED,
      }),
      createLineItem({
        uuid: 'paid-bottom',
        price: 100,
        discounts: [{ amount: 60, baseAmount: 100, sponsor: 'paid-bottom-sponsor' }],
        paymentStatus: PaymentStatus.PAID,
      }),
    ]);

    const draft = applyBulkDiscountDraft(bill, 100);

    expect(getLineItemDiscountAmount(findLineItem(draft.bill, 'pending-bottom'))).toBe(0);
    expect(findLineItem(draft.bill, 'pending-bottom').discounts).toEqual([]);
    expect(getLineItemDiscountAmount(findLineItem(draft.bill, 'pending-top'))).toBe(0);
    expect(getLineItemDiscountAmount(findLineItem(draft.bill, 'posted-bottom'))).toBe(0);
    expect(getLineItemDiscountAmount(findLineItem(draft.bill, 'posted-top'))).toBe(10);
    expect(findLineItem(draft.bill, 'posted-top').discounts).toEqual([
      expect.objectContaining({
        amount: 10,
        sponsor: 'posted-top-sponsor',
      }),
    ]);
    expect(getLineItemDiscountAmount(findLineItem(draft.bill, 'paid-top'))).toBe(30);
    expect(getLineItemDiscountAmount(findLineItem(draft.bill, 'paid-bottom'))).toBe(60);
    expect(draft.remainingDelta).toBe(0);
  });

  it('preserves metadata on reductions and applies selected metadata to increased discounts', () => {
    const bill = createBill([
      createLineItem({
        uuid: 'discounted',
        price: 100,
        discounts: [{ amount: 80, baseAmount: 100, sponsor: 'existing-sponsor', description: 'Existing reason' }],
      }),
      createLineItem({ uuid: 'empty', price: 100 }),
    ]);

    const reducedDraft = applyBulkDiscountDraft(bill, 60, {
      sponsor: 'bulk-sponsor',
      description: 'Bulk reason',
    });
    expect(findLineItem(reducedDraft.bill, 'discounted').discounts).toEqual([
      expect.objectContaining({
        amount: 60,
        sponsor: 'existing-sponsor',
        description: 'Existing reason',
      }),
    ]);

    const increasedDraft = applyBulkDiscountDraft(bill, 120, {
      sponsor: 'bulk-sponsor',
      description: 'Bulk reason',
    });
    expect(findLineItem(increasedDraft.bill, 'discounted').discounts).toEqual([
      expect.objectContaining({
        amount: 100,
        sponsor: 'bulk-sponsor',
        description: 'Bulk reason',
      }),
    ]);
    expect(findLineItem(increasedDraft.bill, 'empty').discounts).toEqual([
      expect.objectContaining({
        amount: 20,
        sponsor: 'bulk-sponsor',
        description: 'Bulk reason',
      }),
    ]);
  });

  it('returns full-replacement discount arrays for changed Bulk discount line items', () => {
    const bill = createBill([
      createLineItem({ uuid: 'discounted', price: 100, discounts: [{ amount: 25, baseAmount: 100 }] }),
      createLineItem({ uuid: 'unchanged', price: 100 }),
    ]);

    const draft = applyBulkDiscountDraft(bill, 0);

    expect(draft.lineItemUpdates).toHaveLength(1);
    expect(draft.lineItemUpdates[0]).toEqual(
      expect.objectContaining({
        lineItem: expect.objectContaining({ uuid: 'discounted' }),
        discounts: [],
      }),
    );
  });

  it('applies only the +141 delta for the 1,859 to 2,000 Bulk discount case', () => {
    const bill = createBill([
      createLineItem({
        uuid: 'dental-session',
        display: 'Dental Session',
        price: 1500,
        discounts: [{ amount: 1409, baseAmount: 1500 }],
        paymentStatus: PaymentStatus.PENDING,
      }),
      createLineItem({
        uuid: 'paid-registration',
        display: 'Registration',
        price: 500,
        paymentStatus: PaymentStatus.PAID,
      }),
      createLineItem({
        uuid: 'paid-discounted-registration',
        display: 'Registration',
        price: 450,
        discounts: [{ amount: 450, baseAmount: 450 }],
        paymentStatus: PaymentStatus.PAID,
      }),
      createLineItem({
        uuid: 'pending-registration',
        display: 'Registration',
        price: 450,
        paymentStatus: PaymentStatus.PENDING,
      }),
    ]);

    const draft = applyBulkDiscountDraft(bill, 2000, { sponsor: 'provider-uuid' });

    expect(getBulkDiscountTotal(bill.lineItems)).toBe(1859);
    expect(getBulkDiscountTotal(draft.bill.lineItems)).toBe(2000);
    expect(getLineItemDiscountAmount(findLineItem(draft.bill, 'dental-session'))).toBe(1500);
    expect(getLineItemDiscountAmount(findLineItem(draft.bill, 'paid-registration'))).toBe(50);
    expect(getLineItemDiscountAmount(findLineItem(draft.bill, 'paid-discounted-registration'))).toBe(450);
    expect(getLineItemDiscountAmount(findLineItem(draft.bill, 'pending-registration'))).toBe(0);
    expect(draft.lineItemUpdates.map((update) => update.lineItem.uuid)).toEqual([
      'dental-session',
      'paid-registration',
    ]);
    expect(draft.lineItemUpdates.map((update) => update.discounts?.[0]?.amount ?? 0)).toEqual([1500, 50]);
  });
});
