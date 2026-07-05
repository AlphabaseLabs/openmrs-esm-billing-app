import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InvoiceTable from './invoice-table.component';
import styles from './invoice-table.scss';
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

  it('keeps the bill-item edit affordance lane stable between read and edit mode', async () => {
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
    const editableRoot = valueCellButton.closest(`.${styles.editableTextCellContainer}`);
    expect(editableRoot).toHaveClass(styles.editableTextCellContainer);
    expect(editableRoot?.querySelector(`.${styles.editableTextCellContent}`)).toBeInTheDocument();
    expect(editableRoot?.querySelector(`.${styles.editableTextCellAffordanceLane}`)).toBeInTheDocument();

    await user.click(valueCellButton);

    const editor = await screen.findByRole('combobox', { name: /bill item/i });
    const activeCell = editor.closest(`.${styles.editableTextCellContainer}`);
    expect(activeCell).toHaveClass(styles.editableTextCellContainer);
    expect(activeCell?.querySelector(`.${styles.editableTextCellContent}`)).toBeInTheDocument();

    const cancelButton = within(activeCell as HTMLElement).getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(screen.queryByRole('combobox', { name: /bill item/i })).not.toBeInTheDocument();
  });

  it('opens bill-item editor only for editable rows and preserves a reserved affordance in read-only rows', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={{ ...openPendingBill, closed: true, status: PaymentStatus.PAID }} />);

    const closedBillItemButton = screen.getByRole('button', { name: /clear aligner/i });
    await user.click(closedBillItemButton);

    expect(screen.queryByRole('combobox', { name: /bill item/i })).not.toBeInTheDocument();

    const readOnlyRoot = closedBillItemButton.closest(`.${styles.editableTextCellContainer}`);
    expect(readOnlyRoot?.querySelector(`.${styles.editableTextCellAffordancePlaceholder}`)).toBeInTheDocument();
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

    const editorCell = (await screen.findByRole('combobox', { name: /bill item/i })).closest(
      `.${styles.editableTextCellContainer}`,
    );
    const saveButton = within(editorCell as HTMLElement).getByRole('button', { name: /save/i });
    await user.click(saveButton);

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
