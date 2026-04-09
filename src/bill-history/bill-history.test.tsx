import React from 'react';
import { render, screen } from '@testing-library/react';
import BillHistory from './bill-history.component';
import { useBill, useBills } from '../billing.resource';
import userEvent from '@testing-library/user-event';
import { useConfig } from '@openmrs/esm-framework';
import { PaymentStatus } from '../types';
import { useLaunchBillingWorkspaceRequiringVisit } from '../workspaces';

const testProps = {
  patientUuid: 'some-uuid',
};

const mockbills = useBills as jest.MockedFunction<typeof useBills>;
const mockUseBill = useBill as jest.MockedFunction<typeof useBill>;
const mockUseLaunchWorkspaceRequiringVisit = useLaunchBillingWorkspaceRequiringVisit as jest.MockedFunction<
  typeof useLaunchBillingWorkspaceRequiringVisit
>;
const mockBillsMutate = jest.fn().mockResolvedValue(undefined);

const mockBillsData = [
  {
    uuid: '1',
    patientName: 'John Doe',
    receiptNumber: 'INV-001',
    totalAmount: 500,
    dateCreated: '05-Apr-2026, 11:21 PM',
    status: PaymentStatus.PENDING,
    lineItems: [{ billableService: 'service-1:Registration' }],
  },
  {
    uuid: '2',
    patientName: 'John Doe',
    receiptNumber: 'INV-002',
    totalAmount: 600,
    dateCreated: '05-Apr-2026, 03:00 AM',
    status: PaymentStatus.PAID,
    lineItems: [{ billableService: 'service-2:Consultation' }],
  },
  {
    uuid: '3',
    patientName: 'John Doe',
    receiptNumber: 'INV-003',
    totalAmount: 700,
    dateCreated: '04-Apr-2026, 01:00 PM',
    status: PaymentStatus.PAID,
    lineItems: [{ billableService: 'service-3:Child services' }],
  },
  {
    uuid: '4',
    patientName: 'John Doe',
    receiptNumber: 'INV-004',
    totalAmount: 800,
    dateCreated: '04-Apr-2026',
    status: PaymentStatus.PAID,
    lineItems: [{ billableService: 'service-4:Medication' }],
  },
  {
    uuid: '5',
    patientName: 'John Doe',
    receiptNumber: 'INV-005',
    totalAmount: 900,
    dateCreated: '03-Apr-2026',
    status: PaymentStatus.PAID,
    lineItems: [{ billableService: 'service-5:Lab' }],
  },
  {
    uuid: '6',
    patientName: 'John Doe',
    receiptNumber: 'INV-006',
    totalAmount: 400,
    dateCreated: '03-Apr-2026',
    status: PaymentStatus.PAID,
    lineItems: [{ billableService: 'service-6:Pharmacy' }],
  },
  {
    uuid: '7',
    patientName: 'John Doe',
    receiptNumber: 'INV-007',
    totalAmount: 300,
    dateCreated: '02-Apr-2026',
    status: PaymentStatus.PAID,
    lineItems: [{ billableService: 'service-7:Nutrition' }],
  },
  {
    uuid: '8',
    patientName: 'John Doe',
    receiptNumber: 'INV-008',
    totalAmount: 200,
    dateCreated: '02-Apr-2026',
    status: PaymentStatus.PAID,
    lineItems: [{ billableService: 'service-8:Physiotherapy' }],
  },
  {
    uuid: '9',
    patientName: 'John Doe',
    receiptNumber: 'INV-009',
    totalAmount: 1100,
    dateCreated: '01-Apr-2026',
    status: PaymentStatus.PAID,
    lineItems: [{ billableService: 'service-9:Dentist' }],
  },
  {
    uuid: '10',
    patientName: 'John Doe',
    receiptNumber: 'INV-010',
    totalAmount: 1200,
    dateCreated: '01-Apr-2026',
    status: PaymentStatus.PAID,
    lineItems: [{ billableService: 'service-10:Neuro' }],
  },
  {
    uuid: '11',
    patientName: 'John Doe',
    receiptNumber: 'INV-011',
    totalAmount: 1050,
    dateCreated: '31-Mar-2026',
    status: PaymentStatus.PAID,
    lineItems: [{ billableService: 'service-11:Outpatient' }],
  },
  {
    uuid: '12',
    patientName: 'John Doe',
    receiptNumber: 'INV-012',
    totalAmount: 1300,
    dateCreated: '31-Mar-2026',
    status: PaymentStatus.PAID,
    lineItems: [{ billableService: 'service-12:MCH' }],
  },
];

