import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PaymentStatus } from '../../../types';
import { BillingHistoryFilters } from './billing-history-filters.component';
import { useBillingHistoryFilterContext } from '../useBillingHistoryFilterContext';
import { useBillingHistoryBills } from '../useBillingHistoryBills';
import { usePaymentModes } from '../../../billing.resource';
import { useTimeSheets } from '../../../payment-points/payment-points.resource';
import useSWR from 'swr';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('../useBillingHistoryFilterContext', () => ({
  useBillingHistoryFilterContext: jest.fn(),
}));

jest.mock('../useBillingHistoryBills', () => ({
  useBillingHistoryBills: jest.fn(),
}));

jest.mock('../../../billing.resource', () => ({
  usePaymentModes: jest.fn(),
}));

jest.mock('../../../payment-points/payment-points.resource', () => ({
  useTimeSheets: jest.fn(),
}));

jest.mock('swr', () => jest.fn());

jest.mock('@carbon/react', () => ({
  DatePicker: ({ children, onChange, value }: any) => {
    const firstChild = React.Children.toArray(children)[0] as React.ReactElement<{ id?: string }>;
    const inputId = firstChild?.props?.id;

    return (
      <div data-testid={`${inputId}-picker`} data-value={value instanceof Date ? value.toISOString() : ''}>
        {inputId === 'billing-history-start-date' ? (
          <button type="button" onClick={() => onChange([new Date('2026-04-04T00:00:00.000Z')])}>
            Set mock start date
          </button>
        ) : null}
        {inputId === 'billing-history-end-date' ? (
          <button type="button" onClick={() => onChange([new Date('2026-04-10T00:00:00.000Z')])}>
            Set mock end date
          </button>
        ) : null}
        {children}
      </div>
    );
  },
  DatePickerInput: ({ id, labelText, placeholder }: any) => (
    <label htmlFor={id}>
      {labelText}
      <input id={id} placeholder={placeholder} readOnly />
    </label>
  ),
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
  openmrsFetch: jest.fn(),
  restBaseUrl: '/ws/rest/v1',
  useDebounce: (value: string) => value,
}));

const mockUseBillingHistoryFilterContext = useBillingHistoryFilterContext as jest.Mock;
const mockUsePaymentModes = usePaymentModes as jest.Mock;
const mockUseBillingHistoryBills = useBillingHistoryBills as jest.Mock;
const mockUseTimeSheets = useTimeSheets as jest.Mock;
const mockUseSWR = useSWR as jest.Mock;

const mockSetAppliedFilters = jest.fn();
const mockSetAppliedTimesheet = jest.fn();
const mockSetDateRange = jest.fn();
const mockSetFilters = jest.fn();

