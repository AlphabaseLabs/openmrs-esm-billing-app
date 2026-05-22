import { useMemo } from 'react';
import { z } from 'zod';
import { type MappedBill } from '../types';

export function usePaymentSchema(bill: MappedBill) {
  const balance = bill.balance ?? 0;

  return useMemo(
    () =>
      z
        .object({
          method: z
            .object({
              uuid: z.string(),
              name: z.string(),
              attributeTypes: z.array(
                z.object({
                  uuid: z.string(),
                  description: z.string(),
                  required: z.boolean(),
                }),
              ),
            })
            .nullable()
            .refine((value) => value !== null, { message: 'Payment method is required' }),
          amount: z
            .number({ invalid_type_error: 'Amount is required', required_error: 'Amount is required' })
            .positive('Amount is required')
            .refine((value) => value <= balance, 'Amount paid should not be greater than amount due'),
          referenceCode: z.string().optional().default(''),
          preferredPaymentMethodName: z.string().optional(),
          clientPaymentId: z.string().optional(),
          aiSource: z
            .object({
              type: z.literal('ai_attachment'),
              documentId: z.string(),
              sourcePaymentId: z.string().optional(),
            })
            .nullable()
            .optional(),
        })
        .superRefine((data, context) => {
          const requiresReferenceCode = data.method?.attributeTypes.some((attribute) => attribute.required) ?? false;

          if (requiresReferenceCode && !data.referenceCode?.trim()) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Reference code is required for this payment method',
              path: ['referenceCode'],
            });
          }
        }),
    [balance],
  );
}