jest.mock('../invoice/bill-details.component', () =>
  jest.fn(({ onDiscard }: { onDiscard?: () => void }) => (
    <div>
      <div>Bill details</div>
      <button type="button" onClick={onDiscard}>
        Discard
      </button>
    </div>
  )),
);

jest.mock('../billing.resource', () => ({
  ...jest.requireActual('../billing.resource'),
  useBill: jest.fn(() => ({
    bill: { uuid: '1', lineItems: [], payments: [] },
    isLoading: false,
    isValidating: false,
    error: null,
  })),
  useBills: jest.fn(() => ({
    bills: mockBillsData,
    isLoading: false,
    isValidating: false,
    error: null,
    mutate: mockBillsMutate,
  })),
}));

jest.mock('@openmrs/esm-patient-common-lib', () => ({
  usePaginationInfo: jest.fn(() => ({ pageSizes: [10, 20, 50] })),
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EmptyState: ({ launchForm }: { launchForm?: () => void }) => (
    <button type="button" onClick={launchForm}>
      Empty State Launch
    </button>
  ),
  ErrorState: ({ error }: { error: Error }) => (
    <div>
      <div>Sorry, there was a problem displaying this information.</div>
      <div>{error.message}</div>
    </div>
  ),
}));

jest.mock('../workspaces', () => ({
  useLaunchBillingWorkspaceRequiringVisit: jest.fn(),
  launchBillingWorkspace: jest.fn(),
}));

jest.mock('@openmrs/esm-framework', () => ({
  useConfig: jest.fn(),
  useLayoutType: jest.fn(() => 'desktop'),
  isDesktop: jest.fn(() => true),
  usePagination: (items: any[], pageSize: number) => {
    const [currentPage, setCurrentPage] = React.useState(1);
    const results = React.useMemo(() => {
      const start = (currentPage - 1) * pageSize;
      return items.slice(start, start + pageSize);
    }, [items, pageSize, currentPage]);
    const paginated = items.length > pageSize;
    const goTo = (page: number) => setCurrentPage(page);
    return { paginated, goTo, results, currentPage };
  },
}));

