import {
  openmrsFetch,
  type OpenmrsResource,
  restBaseUrl,
  useConfig,
  useSession,
  useVisit,
  type SessionLocation,
} from '@openmrs/esm-framework';
import dayjs from 'dayjs';
import isEmpty from 'lodash-es/isEmpty';
import sortBy from 'lodash-es/sortBy';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { z } from 'zod';
import { type BillingConfig } from './config-schema';
import { extractString, formatBillDateTime } from './helpers';
import {
  FacilityDetail,
  type BillLineItemDiscount,
  type MappedBill,
  type PatientInvoice,
  type PaymentMethod,
  type PaymentStatus,
} from './types';

export const mapBillProperties = (bill: PatientInvoice): MappedBill => {
  const lineItems = bill?.lineItems?.filter((li) => !li?.voided) ?? [];
  const lineItemDiscountTotal = lineItems.reduce(
    (total, item) => total + (item?.discounts ?? []).reduce((sum, discount) => sum + (discount?.amount ?? 0), 0),
    0,
  );
  const billLineItemDiscounts = bill?.totalDiscount ?? lineItemDiscountTotal;
  // create base object
  const mappedBill: MappedBill = {
    id: bill?.id,
    uuid: bill?.uuid,
    patientName: bill?.patient?.display.split('-')?.[1],
    identifier: bill?.patient?.display.split('-')?.[0],
    patientUuid: bill?.patient?.uuid,
    status: bill?.status,
    receiptNumber: bill?.receiptNumber,
    cashier: bill?.cashier,
    cashPointUuid: bill?.cashPoint?.uuid,
    cashPointName: bill?.cashPoint?.name,
    cashPointLocation: bill?.cashPoint?.location?.display,
    dateCreated: formatBillDateTime(bill?.dateCreated),
    dateCreatedUnformatted: bill?.dateCreated,
    lineItems,
    billingService: extractString(lineItems.map((bill) => bill?.item || bill?.billableService || '--').join('  ')),
    payments: bill?.payments ?? [],
    display: bill?.display,
    totalAmount:
      lineItems.reduce((sum, item) => {
        const subtotal = (item?.price ?? 0) * (item?.quantity ?? 0);
        const tax = (item?.taxes ?? []).reduce((acc, t) => acc + (t?.amount ?? 0), 0);
        const discount = (item?.discounts ?? []).reduce((acc, d) => acc + (d?.amount ?? 0), 0);
        return sum + (item?.total ?? subtotal + tax - discount);
      }, 0) ?? 0,
    tenderedAmount: (bill?.payments ?? []).reduce((total, item) => total + (item?.amountTendered ?? 0), 0),
    referenceCodes: (bill?.payments ?? [])
      .map((payment) =>
        (payment.attributes ?? [])
          .filter((attr) => attr.attributeType?.description === 'Reference Number')
          .map((attr) => {
            return {
              paymentMode: payment.instanceType?.name,
              value: attr.value,
            };
          }),
      )
      .flat()
      .map((ref) => `${ref.paymentMode}: ${ref.value}`)
      .join(', '),
    adjustmentReason: bill?.adjustmentReason,
    balance: bill?.balance,
    totalPayments: bill?.totalPayments ?? 0,
    totalDeposits: bill?.totalDeposits ?? 0,
    totalExempted: bill?.totalExempted ?? 0,
    totalWaived: bill?.totalWaivers ?? 0,
    closed: bill?.closed,
    totalActualPayments: bill?.totalActualPayments ?? 0,
    totalTax: bill?.totalTax ?? 0,
    billLineItemDiscounts,
    totalAmountWithoutTaxAndDiscount: lineItems.reduce(
      (sum, item) => sum + (item?.price ?? 0) * (item?.quantity ?? 0),
      0,
    ),
  };
  mappedBill.totalDiscounts = billLineItemDiscounts;
  return mappedBill;
};

