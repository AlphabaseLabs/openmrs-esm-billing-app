import { openmrsFetch } from '@openmrs/esm-framework';
import { addBillLineItem } from '../billing.resource';
import { type BillingService } from '../types';

const mockFetch = jest.mocked(openmrsFetch);
const service = {
  uuid: 'service',
  name: 'Consultation',
  servicePrices: [{ uuid: 'price', name: 'Cash', price: 500 }],
} as BillingService;

beforeEach(() => jest.clearAllMocks());

test('appends to the specified invoice using fresh server UUIDs, retaining voided items', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    data: { lineItems: [{ uuid: 'existing' }, { uuid: 'concurrent-item' }, { uuid: 'voided-item', voided: true }] },
  } as any);
  mockFetch.mockResolvedValueOnce({
    ok: true,
    data: { lineItems: [{ uuid: 'existing' }, { uuid: 'concurrent-item' }, { uuid: 'new-item' }] },
  } as any);
  mockFetch.mockResolvedValueOnce({ ok: true, data: {} } as any);
  await expect(addBillLineItem('bill', service)).resolves.toEqual({ uuid: 'new-item' });
  expect(mockFetch.mock.calls[0][0]).toContain('/cashier/bill/bill?v=full&includeVoided=true');
  expect(mockFetch.mock.calls[1]).toEqual([
    expect.stringContaining('/cashier/bill/bill'),
    expect.objectContaining({
      method: 'POST',
      body: {
        lineItems: [
          'existing',
          'concurrent-item',
          'voided-item',
          expect.objectContaining({
            billableService: 'service',
            quantity: 1,
            price: 500,
            priceName: 'Cash',
            priceUuid: 'price',
            paymentStatus: 'PENDING',
            lineItemOrder: 3,
            dateCreated: expect.any(String),
          }),
        ],
      },
    }),
  ]);
});

test('does not change a bill that was closed after the page loaded', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true, data: { closed: true } } as any);
  await expect(addBillLineItem('bill', service)).rejects.toThrow('closed');
  expect(mockFetch).toHaveBeenCalledTimes(1);
});
