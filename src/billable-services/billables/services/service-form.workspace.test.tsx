import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServiceForm from './service-form.workspace';
import {
  createBillableService,
  useConceptsSearch,
  useSalesTaxes,
  useServiceTypes,
} from '../../billable-service.resource';
import { usePaymentModes } from '../../../billing.resource';
import { showSnackbar, useConfig } from '@openmrs/esm-framework';
import useBillableServices from '../../../hooks/useBillableServices';

const mockUseConceptsSearch = useConceptsSearch as jest.MockedFunction<typeof useConceptsSearch>;
const mockUseSalesTaxes = useSalesTaxes as jest.MockedFunction<typeof useSalesTaxes>;
const mockUseServiceTypes = useServiceTypes as jest.MockedFunction<typeof useServiceTypes>;
const mockUsePaymentModes = usePaymentModes as jest.MockedFunction<typeof usePaymentModes>;
const mockCreateBillableService = createBillableService as jest.MockedFunction<typeof createBillableService>;
const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>;
const mockShowSnackbar = showSnackbar as jest.MockedFunction<typeof showSnackbar>;
const mockUseBillableServices = useBillableServices as jest.MockedFunction<typeof useBillableServices>;
const clinicalServiceConceptClassUuid = '0dcf23d4-3008-4d8e-b12c-4ec95d1cfd99';

const buildServiceConcept = ({
  uuid,
  display,
  shortName,
  conceptClassDisplay,
  conceptClassUuid,
}: {
  uuid: string;
  display: string;
  shortName?: string;
  conceptClassDisplay?: string;
  conceptClassUuid?: string;
}) => ({
  uuid,
  concept: {
    uuid,
    display,
    conceptClass: conceptClassDisplay ? { display: conceptClassDisplay, uuid: conceptClassUuid } : undefined,
    names: [
      {
        uuid: `${uuid}-full`,
        display,
        name: display,
        conceptNameType: { uuid: 'type-1', display: 'FULLY_SPECIFIED' },
      },
      ...(shortName
        ? [
            {
              uuid: `${uuid}-short`,
              display: shortName,
              name: shortName,
              conceptNameType: { uuid: 'type-2', display: 'SHORT' },
            },
          ]
        : []),
    ],
  },
  conceptName: {
    uuid: `${uuid}-name`,
    display,
    name: display,
    conceptNameType: { uuid: 'type-1', display: 'FULLY_SPECIFIED' },
  },
  display,
});

const mockerConcepts = {
  searchResults: [
    buildServiceConcept({
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      display: 'Consultation',
      conceptClassDisplay: 'Misc',
      conceptClassUuid: '8d491e50-c2cc-11de-8d13-0010c6dffd0f',
    }),
    buildServiceConcept({
      uuid: '123e4567-e89b-12d3-a456-426614174002',
      display: 'Laboratory Test',
      conceptClassDisplay: 'Test',
      conceptClassUuid: '8d491e50-c2cc-11de-8d13-0010c6dffd0f',
    }),
  ],
  error: null,
  isSearching: false,
};

const mockServiceTypes = {
  serviceTypes: [
    {
      uuid: 'd7bd4cc0-90b1-4f22-90f2-ab7fde936728',
      display: 'Laboratory',
      id: 1,
    },
    {
      uuid: 'd7bd4cc0-90b1-4f22-90f2-ab7fde936729',
      display: 'Pharmacy',
      id: 2,
    },
    {
      uuid: 'd7bd4cc0-90b1-4f22-90f2-ab7fde936730',
      display: 'Surgical',
      id: 3,
    },
  ],
  error: null,
  isLoading: false,
};

