import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import useSWR from 'swr';
import { type Filter } from '../../types';
import { formatBillDateTime } from '../../helpers';

const defaultPageSize = 10;
const exportPageSize = 200;

type DateRange = [Date, Date];

type OpenmrsListResponse<T> = {
  data: {
    results?: T[];
    length?: number;
    totalCount?: number;
  };
};

type BillingHistoryApiRow = {
  uuid: string;
  billId?: number;
  receiptNumber?: string;
  patientUuid?: string;
  patientName?: string;
  identifier?: string;
  dateCreated?: string;
  status?: string;
  totalAmount?: number | string;
  totalDiscount?: number | string;
  totalPaid?: number | string;
  amountDue?: number | string;
  billedItems?: string;
  referenceCodes?: string;
};

type PaymentHistoryApiRow = {
  uuid: string;
  billUuid?: string;
  patientUuid?: string;
  patientName?: string;
  identifier?: string;
  invoiceId?: string;
  paymentDate?: string;
  paymentAmount?: number | string;
  paymentMethod?: string;
  referenceId?: string;
};

type PaymentMethodTotalApiRow = {
  paymentMethod?: string;
  total?: number | string;
};

type BillingHistoryMetricsApiResponse = {
  totalBills?: number | string;
  totalPayments?: number | string;
  totalDue?: number | string;
  totalDiscount?: number | string;
  waivedAmount?: number | string;
  exemptedAmount?: number | string;
  taxCollectionAmount?: number | string;
  paymentMethodTotals?: PaymentMethodTotalApiRow[];
};

type PaymentHistoryMetricsApiResponse = {
  totalPayments?: number | string;
  cash?: number | string;
  others?: number | string;
  topPayeeName?: string;
  topPayeeAmount?: number | string;
  paymentMethodTotals?: PaymentMethodTotalApiRow[];
};

export interface BillingHistoryRow {
  id: string;
  uuid: string;
  billId?: number;
  receiptNumber: string;
  patientUuid: string;
  patientName: string;
  identifier: string;
  dateCreated: string;
  dateCreatedUnformatted: number;
  status: string;
  totalAmount: number;
  totalDiscount: number;
  totalPaid: number;
  amountDue: number;
  billedItems: string;
  referenceCodes: string;
}

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

export interface BillingHistoryMetricsData {
  totalBills: number;
  totalPayments: number;
  totalDue: number;
  totalDiscount: number;
  waivedAmount: number;
  exemptedAmount: number;
  taxCollectionAmount: number;
  paymentMethodTotals: PaymentMethodTotal[];
}

export interface PaymentHistoryMetricsData {
  totalPayments: number;
  cash: number;
  others: number;
  topPayeeName: string;
  topPayeeAmount: number;
  paymentMethodTotals: PaymentMethodTotal[];
}

interface HistoryListParams {
  filters: Filter;
  dateRange: DateRange;
  page?: number;
  pageSize?: number;
  timesheetUuid?: string;
  enabled?: boolean;
}

const baseBillHistoryRepresentation = encodeURIComponent(
  'custom:(uuid,billId,receiptNumber,patientUuid,patientName,identifier,dateCreated,status,totalAmount,totalDiscount,totalPaid,amountDue,billedItems,referenceCodes)',
);

const basePaymentHistoryRepresentation = encodeURIComponent(
  'custom:(uuid,billUuid,patientUuid,patientName,identifier,invoiceId,paymentDate,paymentAmount,paymentMethod,referenceId)',
);

const normalizeNumber = (value: number | string | null | undefined) => {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const normalizeString = (value: string | null | undefined, fallback = '--') => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : fallback;
};

const listRequestOptions = {
  keepPreviousData: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
} as const;

const metricsRequestOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
} as const;

const mapPaymentMethodTotals = (totals: PaymentMethodTotalApiRow[] = []): PaymentMethodTotal[] =>
  totals.map((row) => ({
    paymentMethod: normalizeString(row.paymentMethod),
    total: normalizeNumber(row.total),
  }));

const mapBillingHistoryRow = (row: BillingHistoryApiRow): BillingHistoryRow => {
  const dateValue = row.dateCreated ? new Date(row.dateCreated) : null;
  const timestamp = dateValue && !Number.isNaN(dateValue.getTime()) ? dateValue.getTime() : 0;

  return {
    id: row.uuid,
    uuid: row.uuid,
    billId: row.billId,
    receiptNumber: normalizeString(row.receiptNumber),
    patientUuid: row.patientUuid ?? '',
    patientName: normalizeString(row.patientName),
    identifier: normalizeString(row.identifier),
    dateCreated: timestamp ? formatBillDateTime(dateValue) : '--',
    dateCreatedUnformatted: timestamp,
    status: normalizeString(row.status),
    totalAmount: normalizeNumber(row.totalAmount),
    totalDiscount: normalizeNumber(row.totalDiscount),
    totalPaid: normalizeNumber(row.totalPaid),
    amountDue: normalizeNumber(row.amountDue),
    billedItems: normalizeString(row.billedItems),
    referenceCodes: normalizeString(row.referenceCodes),
  };
};