describe('BillingHistoryFilters', () => {
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

    mockUseBillingHistoryFilterContext.mockReturnValue({
      dateRange: [new Date('2026-04-01T00:00:00.000Z'), new Date('2026-04-08T23:59:59.999Z')],
      setDateRange: mockSetDateRange,
      filters: {
        paymentMethods: [],
        cashiers: [],
        serviceTypes: [],
        billStatus: '',
        patientUuid: '',
      },
      setFilters: mockSetFilters,
      appliedTimesheet: undefined,
      setAppliedTimesheet: mockSetAppliedTimesheet,
      setAppliedFilters: mockSetAppliedFilters,
    });

    mockUseBillingHistoryBills.mockReturnValue({
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
    render(<BillingHistoryFilters />);

    expect(screen.getByLabelText('Date')).toHaveValue('custom');
  });

  it('keeps the start date field empty when the all preset is selected', () => {
    mockUseBillingHistoryFilterContext.mockReturnValue({
      dateRange: [new Date(0), new Date('2026-04-08T23:59:59.999Z')],
      setDateRange: mockSetDateRange,
      filters: {
        paymentMethods: [],
        cashiers: [],
        serviceTypes: [],
        billStatus: '',
        patientUuid: '',
      },
      setFilters: mockSetFilters,
      appliedTimesheet: undefined,
      setAppliedTimesheet: mockSetAppliedTimesheet,
      setAppliedFilters: mockSetAppliedFilters,
    });

    render(<BillingHistoryFilters />);

    expect(screen.getByLabelText('Date')).toHaveValue('all');
    expect(screen.getByTestId('billing-history-start-date-picker')).toHaveAttribute('data-value', '');
    expect(screen.getByTestId('billing-history-end-date-picker')).toHaveAttribute(
      'data-value',
      '2026-04-08T23:59:59.999Z',
    );
  });

  it('keeps the start date field empty when the current custom range still starts at unix epoch', () => {
    mockUseBillingHistoryFilterContext.mockReturnValue({
      dateRange: [new Date(0), new Date('2026-04-10T23:59:59.999Z')],
      setDateRange: mockSetDateRange,
      filters: {
        paymentMethods: [],
        cashiers: [],
        serviceTypes: [],
        billStatus: '',
        patientUuid: '',
      },
      setFilters: mockSetFilters,
      appliedTimesheet: undefined,
      setAppliedTimesheet: mockSetAppliedTimesheet,
      setAppliedFilters: mockSetAppliedFilters,
    });

    render(<BillingHistoryFilters />);

    expect(screen.getByLabelText('Date')).toHaveValue('custom');
    expect(screen.getByTestId('billing-history-start-date-picker')).toHaveAttribute('data-value', '');
    expect(screen.getByTestId('billing-history-end-date-picker')).toHaveAttribute(
      'data-value',
      '2026-04-10T23:59:59.999Z',
    );
  });

  it('applies the last month preset like the accounting app', () => {
    render(<BillingHistoryFilters />);

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: 'lastMonth' } });

    expect(mockSetDateRange).toHaveBeenCalledWith([
      new Date('2026-03-01T00:00:00.000Z'),
      new Date('2026-03-31T23:59:59.999Z'),
    ]);
  });

  it('applies the today preset', () => {
    render(<BillingHistoryFilters />);

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: 'today' } });

    expect(mockSetDateRange).toHaveBeenCalledWith([
      new Date('2026-04-08T00:00:00.000Z'),
      new Date('2026-04-08T23:59:59.999Z'),
    ]);
  });

  it('applies the yesterday preset', () => {
    render(<BillingHistoryFilters />);

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: 'yesterday' } });

    expect(mockSetDateRange).toHaveBeenCalledWith([
      new Date('2026-04-07T00:00:00.000Z'),
      new Date('2026-04-07T23:59:59.999Z'),
    ]);
  });

  it('applies the this week preset', () => {
    render(<BillingHistoryFilters />);

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: 'thisWeek' } });

    expect(mockSetDateRange).toHaveBeenCalledWith([
      new Date('2026-04-05T00:00:00.000Z'),
      new Date('2026-04-11T23:59:59.999Z'),
    ]);
  });

  it('uses the current date when custom date is selected from the preset dropdown', () => {
    mockUseBillingHistoryFilterContext.mockReturnValue({
      dateRange: [new Date(0), new Date('2026-04-08T23:59:59.999Z')],
      setDateRange: mockSetDateRange,
      filters: {
        paymentMethods: [],
        cashiers: [],
        serviceTypes: [],
        billStatus: '',
        patientUuid: '',
      },
      setFilters: mockSetFilters,
      appliedTimesheet: undefined,
      setAppliedTimesheet: mockSetAppliedTimesheet,
      setAppliedFilters: mockSetAppliedFilters,
    });

    render(<BillingHistoryFilters />);

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: 'custom' } });

    expect(mockSetDateRange).toHaveBeenCalledWith([
      new Date('2026-04-08T00:00:00.000Z'),
      new Date('2026-04-08T23:59:59.999Z'),
    ]);
  });

  it('keeps the existing end date when only the start date changes', () => {
    render(<BillingHistoryFilters />);

    fireEvent.click(screen.getByRole('button', { name: 'Set mock start date' }));

    expect(mockSetDateRange).toHaveBeenCalledWith([
      new Date('2026-04-04T00:00:00.000Z'),
      new Date('2026-04-08T23:59:59.999Z'),
    ]);
  });

  it('keeps the existing start date when only the end date changes', () => {
    render(<BillingHistoryFilters />);

    fireEvent.click(screen.getByRole('button', { name: 'Set mock end date' }));

    expect(mockSetDateRange).toHaveBeenCalledWith([
      new Date('2026-04-01T00:00:00.000Z'),
      new Date('2026-04-10T23:59:59.999Z'),
    ]);
  });

  it('applies the selected patient from the inline patient search', () => {
    render(<BillingHistoryFilters />);

    fireEvent.change(screen.getByLabelText('Patient'), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: /Jane Doe/i }));

    expect(mockSetFilters).toHaveBeenCalledWith({
      paymentMethods: [],
      cashiers: [],
      serviceTypes: [],
      billStatus: '',
      patientUuid: 'patient-uuid',
    });
  });

  it('defaults the bill status filter to all', () => {
    render(<BillingHistoryFilters />);

    expect(screen.getByLabelText('Bill Status')).toHaveValue('');
  });
});
