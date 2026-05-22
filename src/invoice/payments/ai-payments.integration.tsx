import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@carbon/react';
import { TrashCan } from '@carbon/react/icons';
import {
  launchWorkspace2,
  navigate,
  openmrsFetch,
  showSnackbar,
  useConfig,
  useSession,
  type Session,
} from '@openmrs/esm-framework';
import { useFieldArray, type FieldArrayWithId, type UseFormReturn } from 'react-hook-form';
import { mutate } from 'swr';
import { addPaymentToBill } from '../../billing.resource';
import { type BillingConfig } from '../../config-schema';
import { extractErrorMessagesFromResponse } from '../../utils';
import {
  type AiPaymentSource,
  type FormPayment,
  type MappedBill,
  type PaymentFormValue,
  type PaymentMethod,
} from '../../types';

export interface BillingInvoiceContext {
  patientUuid: string;
  billUuid: string;
}

export interface AiPaymentDraft {
  invoice: BillingInvoiceContext;
  amount: number;
  referenceCode: string;
  paymentMethodName: string;
  sourceDocumentId: string;
  sourcePaymentId?: string;
}

type UseAiPaymentsIntegrationParams = {
  bill: MappedBill;
  formMethods: UseFormReturn<PaymentFormValue>;
  paymentModes: Array<PaymentMethod>;
};

type Translate = (key: string, defaultValue: string, values?: Record<string, unknown>) => string;
type BillingPaymentPayload = Parameters<typeof addPaymentToBill>[1];

const aiAgentPaymentsWorkspaceName = 'ai-agent-payments-workspace';
const pendingAiPaymentsStorageKey = 'billing-ai-pending-payments';

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

function toTrimmedString(value?: string | null) {
  return value?.trim() ?? '';
}

function getPaymentAmount(row?: Pick<FormPayment, 'amount'> | null) {
  return Number(row?.amount ?? 0);
}

