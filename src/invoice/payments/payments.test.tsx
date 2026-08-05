import { launchWorkspace2, navigate, openmrsFetch, showSnackbar, useConfig, useSession } from '@openmrs/esm-framework';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockBill, mockLineItems, mockPaymentModes } from '../../../__mocks__/bills.mock';
import { addPaymentToBill, usePaymentModes } from '../../billing.resource';
import { convertToCurrency } from '../../helpers';
import Payments from './payments.component';
import { type LineItem, type PaymentMethod, PaymentStatus } from '../../types';

const mockAddPaymentToBill = addPaymentToBill as jest.MockedFunction<typeof addPaymentToBill>;
const mockUsePaymentModes = usePaymentModes as jest.MockedFunction<typeof usePaymentModes>;
const mockLaunchWorkspace2 = launchWorkspace2 as jest.MockedFunction<typeof launchWorkspace2>;
const mockNavigate = navigate as jest.MockedFunction<typeof navigate>;
const mockOpenmrsFetch = openmrsFetch as jest.MockedFunction<typeof openmrsFetch>;
const mockShowSnackbar = showSnackbar as jest.MockedFunction<typeof showSnackbar>;
const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

jest.mock('@openmrs/esm-framework', () => ({
  ...jest.requireActual('@openmrs/esm-framework'),
  launchWorkspace2: jest.fn(),
  navigate: jest.fn(),
  openmrsFetch: jest.fn(),
  showSnackbar: jest.fn(),
  useConfig: jest.fn(),
  useSession: jest.fn(),
}));

jest.mock('../../billing.resource', () => ({
  addPaymentToBill: jest.fn(),
  usePaymentModes: jest.fn(),
}));

const updatedMockPaymentModes: PaymentMethod[] = mockPaymentModes.map((mode) => {
  const baseMode = {
    ...mode,
    retireReason: null,
    auditInfo: {
      dateCreated: '2024-01-01',
      creator: {
        uuid: 'user-1',
        display: 'Test User',
        links: [{ rel: 'self', uri: '/ws/rest/v1/user/user-1', resourceAlias: 'user' }],
      },
      dateChanged: null,
      changedBy: null,
    },
    sortOrder: null,
    resourceVersion: '1.8',
  };

  // Add attribute types for Mobile Money payment method
  if (mode.name === 'Mobile Money') {
    return {
      ...baseMode,
      attributeTypes: [
        {
          uuid: 'd453e528-0264-4d6e-ae23-bc0b777e1146',
          name: 'Reference Number',
          description: 'Reference Number',
          retired: false,
          attributeOrder: 0,
          format: 'java.lang.String',
          foreignKey: null,
          regExp: null,
          required: true,
        },
      ],
    };
  }

  return {
    ...baseMode,
    attributeTypes: mode.attributeTypes || [],
  };
});

// Update mockLineItems to include all required properties
const updatedMockLineItems: LineItem[] = mockLineItems.map((item) => ({
  ...item,
  itemOrServiceConceptUuid: 'concept-uuid-1',
  serviceTypeUuid: 'servicetype-uuid-1',
  order: {
    uuid: 'order-uuid-1',
    display: item.billableService.split(':')[1],
    links: [],
    type: 'testorder',
  },
}));

const paymentBill = {
  ...mockBill,
  balance: 100,
  totalAmountWithoutTaxAndDiscount: 100,
  totalDiscounts: 0,
  totalTax: 0,
  totalActualPayments: 0,
  totalDeposits: 0,
};

const normalizeWhitespace = (value: string) => value.replace(/\s/g, ' ');

const expectCurrencyValue = (amount: number) => {
  const expectedValue = normalizeWhitespace(convertToCurrency(amount));
  expect(screen.getByText((content) => normalizeWhitespace(content) === expectedValue)).toBeInTheDocument();
};