const mapPaymentHistoryEntry = (row: PaymentHistoryApiRow): PaymentHistoryEntry => {
  const dateValue = row.paymentDate ? new Date(row.paymentDate) : null;
  const timestamp = dateValue && !Number.isNaN(dateValue.getTime()) ? dateValue.getTime() : 0;

  return {
    id: row.uuid,
    billUuid: row.billUuid ?? '',
    paymentUuid: row.uuid,
    patientUuid: row.patientUuid ?? '',
    patientName: normalizeString(row.patientName),
    identifier: normalizeString(row.identifier),
    invoiceId: normalizeString(row.invoiceId),
    paymentDate: timestamp ? formatBillDateTime(dateValue) : '--',
    paymentDateUnformatted: timestamp,
    paymentAmount: normalizeNumber(row.paymentAmount),
    paymentMethod: normalizeString(row.paymentMethod),
    referenceId: normalizeString(row.referenceId),
  };
};

const buildHistoryParams = ({
  filters,
  dateRange,
  page,
  pageSize,
  timesheetUuid,
  totalCount = false,
}: HistoryListParams & { totalCount?: boolean }) => {
  const params = new URLSearchParams();
  params.set('fromDate', dateRange[0].toISOString());
  params.set('toDate', dateRange[1].toISOString());

  if (filters.patientUuid?.trim()) {
    params.set('patientUuid', filters.patientUuid.trim());
  }

  if (filters.billStatus?.trim()) {
    params.set('status', filters.billStatus.trim());
  }

  if (filters.paymentMethods?.length) {
    params.set('paymentModes', filters.paymentMethods.join(','));
  }

  if (filters.cashiers?.length) {
    params.set('cashierUuids', filters.cashiers.join(','));
  }

  if (timesheetUuid?.trim()) {
    params.set('timesheetUuid', timesheetUuid.trim());
  }

  if (typeof pageSize === 'number' && pageSize > 0) {
    params.set('limit', String(pageSize));
  }

  if (typeof page === 'number' && typeof pageSize === 'number' && page > 0 && pageSize > 0) {
    params.set('startIndex', String((page - 1) * pageSize));
  }

  if (totalCount) {
    params.set('totalCount', 'true');
  }

  return params;
};

const getListTotalCount = <T>(response?: OpenmrsListResponse<T>) =>
  response?.data?.length ?? response?.data?.totalCount ?? 0;

const createListUrl = (endpoint: string, representation: string, params: URLSearchParams) => {
  params.set('v', representation);
  return `${restBaseUrl}/cashier/${endpoint}?${params.toString()}`;
};

const useHistoryListResource = <TApiRow, TMappedRow, TResultKey extends string>({
  endpoint,
  representation,
  mapper,
  resultKey,
  filters,
  dateRange,
  page = 1,
  pageSize = defaultPageSize,
  timesheetUuid,
  enabled = true,
}: HistoryListParams & {
  endpoint: string;
  representation: string;
  mapper: (row: TApiRow) => TMappedRow;
  resultKey: TResultKey;
}) => {
  const params = buildHistoryParams({ filters, dateRange, page, pageSize, timesheetUuid, totalCount: true });
  const url = createListUrl(endpoint, representation, params);

  const { data, error, isLoading, isValidating, mutate } = useSWR<OpenmrsListResponse<TApiRow>, Error>(
    enabled ? url : null,
    openmrsFetch,
    listRequestOptions,
  );

  return {
    [resultKey]: (data?.data?.results ?? []).map(mapper),
    totalCount: getListTotalCount(data),
    error,
    isLoading,
    isValidating,
    mutate,
  } as {
    [K in typeof resultKey]: Array<TMappedRow>;
  } & {
    totalCount: number;
    error: Error | undefined;
    isLoading: boolean;
    isValidating: boolean;
    mutate: typeof mutate;
  };
};

