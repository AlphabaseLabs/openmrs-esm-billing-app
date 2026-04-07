import { navigate, showSnackbar, useConfig } from '@openmrs/esm-framework';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockBill, mockedActiveSheet, mockLineItems, mockPaymentModes } from '../../../__mocks__/bills.mock';
import { processBillPayment, usePaymentModes } from '../../billing.resource';
import { useClockInStatus } from '../../payment-points/use-clock-in-status';
import Payments from './payments.component';
import { type LineItem, type PaymentMethod } from '../../types';

const mockProcessBillPayment = processBillPayment as jest.MockedFunction<typeof processBillPayment>;
const mockUsePaymentModes = usePaymentModes as jest.MockedFunction<typeof usePaymentModes>;
const mockNavigate = navigate as jest.MockedFunction<typeof navigate>;
const mockShowSnackbar = showSnackbar as jest.MockedFunction<typeof showSnackbar>;
const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>;

jest.mock('@openmrs/esm-framework', () => ({
  ...jest.requireActual('@openmrs/esm-framework'),
  navigate: jest.fn(),
  showSnackbar: jest.fn(),
  useConfig: jest.fn(),
}));

jest.mock('../../billing.resource', () => ({
  processBillPayment: jest.fn(),
  usePaymentModes: jest.fn(),
}));

jest.mock('../../payment-points/use-clock-in-status');
const mockedUseClockInStatus = useClockInStatus as jest.Mock;

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

