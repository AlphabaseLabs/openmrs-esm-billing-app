import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ButtonSet,
  Button,
  Stack,
  TextInput,
  ComboBox,
  Toggle,
  InlineNotification,
  InlineLoading,
} from '@carbon/react';
import { Add } from '@carbon/react/icons';
import { Controller, useFieldArray, useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  useLayoutType,
  useDebounce,
  ResponsiveWrapper,
  Workspace2,
  type Workspace2DefinitionProps,
  showSnackbar,
  restBaseUrl,
  useConfig,
} from '@openmrs/esm-framework';

import {
  createBillableService,
  useConceptsSearch,
  useServiceTypes,
  useSalesTaxes,
} from '../../billable-service.resource';
import PriceField from './price.component';
import { billableFormSchema, type BillableFormSchema } from '../form-schemas';

import classNames from 'classnames';
import styles from './service-form.scss';
import { formatBillableServicePayloadForSubmission, mapInputToPayloadSchema } from '../form-helper';
import ConceptSearch from './concept-search.component';
import { handleMutate } from '../../utils';
import useBillableServices from '../../../hooks/useBillableServices';
import type { BillingConfig } from '../../../config-schema';
import type { ConceptNameType, ServiceConcept } from '../../../types';

interface AddServiceFormProps {
  initialValues?: BillableFormSchema;
}

type ServiceConceptInput = {
  uuid?: string;
  display?: string;
  concept?: Partial<ServiceConcept['concept']>;
  conceptName?: Partial<ServiceConcept['conceptName']>;
};

const normalizeServiceConcept = (concept?: ServiceConceptInput | null): ServiceConcept | null => {
  const conceptUuid = concept?.concept?.uuid ?? concept?.conceptName?.uuid ?? concept?.uuid;
  const conceptDisplay = concept?.concept?.display ?? concept?.conceptName?.display ?? concept?.display ?? '';

  if (!conceptUuid || !conceptDisplay) {
    return null;
  }

  return {
    uuid: concept?.uuid ?? conceptUuid,
    concept: {
      uuid: conceptUuid,
      display: conceptDisplay,
      conceptClass: concept?.concept?.conceptClass,
      names: concept?.concept?.names,
    },
    conceptName: {
      uuid: concept?.conceptName?.uuid ?? conceptUuid,
      display: concept?.conceptName?.display ?? conceptDisplay,
      name: concept?.conceptName?.name,
      conceptNameType: concept?.conceptName?.conceptNameType,
    },
    display: concept?.display ?? conceptDisplay,
  };
};

const getConceptDisplay = (concept?: ServiceConceptInput | null) =>
  concept?.concept?.display ?? concept?.conceptName?.display ?? concept?.display ?? '';

const getConceptNameTypeDisplay = (conceptNameType?: ConceptNameType) =>
  typeof conceptNameType === 'string' ? conceptNameType : (conceptNameType?.display ?? '');

const getConceptShortName = (concept?: ServiceConceptInput | null) =>
  concept?.concept?.names?.find((name) =>
    getConceptNameTypeDisplay(name?.conceptNameType).toLowerCase().includes('short'),
  )?.name ??
  concept?.concept?.names?.find((name) =>
    getConceptNameTypeDisplay(name?.conceptNameType).toLowerCase().includes('short'),
  )?.display ??
  getConceptDisplay(concept);

