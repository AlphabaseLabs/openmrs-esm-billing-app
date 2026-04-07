import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';

export const deleteBillPayment = (billUuid: string, paymentUuid: string, reason: string) => {
  const params = new URLSearchParams({ reason, purge: 'true' });
  const url = `${restBaseUrl}/cashier/bill/${billUuid}/payment/${paymentUuid}?${params.toString()}`;
  return openmrsFetch(url, { method: 'DELETE' });
};
