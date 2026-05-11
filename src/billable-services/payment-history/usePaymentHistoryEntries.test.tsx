import { renderHook } from '@testing-library/react';
import { usePaymentHistoryEntries } from './usePaymentHistoryEntries';
import { useBillingHistoryFilterContext } from '../billing-history/useBillingHistoryFilterContext';
import { useBillingHistoryBills } from '../billing-history/useBillingHistoryBills';

jest.mock('../billing-history/useBillingHistoryFilterContext', () => ({
  useBillingHistoryFilterContext: jest.fn(),
}));

jest.mock('../billing-history/useBillingHistoryBills', () => ({
  useBillingHistoryBills: jest.fn(),
}));

const mockUseBillingHistoryFilterContext = useBillingHistoryFilterContext as jest.Mock;
const mockUseBillingHistoryBills = useBillingHistoryBills as jest.Mock;

describe('usePaymentHistoryEntries', () => {
  beforeEach(() => {
    mockUseBillingHistoryFilterContext.mockReturnValue({
      dateRange: [new Date('2026-04-10T00:00:00.000Z'), new Date('2026-04-10T23:59:59.999Z')],
    });
  });

  it('builds payment entries using payment dates even when bills were created earlier', () => {
    mockUseBillingHistoryBills.mockReturnValue({
      bills: [
        {
          uuid: 'older-bill',
          patientUuid: 'patient-1',
          patientName: 'Jane Doe',
          identifier: 'ID-001',
          receiptNumber: 'INV-001',
          cashier: { uuid: 'cashier-1' },
          lineItems: [
            {
              billableService: 'service-uuid:Consultation',
              serviceTypeUuid: 'service-type-1',
            },
          ],
          payments: [
            {
              uuid: 'payment-today',
              instanceType: { name: 'Cash' },
              attributes: [
                {
                  value: 'REF-001',
                  attributeType: { description: 'Reference Number' },
                },
              ],
              amountTendered: 1250,
              dateCreated: Date.parse('2026-04-10T08:30:00.000Z'),
              voided: false,
            },
            {
              uuid: 'payment-yesterday',
              instanceType: { name: 'Card' },
              attributes: [],
              amountTendered: 500,
              dateCreated: Date.parse('2026-04-09T08:30:00.000Z'),
              voided: false,
            },
          ],
          dateCreated: '01-Jan-2026, 08:00 AM',
          dateCreatedUnformatted: '2026-01-01T08:00:00.000Z',
          status: 'PAID',
        },
      ],
      isLoading: false,
      isValidating: false,
      error: null,
    });

    const { result } = renderHook(() =>
      usePaymentHistoryEntries({
        paymentMethods: [],
        cashiers: [],
        serviceTypes: [],
        billStatus: '',
        patientUuid: '',
      }),
    );

    expect(mockUseBillingHistoryBills).toHaveBeenCalledTimes(1);
    expect(mockUseBillingHistoryBills).toHaveBeenCalledWith(
      {
        paymentMethods: [],
        cashiers: [],
        serviceTypes: [],
        billStatus: '',
        patientUuid: '',
      },
      { dateFilterSource: 'payment' },
    );

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({
      id: 'older-bill-payment-today',
      billUuid: 'older-bill',
      patientUuid: 'patient-1',
      patientName: 'Jane Doe',
      identifier: 'ID-001',
      invoiceId: 'INV-001',
      paymentAmount: 1250,
      paymentMethod: 'Cash',
      referenceId: 'REF-001',
    });
  });
});
