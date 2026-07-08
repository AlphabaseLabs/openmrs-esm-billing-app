import { formatBillAmount } from '../../helpers';
import { type LineItem, PaymentStatus } from '../../types';

export type DiscountValidationResult =
  | {
      valid: true;
      amount: number;
    }
  | {
      valid: false;
      reason: 'invalid-number' | 'negative' | 'over-maximum';
    };

export type PercentDiscountValidationResult =
  | {
      valid: true;
      percent: number;
      amount: number;
    }
  | {
      valid: false;
      reason: 'invalid-number' | 'negative' | 'over-100';
    };

export const percentPrecision = 4;
const minimumVisiblePercent = 1 / 10 ** percentPrecision;

export const normalizeNumber = (value: number) => (Number.isFinite(value) ? value : 0);

export const roundMoneyAmount = (value: number) => Number(normalizeNumber(value).toFixed(2));

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

export const formatDiscountAmount = (value: number) => formatBillAmount(roundMoneyAmount(value));

export const formatDiscountPercent = (value: number) => {
  const percent = normalizeNumber(value);

  if (percent > 0 && percent < minimumVisiblePercent) {
    return `<${minimumVisiblePercent.toFixed(percentPrecision)}`;
  }

  return percent.toFixed(percentPrecision).replace(/\.?0+$/, '');
};

export const getLineDiscountMaximum = (lineItem: Pick<LineItem, 'price' | 'quantity'>) =>
  roundMoneyAmount(Math.max(0, Number(lineItem.price ?? 0) * Number(lineItem.quantity ?? 0)));

const bulkDiscountIncreaseStatuses = [PaymentStatus.PENDING, PaymentStatus.POSTED] as const;

export const isBulkDiscountableLineItem = (lineItem: LineItem) =>
  !lineItem.voided &&
  bulkDiscountIncreaseStatuses.includes(lineItem.paymentStatus as (typeof bulkDiscountIncreaseStatuses)[number]);

const getExistingLineDiscountAmount = (lineItem: LineItem) =>
  lineItem.discounts
    ? lineItem.discounts.reduce((total, discount) => total + (discount?.amount ?? 0), 0)
    : (lineItem.totalDiscount ?? 0);

const getBulkDiscountCurrentTotal = (lineItems: Array<LineItem>) =>
  lineItems
    .filter((lineItem) => !lineItem.voided)
    .reduce((total, lineItem) => total + getExistingLineDiscountAmount(lineItem), 0);

export const getBulkDiscountIncreaseCapacity = (lineItem: LineItem) => {
  if (!isBulkDiscountableLineItem(lineItem)) {
    return 0;
  }

  return roundMoneyAmount(
    Math.max(
      getLineDiscountMaximum(lineItem) - getExistingLineDiscountAmount(lineItem) - Number(lineItem.totalAllocated ?? 0),
      0,
    ),
  );
};

export const getBulkDiscountMaximum = (lineItems: Array<LineItem> = []) =>
  roundMoneyAmount(
    getBulkDiscountCurrentTotal(lineItems) +
      lineItems.reduce((total, lineItem) => total + getBulkDiscountIncreaseCapacity(lineItem), 0),
  );

export const validateFixedDiscountInput = (
  input: string | number | null | undefined,
  maximum: number,
): DiscountValidationResult => {
  const parsedAmount = typeof input === 'string' && input.trim() === '' ? 0 : parseEditableNumber(input);
  const roundedMaximum = roundMoneyAmount(maximum);

  if (parsedAmount === null) {
    return { valid: false, reason: 'invalid-number' };
  }

  const amount = roundMoneyAmount(parsedAmount);
  if (amount < 0) {
    return { valid: false, reason: 'negative' };
  }

  if (amount > roundedMaximum) {
    return { valid: false, reason: 'over-maximum' };
  }

  return { valid: true, amount };
};

export const validatePercentDiscountInput = (
  input: string | number | null | undefined,
  maximum: number,
): PercentDiscountValidationResult => {
  const parsedPercent = parseEditableNumber(input);

  if (parsedPercent === null) {
    return { valid: false, reason: 'invalid-number' };
  }

  const percent = normalizeNumber(parsedPercent);
  if (percent < 0) {
    return { valid: false, reason: 'negative' };
  }

  if (percent > 100) {
    return { valid: false, reason: 'over-100' };
  }

  return {
    valid: true,
    percent,
    amount: roundMoneyAmount((roundMoneyAmount(maximum) * percent) / 100),
  };
};
