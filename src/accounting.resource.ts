import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';

type OpenmrsListResponse<T> = { results: Array<T> };

export const PROVIDER_SHARE_EXPENSE_ACCOUNT_UUID = 'b1000000-0000-0000-0000-000000000023';

export type AccountingTransaction = {
  uuid: string;
  voided?: boolean;
  transactionType?: string;
  status?: string;
  transactionDatetime?: string;
  postingDate?: string;
  currency?: string;
  counterpartyUuid?: string;
  counterpartyName?: string;
  billId?: number;
  billLineItemUuid?: string;
  amount?: number;
  taxAmount?: number;
  expenseAccountUuid?: string;
  description?: string;
  sourceModule?: string;
  sourceType?: string;
  sourceUuid?: string;
  meta?: string;
};

export type SaveProviderShareTransactionPayload = {
  transactionType: 'PROVIDER_SHARE';
  status: 'POSTED' | 'PAID';
  transactionDatetime: string;
  postingDate: string;
  currency: string;
  counterpartyUuid: string;
  counterpartyName: string;
  billId: number;
  billLineItemUuid?: string;
  amount: number;
  taxAmount: number;
  expenseAccountUuid: string;
  description: string;
  sourceModule: string;
  sourceType: string;
  sourceUuid?: string;
  meta: string;
};

export type SaveExpenseTransactionPayload = {
  transactionType: 'EXPENSE';
  status: 'PAID';
  transactionDatetime: string;
  postingDate: string;
  currency: string;
  counterpartyUuid: string | null;
  counterpartyName: string | null;
  billId: number;
  billLineItemUuid: string;
  amount: number;
  taxAmount: number;
  paymentAccountUuid: string;
  expenseAccountUuid: string;
  description?: string;
  sourceModule: string;
  sourceType: string;
  sourceUuid: string;
  meta: string;
};

export function getCurrentPostingDate() {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentTransactionDatetime() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetH = pad(Math.floor(absOffset / 60));
  const offsetM = pad(absOffset % 60);
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.000${sign}${offsetH}${offsetM}`;
}

export async function createProviderShareTransaction(payload: SaveProviderShareTransactionPayload) {
  return openmrsFetch(`${restBaseUrl}/accounting/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
}

