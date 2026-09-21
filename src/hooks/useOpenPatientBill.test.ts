import { openmrsFetch } from '@openmrs/esm-framework';
import { fetchOpenPatientBill } from './useOpenPatientBill';

const mockFetch = jest.mocked(openmrsFetch);
beforeEach(() => jest.clearAllMocks());

test('finds the latest open bill, excluding closed, voided, and other patients', async () => {
  const patient = { uuid: 'patient' };
  const older = { uuid: 'older', patient, dateCreated: '2026-01-01' };
  const latest = { uuid: 'latest', patient, dateCreated: '2026-02-01' };
  mockFetch.mockResolvedValueOnce({
    ok: true,
    data: {
      results: [
        older,
        latest,
        { uuid: 'closed', patient, dateCreated: '2026-03-01', closed: true },
        { uuid: 'voided', patient, dateCreated: '2026-03-01', voided: true },
        { uuid: 'other', patient: { uuid: 'other' }, dateCreated: '2026-03-01' },
      ],
    },
  } as any);
  await expect(fetchOpenPatientBill('patient')).resolves.toEqual(latest);
  expect(mockFetch.mock.calls[0][0]).toContain('patientUuid=patient&includeClosedBills=false&includeVoidedBills=false');
});

test('follows pagination before concluding there is no open bill', async () => {
  const bill = { uuid: 'bill', patient: { uuid: 'patient' } };
  mockFetch.mockResolvedValueOnce({
    ok: true,
    data: { results: [], links: [{ rel: 'next', uri: '/next-page' }] },
  } as any);
  mockFetch.mockResolvedValueOnce({ ok: true, data: { results: [bill] } } as any);
  await expect(fetchOpenPatientBill('patient')).resolves.toEqual(bill);
  expect(mockFetch).toHaveBeenLastCalledWith('/next-page');
});

test('returns null only for a successful empty response', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true, data: { results: [] } } as any);
  await expect(fetchOpenPatientBill('patient')).resolves.toBeNull();
  mockFetch.mockResolvedValueOnce({ ok: false, data: {} } as any);
  await expect(fetchOpenPatientBill('patient')).rejects.toThrow('Unable to check patient bills');
});
