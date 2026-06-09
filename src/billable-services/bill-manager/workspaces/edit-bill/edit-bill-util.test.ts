import { mockBillData } from '../../../../../__mocks__/bill.mock';
import { createEditBillLineItemPayload } from './edit-bill-util';

describe('createEditBillLineItemPayload', () => {
  it('returns only changed line item fields', () => {
    const lineItem = mockBillData[0].lineItems[0];

    expect(
      createEditBillLineItemPayload(lineItem, {
        price: lineItem.price.toString(),
        priceName: lineItem.priceName,
        priceUuid: lineItem.priceUuid,
        quantity: '3',
        discountValue: 0,
        discountMethod: 'percentage',
        adjustmentReason: 'Updated quantity',
      }),
    ).toEqual({ quantity: 3 });
  });

  it('does not include a blank priceUuid', () => {
    const lineItem = { ...mockBillData[0].lineItems[0], priceUuid: '' };

    expect(
      createEditBillLineItemPayload(lineItem, {
        price: '12000',
        priceName: 'Cash',
        priceUuid: '',
        quantity: lineItem.quantity.toString(),
        discountValue: 0,
        discountMethod: 'percentage',
        adjustmentReason: 'Updated price',
      }),
    ).toEqual({ price: 12000, priceName: 'Cash' });
  });
});
