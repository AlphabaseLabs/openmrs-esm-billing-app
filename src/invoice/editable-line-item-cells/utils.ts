import { type BillLineItemUpdate } from '../../billing.resource';
import { type BillableService, type LineItem, type MappedBill, PaymentStatus } from '../../types';
import {
  getBulkDiscountMaximum,
  getLineDiscountMaximum,
  isBulkDiscountableLineItem,
  parseEditableNumber,
  roundMoneyAmount,
} from './discount-amount-validation';

export { getBulkDiscountMaximum, getLineDiscountMaximum, parseEditableNumber, roundMoneyAmount };

export const getLineItemLabel = (lineItem: LineItem) => {
  const itemLabel = lineItem.item || lineItem.billableService || lineItem.display || '';
  const [, label] = itemLabel.split(':');
  return label || itemLabel || '--';
};

export const getLineItemSubtotal = (lineItem: LineItem) => getLineDiscountMaximum(lineItem);

export const getLineItemDiscountAmount = (lineItem: LineItem) =>
  lineItem.discounts
    ? lineItem.discounts.reduce((total, discount) => total + (discount?.amount ?? 0), 0)
    : (lineItem.totalDiscount ?? 0);

export const getLineItemTaxAmount = (lineItem: LineItem) =>
  (lineItem.taxes ?? []).reduce((total, tax) => total + (tax?.amount ?? 0), 0) ?? lineItem.totalTax ?? 0;

export const getLineItemTotal = (lineItem: LineItem) =>
  getLineItemSubtotal(lineItem) - getLineItemDiscountAmount(lineItem) + getLineItemTaxAmount(lineItem);

const roundLineItemAmount = roundMoneyAmount;

export const getLineItemAmountDue = (lineItem: LineItem) => {
  const total = Number(lineItem.total ?? getLineItemTotal(lineItem));
  const totalAllocated = Number(lineItem.totalAllocated ?? 0);
  return roundLineItemAmount(Math.max(total - totalAllocated, 0));
};

const isActiveLineItem = (lineItem: LineItem) => !lineItem.voided;

export const getBulkDiscountTotal = (lineItems: Array<LineItem> = []) =>
  roundLineItemAmount(
    lineItems.filter(isActiveLineItem).reduce((total, lineItem) => total + getLineItemDiscountAmount(lineItem), 0),
  );

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
        ...(rate !== undefined ? { rate } : {}),
        ...(sponsor ? { sponsor } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    ],
  };
};

const firstDiscountMetadata = (lineItem: LineItem) => {
  const discount = lineItem.discounts?.find((entry) => (entry?.amount ?? 0) > 0);

  return {
    sponsor: discount?.sponsor,
    description: discount?.description,
  };
};

const createDiscountsForAmount = (
  lineItem: LineItem,
  amount: number,
  sponsor?: string,
  description?: string,
): BillLineItemUpdate['discounts'] =>
  createDiscountUpdate(
    lineItem,
    roundLineItemAmount(amount),
    getLineItemSubtotal(lineItem) ? amount / getLineItemSubtotal(lineItem) : 0,
    sponsor,
    description,
  ).discounts ?? [];

const withLineItemDiscount = (lineItem: LineItem, amount: number, sponsor?: string, description?: string): LineItem =>
  recalculateLineItem({
    ...lineItem,
    discounts: createDiscountsForAmount(lineItem, amount, sponsor, description),
  });

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

export const recomputeBillWithLineItems = (bill: MappedBill, updatedLineItems: Array<LineItem>): MappedBill => {
  const updatedLineItemsByUuid = new Map(updatedLineItems.map((lineItem) => [lineItem.uuid, lineItem]));
  const lineItems = (bill.lineItems ?? []).map((lineItem) =>
    recalculateLineItem(updatedLineItemsByUuid.get(lineItem.uuid) ?? lineItem),
  );
  const totalAmountWithoutTaxAndDiscount = lineItems.reduce(
    (total, lineItem) => total + getLineItemSubtotal(lineItem),
    0,
  );
  const totalTax = lineItems.reduce((total, lineItem) => total + getLineItemTaxAmount(lineItem), 0);
  const billLineItemDiscounts = lineItems.reduce((total, lineItem) => total + getLineItemDiscountAmount(lineItem), 0);
  const totalAmount = totalAmountWithoutTaxAndDiscount + totalTax - billLineItemDiscounts;
  const totalActualPayments = bill.totalActualPayments ?? bill.totalPayments ?? bill.tenderedAmount ?? 0;
  const totalWaived = bill.totalWaived ?? 0;
  const totalDeposits = bill.totalDeposits ?? 0;
  const balance = totalAmount - totalActualPayments - totalWaived - totalDeposits;
  const totalSettled = totalActualPayments + totalWaived + totalDeposits;
  const status = balance <= 0 ? PaymentStatus.PAID : totalSettled > 0 ? PaymentStatus.POSTED : PaymentStatus.PENDING;

  return {
    ...bill,
    status,
    lineItems,
    totalAmount,
    totalTax,
    billLineItemDiscounts,
    totalDiscounts: billLineItemDiscounts,
    totalAmountWithoutTaxAndDiscount,
    balance,
  };
};

