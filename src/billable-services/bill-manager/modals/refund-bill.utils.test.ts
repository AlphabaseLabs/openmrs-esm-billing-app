import { type LineItem, type MappedBill, PaymentStatus } from '../../../types';
import { createRefundBillPayload } from './refund-bill.utils';

describe('createRefundBillPayload', () => {
  const bill = {
    cashPointUuid: 'cash-point-uuid',
    cashier: { uuid: 'cashier-uuid' },
    patientUuid: 'patient-uuid',
    status: PaymentStatus.POSTED,
    payments: [
      {
        uuid: 'existing-payment-uuid',
        instanceType: { uuid: 'cash-payment-mode-uuid' },
        attributes: [],
        amount: 100,
        amountTendered: 100,
      },
    ],
  } as unknown as MappedBill;

  it('creates a credited negative line item with mirrored tax and discount without resending payments', () => {
    const lineItem = {
      uuid: 'line-item-uuid',
      item: '',
      billableService: 'service-uuid:Consultation',
      quantity: 1,
      price: 100,
      priceName: 'Default',
      priceUuid: 'price-uuid',
      lineItemOrder: 0,
      discounts: [
        {
          uuid: 'discount-uuid',
          amount: 10,
          baseAmount: 100,
          rate: 0.1,
          description: 'percentage',
          sponsor: 'provider-uuid',
        },
      ],
      taxes: [
        {
          uuid: 'tax-uuid',
          amount: 14.4,
          baseAmount: 90,
          rate: 0.16,
          concept: 'tax-concept-uuid',
        },
      ],
    } as unknown as LineItem;

    expect(createRefundBillPayload(bill, lineItem)).toEqual({
      cashPoint: 'cash-point-uuid',
      cashier: 'cashier-uuid',
      lineItems: [
        {
          billableService: 'service-uuid',
          quantity: 1,
          price: -100,
          priceName: 'Default',
          priceUuid: 'price-uuid',
          lineItemOrder: 0,
          paymentStatus: PaymentStatus.CREDITED,
          discounts: [
            {
              amount: -10,
              baseAmount: -100,
              rate: 0.1,
              description: 'percentage',
              sponsor: 'provider-uuid',
            },
          ],
          taxes: [
            {
              amount: -14.4,
              baseAmount: -90,
              rate: 0.16,
              concept: 'tax-concept-uuid',
            },
          ],
        },
      ],
      payments: [],
      patient: 'patient-uuid',
    });
  });

  it('does not include bill status or existing payments for partially paid bills', () => {
    const lineItem = {
      item: '',
      billableService: 'service-uuid:Consultation',
      quantity: 2,
      price: 100,
      priceName: 'Default',
      priceUuid: 'price-uuid',
      lineItemOrder: 1,
      paymentStatus: PaymentStatus.PAID,
    } as unknown as LineItem;

    const payload = createRefundBillPayload(bill, lineItem);

    expect(payload).not.toHaveProperty('status');
    expect(payload.payments).toEqual([]);
    expect(payload.lineItems[0]).toMatchObject({
      billableService: 'service-uuid',
      quantity: 2,
      price: -100,
      paymentStatus: PaymentStatus.CREDITED,
    });
    expect(payload.lineItems[0]).not.toHaveProperty('discounts');
    expect(payload.lineItems[0]).not.toHaveProperty('taxes');
  });

  it('uses stock item references and drops tax rows that cannot be resolved by the backend', () => {
    const lineItem = {
      item: 'stock-item-uuid:Paracetamol',
      billableService: '',
      quantity: 1,
      price: 50,
      priceName: 'Cash',
      priceUuid: 'price-uuid',
      lineItemOrder: 2,
      taxes: [
        {
          amount: 8,
          baseAmount: 50,
          rate: 0.16,
        },
      ],
    } as unknown as LineItem;

    const payload = createRefundBillPayload(bill, lineItem);

    expect(payload.lineItems[0]).toMatchObject({
      item: 'stock-item-uuid',
      price: -50,
      paymentStatus: PaymentStatus.CREDITED,
    });
    expect(payload.lineItems[0]).not.toHaveProperty('billableService');
    expect(payload.lineItems[0]).not.toHaveProperty('taxes');
  });
});
