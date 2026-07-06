import { type OpenmrsResource } from '@openmrs/esm-framework';
import { type Drug, type OrderBasketItem } from '@openmrs/esm-patient-common-lib';

export interface MappedBill {
  uuid: string;
  id: number;
  patientUuid: string;
  patientName: string;
  cashPointUuid: string;
  cashPointName: string;
  cashPointLocation: string;
  cashier: Provider;
  receiptNumber: string;
  status: PaymentStatus;
  identifier: string;
  dateCreated: string;
  dateCreatedUnformatted: string;
  lineItems: Array<LineItem>;
  billingService: string;
  payments: Array<Payment>;
  totalAmount?: number;
  tenderedAmount?: number;
  display?: string;
  referenceCodes?: string;
  adjustmentReason?: string;
  totalPayments?: number;
  totalDeposits?: number;
  totalExempted?: number;
  balance?: number;
  closed?: boolean;
  totalWaived?: number;
  totalActualPayments?: number;
  additionalDiscount?: number;
  totalTax?: number;
  billLineItemDiscounts?: number;
  totalDiscounts?: number;
  totalAmountWithoutTaxAndDiscount?: number;
}

interface LocationLink {
  rel: string;
  uri: string;
  resourceAlias: string;
}

interface Location {
  uuid: string;
  display: string;
  links: LocationLink[];
}

interface CashPoint {
  uuid: string;
  name: string;
  description: string;
  retired: boolean;
  location: Location;
}

interface ProviderLink {
  rel: string;
  uri: string;
  resourceAlias: string;
}

interface Provider {
  uuid: string;
  display: string;
  links: ProviderLink[];
}

export interface LinePaymentAllocation {
  uuid?: string;
  billLineItem?: { uuid: string; display?: string } | string;
  allocatedAmount: number;
  dateCreated?: string | number;
  voided?: boolean;
  resourceVersion?: string;
}

/** Discount on a bill line item. Request: amount, baseAmount, rate?, description?, sponsor?; Response: same + uuid */
export interface BillLineItemDiscount {
  uuid?: string;
  amount: number;
  baseAmount: number;
  rate?: number;
  description?: string;
  sponsor?: string;
}

/** Tax on a bill line item. Request: amount, baseAmount, rate?, concept?; Response: same + uuid */
export interface BillLineItemTax {
  uuid?: string;
  amount: number;
  baseAmount: number;
  rate?: number;
  concept?: string;
}

export interface LineItem {
  uuid: string;
  display: string;
  /** When present (from REST), creation time of this line item */
  dateCreated?: string;
  /** Some REST representations expose line item time under auditInfo */
  auditInfo?: {
    dateCreated?: string;
  };
  voided: boolean;
  voidReason: string | null;
  item: string;
  billableService: string;
  quantity: number;
  price: number;
  priceName: string;
  priceUuid: string;
  lineItemOrder: number;
  resourceVersion: string;
  paymentStatus: string;
  itemOrServiceConceptUuid: string;
  serviceTypeUuid: string;
  order: OpenmrsResource;
  discounts?: BillLineItemDiscount[];
  taxes?: BillLineItemTax[];
  amount?: number;
  totalAllocated?: number;
  totalDiscount?: number;
  totalTax?: number;
  total?: number;
}

interface PatientLink {
  rel: string;
  uri: string;
  resourceAlias: string;
}

interface Patient {
  uuid: string;
  display: string;
  links: PatientLink[];
  identifiers: Array<{ uuid: string; display: string }>;
}

interface AttributeType {
  uuid?: string;
  name: string;
  description: string;
  retired: boolean;
  attributeOrder?: number;
  format?: string;
  foreignKey?: string | null;
  regExp?: string | null;
  required: boolean;
  value?: string;
}

interface Attribute {
  uuid: string;
  display: string;
  voided: boolean;
  voidReason: string | null;
  value: string;
  attributeType: AttributeType;
  order: number;
  valueName: string;
  resourceVersion: string;
}

interface PaymentInstanceType {
  uuid: string;
  name: string;
  description: string;
  retired: boolean;
}

export interface PatientDetails {
  name: string;
  age: string;
  gender: string;
  city: string;
  county: string;
  subCounty: string;
}

export interface FacilityDetail {
  uuid: string;
  display: string;
}

export type ServiceConcept = {
  uuid: any;
  concept: {
    uuid: string;
    display: string;
  };
  conceptName: {
    uuid: string;
    display: string;
  };
  display: string;
};

export type BillabeItem = {
  uuid: string;
  id?: number;
  name?: string;
  commonName?: string;
  servicePrices?: ServicePrice[];
};

export type ServicePrice = {
  price: string;
  uuid: string;
};

export interface BillableService {
  uuid: string;
  name: string;
  shortName: string;
  serviceStatus: string;
  serviceType?: {
    display: string;
  };
  servicePrices: Array<{
    uuid?: string;
    name: string;
    price: number;
    paymentMode?: {
      uuid?: string;
      name?: string;
    };
  }>;
}

export interface PaymentPoint {
  uuid: string;
  name: string;
  description: string;
  retired: boolean;
  location: Location;
}

export interface Timesheet {
  uuid: string;
  display: string;
  cashier: Cashier;
  cashPoint: CashPoint;
  clockIn: string;
  clockOut: null;
  id: number;
}

export interface Cashier {
  uuid: string;
  display: string;
  links: Link[];
}

export interface Link {
  rel: string;
  uri: string;
  resourceAlias: string;
}

export enum PaymentStatus {
  POSTED = 'POSTED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  CREDITED = 'CREDITED',
  CANCELLED = 'CANCELLED',
  ADJUSTED = 'ADJUSTED',
  EXEMPTED = 'EXEMPTED',
}

