import { summarizePaymentHistoryEntries } from './payment-history.utils';
import { type PaymentHistoryEntry } from './payment-history.utils';

const makeEntry = (overrides: Partial<PaymentHistoryEntry>): PaymentHistoryEntry => ({
  id: 'entry-1',
  billUuid: 'bill-1',
  paymentUuid: 'payment-1',
  patientUuid: 'patient-1',
  patientName: 'Jane Doe',
  identifier: 'ID-001',
  invoiceId: 'INV-001',
  paymentDate: '10-Apr-2026, 08:30 AM',
  paymentDateUnformatted: Date.parse('2026-04-10T08:30:00.000Z'),
  paymentAmount: 0,
  paymentMethod: 'Cash',
  referenceId: '--',
  ...overrides,
});

describe('summarizePaymentHistoryEntries', () => {
  it('aggregates total payments, cash, others, and top payee from payment entries', () => {
    const entries = [
      makeEntry({
        id: 'entry-1',
        paymentAmount: 100,
        paymentMethod: 'Cash',
        patientUuid: 'patient-1',
        patientName: 'Jane Doe',
      }),
      makeEntry({
        id: 'entry-2',
        paymentUuid: 'payment-2',
        paymentAmount: 75,
        paymentMethod: 'Card',
        patientUuid: 'patient-2',
        patientName: 'John Doe',
      }),
      makeEntry({
        id: 'entry-3',
        paymentUuid: 'payment-3',
        paymentAmount: 60,
        paymentMethod: 'Mobile Money',
        patientUuid: 'patient-2',
        patientName: 'John Doe',
      }),
    ];

    expect(summarizePaymentHistoryEntries(entries)).toEqual({
      totalPayments: 235,
      cash: 100,
      others: 135,
      topPayee: {
        name: 'John Doe',
        total: 135,
      },
      paymentMethodTotals: [
        { paymentMethod: 'Cash', total: 100 },
        { paymentMethod: 'Card', total: 75 },
        { paymentMethod: 'Mobile Money', total: 60 },
      ],
    });
  });
});