export const useBills = (
  patientUuid: string = '',
  billStatus: PaymentStatus.PENDING | '' | string = '',
  startingDate?: Date,
  endDate?: Date,
  enabled: boolean = true,
) => {
  const startingDateISO = startingDate?.toISOString();
  const endDateISO = endDate?.toISOString();

  const dateParams =
    startingDateISO && endDateISO ? `&createdOnOrAfter=${startingDateISO}&createdOnOrBefore=${endDateISO}` : '';
  const url = `${restBaseUrl}/cashier/bill?status=${billStatus}&v=custom:(uuid,display,voided,voidReason,adjustedBy,cashPoint:(uuid,name),cashier:(uuid,display),dateCreated,lineItems,patient:(uuid,display))${dateParams}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ data: { results: Array<PatientInvoice> } }>(
    enabled ? (patientUuid ? `${url}&patientUuid=${patientUuid}` : url) : null,
    openmrsFetch,
    {
      errorRetryCount: 2,
      keepPreviousData: true,
    },
  );

  const sortBills = sortBy(data?.data?.results ?? [], ['dateCreated']).reverse();
  const filteredBills = billStatus === '' ? sortBills : sortBills?.filter((bill) => bill?.status === billStatus);
  const mappedResults = filteredBills?.map((bill) => mapBillProperties(bill));
  const filteredResults = mappedResults?.filter((res) => res.patientUuid === patientUuid);
  const formattedBills = isEmpty(patientUuid) ? mappedResults : filteredResults || [];

  return {
    bills: formattedBills,
    error,
    isLoading,
    isValidating,
    mutate,
  };
};

export const useBill = (billUuid: string, options?: { syncStatusWhenZeroBalance?: boolean }) => {
  const url = `${restBaseUrl}/cashier/bill/${billUuid}?includeVoided=false&v=full`;
  const { data, error, isLoading, isValidating, mutate } = useSWR<{ data: PatientInvoice }>(
    billUuid ? url : null,
    openmrsFetch,
    {
      errorRetryCount: 2,
    },
  );

  // filter out voided line items to prevent them from being included in the bill
  // TODO: add backend support for voided line items
  // https://thepalladiumgroup.atlassian.net/browse/KHP3-7068
  const filteredLineItems = data?.data?.lineItems?.filter((li) => !li?.voided) ?? [];
  const formattedBill = data?.data
    ? mapBillProperties({ ...data?.data, lineItems: filteredLineItems })
    : ({} as MappedBill);
  const hasSyncedStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const shouldSyncStatus =
      options?.syncStatusWhenZeroBalance &&
      !isLoading &&
      formattedBill?.uuid &&
      formattedBill?.status !== 'PAID' &&
      Number(formattedBill?.balance ?? 0) === 0 &&
      hasSyncedStatusRef.current !== formattedBill.uuid;

    if (!shouldSyncStatus) {
      return;
    }

    hasSyncedStatusRef.current = formattedBill.uuid;
    syncBillStatus(formattedBill.uuid)
      .then((response) => {
        if (response?.ok) {
          mutate();
        } else {
          hasSyncedStatusRef.current = null;
        }
      })
      .catch(() => {
        hasSyncedStatusRef.current = null;
      });
  }, [
    options?.syncStatusWhenZeroBalance,
    isLoading,
    formattedBill?.uuid,
    formattedBill?.status,
    formattedBill?.balance,
    mutate,
  ]);

  return {
    bill: formattedBill,
    error,
    isLoading,
    isValidating,
    mutate,
  };
};

export const syncBillStatus = (billUuid: string) => {
  const url = `${restBaseUrl}/cashier/bill/sync-status/${billUuid}`;
  return openmrsFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const processBillPayment = (payload, billUuid: string) => {
  const url = `${restBaseUrl}/cashier/bill/${billUuid}`;
  return openmrsFetch(url, {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export type BillLineItemUpdate = {
  billableService?: string;
  item?: string;
  quantity?: number;
  price?: number;
  priceName?: string;
  priceUuid?: string;
  paymentStatus?: 'PENDING' | 'POSTED' | 'PAID' | 'CANCELLED' | 'ADJUSTED' | 'EXEMPTED';
  discounts?: Array<Pick<BillLineItemDiscount, 'amount' | 'baseAmount' | 'rate' | 'description' | 'sponsor'>>;
};

export const updateBillLineItem = (lineItemUuid: string, updates: BillLineItemUpdate) => {
  const payload = { ...updates };

  if (!payload.priceUuid) {
    delete payload.priceUuid;
  }

  const url = `${restBaseUrl}/cashier/billLineItem/${lineItemUuid}`;
  return openmrsFetch(url, {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export function useDefaultFacility(): { data: SessionLocation | null } {
  const { sessionLocation } = useSession();
  return { data: sessionLocation };
}

export function useFetchSearchResults(searchVal, category) {
  let url = ``;
  if (category == 'Stock Item') {
    url = `${restBaseUrl}/stockmanagement/stockitem?v=default&limit=10&q=${searchVal}`;
  } else {
    url = `${restBaseUrl}/cashier/billableService?v=custom:(uuid,name,shortName,serviceStatus,serviceType:(display),servicePrices:(uuid,name,price,paymentMode))`;
  }
  const { data, error, isLoading, isValidating } = useSWR(searchVal ? url : null, openmrsFetch, {});

  return { data: data?.data, error, isLoading: isLoading, isValidating };
}

type PatientPaymentVisitAttribute = {
  attributeType?: {
    name?: string;
  };
  value?: string;
};

export const usePatientPaymentInfo = (patientUuid?: string) => {
  const visitUrl = patientUuid
    ? `${restBaseUrl}/visit?patient=${patientUuid}&v=custom:(stopDatetime,attributes:(attributeType:(name),value))&includeInactive=false`
    : null;
  const { data } = useSWR<{
    data: { results: Array<{ stopDatetime: string | null; attributes?: Array<PatientPaymentVisitAttribute> }> };
  }>(visitUrl, openmrsFetch);

  return useMemo(() => {
    const activeVisit = data?.data?.results?.find((visit) => visit?.stopDatetime === null);
    const attributes = activeVisit?.attributes ?? [];

    return attributes
      .map((attribute) => ({
        name: attribute?.attributeType?.name,
        value: attribute?.value,
      }))
      .filter(({ name, value }) => (name === 'Insurance scheme' || name === 'Policy Number') && value);
  }, [data?.data?.results]);
};

export const processBillItems = (payload) => {
  const url = `${restBaseUrl}/cashier/bill`;
  return openmrsFetch(url, {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const usePaymentModes = (excludeWaiver: boolean = true) => {
  const { excludedPaymentMode } = useConfig<BillingConfig>();
  const url = `${restBaseUrl}/cashier/paymentMode?v=full`;
  const { data, isLoading, error, mutate } = useSWR<{ data: { results: Array<PaymentMethod> } }>(url, openmrsFetch, {
    errorRetryCount: 2,
  });
  const allowedPaymentModes =
    excludedPaymentMode?.length > 0
      ? (data?.data?.results.filter((mode) => !excludedPaymentMode.some((excluded) => excluded.uuid === mode.uuid)) ??
        [])
      : (data?.data?.results ?? []);
  return {
    paymentModes: excludeWaiver ? allowedPaymentModes : data?.data?.results,
    isLoading,
    mutate,
    error,
  };
};

export const useBillableItems = () => {
  const url = `${restBaseUrl}/cashier/billableService?v=custom:(uuid,name,shortName,serviceStatus,serviceType:(display),servicePrices:(uuid,name,price,paymentMode))`;
  const { data, isLoading, error } = useSWR<{ data: { results: Array<OpenmrsResource> } }>(url, openmrsFetch);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredItems =
    data?.data?.results?.filter((item) =>
      [item.name, (item as OpenmrsResource & { shortName?: string }).shortName].some((value) =>
        `${value ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    ) ?? [];
  return {
    lineItems: filteredItems,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
  };
};
export const useCashPoint = () => {
  const url = `${restBaseUrl}/cashier/cashPoint`;
  const { data, isLoading, error } = useSWR<{ data: { results: Array<OpenmrsResource> } }>(url, openmrsFetch);

  return { isLoading, error, cashPoints: data?.data?.results ?? [] };
};

