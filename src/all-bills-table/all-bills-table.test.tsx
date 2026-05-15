import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { navigate } from '@openmrs/esm-framework';
import { useBillsPaginated } from '../billing.resource';
import { getInvoiceUrl } from '../helpers';
import SelectedDateContext from '../hooks/selectedDateContext';
import AllBillsTable from './all-bills-table.component';

jest.mock('../billing.resource', () => ({
  useBillsPaginated: jest.fn(),
}));

jest.mock('@openmrs/esm-framework', () => ({
  useLayoutType: jest.fn(() => 'desktop'),
  isDesktop: jest.fn(() => true),
  useConfig: jest.fn(() => ({ bills: { pageSizes: [10], pageSize: 10 } })),
  useDebounce: jest.fn((value) => value),
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

const buildBillsResponse = (bills = [], totalCount = bills.length) => ({
  bills,
  totalCount,
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
  receiptNumber: 'INV-001',
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

const secondTestBill = {
  ...testBill,
  uuid: 'bill-uuid-2',
  patientUuid: 'patient-uuid-2',
  patientName: 'John Smith',
  identifier: 'PAT-002',
  receiptNumber: 'INV-002',
} as any;

const postedBill = {
  ...testBill,
  uuid: 'bill-uuid-3',
  patientUuid: 'patient-uuid-3',
  patientName: 'Posted Patient',
  identifier: 'PAT-003',
  receiptNumber: 'INV-003',
  status: 'POSTED',
  dateCreated: '09-Apr-2026, 09:00 AM',
  dateCreatedUnformatted: '2026-04-09T09:00:00.000Z',
} as any;

const paidBill = {
  ...testBill,
  uuid: 'bill-uuid-4',
  patientUuid: 'patient-uuid-4',
  patientName: 'Paid Patient',
  identifier: 'PAT-004',
  receiptNumber: 'INV-004',
  status: 'PAID',
  dateCreated: '10-Apr-2026, 08:00 AM',
  dateCreatedUnformatted: '2026-04-10T08:00:00.000Z',
} as any;

describe('AllBillsTable', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseBillsPaginated.mockImplementation(({ patientUuid, billStatus, receiptNumber }) => {
      if (patientUuid === 'patient-uuid-2') {
        return buildBillsResponse([secondTestBill]);
      }

      if (receiptNumber === 'INV-999') {
        return buildBillsResponse([
          {
            ...secondTestBill,
            patientName: 'Invoice Match',
            receiptNumber: 'INV-999',
          },
        ]);
      }

      if (receiptNumber) {
        return buildBillsResponse([]);
      }

      if (billStatus === 'PENDING') {
        return buildBillsResponse([testBill]);
      }

      if (billStatus === 'PAID') {
        return buildBillsResponse([paidBill]);
      }

      return buildBillsResponse([paidBill, postedBill, testBill], 3);
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

  test('navigates to the billing page when a row is clicked', async () => {
    const user = userEvent.setup();

    render(
      <SelectedDateContext.Provider value={{ selectedDate: null, setSelectedDate: jest.fn() }}>
        <AllBillsTable />
      </SelectedDateContext.Provider>,
    );

    await user.click(screen.getByText('Paid Patient'));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: getInvoiceUrl('patient-uuid-4', 'bill-uuid-4'),
    });
  });

  test('renders patient name as plain text instead of a patient chart link', () => {
    render(
      <SelectedDateContext.Provider value={{ selectedDate: null, setSelectedDate: jest.fn() }}>
        <AllBillsTable />
      </SelectedDateContext.Provider>,
    );

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Jane Doe' })).not.toBeInTheDocument();
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

  test('defaults to all bills and shows all returned statuses', () => {
    render(
      <SelectedDateContext.Provider value={{ selectedDate: null, setSelectedDate: jest.fn() }}>
        <AllBillsTable />
      </SelectedDateContext.Provider>,
    );

    expect(mockUseBillsPaginated.mock.calls[0][0]).toMatchObject({
      patientUuid: '',
      billStatus: '',
      receiptNumber: '',
      page: 1,
      pageSize: 10,
    });
    expect(
      mockUseBillsPaginated.mock.calls.every(
        ([params]) => !['PENDING', 'POSTED', 'PAID'].includes(params.billStatus ?? ''),
      ),
    ).toBe(true);

    expect(screen.getByText('All bills')).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent),
    ).toEqual([
      expect.stringContaining('Paid Patient'),
      expect.stringContaining('Posted Patient'),
      expect.stringContaining('Jane Doe'),
    ]);
  });

  test('filters bills by invoice number using the backend filter prop', async () => {
    render(
      <SelectedDateContext.Provider value={{ selectedDate: null, setSelectedDate: jest.fn() }}>
        <AllBillsTable receiptNumber="INV-999" />
      </SelectedDateContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Invoice Match')).toBeInTheDocument();
    });
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  test('filters bills by selected patient uuid using the backend filter', () => {
    render(
      <SelectedDateContext.Provider value={{ selectedDate: null, setSelectedDate: jest.fn() }}>
        <AllBillsTable patientUuid="patient-uuid-2" />
      </SelectedDateContext.Provider>,
    );

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  test('keeps the search controls visible when an invoice filter prop has no matching bills', () => {
    render(
      <SelectedDateContext.Provider value={{ selectedDate: null, setSelectedDate: jest.fn() }}>
        <AllBillsTable receiptNumber="does-not-exist" />
      </SelectedDateContext.Provider>,
    );

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByText('No matching bills to display')).toBeInTheDocument();
    expect(screen.queryByText('There are no bills to display.')).not.toBeInTheDocument();
  });
});