export const recomputeBillWithLineItem = (bill: MappedBill, updatedLineItem: LineItem): MappedBill =>
  recomputeBillWithLineItems(bill, [updatedLineItem]);

export type BulkDiscountLineItemUpdate = {
  lineItem: LineItem;
  updatedLineItem: LineItem;
  discounts: BillLineItemUpdate['discounts'];
};

export type BulkDiscountDraft = {
  bill: MappedBill;
  lineItemUpdates: Array<BulkDiscountLineItemUpdate>;
  remainingDelta: number;
};

const discountArrayKey = (discounts: BillLineItemUpdate['discounts'] = []) =>
  JSON.stringify(
    discounts.map((discount) => ({
      amount: roundLineItemAmount(Number(discount.amount ?? 0)),
      baseAmount: roundLineItemAmount(Number(discount.baseAmount ?? 0)),
      rate: discount.rate === undefined ? undefined : Number(discount.rate),
      description: discount.description ?? '',
      sponsor: discount.sponsor ?? '',
    })),
  );

export const getBulkDiscountLineItemUpdates = (
  currentBill: MappedBill,
  draftBill: MappedBill,
): Array<BulkDiscountLineItemUpdate> => {
  const currentLineItemsByUuid = new Map((currentBill.lineItems ?? []).map((lineItem) => [lineItem.uuid, lineItem]));

  return (draftBill.lineItems ?? []).flatMap((updatedLineItem) => {
    const currentLineItem = currentLineItemsByUuid.get(updatedLineItem.uuid);
    if (!currentLineItem) {
      return [];
    }

    const currentDiscounts = currentLineItem.discounts ?? [];
    const updatedDiscounts = updatedLineItem.discounts ?? [];

    if (discountArrayKey(currentDiscounts) === discountArrayKey(updatedDiscounts)) {
      return [];
    }

    return [
      {
        lineItem: currentLineItem,
        updatedLineItem,
        discounts: updatedDiscounts,
      },
    ];
  });
};

export const applyBulkDiscountDraft = (
  bill: MappedBill,
  targetBulkDiscount: number,
  options: { sponsor?: string; description?: string } = {},
): BulkDiscountDraft => {
  const currentBulkDiscount = getBulkDiscountTotal(bill.lineItems ?? []);
  let remainingDelta = roundLineItemAmount(targetBulkDiscount - currentBulkDiscount);
  const updatedLineItemsByUuid = new Map<string, LineItem>();
  const activeLineItems = (bill.lineItems ?? []).filter(isBulkDiscountableLineItem);

  if (remainingDelta > 0) {
    for (const lineItem of activeLineItems) {
      if (remainingDelta <= 0) {
        break;
      }

      const currentDiscount = getLineItemDiscountAmount(updatedLineItemsByUuid.get(lineItem.uuid) ?? lineItem);
      const capacity = roundLineItemAmount(Math.max(getLineItemSubtotal(lineItem) - currentDiscount, 0));
      if (capacity <= 0) {
        continue;
      }

      const amountToAdd = Math.min(capacity, remainingDelta);
      const nextDiscount = roundLineItemAmount(currentDiscount + amountToAdd);
      updatedLineItemsByUuid.set(
        lineItem.uuid,
        withLineItemDiscount(lineItem, nextDiscount, options.sponsor, options.description),
      );
      remainingDelta = roundLineItemAmount(remainingDelta - amountToAdd);
    }
  } else if (remainingDelta < 0) {
    let amountToRemove = Math.abs(remainingDelta);

    for (const status of [PaymentStatus.PENDING, PaymentStatus.POSTED, PaymentStatus.PAID]) {
      const linesForStatus = activeLineItems
        .filter((lineItem) => lineItem.paymentStatus === status)
        .slice()
        .reverse();

      for (const lineItem of linesForStatus) {
        if (amountToRemove <= 0) {
          break;
        }

        const currentLineItem = updatedLineItemsByUuid.get(lineItem.uuid) ?? lineItem;
        const currentDiscount = getLineItemDiscountAmount(currentLineItem);
        if (currentDiscount <= 0) {
          continue;
        }

        const amountToSubtract = Math.min(currentDiscount, amountToRemove);
        const nextDiscount = roundLineItemAmount(currentDiscount - amountToSubtract);
        const metadata = firstDiscountMetadata(currentLineItem);
        updatedLineItemsByUuid.set(
          lineItem.uuid,
          withLineItemDiscount(currentLineItem, nextDiscount, metadata.sponsor, metadata.description),
        );
        amountToRemove = roundLineItemAmount(amountToRemove - amountToSubtract);
      }
    }

    remainingDelta = amountToRemove > 0 ? -roundLineItemAmount(amountToRemove) : 0;
  }

  const updatedLineItems = (bill.lineItems ?? []).map(
    (lineItem) => updatedLineItemsByUuid.get(lineItem.uuid) ?? lineItem,
  );
  const draftBill = recomputeBillWithLineItems({ ...bill, lineItems: updatedLineItems }, updatedLineItems);

  return {
    bill: draftBill,
    lineItemUpdates: getBulkDiscountLineItemUpdates(bill, draftBill),
    remainingDelta,
  };
};