describe('Payment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConfig.mockReturnValue({
      paymentMethodTaxes: { enabled: false, paymentTypeTaxPercents: [] },
      defaultPaymentMethodName: 'Cash',
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
    mockProcessBillPayment.mockRejectedValueOnce(mockFieldErrorResponse);
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    mockedUseClockInStatus.mockReturnValue({
      globalActiveSheet: mockedActiveSheet,
      localActiveSheet: undefined,
      isClockedIn: true,
      error: null,
      isLoading: false,
      isClockedInCurrentPaymentPoint: false,
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={updatedMockLineItems} />);
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

    expect(mockProcessBillPayment).toHaveBeenCalledTimes(1);
    expect(mockProcessBillPayment).toHaveBeenCalledWith(
      {
        cashPoint: '65dd568e-4124-4e89-a4f8-0b07c58ec6fe',
        cashier: '48b55692-e061-4ffa-b1f2-fd4aaf506224',
        lineItems: [
          {
            billableService: 'c15d25b9-12bb-441d-9241-cae541dd4575',
            display: 'BillLineItem',
            item: 'c15d25b9-12bb-441d-9241-cae541dd4575',
            lineItemOrder: 0,
            order: {
              uuid: 'order-uuid-1',
              display: 'Medical Certificate',
              links: [],
              type: 'testorder',
            },
            paymentStatus: 'PENDING',
            price: 500,
            priceName: 'Default',
            priceUuid: '',
            quantity: 1,
            resourceVersion: '1.8',
            uuid: '314c25fd-2c90-4a7f-9f98-c99cd3f153e8',
            voidReason: null,
            voided: false,
            itemOrServiceConceptUuid: 'concept-uuid-1',
            serviceTypeUuid: 'servicetype-uuid-1',
          },
          {
            billableService: '04be5832-5440-44d0-83d2-5c0dfd0ac7de',
            display: 'BillLineItem',
            item: '04be5832-5440-44d0-83d2-5c0dfd0ac7de',
            lineItemOrder: 1,
            order: {
              uuid: 'order-uuid-1',
              display: 'Registration New',
              links: [],
              type: 'testorder',
            },
            paymentStatus: 'PENDING',
            price: 100,
            priceName: 'Default',
            priceUuid: '',
            quantity: 1,
            resourceVersion: '1.8',
            uuid: '60365e7e-d29e-4f13-b64b-9aecb5d36031',
            voidReason: null,
            voided: false,
            itemOrServiceConceptUuid: 'concept-uuid-1',
            serviceTypeUuid: 'servicetype-uuid-1',
          },
          {
            billableService: '3f5d0684-a280-477e-a67b-2a956a1f6dca',
            display: 'BillLineItem',
            item: '3f5d0684-a280-477e-a67b-2a956a1f6dca',
            lineItemOrder: 2,
            order: {
              uuid: 'order-uuid-1',
              display: 'Registration Revist',
              links: [],
              type: 'testorder',
            },
            paymentStatus: 'PENDING',
            price: 50,
            priceName: 'Default',
            priceUuid: '',
            quantity: 1,
            resourceVersion: '1.8',
            uuid: '006ee634-f1cf-4552-b751-f721679527af',
            voidReason: null,
            voided: false,
            itemOrServiceConceptUuid: 'concept-uuid-1',
            serviceTypeUuid: 'servicetype-uuid-1',
          },
          {
            billableService: 'Hemoglobin',
            display: 'BillLineItem',
            item: 'Hemoglobin',
            lineItemOrder: 0,
            paymentStatus: 'PENDING',
            price: 100,
            priceName: '',
            priceUuid: '',
            quantity: 1,
            resourceVersion: '1.8',
            uuid: '053ab483-79de-43f9-a73b-5823ccd8518b',
            voidReason: null,
            voided: false,
          },
        ],
        patient: 'b2fcf02b-7ee3-4d16-a48f-576be2b103aa',
        payments: [
          {
            amount: 100,
            amountTendered: 100,
            attributes: [
              {
                attributeType: 'd453e528-0264-4d6e-ae23-bc0b777e1146',
                value: 'MPESA123456',
              },
            ],
            instanceType: '28989582-e8c3-46b0-96d0-c249cb06d5c6',
          },
        ],
        status: 'PENDING',
      },
      '6eb8d678-514d-46ad-9554-51e48d96d567',
    );

    expect(mockShowSnackbar).toHaveBeenCalledWith({
      title: 'Bill payment failed',
      subtitle:
        'An unexpected error occurred while processing your bill payment. Please contact the system administrator and provide them with the following error details: Invalid Submission',
      kind: 'error',
      timeoutInMs: 3000,
      isLowContrast: true,
    });
  });

  test('should process payment with correct payload for payment method without attributes', async () => {
    const user = userEvent.setup();
    mockProcessBillPayment.mockResolvedValueOnce({} as any);
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    mockedUseClockInStatus.mockReturnValue({
      globalActiveSheet: mockedActiveSheet,
      localActiveSheet: undefined,
      isClockedIn: true,
      error: null,
      isLoading: false,
      isClockedInCurrentPaymentPoint: false,
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={updatedMockLineItems} />);
    await user.click(screen.getByRole('combobox', { name: /Payment method/i }));
    const cashOption = screen.getByRole('option', { name: /Cash/i });
    await user.click(cashOption);

    const amountInput = screen.getByRole('spinbutton', { name: /Amount/i });
    await user.type(amountInput, '100');

    const submitButton = screen.getByRole('button', { name: /Process Payment/i });
    await user.tab();
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    expect(mockProcessBillPayment).toHaveBeenCalledTimes(1);
    expect(mockProcessBillPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        payments: [
          {
            amount: 100,
            amountTendered: 100,
            attributes: [],
            instanceType: '63eff7a4-6f82-43c4-a333-dbcc58fe9f74',
          },
        ],
      }),
      '6eb8d678-514d-46ad-9554-51e48d96d567',
    );
  });

  test('should show a default payment row with cash preselected', () => {
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });
    mockedUseClockInStatus.mockReturnValue({
      globalActiveSheet: mockedActiveSheet,
      localActiveSheet: undefined,
      isClockedIn: true,
      error: null,
      isLoading: false,
      isClockedInCurrentPaymentPoint: false,
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={updatedMockLineItems} />);
    expect(screen.queryByRole('button', { name: /Add payment option/i })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Payment method/i })).toHaveTextContent(/Cash/i);
    expect(screen.getByRole('spinbutton', { name: /Amount/i })).toBeInTheDocument();
  });

  test('should preselect the configured default payment method on the bill payment form', () => {
    mockUseConfig.mockReturnValue({
      paymentMethodTaxes: { enabled: false, paymentTypeTaxPercents: [] },
      defaultPaymentMethodName: 'Mobile Money',
    } as any);
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });
    mockedUseClockInStatus.mockReturnValue({
      globalActiveSheet: mockedActiveSheet,
      localActiveSheet: undefined,
      isClockedIn: true,
      error: null,
      isLoading: false,
      isClockedInCurrentPaymentPoint: false,
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={updatedMockLineItems} />);

    expect(screen.getByRole('combobox', { name: /Payment method/i })).toHaveTextContent(/Mobile Money/i);
  });

  test('should not show incomplete payment before a line item is selected and payment amount is entered', () => {
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });

    mockedUseClockInStatus.mockReturnValue({
      globalActiveSheet: mockedActiveSheet,
      localActiveSheet: undefined,
      isClockedIn: true,
      error: null,
      isLoading: false,
      isClockedInCurrentPaymentPoint: false,
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={[]} />);

    expect(screen.queryByText(/Incomplete payment/i)).not.toBeInTheDocument();
  });

  test('should navigate back to home when the invoice was opened from home', async () => {
    const user = userEvent.setup();
    mockUsePaymentModes.mockReturnValue({
      paymentModes: updatedMockPaymentModes,
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });
    mockedUseClockInStatus.mockReturnValue({
      globalActiveSheet: mockedActiveSheet,
      localActiveSheet: undefined,
      isClockedIn: true,
      error: null,
      isLoading: false,
      isClockedInCurrentPaymentPoint: false,
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
    mockedUseClockInStatus.mockReturnValue({
      globalActiveSheet: mockedActiveSheet,
      localActiveSheet: undefined,
      isClockedIn: true,
      error: null,
      isLoading: false,
      isClockedInCurrentPaymentPoint: false,
    });

    render(<Payments bill={paymentBill as any} selectedLineItems={updatedMockLineItems} />);

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: `${window.getOpenmrsSpaBase()}home/billing`,
    });
  });
});
