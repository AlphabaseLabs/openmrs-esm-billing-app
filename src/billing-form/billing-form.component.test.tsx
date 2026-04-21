import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BillingForm from './billing-form.component';
import useBillableServices from '../hooks/useBillableServices';

jest.mock('../hooks/useBillableServices');
jest.mock('../autosuggest/autosuggest.component', () => ({
  Autosuggest: ({ labelText, value, onClear, getSearchResults, getDisplayValue }: any) => {
    const [suggestions, setSuggestions] = React.useState([]);

    return (
      <div>
        <label htmlFor="autosuggest-mock">{labelText}</label>
        <input
          id="autosuggest-mock"
          role="searchbox"
          value={value}
          onChange={async (event) => {
            const nextSuggestions = await getSearchResults(event.target.value);
            setSuggestions(nextSuggestions);
          }}
        />
        <button type="button" onClick={onClear}>
          Clear
        </button>
        <ul>
          {suggestions.map((suggestion) => (
            <li key={suggestion.uuid}>{getDisplayValue(suggestion)}</li>
          ))}
        </ul>
      </div>
    );
  },
}));

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

  it('searches billable services by short name', async () => {
    const user = userEvent.setup();

    mockUseBillableServices.mockReturnValue({
      billableServices: [
        {
          uuid: 'service-uuid',
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

    renderBillingForm({ patientUuid: 'patient-uuid', workspaceTitle: 'Create Bill' });

    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'GCON');

    expect(screen.getByText('General Consultation')).toBeInTheDocument();
  });
});
