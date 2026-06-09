import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { openmrsFetch, showSnackbar, useConfig, useSession } from '@openmrs/esm-framework';
import { mockBillData } from '../../__mocks__/bill.mock';
import BillDetails from './bill-details.component';

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

jest.mock('./invoice-table.component', () => () => null);

jest.mock('./payments/payments.component', () => () => null);

const mockOpenmrsFetch = openmrsFetch as jest.MockedFunction<typeof openmrsFetch>;
const mockShowSnackbar = showSnackbar as jest.MockedFunction<typeof showSnackbar>;
const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('BillDetails', () => {
  beforeEach(() => {
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
});
