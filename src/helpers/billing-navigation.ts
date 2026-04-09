/**
 * Invoice deep-links carry this query so "discard" can return to billing home or clinical home
 * based on where the user was before opening the invoice (encoded pathname).
 */
export const INVOICE_REFERRER_PARAM = 'from';

const BILLING_HOME_PATH = '/home/billing';

export function encodeInvoiceReferrerPath(pathname: string): string {
  return encodeURIComponent(pathname);
}

/** SPA URL for a patient bill, including referrer for discard routing. */
export function getInvoiceUrl(
  patientUuid: string,
  billUuid: string,
  referrerPathname: string = window.location.pathname,
): string {
  const spa = window.getOpenmrsSpaBase();
  const from = encodeInvoiceReferrerPath(referrerPathname);
  return `${spa}home/billing/patient/${patientUuid}/${billUuid}?${INVOICE_REFERRER_PARAM}=${from}`;
}

export function getPatientChartUrl(patientUuid: string): string {
  return `${window.getOpenmrsSpaBase()}patient/${patientUuid}/chart`;
}

export function decodeReferrerPathIndicatesBilling(encodedFrom: string | null): boolean {
  if (!encodedFrom) {
    return false;
  }
  try {
    return decodeURIComponent(encodedFrom).includes(BILLING_HOME_PATH);
  } catch {
    return false;
  }
}

/** Target for leaving the invoice (payments / bill details discard). */
export function getInvoiceDiscardDestination(encodedFromParam: string | null): string {
  const spa = window.getOpenmrsSpaBase();
  return decodeReferrerPathIndicatesBilling(encodedFromParam) ? `${spa}home/billing` : `${spa}home`;
}

export function getInvoiceDiscardDestinationFromSearch(search: string): string {
  const from = new URLSearchParams(search).get(INVOICE_REFERRER_PARAM);
  return getInvoiceDiscardDestination(from);
}

export function getBillUuidFromSaveResponse(response: unknown): string | undefined {
  const uuid = (response as { data?: { uuid?: string } })?.data?.uuid;
  return typeof uuid === 'string' ? uuid : undefined;
}