export const createPatientBill = (payload) => {
  const postUrl = `${restBaseUrl}/cashier/bill`;
  return openmrsFetch(postUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
};

export const useConceptAnswers = (conceptUuid: string) => {
  const url = `${restBaseUrl}/concept/${conceptUuid}`;
  const { data, isLoading, error } = useSWR<{ data: { answers: Array<OpenmrsResource> } }>(url, openmrsFetch);
  return { conceptAnswers: data?.data?.answers, isLoading, error };
};

export const billingFormSchema = z.object({
  cashPoint: z.string().uuid(),
  cashier: z.string().uuid(),
  patient: z.string().uuid(),
  payments: z.array(z.string()),
  status: z.enum(['PENDING']),
  receiptNumber: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        billableService: z.string().uuid(),
        quantity: z.number({ coerce: true }).min(1),
        price: z.number({ coerce: true }),
        priceName: z.string().optional().default('Default'),
        priceUuid: z.string().uuid(),
        lineItemOrder: z.number().optional().default(0),
        order: z.string().optional().default(''),
        paymentStatus: z.enum(['PENDING']),
      }),
    )
    .min(1),
});

export const addPaymentToBill = (billUuid: string, payload: Record<string, any>) => {
  const url = `${restBaseUrl}/cashier/bill/${billUuid}/payment`;
  return openmrsFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
};