describe('BillHistory', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    mockBillsMutate.mockClear();
    mockUseLaunchWorkspaceRequiringVisit.mockReturnValue(jest.fn());
    mockUseBill.mockReturnValue({
      bill: { uuid: '1', lineItems: [], payments: [], status: PaymentStatus.PENDING, closed: false } as any,
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: jest.fn(),
    });
  });

  test('should render loading datatable skeleton', () => {
    (useConfig as jest.Mock).mockReturnValue({ billHistoryDays: 365, visitRequired: true });
    mockbills.mockReturnValueOnce({ isLoading: true, isValidating: false, error: null, bills: [], mutate: jest.fn() });
    render(<BillHistory {...testProps} />);
    const loadingSkeleton = screen.getByRole('table');
    expect(loadingSkeleton).toBeInTheDocument();
    expect(loadingSkeleton).toHaveClass('cds--skeleton cds--data-table cds--data-table--zebra');
  });

  test('should render error state when API call fails', () => {
    (useConfig as jest.Mock).mockReturnValue({ billHistoryDays: 365, visitRequired: true });
    mockbills.mockReturnValueOnce({
      isLoading: false,
      isValidating: false,
      error: new Error('some error'),
      bills: [],
      mutate: jest.fn(),
    });
    render(<BillHistory {...testProps} />);
    const errorState = screen.getByText(/Sorry, there was a problem displaying this information./);
    expect(errorState).toBeInTheDocument();
  });

  test('should render bills table', async () => {
    (useConfig as jest.Mock).mockReturnValue({ billHistoryDays: 365, visitRequired: true });
    const user = userEvent.setup();
    mockbills.mockReturnValueOnce({
      isLoading: false,
      isValidating: false,
      error: null,
      bills: mockBillsData as any,
      mutate: mockBillsMutate,
    });
    render(<BillHistory {...testProps} />);
    expect(screen.getByText('Bill date')).toBeInTheDocument();
    expect(screen.getByText('Invoice number')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText(/All bills total:/i)).toBeInTheDocument();
    const expectedColumnHeaders = [/Bill date/, /Invoice number/, /Billed items/, /Bill total/, /Status/];
    expectedColumnHeaders.forEach((header) => {
      expect(screen.getByRole('button', { name: header })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /view bill details from invoice number inv-001/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /view bill details from status for invoice inv-001/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Print' })).not.toBeInTheDocument();

    const tableRowGroup = screen.getAllByRole('rowgroup');
    expect(tableRowGroup).toHaveLength(2);

    // Page navigation should work as expected
    const nextPageButton = screen.getByRole('button', { name: /Next page/ });
    const prevPageButton = screen.getByRole('button', { name: /Previous page/ });

    expect(nextPageButton).toBeInTheDocument();
    expect(prevPageButton).toBeInTheDocument();

    expect(screen.getByText(/1–10 of 12 items/)).toBeInTheDocument();
    await user.click(nextPageButton);
    expect(screen.getByText(/11–12 of 12 items/)).toBeInTheDocument();
    await user.click(prevPageButton);
    expect(screen.getByText(/1–10 of 12 items/)).toBeInTheDocument();
  });

  test('should make invoice number and status clickable for every bill status', () => {
    (useConfig as jest.Mock).mockReturnValue({ billHistoryDays: 365, visitRequired: true });
    mockbills.mockReturnValueOnce({
      isLoading: false,
      isValidating: false,
      error: null,
      bills: [
        mockBillsData[0],
        { ...mockBillsData[1], uuid: 'posted-bill', receiptNumber: 'INV-POSTED', status: PaymentStatus.POSTED },
        mockBillsData[1],
      ] as any,
      mutate: mockBillsMutate,
    });

    render(<BillHistory {...testProps} />);

    expect(screen.getByRole('button', { name: /view bill details from invoice number inv-001/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /view bill details from invoice number inv-posted/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view bill details from invoice number inv-002/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /view bill details from status for invoice inv-001/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /view bill details from status for invoice inv-posted/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /view bill details from status for invoice inv-002/i }),
    ).toBeInTheDocument();
  });

  test('should show bill details below the table when invoice number is clicked and hide it on discard', async () => {
    (useConfig as jest.Mock).mockReturnValue({ billHistoryDays: 365, visitRequired: true });
    const user = userEvent.setup();
    mockbills.mockReturnValueOnce({
      isLoading: false,
      isValidating: false,
      error: null,
      bills: mockBillsData as any,
      mutate: mockBillsMutate,
    });
    mockUseBill.mockReturnValueOnce({
      bill: { uuid: '1', lineItems: [], payments: [], status: PaymentStatus.PENDING, closed: false } as any,
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: jest.fn(),
    });

    render(<BillHistory {...testProps} />);
    await user.click(screen.getByRole('button', { name: /view bill details from invoice number inv-001/i }));

    expect(screen.getByText('Bill details')).toBeInTheDocument();
    expect(screen.queryByText('Patient billing history')).not.toBeInTheDocument();
    expect(screen.queryByText('Invoice number')).not.toBeInTheDocument();
    expect(screen.queryByText(/1–10 of 12 items/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(mockBillsMutate).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Bill details')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add bill item(s)' })).toBeInTheDocument();
    expect(screen.getByText('Invoice number')).toBeInTheDocument();
  });

  test('should show bill details below the table when status is clicked', async () => {
    (useConfig as jest.Mock).mockReturnValue({ billHistoryDays: 365, visitRequired: true });
    const user = userEvent.setup();
    mockbills.mockReturnValueOnce({
      isLoading: false,
      isValidating: false,
      error: null,
      bills: mockBillsData as any,
      mutate: mockBillsMutate,
    });
    mockUseBill.mockReturnValueOnce({
      bill: { uuid: '2', lineItems: [], payments: [], status: PaymentStatus.PAID, closed: false } as any,
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: jest.fn(),
    });

    render(<BillHistory {...testProps} />);
    await user.click(screen.getByRole('button', { name: /view bill details from status for invoice inv-002/i }));

    expect(screen.getByText('Bill details')).toBeInTheDocument();
  });

  test('should render empty state view when there are no bills', async () => {
    (useConfig as jest.Mock).mockReturnValue({ billHistoryDays: 365, visitRequired: true });
    mockbills.mockReturnValueOnce({ isLoading: false, isValidating: false, error: null, bills: [], mutate: jest.fn() });
    render(<BillHistory {...testProps} />);
  });
});
