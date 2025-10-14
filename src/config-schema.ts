import { type ConfigSchema, Type } from '@openmrs/esm-framework';

export interface BillingConfig {
  enforceBillPayment: boolean;
  localeCurrencyMapping: Record<string, string>;
  promptDuration: {
    enable: boolean;
    duration: number;
  };
  patientBillsUrl: string;
  billingStatusQueryUrl: string;
  excludedPaymentMode: Array<{ uuid: string; label: string }>;
  inPatientVisitTypeUuid: string;
  paymentMethodsUuidsThatShouldNotShowPrompt: Array<string>;
  cashPointUuid: string;
  cashierUuid: string;
  insuranceSchemes: Array<string>;
  visitAttributeTypes: {
    isPatientExempted: string;
    paymentMethods: string;
    insuranceScheme: string;
    policyNumber: string;
    exemptionCategory: string;
    billPaymentStatus: string;
    shaBenefitPackagesAndInterventions: string;
  };
  patientExemptionCategories: Array<{ value: string; label: string }>;
  insurancePaymentMethod: string;
  mobileMoneyPaymentModeUUID: string;
  concepts: {
    emergencyPriorityConceptUuid: string;
    serviceConceptSetUuid: string;
  };
}

export const configSchema: ConfigSchema = {
  enforceBillPayment: {
    _type: Type.Boolean,
    _default: false,
    _description: 'Whether to enforce bill payment or not for patient to receive service',
  },
  localeCurrencyMapping: {
    _type: Type.Object,
    _description: 'Mapping of locale codes to currency codes for internationalization',
    _default: {
      en: 'PKR',
      'en-PK': 'PKR',
    },
  },
  promptDuration: {
    _type: Type.Object,
    _description:
      'The duration in hours for the bill payment prompt to show on patient chart, if the duration is less than this, the prompt will not be shown',
    _default: {
      enable: false,
      duration: 24,
    },
  },
  patientBillsUrl: {
    _type: Type.String,
    _description: 'The url to fetch patient bills',
    _default:
      '${restBaseUrl}/cashier/bill?v=custom:(uuid,display,voided,voidReason,adjustedBy,cashPoint:(uuid,name),cashier:(uuid,display),dateCreated,lineItems,patient:(uuid,display))',
  },
  billingStatusQueryUrl: {
    _type: Type.String,
    _default: '${restBaseUrl}/cashier/billLineItem?orderUuid=${orderUuid}&v=full',
    _description: 'URL to query billing status',
  },
  excludedPaymentMode: {
    _type: Type.Array,
    _elements: {
      uuid: {
        _type: Type.UUID,
        _description: 'The value of the payment mode to be excluded',
      },
      label: {
        _type: Type.String,
        _default: null,
        _description: 'The label of the payment mode to be excluded',
      },
    },
    _default: [
      {
        uuid: 'eb6173cb-9678-4614-bbe1-0ccf7ed9d1d4',
        label: 'Waiver',
      },
    ],
  },
  inPatientVisitTypeUuid: {
    _type: Type.String,
    _description: 'The visit type uuid for in-patient',
    _default: 'a73e2ac6-263b-47fc-99fc-e0f2c09fc914',
  },
  paymentMethodsUuidsThatShouldNotShowPrompt: {
    _type: Type.Array,
    _description: 'The payment methods that should not show the billing prompt',
    _elements: {
      _type: Type.String,
    },
    _default: ['beac329b-f1dc-4a33-9e7c-d95821a137a6'],
  },
  cashPointUuid: {
    _type: Type.String,
    _description: 'Where bill is generated from',
    _default: 'e9d5e99a-a527-4258-9a93-afbea4fef174',
  },
  cashierUuid: {
    _type: Type.String,
    _description: 'Who Generated the bill',
    _default: 'e9d5e99a-a527-4258-9a93-afbea4fef174',
  },
  insuranceSchemes: {
    _type: Type.Array,
    _elements: {
      _type: Type.String,
    },
    _default: ['SHA', 'Jubilee Insurance', 'AAR Insurance', 'Old Mutual Insurance'],
    _description: 'List of insurance schemes',
  },
  visitAttributeTypes: {
    isPatientExempted: {
      _type: Type.String,
      _default: 'df0362f9-782e-4d92-8bb2-3112e9e9eb3c',
      _description: 'Whether the patient should be exempted from paying for service i.e Prisoners',
    },
    paymentMethods: {
      _type: Type.String,
      _description: 'The payment methods visit attribute uuid',
      _default: '8553afa0-bdb9-4d3c-8a98-05fa9350aa85',
    },
    insuranceScheme: {
      _type: Type.String,
      _description: 'The insurance scheme visit attribute uuid',
      _default: '2d0fa959-6780-41f1-85b1-402045935068',
    },
    policyNumber: {
      _type: Type.String,
      _description: 'The policy number visit attribute uuid',
      _default: '0f4f3306-f01b-43c6-af5b-fdb60015cb02',
    },
    exemptionCategory: {
      _type: Type.String,
      _description: 'The exemption category visit attribute uuid',
      _default: 'fbc0702d-b4c9-4968-be63-af8ad3ad6239',
    },
    billPaymentStatus: {
      _type: Type.String,
      _description: 'The bill payment status visit attribute uuid',
      _default: '919b51c9-8e2e-468f-8354-181bf3e55786',
    },
    shaBenefitPackagesAndInterventions: {
      _type: Type.String,
      _description: 'JSON String of SHA Benefit Packages and Interventions for this visit',
      _default: '338725fa-3790-4679-98b9-be623214ee29',
    },
  },
  patientExemptionCategories: {
    _type: Type.Array,
    _elements: {
      value: {
        _type: Type.String,
        _description: 'The value of the exemption category',
      },
      label: {
        _type: Type.String,
        _default: null,
        _description: 'The label of the exemption category',
      },
    },
    _default: [{ value: 'FREE_CARE', label: 'Free Care' }],
  },
  insurancePaymentMethod: {
    _type: Type.String,
    _description: 'Insurance Payment method UUID',
    _default: 'beac329b-f1dc-4a33-9e7c-d95821a137a6',
  },
  mobileMoneyPaymentModeUUID: {
    _type: Type.UUID,
    _description: 'Mobile money payment method uuid',
    _default: '28989582-e8c3-46b0-96d0-c249cb06d5c6',
  },
  concepts: {
    emergencyPriorityConceptUuid: {
      _type: Type.String,
      _description: 'The concept uuid for emergency priority',
      _default: '037446f4-adfc-40b3-928c-a39a4826b1bf',
    },
    serviceConceptSetUuid: {
      _type: Type.String,
      _description: 'The concept uuid containing all available services e.g lab, pharmacy, surgical etc',
      _default: 'a8f3f64a-11d5-4a09-b0fb-c8118fa349f3',
    },
  },
};
