export const paymentModes = [
  {
    uuid: 'payment-mode-cash',
    name: 'Cash',
    description: 'Cash',
    retired: false,
    retireReason: null,
    attributeTypes: [],
  },
  {
    uuid: 'payment-mode-card',
    name: 'Card',
    description: 'Card',
    retired: false,
    retireReason: null,
    attributeTypes: [
      {
        uuid: 'payment-reference-number',
        name: 'Reference Number',
        description: 'Reference Number',
        retired: false,
        required: false,
      },
    ],
  },
];

export const usePaymentModes = () => ({
  paymentModes,
  isLoading: false,
  error: null,
});

export const addPaymentToBill = async () => ({
  ok: true,
  data: {},
});

export const processBillPayment = async () => ({
  ok: true,
  data: {},
});
