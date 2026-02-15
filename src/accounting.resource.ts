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
