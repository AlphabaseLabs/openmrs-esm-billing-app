import { renderHook } from '@testing-library/react';
import { usePaymentHistoryEntries } from './usePaymentHistoryEntries';
import { useBillingHistoryFilterContext } from '../billing-history/useBillingHistoryFilterContext';
import { usePaymentHistoryList } from '../billing-history/history.resource';

jest.mock('../billing-history/useBillingHistoryFilterContext', () => ({
  useBillingHistoryFilterContext: jest.fn(),
}));

jest.mock('../billing-history/history.resource', () => ({
  usePaymentHistoryList: jest.fn(),
  fetchPaymentHistoryForExport: jest.fn(),
}));

const mockUseBillingHistoryFilterContext = useBillingHistoryFilterContext as jest.Mock;
const mockUsePaymentHistoryList = usePaymentHistoryList as jest.Mock;

describe('usePaymentHistoryEntries', () => {
  beforeEach(() => {
    mockUseBillingHistoryFilterContext.mockReturnValue({
      dateRange: [new Date('2026-04-10T00:00:00.000Z'), new Date('2026-04-10T23:59:59.999Z')],
    });
  });

  it('uses the server-side payment history list for the active filter range', () => {
    mockUsePaymentHistoryList.mockReturnValue({
      entries: [
        {
          id: 'payment-today',
          paymentUuid: 'payment-today',
          billUuid: 'older-bill',
          patientUuid: 'patient-1',
          patientName: 'Jane Doe',
          identifier: 'ID-001',
          invoiceId: 'INV-001',
          paymentDate: '10-Apr-2026, 01:30 PM',
          paymentDateUnformatted: Date.parse('2026-04-10T08:30:00.000Z'),
          paymentAmount: 1250,
          paymentMethod: 'Cash',
          referenceId: 'REF-001',
        },
      ],
      totalCount: 1,
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

    expect(mockUsePaymentHistoryList).toHaveBeenCalledTimes(1);
    expect(mockUsePaymentHistoryList).toHaveBeenCalledWith({
      filters: {
        paymentMethods: [],
        cashiers: [],
        serviceTypes: [],
        billStatus: '',
        patientUuid: '',
      },
      dateRange: [new Date('2026-04-10T00:00:00.000Z'), new Date('2026-04-10T23:59:59.999Z')],
      page: 1,
      pageSize: 10,
      timesheetUuid: undefined,
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({
      id: 'payment-today',
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