function createStableId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `ai-payment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isAiPaymentSource(value: FormPayment['aiSource']): value is AiPaymentSource {
  return Boolean(value?.type === 'ai_attachment' && value.documentId?.trim());
}

function hasReferenceValue(row?: Pick<FormPayment, 'referenceCode'> | null) {
  return Boolean(toTrimmedString(row?.referenceCode));
}

function isReplaceableInitialPaymentRow(row?: FormPayment | null) {
  return getPaymentAmount(row) === 0 && !hasReferenceValue(row) && !isAiPaymentSource(row?.aiSource);
}

function isPlaceholderPaymentRow(row?: FormPayment | null) {
  return !row?.method && isReplaceableInitialPaymentRow(row);
}

function hasOnlyReplaceableInitialPaymentRow(rows: Array<FormPayment>) {
  return rows.length === 1 && isReplaceableInitialPaymentRow(rows[0]);
}

function readPendingAiPaymentDrafts(): Array<AiPaymentDraft> {
  if (typeof window === 'undefined') {
    return [];
  }

  const rawValue = window.sessionStorage.getItem(pendingAiPaymentsStorageKey);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Array<Partial<AiPaymentDraft>>;

    return parsedValue.filter((draft): draft is AiPaymentDraft =>
      Boolean(
        draft?.invoice?.billUuid &&
        draft.invoice?.patientUuid &&
        typeof draft.amount === 'number' &&
        Number.isFinite(draft.amount) &&
        draft.sourceDocumentId &&
        draft.paymentMethodName,
      ),
    );
  } catch {
    return [];
  }
}

function writePendingAiPaymentDrafts(drafts: Array<AiPaymentDraft>) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!drafts.length) {
    window.sessionStorage.removeItem(pendingAiPaymentsStorageKey);
    return;
  }

  window.sessionStorage.setItem(pendingAiPaymentsStorageKey, JSON.stringify(drafts));
}

function enqueuePendingAiPaymentDraft(draft: AiPaymentDraft) {
  const drafts = readPendingAiPaymentDrafts();
  drafts.push(draft);
  writePendingAiPaymentDrafts(drafts);
}

function takePendingAiPaymentDraftsForBill(billUuid: string) {
  const drafts = readPendingAiPaymentDrafts();
  const matchedDrafts = drafts.filter((draft) => draft.invoice.billUuid === billUuid);
  writePendingAiPaymentDrafts(drafts.filter((draft) => draft.invoice.billUuid !== billUuid));
  return matchedDrafts;
}

function findPaymentMethodByName(paymentModes: Array<PaymentMethod>, preferredPaymentMethodName?: string | null) {
  const normalizedPreferredName = normalizeText(preferredPaymentMethodName);

  if (normalizedPreferredName) {
    const exactMatch = paymentModes.find((mode) => normalizeText(mode.name) === normalizedPreferredName);

    if (exactMatch) {
      return exactMatch;
    }
  }

  const cashMatch = paymentModes.find((mode) => normalizeText(mode.name) === 'cash');
  return cashMatch ?? paymentModes[0] ?? null;
}

function createEmptyPaymentRow(preferredPaymentMethodName = ''): FormPayment {
  return {
    amount: undefined,
    method: null,
    referenceCode: '',
    preferredPaymentMethodName,
    clientPaymentId: createStableId(),
    aiSource: null,
  };
}

function createAiPaymentRow(draft: AiPaymentDraft, paymentModes: Array<PaymentMethod>): FormPayment {
  return {
    amount: draft.amount,
    method: findPaymentMethodByName(paymentModes, draft.paymentMethodName),
    referenceCode: draft.referenceCode,
    preferredPaymentMethodName: draft.paymentMethodName,
    clientPaymentId: createStableId(),
    aiSource: {
      type: 'ai_attachment',
      documentId: draft.sourceDocumentId,
      sourcePaymentId: draft.sourcePaymentId,
    },
  };
}

function buildBillingPaymentAttributes(row: FormPayment) {
  const referenceCode = toTrimmedString(row.referenceCode);

  if (!referenceCode) {
    return [];
  }

  return (
    row.method?.attributeTypes?.flatMap((attribute) =>
      attribute.uuid
        ? [
            {
              attributeType: attribute.uuid,
              value: referenceCode,
            },
          ]
        : [],
    ) ?? []
  );
}

function buildBillingPaymentPayload(row: FormPayment): BillingPaymentPayload {
  const amountTendered = getPaymentAmount(row);

  return {
    amount: amountTendered,
    amountTendered,
    attributes: buildBillingPaymentAttributes(row),
    instanceType: row.method?.uuid,
  };
}

function requiresReferenceCode(row: FormPayment) {
  return row.method?.attributeTypes?.some((attribute) => attribute.required) ?? false;
}

function isProcessablePaymentRow(row: FormPayment) {
  return Boolean(row.method && getPaymentAmount(row) > 0 && (!requiresReferenceCode(row) || hasReferenceValue(row)));
}

function buildAiDocumentUpdateUrl(apiBaseUrl: string) {
  const normalizedBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`;
  return /^https?:\/\//i.test(normalizedBaseUrl)
    ? new URL('ai-agent/attachment', normalizedBaseUrl).toString()
    : `${normalizedBaseUrl}ai-agent/attachment`;
}

function buildAiDocumentUpdatePayload(
  bill: MappedBill,
  currentUserUuid: string,
  row: FormPayment,
  billingPaymentPayload: BillingPaymentPayload,
) {
  if (!isAiPaymentSource(row.aiSource)) {
    return null;
  }

  const referenceAttributes = billingPaymentPayload.attributes
    .filter((attribute) => attribute.value?.trim())
    .map((attribute) => ({
      attributeType: {
        uuid: attribute.attributeType,
      },
      value: attribute.value,
    }));

  return {
    id: row.aiSource.documentId,
    category: 'payment_receipt' as const,
    processing_status: 'processed' as const,
    processed_by: currentUserUuid || null,
    processed_at: new Date().toISOString(),
    emr: 'openmrs',
    emr_mapping_type: 'bill' as const,
    emr_mapping: bill.uuid,
    billing_payments: {
      billUuid: bill.uuid,
      instanceType: billingPaymentPayload.instanceType,
      amount: billingPaymentPayload.amount,
      amountTendered: billingPaymentPayload.amountTendered,
      attributes: referenceAttributes.length ? referenceAttributes : undefined,
    },
  };
}

