import { Type, validators } from '@openmrs/esm-framework';

export interface BillingConfig {
  enforceBillPayment: {
    _type: Type.Boolean;
    _default: true;
    _description: 'Whether to enforce bill payment or not for patient to receive service';
  };
  localeCurrencyMapping: Record<string, string>;
  promptDuration: {
    enable: boolean;
    duration: number;
  };
  patientBillsUrl: string;
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

export const configSchema = {
  logo: {
    src: {
      _type: Type.String,
      _default: '',
      _description:
        'The path or URL to the logo image. If set to an empty string, the default OpenMRS SVG sprite will be used.',
      _validators: [validators.isUrl],
    },
    alt: {
      _type: Type.String,
      _default: 'Logo',
      _description: 'The alternative text for the logo image, displayed when the image cannot be loaded or on hover.',
    },
  },
  country: {
    _type: Type.String,
    _description: 'The text that gets printed on the top right of the invoice, typically the name of the country',
    _default: 'Kenya',
  },
  patientCatergory: {
    _type: Type.Object,
    _description: 'Patient Category Custom UUIDs',
    _default: {
      paymentDetails: 'fbc0702d-b4c9-4968-be63-af8ad3ad6239',
      paymentMethods: '8553afa0-bdb9-4d3c-8a98-05fa9350aa85',
      policyNumber: '3a988e33-a6c0-4b76-b924-01abb998944b',
      insuranceScheme: 'aac48226-d143-4274-80e0-264db4e368ee',
      patientCategory: '3b9dfac8-9e4d-11ee-8c90-0242ac120002',
      formPayloadPending: '919b51c9-8e2e-468f-8354-181bf3e55786',
    },
  },
  catergoryConcepts: {
    _type: Type.Object,
    _description: 'Patient Category Concept UUIDs',
    _default: {
      payingDetails: '44b34972-6630-4e5a-a9f6-a6eb0f109650',
      nonPayingDetails: 'f3fb2d88-cccd-422c-8766-be101ba7bd2e',
      insuranceDetails: 'beac329b-f1dc-4a33-9e7c-d95821a137a6',
    },
  },
  nonPayingPatientCategories: {
    _type: Type.Object,
    _description: 'Concept UUIDs for non-paying patient categories',
    _default: {
      childUnder5: '1528AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      student: '159465AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    },
  },
  postBilledItems: {
    _type: Type.Object,
    _description: 'Post Bill Items such as cashPoints, cashier, priceUUid when submitting a bill',
    _default: {
      cashPoint: '54065383-b4d4-42d2-af4d-d250a1fd2590',
      cashier: 'f9badd80-ab76-11e2-9e96-0800200c9a66',
      priceUuid: '7b9171ac-d3c1-49b4-beff-c9902aee5245',
    },
  },
  serviceTypes: {
    _type: Type.Object,
    _description: 'Post Bill Items such as cashPoints, cashier, priceUUid when submitting a bill',
    _default: {
      billableService: '21b8cf43-9f9f-4d02-9f4a-d710ece54261',
    },
  },
  defaultCurrency: {
    _type: Type.String,
    _description: 'The default currency for the application. Specify the currency code (e.g., KES, UGX, GBP).',
    _default: 'KES',
  },
  pageSize: {
    _type: Type.Number,
    _description: 'The default page size',
    _default: 10,
  },
  showEditBillButton: {
    _type: Type.Boolean,
    _description: 'Whether to show the edit bill button or not.',
    _default: false,
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
      'The duration in hours for the prompt to be shown, if the duration is less than this, the prompt will be shown',
    _default: {
      enable: true,
      duration: 24,
    },
  },
  patientBillsUrl: {
    _type: Type.String,
    _description: 'The url to fetch patient bills',
    _default:
      '${restBaseUrl}/cashier/bill?v=custom:(uuid,display,voided,voidReason,adjustedBy,cashPoint:(uuid,name),cashier:(uuid,display),dateCreated,lineItems,patient:(uuid,display))',
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
    _default: '54065383-b4d4-42d2-af4d-d250a1fd2590',
  },
  cashierUuid: {
    _type: Type.String,
    _description: 'Who Generated the bill',
    _default: '54065383-b4d4-42d2-af4d-d250a1fd2590',
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
      _default: '3b9dfac8-9e4d-11ee-8c90-0242ac120002',
      _description: 'Whether the patient should be exempted from paying for service i.e Prisoners',
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

export interface ConfigObject {
  logo: {
    src: string;
    alt: string;
  };
  country: string;
  patientCatergory: {
    paymentDetails: string;
    paymentMethods: string;
    policyNumber: string;
    insuranceScheme: string;
    patientCategory: string;
    formPayloadPending: string;
  };
  catergoryConcepts: {
    payingDetails: string;
    nonPayingDetails: string;
    insuranceDetails: string;
  };
  nonPayingPatientCategories: {
    childUnder5: string;
    student: string;
  };
  postBilledItems: {
    cashPoint: string;
    cashier: string;
    priceUuid: string;
  };
  serviceTypes: {
    billableService: string;
  };
  defaultCurrency: string;
  pageSize: number;
  showEditBillButton: boolean;
}
