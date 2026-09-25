jest.mock('@openmrs/esm-patient-common-lib', () => ({
  CardHeader: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h4>{title}</h4>
      {children}
    </div>
  ),
}));

import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@openmrs/esm-framework';
import InvoiceTable from './invoice-table.component';
import { mockBillData } from '../../__mocks__/bill.mock';
import { discountedPendingBill, openPendingBill, paidBill } from './invoice-story.fixtures';
import { launchBillingWorkspace } from '../workspaces';
import useBillableServices from '../hooks/useBillableServices';
import { useAppointmentProviderOptions } from '../payment-points/payment-points.resource';
import { addBillLineItem, updateBillLineItem } from '../billing.resource';
import { PaymentStatus } from '../types';
import { LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY } from './line-item-column-visibility';

jest.mock('react-i18next', () => {
  const t = (_key: string, fallback: string, options?: Record<string, string>) =>
    fallback.replace(/\{\{(\w+)\}\}/g, (_match, key) => options?.[key] ?? `{{${key}}}`);
  return { useTranslation: () => ({ t }) };
});

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
  useAppointmentProviderOptions: jest.fn(),
}));
jest.mock('../billing.resource', () => ({
  updateBillLineItem: jest.fn(),
  addBillLineItem: jest.fn(),
}));

const mockLaunchBillingWorkspace = launchBillingWorkspace as jest.MockedFunction<typeof launchBillingWorkspace>;
const mockUseBillableServices = useBillableServices as jest.MockedFunction<typeof useBillableServices>;
const mockUseAppointmentProviderOptions = useAppointmentProviderOptions as jest.MockedFunction<
  typeof useAppointmentProviderOptions
>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUpdateBillLineItem = updateBillLineItem as jest.MockedFunction<typeof updateBillLineItem>;

const getInvoiceTable = () => screen.getByRole('table', { name: /^line items\b/i });

const getColumnWidths = (table: HTMLElement) =>
  Array.from(table.querySelectorAll('col')).map((column) => (column as HTMLTableColElement).style.width);

const getDraftRow = () => screen.getByTestId('invoice-table-draft-row');

