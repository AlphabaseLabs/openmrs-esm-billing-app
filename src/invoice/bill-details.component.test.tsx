import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { openmrsFetch, showSnackbar, useConfig, useSession } from '@openmrs/esm-framework';
import { mutate } from 'swr';
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

jest.mock('swr', () => ({
  mutate: jest.fn(),
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
const mockMutate = mutate as jest.MockedFunction<typeof mutate>;

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
    } as ReturnType<typeof useSession>);
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

  it('renders additional discount between line items and payments with a zero fallback', () => {
    render(<BillDetails bill={{ ...billWithAdditionalDiscountBase, additionalDiscount: undefined }} />);

    const invoiceTable = screen.getByTestId('invoice-table');
    const additionalDiscountLabel = screen.getByText('Additional discount:');
    const payments = screen.getByTestId('payments');

    expect(
      invoiceTable.compareDocumentPosition(additionalDiscountLabel) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(additionalDiscountLabel.compareDocumentPosition(payments) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('button', { name: /PKR\s*0\.00/i })).toBeInTheDocument();
  });

  it('commits a fixed amount additional discount and refreshes bill data', async () => {
    const user = userEvent.setup();
    mockUpdateBillAdditionalDiscount.mockResolvedValueOnce({ ok: true } as any);

    render(<BillDetails bill={billWithAdditionalDiscountBase} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*0\.00/i }));
    const input = screen.getByRole('textbox', { name: /Additional discount/i });
    await user.clear(input);
    await user.type(input, '50{Enter}');

    await waitFor(() => expect(mockUpdateBillAdditionalDiscount).toHaveBeenCalledWith('test-uuid-1', 50));
    expect(mockMutate).toHaveBeenCalledWith(expect.any(Function), undefined, { revalidate: true });
    expect(mockShowSnackbar).toHaveBeenCalledWith({
      title: 'Additional discount saved',
      subtitle: 'Invoice additional discount was updated successfully',
      kind: 'success',
      timeoutInMs: 3000,
    });
    expect(screen.getByTestId('payments')).toHaveTextContent('Discount total: 50');
    expect(screen.getByTestId('payments')).toHaveTextContent('Amount due: 50');
  });

  it('clears a fixed amount additional discount when the blank draft is submitted with Enter', async () => {
    const user = userEvent.setup();
    mockUpdateBillAdditionalDiscount.mockResolvedValueOnce({ ok: true } as any);

    render(
      <BillDetails
        bill={{
          ...billWithAdditionalDiscountBase,
          additionalDiscount: 50,
          totalDiscounts: 50,
          balance: 50,
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /PKR\s*50\.00/i }));
    const input = screen.getByRole('textbox', { name: /Additional discount/i });
    await user.clear(input);
    await user.keyboard('{Enter}');

    await waitFor(() => expect(mockUpdateBillAdditionalDiscount).toHaveBeenCalledWith('test-uuid-1', 0));
    expect(screen.queryByText(/Enter a discount between 0 and PKR/i)).not.toBeInTheDocument();
  });

  it('clears a fixed amount additional discount when the blank draft loses focus', async () => {
    const user = userEvent.setup();
    mockUpdateBillAdditionalDiscount.mockResolvedValueOnce({ ok: true } as any);

    render(
      <BillDetails
        bill={{
          ...billWithAdditionalDiscountBase,
          additionalDiscount: 50,
          totalDiscounts: 50,
          balance: 50,
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /PKR\s*50\.00/i }));
    const input = screen.getByRole('textbox', { name: /Additional discount/i });
    await user.clear(input);
    fireEvent.blur(input, { relatedTarget: document.body });

    await waitFor(() => expect(mockUpdateBillAdditionalDiscount).toHaveBeenCalledWith('test-uuid-1', 0));
    expect(screen.queryByText(/Enter a discount between 0 and PKR/i)).not.toBeInTheDocument();
  });

  it('shows error feedback and keeps server-confirmed value when additional discount update fails', async () => {
    const user = userEvent.setup();
    mockUpdateBillAdditionalDiscount.mockRejectedValueOnce(new Error('Unable to save'));

    render(
      <BillDetails
        bill={{
          ...billWithAdditionalDiscountBase,
          additionalDiscount: 25,
          totalDiscounts: 25,
          balance: 75,
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /PKR\s*25\.00/i }));
    const input = screen.getByRole('textbox', { name: /Additional discount/i });
    await user.clear(input);
    await user.type(input, '50{Enter}');

    await waitFor(() => expect(mockUpdateBillAdditionalDiscount).toHaveBeenCalledWith('test-uuid-1', 50));
    expect(mockShowSnackbar).toHaveBeenCalledWith({
      title: 'Additional discount update failed',
      subtitle: 'Unable to save',
      kind: 'error',
      timeoutInMs: 5000,
      isLowContrast: true,
    });
    expect(screen.getByTestId('payments')).toHaveTextContent('Discount total: 25');
    expect(screen.getByTestId('payments')).toHaveTextContent('Amount due: 75');
  });

  it('rejects a fixed amount greater than the current discountable amount', async () => {
    const user = userEvent.setup();

    render(<BillDetails bill={billWithAdditionalDiscountBase} />);

    await user.click(screen.getByRole('button', { name: /PKR\s*0\.00/i }));
    const input = screen.getByRole('textbox', { name: /Additional discount/i });
    await user.clear(input);
    await user.type(input, '101{Enter}');

    expect(mockUpdateBillAdditionalDiscount).not.toHaveBeenCalled();
    expect(screen.getByText(/Enter a discount between 0 and PKR\s*100\.00/i)).toBeInTheDocument();
  });

  it('commits percent edits from the percent affordance', async () => {
    const user = userEvent.setup();
    mockUpdateBillAdditionalDiscount.mockResolvedValue({ ok: true } as any);

    render(<BillDetails bill={{ ...billWithAdditionalDiscountBase, balance: 300, totalAmount: 300 }} />);

    await user.click(screen.getByRole('button', { name: /Open additional discount editor/i }));
    const percentInput = screen.getByRole('textbox', { name: /Percent/i });
    await user.clear(percentInput);
    await user.type(percentInput, '10');

    await waitFor(() => expect(mockUpdateBillAdditionalDiscount).toHaveBeenLastCalledWith('test-uuid-1', 30));
    expect(screen.getByTestId('payments')).toHaveTextContent('Discount total: 30');
    expect(screen.getByTestId('payments')).toHaveTextContent('Amount due: 270');
  });

  it('clears additional discount from the percent popover', async () => {
    const user = userEvent.setup();
    mockUpdateBillAdditionalDiscount.mockResolvedValueOnce({ ok: true } as any);

    render(
      <BillDetails
        bill={{
          ...billWithAdditionalDiscountBase,
          additionalDiscount: 50,
          balance: 50,
          totalDiscounts: 50,
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Open additional discount editor/i }));
    await user.click(screen.getByRole('button', { name: /Clear/i }));

    await waitFor(() => expect(mockUpdateBillAdditionalDiscount).toHaveBeenCalledWith('test-uuid-1', 0));
    expect(screen.getByTestId('payments')).toHaveTextContent('Discount total: 0');
    expect(screen.getByTestId('payments')).toHaveTextContent('Amount due: 100');
  });

  it('renders additional discount read-only for closed bills', () => {
    render(
      <BillDetails
        bill={{
          ...billWithAdditionalDiscountBase,
          additionalDiscount: 25,
          closed: true,
        }}
      />,
    );

    expect(screen.getByText('Additional discount:')).toBeInTheDocument();
    expect(screen.getByText(/-\s*PKR\s*25\.00/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Open additional discount editor/i })).not.toBeInTheDocument();
  });
});
