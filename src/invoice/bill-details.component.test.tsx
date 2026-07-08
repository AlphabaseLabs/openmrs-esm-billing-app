import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { openmrsFetch, showSnackbar, useConfig, useSession } from '@openmrs/esm-framework';
import { mockBillData } from '../../__mocks__/bill.mock';
import { updateBillLineItem } from '../billing.resource';
import { type LineItem, type MappedBill, PaymentStatus } from '../types';
import BillDetails from './bill-details.component';
import { LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY, type LineItemColumnKey } from './line-item-column-visibility';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string, values?: Record<string, string>) =>
      fallback.replace(/\{\{(\w+)\}\}/g, (_match, key) => values?.[key] ?? `{{${key}}}`),
  }),
}));

jest.mock('@openmrs/esm-framework', () => ({
  openmrsFetch: jest.fn(),
  restBaseUrl: '/ws/rest/v1',
  showModal: jest.fn(),
  showSnackbar: jest.fn(),
  useConfig: jest.fn(),
  useSession: jest.fn(),
}));

jest.mock('./invoice-actions.component', () => ({
  InvoiceActions: () => null,
}));

jest.mock('../billing.resource', () => ({
  updateBillLineItem: jest.fn(),
}));

jest.mock('../payment-points/payment-points.resource', () => ({
  useProviderOptions: () => ({
    providerOptions: [
      { id: 'provider-uuid', uuid: 'provider-uuid', label: 'Dr Sponsor' },
      { id: 'provider-other', uuid: 'provider-other', label: 'Dr Other' },
    ],
    isLoading: false,
  }),
}));

jest.mock('./invoice-table.component', () => ({
  __esModule: true,
  default: ({
    bill,
    onVisibleColumnsChange,
  }: {
    bill?: MappedBill;
    onVisibleColumnsChange?: (visibleColumnKeys: Array<LineItemColumnKey>) => void;
  }) => (
    <div data-testid="invoice-table">
      {bill?.lineItems?.map((lineItem) => (
        <span data-testid={`line-discount-${lineItem.uuid}`} key={lineItem.uuid}>
          {lineItem.discounts
            ? lineItem.discounts.reduce((total, discount) => total + (discount.amount ?? 0), 0)
            : (lineItem.totalDiscount ?? 0)}
        </span>
      ))}
      <button
        type="button"
        onClick={() => onVisibleColumnsChange?.(['billItem', 'price', 'tax', 'total', 'actionButton'])}>
        Show tax column
      </button>
    </div>
  ),
}));

type MockPaymentsProps = {
  bill: any;
  showTaxSummary?: boolean;
};

function mockPaymentsComponent({ bill, showTaxSummary }: MockPaymentsProps) {
  return (
    <div data-testid="payments">
      <span>Discount total: {bill.totalDiscounts ?? 0}</span>
      <span>Amount due: {bill.balance ?? 0}</span>
      <span>Tax summary visible: {String(showTaxSummary)}</span>
    </div>
  );
}

jest.mock('./payments/payments.component', () => ({
  __esModule: true,
  default: mockPaymentsComponent,
}));

const mockOpenmrsFetch = openmrsFetch as jest.MockedFunction<typeof openmrsFetch>;
const mockShowSnackbar = showSnackbar as jest.MockedFunction<typeof showSnackbar>;
const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUpdateBillLineItem = updateBillLineItem as jest.MockedFunction<typeof updateBillLineItem>;

const billWithBulkDiscountBase = {
  ...mockBillData[0],
  balance: 100,
  totalAmount: 100,
  totalAmountWithoutTaxAndDiscount: 100,
  totalTax: 0,
  totalActualPayments: 0,
  billLineItemDiscounts: 0,
  totalDiscounts: 0,
  closed: false,
};

const getLineDiscountTotal = (lineItem: LineItem) =>
  lineItem.discounts
    ? lineItem.discounts.reduce((total, discount) => total + (discount.amount ?? 0), 0)
    : (lineItem.totalDiscount ?? 0);

