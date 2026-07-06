import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@openmrs/esm-framework';
import InvoiceTable from './invoice-table.component';
import { mockBillData } from '../../__mocks__/bill.mock';
import { discountedPendingBill, openPendingBill, paidBill } from './invoice-story.fixtures';
import { launchBillingWorkspace } from '../workspaces';
import useBillableServices from '../hooks/useBillableServices';
import { useProviderOptions } from '../payment-points/payment-points.resource';
import { updateBillLineItem } from '../billing.resource';
import { PaymentStatus } from '../types';
import { LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY } from './line-item-column-visibility';

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
  useSession: jest.fn(() => ({
    currentProvider: {
      uuid: 'provider-current',
      display: 'Current Provider',
    },
  })),
}));

jest.mock('../workspaces', () => ({
  launchBillingWorkspace: jest.fn(),
}));

jest.mock('../hooks/useBillableServices');
jest.mock('../payment-points/payment-points.resource', () => ({
  useProviderOptions: jest.fn(),
}));
jest.mock('../billing.resource', () => ({
  updateBillLineItem: jest.fn(),
}));

const mockLaunchBillingWorkspace = launchBillingWorkspace as jest.MockedFunction<typeof launchBillingWorkspace>;
const mockUseBillableServices = useBillableServices as jest.MockedFunction<typeof useBillableServices>;
const mockUseProviderOptions = useProviderOptions as jest.MockedFunction<typeof useProviderOptions>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUpdateBillLineItem = updateBillLineItem as jest.MockedFunction<typeof updateBillLineItem>;

const addBillItemWorkspaceExpectation = (patientUuid: string) => ({
  patientUuid,
  workspaceTitle: 'Add bill item',
  navigateToBillAfterSave: true,
});

const getInvoiceTable = () => screen.getByRole('table', { name: /^line items$/i });

const getColumnWidths = (table: HTMLElement) =>
  Array.from(table.querySelectorAll('col')).map((column) => (column as HTMLTableColElement).style.width);

const getAddItemRow = () => screen.getByTestId('invoice-table-add-item-row');

const getAddItemCell = () => getAddItemRow().querySelector('td') as HTMLTableCellElement;

