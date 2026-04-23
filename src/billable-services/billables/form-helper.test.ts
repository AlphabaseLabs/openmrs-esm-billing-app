import { formatBillableServicePayloadForSubmission, mapInputToPayloadSchema } from './form-helper';

describe('form-helper', () => {
  test('maps existing service price uuids into form state for edit mode', () => {
    const formValues = mapInputToPayloadSchema({
      name: 'Consultation',
      shortName: 'Cons',
      serviceType: { uuid: 'service-type-uuid', display: 'Laboratory' },
      serviceStatus: 'ENABLED',
      concept: { uuid: 'concept-uuid', display: 'Consultation' },
      stockItem: null,
      servicePrices: [
        {
          uuid: 'service-price-uuid',
          price: 150,
          paymentMode: { uuid: 'payment-mode-uuid', name: 'Cash' },
        },
      ],
    });

    expect(formValues.servicePrices).toEqual([
      {
        uuid: 'service-price-uuid',
        price: 150,
        paymentMode: { uuid: 'payment-mode-uuid', name: 'Cash' },
      },
    ]);
  });

  test('includes service price uuids in the edit payload when present', () => {
    const payload = formatBillableServicePayloadForSubmission(
      {
        name: 'Consultation',
        shortName: 'Cons',
        serviceType: { uuid: 'service-type-uuid', display: 'Laboratory' },
        serviceStatus: 'ENABLED',
        concept: {
          concept: { uuid: 'concept-uuid', display: 'Consultation' },
          conceptName: { uuid: 'concept-name-uuid', display: 'Consultation' },
          display: 'Consultation',
        },
        serviceTax: null,
        stockItem: null,
        servicePrices: [
          {
            uuid: 'service-price-uuid',
            price: 150,
            paymentMode: { uuid: 'payment-mode-uuid', name: 'Cash' },
          },
        ],
      },
      'billable-service-uuid',
    );

    expect(payload.servicePrices).toEqual([
      {
        uuid: 'service-price-uuid',
        paymentMode: 'payment-mode-uuid',
        price: 150,
        name: 'Cash',
      },
    ]);
    expect(payload.uuid).toBe('billable-service-uuid');
  });
});