export const updateBillItems = (payload) => {
  const url = `${restBaseUrl}/cashier/bill/${payload.uuid}`;
  return openmrsFetch(url, {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export interface BillsPaginatedResponse {
  bills: MappedBill[];
  totalCount: number | null;
  error: Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => void;
}

export interface UseBillsPaginatedParams {
  patientUuid?: string;
  billStatus?: PaymentStatus.PENDING | '' | string;
  receiptNumber?: string;
  startingDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

const paginatedBillsRequestOptions = {
  errorRetryCount: 2,
  keepPreviousData: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
} as const;

const buildPaginatedBillsUrl = ({
  patientUuid,
  billStatus,
  receiptNumber,
  startingDate,
  endDate,
  page,
  pageSize,
}: Required<Omit<UseBillsPaginatedParams, 'enabled'>>) => {
  const urlParams = new URLSearchParams({
    v: 'custom:(uuid,display,voided,voidReason,adjustedBy,cashPoint:(uuid,name),cashier:(uuid,display),dateCreated,lineItems,patient:(uuid,display))',
    createdOnOrAfter: startingDate.toISOString(),
    createdOnOrBefore: endDate.toISOString(),
    limit: pageSize.toString(),
    startIndex: String((page - 1) * pageSize),
    totalCount: 'true',
  });

  if (billStatus) {
    urlParams.append('status', billStatus);
  }

  if (patientUuid) {
    urlParams.append('patientUuid', patientUuid);
  }

  const trimmedReceiptNumber = receiptNumber.trim();
  if (trimmedReceiptNumber) {
    urlParams.append('receiptNumber', trimmedReceiptNumber);
  }

  return `${restBaseUrl}/cashier/bill?${urlParams.toString()}`;
};

/**
 * Hook for fetching bills with server-side pagination.
 * This is a new function that supports pagination without modifying existing useBills.
 *
 * @param params - Pagination and filter parameters
 * @returns Paginated bills response with totalCount
 */
export const useBillsPaginated = ({
  patientUuid = '',
  billStatus = '',
  receiptNumber = '',
  startingDate = dayjs().subtract(10, 'year').startOf('day').toDate(),
  endDate = dayjs().endOf('day').toDate(),
  page = 1,
  pageSize = 10,
  enabled = true,
}: UseBillsPaginatedParams = {}): BillsPaginatedResponse => {
  const url = buildPaginatedBillsUrl({
    patientUuid,
    billStatus,
    receiptNumber,
    startingDate,
    endDate,
    page,
    pageSize,
  });

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    data: {
      results: Array<PatientInvoice>;
      length?: number;
      totalCount?: number;
      links?: Array<{ rel: string; uri: string }>;
    };
  }>(enabled ? url : null, openmrsFetch, paginatedBillsRequestOptions);

  const sortBills = sortBy(data?.data?.results ?? [], ['dateCreated']).reverse();
  const mappedResults = sortBills?.map((bill) => mapBillProperties(bill)) ?? [];

  // Extract totalCount from response - AlreadyPagedWithLength returns 'length', but we'll check both
  // for compatibility
  const totalCount: number | null = data?.data?.length ?? data?.data?.totalCount ?? null;

  return {
    bills: mappedResults,
    totalCount,
    error,
    isLoading,
    isValidating,
    mutate,
  };
};
