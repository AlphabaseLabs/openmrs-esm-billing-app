import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BillingHeader from './billing-header.component';
import SelectedDateContext from '../hooks/selectedDateContext';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('./billing-illustration.component', () => () => <div>Billing illustration</div>);

jest.mock('@carbon/react', () => {
  const actual = jest.requireActual('@carbon/react');

  return {
    ...actual,
    DatePicker: ({ children }) => <div data-testid="date-picker">{children}</div>,
    DatePickerInput: ({ id, placeholder }) => <input id={id} placeholder={placeholder} readOnly />,
    IconButton: ({ children, label, onClick }: any) => (
      <button type="button" onClick={onClick} aria-label={label}>
        {children}
      </button>
    ),
  };
});

describe('BillingHeader', () => {
  it('shows the date filter and clears the selected date', async () => {
    const user = userEvent.setup();
    const setSelectedDate = jest.fn();

    render(
      <SelectedDateContext.Provider value={{ selectedDate: '2026-04-09T00:00:00.000Z', setSelectedDate }}>
        <BillingHeader title="Home" showDateFilter />
      </SelectedDateContext.Provider>,
    );

    expect(screen.getByTestId('date-picker')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear date filter/i }));

    expect(setSelectedDate).toHaveBeenCalledWith(null);
  });

  it('hides the date filter when it is not enabled', () => {
    render(
      <SelectedDateContext.Provider value={{ selectedDate: '2026-04-09T00:00:00.000Z', setSelectedDate: jest.fn() }}>
        <BillingHeader title="Invoice" />
      </SelectedDateContext.Provider>,
    );

    expect(screen.queryByTestId('date-picker')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clear date filter/i })).not.toBeInTheDocument();
  });
});
