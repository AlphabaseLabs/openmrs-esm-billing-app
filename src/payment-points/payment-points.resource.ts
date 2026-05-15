import { type FetchResponse, openmrsFetch, useSession } from '@openmrs/esm-framework';
import { useMemo } from 'react';
import useSWR from 'swr';
import { type PaymentPoint, type Timesheet } from '../types';

const defaultRequestOptions = {
  errorRetryCount: 3,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
} as const;

export const usePaymentPoints = () => {
  const url = `/ws/rest/v1/cashier/cashPoint`;
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    data: { results: PaymentPoint[]; length: number };
  }>(url, openmrsFetch, defaultRequestOptions);

  return {
    paymentPoints:
      data?.data.results.map((paymentPoint) => ({
        ...paymentPoint,
        id: paymentPoint.uuid,
      })) ?? [],
    error,
    isLoading,
    isValidating,
    mutate,
  };
};

export const createPaymentPoint = (payload: {
  name: string;
  description: string;
  retired: boolean;
  location: string;
}) => {
  const url = `/ws/rest/v1/cashier/cashPoint`;
  return openmrsFetch(url, {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const useTimeSheets = () => {
  const url = `/ws/rest/v1/cashier/timesheet?v=full`;
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    data: { results: Timesheet[] };
  }>(url, openmrsFetch, defaultRequestOptions);

  return {
    timesheets: data?.data.results ?? [],
    error,
    isLoading,
    isValidating,
    mutate,
  };
};

export const useActiveSheet = () => {
  const { currentProvider } = useSession();
  const providerUUID = currentProvider?.uuid;

  const url = `/ws/rest/v1/cashier/timesheet?v=full&getProviderOpenTimesheet=true&cashier=${providerUUID}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    data: { results: Timesheet[] };
  }>(providerUUID ? url : undefined, openmrsFetch, defaultRequestOptions);

  return {
    timesheets: data?.data.results.filter((r) => Boolean(r)) ?? [],
    error: error,
    isLoading: isLoading,
    isValidating,
    mutate,
  };
};

export const clockIn = (payload: { cashier: string; cashPoint: string; clockIn: string }) => {
  const url = `/ws/rest/v1/cashier/timesheet`;
  return openmrsFetch(url, {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const clockOut = (timesheetUUID: string, payload: { clockOut: string }) => {
  const url = `/ws/rest/v1/cashier/timesheet/${timesheetUUID}`;
  return openmrsFetch(url, {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

interface Person {
  uuid: string;
}

interface PersonWithDisplay extends Person {
  display?: string;
}

interface ProviderResponse {
  uuid: string;
  person: PersonWithDisplay;
}

export interface ProviderOption {
  id: string;
  uuid: string;
  label: string;
}

interface UsersResponse {
  uuid: string;
  person: Person;
}

export function useProviders() {
  const url = `/ws/rest/v1/provider?v=custom:(uuid,person:(uuid)`;
  const { data, error, isLoading } = useSWR<FetchResponse<{ results: ProviderResponse[] }>>(
    url,
    openmrsFetch,
    defaultRequestOptions,
  );
  const providers = data?.data?.results || [];

  return { providers, error, isLoading };
}

export function useProviderOptions() {
  const url = `/ws/rest/v1/provider?v=custom:(uuid,person:(uuid,display))`;
  const { data, error, isLoading } = useSWR<FetchResponse<{ results: ProviderResponse[] }>>(
    url,
    openmrsFetch,
    defaultRequestOptions,
  );
  const options = useMemo<Array<ProviderOption>>(
    () =>
      (data?.data?.results ?? [])
        .map((provider) => ({
          id: provider.uuid,
          uuid: provider.uuid,
          label: provider.person?.display ?? provider.uuid,
        }))
        .sort((leftOption, rightOption) => leftOption.label.localeCompare(rightOption.label)),
    [data?.data?.results],
  );

  return { providerOptions: options, error, isLoading };
}

export function useUsers() {
  const url = `/ws/rest/v1/user?v=custom:(uuid,person:(uuid)`;
  const { data, error, isLoading } = useSWR<FetchResponse<{ results: UsersResponse[] }>>(
    url,
    openmrsFetch,
    defaultRequestOptions,
  );
  const users = data?.data?.results || [];

  return { users, error, isLoading };
}
