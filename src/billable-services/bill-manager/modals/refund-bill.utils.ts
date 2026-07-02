import { type LineItem, type MappedBill, PaymentStatus } from '../../../types';

const getResourceUuid = (resourceReference?: string) => resourceReference?.split(':')[0];

const negateAmount = (amount?: number) => (typeof amount === 'number' ? -amount : amount);

const createRefundDiscounts = (lineItem: LineItem) =>
  (lineItem.discounts ?? []).map((discount) => ({
    amount: negateAmount(discount.amount),
    baseAmount: negateAmount(discount.baseAmount),
    ...(discount.rate != null && { rate: discount.rate }),
    ...(discount.description && { description: discount.description }),
    ...(discount.sponsor && { sponsor: discount.sponsor }),
  }));

const createRefundTaxes = (lineItem: LineItem) =>
  (lineItem.taxes ?? [])
    .filter((tax) => tax.concept)
    .map((tax) => ({
      amount: negateAmount(tax.amount),
      baseAmount: negateAmount(tax.baseAmount),
      ...(tax.rate != null && { rate: tax.rate }),
      concept: tax.concept,
    }));

export const createRefundBillPayload = (bill: MappedBill, lineItem: LineItem) => {
  const itemUuid = getResourceUuid(lineItem.item);
  const billableServiceUuid = getResourceUuid(lineItem.billableService);
  const discounts = createRefundDiscounts(lineItem);
  const taxes = createRefundTaxes(lineItem);

  const lineItemToBeRefunded = {
    quantity: lineItem.quantity,
    price: -lineItem.price,
    priceName: lineItem.priceName,
    priceUuid: lineItem.priceUuid,
    lineItemOrder: lineItem.lineItemOrder,
    paymentStatus: PaymentStatus.CREDITED,
    ...(itemUuid && { item: itemUuid }),
    ...(billableServiceUuid && { billableService: billableServiceUuid }),
    ...(discounts.length > 0 && { discounts }),
    ...(taxes.length > 0 && { taxes }),
  };

  return {
    cashPoint: bill.cashPointUuid,
    cashier: bill.cashier.uuid,
    lineItems: [lineItemToBeRefunded],
    payments: [],
    patient: bill.patientUuid,
  };
};
