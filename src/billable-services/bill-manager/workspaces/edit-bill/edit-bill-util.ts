import type { BillLineItemDiscount } from '../../../../types';
import type { EditBillFormData } from './useEditBillFormSchema';

/** Request shape for create/update (no uuid). */
export type BillLineItemDiscountRequest = Pick<BillLineItemDiscount, 'amount' | 'baseAmount' | 'rate' | 'description' | 'sponsor'>;

/**
 * Build discounts array for create/update line item payload.
 * Shape: amount, baseAmount, rate?, description?, sponsor?
 */
function buildDiscountsFromFormData(
  data: EditBillFormData,
  price: number,
  quantity: number,
): BillLineItemDiscountRequest[] {
  const discountValue = typeof data.discountValue === 'number' ? data.discountValue : parseFloat(String(data.discountValue ?? 0)) || 0;
  if (discountValue <= 0) {
    return [];
  }
  const method = data.discountMethod ?? 'percentage';
  const baseAmount = price * quantity;
  const amount = method === 'percentage' ? (baseAmount * discountValue) / 100 : discountValue;
  const rate = method === 'percentage' ? discountValue / 100 : amount / baseAmount;
  const discount: BillLineItemDiscountRequest = {
    amount,
    baseAmount,
    rate,
    ...(data.discountDescription?.trim() && { description: data.discountDescription.trim() }),
    ...(data.provider?.uuid && { sponsor: data.provider.uuid }),
  };
  return [discount];
}

/**
 * Creates a payload for editing a bill by updating a specific line item
 * @param {LineItem} lineItem - The line item to be updated
 * @param {EditBillFormData} data - Form data (price, quantity, discountValue, discountMethod, etc.)
 * @param {Bill} bill - The original bill
 * @param {string} adjustmentReason - The adjustment reason
 * @returns {Object} The formatted payload for bill update
 */
export const createEditBillPayload = (lineItem, data: EditBillFormData, bill, adjustmentReason: string) => {
  if (!lineItem?.uuid || !bill?.lineItems) {
    throw new Error('Invalid input: lineItem and bill are required with valid properties');
  }

  const safeParseInt = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  };
  const safeParseFloat = (value, fallback) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  };

  const quantity = safeParseInt(data?.quantity, lineItem.quantity);
  const price = safeParseFloat(typeof data?.price === 'string' ? data.price : String(data?.price ?? ''), lineItem.price);
  const discounts = buildDiscountsFromFormData(data, price, quantity);

  const updatedLineItem = {
    ...lineItem,
    quantity,
    price,
    ...(discounts.length > 0 && { discounts }),
  };

  const toDiscountRequest = (d: BillLineItemDiscount, linePrice: number, lineQty: number): BillLineItemDiscountRequest => {
    const baseAmount = d.baseAmount ?? linePrice * lineQty;
    return {
      amount: d.amount,
      baseAmount,
      ...(d.rate != null && { rate: d.rate }),
      ...(d.description && { description: d.description }),
      ...(d.sponsor && { sponsor: d.sponsor }),
    };
  };

  const formatLineItem = (li) => {
    const base = {
      item: li.item,
      quantity: li.quantity,
      price: li.price,
      priceName: li.priceName,
      priceUuid: li.priceUuid,
      lineItemOrder: li.lineItemOrder,
      uuid: li.uuid,
      paymentStatus: li.paymentStatus,
    };
    if (li.uuid === lineItem.uuid && updatedLineItem.discounts) {
      return { ...base, discounts: updatedLineItem.discounts };
    }
    if (Array.isArray(li.discounts) && li.discounts.length > 0) {
      const discounts = li.discounts.map((d) => toDiscountRequest(d, li.price, li.quantity));
      return { ...base, discounts };
    }
    return base;
  };

  // Create the bill update payload
  const payload: any = {
    cashPoint: bill.cashPointUuid,
    cashier: bill.cashier.uuid,
    lineItems: bill.lineItems.map((li) => formatLineItem(li.uuid === lineItem.uuid ? updatedLineItem : li)),
    payments: bill.payments.map((payment) => ({
      dateCreated: payment.dateCreated,
      voided: payment.voided,
      resourceVersion: payment.resourceVersion,
      amount: payment.amount,
      amountTendered: payment.amountTendered,
      attributes: payment.attributes.map((attribute) => ({
        attributeType: attribute.attributeType?.uuid,
        value: attribute.value,
      })),
      instanceType: payment.instanceType.uuid,
    })),
    patient: bill.patientUuid,
    billAdjusted: bill.uuid,
    adjustmentReason,
  };

  // Only include status if it exists to avoid triggering rounding logic
  // when the status is a calculated value that differs from backend status
  if (bill.status !== undefined && bill.status !== null) {
    payload.status = bill.status;
  }

  return payload;
};