const createLineItem = (overrides: Partial<LineItem> = {}) => {
  const price = overrides.price ?? 100;
  const quantity = overrides.quantity ?? 1;
  const subtotal = price * quantity;
  const discounts = overrides.discounts ?? [];
  const totalDiscount =
    overrides.totalDiscount ?? discounts.reduce((total, discount) => total + (discount.amount ?? 0), 0);

  return {
    ...mockBillData[0].lineItems[0],
    uuid: overrides.uuid ?? 'lineitem-uuid-1',
    display: overrides.display ?? 'BillLineItem',
    item: overrides.item ?? 'TEST SERVICE',
    billableService: overrides.billableService ?? 'service-uuid-1:TEST SERVICE',
    quantity,
    price,
    paymentStatus: overrides.paymentStatus ?? PaymentStatus.PENDING,
    discounts,
    totalDiscount,
    totalTax: overrides.totalTax ?? 0,
    amount: subtotal,
    total: overrides.total ?? subtotal - totalDiscount + (overrides.totalTax ?? 0),
    totalAllocated: overrides.totalAllocated ?? 0,
    voided: overrides.voided ?? false,
    ...overrides,
  } as LineItem;
};

const createBill = (lineItems: Array<LineItem>, overrides: Partial<MappedBill> = {}) => {
  const totalAmountWithoutTaxAndDiscount = lineItems.reduce(
    (total, lineItem) => total + (lineItem.price ?? 0) * (lineItem.quantity ?? 0),
    0,
  );
  const totalTax = lineItems.reduce((total, lineItem) => total + (lineItem.totalTax ?? 0), 0);
  const totalDiscounts = lineItems.reduce((total, lineItem) => total + getLineDiscountTotal(lineItem), 0);
  const totalAmount = totalAmountWithoutTaxAndDiscount + totalTax - totalDiscounts;
  const totalActualPayments = overrides.totalActualPayments ?? 0;

  return {
    ...billWithBulkDiscountBase,
    lineItems,
    totalAmountWithoutTaxAndDiscount,
    totalTax,
    totalAmount,
    billLineItemDiscounts: totalDiscounts,
    totalDiscounts,
    totalActualPayments,
    tenderedAmount: totalActualPayments,
    balance: totalAmount - totalActualPayments,
    status: totalAmount - totalActualPayments <= 0 ? PaymentStatus.PAID : PaymentStatus.PENDING,
    ...overrides,
  } as MappedBill;
};

