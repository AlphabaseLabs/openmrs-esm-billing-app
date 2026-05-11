import dayjs from 'dayjs';
import { formatBillDateTime } from '../../helpers';
import { type MappedBill, type Payment } from '../../types';

const emptyValueDisplay = '--';
const cashPaymentMethod = 'cash';

export interface PaymentHistoryEntry {
  id: string;
  billUuid: string;
  paymentUuid: string;
  patientUuid: string;
  patientName: string;
  identifier: string;
  invoiceId: string;
  paymentDate: string;
  paymentDateUnformatted: number;
  paymentAmount: number;
  paymentMethod: string;
  referenceId: string;
}

export interface PaymentMethodTotal {
  paymentMethod: string;
  total: number;
}

export interface PaymentHistoryTopPayee {
  name: string;
  total: number;
}

export interface PaymentHistorySummary {
  totalPayments: number;
  cash: number;
  others: number;
  topPayee: PaymentHistoryTopPayee | null;
  paymentMethodTotals: Array<PaymentMethodTotal>;
}

const getPaymentTimestamp = (payment: Pick<Payment, 'dateCreated'>) => dayjs(payment.dateCreated).valueOf();
const isPaymentInRange = (payment: Pick<Payment, 'dateCreated' | 'voided'>, rangeStart: number, rangeEnd: number) => {
  if (payment.voided) {
    return false;
  }

  const paymentTimestamp = dayjs(payment.dateCreated).valueOf();
  return Number.isFinite(paymentTimestamp) && paymentTimestamp >= rangeStart && paymentTimestamp <= rangeEnd;
};

const normalizePaymentMethod = (paymentMethod?: string) => paymentMethod?.trim() || emptyValueDisplay;
const isCashPaymentMethod = (paymentMethod?: string) =>
  normalizePaymentMethod(paymentMethod).toLowerCase() === cashPaymentMethod;

export function getPaymentReferenceId(payment: Payment) {
  const populatedAttributes = (payment.attributes ?? []).filter((attribute) => attribute?.value?.trim());
  const referenceIds = populatedAttributes
    .filter((attribute) => attribute.attributeType?.description === 'Reference Number')
    .map((attribute) => attribute.value.trim());

  if (referenceIds.length > 0) {
    return referenceIds.join(', ');
  }

  return populatedAttributes.map((attribute) => attribute.value.trim()).join(', ') || '--';
}

export function buildPaymentHistoryEntries(
  bills: Array<MappedBill>,
  startDate: Date,
  endDate: Date,
): Array<PaymentHistoryEntry> {
  const rangeStart = dayjs(startDate).valueOf();
  const rangeEnd = dayjs(endDate).valueOf();

  return bills
    .flatMap((bill) =>
      (bill.payments ?? [])
        .filter((payment) => isPaymentInRange(payment, rangeStart, rangeEnd))
        .map((payment) => {
          const paymentTimestamp = getPaymentTimestamp(payment);

          return {
            id: `${bill.uuid}-${payment.uuid}`,
            billUuid: bill.uuid,
            paymentUuid: payment.uuid,
            patientUuid: bill.patientUuid,
            patientName: bill.patientName ?? emptyValueDisplay,
            identifier: bill.identifier ?? emptyValueDisplay,
            invoiceId: bill.receiptNumber ?? emptyValueDisplay,
            paymentDate: formatBillDateTime(new Date(paymentTimestamp)),
            paymentDateUnformatted: paymentTimestamp,
            paymentAmount: Number(payment.amountTendered ?? 0),
            paymentMethod: normalizePaymentMethod(payment.instanceType?.name),
            referenceId: getPaymentReferenceId(payment),
          };
        }),
    )
    .sort((leftEntry, rightEntry) => rightEntry.paymentDateUnformatted - leftEntry.paymentDateUnformatted);
}

export function summarizePaymentHistoryEntries(entries: Array<PaymentHistoryEntry>): PaymentHistorySummary {
  const paymentMethodTotals = new Map<string, number>();
  const topPayees = new Map<string, PaymentHistoryTopPayee>();
  let totalPayments = 0;
  let cash = 0;
  let others = 0;

  entries.forEach((entry) => {
    totalPayments += entry.paymentAmount;

    if (isCashPaymentMethod(entry.paymentMethod)) {
      cash += entry.paymentAmount;
    } else {
      others += entry.paymentAmount;
    }

    const paymentMethod = normalizePaymentMethod(entry.paymentMethod);
    paymentMethodTotals.set(paymentMethod, (paymentMethodTotals.get(paymentMethod) ?? 0) + entry.paymentAmount);

    const topPayeeKey = entry.patientUuid || entry.patientName || emptyValueDisplay;
    const existingTopPayee = topPayees.get(topPayeeKey);

    if (existingTopPayee) {
      existingTopPayee.total += entry.paymentAmount;
    } else {
      topPayees.set(topPayeeKey, {
        name: entry.patientName || emptyValueDisplay,
        total: entry.paymentAmount,
      });
    }
  });

  return {
    totalPayments,
    cash,
    others,
    topPayee:
      Array.from(topPayees.values()).sort(
        (leftPayee, rightPayee) => rightPayee.total - leftPayee.total || leftPayee.name.localeCompare(rightPayee.name),
      )[0] ?? null,
    paymentMethodTotals: Array.from(paymentMethodTotals.entries())
      .map(([paymentMethod, total]) => ({
        paymentMethod,
        total,
      }))
      .sort((leftTotal, rightTotal) => rightTotal.total - leftTotal.total),
  };
}
