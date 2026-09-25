import { renderHook, waitFor } from '@testing-library/react';
import { openmrsFetch } from '@openmrs/esm-framework';
import useSWR from 'swr';
import {
  mapBillProperties,
  updateBillNote,
  updatePaymentAttributes,
  useBill,
  useBills,
  useBillsPaginated,
} from './billing.resource';
import { PaymentStatus } from './types';

jest.mock('swr', () => jest.fn());

const mockUseSWR = useSWR as jest.Mock;
const mockOpenmrsFetch = openmrsFetch as jest.MockedFunction<typeof openmrsFetch>;

const baseInvoice = {
  id: 1,
  uuid: 'bill-uuid',
  display: 'BILL-1',
  voided: false,
  voidReason: null,
  adjustedBy: [],
  billAdjusted: null,
  cashPoint: {
    uuid: 'cash-point-uuid',
    name: 'Cashier',
    location: { display: 'Main location' },
  },
  cashier: {
    uuid: 'provider-uuid',
    display: 'admin - Cashier',
  },
  dateCreated: '2026-01-01T08:00:00.000+0000',
  patient: {
    uuid: 'patient-uuid',
    display: 'ABC123 - Test Patient',
  },
  receiptNumber: 'BILL-1',
  status: PaymentStatus.POSTED,
  adjustmentReason: null,
  note: 'Patient requested invoice note',
  resourceVersion: '1.8',
};

describe('mapBillProperties', () => {
  it.each(['SC-F8-9767 - Outdated name', undefined])(
    'uses structured patient fields when the display is %s',
    (display) => {
      const mappedBill = mapBillProperties({
        ...baseInvoice,
        patient: {
          uuid: 'patient-uuid',
          display,
          person: { personName: { display: 'Jane Anne-Doe' } },
          identifiers: [
            { identifier: 'OLD-123', preferred: false },
            { identifier: 'SC-F8-9767', preferred: true },
          ],
        },
      } as any);

      expect(mappedBill.patientName).toBe('Jane Anne-Doe');
      expect(mappedBill.identifier).toBe('SC-F8-9767');
    },
  );

  it('uses structured name parts and the primary identifier when available', () => {
    const mappedBill = mapBillProperties({
      ...baseInvoice,
      patient: {
        uuid: 'patient-uuid',
        person: { personName: { givenName: 'Jane', middleName: 'Mary', familyName: 'Anne-Doe' } },
        patientIdentifier: { identifier: 'SC-F8-9767' },
      },
    } as any);

    expect(mappedBill.patientName).toBe('Jane Mary Anne-Doe');
    expect(mappedBill.identifier).toBe('SC-F8-9767');
  });

  it('preserves hyphens in names and identifiers in older display-only responses', () => {
    const mappedBill = mapBillProperties({
      ...baseInvoice,
      patient: { uuid: 'patient-uuid', display: 'SC-F8-9767 - Jane Anne-Doe' },
    } as any);

    expect(mappedBill.patientName).toBe('Jane Anne-Doe');
    expect(mappedBill.identifier).toBe('SC-F8-9767');
  });

  it('handles a bill without a patient without parsing a missing display', () => {
    const mappedBill = mapBillProperties({ ...baseInvoice, patient: undefined } as any);

    expect(mappedBill.patientName).toBeUndefined();
    expect(mappedBill.identifier).toBeUndefined();
  });

  it('derives Discounts from line totals', () => {
    const mappedBill = mapBillProperties({
      ...baseInvoice,
      balance: 115,
      totalActualPayments: 100,
      totalDiscount: 20,
      totalTax: 10,
      totalWaivers: 25,
      lineItems: [
        {
          uuid: 'line-1',
          item: 'Consultation',
          quantity: 1,
          price: 200,
          discounts: [{ amount: 20 }],
          taxes: [{ amount: 10 }],
          total: 190,
          voided: false,
        },
        {
          uuid: 'line-2',
          item: 'Registration',
          quantity: 1,
          price: 100,
          discounts: [],
          taxes: [],
          total: 100,
          voided: false,
        },
      ],
      payments: [
        {
          amountTendered: 100,
          attributes: [],
          instanceType: { name: 'Cash' },
        },
      ],
    } as any);

    expect(mappedBill.totalAmount).toBe(290);
    expect(mappedBill.billLineItemDiscounts).toBe(20);
    expect(mappedBill.totalDiscounts).toBe(20);
    expect(mappedBill.totalWaived).toBe(25);
    expect(mappedBill.totalActualPayments).toBe(100);
    expect(mappedBill.tenderedAmount).toBe(100);
    expect(mappedBill.balance).toBe(115);
    expect(mappedBill.totalAmountWithoutTaxAndDiscount).toBe(300);
    expect(mappedBill.note).toBe('Patient requested invoice note');
  });

  it('defaults older bill responses to zero Discounts without requiring payments', () => {
    const mappedBill = mapBillProperties({
      ...baseInvoice,
      balance: 0,
      totalDiscount: 0,
      lineItems: [],
      payments: [],
    } as any);

    expect(mappedBill.totalDiscounts).toBe(0);
    expect(mappedBill.totalAmount).toBe(0);
    expect(mappedBill.tenderedAmount).toBe(0);
  });

  it('excludes voided line items and payments from mapped totals while retaining payment history rows', () => {
    const mappedBill = mapBillProperties({
      ...baseInvoice,
      balance: 0,
      totalActualPayments: 1099,
      totalDiscount: undefined,
      lineItems: [
        {
          uuid: 'active-line',
          item: 'Consultation',
          quantity: 1,
          price: 100,
          discounts: [],
          taxes: [],
          total: 100,
          voided: false,
        },
        {
          uuid: 'voided-line',
          item: 'Registration',
          quantity: 1,
          price: 999,
          discounts: [],
          taxes: [],
          total: 999,
          voided: true,
        },
      ],
      payments: [
        {
          uuid: 'active-payment',
          amountTendered: 100,
          attributes: [{ attributeType: { description: 'Reference Number' }, value: 'ACTIVE-REF' }],
          instanceType: { name: 'Cash' },
          voided: false,
        },
        {
          uuid: 'voided-payment',
          amountTendered: 999,
          attributes: [{ attributeType: { description: 'Reference Number' }, value: 'VOIDED-REF' }],
          instanceType: { name: 'Card' },
          voided: true,
        },
      ],
    } as any);

    expect(mappedBill.lineItems.map((item) => item.uuid)).toEqual(['active-line']);
    expect(mappedBill.payments.map((payment) => payment.uuid)).toEqual(['active-payment', 'voided-payment']);
    expect(mappedBill.totalAmount).toBe(100);
    expect(mappedBill.totalActualPayments).toBe(100);
    expect(mappedBill.totalPayments).toBe(100);
    expect(mappedBill.tenderedAmount).toBe(100);
    expect(mappedBill.referenceCodes).toBe('Cash: ACTIVE-REF');
  });
});

