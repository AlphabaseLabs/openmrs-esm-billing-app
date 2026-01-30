import { z } from 'zod';
import { type BillLineItemDiscount, type LineItem, type MappedBill } from '../../../../types';

const DISCOUNT_METHODS = ['percentage', 'fixed'] as const;
import { useMemo } from 'react';
import { useBillableServices } from '../../../billable-service.resource';
import { useTranslation } from 'react-i18next';

/**
 * Schema configuration for edit bill form validation
 * @constant
 */
const BILL_FORM_VALIDATION_RULES = {
  MINIMUM_PRICE: 0,
  MINIMUM_QUANTITY: 0,
  MINIMUM_REASON_LENGTH: 1,
  MINIMUM_DISCOUNT: 0,
} as const;

/**
 * Custom hook that returns the Zod schema for edit bill form validation
 * @returns {z.ZodObject} Zod schema for edit bill form
 */
export const useEditBillFormSchema = () => {
  const { t } = useTranslation();
  const billFormValidationSchema = z.object({
    price: z
      .string({ required_error: 'Price amount is required' })
      .refine((priceStr) => parseInt(priceStr) > BILL_FORM_VALIDATION_RULES.MINIMUM_PRICE, {
        message: t('priceShouldBeGreaterThanZero', 'Price should be greater than zero'),
      }),
    quantity: z
      .string({ required_error: 'Quantity amount is required' })
      .refine((quantityStr) => parseInt(quantityStr) > BILL_FORM_VALIDATION_RULES.MINIMUM_QUANTITY, {
        message: t('quantityShouldBeGreaterThanZero', 'Quantity should be greater than zero'),
      }),
    discountValue: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v === '' || v == null ? 0 : typeof v === 'number' ? v : parseFloat(v) || 0))
      .pipe(z.number().min(BILL_FORM_VALIDATION_RULES.MINIMUM_DISCOUNT)),
    discountMethod: z.enum(DISCOUNT_METHODS).optional().default('percentage'),
    discountDescription: z.string().optional(),
    provider: z.object({ id: z.string(), uuid: z.string(), label: z.string() }).optional().nullable(),
    adjustmentReason: z
      .string()
      .min(BILL_FORM_VALIDATION_RULES.MINIMUM_REASON_LENGTH, {
        message: t('adjustmentReasonIsRequired', 'Adjustment reason is required'),
      })
      .trim(),
  });

  return billFormValidationSchema;
};

/** Type definition for edit bill form data based on the schema */
export type EditBillFormData = z.infer<ReturnType<typeof useEditBillFormSchema>>;

/**
 * Custom hook that returns default values for edit bill form
 * @param {LineItem} billLineItem - The line item containing price and quantity
 * @param {MappedBill} existingBill - The bill containing adjustment reason
 * @returns {EditBillFormData} Default form values
 */
function getDefaultDiscountFromLineItem(lineItem: LineItem): { discountValue: number; discountMethod: 'percentage' | 'fixed' } {
  const first = (lineItem?.discounts ?? [])[0] as BillLineItemDiscount | undefined;
  if (!first || first.amount == null) {
    return { discountValue: 0, discountMethod: 'percentage' };
  }
  if (first.rate != null && first.rate > 0) {
    return { discountValue: Math.round(first.rate * 100), discountMethod: 'percentage' };
  }
  return { discountValue: first.amount, discountMethod: 'fixed' };
}

/** Sponsor UUID from line item's first discount (for pre-selecting provider when options load). */
export function getDiscountSponsorFromLineItem(lineItem: LineItem): string | undefined {
  const first = (lineItem?.discounts ?? [])[0] as BillLineItemDiscount | undefined;
  return first?.sponsor;
}

export const useDefaultEditBillFormValues = (billLineItem: LineItem, existingBill: MappedBill): EditBillFormData => {
  const { discountValue, discountMethod } = getDefaultDiscountFromLineItem(billLineItem);
  const firstDiscount = (billLineItem?.discounts ?? [])[0] as BillLineItemDiscount | undefined;

  return {
    price: billLineItem?.price.toString(),
    quantity: billLineItem?.quantity.toString(),
    discountValue,
    discountMethod,
    discountDescription: firstDiscount?.description ?? '',
    provider: null,
    adjustmentReason: existingBill?.adjustmentReason,
  };
};

/**
 * Custom hook that provides initial values for the form based on line item and billable services
 * @param {LineItem} billLineItem - The line item to initialize the form with
 * @returns {Object} Object containing selected service price, loading state, and selected billable service
 */
export const useFormInitialValues = (billLineItem: LineItem) => {
  const { billableServices, isLoading: isLoadingServices } = useBillableServices();

  const selectedBillableService = useMemo(() => {
    const billableServiceId = billLineItem?.billableService?.split(':')[0];
    return billableServiceId ? billableServices.find((service) => service.uuid === billableServiceId) ?? null : null;
  }, [billableServices, billLineItem.billableService]);

  const selectedServicePrice = useMemo(() => {
    if (!selectedBillableService?.servicePrices) {
      return null;
    }

    return (
      selectedBillableService.servicePrices.find(
        (servicePrice) => servicePrice.price.toString() === billLineItem.price.toString(),
      ) ?? null
    );
  }, [selectedBillableService, billLineItem.price]);

  return {
    selectedServicePrice,
    isLoadingServices,
    selectedBillableService,
  };
};
