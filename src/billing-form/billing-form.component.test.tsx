import React from 'react';
import { render, screen } from '@testing-library/react';
import BillingForm from './billing-form.component';
import useBillableServices from '../hooks/useBillableServices';

jest.mock('../hooks/useBillableServices');

jest.mock('@openmrs/esm-framework', () => {
  const originalModule = jest.requireActual('@openmrs/esm-framework');

  return {
    ...originalModule,
    ExtensionSlot: ({ name, state }) => (
      <div data-testid="extension-slot">
        {name}:{state?.patientUuid}
      </div>
    ),
    Workspace2: ({ title, children }) => (
      <div>
        <div>{title}</div>
        {children}
      </div>
    ),
    navigate: jest.fn(),
    showSnackbar: jest.fn(),
    useConfig: jest.fn(() => ({
      cashPointUuid: 'cash-point-uuid',
      cashierUuid: 'cashier-uuid',
      defaultPaymentMethodName: 'Cash',
    })),
    usePatient: jest.fn(() => ({
      patient: { id: 'patient-uuid' },
      isLoading: false,
    })),
  };
});

const mockUseBillableServices = useBillableServices as jest.MockedFunction<typeof useBillableServices>;

const workspaceChromeProps = {
  closeWorkspace: jest.fn(),
  launchChildWorkspace: jest.fn(),
  promptBeforeClosing: jest.fn(),
  setTitle: jest.fn(),
  setLoading: jest.fn(),
  setDirty: jest.fn(),
  windowProps: {},
  groupProps: {},
  workspaceName: 'billing-form-workspace',
} as const;

function renderBillingForm(workspaceProps: Record<string, unknown>) {
  return render(<BillingForm {...(workspaceChromeProps as any)} workspaceProps={workspaceProps} />);
}

describe('BillingForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBillableServices.mockReturnValue({
      billableServices: [],
      error: null,
      isLoading: false,
    } as ReturnType<typeof useBillableServices>);
  });

  it('does not render patient header slot by default', () => {
    renderBillingForm({ patientUuid: 'patient-uuid', workspaceTitle: 'Create Bill' });

    expect(screen.getByText('Create Bill')).toBeInTheDocument();
    expect(screen.queryByTestId('extension-slot')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /search/i })).toBeInTheDocument();
  });

  it('renders patient header slot when showPatientHeader is true', () => {
    renderBillingForm({ patientUuid: 'patient-uuid', workspaceTitle: 'Create Bill', showPatientHeader: true });

    expect(screen.getByTestId('extension-slot')).toHaveTextContent('patient-header-slot:patient-uuid');
  });
});
