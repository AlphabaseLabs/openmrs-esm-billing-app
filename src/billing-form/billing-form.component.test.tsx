import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BillingForm from './billing-form.component';
import useBillableServices from '../hooks/useBillableServices';
import { processBillItems } from '../billing.resource';
import { useAppointmentProviderOptions } from '../payment-points/payment-points.resource';

jest.mock('../hooks/useBillableServices');
jest.mock('../billing.resource', () => ({
  ...jest.requireActual('../billing.resource'),
  processBillItems: jest.fn(),
}));
jest.mock('../payment-points/payment-points.resource', () => ({
  useAppointmentProviderOptions: jest.fn(),
}));
jest.mock('../autosuggest/autosuggest.component', () => ({
  Autosuggest: ({ labelText, value, onClear, getSearchResults, getDisplayValue, onSuggestionSelected }: any) => {
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
            <li key={suggestion.uuid}>
              <button type="button" onClick={() => onSuggestionSelected('uuid', suggestion.uuid)}>
                {getDisplayValue(suggestion)}
              </button>
            </li>
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
      cashPointUuid: '54065383-b4d4-42d2-af4d-d250a1fd2590',
      cashierUuid: '65065383-b4d4-42d2-af4d-d250a1fd2590',
      defaultPaymentMethodName: 'Cash',
    })),
    usePatient: jest.fn(() => ({
      patient: { id: 'patient-uuid' },
      isLoading: false,
    })),
    useSession: jest.fn(() => ({
      currentProvider: {
        uuid: '75065383-b4d4-42d2-af4d-d250a1fd2590',
        display: 'Current Provider',
      },
    })),
  };
});

const mockUseBillableServices = useBillableServices as jest.MockedFunction<typeof useBillableServices>;
const mockProcessBillItems = processBillItems as jest.MockedFunction<typeof processBillItems>;
const mockUseAppointmentProviderOptions = useAppointmentProviderOptions as jest.MockedFunction<
  typeof useAppointmentProviderOptions
>;

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
    mockUseAppointmentProviderOptions.mockReturnValue({
      allProviderOptions: [
        {
          id: '75065383-b4d4-42d2-af4d-d250a1fd2590',
          uuid: '75065383-b4d4-42d2-af4d-d250a1fd2590',
          label: 'Current Provider',
        },
      ],
      providerOptions: [
        {
          id: '75065383-b4d4-42d2-af4d-d250a1fd2590',
          uuid: '75065383-b4d4-42d2-af4d-d250a1fd2590',
          label: 'Current Provider',
        },
      ],
      error: null,
      isLoading: false,
    });
    mockProcessBillItems.mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof processBillItems>>);
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

  it('assigns the current appointment-enabled provider to new line items', async () => {
    const user = userEvent.setup();

    mockUseBillableServices.mockReturnValue({
      billableServices: [
        {
          uuid: '85065383-b4d4-42d2-af4d-d250a1fd2590',
          name: 'General Consultation',
          shortName: 'GCON',
          serviceStatus: 'ENABLED',
          serviceType: { display: 'Consultation' },
          servicePrices: [
            {
              uuid: '95065383-b4d4-42d2-af4d-d250a1fd2590',
              name: 'Cash',
              price: 100,
              paymentMode: { name: 'Cash' },
            },
          ],
        },
      ],
      error: null,
      isLoading: false,
    } as ReturnType<typeof useBillableServices>);

    renderBillingForm({
      patientUuid: 'a5065383-b4d4-42d2-af4d-d250a1fd2590',
      workspaceTitle: 'Create Bill',
    });

    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'GCON');
    await user.click(screen.getByRole('button', { name: 'General Consultation' }));
    await user.click(screen.getByRole('button', { name: /save & close/i }));

    expect(mockProcessBillItems).toHaveBeenCalledWith(
      expect.objectContaining({
        lineItems: [
          expect.objectContaining({
            provider: '75065383-b4d4-42d2-af4d-d250a1fd2590',
          }),
        ],
      }),
    );
  });
});