describe('InvoiceTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.removeItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY);
    mockUpdateBillLineItem.mockResolvedValue({ ok: true } as any);
    mockUseSession.mockReturnValue({
      currentProvider: {
        uuid: 'provider-current',
        display: 'Current Provider',
      },
    } as unknown as ReturnType<typeof useSession>);
    mockUseProviderOptions.mockReturnValue({
      providerOptions: [
        {
          id: 'provider-storybook',
          uuid: 'provider-storybook',
          label: 'Storybook Provider',
        },
      ],
      error: null,
      isLoading: false,
    } as ReturnType<typeof useProviderOptions>);
    mockUseBillableServices.mockReturnValue({
      billableServices: [],
      error: null,
      isLoading: false,
    } as ReturnType<typeof useBillableServices>);
  });

  it('shows add bill item button for open bills and launches bill form', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={mockBillData[0]} />);

    const addBillItemButton = screen.getByRole('button', { name: /^add bill item$/i });
    expect(addBillItemButton).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^add item$/i })).toBeInTheDocument();

    await user.click(addBillItemButton);

    expect(mockLaunchBillingWorkspace).toHaveBeenCalledWith(
      'billing-form',
      addBillItemWorkspaceExpectation(mockBillData[0].patientUuid),
    );
  });

  it('launches bill form from the final add item row', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={openPendingBill} />);

    const addItemButton = screen.getByRole('button', { name: /^add item$/i });
    expect(getAddItemRow()).toContainElement(addItemButton);

    await user.click(addItemButton);

    expect(mockLaunchBillingWorkspace).toHaveBeenCalledWith(
      'billing-form',
      addBillItemWorkspaceExpectation(openPendingBill.patientUuid),
    );
  });

  it('hides add bill item actions for closed bills', () => {
    render(<InvoiceTable bill={{ ...mockBillData[0], closed: true }} />);

    expect(screen.queryByRole('button', { name: /add bill item/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^add item$/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('invoice-table-add-item-row')).not.toBeInTheDocument();
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
    expect(within(editableRoot as HTMLElement).getByTestId('editable-bill-item-search-input')).toBeInTheDocument();
  });

  it('opens bill-item editor only for editable rows and renders read-only rows without an affordance', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={{ ...openPendingBill, closed: true, status: PaymentStatus.PAID }} />);

    const closedBillItem = screen.getByText(/clear aligner/i);
    await user.click(closedBillItem);

    expect(screen.queryByRole('dialog', { name: /bill item options/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /select bill item/i })).not.toBeInTheDocument();
  });

  it('opens inline editors for paid line items on open bills', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={paidBill} />);

    await user.click(screen.getByRole('button', { name: /249,999/i }));

    expect(await screen.findByRole('textbox', { name: /price/i })).toHaveValue('249,999');
  });

  it('loads provider options and the current provider for inline discount cells', () => {
    render(<InvoiceTable bill={discountedPendingBill} />);

    expect(mockUseProviderOptions).toHaveBeenCalled();
    expect(mockUseSession).toHaveBeenCalled();
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
        {
          uuid: 'service-registration',
          name: 'Registration',
          shortName: 'Registration',
          serviceStatus: 'ENABLED',
          servicePrices: [{ uuid: 'price-registration', name: 'Default', price: 5000 }],
        },
      ],
      error: null,
      isLoading: false,
    } as ReturnType<typeof useBillableServices>);

    render(<InvoiceTable bill={openPendingBill} onLineItemUpdated={onLineItemUpdated} />);

    await user.click(screen.getByRole('button', { name: /clear aligner/i }));

    const dialog = await screen.findByRole('dialog', { name: /bill item options/i });
    await user.click(within(dialog).getByRole('option', { name: /registration/i }));

    expect(mockUpdateBillLineItem).toHaveBeenCalledWith(
      'line-item-clear-aligner',
      expect.objectContaining({
        item: 'service-registration:Registration',
        billableService: 'service-registration:Registration',
      }),
    );
    expect(onLineItemUpdated).toHaveBeenCalled();
  });

  it('hides and restores optional columns while keeping headers and cells synchronized', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={openPendingBill} />);

    const table = getInvoiceTable();
    const getHeaderCount = () => table.querySelectorAll('thead th').length;
    const getFirstBodyRowCellCount = () => table.querySelector('tbody tr')?.children.length ?? 0;

    expect(screen.getByRole('columnheader', { name: /tax/i })).toBeInTheDocument();
    expect(getHeaderCount()).toBe(getFirstBodyRowCellCount());
    expect(table.querySelectorAll('col')).toHaveLength(getHeaderCount());

    await user.click(screen.getByRole('button', { name: /columns/i }));
    const columnOptions = screen.getByRole('group', { name: /line item columns/i });

    expect(within(columnOptions).queryByRole('checkbox', { name: /bill item/i })).not.toBeInTheDocument();
    expect(within(columnOptions).queryByRole('checkbox', { name: /^price$/i })).not.toBeInTheDocument();
    expect(within(columnOptions).queryByRole('checkbox', { name: /^total$/i })).not.toBeInTheDocument();
    expect(within(columnOptions).queryByRole('checkbox', { name: /action/i })).not.toBeInTheDocument();

    await user.click(within(columnOptions).getByRole('checkbox', { name: /tax/i }));

    expect(screen.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    expect(getHeaderCount()).toBe(getFirstBodyRowCellCount());
    expect(table.querySelectorAll('col')).toHaveLength(getHeaderCount());

    await user.click(within(columnOptions).getByRole('checkbox', { name: /tax/i }));

    expect(screen.getByRole('columnheader', { name: /tax/i })).toBeInTheDocument();
    expect(getHeaderCount()).toBe(getFirstBodyRowCellCount());
    expect(table.querySelectorAll('col')).toHaveLength(getHeaderCount());
  });

  it('renders a synthetic selection column width when selection is present', () => {
    render(<InvoiceTable bill={openPendingBill} />);

    const table = getInvoiceTable();
    const columnWidths = getColumnWidths(table);

    expect(columnWidths[0]).toBe('48px');
    expect(columnWidths[columnWidths.length - 1]).toBe('144px');
    expect(table.querySelectorAll('col')).toHaveLength(table.querySelectorAll('thead th').length);
  });

  it('spans the final add item row across rendered columns when selection is present', () => {
    render(<InvoiceTable bill={openPendingBill} />);

    const table = getInvoiceTable();
    const renderedColumnCount = table.querySelectorAll('col').length;

    expect(getAddItemRow().children).toHaveLength(1);
    expect(getAddItemCell().colSpan).toBe(renderedColumnCount);
  });

  it('omits the synthetic selection column width when selection is absent', () => {
    render(<InvoiceTable bill={{ ...openPendingBill, lineItems: [openPendingBill.lineItems[0]] }} />);

    const table = getInvoiceTable();
    const columnWidths = getColumnWidths(table);

    expect(columnWidths[0]).toBe('80px');
    expect(columnWidths).not.toContain('48px');
    expect(table.querySelectorAll('col')).toHaveLength(table.querySelectorAll('thead th').length);
  });

  it('keeps the action column fixed when optional columns are hidden', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={openPendingBill} />);

    const table = getInvoiceTable();

    await user.click(screen.getByRole('button', { name: /columns/i }));
    const columnOptions = screen.getByRole('group', { name: /line item columns/i });
    await user.click(within(columnOptions).getByRole('checkbox', { name: /tax/i }));

    const columnWidths = getColumnWidths(table);
    expect(screen.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    expect(columnWidths[columnWidths.length - 1]).toBe('144px');
    expect(table.querySelectorAll('col')).toHaveLength(table.querySelectorAll('thead th').length);
  });

  it('keeps the final add item row colspan aligned when optional columns are hidden', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={openPendingBill} />);

    const table = getInvoiceTable();

    await user.click(screen.getByRole('button', { name: /columns/i }));
    const columnOptions = screen.getByRole('group', { name: /line item columns/i });
    await user.click(within(columnOptions).getByRole('checkbox', { name: /discount/i }));
    await user.click(within(columnOptions).getByRole('checkbox', { name: /tax/i }));

    expect(screen.queryByRole('columnheader', { name: /discount/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    expect(getAddItemCell().colSpan).toBe(table.querySelectorAll('col').length);
  });

  it('keeps the final add item row non-selectable and outside line item numbering', () => {
    render(<InvoiceTable bill={openPendingBill} />);

    const table = getInvoiceTable();
    const bodyRows = Array.from(table.querySelectorAll('tbody tr'));
    const addItemRow = getAddItemRow();

    expect(bodyRows).toHaveLength(openPendingBill.lineItems.length + 1);
    expect(bodyRows[bodyRows.length - 1]).toBe(addItemRow);
    expect(within(addItemRow).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(within(addItemRow).queryByRole('button', { name: /costs/i })).not.toBeInTheDocument();
    expect(within(addItemRow).queryByRole('button', { name: /cancel item/i })).not.toBeInTheDocument();
    expect(within(table).getAllByRole('checkbox')).toHaveLength(openPendingBill.lineItems.length);
    expect(bodyRows[0].children[1]).toHaveTextContent(/^1$/);
    expect(bodyRows[1].children[1]).toHaveTextContent(/^2$/);
    expect(addItemRow).not.toHaveTextContent(/^3$/);
  });

  it('keeps computed column widths stable while an editable cell is active', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={openPendingBill} />);

    const table = getInvoiceTable();
    const widthsBeforeEdit = getColumnWidths(table);

    await user.click(screen.getByRole('button', { name: /249,999/i }));
    expect(await screen.findByRole('textbox', { name: /price/i })).toBeInTheDocument();

    expect(getColumnWidths(table)).toEqual(widthsBeforeEdit);
  });

  it('restores persisted optional column preferences and keeps required columns visible', () => {
    window.localStorage.setItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(['no', 'quantity']));

    render(<InvoiceTable bill={openPendingBill} />);

    expect(screen.getByRole('columnheader', { name: /bill item/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^price$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^total$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /action/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /number/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /quantity/i })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /status/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /discount/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
  });

  it('falls back to default columns for malformed persisted preferences', () => {
    window.localStorage.setItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY, 'not json');

    render(<InvoiceTable bill={openPendingBill} />);

    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /discount/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /tax/i })).toBeInTheDocument();
  });

  it('keeps hidden financial column values in calculations and rendered totals', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={discountedPendingBill} />);

    await user.click(screen.getByRole('button', { name: /columns/i }));
    const columnOptions = screen.getByRole('group', { name: /line item columns/i });

    await user.click(within(columnOptions).getByRole('checkbox', { name: /discount/i }));
    await user.click(within(columnOptions).getByRole('checkbox', { name: /tax/i }));

    expect(screen.queryByRole('columnheader', { name: /discount/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    expect(screen.getByText('4,750')).toBeInTheDocument();
  });

  it('closes an active editable cell before hiding that column', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={openPendingBill} />);

    await user.click(screen.getAllByRole('button', { name: /^1$/ })[1]);
    expect(await screen.findByRole('textbox', { name: /quantity/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /columns/i }));
    await user.click(screen.getByRole('checkbox', { name: /quantity/i }));

    expect(screen.queryByRole('textbox', { name: /quantity/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /quantity/i })).not.toBeInTheDocument();
  });
});
