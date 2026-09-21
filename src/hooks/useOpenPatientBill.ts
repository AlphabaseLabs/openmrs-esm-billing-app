import useSWR from 'swr';
import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';

type OpenPatientBill = {
  uuid: string;
  closed?: boolean;
  voided?: boolean;
  dateCreated?: string;
  patient: { uuid: string };
};

const getOpenPatientBillsUrl = (patientUuid: string) =>
  `${restBaseUrl}/cashier/bill?patientUuid=${encodeURIComponent(patientUuid)}&includeClosedBills=false&includeVoidedBills=false&v=custom:(uuid,closed,voided,dateCreated,patient:(uuid))`;

export async function fetchOpenPatientBill(patientUuid: string): Promise<OpenPatientBill | null> {
  let url: string | undefined = getOpenPatientBillsUrl(patientUuid);
  const bills: OpenPatientBill[] = [];
  while (url) {
    const response = await openmrsFetch<{
      results: OpenPatientBill[];
      links?: Array<{ rel: string; uri: string }>;
    }>(url);
    if (!response.ok || !Array.isArray(response.data?.results)) throw new Error('Unable to check patient bills');
    bills.push(...response.data.results);
    url = response.data.links?.find((link) => link.rel === 'next')?.uri;
  }
  return (
    bills
      .filter((bill) => bill.uuid && bill.patient?.uuid === patientUuid && !bill.closed && !bill.voided)
      .sort((a, b) => (Date.parse(b.dateCreated ?? '') || 0) - (Date.parse(a.dateCreated ?? '') || 0))[0] ?? null
  );
}

export default function useOpenPatientBill(patientUuid: string, enabled: boolean) {
  const { data, isLoading, error } = useSWR(
    enabled && patientUuid ? getOpenPatientBillsUrl(patientUuid) : null,
    () => fetchOpenPatientBill(patientUuid),
    { keepPreviousData: false, revalidateOnMount: true },
  );
  return { bill: data, isLoading, error };
}