const getAddItemFooter = () => screen.getByTestId('invoice-table-add-item-footer');

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
    mockUseAppointmentProviderOptions.mockReturnValue({
      allProviderOptions: [
        {
          id: 'provider-storybook',
          uuid: 'provider-storybook',
          label: 'Storybook Provider',
        },
        {
          id: 'provider-appointment',
          uuid: 'provider-appointment',
          label: 'Appointment Provider',
        },
        {
          id: 'provider-other',
          uuid: 'provider-other',
          label: 'Other Provider',
        },
      ],
      providerOptions: [
        {
          id: 'provider-appointment',
          uuid: 'provider-appointment',
          label: 'Appointment Provider',
        },
        {
          id: 'provider-other',
          uuid: 'provider-other',
          label: 'Other Provider',
        },
      ],
      error: null,
      isLoading: false,
    } as ReturnType<typeof useAppointmentProviderOptions>);
    mockUseBillableServices.mockReturnValue({
      billableServices: [],
      error: null,
      isLoading: false,
    } as ReturnType<typeof useBillableServices>);
  });

  it('shows a numbered draft with a disabled checkbox and leaves unsaved values blank', () => {
    render(<InvoiceTable bill={{ ...openPendingBill, lineItems: [] }} />);
    expect(screen.queryByRole('button', { name: /^add bill item$/i })).not.toBeInTheDocument();
    expect(within(getDraftRow()).getByTestId('editable-text-content')).toBeInTheDocument();
    const cells = within(getDraftRow()).getAllByRole('cell');
    expect(within(cells[0]).getByRole('checkbox')).toBeDisabled();
    expect(within(cells[0]).getByRole('checkbox')).not.toBeChecked();
    expect(cells[1]).toHaveTextContent(/^1$/);
    expect(cells[2].querySelector('button[aria-label="Select bill item"]')).toHaveClass('emptyItemOptionsButton');
    expect(cells.slice(3).every((cell) => cell.textContent === '')).toBe(true);
    expect(screen.getByRole('checkbox', { name: 'Select all line items' })).toBeDisabled();
    expect(within(getDraftRow()).queryByRole('button', { name: 'Remove empty row' })).not.toBeInTheDocument();
    expect(within(getAddItemFooter()).getByRole('button', { name: 'Add item' })).toHaveClass('cds--btn--primary');
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Select all line items',
      'Number',
      'Bill item',
      'Provider',
      'Price',
      'Discount',
      'Total',
      'Status',
      'Action',
      'Date',
    ]);
    expect(screen.queryByText('No matching items to display')).not.toBeInTheDocument();
  });

  it('adds a searched service and replaces its draft with a fresh entry row', async () => {
    const user = userEvent.setup();
    const service = { uuid: 'service-new', name: 'Consultation', shortName: 'NEW', servicePrices: [] };
    mockUseBillableServices.mockReturnValue({ billableServices: [service], isLoading: false } as any);
    const addedItem = { ...openPendingBill.lineItems[0], uuid: 'new-item' };
    jest.mocked(addBillLineItem).mockResolvedValue(addedItem);
    const onLineItemUpdated = jest.fn();
    const onRefreshBill = jest.fn();
    render(<InvoiceTable bill={openPendingBill} onLineItemUpdated={onLineItemUpdated} onRefreshBill={onRefreshBill} />);
    const originalDraft = getDraftRow();
    await user.click(within(getDraftRow()).getByTestId('editable-text-content'));
    await user.type(within(getDraftRow()).getByRole('combobox'), 'Cons');
    await user.click(screen.getByRole('option', { name: 'Consultation' }));
    await waitFor(() => expect(addBillLineItem).toHaveBeenCalledWith(openPendingBill.uuid, service));
    expect(onLineItemUpdated).toHaveBeenCalledWith(addedItem);
    expect(onRefreshBill).toHaveBeenCalled();
    expect(originalDraft).not.toBeInTheDocument();
    expect(within(getDraftRow()).getByTestId('editable-text-content')).toHaveTextContent('Select bill item');
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
    expect(mockLaunchBillingWorkspace).not.toHaveBeenCalled();
  });

  it('preserves the replacement draft when refresh briefly returns an empty bill', async () => {
    const user = userEvent.setup();
    const service = { uuid: 'service-new', name: 'Consultation', servicePrices: [] };
    mockUseBillableServices.mockReturnValue({ billableServices: [service], isLoading: false } as any);
    const addedItem = { ...openPendingBill.lineItems[0], uuid: 'new-item' };
    jest.mocked(addBillLineItem).mockResolvedValue(addedItem);
    const emptyBill = { ...openPendingBill, lineItems: [] };
    const savedBill = { ...openPendingBill, lineItems: [addedItem] };
    const { rerender } = render(<InvoiceTable bill={emptyBill} />);
    const originalDraft = getDraftRow();
    await user.click(within(getDraftRow()).getByTestId('editable-text-content'));
    await user.type(within(getDraftRow()).getByRole('combobox'), 'Cons');
    await user.click(screen.getByRole('option', { name: 'Consultation' }));
    await waitFor(() => expect(originalDraft).not.toBeInTheDocument());
    const replacementDraft = getDraftRow();
    rerender(<InvoiceTable bill={savedBill} />);
    rerender(<InvoiceTable bill={emptyBill} />);
    rerender(<InvoiceTable bill={savedBill} />);
    expect(getDraftRow()).toBe(replacementDraft);
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add item' }));
    expect(screen.getAllByTestId('invoice-table-draft-row')).toHaveLength(2);
  });

  it('retains the draft selector after a failed save without exposing a delete action', async () => {
    const user = userEvent.setup();
    const service = { uuid: 'service-new', name: 'Consultation', servicePrices: [] };
    mockUseBillableServices.mockReturnValue({ billableServices: [service], isLoading: false } as any);
    let rejectSave: (reason: Error) => void;
    jest.mocked(addBillLineItem).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectSave = reject;
      }),
    );
    render(<InvoiceTable bill={{ ...openPendingBill, lineItems: [] }} />);
    await user.click(within(getDraftRow()).getByTestId('editable-text-content'));
    await user.type(within(getDraftRow()).getByRole('combobox'), 'Cons');
    await user.click(screen.getByRole('option', { name: 'Consultation' }));
    expect(within(getDraftRow()).queryByRole('button', { name: 'Remove empty row' })).not.toBeInTheDocument();
    rejectSave(new Error('Unable to save'));
    await waitFor(() => expect(within(getDraftRow()).getByTestId('editable-text-content')).toBeInTheDocument());
  });

  it('retains an editable entry row after a failed addition', async () => {
    const user = userEvent.setup();
    const service = { uuid: 'service-new', name: 'Consultation', servicePrices: [] };
    mockUseBillableServices.mockReturnValue({ billableServices: [service], isLoading: false } as any);
    jest.mocked(addBillLineItem).mockRejectedValue(new Error('Failed'));
    const onLineItemUpdated = jest.fn();
    render(<InvoiceTable bill={openPendingBill} onLineItemUpdated={onLineItemUpdated} />);
    const originalDraft = getDraftRow();
    await user.click(within(getDraftRow()).getByTestId('editable-text-content'));
    await user.type(within(getDraftRow()).getByRole('combobox'), 'Cons');
    await user.click(screen.getByRole('option', { name: 'Consultation' }));
    await waitFor(() => expect(within(getDraftRow()).getByTestId('editable-text-content')).toBeEnabled());
    expect(addBillLineItem).toHaveBeenCalledWith(openPendingBill.uuid, service);
    expect(getDraftRow()).toBe(originalDraft);
    expect(onLineItemUpdated).not.toHaveBeenCalled();
  });

  it('appends sequentially numbered drafts without selecting unsaved rows', async () => {
    const user = userEvent.setup();
    const onSelectItem = jest.fn();
    render(<InvoiceTable bill={openPendingBill} onSelectItem={onSelectItem} />);
    const originalDraft = getDraftRow();
    await user.click(screen.getByRole('button', { name: 'Add item' }));
    await user.click(screen.getByRole('button', { name: 'Add item' }));
    const drafts = screen.getAllByTestId('invoice-table-draft-row');
    expect(drafts).toHaveLength(3);
    expect(drafts[0]).toBe(originalDraft);
    expect(drafts[2].nextElementSibling).toBeNull();
    expect(getInvoiceTable().parentElement?.nextElementSibling).toBe(getAddItemFooter());
    for (const [index, draft] of drafts.entries()) {
      const checkbox = within(draft).getByRole('checkbox');
      expect(checkbox).toBeDisabled();
      expect(checkbox).not.toBeChecked();
      await user.click(checkbox);
      expect(draft.children[1]).toHaveTextContent(String(openPendingBill.lineItems.length + index + 1));
      expect(draft.children).toHaveLength(getInvoiceTable().querySelectorAll('col').length);
    }
    expect(onSelectItem).not.toHaveBeenCalled();
    expect(mockLaunchBillingWorkspace).not.toHaveBeenCalled();
  });

  it('hides add bill item actions for closed bills', () => {
    render(<InvoiceTable bill={{ ...mockBillData[0], closed: true }} />);

    expect(screen.queryByRole('button', { name: /add bill item/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^add item$/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('invoice-table-add-item-footer')).not.toBeInTheDocument();
  });

  it('filters the inline bill-item options by service name', async () => {
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

    await user.click(within(getDraftRow()).getByTestId('editable-text-content'));
    await user.type(within(getDraftRow()).getByRole('combobox'), 'general');

    expect(screen.getByRole('option', { name: 'General Consultation' })).toBeInTheDocument();
    await user.clear(within(getDraftRow()).getByRole('combobox'));
    await user.type(within(getDraftRow()).getByRole('combobox'), 'unmatched');
    expect(screen.queryByRole('option', { name: 'General Consultation' })).not.toBeInTheDocument();
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

  it('loads provider options and the current provider for inline cells', () => {
    render(<InvoiceTable bill={discountedPendingBill} />);

    expect(mockUseAppointmentProviderOptions).toHaveBeenCalled();
    expect(mockUseSession).toHaveBeenCalled();
  });

  it('shows line item date and persists a searched appointment-enabled provider selection', async () => {
    const user = userEvent.setup();
    const lineItem = {
      ...openPendingBill.lineItems.find((item) => item.paymentStatus === PaymentStatus.PENDING)!,
      dateCreated: '2026-09-16T08:30:00.000Z',
      provider: null,
    };

    render(<InvoiceTable bill={{ ...openPendingBill, lineItems: [lineItem] }} />);

    expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Provider' })).toBeInTheDocument();
    expect(screen.getByText('16-Sep-2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Select provider' }));
    await user.type(screen.getByRole('combobox', { name: 'Search providers' }), 'Appointment');

    const providerOptions = within(screen.getByRole('dialog', { name: 'Provider options' }));
    expect(providerOptions.queryByText('Other Provider')).not.toBeInTheDocument();
    await user.click(providerOptions.getByText('Appointment Provider'));

    expect(mockUpdateBillLineItem).toHaveBeenCalledWith(lineItem.uuid, { provider: 'provider-appointment' });
  });

  it('keeps direct line-item discount editing enabled when Discounts exist', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={{ ...discountedPendingBill, totalDiscounts: 50 }} />);

    const discountEditorButtons = screen.getAllByLabelText(/open discount editor/i);
    expect(discountEditorButtons.length).toBeGreaterThan(0);

    await user.click(discountEditorButtons[0]);

    expect(screen.getByRole('textbox', { name: /percent/i })).toBeInTheDocument();
  });

  it('toggles the Date column without activating the Discount editor behind the menu', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={{ ...discountedPendingBill, totalDiscounts: 50 }} />);

    await user.click(screen.getAllByLabelText(/open discount editor/i)[0]);
    expect(screen.getByRole('textbox', { name: /percent/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /columns/i }));
    expect(screen.queryByRole('textbox', { name: /percent/i })).not.toBeInTheDocument();

    const columnOptions = screen.getByRole('group', { name: /line item columns/i });
    await user.click(within(columnOptions).getByRole('checkbox', { name: /date/i }));

    expect(screen.queryByRole('columnheader', { name: /date/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /percent/i })).not.toBeInTheDocument();
  });

  it('shows guidance instead of launching delete for non-pending line items', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={openPendingBill} />);

    const paidLineDeleteButton = screen.getByTestId('cancel-button-line-item-paid-consultation');
    expect(paidLineDeleteButton).toBeEnabled();

    await user.click(paidLineDeleteButton);

    expect(screen.getByText('Consultation is still in use')).toBeInTheDocument();
    expect(
      screen.getByText('To delete this item, first delete the payments and expenses or provider shares linked to it.'),
    ).toBeInTheDocument();
    expect(mockLaunchBillingWorkspace).not.toHaveBeenCalledWith(
      'cancel-bill-workspace',
      expect.objectContaining({
        bill: openPendingBill,
        lineItem: openPendingBill.lineItems[0],
      }),
    );

    await user.click(screen.getByRole('button', { name: /got it/i }));

    await waitFor(() => {
      expect(screen.queryByText('Consultation is still in use')).not.toBeInTheDocument();
    });
  });

  it('still launches delete workspace for pending line items', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={openPendingBill} />);

    await user.click(screen.getByTestId('cancel-button-line-item-clear-aligner'));

    expect(mockLaunchBillingWorkspace).toHaveBeenCalledWith('cancel-bill-workspace', {
      bill: openPendingBill,
      lineItem: openPendingBill.lineItems[1],
    });
  });

  it('keeps row delete actions hidden when the whole bill is paid', () => {
    render(<InvoiceTable bill={paidBill} />);

    expect(screen.queryByTestId('cancel-button-line-item-paid-consultation')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel item/i })).not.toBeInTheDocument();
  });

  it('commits a bill-item edit using the production inline path', async () => {
    const user = userEvent.setup();
    const onLineItemUpdated = jest.fn();
    const onRefreshBill = jest.fn();

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

    render(<InvoiceTable bill={openPendingBill} onLineItemUpdated={onLineItemUpdated} onRefreshBill={onRefreshBill} />);

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
    expect(onRefreshBill).toHaveBeenCalled();
  });

  it('restores and hides the default-hidden tax column while keeping headers and cells synchronized', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={openPendingBill} />);

    const table = getInvoiceTable();
    const getHeaderCount = () => table.querySelectorAll('thead th').length;
    const getFirstBodyRowCellCount = () => table.querySelector('tbody tr')?.children.length ?? 0;

    expect(screen.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    expect(getHeaderCount()).toBe(getFirstBodyRowCellCount());
    expect(table.querySelectorAll('col')).toHaveLength(getHeaderCount());

    await user.click(screen.getByRole('button', { name: /columns/i }));
    const columnOptions = screen.getByRole('group', { name: /line item columns/i });

    expect(within(columnOptions).queryByRole('checkbox', { name: /bill item/i })).not.toBeInTheDocument();
    expect(within(columnOptions).queryByRole('checkbox', { name: /^price$/i })).not.toBeInTheDocument();
    expect(within(columnOptions).queryByRole('checkbox', { name: /^total$/i })).not.toBeInTheDocument();
    expect(within(columnOptions).queryByRole('checkbox', { name: /action/i })).not.toBeInTheDocument();

    const taxOption = within(columnOptions).getByRole('checkbox', { name: /tax/i });
    expect(taxOption).not.toBeChecked();

    await user.click(taxOption);
    expect(screen.getByRole('columnheader', { name: /tax/i })).toBeInTheDocument();
    expect(getHeaderCount()).toBe(getFirstBodyRowCellCount());
    expect(table.querySelectorAll('col')).toHaveLength(getHeaderCount());

    await user.click(taxOption);

    expect(screen.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    expect(getHeaderCount()).toBe(getFirstBodyRowCellCount());
    expect(table.querySelectorAll('col')).toHaveLength(getHeaderCount());
  });

  it.each([true, false])('keeps loading and loaded column counts aligned with selection %s', (isSelectable) => {
    const { rerender } = render(<InvoiceTable bill={openPendingBill} isSelectable={isSelectable} isLoadingBill />);
    const loadingColumnCount = screen.getAllByRole('columnheader').length;

    rerender(<InvoiceTable bill={openPendingBill} isSelectable={isSelectable} />);

    expect(within(getInvoiceTable()).getAllByRole('columnheader')).toHaveLength(loadingColumnCount);
    expect(getDraftRow().children).toHaveLength(loadingColumnCount);
  });

  it('measures and observes the table after initial loading and subsequent reloads', () => {
    const observers: Array<{ callback: ResizeObserverCallback; observer: ResizeObserver }> = [];
    const resizeObserverMock = jest.spyOn(window, 'ResizeObserver').mockImplementation((callback) => {
      const observer = { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
      observers.push({ callback, observer });
      return observer;
    });
    const rectMock = jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ width: 1800 } as DOMRect);
    const getTableWidth = () => getColumnWidths(getInvoiceTable()).reduce((sum, width) => sum + parseFloat(width), 0);
    const getTableObserver = () =>
      observers.find(({ observer }) =>
        jest.mocked(observer.observe).mock.calls.some(([element]) => element.contains(getInvoiceTable())),
      )!;

    try {
      const { rerender, unmount } = render(<InvoiceTable bill={openPendingBill} isLoadingBill />);

      rerender(<InvoiceTable bill={openPendingBill} />);
      expect(getTableWidth()).toBe(1800);
      const firstObserver = getTableObserver();

      act(() => {
        firstObserver.callback([{ contentRect: { width: 1600 } } as ResizeObserverEntry], firstObserver.observer);
      });
      expect(getTableWidth()).toBe(1600);

      rerender(<InvoiceTable bill={openPendingBill} isLoadingBill />);
      expect(firstObserver.observer.disconnect).toHaveBeenCalledTimes(1);

      rectMock.mockReturnValue({ width: 2000 } as DOMRect);
      rerender(<InvoiceTable bill={openPendingBill} />);
      expect(getTableWidth()).toBe(2000);
      const secondObserver = getTableObserver();

      act(() => {
        secondObserver.callback([{ contentRect: { width: 1500 } } as ResizeObserverEntry], secondObserver.observer);
      });
      expect(getTableWidth()).toBe(1500);

      unmount();
      expect(secondObserver.observer.disconnect).toHaveBeenCalledTimes(1);
    } finally {
      resizeObserverMock.mockRestore();
      rectMock.mockRestore();
    }
  });

  it('renders a synthetic selection column width when selection is present', () => {
    render(<InvoiceTable bill={openPendingBill} />);

    const table = getInvoiceTable();
    const columnWidths = getColumnWidths(table);

    expect(columnWidths[0]).toBe('48px');
    expect(columnWidths[columnWidths.length - 2]).toBe('75px');
    expect(table.querySelectorAll('col')).toHaveLength(table.querySelectorAll('thead th').length);
  });

  it('selects all eligible line items from the table header', async () => {
    const user = userEvent.setup();
    const onSelectItem = jest.fn();
    const paidLineItems = openPendingBill.lineItems.filter((item) => item.paymentStatus === PaymentStatus.PAID);
    const pendingLineItems = openPendingBill.lineItems.filter((item) => item.paymentStatus === PaymentStatus.PENDING);

    render(<InvoiceTable bill={openPendingBill} onSelectItem={onSelectItem} selectedLineItems={paidLineItems} />);

    await user.click(screen.getByRole('checkbox', { name: /select all line items/i }));

    expect(onSelectItem).toHaveBeenCalledWith([...paidLineItems, ...pendingLineItems]);
    expect(within(getDraftRow()).getByRole('checkbox')).not.toBeChecked();
  });

  it('keeps selection available when an open bill has only one saved item', async () => {
    const user = userEvent.setup();
    const onSelectItem = jest.fn();
    const lineItem = openPendingBill.lineItems.find((item) => item.paymentStatus === PaymentStatus.PENDING)!;
    render(<InvoiceTable bill={{ ...openPendingBill, lineItems: [lineItem] }} onSelectItem={onSelectItem} />);

    await user.click(screen.getByRole('checkbox', { name: 'Select all line items' }));

    expect(onSelectItem).toHaveBeenCalledWith([lineItem]);
    expect(within(getDraftRow()).getByRole('checkbox')).toBeDisabled();
    expect(getDraftRow().children[1]).toHaveTextContent(/^2$/);
  });

  it('unselects eligible line items while preserving paid line items', async () => {
    const user = userEvent.setup();
    const onSelectItem = jest.fn();
    const paidLineItems = openPendingBill.lineItems.filter((item) => item.paymentStatus === PaymentStatus.PAID);
    const { rerender } = render(
      <InvoiceTable bill={openPendingBill} onSelectItem={onSelectItem} selectedLineItems={openPendingBill.lineItems} />,
    );

    const selectAll = screen.getByRole('checkbox', { name: /unselect all line items/i });
    expect(selectAll).toBeChecked();
    await user.click(selectAll);

    expect(onSelectItem).toHaveBeenCalledWith(paidLineItems);

    rerender(<InvoiceTable bill={openPendingBill} onSelectItem={onSelectItem} selectedLineItems={paidLineItems} />);
    expect(screen.getByRole('checkbox', { name: /select all line items/i })).not.toBeChecked();
  });

  it('shows partial and disabled select-all states for eligible line items', () => {
    const firstPendingLineItem = discountedPendingBill.lineItems.find(
      (item) => item.paymentStatus === PaymentStatus.PENDING,
    );
    const paidLineItems = discountedPendingBill.lineItems.filter((item) => item.paymentStatus === PaymentStatus.PAID);
    const { rerender } = render(
      <InvoiceTable bill={discountedPendingBill} selectedLineItems={[...paidLineItems, firstPendingLineItem!]} />,
    );

    const partialSelectAll = screen.getByRole('checkbox', { name: /select all line items/i }) as HTMLInputElement;
    expect(partialSelectAll.indeterminate).toBe(true);

    rerender(<InvoiceTable bill={paidBill} selectedLineItems={paidBill.lineItems} />);
    expect(screen.getByRole('checkbox', { name: /select all line items/i })).toBeDisabled();
  });

  it('aligns the entry row with rendered columns when selection is present', () => {
    render(<InvoiceTable bill={openPendingBill} />);

    const table = getInvoiceTable();
    const renderedColumnCount = table.querySelectorAll('col').length;

    expect(getDraftRow().children).toHaveLength(renderedColumnCount);
    expect(table.parentElement?.nextElementSibling).toBe(getAddItemFooter());
  });

  it('omits the synthetic selection column width when selection is absent', () => {
    render(<InvoiceTable bill={openPendingBill} isSelectable={false} />);

    const table = getInvoiceTable();
    const columnWidths = getColumnWidths(table);

    expect(columnWidths[0]).toBe('112px');
    expect(columnWidths).not.toContain('48px');
    expect(within(table).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(table.querySelectorAll('col')).toHaveLength(table.querySelectorAll('thead th').length);
    expect(getDraftRow().children).toHaveLength(columnWidths.length);
  });

  it('preserves the action column minimum width when optional columns are hidden', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={openPendingBill} />);

    const table = getInvoiceTable();

    await user.click(screen.getByRole('button', { name: /columns/i }));
    const columnOptions = screen.getByRole('group', { name: /line item columns/i });
    await user.click(within(columnOptions).getByRole('checkbox', { name: /discount/i }));

    const columnWidths = getColumnWidths(table);
    expect(screen.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /discount/i })).not.toBeInTheDocument();
    expect(columnWidths[columnWidths.length - 2]).toBe('75px');
    expect(table.querySelectorAll('col')).toHaveLength(table.querySelectorAll('thead th').length);
  });

  it('keeps the add item footer outside the table when optional columns are hidden', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={openPendingBill} />);

    const table = getInvoiceTable();

    await user.click(screen.getByRole('button', { name: /columns/i }));
    const columnOptions = screen.getByRole('group', { name: /line item columns/i });
    await user.click(within(columnOptions).getByRole('checkbox', { name: /discount/i }));

    expect(screen.queryByRole('columnheader', { name: /discount/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    expect(table).not.toContainElement(getAddItemFooter());
    expect(table.parentElement?.nextElementSibling).toBe(getAddItemFooter());
  });

  it('keeps the add item footer non-selectable and outside line item numbering', () => {
    window.localStorage.setItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(['no']));

    render(<InvoiceTable bill={openPendingBill} />);

    const table = getInvoiceTable();
    const bodyRows = Array.from(table.querySelectorAll('tbody tr'));
    const addItemFooter = getAddItemFooter();

    expect(bodyRows).toHaveLength(openPendingBill.lineItems.length + 1);
    expect(bodyRows[bodyRows.length - 1]).toBe(getDraftRow());
    expect(within(getDraftRow()).getByRole('checkbox')).toBeDisabled();
    expect(table).not.toContainElement(addItemFooter);
    expect(within(addItemFooter).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(within(addItemFooter).queryByRole('button', { name: /costs/i })).not.toBeInTheDocument();
    expect(within(addItemFooter).queryByRole('button', { name: /cancel item/i })).not.toBeInTheDocument();
    expect(within(table).getAllByRole('checkbox')).toHaveLength(openPendingBill.lineItems.length + 2);
    expect(bodyRows[0].children[1]).toHaveTextContent(/^1$/);
    expect(bodyRows[1].children[1]).toHaveTextContent(/^2$/);
    expect(getDraftRow().children[1]).toHaveTextContent(/^3$/);
    expect(addItemFooter).not.toHaveTextContent(/^3$/);
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
    expect(screen.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
  });

  it('restores a persisted tax column preference', () => {
    window.localStorage.setItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(['status', 'discount', 'tax']));

    render(<InvoiceTable bill={openPendingBill} />);

    expect(screen.getByRole('columnheader', { name: /tax/i })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /number/i })).not.toBeInTheDocument();
    expect(getDraftRow().children[1]).toHaveTextContent('Select bill item');
  });

  it('keeps hidden financial column values in calculations and rendered totals', async () => {
    const user = userEvent.setup();

    render(<InvoiceTable bill={discountedPendingBill} />);

    await user.click(screen.getByRole('button', { name: /columns/i }));
    const columnOptions = screen.getByRole('group', { name: /line item columns/i });

    await user.click(within(columnOptions).getByRole('checkbox', { name: /discount/i }));

    expect(screen.queryByRole('columnheader', { name: /discount/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    expect(screen.getByText('4,750')).toBeInTheDocument();
  });

  it('closes an active editable cell before hiding that column', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(['quantity']));

    render(<InvoiceTable bill={openPendingBill} />);

    await user.click(screen.getAllByRole('button', { name: /^1$/ })[1]);
    expect(await screen.findByRole('textbox', { name: /quantity/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /columns/i }));
    await user.click(screen.getByRole('checkbox', { name: /quantity/i }));

    expect(screen.queryByRole('textbox', { name: /quantity/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /quantity/i })).not.toBeInTheDocument();
  });
});
