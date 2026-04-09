import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { navigate } from '@openmrs/esm-framework';
import { useBillsPaginated } from '../billing.resource';
import { getInvoiceUrl, getPatientChartUrl } from '../helpers';
import SelectedDateContext from '../hooks/selectedDateContext';
import AllBillsTable from './all-bills-table.component';

jest.mock('../billing.resource', () => ({
  useBillsPaginated: jest.fn(),
}));

jest.mock('@openmrs/esm-framework', () => ({
  useLayoutType: jest.fn(() => 'desktop'),
  isDesktop: jest.fn(() => true),
  useConfig: jest.fn(() => ({ bills: { pageSizes: [10], pageSize: 10 } })),
  ErrorState: ({ error, headerTitle }: { error: Error; headerTitle: string }) => (
    <div>
      <span>{headerTitle}</span>
      <span>{error.message}</span>
    </div>
  ),
  navigate: jest.fn(),
}));

jest.mock('@openmrs/esm-patient-common-lib', () => ({
  EmptyDataIllustration: () => <div>Empty state</div>,
}));

const mockUseBillsPaginated = useBillsPaginated as jest.Mock;
const mockNavigate = navigate as jest.Mock;

const buildBillsResponse = (bills = []) => ({
  bills,
  totalCount: bills.length,
  isLoading: false,
  isValidating: false,
  error: null,
  mutate: jest.fn(),
});

const testBill = {
  uuid: 'bill-uuid',
  patientUuid: 'patient-uuid',
  patientName: 'Jane Doe',
  identifier: 'PAT-001',
  dateCreated: '08-Apr-2026, 10:00 AM',
  dateCreatedUnformatted: '2026-04-08T10:00:00.000Z',
  status: 'PENDING',
  totalAmount: 250,
  lineItems: [
    {
      billableService: 'service-uuid:Consultation',
      item: 'service-uuid:Consultation',
    },
  ],
} as any;

describe('AllBillsTable', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseBillsPaginated.mockImplementation(({ billStatus, enabled }) => {
      if (!enabled) {
        return buildBillsResponse();
      }

      if (billStatus === 'PENDING') {
        return buildBillsResponse([testBill]);
      }

      if (billStatus === 'POSTED') {
        return buildBillsResponse();
      }

      return buildBillsResponse();
    });
    Object.defineProperty(window, 'getOpenmrsSpaBase', {
      configurable: true,
      writable: true,
      value: jest.fn(() => '/'),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('navigates to the billing page when a row is clicked outside the patient name', async () => {
    const user = userEvent.setup();

    render(
      <SelectedDateContext.Provider value={{ selectedDate: null, setSelectedDate: jest.fn() }}>
        <AllBillsTable />
      </SelectedDateContext.Provider>,
    );

    const row = screen.getByText('Jane Doe').closest('tr');
    expect(row).not.toBeNull();
    await user.click(screen.getByText('PENDING'));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: getInvoiceUrl('patient-uuid', 'bill-uuid'),
    });
  });

  test('patient name links to the patient chart', () => {
    render(
      <SelectedDateContext.Provider value={{ selectedDate: null, setSelectedDate: jest.fn() }}>
        <AllBillsTable />
      </SelectedDateContext.Provider>,
    );

    const link = screen.getByRole('link', { name: 'Jane Doe' });
    expect(link).toHaveAttribute('href', getPatientChartUrl('patient-uuid'));
  });

  test('renders the bill list columns in the new order without the identifier column', () => {
    render(
      <SelectedDateContext.Provider value={{ selectedDate: null, setSelectedDate: jest.fn() }}>
        <AllBillsTable />
      </SelectedDateContext.Provider>,
    );

    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Bill date',
      'Name',
      'Status',
      'Billed items',
      'Bill total',
    ]);
    expect(screen.queryByText('Patient identifier')).not.toBeInTheDocument();
  });
});
