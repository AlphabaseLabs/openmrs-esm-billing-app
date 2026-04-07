import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PaymentStatus } from '../../../types';
import { PaymentFilters } from './payment-filters.component';
import { usePaymentFilterContext } from '../usePaymentFilterContext';
import { usePaymentTransactionHistory } from '../usePaymentTransactionHistory';
import { usePaymentModes } from '../../../billing.resource';
import { useTimeSheets } from '../../../payment-points/payment-points.resource';
import useSWR from 'swr';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('../usePaymentFilterContext', () => ({
  usePaymentFilterContext: jest.fn(),
}));

jest.mock('../usePaymentTransactionHistory', () => ({
  usePaymentTransactionHistory: jest.fn(),
}));

jest.mock('../../../billing.resource', () => ({
  usePaymentModes: jest.fn(),
}));

jest.mock('../../../payment-points/payment-points.resource', () => ({
  useTimeSheets: jest.fn(),
}));

jest.mock('swr', () => jest.fn());

jest.mock('@carbon/react', () => ({
  Dropdown: ({ id, items, selectedItem, onChange, titleText }: any) => (
    <label htmlFor={id}>
      {titleText}
      <select
        id={id}
        value={selectedItem?.id}
        onChange={(event) =>
          onChange({
            selectedItem: items.find((item) => item.id === event.target.value),
          })
        }>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.text}
          </option>
        ))}
      </select>
    </label>
  ),
  MultiSelect: ({ id, items, selectedItems = [], onChange, titleText, label }: any) => (
    <label htmlFor={id}>
      {titleText ?? label}
      <select
        id={id}
        multiple
        value={selectedItems.map((item) => item.id)}
        onChange={(event) =>
          onChange({
            selectedItems: Array.from(event.target.selectedOptions)
              .map((option) => items.find((item) => item.id === option.value))
              .filter(Boolean),
          })
        }>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.text}
          </option>
        ))}
      </select>
    </label>
  ),
  Select: ({ id, value, onChange, labelText, children }: any) => (
    <label htmlFor={id}>
      {labelText}
      <select id={id} value={value} onChange={onChange}>
        {children}
      </select>
    </label>
  ),
  SelectItem: ({ value, text }: any) => <option value={value}>{text}</option>,
  Search: ({ id, labelText, value, onChange, onClear, placeholder }: any) => (
    <label htmlFor={id}>
      {labelText}
      <input id={id} type="search" value={value} placeholder={placeholder} onChange={onChange} />
      <button type="button" onClick={onClear}>
        Clear
      </button>
    </label>
  ),
  SkeletonIcon: ({ className }: any) => <div className={className}>Loading</div>,
}));

jest.mock('@openmrs/esm-framework', () => ({
  OpenmrsDateRangePicker: ({ labelText, onChange }: any) => (
    <button
      type="button"
      onClick={() => onChange([new Date('2026-04-02T00:00:00.000Z'), new Date('2026-04-09T00:00:00.000Z')])}>
      {labelText}
    </button>
  ),
  openmrsFetch: jest.fn(),
  restBaseUrl: '/ws/rest/v1',
  useDebounce: (value: string) => value,
}));

const mockUsePaymentFilterContext = usePaymentFilterContext as jest.Mock;
const mockUsePaymentModes = usePaymentModes as jest.Mock;
const mockUsePaymentTransactionHistory = usePaymentTransactionHistory as jest.Mock;
const mockUseTimeSheets = useTimeSheets as jest.Mock;
const mockUseSWR = useSWR as jest.Mock;

const mockSetAppliedFilters = jest.fn();
const mockSetAppliedTimesheet = jest.fn();
const mockSetDateRange = jest.fn();
const mockSetFilters = jest.fn();

describe('PaymentFilters', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-08T12:00:00.000Z'));
    mockSetAppliedFilters.mockClear();
    mockSetAppliedTimesheet.mockClear();
    mockSetDateRange.mockClear();
    mockSetFilters.mockClear();
    mockUseSWR.mockImplementation((key: string | null) => ({
      data: key
        ? {
            data: {
              results: [
                {
                  uuid: 'patient-uuid',
                  display: 'ID-001 - Jane Doe',
                  identifiers: [{ identifier: 'ID-001', preferred: true }],
                  patientIdentifier: { identifier: 'ID-001' },
                  person: {
                    personName: {
                      display: 'Jane Doe',
                      givenName: 'Jane',
                      middleName: '',
                      familyName: 'Doe',
                    },
                  },
                },
              ],
            },
          }
        : undefined,
      isLoading: false,
      error: null,
    }));

    mockUsePaymentFilterContext.mockReturnValue({
      dateRange: [new Date('2026-04-01T00:00:00.000Z'), new Date('2026-04-08T23:59:59.999Z')],
      setDateRange: mockSetDateRange,
      filters: {
        paymentMethods: [],
        cashiers: [],
        serviceTypes: [],
        billStatus: PaymentStatus.PAID,
        patientUuid: '',
      },
      setFilters: mockSetFilters,
      appliedTimesheet: undefined,
      setAppliedTimesheet: mockSetAppliedTimesheet,
      setAppliedFilters: mockSetAppliedFilters,
    });

    mockUsePaymentTransactionHistory.mockReturnValue({
      bills: [],
      isLoading: false,
      isValidating: false,
      error: null,
    });

    mockUsePaymentModes.mockReturnValue({
      paymentModes: [],
      isLoading: false,
    });

    mockUseTimeSheets.mockReturnValue({
      timesheets: [],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows custom date when the current range does not match a preset', () => {
    render(<PaymentFilters />);

    expect(screen.getByLabelText('Date')).toHaveValue('custom');
  });

  it('applies the last month preset like the accounting app', () => {
    render(<PaymentFilters />);

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: 'lastMonth' } });

    expect(mockSetDateRange).toHaveBeenCalledWith([
      new Date('2026-03-01T00:00:00.000Z'),
      new Date('2026-03-31T23:59:59.999Z'),
    ]);
  });

  it('applies a custom range from the recurring appointment picker', () => {
    render(<PaymentFilters />);

    fireEvent.click(screen.getByRole('button', { name: 'Set date range' }));

    expect(mockSetDateRange).toHaveBeenCalledWith([
      new Date('2026-04-02T00:00:00.000Z'),
      new Date('2026-04-09T23:59:59.999Z'),
    ]);
  });

  it('applies the selected patient from the inline patient search', () => {
    render(<PaymentFilters />);

    fireEvent.change(screen.getByLabelText('Patient'), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: /Jane Doe/i }));

    expect(mockSetFilters).toHaveBeenCalledWith({
      paymentMethods: [],
      cashiers: [],
      serviceTypes: [],
      billStatus: PaymentStatus.PAID,
      patientUuid: 'patient-uuid',
    });
  });
});
