import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InvoiceTable from './invoice-table.component';
import { mockBillData } from '../../__mocks__/bill.mock';
import { openPendingBill } from './invoice-story.fixtures';
import { launchBillingWorkspace } from '../workspaces';
import useBillableServices from '../hooks/useBillableServices';
import { updateBillLineItem } from '../billing.resource';
import { PaymentStatus } from '../types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('@openmrs/esm-framework', () => ({
  EditIcon: () => <span>Edit</span>,
  isDesktop: jest.fn(() => true),
  showSnackbar: jest.fn(),
  useDebounce: (value: string) => value,
  useLayoutType: jest.fn(() => 'desktop'),
}));

jest.mock('../workspaces', () => ({
  launchBillingWorkspace: jest.fn(),
}));

jest.mock('../hooks/useBillableServices');
jest.mock('../billing.resource', () => ({
  updateBillLineItem: jest.fn(),
}));

const mockLaunchBillingWorkspace = launchBillingWorkspace as jest.MockedFunction<typeof launchBillingWorkspace>;
const mockUseBillableServices = useBillableServices as jest.MockedFunction<typeof useBillableServices>;
const mockUpdateBillLineItem = updateBillLineItem as jest.MockedFunction<typeof updateBillLineItem>;

const addBillItemWorkspaceExpectation = (patientUuid: string) => ({
  patientUuid,
  workspaceTitle: 'Add bill item',
  navigateToBillAfterSave: true,
});

describe('InvoiceTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateBillLineItem.mockResolvedValue({ ok: true } as any);
    mockUseBillableServices.mockReturnValue({
      billableServices: [],
      error: null,
      isLoading: false,
    } as ReturnType<typeof useBillableServices>);
  });

  it('shows add bill item button for open bills and launches bill form', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={mockBillData[0]} />);

    const addBillItemButton = screen.getByRole('button', { name: /add bill item/i });
    expect(addBillItemButton).toBeInTheDocument();

    await user.click(addBillItemButton);

    expect(mockLaunchBillingWorkspace).toHaveBeenCalledWith(
      'billing-form',
      addBillItemWorkspaceExpectation(mockBillData[0].patientUuid),
    );
  });

  it('hides add bill item button for closed bills', () => {
    render(<InvoiceTable bill={{ ...mockBillData[0], closed: true }} />);

    expect(screen.queryByRole('button', { name: /add bill item/i })).not.toBeInTheDocument();
  });

  it('searches invoice line items by billable service short name', async () => {
    const user = userEvent.setup();

    mockUseBillableServices.mockReturnValue({
      billableServices: [
        {
          uuid: 'service-uuid-1',
          name: 'General Consultation',
          shortName: 'GCON',
          serviceStatus: 'ENABLED',
          serviceType: { display: 'Consultation' },
          servicePrices: [],
        },
      ],
      error: null,
      isLoading: false,
    } as ReturnType<typeof useBillableServices>);

    render(
      <InvoiceTable
        bill={{
          ...mockBillData[0],
          lineItems: [
            { ...mockBillData[0].lineItems[0], item: '', billableService: 'service-uuid-1:General Consultation' },
          ],
        }}
      />,
    );

    await user.type(screen.getByRole('searchbox'), 'GCON');

    expect(screen.getByText('General Consultation')).toBeInTheDocument();
  });

  it('keeps the bill-item edit affordance layout-neutral between read and edit mode', async () => {
    const user = userEvent.setup();

    mockUseBillableServices.mockReturnValue({
      billableServices: [
        {
          uuid: 'service-clear-aligner',
          name: 'Clear Aligner',
          shortName: 'Clear Aligner',
          serviceStatus: 'ENABLED',
          servicePrices: [{ uuid: 'price-clear-aligner', name: 'Default', price: 249999 }],
        },
      ],
      error: null,
      isLoading: false,
    } as ReturnType<typeof useBillableServices>);

    render(<InvoiceTable bill={openPendingBill} />);

    const valueCellButton = screen.getByRole('button', { name: /clear aligner/i });
    const editableRoot = valueCellButton.closest('[data-testid="editable-text-cell"]');
    expect(editableRoot).toBeInTheDocument();
    expect(within(editableRoot as HTMLElement).getByTestId('editable-text-content')).toBeInTheDocument();
    expect(within(editableRoot as HTMLElement).getByTestId('editable-text-affordance')).toBeInTheDocument();

    await user.click(valueCellButton);

    expect(await screen.findByRole('dialog', { name: /bill item options/i })).toBeInTheDocument();
    expect(within(editableRoot as HTMLElement).getByTestId('editable-text-content')).toBeInTheDocument();
  });

  it('opens bill-item editor only for editable rows and renders read-only rows without an affordance', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={{ ...openPendingBill, closed: true, status: PaymentStatus.PAID }} />);

    const closedBillItem = screen.getByText(/clear aligner/i);
    await user.click(closedBillItem);

    expect(screen.queryByRole('dialog', { name: /bill item options/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /select bill item/i })).not.toBeInTheDocument();
  });

  it('commits a bill-item edit using the production inline path', async () => {
    const user = userEvent.setup();
    const onLineItemUpdated = jest.fn();

    mockUseBillableServices.mockReturnValue({
      billableServices: [
        {
          uuid: 'service-clear-aligner',
          name: 'Clear Aligner',
          shortName: 'Clear Aligner',
          serviceStatus: 'ENABLED',
          servicePrices: [{ uuid: 'price-clear-aligner', name: 'Default', price: 249999 }],
        },
      ],
      error: null,
      isLoading: false,
    } as ReturnType<typeof useBillableServices>);

    render(<InvoiceTable bill={openPendingBill} onLineItemUpdated={onLineItemUpdated} />);

    await user.click(screen.getByRole('button', { name: /clear aligner/i }));

    const dialog = await screen.findByRole('dialog', { name: /bill item options/i });
    await user.click(within(dialog).getByRole('button', { name: /clear aligner/i }));

    expect(mockUpdateBillLineItem).toHaveBeenCalledWith(
      'line-item-clear-aligner',
      expect.objectContaining({
        item: 'service-clear-aligner:Clear Aligner',
        billableService: 'service-clear-aligner:Clear Aligner',
      }),
    );
    expect(onLineItemUpdated).toHaveBeenCalled();
  });
});
