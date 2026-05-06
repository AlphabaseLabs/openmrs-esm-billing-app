import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { navigate } from '@openmrs/esm-framework';
import { useBills, useBillsPaginated } from '../billing.resource';
import { getInvoiceUrl } from '../helpers';
import SelectedDateContext from '../hooks/selectedDateContext';
import AllBillsTable from './all-bills-table.component';

jest.mock('../billing.resource', () => ({
  useBills: jest.fn(),
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
const mockUseBills = useBills as jest.Mock;
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
    mockUseBills.mockImplementation((_patientUuid, _billStatus, _startingDate, _endDate, enabled) => {
      if (!enabled) {
        return {
          bills: [],
          error: null,
          isLoading: false,
          isValidating: false,
          mutate: jest.fn(),
        };
      }

      return {
        bills: [testBill],
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      };
    });
    mockUseBillsPaginated.mockImplementation(({ billStatus, enabled }) => {
      if (!enabled) {
        return buildBillsResponse();
      }

      if (billStatus === 'PENDING') {
        return buildBillsResponse([testBill]);
      }

      if (billStatus === 'POSTED') {
        return buildBillsResponse([postedBill]);
      }

      if (billStatus === 'PAID') {
        return buildBillsResponse([paidBill]);
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

  test('defaults to all bills and sorts pending, posted, and paid bills by date', () => {
    render(
      <SelectedDateContext.Provider value={{ selectedDate: null, setSelectedDate: jest.fn() }}>
        <AllBillsTable />
      </SelectedDateContext.Provider>,
    );

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

  test('filters bills by invoice number', async () => {
    const user = userEvent.setup();
    const hiddenBill = {
      ...secondTestBill,
      patientName: 'Invoice Match',
      receiptNumber: 'INV-999',
    } as any;

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
    mockUseBills.mockImplementation((_patientUuid, billStatus, _startingDate, _endDate, enabled) => {
      if (!enabled) {
        return {
          bills: [],
          error: null,
          isLoading: false,
          isValidating: false,
          mutate: jest.fn(),
        };
      }

      if (billStatus === 'PENDING') {
        return {
          bills: [testBill, hiddenBill],
          error: null,
          isLoading: false,
          isValidating: false,
          mutate: jest.fn(),
        };
      }

      return {
        bills: [],
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      };
    });

    render(
      <SelectedDateContext.Provider value={{ selectedDate: null, setSelectedDate: jest.fn() }}>
        <AllBillsTable />
      </SelectedDateContext.Provider>,
    );

    expect(screen.queryByText('Invoice Match')).not.toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'INV-999');

    expect(screen.getByText('Invoice Match')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  test('filters bills by billed items', async () => {
    const user = userEvent.setup();
    const hiddenBill = {
      ...secondTestBill,
      patientName: 'Service Match',
      lineItems: [
        {
          billableService: 'service-uuid:Teeth Whitening',
          item: 'service-uuid:Teeth Whitening',
        },
      ],
    } as any;

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
    mockUseBills.mockImplementation((_patientUuid, billStatus, _startingDate, _endDate, enabled) => {
      if (!enabled) {
        return {
          bills: [],
          error: null,
          isLoading: false,
          isValidating: false,
          mutate: jest.fn(),
        };
      }

      if (billStatus === 'PENDING') {
        return {
          bills: [testBill, hiddenBill],
          error: null,
          isLoading: false,
          isValidating: false,
          mutate: jest.fn(),
        };
      }

      return {
        bills: [],
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      };
    });

    render(
      <SelectedDateContext.Provider value={{ selectedDate: null, setSelectedDate: jest.fn() }}>
        <AllBillsTable />
      </SelectedDateContext.Provider>,
    );

    expect(screen.queryByText('Service Match')).not.toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'teeth whitening');

    expect(screen.getByText('Service Match')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  test('keeps the search controls visible when a search has no matching bills', async () => {
    const user = userEvent.setup();

    render(
      <SelectedDateContext.Provider value={{ selectedDate: null, setSelectedDate: jest.fn() }}>
        <AllBillsTable />
      </SelectedDateContext.Provider>,
    );

    await user.type(screen.getByRole('searchbox'), 'does-not-exist');

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByText('No matching bills to display')).toBeInTheDocument();
    expect(screen.queryByText('There are no bills to display.')).not.toBeInTheDocument();
  });
});