describe('bill list patient fields', () => {
  it.each([
    ['paginated', () => useBillsPaginated()],
    ['unpaginated', () => useBills()],
  ] as const)('requests and maps the patient name and identifier for the %s list', (_label, useList) => {
    mockUseSWR.mockReturnValue({
      data: {
        data: {
          results: [
            {
              ...baseInvoice,
              patient: {
                uuid: 'patient-uuid',
                display: 'SC-F8-9767 - Outdated name',
                person: { personName: { display: 'Jane Anne-Doe' } },
                patientIdentifier: { identifier: 'SC-F8-9767' },
              },
            },
          ],
          totalCount: 1,
        },
      },
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useList());
    const url = new URL(mockUseSWR.mock.calls[0][0], 'http://localhost');
    expect(url.searchParams.get('v')).toContain(
      'patient:(uuid,display,identifiers:(identifier,preferred),patientIdentifier:(identifier),person:(personName))',
    );
    expect(result.current.bills[0].patientName).toBe('Jane Anne-Doe');
    expect(result.current.bills[0].identifier).toBe('SC-F8-9767');
  });
});

describe('updateBillNote', () => {
  it.each([
    ['a note', 'a note'],
    ['a cleared note', null],
  ])('updates %s using the bill REST resource', async (_scenario, note) => {
    mockOpenmrsFetch.mockResolvedValueOnce({ ok: true } as Awaited<ReturnType<typeof openmrsFetch>>);

    await updateBillNote('bill-uuid', note);

    expect(mockOpenmrsFetch).toHaveBeenCalledWith('/ws/rest/v1/cashier/bill/bill-uuid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { note },
    });
  });
});

describe('updatePaymentAttributes', () => {
  it('updates attributes using the nested payment REST resource', async () => {
    const attributes = [{ uuid: 'attribute-uuid', attributeType: 'attribute-type-uuid', value: '6641' }];
    mockOpenmrsFetch.mockResolvedValueOnce({ ok: true } as Awaited<ReturnType<typeof openmrsFetch>>);

    await updatePaymentAttributes('bill-uuid', 'payment-uuid', attributes);

    expect(mockOpenmrsFetch).toHaveBeenCalledWith('/ws/rest/v1/cashier/bill/bill-uuid/payment/payment-uuid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { attributes },
    });
  });
});

describe('useBill', () => {
  beforeEach(() => {
    mockOpenmrsFetch.mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof openmrsFetch>>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockBill = (bill: { status: string; balance: number; closed: boolean }) => {
    mockUseSWR.mockReturnValue({
      data: {
        data: {
          uuid: 'bill-uuid',
          status: bill.status,
          balance: bill.balance,
          closed: bill.closed,
          patient: {
            uuid: 'patient-uuid',
            display: 'ABC123 - Test Patient',
          },
          lineItems: [],
          payments: [],
        },
      },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    });
  };

  it('syncs bill status for an open bill regardless of status and balance', async () => {
    mockBill({ status: 'PAID', balance: 171300, closed: false });

    renderHook(() => useBill('bill-uuid', { syncStatusWhenZeroBalance: true }));

    await waitFor(() =>
      expect(mockOpenmrsFetch).toHaveBeenCalledWith(
        expect.stringContaining('/cashier/bill/sync-status/bill-uuid'),
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });

  it('does not sync bill status when the bill is closed', async () => {
    mockBill({ status: 'PAID', balance: 171300, closed: true });

    renderHook(() => useBill('bill-uuid', { syncStatusWhenZeroBalance: true }));

    await waitFor(() => expect(mockOpenmrsFetch).not.toHaveBeenCalled());
  });
});
