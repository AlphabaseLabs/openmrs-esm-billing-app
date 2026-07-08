import { mapBillProperties } from './billing.resource';
import { PaymentStatus } from './types';

const baseInvoice = {
  id: 1,
  uuid: 'bill-uuid',
  display: 'BILL-1',
  voided: false,
  voidReason: null,
  adjustedBy: [],
  billAdjusted: null,
  cashPoint: {
    uuid: 'cash-point-uuid',
    name: 'Cashier',
    location: { display: 'Main location' },
  },
  cashier: {
    uuid: 'provider-uuid',
    display: 'admin - Cashier',
  },
  dateCreated: '2026-01-01T08:00:00.000+0000',
  patient: {
    uuid: 'patient-uuid',
    display: 'ABC123 - Test Patient',
  },
  receiptNumber: 'BILL-1',
  status: PaymentStatus.POSTED,
  adjustmentReason: null,
  resourceVersion: '1.8',
};

describe('mapBillProperties', () => {
  it('derives Discounts from line totals and ignores legacy additional discount', () => {
    const mappedBill = mapBillProperties({
      ...baseInvoice,
      additionalDiscount: 50,
      balance: 115,
      totalActualPayments: 100,
      totalDiscount: 20,
      totalTax: 10,
      totalWaivers: 25,
      lineItems: [
        {
          uuid: 'line-1',
          item: 'Consultation',
          quantity: 1,
          price: 200,
          discounts: [{ amount: 20 }],
          taxes: [{ amount: 10 }],
          total: 190,
          voided: false,
        },
        {
          uuid: 'line-2',
          item: 'Registration',
          quantity: 1,
          price: 100,
          discounts: [],
          taxes: [],
          total: 100,
          voided: false,
        },
      ],
      payments: [
        {
          amountTendered: 100,
          attributes: [],
          instanceType: { name: 'Cash' },
        },
      ],
    } as any);

    expect(mappedBill.totalAmount).toBe(290);
    expect(mappedBill.billLineItemDiscounts).toBe(20);
    expect(mappedBill.additionalDiscount).toBe(0);
    expect(mappedBill.totalDiscounts).toBe(20);
    expect(mappedBill.totalWaived).toBe(25);
    expect(mappedBill.totalActualPayments).toBe(100);
    expect(mappedBill.tenderedAmount).toBe(100);
    expect(mappedBill.balance).toBe(115);
    expect(mappedBill.totalAmountWithoutTaxAndDiscount).toBe(300);
  });

  it('defaults older bill responses to zero additional discount without requiring payments', () => {
    const mappedBill = mapBillProperties({
      ...baseInvoice,
      balance: 0,
      totalDiscount: 0,
      lineItems: [],
      payments: [],
    } as any);

    expect(mappedBill.additionalDiscount).toBe(0);
    expect(mappedBill.totalDiscounts).toBe(0);
    expect(mappedBill.totalAmount).toBe(0);
    expect(mappedBill.tenderedAmount).toBe(0);
  });
});