const mockPaymentModes = {
  paymentModes: [
    {
      uuid: 'd7bd4cc0-90b1-4f22-90f2-ab7fde936731',
      name: 'Cash',
      description: 'Cash payment',
      retired: false,
      retireReason: null,
      auditInfo: {
        creator: {
          uuid: '1',
          display: 'Admin',
          links: [{ rel: 'self', uri: 'http://localhost:8080/openmrs/ws/rest/v1/user/1', resourceAlias: 'user' }],
        },
        dateCreated: '2024-01-01',
        changedBy: null,
        dateChanged: null,
      },
      attributeTypes: [],
      sortOrder: null,
      resourceVersion: '1.8',
    },
    {
      uuid: 'd7bd4cc0-90b1-4f22-90f2-ab7fde936732',
      name: 'Insurance',
      description: 'Insurance payment',
      retired: false,
      retireReason: null,
      auditInfo: {
        creator: {
          uuid: '1',
          display: 'Admin',
          links: [{ rel: 'self', uri: 'http://localhost:8080/openmrs/ws/rest/v1/user/1', resourceAlias: 'user' }],
        },
        dateCreated: '2024-01-01',
        changedBy: null,
        dateChanged: null,
      },
      attributeTypes: [],
      sortOrder: null,
      resourceVersion: '1.8',
    },
    {
      uuid: 'd7bd4cc0-90b1-4f22-90f2-ab7fde936733',
      name: 'Waiver',
      description: 'Payment waiver',
      retired: false,
      retireReason: null,
      auditInfo: {
        creator: {
          uuid: '1',
          display: 'Admin',
          links: [{ rel: 'self', uri: 'http://localhost:8080/openmrs/ws/rest/v1/user/1', resourceAlias: 'user' }],
        },
        dateCreated: '2024-01-01',
        changedBy: null,
        dateChanged: null,
      },
      attributeTypes: [],
      sortOrder: null,
      resourceVersion: '1.8',
    },
  ],
  isLoading: false,
  error: null,
  mutate: jest.fn(),
};

jest.mock('../../billable-service.resource', () => ({
  useConceptsSearch: jest.fn(),
  useSalesTaxes: jest.fn(),
  useServiceTypes: jest.fn(),
  createBillableService: jest.fn(),
}));

jest.mock('../../../billing.resource', () => ({
  usePaymentModes: jest.fn(),
}));

jest.mock('../../../hooks/useBillableServices', () => jest.fn());

jest.mock('@openmrs/esm-framework', () => {
  const actual = jest.requireActual('@openmrs/esm-framework');

  return {
    ...actual,
    useConfig: jest.fn(() => ({
      chargeServiceFormUseClinicalServiceConcepts: false,
    })),
    showSnackbar: jest.fn(),
  };
});

const defaultProps = {
  closeWorkspace: jest.fn(),
  launchChildWorkspace: jest.fn(),
  workspaceProps: {},
  windowProps: {},
  groupProps: {},
  overlay: true,
  isOpen: true,
  isPinned: false,
} as any;

const mockBillingConfig = (chargeServiceFormUseClinicalServiceConcepts: boolean) =>
  ({
    chargeServiceFormUseClinicalServiceConcepts,
    concepts: {
      chargeServiceConceptClassUuid: clinicalServiceConceptClassUuid,
    },
  }) as any;

const setupCommonFormMocks = () => {
  mockUseSalesTaxes.mockReturnValue({
    salesTaxes: [],
    isLoading: false,
    error: null,
  });
  mockUseServiceTypes.mockReturnValue(mockServiceTypes);
  mockUsePaymentModes.mockReturnValue(mockPaymentModes);
  mockUseBillableServices.mockReturnValue({
    billableServices: [],
    error: null,
    isLoading: false,
  });
};