describe('BillDetails', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.removeItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY);
    mockUseConfig.mockReturnValue({ sendInvoiceUrl: '/send-invoice' } as ReturnType<typeof useConfig>);
    mockUseSession.mockReturnValue({
      sessionLocation: { uuid: 'location-uuid', display: 'Luqman Clinic' },
      currentProvider: { uuid: 'provider-uuid', display: 'Dr Sponsor' },
    } as unknown as ReturnType<typeof useSession>);
  });

  it('shows a start snackbar immediately and a success snackbar when sending invoice succeeds', async () => {
    const user = userEvent.setup();
    mockOpenmrsFetch
      .mockResolvedValueOnce({
        data: { person: { attributes: [{ value: '03001234567', attributeType: { display: 'Phone' } }] } },
      } as Awaited<ReturnType<typeof openmrsFetch>>)
      .mockResolvedValueOnce({ ok: true } as Awaited<ReturnType<typeof openmrsFetch>>);

    render(<BillDetails bill={mockBillData[0]} />);

    await user.click(screen.getByRole('button', { name: /send invoice/i }));

    expect(mockShowSnackbar).toHaveBeenNthCalledWith(1, {
      title: 'Sending invoice',
      subtitle: 'Sending invoice to John Doe',
      kind: 'info',
    });

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenNthCalledWith(2, {
        title: 'Invoice sent',
        subtitle: 'Invoice sent to John Doe',
        kind: 'success',
      });
    });
  });

  it('renders Bulk discount between line items and payments with a zero fallback', () => {
    render(<BillDetails bill={billWithBulkDiscountBase} />);

    const invoiceTable = screen.getByTestId('invoice-table');
    const discountsLabel = screen.getByText('Bulk discount:');
    const payments = screen.getByTestId('payments');

    expect(invoiceTable.compareDocumentPosition(discountsLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(discountsLabel.compareDocumentPosition(payments) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('button', { name: /PKR\s*0\.00/i })).toBeInTheDocument();
  });

  it('passes tax summary visibility from line-item column visibility to payments', async () => {
    const user = userEvent.setup();

    render(<BillDetails bill={billWithBulkDiscountBase} />);

    expect(screen.getByTestId('payments')).toHaveTextContent('Tax summary visible: false');

    await user.click(screen.getByRole('button', { name: /show tax column/i }));

    expect(screen.getByTestId('payments')).toHaveTextContent('Tax summary visible: true');
  });

  it('keeps the invoice table unchanged while editing a Bulk discount draft', async () => {
    const user = userEvent.setup();
    const bill = createBill([createLineItem({ uuid: 'line-one', price: 100 })]);

    render(<BillDetails bill={bill} />);

    expect(screen.getByTestId('line-discount-line-one')).toHaveTextContent('0');

    await user.click(screen.getByRole('button', { name: /PKR\s*0\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '50');

    expect(screen.getByTestId('line-discount-line-one')).toHaveTextContent('0');
    expect(mockUpdateBillLineItem).not.toHaveBeenCalled();
  });

  it('commits a fixed Bulk discount amount through changed line-item updates', async () => {
    const user = userEvent.setup();
    const bill = createBill([createLineItem({ uuid: 'line-one', price: 100 })]);
    mockUpdateBillLineItem.mockResolvedValueOnce({ ok: true } as any);

    render(<BillDetails bill={bill} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*0\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '50{Enter}');

    await waitFor(() =>
      expect(mockUpdateBillLineItem).toHaveBeenCalledWith(
        'line-one',
        expect.objectContaining({
          discounts: [
            expect.objectContaining({
              amount: 50,
              baseAmount: 100,
              rate: 0.5,
              sponsor: 'provider-uuid',
            }),
          ],
        }),
      ),
    );
    await waitFor(() => expect(screen.getByTestId('line-discount-line-one')).toHaveTextContent('50'));
    expect(screen.getByTestId('payments')).toHaveTextContent('Discount total: 50');
    expect(screen.getByTestId('payments')).toHaveTextContent('Amount due: 50');
    expect(mockShowSnackbar).toHaveBeenCalledWith({
      title: 'Bulk discount saved',
      subtitle: 'Invoice bulk discount was applied successfully',
      kind: 'success',
      timeoutInMs: 3000,
    });
  });

  it('refreshes the bill after a Bulk discount update succeeds', async () => {
    const user = userEvent.setup();
    const onRefreshBill = jest.fn();
    const bill = createBill([createLineItem({ uuid: 'line-one', price: 100 })]);
    mockUpdateBillLineItem.mockResolvedValueOnce({ ok: true } as any);

    render(<BillDetails bill={bill} onRefreshBill={onRefreshBill} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*0\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '50{Enter}');

    await waitFor(() => expect(onRefreshBill).toHaveBeenCalled());
  });

  it('keeps Bulk discount editable without disabled tooltip when line-item discounts exist', async () => {
    const user = userEvent.setup();
    mockUpdateBillLineItem.mockResolvedValueOnce({ ok: true } as any);
    const bill = createBill([
      createLineItem({
        uuid: 'consultation',
        display: 'Consultation',
        price: 100,
        discounts: [{ amount: 50, baseAmount: 100, description: 'Board approval', sponsor: 'provider-uuid' }],
      }),
    ]);

    render(<BillDetails bill={bill} />);

    expect(screen.getByText('Bulk discount:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PKR\s*50\.00/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Discounts are managed on line items/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /PKR\s*50\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '25{Enter}');

    await waitFor(() =>
      expect(mockUpdateBillLineItem).toHaveBeenCalledWith(
        'consultation',
        expect.objectContaining({
          discounts: [
            expect.objectContaining({
              amount: 25,
              sponsor: 'provider-uuid',
              description: 'Board approval',
            }),
          ],
        }),
      ),
    );
  });

  it('shows error feedback and restores server-confirmed value when Bulk discount update fails', async () => {
    const user = userEvent.setup();
    const bill = createBill([createLineItem({ uuid: 'line-one', price: 100 })]);
    mockUpdateBillLineItem.mockRejectedValueOnce(new Error('Unable to save'));

    render(<BillDetails bill={bill} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*0\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '50');
    expect(screen.getByTestId('line-discount-line-one')).toHaveTextContent('0');

    await user.type(input, '{Enter}');

    await waitFor(() => expect(mockUpdateBillLineItem).toHaveBeenCalledWith('line-one', expect.any(Object)));
    expect(mockShowSnackbar).toHaveBeenCalledWith({
      title: 'Bulk discount update failed',
      subtitle: 'Unable to save',
      kind: 'error',
      timeoutInMs: 5000,
      isLowContrast: true,
    });
    expect(screen.getByTestId('line-discount-line-one')).toHaveTextContent('0');
    expect(screen.getByTestId('payments')).toHaveTextContent('Discount total: 0');
    expect(screen.getByTestId('payments')).toHaveTextContent('Amount due: 100');
  });

  it('rejects a fixed amount greater than the current discountable amount', async () => {
    const user = userEvent.setup();
    const bill = createBill([createLineItem({ uuid: 'line-one', price: 100 })]);

    render(<BillDetails bill={bill} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*0\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '101{Enter}');

    expect(mockUpdateBillLineItem).not.toHaveBeenCalled();
    expect(screen.getByText(/Enter Bulk discount between 0 and PKR\s*100\.00/i)).toBeInTheDocument();
  });

  it('rejects invalid fixed Bulk discount text without submitting line-item updates', async () => {
    const user = userEvent.setup();
    const bill = createBill([createLineItem({ uuid: 'line-one', price: 100 })]);

    render(<BillDetails bill={bill} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*0\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, 'abc{Enter}');

    expect(mockUpdateBillLineItem).not.toHaveBeenCalled();
    expect(screen.getByText(/Enter Bulk discount between 0 and PKR\s*100\.00/i)).toBeInTheDocument();
  });

  it('clears Bulk discount when a blank fixed amount is committed', async () => {
    const user = userEvent.setup();
    const bill = createBill([
      createLineItem({
        uuid: 'line-one',
        price: 100,
        discounts: [{ amount: 25, baseAmount: 100, sponsor: 'provider-uuid' }],
      }),
    ]);
    mockUpdateBillLineItem.mockResolvedValueOnce({ ok: true } as any);

    render(<BillDetails bill={bill} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*25\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.keyboard('{Enter}');

    await waitFor(() => expect(mockUpdateBillLineItem).toHaveBeenCalledWith('line-one', { discounts: [] }));
    await waitFor(() => expect(screen.getByTestId('line-discount-line-one')).toHaveTextContent('0'));
  });

  it('commits percent edits from the percent affordance', async () => {
    const user = userEvent.setup();
    const bill = createBill([createLineItem({ uuid: 'line-one', price: 300 })]);
    mockUpdateBillLineItem.mockResolvedValue({ ok: true } as any);

    render(<BillDetails bill={bill} />);

    await user.click(screen.getByRole('button', { name: /Open Bulk discount editor/i }));
    const percentInput = screen.getByRole('textbox', { name: /Percent/i });
    await user.clear(percentInput);
    await user.type(percentInput, '10{Enter}');

    await waitFor(() =>
      expect(mockUpdateBillLineItem).toHaveBeenLastCalledWith(
        'line-one',
        expect.objectContaining({
          discounts: [
            expect.objectContaining({
              amount: 30,
              baseAmount: 300,
              rate: 0.1,
              sponsor: 'provider-uuid',
            }),
          ],
        }),
      ),
    );
  });

  it('rejects invalid Bulk percent text without submitting line-item updates', async () => {
    const user = userEvent.setup();
    const bill = createBill([createLineItem({ uuid: 'line-one', price: 300 })]);

    render(<BillDetails bill={bill} />);

    await user.click(screen.getByRole('button', { name: /Open Bulk discount editor/i }));
    const percentInput = screen.getByRole('textbox', { name: /Percent/i });
    await user.clear(percentInput);
    await user.type(percentInput, '120{Enter}');

    expect(mockUpdateBillLineItem).not.toHaveBeenCalled();
    expect(screen.getByText(/Enter a discount percent between 0 and 100/i)).toBeInTheDocument();
  });

  it('submits Bulk discount sponsor and comment in line-item discount payloads', async () => {
    const user = userEvent.setup();
    const bill = createBill([createLineItem({ uuid: 'line-one', price: 100 })]);
    mockUpdateBillLineItem.mockResolvedValueOnce({ ok: true } as any);

    render(<BillDetails bill={bill} />);

    await user.click(screen.getByRole('button', { name: /Open Bulk discount editor/i }));
    await user.type(screen.getByRole('textbox', { name: /Comment/i }), 'Board approval');
    const percentInput = screen.getByRole('textbox', { name: /Percent/i });
    await user.clear(percentInput);
    await user.type(percentInput, '10{Enter}');

    await waitFor(() =>
      expect(mockUpdateBillLineItem).toHaveBeenCalledWith('line-one', {
        discounts: [
          expect.objectContaining({
            amount: 10,
            sponsor: 'provider-uuid',
            description: 'Board approval',
          }),
        ],
      }),
    );
  });

  it('confirms before replacing a conflicting increased line discount sponsor', async () => {
    const user = userEvent.setup();
    mockUpdateBillLineItem.mockResolvedValueOnce({ ok: true } as any);
    const bill = createBill([
      createLineItem({
        uuid: 'consultation',
        display: 'Consultation',
        price: 100,
        discounts: [{ amount: 50, baseAmount: 100, sponsor: 'provider-other' }],
      }),
    ]);

    render(<BillDetails bill={bill} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*50\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '75{Enter}');

    expect(await screen.findByText('Confirm sponsor change')).toBeInTheDocument();
    expect(screen.getByText('Consultation discount sponsor will set to Dr Sponsor.')).toBeInTheDocument();
    expect(mockUpdateBillLineItem).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() =>
      expect(mockUpdateBillLineItem).toHaveBeenCalledWith(
        'consultation',
        expect.objectContaining({
          discounts: [
            expect.objectContaining({
              amount: 75,
              sponsor: 'provider-uuid',
            }),
          ],
        }),
      ),
    );
  });

  it('cancels sponsor replacement without submitting Bulk discount', async () => {
    const user = userEvent.setup();
    const bill = createBill([
      createLineItem({
        uuid: 'consultation',
        display: 'Consultation',
        price: 100,
        discounts: [{ amount: 50, baseAmount: 100, sponsor: 'provider-other' }],
        paymentStatus: PaymentStatus.POSTED,
      }),
    ]);

    render(<BillDetails bill={bill} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*50\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '75{Enter}');

    expect(await screen.findByText('Consultation discount sponsor will set to Dr Sponsor.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockUpdateBillLineItem).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByText('Confirm sponsor change').closest('.cds--modal')).toHaveAttribute('aria-hidden', 'true'),
    );
    expect(screen.getByRole('textbox', { name: /Bulk discount/i })).toHaveValue('50');
    expect(screen.getByTestId('line-discount-consultation')).toHaveTextContent('50');
  });

  it('applies only the +141 Bulk discount delta when changing 1,859 to 2,000', async () => {
    const user = userEvent.setup();
    const bill = createBill([
      createLineItem({
        uuid: 'dental-session',
        display: 'Dental Session',
        price: 1500,
        discounts: [{ amount: 1409, baseAmount: 1500 }],
      }),
      createLineItem({
        uuid: 'paid-registration',
        display: 'Registration',
        price: 500,
        paymentStatus: PaymentStatus.PAID,
      }),
      createLineItem({
        uuid: 'paid-discounted-registration',
        display: 'Registration',
        price: 450,
        discounts: [{ amount: 450, baseAmount: 450 }],
        paymentStatus: PaymentStatus.PAID,
      }),
      createLineItem({
        uuid: 'pending-registration',
        display: 'Registration',
        price: 450,
      }),
    ]);
    mockUpdateBillLineItem.mockResolvedValue({ ok: true } as any);

    render(<BillDetails bill={bill} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*1,859\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '2000');

    expect(screen.getByTestId('line-discount-dental-session')).toHaveTextContent('1409');
    expect(screen.getByTestId('line-discount-paid-registration')).toHaveTextContent('0');
    expect(screen.getByTestId('line-discount-paid-discounted-registration')).toHaveTextContent('450');
    expect(screen.getByTestId('line-discount-pending-registration')).toHaveTextContent('0');

    await user.type(input, '{Enter}');

    await waitFor(() => expect(mockUpdateBillLineItem).toHaveBeenCalledTimes(2));
    expect(mockUpdateBillLineItem).toHaveBeenNthCalledWith(
      1,
      'dental-session',
      expect.objectContaining({
        discounts: [expect.objectContaining({ amount: 1500, baseAmount: 1500 })],
      }),
    );
    expect(mockUpdateBillLineItem).toHaveBeenNthCalledWith(
      2,
      'paid-registration',
      expect.objectContaining({
        discounts: [expect.objectContaining({ amount: 50, baseAmount: 500 })],
      }),
    );
    await waitFor(() => expect(screen.getByTestId('line-discount-dental-session')).toHaveTextContent('1500'));
    expect(screen.getByTestId('line-discount-paid-registration')).toHaveTextContent('50');
    expect(screen.getByTestId('line-discount-paid-discounted-registration')).toHaveTextContent('450');
    expect(screen.getByTestId('line-discount-pending-registration')).toHaveTextContent('0');
  });

  it('renders Bulk discount read-only for closed bills', () => {
    render(
      <BillDetails
        bill={{
          ...billWithBulkDiscountBase,
          lineItems: [
            {
              ...billWithBulkDiscountBase.lineItems[0],
              discounts: [{ amount: 25, baseAmount: 100 }],
              totalDiscount: 25,
            },
          ],
          billLineItemDiscounts: 25,
          totalDiscounts: 25,
          closed: true,
        }}
      />,
    );

    expect(screen.getByText('Bulk discount:')).toBeInTheDocument();
    expect(screen.getByText(/PKR\s*25\.00/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Open Bulk discount editor/i })).not.toBeInTheDocument();
  });
});
