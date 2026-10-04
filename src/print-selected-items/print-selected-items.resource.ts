import { restBaseUrl } from '@openmrs/esm-framework';

export async function fetchSelectedItemsPdf(billId: number, lineItemUuids: string[], signal: AbortSignal) {
  const response = await fetch(`/openmrs${restBaseUrl}/cashier/print-selected-items`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/pdf' },
    body: JSON.stringify({ billId, lineItemUuids }),
    signal,
  });
  const contentType = response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
  if (!response.ok || contentType !== 'application/pdf') {
    throw new Error('Unable to generate selected-items PDF');
  }
  const pdf = await response.blob();
  if (!pdf.size) {
    throw new Error('The selected-items PDF is empty');
  }
  return pdf;
}
