import { type BillLineItemUpdate } from '../../billing.resource';
import { type BillableService, type LineItem, type MappedBill, PaymentStatus } from '../../types';

export const parseEditableNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalizedValue = String(value).replace(/,/g, '').trim();
  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

export const getLineItemLabel = (lineItem: LineItem) => {
  const itemLabel = lineItem.item || lineItem.billableService || lineItem.display || '';
  const [, label] = itemLabel.split(':');
  return label || itemLabel || '--';
};

export const getLineItemSubtotal = (lineItem: LineItem) => (lineItem.price ?? 0) * (lineItem.quantity ?? 0);

export const getLineItemDiscountAmount = (lineItem: LineItem) =>
  (lineItem.discounts ?? []).reduce((total, discount) => total + (discount?.amount ?? 0), 0) ??
  lineItem.totalDiscount ??
  0;

export const getLineItemTaxAmount = (lineItem: LineItem) =>
  (lineItem.taxes ?? []).reduce((total, tax) => total + (tax?.amount ?? 0), 0) ?? lineItem.totalTax ?? 0;

export const getLineItemTotal = (lineItem: LineItem) =>
  getLineItemSubtotal(lineItem) - getLineItemDiscountAmount(lineItem) + getLineItemTaxAmount(lineItem);

const roundLineItemAmount = (value: number) => parseFloat(value.toFixed(2));

export const getLineItemAmountDue = (lineItem: LineItem) => {
  const total = Number(lineItem.total ?? getLineItemTotal(lineItem));
  const totalAllocated = Number(lineItem.totalAllocated ?? 0);
  return roundLineItemAmount(Math.max(total - totalAllocated, 0));
};

export const getLineItemPaymentStatus = (lineItem: LineItem) => {
  if (
    lineItem.paymentStatus === PaymentStatus.EXEMPTED ||
    lineItem.paymentStatus === PaymentStatus.CANCELLED ||
    lineItem.paymentStatus === PaymentStatus.ADJUSTED
  ) {
    return lineItem.paymentStatus;
  }

  const total = Number(lineItem.total ?? getLineItemTotal(lineItem));
  const totalAllocated = Number(lineItem.totalAllocated ?? 0);

  if (total <= 0 || totalAllocated >= total) {
    return PaymentStatus.PAID;
  }

  return totalAllocated > 0 ? PaymentStatus.POSTED : PaymentStatus.PENDING;
};

export const canEditLineItem = (lineItem: LineItem, isBillFinalized?: boolean) =>
  !isBillFinalized &&
  lineItem.paymentStatus !== PaymentStatus.EXEMPTED &&
  lineItem.paymentStatus !== PaymentStatus.CANCELLED &&
  lineItem.paymentStatus !== PaymentStatus.ADJUSTED;

export const findServiceForLineItem = (lineItem: LineItem, billableServices: Array<BillableService>) =>
  billableServices.find((service) => {
    const serviceTokens = [service.uuid, service.name, service.shortName].filter(Boolean);
    const lineItemTokens = [lineItem.billableService, lineItem.item, lineItem.display].filter(Boolean).join(' ');
    return serviceTokens.some((token) => lineItemTokens.includes(`${token}`));
  });

export const findSelectedServicePrice = (lineItem: LineItem, service?: BillableService) =>
  service?.servicePrices?.find(
    (priceOption) =>
      priceOption.uuid === lineItem.priceUuid ||
      priceOption.name === lineItem.priceName ||
      Number(priceOption.price) === Number(lineItem.price),
  );

export const createPriceUpdate = (
  price: number,
  priceOption?: BillableService['servicePrices'][number],
): BillLineItemUpdate => ({
  price,
  priceName: priceOption?.name,
  priceUuid: priceOption?.uuid,
});

export const createDiscountUpdate = (
  lineItem: LineItem,
  amount: number,
  rate?: number,
  sponsor?: string,
  description?: string,
): BillLineItemUpdate => {
  if (amount <= 0) {
    return { discounts: [] };
  }

  return {
    discounts: [
      {
        amount,
        baseAmount: getLineItemSubtotal(lineItem),
        rate,
        sponsor,
        description,
      },
    ],
  };
};

export const recalculateLineItem = (lineItem: LineItem): LineItem => {
  const recalculatedLineItem = {
    ...lineItem,
    amount: getLineItemSubtotal(lineItem),
    totalDiscount: getLineItemDiscountAmount(lineItem),
    totalTax: getLineItemTaxAmount(lineItem),
    total: getLineItemTotal(lineItem),
  };

  return {
    ...recalculatedLineItem,
    paymentStatus: getLineItemPaymentStatus(recalculatedLineItem),
  };
};

export const recomputeBillWithLineItem = (bill: MappedBill, updatedLineItem: LineItem): MappedBill => {
  const lineItems = (bill.lineItems ?? []).map((lineItem) =>
    lineItem.uuid === updatedLineItem.uuid ? recalculateLineItem(updatedLineItem) : recalculateLineItem(lineItem),
  );
  const totalAmountWithoutTaxAndDiscount = lineItems.reduce(
    (total, lineItem) => total + getLineItemSubtotal(lineItem),
    0,
  );
  const totalTax = lineItems.reduce((total, lineItem) => total + getLineItemTaxAmount(lineItem), 0);
  const billLineItemDiscounts = lineItems.reduce((total, lineItem) => total + getLineItemDiscountAmount(lineItem), 0);
  const totalAmount = totalAmountWithoutTaxAndDiscount + totalTax - billLineItemDiscounts;
  const totalActualPayments = bill.totalActualPayments ?? bill.totalPayments ?? bill.tenderedAmount ?? 0;
  const balance = totalAmount - totalActualPayments;
  const status =
    balance <= 0 ? PaymentStatus.PAID : totalActualPayments > 0 ? PaymentStatus.POSTED : PaymentStatus.PENDING;

  return {
    ...bill,
    status,
    lineItems,
    totalAmount,
    totalTax,
    billLineItemDiscounts,
    totalDiscounts: billLineItemDiscounts + (bill.totalWaived ?? 0),
    totalAmountWithoutTaxAndDiscount,
    balance,
  };
};