const getSubmissionErrorMessage = (error: any, fallbackMessage: string) => {
  const responseErrorMessage = error?.responseBody?.error?.message;

  if (typeof responseErrorMessage === 'string' && responseErrorMessage.trim()) {
    return responseErrorMessage.trim();
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return fallbackMessage;
};

const isDuplicateServiceNameError = (errorMessage: string) => {
  const normalizedMessage = errorMessage.toLowerCase();

  return normalizedMessage.includes('another service with name') || normalizedMessage.includes('already exists');
};

const AddServiceForm: React.FC<Workspace2DefinitionProps<AddServiceFormProps>> = ({
  closeWorkspace,
  workspaceProps,
}) => {
  const { t } = useTranslation();
  const { initialValues } = workspaceProps ?? {};
  const { chargeServiceFormUseClinicalServiceConcepts: isClinicalServiceConceptMode, concepts: billingConcepts } =
    useConfig<BillingConfig>();
  const isTablet = useLayoutType() === 'tablet';
  const [conceptToLookup, setConceptLookupValue] = useState('');
  const debouncedConceptToLookup = useDebounce(conceptToLookup, 500);
  const [selectedConcept, setSelectedConcept] = useState<ServiceConcept | null>(null);
  const inEditMode = !!initialValues;

  const { isLoading: isLoadingServiceTypes, serviceTypes } = useServiceTypes();
  const { isLoading: isLoadingSalesTaxes, salesTaxes } = useSalesTaxes();
  const { billableServices, isLoading: isLoadingBillableServices } = useBillableServices();
  const { isSearching, searchResults: concepts } = useConceptsSearch(debouncedConceptToLookup, {
    conceptClassUuid: isClinicalServiceConceptMode ? billingConcepts.chargeServiceConceptClassUuid : undefined,
  });
  const formMethods = useForm<BillableFormSchema>({
    resolver: zodResolver(billableFormSchema),
    defaultValues: initialValues
      ? mapInputToPayloadSchema(initialValues)
      : {
          name: '',
          shortName: '',
          concept: null,
          serviceType: null,
          serviceTax: null,
          serviceStatus: 'ENABLED',
          servicePrices: [],
        },
  });

  const {
    setValue,
    watch,
    setError,
    clearErrors,
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isDirty, defaultValues, isSubmitting },
  } = formMethods;

  useEffect(() => {
    if (!initialValues) {
      return;
    }

    const initialConcept = normalizeServiceConcept(initialValues.concept);
    setSelectedConcept(initialConcept);
    setConceptLookupValue(getConceptDisplay(initialConcept));
    trigger();
  }, [initialValues, trigger]);

  // When editing: resolve sales tax label from concept set once options have loaded
  useEffect(() => {
    if (!inEditMode || !salesTaxes?.length) return;
    const current = getValues('serviceTax');
    if (current?.uuid && !current?.display) {
      const match = salesTaxes.find((t: { uuid: string }) => t.uuid === current.uuid);
      if (match) setValue('serviceTax', match);
    }
  }, [salesTaxes, inEditMode, getValues, setValue]);

  const {
    fields: servicePriceFields,
    append: appendServicePrice,
    remove: removeServicePrice,
  } = useFieldArray({
    control,
    name: 'servicePrices',
  });

  const serviceName = watch('name');
  const duplicateServiceNameMessage = useMemo(() => {
    const normalizedServiceName = serviceName?.trim().toLowerCase();

    if (!normalizedServiceName || isLoadingBillableServices) {
      return '';
    }

    const duplicateServiceExists = billableServices.some(
      (service) =>
        service.uuid !== initialValues?.['uuid'] && service.name?.trim().toLowerCase() === normalizedServiceName,
    );

    return duplicateServiceExists ? t('duplicateServiceNameError', 'A service with this name already exists.') : '';
  }, [billableServices, initialValues, isLoadingBillableServices, serviceName, t]);

  const syncDerivedConceptFields = useCallback(
    (
      concept: ServiceConcept | null,
      {
        shouldValidate,
        shouldDirty,
        syncServiceName = !inEditMode,
      }: { shouldValidate: boolean; shouldDirty: boolean; syncServiceName?: boolean },
    ) => {
      if (!isClinicalServiceConceptMode) {
        return;
      }

      if (concept && syncServiceName) {
        setValue('name', getConceptDisplay(concept), { shouldDirty, shouldValidate });
      }

      setValue('shortName', concept ? getConceptShortName(concept) : '', { shouldDirty, shouldValidate: false });
    },
    [inEditMode, isClinicalServiceConceptMode, setValue],
  );

  const handleSelectConcept = useCallback(
    (concept: ServiceConcept | null) => {
      const conceptDisplay = getConceptDisplay(concept);
      const shouldValidate = Boolean(concept);

      setSelectedConcept(concept);
      setValue('concept', concept, { shouldDirty: true, shouldValidate });
      setConceptLookupValue(conceptDisplay);
      syncDerivedConceptFields(concept, { shouldValidate, shouldDirty: true });
    },
    [setValue, syncDerivedConceptFields],
  );

  /**
   * Same API as pre-migration `setConceptToLookup`, but clears the picked concept when the user
   * edits or clears the field (Carbon v9+ controlled Search no longer “unlocks” otherwise).
   */
  const setConceptToLookup = useCallback(
    (value: string) => {
      setConceptLookupValue(value);
      if (selectedConcept) {
        const display = getConceptDisplay(selectedConcept);
        if (value !== display) {
          setSelectedConcept(null);
          setValue('concept', null, { shouldDirty: true, shouldValidate: false });
          syncDerivedConceptFields(null, { shouldValidate: false, shouldDirty: true });
        }
      }
    },
    [selectedConcept, setValue, syncDerivedConceptFields],
  );

  useEffect(() => {
    if (!isClinicalServiceConceptMode || !selectedConcept?.concept?.uuid || !concepts?.length) {
      return;
    }

    const matchingConcept = concepts.find((concept) => concept.concept.uuid === selectedConcept.concept.uuid);
    if (!matchingConcept) {
      return;
    }

    const selectedConceptShortName = getConceptShortName(selectedConcept);
    const matchingConceptShortName = getConceptShortName(matchingConcept);
    const hasEquivalentConceptData =
      selectedConceptShortName === matchingConceptShortName &&
      selectedConcept.concept.display === matchingConcept.concept.display;

    if (hasEquivalentConceptData) {
      return;
    }

    setSelectedConcept(matchingConcept);
    setValue('concept', matchingConcept, { shouldDirty: false, shouldValidate: false });
    syncDerivedConceptFields(matchingConcept, {
      shouldValidate: false,
      shouldDirty: false,
      syncServiceName: false,
    });
  }, [concepts, isClinicalServiceConceptMode, selectedConcept, setValue, syncDerivedConceptFields]);

  useEffect(() => {
    if (!duplicateServiceNameMessage && errors.name?.type === 'duplicate') {
      clearErrors('name');
    }
  }, [clearErrors, duplicateServiceNameMessage, errors.name?.type]);

  const onSubmit = async (data: BillableFormSchema) => {
    if (duplicateServiceNameMessage) {
      setError('name', {
        type: 'duplicate',
        message: duplicateServiceNameMessage,
      });
      return;
    }

    const formPayload = formatBillableServicePayloadForSubmission(data, initialValues?.['uuid']);
    try {
      const response = await createBillableService(formPayload, initialValues?.['uuid']);
      if (response.ok) {
        showSnackbar({
          title: inEditMode
            ? t('serviceUpdatedSuccessfully', 'Service updated successfully')
            : t('serviceCreated', 'Service created successfully'),
          kind: 'success',
          subtitle: inEditMode
            ? t('serviceUpdatedSuccessfully', 'Service updated successfully')
            : t('serviceCreatedSuccessfully', 'Service created successfully'),
          isLowContrast: true,
          timeoutInMs: 5000,
        });
        handleMutate(`${restBaseUrl}/cashier/billableService?v`);

        closeWorkspace({ discardUnsavedChanges: true });
      }
    } catch (e) {
      const backendErrorMessage = getSubmissionErrorMessage(e, t('unknownError', 'Unknown error occurred'));
      const errorMessage = isDuplicateServiceNameError(backendErrorMessage)
        ? t('duplicateServiceNameError', 'A service with this name already exists.')
        : backendErrorMessage;
      showSnackbar({
        title: t('serviceCreationFailed', 'Service creation failed'),
        subtitle: t('serviceCreationFailedSubtitle', 'The service creation failed: {{errorMessage}}', {
          errorMessage,
        }),
        kind: 'error',
        isLowContrast: true,
        timeoutInMs: 5000,
      });
    }
  };

  const renderServicePriceFields = useMemo(
    () =>
      servicePriceFields.map((field, index) => (
        <PriceField
          key={field.id}
          field={field}
          index={index}
          control={control}
          removeServicePrice={removeServicePrice}
          errors={errors}
        />
      )),
    [servicePriceFields, control, removeServicePrice, errors],
  );

  const handleError = (err) => {
    console.error(JSON.stringify(err, null, 2));
    const errorMessage = Object.entries(err as Record<string, { message: string }>)
      .map(([field, error]) => `${field}: ${error.message}`)
      .join('; ');

    showSnackbar({
      title: t('serviceCreationFailed', 'Service creation failed'),
      subtitle: t('serviceCreationFailedSubtitle', 'The service creation failed: {{errorMessage}}', {
        errorMessage,
      }),
      kind: 'error',
      isLowContrast: true,
      timeoutInMs: 5000,
    });
  };

  return (
    <Workspace2
      title={
        initialValues
          ? t('editServiceChargeItem', 'Edit Service Charge Item')
          : t('chargeServiceForm', 'Charge Service Form')
      }
      hasUnsavedChanges={isDirty}>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit, handleError)} className={styles.form}>
          <div className={styles.formContainer}>
            <Stack className={styles.formStackControl} gap={7}>
              {errors.concept && (
                <InlineNotification
                  kind="error"
                  title={t('conceptMissing', 'Concept missing')}
                  subtitle={t('conceptMissingSubtitle', 'Please select a service concept')}
                />
              )}
              {isClinicalServiceConceptMode ? (
                <ResponsiveWrapper>
                  <ComboBox
                    id="serviceConcept"
                    titleText={t('serviceConcept', 'Service concept')}
                    items={concepts ?? []}
                    itemToString={(item: ServiceConcept | null) => getConceptDisplay(item)}
                    selectedItem={selectedConcept}
                    onInputChange={(value) => setConceptToLookup(value ?? '')}
                    onChange={({ selectedItem }) => handleSelectConcept((selectedItem as ServiceConcept) ?? null)}
                    placeholder={t('selectChargeService', 'Search for service')}
                    invalid={!!errors.concept}
                    invalidText={errors?.concept?.message}
                  />
                </ResponsiveWrapper>
              ) : null}
              <ResponsiveWrapper>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      id="serviceName"
                      {...field}
                      type="text"
                      labelText={t('serviceName', 'Service name')}
                      invalid={!!errors.name || !!duplicateServiceNameMessage}
                      invalidText={duplicateServiceNameMessage || errors?.name?.message}
                    />
                  )}
                />
              </ResponsiveWrapper>
              <ResponsiveWrapper>
                <Controller
                  name="shortName"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      id="serviceShortName"
                      {...field}
                      type="text"
                      labelText={t('serviceShortName', 'Service short name')}
                      readOnly={isClinicalServiceConceptMode}
                      invalid={!!errors.shortName}
                      invalidText={errors?.shortName?.message}
                    />
                  )}
                />
              </ResponsiveWrapper>

              {!isClinicalServiceConceptMode ? (
                <ConceptSearch
                  setConceptToLookup={setConceptToLookup}
                  conceptToLookup={conceptToLookup}
                  defaultValues={defaultValues}
                  errors={errors}
                  isSearching={isSearching}
                  concepts={concepts}
                  handleSelectConcept={handleSelectConcept}
                />
              ) : null}

              <ResponsiveWrapper>
                <Controller
                  name="serviceType"
                  control={control}
                  render={({ field }) => {
                    return (
                      <ComboBox
                        id="serviceType"
                        onChange={({ selectedItem }) => field.onChange(selectedItem)}
                        titleText={t('serviceType', 'Service type')}
                        items={serviceTypes ?? []}
                        itemToString={(item) => (item ? item.display : '')}
                        placeholder={t('selectServiceType', 'Select service type')}
                        disabled={isLoadingServiceTypes}
                        initialSelectedItem={field.value}
                        invalid={!!errors.serviceType}
                        invalidText={errors?.serviceType?.message}
                        itemToElement={(item) => (
                          <div role="option" aria-selected={field.value?.uuid === item?.uuid}>
                            {item?.display}
                          </div>
                        )}
                      />
                    );
                  }}
                />
              </ResponsiveWrapper>
              <ResponsiveWrapper>
                <Controller
                  name="serviceTax"
                  control={control}
                  render={({ field }) => (
                    <ComboBox
                      id="serviceTax"
                      onChange={({ selectedItem }) => field.onChange(selectedItem ?? null)}
                      titleText={t('salesTax', 'Sales tax')}
                      items={salesTaxes ?? []}
                      itemToString={(item) => (item ? item.display : '')}
                      placeholder={t('selectSalesTax', 'Select sales tax')}
                      disabled={isLoadingSalesTaxes}
                      selectedItem={field.value ?? null}
                      invalid={!!errors.serviceTax}
                      invalidText={errors?.serviceTax?.message}
                      itemToElement={(item) => (
                        <div role="option" aria-selected={field.value?.uuid === item?.uuid}>
                          {item?.display}
                        </div>
                      )}
                    />
                  )}
                />
              </ResponsiveWrapper>
              <ResponsiveWrapper>
                <Controller
                  control={control}
                  name="serviceStatus"
                  render={({ field }) => (
                    <Toggle
                      labelText={t('status', 'Status')}
                      labelA="Off"
                      labelB="On"
                      defaultToggled={field.value === 'ENABLED'}
                      id="serviceStatus"
                      onToggle={(value) => (value ? field.onChange('ENABLED') : field.onChange('DISABLED'))}
                    />
                  )}
                />
              </ResponsiveWrapper>
              {renderServicePriceFields}
              <Button size="sm" kind="tertiary" renderIcon={Add} onClick={() => appendServicePrice({})}>
                {t('addPaymentMethod', 'Add payment method')}
              </Button>
              {!!errors.servicePrices && (
                <InlineNotification
                  aria-label="closes notification"
                  kind="error"
                  lowContrast={true}
                  statusIconDescription="notification"
                  title={t('paymentMethodRequired', 'Payment method required')}
                  subtitle={t('atLeastOnePriceRequired', 'At least one price is required')}
                />
              )}
            </Stack>
          </div>
          <ButtonSet className={classNames({ [styles.tablet]: isTablet, [styles.desktop]: !isTablet })}>
            <Button style={{ maxWidth: '50%' }} kind="secondary" onClick={() => closeWorkspace()}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button disabled={isSubmitting || !isDirty} style={{ maxWidth: '50%' }} kind="primary" type="submit">
              {isSubmitting ? (
                <span style={{ display: 'flex', justifyItems: 'center' }}>
                  {t('submitting', 'Submitting...')} <InlineLoading status="active" iconDescription="Loading" />
                </span>
              ) : (
                t('saveAndClose', 'Save & close')
              )}
            </Button>
          </ButtonSet>
        </form>
      </FormProvider>
    </Workspace2>
  );
};

export default AddServiceForm;
