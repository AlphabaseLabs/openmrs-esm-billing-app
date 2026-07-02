import { type LineItem, type MappedBill, PaymentStatus } from '../../types';
import { isLineItemRefunded } from './bill-line-items.utils';

const createLineItem = (lineItem: Partial<LineItem>): LineItem =>
  ({
    uuid: 'line-item-uuid',
    item: '',
    billableService: 'service-uuid:Consultation',
    quantity: 1,
    price: 100,
    priceName: 'Cash',
    priceUuid: 'price-uuid',
    lineItemOrder: 0,
    paymentStatus: PaymentStatus.PAID,
    ...lineItem,
  }) as LineItem;

const createBill = (lineItems: LineItem[]): MappedBill => ({ lineItems }) as MappedBill;

describe('isLineItemRefunded', () => {
  it('does not treat every line with the same service as refunded', () => {
    const refundedLineItem = createLineItem({
      uuid: 'refunded-line-item',
      price: 100,
      priceUuid: 'cash-price-uuid',
    });
    const otherServiceLineItem = createLineItem({
      uuid: 'other-service-line-item',
      price: 200,
      priceUuid: 'insurance-price-uuid',
    });
    const refundLineItem = createLineItem({
      uuid: 'refund-line-item',
      price: -100,
      priceUuid: 'cash-price-uuid',
      paymentStatus: PaymentStatus.CREDITED,
    });
    const bill = createBill([refundedLineItem, otherServiceLineItem, refundLineItem]);

    expect(isLineItemRefunded(bill, refundedLineItem)).toBe(true);
    expect(isLineItemRefunded(bill, otherServiceLineItem)).toBe(false);
  });

  it('only consumes one matching paid line item per refund row', () => {
    const firstLineItem = createLineItem({ uuid: 'first-line-item' });
    const secondLineItem = createLineItem({ uuid: 'second-line-item' });
    const refundLineItem = createLineItem({
      uuid: 'refund-line-item',
      price: -100,
      paymentStatus: PaymentStatus.CREDITED,
    });
    const bill = createBill([firstLineItem, secondLineItem, refundLineItem]);

    expect(isLineItemRefunded(bill, firstLineItem)).toBe(true);
    expect(isLineItemRefunded(bill, secondLineItem)).toBe(false);
  });

  it('matches stock item refund rows by item reference', () => {
    const stockLineItem = createLineItem({
      uuid: 'stock-line-item',
      item: 'stock-item-uuid:Paracetamol',
      billableService: '',
    });
    const refundLineItem = createLineItem({
      uuid: 'stock-refund-line-item',
      item: 'stock-item-uuid:Paracetamol',
      billableService: 'service-uuid:Paracetamol',
      price: -100,
      paymentStatus: PaymentStatus.CREDITED,
    });
    const bill = createBill([stockLineItem, refundLineItem]);

    expect(isLineItemRefunded(bill, stockLineItem)).toBe(true);
  });
});
