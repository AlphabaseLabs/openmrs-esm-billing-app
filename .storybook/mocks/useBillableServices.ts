const billableServices = [
  {
    uuid: 'service-consultation',
    name: 'Consultation',
    shortName: 'Consultation',
    serviceStatus: 'ENABLED',
    serviceType: {
      display: 'Clinical service',
    },
    servicePrices: [
      {
        uuid: 'price-consultation',
        name: 'Default',
        price: 2000,
        paymentMode: 'Cash',
      },
    ],
  },
  {
    uuid: 'service-clear-aligner',
    name: 'Clear Aligner',
    shortName: 'Aligner',
    serviceStatus: 'ENABLED',
    serviceType: {
      display: 'Dental service',
    },
    servicePrices: [
      {
        uuid: 'price-clear-aligner',
        name: 'Cash',
        price: 249999,
        paymentMode: 'Cash',
      },
      {
        uuid: 'price-clear-aligner-card',
        name: 'Card',
        price: 259999,
        paymentMode: 'Card',
      },
      {
        uuid: 'price-clear-aligner-insurance',
        name: 'Insurance',
        price: 279999,
        paymentMode: 'Insurance',
      },
    ],
  },
  {
    uuid: 'service-registration',
    name: 'Registration',
    shortName: 'Registration',
    serviceStatus: 'ENABLED',
    serviceType: {
      display: 'Administrative service',
    },
    servicePrices: [
      {
        uuid: 'price-registration',
        name: 'Default',
        price: 2500,
        paymentMode: 'Cash',
      },
    ],
  },
];

export default function useBillableServices() {
  return {
    billableServices,
    error: undefined,
    isLoading: false,
  };
}
