import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { navigate, showSnackbar, useConfig } from '@openmrs/esm-framework';
import { processBillItems } from './billing.resource';
import useOpenPatientBill, { fetchOpenPatientBill } from './hooks/useOpenPatientBill';
import CreateEmptyBillButton from './create-empty-bill-button.component';
import routes from './routes.json';

jest.mock('./hooks/useOpenPatientBill');
jest.mock('./billing.resource', () => ({ processBillItems: jest.fn() }));
jest.mock('swr', () => ({ mutate: jest.fn() }));
jest.mock('./helpers', () => ({
  getBillUuidFromSaveResponse: (response) => response?.data?.uuid,
  getInvoiceUrl: (patientUuid, billUuid) => `/home/billing/patient/${patientUuid}/${billUuid}`,
}));

const mockProcessBillItems = jest.mocked(processBillItems);

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useOpenPatientBill).mockReturnValue({ bill: null, isLoading: false, error: undefined });
  jest.mocked(fetchOpenPatientBill).mockResolvedValue(null);
  jest.mocked(useConfig).mockReturnValue({ cashPointUuid: 'cash-point', cashierUuid: 'cashier' });
});

test('creates an empty pending bill once and opens its invoice after saving', async () => {
  const user = userEvent.setup();
  let resolveSave: (value: any) => void;
  mockProcessBillItems.mockReturnValue(
    new Promise((resolve) => {
      resolveSave = resolve;
    }),
  );
  const dispatch = jest.spyOn(window, 'dispatchEvent');
  const onSuccess = jest.fn();
  render(<CreateEmptyBillButton patientUuid="patient" onSuccess={onSuccess} />);
  await user.click(screen.getByRole('button', { name: 'Create bill' }));
  expect(screen.getByRole('button', { name: /creating bill/i })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: /creating bill/i }));
  expect(mockProcessBillItems).toHaveBeenCalledTimes(1);
  expect(mockProcessBillItems).toHaveBeenCalledWith({
    patient: 'patient',
    cashPoint: 'cash-point',
    cashier: 'cashier',
    status: 'PENDING',
    lineItems: [],
    payments: [],
  });
  expect(navigate).not.toHaveBeenCalled();
  expect(onSuccess).not.toHaveBeenCalled();
  await act(async () => resolveSave({ ok: true, data: { uuid: 'bill' } }));
  expect(navigate).toHaveBeenCalledWith({ to: '/home/billing/patient/patient/bill' });
  expect(onSuccess).toHaveBeenCalledTimes(1);
  expect(dispatch.mock.calls.map(([event]) => event.type)).toEqual(
    expect.arrayContaining(['openmrs:active-visits-billing-refresh', 'openmrs:active-visits-refresh']),
  );
  dispatch.mockRestore();
});

test('shows an error and permits retry when creation fails', async () => {
  mockProcessBillItems.mockRejectedValue(new Error('Server error'));
  const onSuccess = jest.fn();
  render(<CreateEmptyBillButton patientUuid="patient" onSuccess={onSuccess} />);
  await userEvent.click(screen.getByRole('button', { name: 'Create bill' }));
  await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'error' })));
  expect(navigate).not.toHaveBeenCalled();
  expect(onSuccess).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Create bill' })).toBeEnabled();
});

test('shows Process bill without an icon and opens the existing bill without posting', async () => {
  const bill = { uuid: 'existing-bill', patient: { uuid: 'patient' } };
  jest.mocked(useOpenPatientBill).mockReturnValue({ bill, isLoading: false, error: undefined });
  jest.mocked(fetchOpenPatientBill).mockResolvedValue(bill);
  const onSuccess = jest.fn();
  render(<CreateEmptyBillButton patientUuid="patient" checkExistingBill showIcon={false} onSuccess={onSuccess} />);
  const button = screen.getByRole('button', { name: 'Process bill' });
  expect(button.querySelector('svg')).toBeNull();
  await userEvent.click(button);
  expect(mockProcessBillItems).not.toHaveBeenCalled();
  expect(navigate).toHaveBeenCalledWith({ to: '/home/billing/patient/patient/existing-bill' });
  expect(onSuccess).toHaveBeenCalledTimes(1);
});

test('rechecks stale search results and opens a bill created since the search loaded', async () => {
  jest.mocked(fetchOpenPatientBill).mockResolvedValue({ uuid: 'newly-created', patient: { uuid: 'patient' } });
  render(<CreateEmptyBillButton patientUuid="patient" checkExistingBill showIcon={false} />);
  const button = screen.getByRole('button', { name: 'Create bill' });
  expect(button.querySelector('svg')).toBeNull();
  await userEvent.click(button);
  expect(mockProcessBillItems).not.toHaveBeenCalled();
  expect(navigate).toHaveBeenCalledWith({ to: '/home/billing/patient/patient/newly-created' });
});

test('creates an empty bill from search only after confirming no open bill exists', async () => {
  mockProcessBillItems.mockResolvedValue({ ok: true, data: { uuid: 'created' } } as any);
  render(<CreateEmptyBillButton patientUuid="patient" checkExistingBill showIcon={false} />);
  await userEvent.click(screen.getByRole('button', { name: 'Create bill' }));
  expect(fetchOpenPatientBill).toHaveBeenCalledWith('patient');
  expect(mockProcessBillItems).toHaveBeenCalledWith(
    expect.objectContaining({ patient: 'patient', lineItems: [], payments: [] }),
  );
  expect(navigate).toHaveBeenCalledWith({ to: '/home/billing/patient/patient/created' });
});

test('does not create a bill when the preflight lookup fails', async () => {
  jest.mocked(fetchOpenPatientBill).mockRejectedValue(new Error('Lookup failed'));
  render(<CreateEmptyBillButton patientUuid="patient" checkExistingBill />);
  await userEvent.click(screen.getByRole('button', { name: 'Create bill' }));
  expect(mockProcessBillItems).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
  expect(showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'error' }));
});

test('disables the search action until the initial bill lookup finishes', () => {
  jest.mocked(useOpenPatientBill).mockReturnValue({ bill: undefined, isLoading: true, error: undefined });
  render(<CreateEmptyBillButton patientUuid="patient" checkExistingBill />);
  expect(screen.getByRole('button', { name: 'Opening bill…' })).toBeDisabled();
  expect(mockProcessBillItems).not.toHaveBeenCalled();
});

test('preserves the calling app label, styling, size, and existing create icon', () => {
  render(
    <CreateEmptyBillButton
      patientUuid="patient"
      createBillLabel="Original create label"
      className="billingButton"
      size="lg"
    />,
  );
  const button = screen.getByRole('button', { name: 'Original create label' });
  expect(button).toHaveClass('billingButton', 'cds--btn--tertiary', 'cds--btn--lg');
  expect(button.querySelector('svg')).not.toBeNull();
});

test('registers the shared billing action in separate slots for each consuming app', () => {
  const extensions = routes.extensions.filter((extension) => extension.component === 'createEmptyBillButton');
  expect(extensions.map((extension) => extension.slot)).toEqual([
    'appointments-create-empty-bill-slot',
    'active-visits-create-empty-bill-slot',
    'patient-search-create-empty-bill-slot',
  ]);
  expect(new Set(extensions.map((extension) => extension.name)).size).toBe(extensions.length);
});