describe('Payment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConfig.mockReturnValue({
      aiAgentApiBaseUrl: '/ws/rest/v1/n8n/',
      paymentMethodTaxes: { enabled: false, paymentTypeTaxPercents: [] },
      defaultPaymentMethodName: 'Cash',
    } as any);
    mockUseSession.mockReturnValue({
      user: { uuid: 'user-1' },
    } as any);
  });

  test('should display error when posting payment fails', async () => {
    const user = userEvent.setup();
    const mockFieldErrorResponse = {
      responseBody: {
        error: {
          message: 'Invalid Submission',
          code: 'webservices.rest.error.invalid.submission',
          globalErrors: [],
          fieldErrors: {},
        },
      },
    };
    mockAddPaymentToBill.mockRejectedValueOnce(mockFieldErrorResponse);
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={[]} />);
    await user.click(screen.getByRole('combobox', { name: /Payment method/i }));
    const mobileMoneyOption = screen.getByRole('option', { name: /Mobile Money/i });
    await user.click(mobileMoneyOption);

    const amountInput = screen.getByRole('spinbutton', { name: /Amount/i });
    await user.type(amountInput, '100');

    // Fill in the reference number field for Mobile Money payment
    const referenceInput = screen.getByRole('textbox', { name: /Reference Number/i });
    await user.type(referenceInput, 'MPESA123456');

    const submitButton = screen.getByRole('button', { name: /Process Payment/i });
    await user.tab();
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    expect(mockAddPaymentToBill).toHaveBeenCalledTimes(1);
    expect(mockAddPaymentToBill).toHaveBeenCalledWith('6eb8d678-514d-46ad-9554-51e48d96d567', {
      amount: 100,
      amountTendered: 100,
      attributes: [
        {
          attributeType: 'd453e528-0264-4d6e-ae23-bc0b777e1146',
          value: 'MPESA123456',
        },
      ],
      instanceType: '28989582-e8c3-46b0-96d0-c249cb06d5c6',
    });

    expect(mockShowSnackbar).toHaveBeenCalledWith({
      title: 'Bill payment failed',
      subtitle:
        'An unexpected error occurred while processing your bill payment. Please contact the system administrator and provide them with the following error details: Invalid Submission',
      kind: 'error',
      timeoutInMs: 5000,
      isLowContrast: true,
    });
  });

  test('should process payment with correct payload for payment method without attributes', async () => {
    const user = userEvent.setup();
    mockAddPaymentToBill.mockResolvedValueOnce({} as any);
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={[]} />);
    await user.click(screen.getByRole('combobox', { name: /Payment method/i }));
    const cashOption = screen.getByRole('option', { name: /Cash/i });
    await user.click(cashOption);

    const amountInput = screen.getByRole('spinbutton', { name: /Amount/i });
    await user.type(amountInput, '100');

    const submitButton = screen.getByRole('button', { name: /Process Payment/i });
    await user.tab();
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    expect(mockAddPaymentToBill).toHaveBeenCalledTimes(1);
    expect(mockAddPaymentToBill).toHaveBeenCalledWith('6eb8d678-514d-46ad-9554-51e48d96d567', {
      amount: 100,
      amountTendered: 100,
      attributes: [],
      instanceType: '63eff7a4-6f82-43c4-a333-dbcc58fe9f74',
    });
  });

  test('should include allocations when selected line items are paid', async () => {
    const user = userEvent.setup();
    mockAddPaymentToBill.mockResolvedValueOnce({} as any);
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={[updatedMockLineItems[1]]} />);
    await user.click(screen.getByRole('combobox', { name: /Payment method/i }));
    const cashOption = screen.getByRole('option', { name: /Cash/i });
    await user.click(cashOption);

    const amountInput = screen.getByRole('spinbutton', { name: /Amount/i });
    await user.type(amountInput, '100');

    const submitButton = screen.getByRole('button', { name: /Process Payment/i });
    await user.tab();
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    expect(mockAddPaymentToBill).toHaveBeenCalledTimes(1);
    expect(mockAddPaymentToBill).toHaveBeenCalledWith('6eb8d678-514d-46ad-9554-51e48d96d567', {
      amount: 100,
      amountTendered: 100,
      attributes: [],
      instanceType: '63eff7a4-6f82-43c4-a333-dbcc58fe9f74',
      allocations: [
        {
          billLineItem: '60365e7e-d29e-4f13-b64b-9aecb5d36031',
          allocatedAmount: 100,
        },
      ],
    });
  });

  test('should show a default payment row with cash preselected', () => {
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={[]} />);
    expect(screen.queryByRole('button', { name: /Add payment option/i })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Payment method/i })).toHaveTextContent(/Cash/i);
    expect(screen.getByRole('spinbutton', { name: /Amount/i })).toBeInTheDocument();
  });

  test('should preselect the configured default payment method on the bill payment form', () => {
    mockUseConfig.mockReturnValue({
      aiAgentApiBaseUrl: '/ws/rest/v1/n8n/',
      paymentMethodTaxes: { enabled: false, paymentTypeTaxPercents: [] },
      defaultPaymentMethodName: 'Mobile Money',
    } as any);
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={[]} />);

    expect(screen.getByRole('combobox', { name: /Payment method/i })).toHaveTextContent(/Mobile Money/i);
  });

  test('should display payment summary with line-sourced Discounts and tax rows', () => {
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(
      <Payments
        bill={
          {
            ...paymentBill,
            totalAmount: 300,
            totalAmountWithoutTaxAndDiscount: 320,
            totalTax: 10,
            billLineItemDiscounts: 20,
            totalDiscounts: 20,
            totalActualPayments: 100,
            totalWaived: 25,
            balance: 150,
          } as any
        }
        selectedLineItems={[]}
      />,
    );

    expect(screen.getByText(/Total amount:/i)).toBeInTheDocument();
    expectCurrencyValue(300);
    expect(screen.getByText(/^Discounts:\s*$/)).toBeInTheDocument();
    expectCurrencyValue(20);
    expect(screen.getByText(/Tax:/i)).toBeInTheDocument();
    expectCurrencyValue(10);
    expect(screen.getByText(/Total tendered:/i)).toBeInTheDocument();
    expectCurrencyValue(100);
    expect(screen.getByText(/Amount due:/i)).toBeInTheDocument();
    expectCurrencyValue(150);
  });

  test('should hide the payment summary tax row when tax column visibility is off', () => {
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(
      <Payments
        bill={
          {
            ...paymentBill,
            totalAmount: 300,
            totalAmountWithoutTaxAndDiscount: 320,
            totalTax: 10,
            totalDiscounts: 20,
            totalActualPayments: 100,
            balance: 150,
          } as any
        }
        selectedLineItems={[]}
        showTaxSummary={false}
      />,
    );

    expect(screen.getByText(/Total amount:/i)).toBeInTheDocument();
    expectCurrencyValue(300);
    expect(screen.getByText(/^Discounts:\s*$/)).toBeInTheDocument();
    expectCurrencyValue(20);
    expect(screen.queryByText(/Tax:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Total tendered:/i)).toBeInTheDocument();
    expectCurrencyValue(100);
    expect(screen.getByText(/Amount due:/i)).toBeInTheDocument();
    expectCurrencyValue(150);
  });

  test('should validate payment amount against amount due', async () => {
    const user = userEvent.setup();
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(
      <Payments
        bill={
          {
            ...paymentBill,
            totalAmount: 300,
            totalDiscounts: 50,
            balance: 250,
          } as any
        }
        selectedLineItems={[]}
      />,
    );

    const amountInput = screen.getByRole('spinbutton', { name: /^Amount$/i });
    await user.type(amountInput, '251');

    expect(screen.getByText(/Over payment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Process Payment/i })).toBeDisabled();

    await user.clear(amountInput);
    await user.type(amountInput, '250');

    expect(screen.queryByText(/Over payment/i)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /Process Payment/i })).not.toBeDisabled());
  });

  test('should launch the AI payments workspace from the billing payment header', async () => {
    const user = userEvent.setup();
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={[]} />);

    await user.click(screen.getByRole('button', { name: /Open AI payments workspace/i }));

    expect(mockLaunchWorkspace2).toHaveBeenCalledTimes(1);
    expect(mockLaunchWorkspace2).toHaveBeenCalledWith(
      'ai-agent-payments-workspace',
      expect.objectContaining({
        currentInvoiceContext: {
          billUuid: paymentBill.uuid,
          patientUuid: paymentBill.patientUuid,
        },
        onAddPaymentDraft: expect.any(Function),
      }),
    );
  });

  test('should hide the AI payments workspace action for paid bills', () => {
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(
      <Payments
        bill={
          {
            ...paymentBill,
            status: PaymentStatus.PAID,
          } as any
        }
        selectedLineItems={updatedMockLineItems}
      />,
    );

    expect(screen.queryByRole('button', { name: /Open AI payments workspace/i })).not.toBeInTheDocument();
  });

  test('should process AI-linked payments and update the attachment after save', async () => {
    const user = userEvent.setup();
    mockAddPaymentToBill.mockResolvedValue({} as any);
    mockOpenmrsFetch.mockResolvedValue({ data: {} } as any);
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={[]} />);

    await user.click(screen.getByRole('button', { name: /Open AI payments workspace/i }));

    const workspaceProps = mockLaunchWorkspace2.mock.calls[0]?.[1] as {
      onAddPaymentDraft?: (draft: any) => Promise<void>;
    };

    await act(async () => {
      await workspaceProps.onAddPaymentDraft?.({
        invoice: {
          billUuid: paymentBill.uuid,
          patientUuid: paymentBill.patientUuid,
        },
        amount: 100,
        paymentMethodName: 'Mobile Money',
        referenceCode: 'AI-REF-1',
        sourceDocumentId: 'doc-1',
      });
    });

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /Payment method/i })).toHaveTextContent(/Mobile Money/i),
    );
    expect(screen.getByRole('spinbutton', { name: /Amount/i })).toHaveValue(100);
    expect(screen.getByRole('textbox', { name: /Reference number/i })).toHaveValue('AI-REF-1');

    const submitButton = screen.getByRole('button', { name: /Process Payment/i });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    expect(mockAddPaymentToBill).toHaveBeenCalledWith(paymentBill.uuid, {
      amount: 100,
      amountTendered: 100,
      attributes: [
        {
          attributeType: 'd453e528-0264-4d6e-ae23-bc0b777e1146',
          value: 'AI-REF-1',
        },
      ],
      instanceType: '28989582-e8c3-46b0-96d0-c249cb06d5c6',
    });

    expect(mockOpenmrsFetch).toHaveBeenCalledWith('/ws/rest/v1/n8n/ai-agent/attachment', {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: expect.objectContaining({
        id: 'doc-1',
        processing_status: 'processed',
        processed_by: 'user-1',
        emr_mapping: paymentBill.uuid,
        emr_mapping_type: 'bill',
      }),
    });
  });

  test('should not show incomplete payment before a line item is selected and payment amount is entered', () => {
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={[]} />);

    expect(screen.queryByText(/Incomplete payment/i)).not.toBeInTheDocument();
  });

  test('should validate selected edited paid lines against remaining amount due', async () => {
    const user = userEvent.setup();
    const editedPaidLineGap = {
      ...updatedMockLineItems[0],
      price: 220,
      quantity: 1,
      total: 220,
      totalAllocated: 150,
      paymentStatus: PaymentStatus.POSTED,
    };
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(
      <Payments
        bill={
          {
            ...paymentBill,
            balance: 70,
            lineItems: [editedPaidLineGap, updatedMockLineItems[1]],
          } as any
        }
        selectedLineItems={[editedPaidLineGap]}
      />,
    );

    await user.type(screen.getByRole('spinbutton', { name: /Amount/i }), '70');

    expect(screen.queryByText(/Incomplete payment/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Process Payment/i })).not.toBeDisabled();
  });

  test('should navigate back to home when the invoice was opened from home', async () => {
    const user = userEvent.setup();
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(
      <Payments
        bill={paymentBill as any}
        selectedLineItems={updatedMockLineItems}
        discardDestination={`${window.getOpenmrsSpaBase()}home`}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: `${window.getOpenmrsSpaBase()}home`,
    });
  });

  test('should navigate back to billing home by default', async () => {
    const user = userEvent.setup();
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={updatedMockLineItems} />);

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: `${window.getOpenmrsSpaBase()}home/billing`,
    });
  });
});
