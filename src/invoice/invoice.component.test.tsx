import React from 'react';
import { render } from '@testing-library/react';
import { ExtensionSlot, usePatient } from '@openmrs/esm-framework';
import { useBill } from '../billing.resource';
import Invoice from './invoice.component';

jest.mock('@openmrs/esm-framework', () => ({
  ...jest.requireActual('@openmrs/esm-framework'),
  ExtensionSlot: jest.fn(() => null),
  usePatient: jest.fn(),
}));

jest.mock('../billing.resource', () => ({
  ...jest.requireActual('../billing.resource'),
  useBill: jest.fn(),
}));

jest.mock('./bill-details.component', () => jest.fn(() => null));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(() => ({ search: '' })),
  useParams: jest.fn(() => ({ patientUuid: 'patient-uuid', billUuid: 'bill-uuid' })),
}));

const mockedUsePatient = jest.mocked(usePatient);
const mockedUseBill = jest.mocked(useBill);
const mockedExtensionSlot = jest.mocked(ExtensionSlot);

describe('Invoice', () => {
  beforeEach(() => {
    mockedUsePatient.mockReturnValue({
      patient: { id: 'patient-uuid' },
      isLoading: false,
      error: null,
    } as any);
    mockedExtensionSlot.mockClear();
    mockedUseBill.mockReturnValue({
      bill: {
        uuid: 'bill-uuid',
        status: 'PENDING',
        balance: 100,
        lineItems: [],
        payments: [],
      },
      isLoading: false,
      error: null,
      isValidating: false,
      mutate: jest.fn(),
    } as any);
  });

  test('opts into shared bill-status sync when loading invoice data', () => {
    render(<Invoice showPatientHeader={false} />);

    expect(mockedUseBill).toHaveBeenCalledWith('bill-uuid', {
      syncStatusWhenZeroBalance: true,
    });
  });

  test('renders the patient header slot when requested', () => {
    render(<Invoice />);

    expect(mockedExtensionSlot).toHaveBeenCalled();
  });
});
