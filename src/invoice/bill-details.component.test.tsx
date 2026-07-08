import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { openmrsFetch, showSnackbar, useConfig, useSession } from '@openmrs/esm-framework';
import { mockBillData } from '../../__mocks__/bill.mock';
import { updateBillAdditionalDiscount } from '../billing.resource';
import BillDetails from './bill-details.component';

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
  updateBillAdditionalDiscount: jest.fn(),
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

jest.mock('./invoice-table.component', () => () => <div data-testid="invoice-table" />);

jest.mock('./payments/payments.component', () => ({
  __esModule: true,
  default: ({ bill }: { bill: any }) => (
    <div data-testid="payments">
      <span>Discount total: {bill.totalDiscounts ?? 0}</span>
      <span>Amount due: {bill.balance ?? 0}</span>
    </div>
  ),
}));

const mockOpenmrsFetch = openmrsFetch as jest.MockedFunction<typeof openmrsFetch>;
const mockShowSnackbar = showSnackbar as jest.MockedFunction<typeof showSnackbar>;
const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUpdateBillAdditionalDiscount = updateBillAdditionalDiscount as jest.MockedFunction<
  typeof updateBillAdditionalDiscount
>;

const billWithAdditionalDiscountBase = {
  ...mockBillData[0],
  additionalDiscount: 0,
  balance: 100,
  totalAmount: 100,
  totalAmountWithoutTaxAndDiscount: 100,
  totalTax: 0,
  totalActualPayments: 0,
  billLineItemDiscounts: 0,
  totalDiscounts: 0,
  closed: false,
};