export async function createExpenseTransaction(payload: SaveExpenseTransactionPayload) {
  return openmrsFetch(`${restBaseUrl}/accounting/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
}

export async function getProviderShareTransactionsByBillLineItem(billId: number, billLineItemUuid: string) {
  const url = `${restBaseUrl}/accounting/transaction?v=${encodeURIComponent(
    'custom:(uuid,voided,transactionType,status,transactionDatetime,postingDate,currency,counterpartyUuid,counterpartyName,billId,billLineItemUuid,amount,taxAmount,expenseAccountUuid,description,sourceModule,sourceType,sourceUuid,meta)',
  )}&limit=1000`;
  const response = await openmrsFetch<{ results: Array<AccountingTransaction> }>(url);
  const results = ((response as any)?.data as OpenmrsListResponse<AccountingTransaction>)?.results ?? [];
  return results.filter(
    (t) =>
      !t?.voided &&
      t.transactionType === 'PROVIDER_SHARE' &&
      Number(t.billId) === Number(billId) &&
      t.billLineItemUuid === billLineItemUuid,
  );
}

function normalizePaymentModeName(name?: string) {
  return String(name ?? '')
    .trim()
    .toLowerCase();
}

export function getPaymentModeTaxPercent(
  paymentMethodTaxes: {
    paymentTypeTaxPercents: Array<{
      paymentModeUuid?: string;
      paymentModeName?: string;
      taxPercent: number;
      deductibleFromProviderShare?: boolean;
    }>;
  },
  paymentMode: { uuid?: string; name?: string },
): number {
  if (!paymentMethodTaxes) {
    return 0;
  }

  const byUuid = paymentMethodTaxes.paymentTypeTaxPercents?.find(
    (t) => t.paymentModeUuid && paymentMode?.uuid && t.paymentModeUuid === paymentMode.uuid,
  );
  if (byUuid && Number.isFinite(byUuid.taxPercent)) {
    return Number(byUuid.taxPercent);
  }

  const modeName = normalizePaymentModeName(paymentMode?.name);
  const byName = paymentMethodTaxes.paymentTypeTaxPercents?.find(
    (t) => t.paymentModeName && normalizePaymentModeName(t.paymentModeName) === modeName,
  );
  if (byName && Number.isFinite(byName.taxPercent)) {
    return Number(byName.taxPercent);
  }

  return 0;
}

export function getPaymentModeTaxConfig(
  paymentMethodTaxes: {
    paymentTypeTaxPercents: Array<{
      paymentModeUuid?: string;
      paymentModeName?: string;
      taxPercent: number;
      deductibleFromProviderShare?: boolean;
    }>;
  },
  paymentMode: { uuid?: string; name?: string },
): { taxPercent: number; deductibleFromProviderShare: boolean } | null {
  if (!paymentMethodTaxes?.paymentTypeTaxPercents?.length) {
    return null;
  }

  const byUuid = paymentMethodTaxes.paymentTypeTaxPercents.find(
    (t) => t.paymentModeUuid && paymentMode?.uuid && t.paymentModeUuid === paymentMode.uuid,
  );
  if (byUuid && Number.isFinite(byUuid.taxPercent) && Number(byUuid.taxPercent) > 0) {
    return {
      taxPercent: Number(byUuid.taxPercent),
      deductibleFromProviderShare: Boolean(byUuid.deductibleFromProviderShare),
    };
  }

  const modeName = normalizePaymentModeName(paymentMode?.name);
  const byName = paymentMethodTaxes.paymentTypeTaxPercents.find(
    (t) => t.paymentModeName && normalizePaymentModeName(t.paymentModeName) === modeName,
  );
  if (byName && Number.isFinite(byName.taxPercent) && Number(byName.taxPercent) > 0) {
    return {
      taxPercent: Number(byName.taxPercent),
      deductibleFromProviderShare: Boolean(byName.deductibleFromProviderShare),
    };
  }

  return null;
}

export async function voidAccountingTransaction(transactionUuid: string, reason: string) {
  const params = new URLSearchParams();
  if (reason) {
    params.set('reason', reason);
  }
  const url = `${restBaseUrl}/accounting/transaction/${transactionUuid}${params.toString() ? `?${params.toString()}` : ''}`;
  return openmrsFetch(url, { method: 'DELETE' });
}

export type ProcessAccountingRefundParams = {
  billId: number;
  billLineItemUuid: string;
  currency?: string;
  description?: string;
};

export type ProcessAccountingRefundResult = {
  reversedCount: number;
  voidedCount: number;
  skippedCount: number;
};

/**
 * Accounting adjustments when a bill line item is removed (purged) or refunded:
 * - If a provider-share transaction is PAID, create a matching negative entry to reverse it.
 * - If a provider-share transaction is not PAID (pending/posted), void it instead.
 */
export async function processAccountingForLineItemRemoval(
  params: ProcessAccountingRefundParams & {
    reason?: string;
    sourceType: 'BILL_LINE_ITEM_REFUND' | 'BILL_LINE_ITEM_DELETE';
  },
): Promise<ProcessAccountingRefundResult> {
  const { billId, billLineItemUuid, currency = 'PKR', description, reason, sourceType } = params;
  const providerShares = await getProviderShareTransactionsByBillLineItem(billId, billLineItemUuid);

  const originalShares = providerShares.filter((t) => (Number(t.amount) || 0) > 0);
  if (originalShares.length === 0) {
    return { reversedCount: 0, voidedCount: 0, skippedCount: 0 };
  }

  const existingReversalsBySourceUuid = new Set(
    providerShares
      .filter(
        (t) =>
          (Number(t.amount) || 0) < 0 &&
          ['BILL_LINE_ITEM_REFUND', 'BILL_LINE_ITEM_DELETE'].includes(String(t.sourceType)) &&
          Boolean(t.sourceUuid),
      )
      .map((t) => String(t.sourceUuid)),
  );

  let reversedCount = 0;
  let voidedCount = 0;
  let skippedCount = 0;

  for (const share of originalShares) {
    const status = String(share.status ?? '').toUpperCase();

    // Pending/posted provider-share entries should be voided, not reversed.
    if (status !== 'PAID') {
      if (!share.uuid) {
        skippedCount += 1;
        continue;
      }
      await voidAccountingTransaction(share.uuid, reason ?? description ?? 'Bill line item removed');
      voidedCount += 1;
      continue;
    }

    // PAID provider-share entries get a negative reversal entry.
    if (existingReversalsBySourceUuid.has(String(share.uuid))) {
      skippedCount += 1;
      continue;
    }

    const originalAmount = Number(share.amount) || 0;
    const reversalAmount = -Math.abs(originalAmount);
    if (!share.counterpartyUuid || !share.counterpartyName || !reversalAmount) {
      skippedCount += 1;
      continue;
    }

    await createProviderShareTransaction({
      transactionType: 'PROVIDER_SHARE',
      status: 'POSTED',
      transactionDatetime: getCurrentTransactionDatetime(),
      postingDate: getCurrentPostingDate(),
      currency: share.currency ?? currency,
      counterpartyUuid: share.counterpartyUuid,
      counterpartyName: share.counterpartyName,
      billId,
      billLineItemUuid,
      amount: reversalAmount,
      taxAmount: 0,
      expenseAccountUuid: share.expenseAccountUuid ?? PROVIDER_SHARE_EXPENSE_ACCOUNT_UUID,
      description: `${share.description ?? description ?? 'Provider share'} (Reversal)`,
      sourceModule: 'billing',
      sourceType,
      sourceUuid: share.uuid,
      meta: share.meta ?? '{}',
    });

    reversedCount += 1;
  }

  return { reversedCount, voidedCount, skippedCount };
}

export async function processPaymentMethodTaxExpenses(params: {
  previousBill: { uuid: string; id: number; payments?: Array<{ uuid: string }> };
  updatedBill: {
    uuid: string;
    id: number;
    payments?: Array<{
      uuid: string;
      voided?: boolean;
      instanceType?: { uuid: string; name: string };
      allocations?: Array<{
        voided?: boolean;
        allocatedAmount: number;
        billLineItem?: { uuid: string } | string;
      }>;
    }>;
  };
  paymentMethodTaxes: {
    enabled?: boolean;
    taxExpenseAccountUuid: string;
    paymentTypeTaxPercents: Array<{
      paymentModeUuid?: string;
      paymentModeName?: string;
      taxPercent: number;
      deductibleFromProviderShare?: boolean;
    }>;
  };
}) {
  const { previousBill, updatedBill, paymentMethodTaxes } = params;

  if (paymentMethodTaxes?.enabled === false) {
    return { createdCount: 0, skippedCount: 0 };
  }

  const existingPaymentUuids = new Set((previousBill?.payments ?? []).map((p) => p.uuid).filter(Boolean));
  const newPayments =
    updatedBill?.payments?.filter((p) => p?.uuid && !existingPaymentUuids.has(p.uuid) && !p.voided) ?? [];

  const taxExpenseAccountUuid = paymentMethodTaxes?.taxExpenseAccountUuid;
  if (!taxExpenseAccountUuid) {
    return { createdCount: 0, skippedCount: 0 };
  }

  const paymentAccountUuid = 'b1000000-0000-0000-0000-000000000005'; // Cash Clearing

  let createdCount = 0;
  let skippedCount = 0;

  for (const payment of newPayments) {
    const paymentMode = payment.instanceType ?? { uuid: undefined, name: undefined };
    const taxConfig = getPaymentModeTaxConfig(paymentMethodTaxes, paymentMode);
    if (!taxConfig) {
      skippedCount += 1;
      continue;
    }
    const taxPercent = taxConfig.taxPercent;

    const allocations = payment.allocations ?? [];
    const allocationsByLineItem = new Map<string, number>();
    for (const allocation of allocations) {
      if (allocation?.voided) {
        continue;
      }

      const lineItemUuid =
        typeof allocation.billLineItem === 'string' ? allocation.billLineItem : allocation.billLineItem?.uuid;
      if (!lineItemUuid) {
        continue;
      }

      const prev = allocationsByLineItem.get(lineItemUuid) ?? 0;
      allocationsByLineItem.set(lineItemUuid, prev + Number(allocation.allocatedAmount ?? 0));
    }

    for (const [billLineItemUuid, allocatedAmount] of allocationsByLineItem.entries()) {
      const taxAmount = (Number(allocatedAmount) * Number(taxPercent)) / 100;
      const roundedTaxAmount = parseFloat(taxAmount.toFixed(2));
      if (!Number.isFinite(roundedTaxAmount) || roundedTaxAmount <= 0) {
        continue;
      }

      await createExpenseTransaction({
        transactionType: 'EXPENSE',
        status: 'PAID',
        transactionDatetime: getCurrentTransactionDatetime(),
        postingDate: getCurrentPostingDate(),
        currency: 'PKR',
        counterpartyUuid: null,
        counterpartyName: null,
        billId: updatedBill.id,
        billLineItemUuid,
        amount: roundedTaxAmount,
        taxAmount: 0,
        paymentAccountUuid,
        expenseAccountUuid: taxExpenseAccountUuid,
        description: `Payment method tax (${paymentMode?.name ?? paymentMode?.uuid ?? 'Unknown'}) ${taxPercent}%`,
        sourceModule: 'billing',
        sourceType: 'PAYMENT_METHOD_TAX',
        sourceUuid: `${payment.uuid}`,
        meta: JSON.stringify({
          paymentUuid: payment.uuid,
          paymentModeUuid: paymentMode?.uuid,
          paymentModeName: paymentMode?.name,
          taxPercent,
          allocatedAmount,
          deductibleFromProviderShare: taxConfig.deductibleFromProviderShare,
        }),
      });
      createdCount += 1;
    }
  }

  return { createdCount, skippedCount };
}
