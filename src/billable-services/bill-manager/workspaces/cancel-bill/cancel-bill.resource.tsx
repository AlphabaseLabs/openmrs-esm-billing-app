import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';

export const purgeBillLineItem = (lineItemUuid: string) => {
  const url = `${restBaseUrl}/cashier/billLineItem/${lineItemUuid}`;
  return openmrsFetch(url, { method: 'DELETE' });
};
