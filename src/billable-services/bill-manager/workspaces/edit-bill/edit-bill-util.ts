import type { BillLineItemUpdate } from '../../../../billing.resource';
import type { BillLineItemDiscount, LineItem } from '../../../../types';
import type { EditBillFormData } from './useEditBillFormSchema';

/** Request shape for create/update (no uuid). */
export type BillLineItemDiscountRequest = Pick<
  BillLineItemDiscount,
  'amount' | 'baseAmount' | 'rate' | 'description' | 'sponsor'
>;

/**
 * Build discounts array for create/update line item payload.
 * Shape: amount, baseAmount, rate?, description?, sponsor?
 */
function buildDiscountsFromFormData(
  data: EditBillFormData,
  price: number,
  quantity: number,
): BillLineItemDiscountRequest[] {
  const discountValue =
    typeof data.discountValue === 'number' ? data.discountValue : parseFloat(String(data.discountValue ?? 0)) || 0;
  if (discountValue <= 0) {
    return [];
  }
  const method = data.discountMethod ?? 'percentage';
  const baseAmount = price * quantity;
  const amount = method === 'percentage' ? (baseAmount * discountValue) / 100 : discountValue;
  const discount: BillLineItemDiscountRequest = {
    amount,
    baseAmount,
    ...(method === 'percentage' && { rate: discountValue / 100 }),
    description: method === 'percentage' ? 'percentage' : 'value',
    ...(data.provider?.uuid && { sponsor: data.provider.uuid }),
  };
  return [discount];
}

const safeParseInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
};

const safeParseFloat = (value, fallback) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

const toDiscountRequest = (
  d: BillLineItemDiscount,
  linePrice: number,
  lineQty: number,
): BillLineItemDiscountRequest => {
  const baseAmount = d.baseAmount ?? linePrice * lineQty;
  return {
    amount: d.amount,
    baseAmount,
    ...(d.rate != null && { rate: d.rate }),
    ...(d.description && { description: d.description }),
    ...(d.sponsor && { sponsor: d.sponsor }),
  };
};

const normalizeDiscounts = (discounts: BillLineItemDiscountRequest[] = []) =>
  discounts.map((discount) => ({
    amount: discount.amount,
    baseAmount: discount.baseAmount,
    rate: discount.rate,
    description: discount.description,
    sponsor: discount.sponsor,
  }));

const areDiscountsEqual = (first: BillLineItemDiscountRequest[], second: BillLineItemDiscountRequest[]) =>
  JSON.stringify(normalizeDiscounts(first)) === JSON.stringify(normalizeDiscounts(second));

/**
 * Creates a minimal payload for editing an existing bill line item.
 * Only changed line-item fields are included.
 */
export const createEditBillLineItemPayload = (lineItem: LineItem, data: EditBillFormData): BillLineItemUpdate => {
  if (!lineItem?.uuid) {
    throw new Error('Invalid input: lineItem is required with a valid uuid');
  }

  const quantity = safeParseInt(data?.quantity, lineItem.quantity);
  const price = safeParseFloat(
    typeof data?.price === 'string' ? data.price : String(data?.price ?? ''),
    lineItem.price,
  );
  const discounts = buildDiscountsFromFormData(data, price, quantity);
  const existingDiscounts = (lineItem.discounts ?? []).map((discount) =>
    toDiscountRequest(discount, lineItem.price, lineItem.quantity),
  );
  const payload: BillLineItemUpdate = {};

  if (quantity !== lineItem.quantity) {
    payload.quantity = quantity;
  }

  if (price !== lineItem.price) {
    payload.price = price;
  }

  if (data.priceName && data.priceName !== lineItem.priceName) {
    payload.priceName = data.priceName;
  }

  if (data.priceUuid && data.priceUuid !== lineItem.priceUuid) {
    payload.priceUuid = data.priceUuid;
  }

  if (!areDiscountsEqual(discounts, existingDiscounts)) {
    payload.discounts = discounts;
  }

  return payload;
};