export type BillingPromptType = 'patient-chart' | 'billing-orders';

export interface Creator {
  uuid: string;
  display: string;
  links: Link[];
}

export interface AuditInfo {
  creator: Creator;
  dateCreated: string;
  changedBy: null;
  dateChanged: null;
}

export interface PaymentMethod {
  uuid: string;
  name: string;
  description: string;
  retired: boolean;
  retireReason: null;
  auditInfo: AuditInfo;
  attributeTypes: AttributeType[];
  sortOrder: null;
  resourceVersion: string;
}

export interface AiPaymentSource {
  type: 'ai_attachment';
  documentId: string;
  sourcePaymentId?: string;
}

export interface PatientInvoice {
  uuid: string;
  display: string;
  voided: boolean;
  voidReason: string | null;
  adjustedBy: any[];
  billAdjusted: any;
  cashPoint: CashPoint;
  cashier: Provider;
  dateCreated: string;
  lineItems: LineItem[];
  patient: Patient;
  payments: Payment[];
  receiptNumber: string;
  status: PaymentStatus;
  adjustmentReason: any;
  id: number;
  resourceVersion: string;
  totalPayments?: number;
  totalDeposits?: number;
  totalExempted?: number;
  balance?: number;
  closed?: boolean;
  totalActualPayments?: number;
  totalWaivers?: number;
  additionalDiscount?: number;
  totalTax?: number;
  totalDiscount?: number;
}

export type BillingService = {
  name: string;
  servicePrices: Array<{ name: string; paymentMode: { uuid: string; name: string }; price: number; uuid: string }>;
  serviceStatus: string;
  serviceType: { display: string };
  shortName: string;
  uuid: string;
  stockItem?: string;
};

export interface Filter {
  paymentMethods?: Array<string>;
  amountRange?: { min: number; max: number };
  serviceTypes?: Array<string>;
  cashiers?: Array<string>;
  status?: string;
  billStatus?: string;
  patientUuid?: string;
}

export interface DataTableRow {
  id: string;
  cells: Array<Cell>;
}

export interface Cell {
  id: string;
  value: any;
  info: Info;
}

export interface Info {
  header: string;
}

export type PaymentMode = {
  uuid?: string;
  name: string;
  description: string;
  retired: boolean;
  retiredReason?: string | null;
  auditInfo?: AuditInfo;
  attributeTypes?: Array<AttributeType>;
  sortOrder?: number | null;
  resourceVersion?: string;
};

export interface Payment {
  uuid: string;
  instanceType: PaymentInstanceType;
  attributes: Attribute[];
  amount: number;
  amountTendered: number;
  allocations?: LinePaymentAllocation[];
  dateCreated: number;
  voided: boolean;
  resourceVersion: string;
}

export type FormPayment = {
  method: PaymentMethod | null;
  amount: number | undefined;
  referenceCode?: string;
  preferredPaymentMethodName?: string;
  clientPaymentId?: string;
  aiSource?: AiPaymentSource | null;
};

export type PaymentFormValue = {
  payment: Array<FormPayment>;
};

export type ExcelFileRow = {
  concept_id: number;
  name: string;
  price: number;
  disable: 'false' | 'true';
  service_type_id: number;
  short_name: string;
};

interface CommonMedicationProps {
  value: string;
  default?: boolean;
}

export interface CommonMedicationValueCoded extends CommonMedicationProps {
  valueCoded: string;
}
export type DosingUnit = CommonMedicationValueCoded;
export type MedicationFrequency = CommonMedicationValueCoded;
export type MedicationRoute = CommonMedicationValueCoded;
export type MedicationInstructions = CommonMedicationProps;
export type QuantityUnit = CommonMedicationValueCoded;
export type DurationUnit = CommonMedicationValueCoded;

export interface OrderTemplate {
  type: string;
  dosingType: string;
  dosingInstructions: DosingInstructions;
}
export interface DosingInstructions {
  dose: Array<MedicationDosage>;
  units: Array<DosingUnit>;
  route: Array<MedicationRoute>;
  frequency: Array<MedicationFrequency>;
  instructions?: Array<MedicationInstructions>;
  durationUnits?: Array<DurationUnit>;
  quantityUnits?: Array<QuantityUnit>;
  asNeeded?: boolean;
  asNeededCondition?: string;
}

export interface MedicationDosage extends Omit<CommonMedicationProps, 'value'> {
  value: number;
}

export interface DrugOrderBasketItem extends OrderBasketItem {
  drug: Drug;
  unit: DosingUnit;
  commonMedicationName: string;
  dosage: number;
  frequency: MedicationFrequency;
  route: MedicationRoute;
  quantityUnits: QuantityUnit;
  patientInstructions: string;
  asNeeded: boolean;
  asNeededCondition: string;
  // TODO: This is unused
  startDate: Date | string;
  durationUnit: DurationUnit;
  duration: number | null;
  pillsDispensed: number;
  numRefills: number;
  indication: string;
  isFreeTextDosage: boolean;
  freeTextDosage: string;
  previousOrder?: string;
  template?: OrderTemplate;
}

export interface Schema {
  services: Record<string, unknown>;
  commodities: Record<string, unknown>;
}

export type ServiceType = { uuid: string; display: string; id: number };

export type ServiceTypesResponse = {
  setMembers: Array<ServiceType>;
};

export type QueueEntry = {
  queueEntry: {
    uuid: string;
    priority: OpenmrsResource;
    status: OpenmrsResource;
    queue: OpenmrsResource;
    queueComingFrom: OpenmrsResource;
  };
};
