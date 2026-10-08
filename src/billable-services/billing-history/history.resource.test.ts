import { renderHook } from '@testing-library/react';
import useSWR from 'swr';
import { usePaymentHistoryList } from './history.resource';

jest.mock('swr', () => jest.fn());

const mockUseSWR = useSWR as jest.Mock;

describe('payment history reviewed payments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests review statuses and maps review metadata', () => {
    mockUseSWR.mockReturnValue({
      data: {
        data: {
          results: [
            {
              uuid: 'request-1',
              billUuid: 'bill-1',
              paymentDate: '2026-01-01T00:00:00.000Z',
              paymentAmount: 300,
              paymentMethod: 'Insurance',
              referenceId: 'POLICY-1',
              reviewStatus: 'PENDING',
              source: 'PENDING_PAYMENT',
            },
          ],
          length: 1,
        },
      },
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() =>
      usePaymentHistoryList({
        filters: { reviewStatuses: ['PENDING', 'REJECTED'] },
        dateRange: [new Date('2026-01-01T00:00:00.000Z'), new Date('2026-01-31T23:59:59.999Z')],
      }),
    );

    const requestUrl = new URL(mockUseSWR.mock.calls[0][0], 'http://localhost');
    expect(requestUrl.searchParams.get('reviewStatuses')).toBe('PENDING,REJECTED');
    expect(decodeURIComponent(requestUrl.searchParams.get('v') ?? '')).toContain('reviewStatus,source');
    expect(result.current.entries[0]).toMatchObject({
      id: 'request-1',
      reviewStatus: 'PENDING',
      source: 'PENDING_PAYMENT',
      paymentAmount: 300,
    });
  });
});
