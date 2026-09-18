import { isAvailableForAppointments, type ProviderResponse } from './payment-points.resource';

const provider = (value: unknown, name = 'Available for appointments'): ProviderResponse => ({
  uuid: 'provider-1',
  retired: false,
  person: { uuid: 'person-1', display: 'Dr One' },
  attributes: [{ value, attributeType: { name } }],
});

describe('appointment provider eligibility', () => {
  it('includes only active providers with Available for appointments set to true', () => {
    expect(isAvailableForAppointments(provider(true))).toBe(true);
    expect(isAvailableForAppointments(provider('true'))).toBe(true);
    expect(isAvailableForAppointments(provider(false))).toBe(false);
    expect(isAvailableForAppointments(provider(true, 'Shares'))).toBe(false);
    expect(isAvailableForAppointments({ ...provider(true), retired: true })).toBe(false);
    expect(isAvailableForAppointments({ ...provider(true), retired: undefined })).toBe(false);
  });
});
