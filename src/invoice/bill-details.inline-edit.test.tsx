import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BillDetails from './bill-details.component';
import { openPendingBill } from './invoice-story.fixtures';
import useBillableServices from '../hooks/useBillableServices';
import { updateBillLineItem, usePaymentModes } from '../billing.resource';

const mockUpdateBillLineItem = updateBillLineItem as jest.MockedFunction<typeof updateBillLineItem>;
const mockUseBillableServices = useBillableServices as jest.MockedFunction<typeof useBillableServices>;
const mockUsePaymentModes = usePaymentModes as jest.MockedFunction<typeof usePaymentModes>;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('@openmrs/esm-framework', () => ({
  EditIcon: () => <span>Edit</span>,
  isDesktop: jest.fn(() => true),
  openmrsFetch: jest.fn(async () => ({ ok: true, data: {} })),
  restBaseUrl: '/ws/rest/v1',
  showModal: jest.fn(() => jest.fn()),
  showSnackbar: jest.fn(),
  useConfig: jest.fn(() => ({ sendInvoiceUrl: '/send-invoice', defaultPaymentMethodName: 'Cash' })),
  useDebounce: (value: string) => value,
  useLayoutType: jest.fn(() => 'desktop'),
  useSession: jest.fn(() => ({
    sessionLocation: { uuid: 'location', display: 'Clinic' },
    user: { uuid: 'user' },
  })),
}));

jest.mock('../hooks/useBillableServices');

jest.mock('../workspaces', () => ({
  launchBillingWorkspace: jest.fn(),
}));

jest.mock('../billing.resource', () => ({
  updateBillLineItem: jest.fn(),
  usePaymentModes: jest.fn(),
}));

jest.mock('./invoice-actions.component', () => ({
  InvoiceActions: () => null,
}));

jest.mock('./payments/payments.component', () => ({
  __esModule: true,
  default: () => null,
}));

describe('BillDetails inline editing integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateBillLineItem.mockResolvedValue({ ok: true } as any);
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
    mockUsePaymentModes.mockReturnValue({
      paymentModes: [],
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    } as ReturnType<typeof usePaymentModes>);
  });

  it('saves a price edit and updates the invoice summary', async () => {
    const user = userEvent.setup();

    render(<BillDetails bill={openPendingBill} showDiscardButton={false} />);

    expect(screen.getByText(/PKR 249,999.00/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /249,999/i }));
    const input = screen.getByRole('textbox', { name: /price/i });
    await user.clear(input);
    await user.type(input, '250000{Enter}');

    await waitFor(() => expect(mockUpdateBillLineItem).toHaveBeenCalledWith('line-item-clear-aligner', { price: 250000 }));
    await waitFor(() => expect(screen.getByText(/PKR 250,000.00/i)).toBeInTheDocument());
  });
});