const fillLegacyServiceForm = async (user: ReturnType<typeof userEvent.setup>, container: HTMLElement) => {
  await user.type(screen.getByLabelText('Service name'), 'Consultation');
  await user.type(screen.getByLabelText('Service short name'), 'CONS');
  await user.type(screen.getByPlaceholderText('Search for concept'), 'Consultation');

  expect(container.querySelector('.searchResults')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Consultation' }));
  await user.click(screen.getAllByRole('button', { name: 'Open' })[0]);
  await user.click((await screen.findAllByRole('option', { name: 'Laboratory' }))[0]);
  await user.click(screen.getByRole('button', { name: 'Add payment method' }));
  await user.click(screen.getAllByRole('button', { name: 'Open' }).at(-1)!);
  await user.click((await screen.findAllByRole('option', { name: 'Cash' }))[0]);
  await user.type(screen.getByRole('spinbutton', { name: 'Price' }), '100');
};

describe('ServiceForm', () => {
  beforeEach(() => {
    mockUseConfig.mockReturnValue(mockBillingConfig(false));
    mockShowSnackbar.mockClear();
    mockCreateBillableService.mockReset();
  });

  test('should render billiable service form and submit successfully', async () => {
    const user = userEvent.setup();
    mockUseConceptsSearch.mockReturnValue(mockerConcepts);
    setupCommonFormMocks();
    const { container } = render(<ServiceForm {...defaultProps} />);

    // should render all the form fields
    const serviceNameInput = screen.getByLabelText('Service name');
    const serviceShortNameInput = screen.getByLabelText('Service short name');
    const serviceTypeSelect = screen.getByPlaceholderText('Select service type');
    const serviceConceptInput = screen.getByPlaceholderText('Search for concept');
    const addPaymentMethodButton = screen.getByRole('button', { name: 'Add payment method' });

    // user should be able to type in service name, short name, concept and service type
    await user.type(serviceNameInput, 'Test Service');
    await user.type(serviceShortNameInput, 'TS');
    await user.type(serviceConceptInput, 'Consultation');

    const searchResults = container.querySelector('.searchResults');
    expect(searchResults).toBeInTheDocument();

    const firstSearchResultItem = screen.getByRole('button', { name: 'Consultation' });
    await user.click(firstSearchResultItem);

    expect(serviceConceptInput).toHaveValue('Consultation');

    const serviceTypeOpenButton = screen.getAllByRole('button', { name: 'Open' })[0];
    await user.click(serviceTypeOpenButton);

    const serviceTypeOption = (await screen.findAllByRole('option', { name: 'Laboratory' }))[0];
    await user.click(serviceTypeOption);

    expect(serviceTypeSelect).toHaveValue('Laboratory');

    // user should be able to add payment method and remove it
    await user.click(addPaymentMethodButton);
    const paymentMethodOpenButton = screen.getAllByRole('button', { name: 'Open' }).at(-1)!;
    await user.click(paymentMethodOpenButton);
    const paymentMethodOption = (await screen.findAllByRole('option', { name: 'Cash' }))[0];
    await user.click(paymentMethodOption);

    // add price
    const priceInput = screen.getByRole('spinbutton', { name: 'Price' });
    await user.type(priceInput, '100');

    const saveAndCloseButton = screen.getByRole('button', { name: 'Save & close' });
    await user.click(saveAndCloseButton);

    expect(mockCreateBillableService).toHaveBeenCalledWith(
      {
        concept: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Service',
        servicePrices: [{ name: 'Cash', paymentMode: 'd7bd4cc0-90b1-4f22-90f2-ab7fde936731', price: 100 }],
        serviceStatus: 'ENABLED',
        serviceType: 'd7bd4cc0-90b1-4f22-90f2-ab7fde936728',
        shortName: 'TS',
        stockItem: null,
      },
      undefined,
    );
  });

  test('should use clinical services concepts when configurable mode is enabled', async () => {
    const user = userEvent.setup();
    mockUseConfig.mockReturnValue(mockBillingConfig(true));
    mockUseConceptsSearch.mockReturnValue({
      searchResults: [
        buildServiceConcept({
          uuid: '123e4567-e89b-12d3-a456-426614174000',
          display: 'Consultation',
          shortName: 'CONS',
          conceptClassDisplay: 'Clinical Services',
          conceptClassUuid: clinicalServiceConceptClassUuid,
        }),
        buildServiceConcept({
          uuid: '123e4567-e89b-12d3-a456-426614174010',
          display: 'Procedure Follow Up',
          shortName: 'PFU',
          conceptClassDisplay: 'Clinical Services',
          conceptClassUuid: clinicalServiceConceptClassUuid,
        }),
      ],
      error: null,
      isSearching: false,
    });
    setupCommonFormMocks();

    render(<ServiceForm {...defaultProps} />);

    expect(screen.queryByText('Service Concept')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Service concept' })).toBeInTheDocument();
    const serviceShortNameInput = screen.getByLabelText('Service short name');
    expect(serviceShortNameInput).toHaveAttribute('readonly');

    const serviceNameInput = screen.getByLabelText('Service name');
    expect(serviceNameInput).toHaveValue('');

    const servicePicker = screen.getByRole('combobox', { name: 'Service concept' });
    await user.click(servicePicker);

    expect(await screen.findByText('Consultation')).toBeInTheDocument();
    expect(screen.getByText('Procedure Follow Up')).toBeInTheDocument();

    await user.type(servicePicker, 'Consult');

    const serviceOption = await screen.findByText('Consultation');
    await user.click(serviceOption);

    expect(serviceNameInput).toHaveValue('Consultation');
    expect(screen.getByLabelText('Service short name')).toHaveValue('CONS');
    await user.clear(serviceNameInput);
    await user.type(serviceNameInput, 'Custom Consultation');
    expect(serviceNameInput).toHaveValue('Custom Consultation');
    expect(screen.getByLabelText('Service short name')).toHaveValue('CONS');
  });

  test('should keep the existing service name on edit and derive short name from the concept', async () => {
    mockUseConfig.mockReturnValue(mockBillingConfig(true));
    mockUseConceptsSearch.mockReturnValue({
      searchResults: [
        buildServiceConcept({
          uuid: '123e4567-e89b-12d3-a456-426614174000',
          display: 'Consultation',
          shortName: 'CONS',
          conceptClassDisplay: 'Clinical Services',
          conceptClassUuid: clinicalServiceConceptClassUuid,
        }),
      ],
      error: null,
      isSearching: false,
    });
    setupCommonFormMocks();

    render(
      <ServiceForm
        {...defaultProps}
        workspaceProps={{
          initialValues: {
            uuid: 'service-1',
            name: 'Custom Consultation Service',
            shortName: 'OLD',
            serviceStatus: 'ENABLED',
            serviceType: {
              uuid: 'd7bd4cc0-90b1-4f22-90f2-ab7fde936728',
              display: 'Laboratory',
            },
            servicePrices: [],
            concept: {
              uuid: '123e4567-e89b-12d3-a456-426614174000',
              display: 'Consultation',
            },
          },
        }}
      />,
    );

    expect(screen.getByLabelText('Service name')).toHaveValue('Custom Consultation Service');
    await waitFor(() => expect(screen.getByLabelText('Service short name')).toHaveValue('CONS'));
    expect(screen.getByRole('combobox', { name: 'Service concept' })).toHaveValue('Consultation');
  });

  test('should show duplicate service name error on the name field', async () => {
    const user = userEvent.setup();
    mockUseConfig.mockReturnValue(mockBillingConfig(true));
    mockUseConceptsSearch.mockReturnValue({
      searchResults: [
        buildServiceConcept({
          uuid: '123e4567-e89b-12d3-a456-426614174000',
          display: 'Consultation',
          shortName: 'CONS',
          conceptClassDisplay: 'Clinical Services',
          conceptClassUuid: clinicalServiceConceptClassUuid,
        }),
      ],
      error: null,
      isSearching: false,
    });
    setupCommonFormMocks();
    mockUseBillableServices.mockReturnValue({
      billableServices: [{ uuid: 'existing-service', name: 'Consultation' }] as any,
      error: null,
      isLoading: false,
    });

    render(<ServiceForm {...defaultProps} />);

    const servicePicker = screen.getByRole('combobox', { name: 'Service concept' });
    await user.type(servicePicker, 'Consult');
    await user.click(await screen.findByText('Consultation'));

    expect(await screen.findByText('A service with this name already exists.')).toBeInTheDocument();
  });

  test('should show backend duplicate service error message', async () => {
    const user = userEvent.setup();
    mockUseConceptsSearch.mockReturnValue(mockerConcepts);
    setupCommonFormMocks();
    mockCreateBillableService.mockRejectedValue({
      responseBody: {
        error: {
          message:
            "The Resource Does not Support the Requested Operation [Cannot update billable service. Another service with name 'Consultation' already exists (UUID: 4276776c-b56f-4fd1-8b83-8c66be234f34). Please use a different name.]",
        },
      },
    });

    const { container } = render(<ServiceForm {...defaultProps} />);
    await fillLegacyServiceForm(user, container);
    await user.click(screen.getByRole('button', { name: 'Save & close' }));

    expect(mockShowSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'error',
        subtitle: 'The service creation failed: A service with this name already exists.',
      }),
    );
  });
});
