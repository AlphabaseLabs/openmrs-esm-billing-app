import dayjs from 'dayjs';
import { type Payment, type LineItem } from '../types';
import { formatCurrency, getCurrentLocale } from './currency';

// amount already paid
export function calculateTotalAmountTendered(payments: Array<Payment>) {
  return Array.isArray(payments)
    ? payments.reduce((totalAmount, item) => {
        // Ensure that "amount" property is present and numeric
        if (typeof item.amount === 'number' && item.voided !== true) {
          return totalAmount + item.amount;
        }
        return totalAmount;
      }, 0)
    : 0;
}

// balance
export function calculateTotalBalance(lineItems: Array<LineItem>, payments: Array<Payment>) {
  return Math.min(this.calculateTotalAmount(lineItems) - this.calculateTotalAmountTendered(payments));
}

// total bill
export function calculateTotalAmount(lineItems: Array<LineItem>) {
  return Array.isArray(lineItems)
    ? lineItems.reduce((totalAmount, item) => {
        // Ensure that "price" and "quantity" properties are present and numeric
        if (typeof item.price === 'number' && typeof item.quantity === 'number' && item.voided !== true) {
          return totalAmount + item.price * item.quantity;
        }
        return totalAmount;
      }, 0)
    : 0;
}

export const convertToCurrency = (amountToConvert: number, currencyType?: string) => {
  return formatCurrency(amountToConvert);
};

export const formatBillAmount = (amountToFormat?: number | null) => {
  if (typeof amountToFormat !== 'number' || Number.isNaN(amountToFormat)) {
    return '--';
  }

  const roundedAmount = Number(amountToFormat.toFixed(2));
  const hasDecimalPlaces = !Number.isInteger(roundedAmount);

  return new Intl.NumberFormat(getCurrentLocale(), {
    minimumFractionDigits: hasDecimalPlaces ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(roundedAmount);
};

export const formatBillDateTime = (date?: string | Date | null) => {
  if (!date) {
    return '--';
  }

  return dayjs(date).format('DD-MMM-YYYY, hh:mm A');
};

export const formatInvoiceDate = (date?: string | Date | null) => {
  if (!date) {
    return '--';
  }

  const dateValue = dayjs(date);
  return dateValue.isSame(dayjs(), 'day') ? `Today, ${dateValue.format('hh:mm A')}` : dateValue.format('DD-MMM-YYYY');
};

export const getGender = (gender: string, t) => {
  switch (gender) {
    case 'male':
      return t('male', 'Male');
    case 'female':
      return t('female', 'Female');
    case 'other':
      return t('other', 'Other');
    case 'unknown':
      return t('unknown', 'Unknown');
    default:
      return gender;
  }
};

/**
 * Extracts and returns the substring after the first colon (:) in the input string.
 * If there's no colon or the input is invalid, returns the original string.
 * The input string is typically in the format "uuid:string".
 *
 * @param {string} input - The input string from which the substring is to be extracted.
 * @returns {string} The substring found after the first colon, or the original string if no colon is present.
 */
export function extractString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const parts = input.split(':');
  return parts.length > 1 ? parts[1] : input;
}

// cleans the provider display name
export function extractNameString(formattedString: string) {
  if (!formattedString) {
    return '';
  }
  const parts = formattedString.split(' - ');
  return parts.length > 1 ? parts[1] : '';
}

export function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD');
}
