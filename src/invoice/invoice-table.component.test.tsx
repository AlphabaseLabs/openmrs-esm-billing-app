import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InvoiceTable from './invoice-table.component';
import { mockBillData } from '../../__mocks__/bill.mock';
import { launchBillingWorkspace } from '../workspaces';
import useBillableServices from '../hooks/useBillableServices';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('@openmrs/esm-framework', () => ({
  EditIcon: () => <span>Edit</span>,
  isDesktop: jest.fn(() => true),
  useDebounce: (value: string) => value,
  useLayoutType: jest.fn(() => 'desktop'),
}));

jest.mock('../workspaces', () => ({
  launchBillingWorkspace: jest.fn(),
}));

jest.mock('../hooks/useBillableServices');

const mockLaunchBillingWorkspace = launchBillingWorkspace as jest.MockedFunction<typeof launchBillingWorkspace>;
const mockUseBillableServices = useBillableServices as jest.MockedFunction<typeof useBillableServices>;

const addBillItemWorkspaceExpectation = (patientUuid: string) => ({
  patientUuid,
  workspaceTitle: 'Add bill item',
  navigateToBillAfterSave: true,
});

describe('InvoiceTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