const useHistoryMetricsResource = <TMetricsApiResponse, TMetricsData>({
  endpoint,
  mapper,
  filters,
  dateRange,
  timesheetUuid,
  enabled = true,
}: HistoryListParams & {
  endpoint: string;
  mapper: (response?: TMetricsApiResponse) => TMetricsData;
}) => {
  const url = `${restBaseUrl}/cashier/metrics/${endpoint}?${buildHistoryParams({
    filters,
    dateRange,
    timesheetUuid,
  }).toString()}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ data: TMetricsApiResponse }, Error>(
    enabled ? url : null,
    openmrsFetch,
    metricsRequestOptions,
  );

  return {
    metrics: mapper(data?.data),
    error,
    isLoading,
    isValidating,
    mutate,
  };
};

export const useBillingHistoryList = ({
  filters,
  dateRange,
  page = 1,
  pageSize = defaultPageSize,
  timesheetUuid,
  enabled = true,
}: HistoryListParams) => {
  return useHistoryListResource({
    endpoint: 'billing-history',
    representation: baseBillHistoryRepresentation,
    mapper: mapBillingHistoryRow,
    resultKey: 'rows',
    filters,
    dateRange,
    page,
    pageSize,
    timesheetUuid,
    enabled,
  });
};

export const usePaymentHistoryList = ({
  filters,
  dateRange,
  page = 1,
  pageSize = defaultPageSize,
  timesheetUuid,
  enabled = true,
}: HistoryListParams) => {
  return useHistoryListResource({
    endpoint: 'payment-history',
    representation: basePaymentHistoryRepresentation,
    mapper: mapPaymentHistoryEntry,
    resultKey: 'entries',
    filters,
    dateRange,
    page,
    pageSize,
    timesheetUuid,
    enabled,
  });
};

export const useBillingHistoryMetrics = ({ filters, dateRange, timesheetUuid, enabled = true }: HistoryListParams) => {
  return useHistoryMetricsResource({
    endpoint: 'billing-history',
    filters,
    dateRange,
    timesheetUuid,
    enabled,
    mapper: (response?: BillingHistoryMetricsApiResponse): BillingHistoryMetricsData => ({
      totalBills: normalizeNumber(response?.totalBills),
      totalPayments: normalizeNumber(response?.totalPayments),
      totalDue: normalizeNumber(response?.totalDue),
      totalDiscount: normalizeNumber(response?.totalDiscount),
      waivedAmount: normalizeNumber(response?.waivedAmount),
      exemptedAmount: normalizeNumber(response?.exemptedAmount),
      taxCollectionAmount: normalizeNumber(response?.taxCollectionAmount),
      paymentMethodTotals: mapPaymentMethodTotals(response?.paymentMethodTotals),
    }),
  });
};

export const usePaymentHistoryMetrics = ({ filters, dateRange, timesheetUuid, enabled = true }: HistoryListParams) => {
  return useHistoryMetricsResource({
    endpoint: 'payment-history',
    filters,
    dateRange,
    timesheetUuid,
    enabled,
    mapper: (response?: PaymentHistoryMetricsApiResponse): PaymentHistoryMetricsData => ({
      totalPayments: normalizeNumber(response?.totalPayments),
      cash: normalizeNumber(response?.cash),
      others: normalizeNumber(response?.others),
      topPayeeName: normalizeString(response?.topPayeeName, '--'),
      topPayeeAmount: normalizeNumber(response?.topPayeeAmount),
      paymentMethodTotals: mapPaymentMethodTotals(response?.paymentMethodTotals),
    }),
  });
};

const fetchPagedResults = async <TApi, TResult>(
  endpoint: string,
  representation: string,
  params: URLSearchParams,
  mapper: (row: TApi) => TResult,
) => {
  const results: TResult[] = [];
  let startIndex = 0;
  let totalCount = Number.POSITIVE_INFINITY;

  while (startIndex < totalCount) {
    params.set('limit', String(exportPageSize));
    params.set('startIndex', String(startIndex));
    params.set('totalCount', 'true');

    const response = await openmrsFetch<{ results?: TApi[]; length?: number; totalCount?: number }>(
      createListUrl(endpoint, representation, params),
    );
    const currentResults = response?.data?.results ?? [];
    totalCount = response?.data?.length ?? response?.data?.totalCount ?? currentResults.length;
    results.push(...currentResults.map(mapper));

    if (!currentResults.length) {
      break;
    }

    startIndex += exportPageSize;
  }

  return results;
};

export const fetchBillingHistoryForExport = async ({
  filters,
  dateRange,
  timesheetUuid,
}: Pick<HistoryListParams, 'filters' | 'dateRange' | 'timesheetUuid'>) =>
  fetchPagedResults<BillingHistoryApiRow, BillingHistoryRow>(
    'billing-history',
    baseBillHistoryRepresentation,
    buildHistoryParams({ filters, dateRange, timesheetUuid }),
    mapBillingHistoryRow,
  );

export const fetchPaymentHistoryForExport = async ({
  filters,
  dateRange,
  timesheetUuid,
}: Pick<HistoryListParams, 'filters' | 'dateRange' | 'timesheetUuid'>) =>
  fetchPagedResults<PaymentHistoryApiRow, PaymentHistoryEntry>(
    'payment-history',
    basePaymentHistoryRepresentation,
    buildHistoryParams({ filters, dateRange, timesheetUuid }),
    mapPaymentHistoryEntry,
  );