async function updateAiPaymentAttachment(
  apiBaseUrl: string,
  bill: MappedBill,
  currentUserUuid: string,
  row: FormPayment,
  billingPaymentPayload: BillingPaymentPayload,
) {
  const payload = buildAiDocumentUpdatePayload(bill, currentUserUuid, row, billingPaymentPayload);

  if (!payload) {
    return;
  }

  await openmrsFetch(buildAiDocumentUpdateUrl(apiBaseUrl), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: payload,
  });
}

function getCurrentUserUuid(session: Session | null | undefined) {
  return session?.user?.uuid?.trim() ?? '';
}

function getCurrentInvoiceContext(bill: MappedBill): BillingInvoiceContext {
  return {
    billUuid: bill.uuid,
    patientUuid: bill.patientUuid,
  };
}

function navigateToInvoice(invoice: BillingInvoiceContext) {
  navigate({
    to: `${window.getOpenmrsSpaBase()}home/billing/patient/${invoice.patientUuid}/${invoice.billUuid}`,
  });
}

function removeProcessedRows(
  rows: Array<FormPayment>,
  processedClientPaymentIds: Set<string>,
  defaultPaymentMethodName: string,
) {
  const remainingRows = rows.filter((row) => !processedClientPaymentIds.has(row.clientPaymentId ?? ''));
  return remainingRows.length ? remainingRows : [createEmptyPaymentRow(defaultPaymentMethodName)];
}

function applyAiPaymentRows(
  drafts: Array<AiPaymentDraft>,
  paymentModes: Array<PaymentMethod>,
  getValues: UseFormReturn<PaymentFormValue>['getValues'],
  replace: (value: Array<FormPayment>) => void,
  append: (value: FormPayment | Array<FormPayment>) => void,
) {
  if (!drafts.length) {
    return;
  }

  const nextRows = drafts.map((draft) => createAiPaymentRow(draft, paymentModes));
  const currentRows = getValues('payment');

  if (hasOnlyReplaceableInitialPaymentRow(currentRows)) {
    replace(nextRows);
    return;
  }

  append(nextRows);
}

function refreshBillPayments(billUuid: string) {
  return mutate((key) => typeof key === 'string' && key.startsWith(`/ws/rest/v1/cashier/bill/${billUuid}`));
}

const AiPaymentsHeaderAction: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button aria-label="Open AI payments workspace" className="billing-ai-title-action" onClick={onClick} type="button">
    <span className="billing-ai-title-action-icon-wrapper">
      <AiAgentIcon />
    </span>
  </button>
);

const AiAgentIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    className="billing-ai-agent-icon"
    fill="none"
    focusable="false"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 512 480.24"
    xmlns="http://www.w3.org/2000/svg">
    <defs>
      <path
        d="M193.38 382.9c-76.59 28.86-69.65 18.21-96.71 97.34C69.63 401.11 76.59 411.76 0 382.9c76.59-28.81 69.63-18.15 96.67-97.31 27.06 79.16 20.12 68.5 96.71 97.31z"
        id="billingAiBottomSparkleShape"
      />

      <radialGradient cx="50%" cy="50%" id="billingAiBrightBlueInnerGlow" r="70%">
        <stop offset="0%" stopColor="#A8F6FF" stopOpacity="1" />
        <stop offset="35%" stopColor="#00D9FF" stopOpacity="1" />
        <stop offset="70%" stopColor="#008CFF" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#005CFF" stopOpacity="0.75" />
      </radialGradient>

      <filter height="260%" id="billingAiStrongBlueGlow" width="260%" x="-80%" y="-80%">
        <feGaussianBlur result="blur" stdDeviation="14" />
        <feFlood floodColor="#00BFFF" floodOpacity="1" result="blue" />
        <feComposite in="blue" in2="blur" operator="in" result="coloredGlow" />
        <feMerge>
          <feMergeNode in="coloredGlow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g transform="translate(-49.08 0)">
      <path
        d="M512 220.6c-163.88 61.72-149.02 38.94-206.92 208.29-57.91-169.35-43.06-146.57-206.92-208.26 163.86-61.72 149.01-38.95 206.92-208.3C362.98 181.68 348.12 158.91 512 220.6z"
        fill="var(--brand-03, #007d79)"
        fillRule="nonzero"
      />
    </g>
    <g transform="translate(320 72) scale(0.85)">
      <use fill="#FFFFFF" href="#billingAiBottomSparkleShape" />
      <use
        className="billing-ai-secondary-sparkle-glow"
        fill="#00BFFF"
        filter="url(#billingAiStrongBlueGlow)"
        href="#billingAiBottomSparkleShape"
      />
      <use
        className="billing-ai-secondary-sparkle-fill"
        fill="url(#billingAiBrightBlueInnerGlow)"
        href="#billingAiBottomSparkleShape"
      />
    </g>
  </svg>
);