describe('BillDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    render(<BillDetails bill={{ ...billWithAdditionalDiscountBase, additionalDiscount: undefined }} />);

    const invoiceTable = screen.getByTestId('invoice-table');
    const discountsLabel = screen.getByText('Bulk discount:');
    const payments = screen.getByTestId('payments');

    expect(invoiceTable.compareDocumentPosition(discountsLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(discountsLabel.compareDocumentPosition(payments) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('button', { name: /PKR\s*0\.00/i })).toBeInTheDocument();
  });

  it('commits a fixed Bulk discount amount and leaves totals to backend refresh', async () => {
    const user = userEvent.setup();
    mockUpdateBillAdditionalDiscount.mockResolvedValueOnce({ ok: true } as any);

    render(<BillDetails bill={billWithAdditionalDiscountBase} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*0\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '50{Enter}');

    await waitFor(() =>
      expect(mockUpdateBillAdditionalDiscount).toHaveBeenCalledWith(
        'test-uuid-1',
        expect.objectContaining({ discounts: 50, sponsor: 'provider-uuid' }),
      ),
    );
    expect(mockShowSnackbar).toHaveBeenCalledWith({
      title: 'Bulk discount saved',
      subtitle: 'Invoice bulk discount was applied successfully',
      kind: 'success',
      timeoutInMs: 3000,
    });
    expect(screen.getByTestId('payments')).toHaveTextContent('Discount total: 0');
    expect(screen.getByTestId('payments')).toHaveTextContent('Amount due: 100');
  });

  it('refreshes the bill after a Bulk discount update succeeds', async () => {
    const user = userEvent.setup();
    const onRefreshBill = jest.fn();
    mockUpdateBillAdditionalDiscount.mockResolvedValueOnce({ ok: true } as any);

    render(<BillDetails bill={billWithAdditionalDiscountBase} onRefreshBill={onRefreshBill} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*0\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '50{Enter}');

    await waitFor(() => expect(onRefreshBill).toHaveBeenCalled());
  });

  it('keeps Bulk discount editable without disabled tooltip when line-item discounts exist', async () => {
    const user = userEvent.setup();
    mockUpdateBillAdditionalDiscount.mockResolvedValueOnce({ ok: true } as any);
    render(
      <BillDetails
        bill={{
          ...billWithAdditionalDiscountBase,
          lineItems: [
            {
              ...billWithAdditionalDiscountBase.lineItems[0],
              display: 'Consultation',
              discounts: [{ amount: 50, baseAmount: 100, description: 'Board approval', sponsor: 'provider-uuid' }],
              totalDiscount: 50,
              paymentStatus: 'PENDING',
            },
          ],
          billLineItemDiscounts: 50,
          totalDiscounts: 50,
          balance: 50,
        }}
      />,
    );

    expect(screen.getByText('Bulk discount:')).toBeInTheDocument();
    expect(screen.getByText(/PKR\s*50\.00/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Discounts are managed on line items/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /PKR\s*50\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '25{Enter}');

    await waitFor(() =>
      expect(mockUpdateBillAdditionalDiscount).toHaveBeenCalledWith(
        'test-uuid-1',
        expect.objectContaining({ discounts: 25, sponsor: 'provider-uuid' }),
      ),
    );
  });

  it('shows error feedback and keeps server-confirmed value when Bulk discount update fails', async () => {
    const user = userEvent.setup();
    mockUpdateBillAdditionalDiscount.mockRejectedValueOnce(new Error('Unable to save'));

    render(<BillDetails bill={billWithAdditionalDiscountBase} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*0\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '50{Enter}');

    await waitFor(() =>
      expect(mockUpdateBillAdditionalDiscount).toHaveBeenCalledWith(
        'test-uuid-1',
        expect.objectContaining({ discounts: 50, sponsor: 'provider-uuid' }),
      ),
    );
    expect(mockShowSnackbar).toHaveBeenCalledWith({
      title: 'Bulk discount update failed',
      subtitle: 'Unable to save',
      kind: 'error',
      timeoutInMs: 5000,
      isLowContrast: true,
    });
    expect(screen.getByTestId('payments')).toHaveTextContent('Discount total: 0');
    expect(screen.getByTestId('payments')).toHaveTextContent('Amount due: 100');
  });

  it('rejects a fixed amount greater than the current discountable amount', async () => {
    const user = userEvent.setup();

    render(<BillDetails bill={billWithAdditionalDiscountBase} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*0\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '101{Enter}');

    expect(mockUpdateBillAdditionalDiscount).not.toHaveBeenCalled();
    expect(screen.getByText(/Enter Bulk discount between 0 and PKR\s*100\.00/i)).toBeInTheDocument();
  });

  it('commits percent edits from the percent affordance', async () => {
    const user = userEvent.setup();
    mockUpdateBillAdditionalDiscount.mockResolvedValue({ ok: true } as any);

    render(<BillDetails bill={{ ...billWithAdditionalDiscountBase, balance: 300, totalAmount: 300 }} />);

    await user.click(screen.getByRole('button', { name: /Open Bulk discount editor/i }));
    const percentInput = screen.getByRole('textbox', { name: /Percent/i });
    await user.clear(percentInput);
    await user.type(percentInput, '10{Enter}');

    await waitFor(() =>
      expect(mockUpdateBillAdditionalDiscount).toHaveBeenLastCalledWith(
        'test-uuid-1',
        expect.objectContaining({ discounts: 30, sponsor: 'provider-uuid' }),
      ),
    );
    expect(screen.getByTestId('payments')).toHaveTextContent('Discount total: 0');
    expect(screen.getByTestId('payments')).toHaveTextContent('Amount due: 300');
  });

  it('submits Bulk discount sponsor and comment payload', async () => {
    const user = userEvent.setup();
    mockUpdateBillAdditionalDiscount.mockResolvedValueOnce({ ok: true } as any);

    render(<BillDetails bill={billWithAdditionalDiscountBase} />);

    await user.click(screen.getByRole('button', { name: /Open Bulk discount editor/i }));
    await user.type(screen.getByRole('textbox', { name: /Comment/i }), 'Board approval');
    const percentInput = screen.getByRole('textbox', { name: /Percent/i });
    await user.clear(percentInput);
    await user.type(percentInput, '10{Enter}');

    await waitFor(() =>
      expect(mockUpdateBillAdditionalDiscount).toHaveBeenCalledWith('test-uuid-1', {
        discounts: 10,
        sponsor: 'provider-uuid',
        comment: 'Board approval',
      }),
    );
  });

  it('confirms before replacing a conflicting eligible line discount sponsor', async () => {
    const user = userEvent.setup();
    mockUpdateBillAdditionalDiscount.mockResolvedValueOnce({ ok: true } as any);

    render(
      <BillDetails
        bill={{
          ...billWithAdditionalDiscountBase,
          lineItems: [
            {
              ...billWithAdditionalDiscountBase.lineItems[0],
              display: 'Consultation',
              discounts: [{ amount: 50, baseAmount: 100, sponsor: 'provider-other' }],
              paymentStatus: 'PENDING',
              totalDiscount: 50,
            },
          ],
          billLineItemDiscounts: 50,
          totalDiscounts: 50,
          balance: 50,
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /PKR\s*50\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '25{Enter}');

    expect(await screen.findByText('Confirm sponsor change')).toBeInTheDocument();
    expect(screen.getByText('Consultation discount sponsor will set to Dr Sponsor.')).toBeInTheDocument();
    expect(mockUpdateBillAdditionalDiscount).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() =>
      expect(mockUpdateBillAdditionalDiscount).toHaveBeenCalledWith(
        'test-uuid-1',
        expect.objectContaining({ discounts: 25, sponsor: 'provider-uuid' }),
      ),
    );
  });

  it('cancels sponsor replacement without submitting Bulk discount', async () => {
    const user = userEvent.setup();

    render(
      <BillDetails
        bill={{
          ...billWithAdditionalDiscountBase,
          lineItems: [
            {
              ...billWithAdditionalDiscountBase.lineItems[0],
              display: 'Consultation',
              discounts: [{ amount: 50, baseAmount: 100, sponsor: 'provider-other' }],
              paymentStatus: 'POSTED',
              totalDiscount: 50,
            },
          ],
          billLineItemDiscounts: 50,
          totalDiscounts: 50,
          balance: 50,
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /PKR\s*50\.00/i }));
    const input = screen.getByRole('textbox', { name: /Bulk discount/i });
    await user.clear(input);
    await user.type(input, '25{Enter}');

    expect(await screen.findByText('Consultation discount sponsor will set to Dr Sponsor.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockUpdateBillAdditionalDiscount).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByText('Confirm sponsor change').closest('.cds--modal')).toHaveAttribute('aria-hidden', 'true'),
    );
    expect(screen.getByRole('textbox', { name: /Bulk discount/i })).toHaveValue('50');
  });

  it('renders Bulk discount read-only for closed bills', () => {
    render(
      <BillDetails
        bill={{
          ...billWithAdditionalDiscountBase,
          lineItems: [
            {
              ...billWithAdditionalDiscountBase.lineItems[0],
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
