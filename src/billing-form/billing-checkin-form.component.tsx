import { FilterableMultiSelect, InlineLoading, InlineNotification, Tag } from '@carbon/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { showSnackbar, useConfig, useVisit, type OpenmrsResource } from '@openmrs/esm-framework';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { createPatientBill, useBillableItems, useCashPoint } from '../billing.resource';
import { type BillingConfig } from '../config-schema';
import { EXEMPTED_PAYMENT_STATUS, PENDING_PAYMENT_STATUS } from '../constants';
import styles from './billing-checkin-form.scss';
import { visitAttributesFormSchema, type VisitAttributesFormValue } from './check-in-form.utils';
import { hasPatientBeenExempted } from './helper';
import VisitAttributesForm from './visit-attributes/visit-attributes-form.component';

type BillingCheckInFormProps = {
  patientUuid: string;
  setExtraVisitInfo: (state) => void;
};

type ServicePriceRow = { paymentMode?: { uuid?: string }; price?: string; uuid?: string };

function lineItemsFromSelection(
  selectedItems: Array<OpenmrsResource>,
  paymentMethod: string,
  billStatus: string,
): Array<{
  billableService: string;
  quantity: number;
  price: string;
  priceName: string;
  priceUuid: string;
  lineItemOrder: number;
  paymentStatus: string;
}> {
  return selectedItems.map((item, index) => {
    const servicePrices = item.servicePrices as Array<ServicePriceRow> | undefined;
    const priceForPaymentMode = servicePrices?.find((p) => p.paymentMode?.uuid === paymentMethod) || servicePrices?.[0];
    return {
      billableService: item.uuid,
      quantity: 1,
      price: priceForPaymentMode ? priceForPaymentMode.price : '0.000',
      priceName: 'Default',
      priceUuid: priceForPaymentMode ? priceForPaymentMode.uuid : '',
      lineItemOrder: index,
      paymentStatus: billStatus,
    };
  });
}

const BillingCheckInForm: React.FC<BillingCheckInFormProps> = ({ patientUuid, setExtraVisitInfo }) => {
  const { t } = useTranslation();
  const {
    visitAttributeTypes: { isPatientExempted },
  } = useConfig<BillingConfig>();
  const { currentVisit } = useVisit(patientUuid);
  const { cashPoints, isLoading: isLoadingCashPoints, error: cashError } = useCashPoint();
  const { lineItems, isLoading: isLoadingLineItems, error: lineError } = useBillableItems();
  const [attributes, setAttributes] = useState([]);
  const [selectedBillableServices, setSelectedBillableServices] = useState<Array<OpenmrsResource>>([]);
  const formMethods = useForm<VisitAttributesFormValue>({
    mode: 'all',
    defaultValues: {
      isPatientExempted: 'false',
      paymentMethods: '',
      insuranceScheme: '',
      policyNumber: '',
      exemptionCategory: '',
      interventions: [],
      packages: [],
    },
    resolver: zodResolver(visitAttributesFormSchema),
  });
  const isPatientExemptedValue = formMethods.watch('isPatientExempted');
  const paymentMethod = formMethods.watch('paymentMethods');
  const previousExemptionRef = useRef(isPatientExemptedValue);

  const handleCreateBill = useCallback(async (createBillPayload) => {
    createPatientBill(createBillPayload).then(
      () => {
        showSnackbar({ title: 'Patient Bill', subtitle: 'Patient has been billed successfully', kind: 'success' });
      },
      (error) => {
        const errorMessage = JSON.stringify(error?.responseBody?.error?.message?.replace(/\[/g, '').replace(/\]/g, ''));
        showSnackbar({
          title: 'Patient Bill Error',
          subtitle: `An error has occurred while creating patient bill, Contact system administrator quoting this error ${errorMessage}`,
          kind: 'error',
          isLowContrast: true,
        });
      },
    );
  }, []);

  useEffect(() => {
    if (previousExemptionRef.current !== isPatientExemptedValue) {
      previousExemptionRef.current = isPatientExemptedValue;
      setSelectedBillableServices([]);
    }
  }, [isPatientExemptedValue]);

  useEffect(() => {
    const cashPointUuid = cashPoints?.[0]?.uuid ?? '';
    const billStatus = hasPatientBeenExempted(attributes, isPatientExempted)
      ? EXEMPTED_PAYMENT_STATUS
      : PENDING_PAYMENT_STATUS;

    if (!paymentMethod || selectedBillableServices.length === 0) {
      setExtraVisitInfo({
        handleCreateExtraVisitInfo: () => {},
        attributes,
      });
      return;
    }

    const billPayload = {
      lineItems: lineItemsFromSelection(selectedBillableServices, paymentMethod, billStatus),
      cashPoint: cashPointUuid,
      patient: patientUuid,
      status: billStatus,
      payments: [],
    };

    setExtraVisitInfo({
      handleCreateExtraVisitInfo: () => handleCreateBill(billPayload),
      attributes,
    });
  }, [
    attributes,
    cashPoints,
    handleCreateBill,
    isPatientExempted,
    patientUuid,
    paymentMethod,
    selectedBillableServices,
    setExtraVisitInfo,
  ]);

  if (isLoadingLineItems || isLoadingCashPoints) {
    return (
      <InlineLoading
        status="active"
        iconDescription={t('loading', 'Loading')}
        description={t('loadingBillingServices', 'Loading billing services...')}
      />
    );
  }

  if (cashError || lineError) {
    return (
      <InlineNotification
        kind="error"
        lowContrast
        title={t('billErrorService', 'Bill service error')}
        subtitle={t('errorLoadingBillServices', 'Error loading bill services')}
      />
    );
  }

  return currentVisit == null || currentVisit.voided == true ? (
    <FormProvider {...formMethods}>
      <VisitAttributesForm setAttributes={setAttributes} />
      {paymentMethod && (
        <section className={styles.sectionContainer}>
          <div className={styles.sectionTitle}>{t('ChargeableService', 'Chargeable service')}</div>
          <div className={styles.sectionField}>
            <FilterableMultiSelect
              className={styles.billableServiceMultiselect}
              direction="top"
              id="billing-service"
              titleText={t('searchServices', 'Search services')}
              items={lineItems ?? []}
              itemToString={(item) => (item ? item?.name : '')}
              onChange={({ selectedItems }) => setSelectedBillableServices(selectedItems ?? [])}
              selectedItems={selectedBillableServices}
              selectionFeedback="top-after-reopen"
              disabled={isPatientExemptedValue === ''}
            />
            {selectedBillableServices.length > 0 ? (
              <div className={styles.selectionTags}>
                {selectedBillableServices.map((item) => (
                  <Tag
                    key={item.uuid}
                    className={styles.tag}
                    filter
                    type="blue"
                    onClose={() => setSelectedBillableServices((prev) => prev.filter((s) => s.uuid !== item.uuid))}>
                    {item.name}
                  </Tag>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}
    </FormProvider>
  ) : (
    <div>Use bill manager to edit the bill</div>
  );
};

export default React.memo(BillingCheckInForm);