export function useAiPaymentsIntegration({ bill, formMethods, paymentModes }: UseAiPaymentsIntegrationParams): {
  fields: Array<FieldArrayWithId<PaymentFormValue, 'payment', 'id'>>;
  isSubmittingPayments: boolean;
  launchAiPaymentsWorkspace: () => void;
  processPayments: (t: Translate) => Promise<void>;
  removePaymentRow: (index: number) => void;
} {
  const { aiAgentApiBaseUrl, defaultPaymentMethodName } = useConfig<BillingConfig>();
  const currentUserUuid = getCurrentUserUuid(useSession());
  const { control, getValues, reset, setValue, trigger } = formMethods;
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'payment',
  });
  const [isSubmittingPayments, setIsSubmittingPayments] = useState(false);

  const currentInvoiceContext = useMemo(() => getCurrentInvoiceContext(bill), [bill]);

  useEffect(() => {
    const persistedDrafts = takePendingAiPaymentDraftsForBill(bill.uuid);

    if (persistedDrafts.length) {
      applyAiPaymentRows(persistedDrafts, paymentModes, getValues, replace, append);
      void trigger();
    }
  }, [append, bill.uuid, getValues, paymentModes, replace, trigger]);

  useEffect(() => {
    if (!paymentModes.length) {
      return;
    }

    getValues('payment').forEach((row, index) => {
      if (row.method) {
        return;
      }

      const resolvedMethod = findPaymentMethodByName(
        paymentModes,
        row.preferredPaymentMethodName || defaultPaymentMethodName,
      );

      if (resolvedMethod) {
        setValue(`payment.${index}.method`, resolvedMethod, {
          shouldDirty: false,
          shouldValidate: true,
        });
      }
    });
  }, [defaultPaymentMethodName, fields.length, getValues, paymentModes, setValue]);

  const queueAiPaymentDraft = useCallback(
    (draft: AiPaymentDraft) => {
      if (draft.invoice.billUuid !== currentInvoiceContext.billUuid) {
        enqueuePendingAiPaymentDraft(draft);
        navigateToInvoice(draft.invoice);
        return;
      }

      applyAiPaymentRows([draft], paymentModes, getValues, replace, append);
      void trigger();
    },
    [append, currentInvoiceContext.billUuid, getValues, paymentModes, replace, trigger],
  );

  const launchAiPaymentsWorkspace = useCallback(() => {
    void launchWorkspace2(aiAgentPaymentsWorkspaceName, {
      currentInvoiceContext,
      onAddPaymentDraft: queueAiPaymentDraft,
    });
  }, [currentInvoiceContext, queueAiPaymentDraft]);

  const processPayments = useCallback(
    async (t: Translate) => {
      if (isSubmittingPayments) {
        return;
      }

      const rowsToProcess = getValues('payment').filter((row) => !isPlaceholderPaymentRow(row));

      if (!rowsToProcess.length) {
        return;
      }

      if (rowsToProcess.some((row) => !isProcessablePaymentRow(row))) {
        await trigger();
        return;
      }

      setIsSubmittingPayments(true);

      const processedClientPaymentIds = new Set<string>();
      let processedPaymentsCount = 0;
      let attachmentUpdateFailures = 0;

      try {
        for (const row of rowsToProcess) {
          const paymentPayload = buildBillingPaymentPayload(row);
          await addPaymentToBill(bill.uuid, paymentPayload);
          processedPaymentsCount += 1;

          if (row.clientPaymentId) {
            processedClientPaymentIds.add(row.clientPaymentId);
          }

          if (isAiPaymentSource(row.aiSource)) {
            try {
              await updateAiPaymentAttachment(aiAgentApiBaseUrl, bill, currentUserUuid, row, paymentPayload);
            } catch {
              attachmentUpdateFailures += 1;
            }
          }
        }

        await refreshBillPayments(bill.uuid);
        reset({ payment: [createEmptyPaymentRow(defaultPaymentMethodName)] });

        showSnackbar({
          title: t('billPayment', 'Bill payment'),
          subtitle:
            attachmentUpdateFailures > 0
              ? t(
                  'billPaymentSavedWithAiWarnings',
                  '{{count}} payment(s) were saved, but {{failedCount}} AI receipt update(s) failed.',
                  {
                    count: processedPaymentsCount,
                    failedCount: attachmentUpdateFailures,
                  },
                )
              : processedPaymentsCount > 1
                ? t('billPaymentsProcessedSuccessfully', '{{count}} payments were processed successfully', {
                    count: processedPaymentsCount,
                  })
                : t('billPaymentProcessedSuccessfully', 'Bill payment processing has been successful'),
          kind: attachmentUpdateFailures > 0 ? 'warning' : 'success',
          timeoutInMs: attachmentUpdateFailures > 0 ? 5000 : 3000,
        });
      } catch (error: any) {
        await refreshBillPayments(bill.uuid);

        if (processedClientPaymentIds.size > 0) {
          reset({
            payment: removeProcessedRows(getValues('payment'), processedClientPaymentIds, defaultPaymentMethodName),
          });
        }

        showSnackbar({
          title: t('failedBillPayment', 'Bill payment failed'),
          subtitle:
            processedPaymentsCount > 0
              ? t(
                  'partialBillPaymentFailure',
                  '{{count}} payment(s) were saved before a failure occurred. Remaining rows are still in the form. Error: {{errorMessage}}',
                  {
                    count: processedPaymentsCount,
                    errorMessage: extractErrorMessagesFromResponse(error?.responseBody),
                  },
                )
              : t(
                  'billPaymentFailureMessage',
                  'An unexpected error occurred while processing your bill payment. Please contact the system administrator and provide them with the following error details: {{errorMessage}}',
                  {
                    errorMessage: extractErrorMessagesFromResponse(error?.responseBody),
                  },
                ),
          kind: 'error',
          timeoutInMs: 5000,
          isLowContrast: true,
        });
      } finally {
        setIsSubmittingPayments(false);
      }
    },
    [
      aiAgentApiBaseUrl,
      bill,
      currentUserUuid,
      defaultPaymentMethodName,
      getValues,
      isSubmittingPayments,
      reset,
      trigger,
    ],
  );

  return {
    fields,
    isSubmittingPayments,
    launchAiPaymentsWorkspace,
    processPayments,
    removePaymentRow: remove,
  };
}

export function PaymentAiWorkspaceHeaderAction({ onLaunchAiPayments }: { onLaunchAiPayments: () => void }) {
  return <AiPaymentsHeaderAction onClick={onLaunchAiPayments} />;
}

export function PaymentRowRemoveAction({
  index,
  onRemove,
  t,
}: {
  index: number;
  onRemove: (index: number) => void;
  t: (key: string, defaultValue: string) => string;
}) {
  return (
    <Button
      hasIconOnly
      iconDescription={t('removePaymentRow', 'Remove payment row')}
      kind="ghost"
      onClick={() => onRemove(index)}
      renderIcon={TrashCan}
      size="sm"
      tooltipAlignment="end"
      tooltipPosition="top"
    />
  );
}

export { createEmptyPaymentRow };
