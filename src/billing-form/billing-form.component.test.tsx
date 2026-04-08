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

describe('BillingForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBillableServices.mockReturnValue({
      billableServices: [],
      error: null,
      isLoading: false,
    } as ReturnType<typeof useBillableServices>);
  });

  it('renders the patient header slot and custom workspace title', () => {
    const props = {
      closeWorkspace: jest.fn(),
      workspaceProps: { patientUuid: 'patient-uuid', workspaceTitle: 'Create Bill' },
      launchChildWorkspace: jest.fn(),
      promptBeforeClosing: jest.fn(),
      setTitle: jest.fn(),
      setLoading: jest.fn(),
      setDirty: jest.fn(),
      windowProps: {},
      groupProps: {},
      workspaceName: 'billing-form-workspace',
    } as any;

    render(<BillingForm {...props} />);

    expect(screen.getByText('Create Bill')).toBeInTheDocument();
    expect(screen.getByTestId('extension-slot')).toHaveTextContent('patient-header-slot:patient-uuid');
    expect(screen.getByRole('searchbox', { name: /search/i })).toBeInTheDocument();
  });
});
