import {
  decodeReferrerPathIndicatesBilling,
  encodeInvoiceReferrerPath,
  getBillUuidFromSaveResponse,
  getInvoiceDiscardDestination,
  getInvoiceDiscardDestinationFromSearch,
  getInvoiceUrl,
} from './billing-navigation';

describe('billing-navigation', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'getOpenmrsSpaBase', {
      configurable: true,
      value: () => '/openmrs/spa/',
    });
  });

  describe('encodeInvoiceReferrerPath / decodeReferrerPathIndicatesBilling', () => {
    it('detects billing context from encoded pathname', () => {
      const encoded = encodeInvoiceReferrerPath('/openmrs/spa/home/billing');
      expect(decodeReferrerPathIndicatesBilling(encoded)).toBe(true);
    });

    it('returns false for clinical home paths', () => {
      const encoded = encodeInvoiceReferrerPath('/openmrs/spa/home');
      expect(decodeReferrerPathIndicatesBilling(encoded)).toBe(false);
    });

    it('returns false for null or invalid encoding', () => {
      expect(decodeReferrerPathIndicatesBilling(null)).toBe(false);
      expect(decodeReferrerPathIndicatesBilling('%')).toBe(false);
    });
  });

  describe('getInvoiceDiscardDestination', () => {
    it('routes to billing home when referrer was under billing', () => {
      const from = encodeInvoiceReferrerPath('/openmrs/spa/home/billing');
      expect(getInvoiceDiscardDestination(from)).toBe('/openmrs/spa/home/billing');
    });

    it('routes to clinical home otherwise', () => {
      expect(getInvoiceDiscardDestination(encodeInvoiceReferrerPath('/openmrs/spa/home'))).toBe('/openmrs/spa/home');
    });
  });

  describe('getInvoiceDiscardDestinationFromSearch', () => {
    it('parses search string', () => {
      const from = encodeInvoiceReferrerPath('/openmrs/spa/home/billing');
      expect(getInvoiceDiscardDestinationFromSearch(`?from=${from}`)).toBe('/openmrs/spa/home/billing');
    });
  });

  describe('getInvoiceUrl', () => {
    it('builds invoice path with referrer query', () => {
      expect(getInvoiceUrl('p1', 'b1', '/openmrs/spa/home/billing')).toBe(
        `/openmrs/spa/home/billing/patient/p1/b1?from=${encodeURIComponent('/openmrs/spa/home/billing')}`,
      );
    });
  });

  describe('getBillUuidFromSaveResponse', () => {
    it('reads uuid from cashier bill POST shape', () => {
      expect(getBillUuidFromSaveResponse({ data: { uuid: 'bill-1' } })).toBe('bill-1');
      expect(getBillUuidFromSaveResponse({})).toBeUndefined();
    });
  });
});
