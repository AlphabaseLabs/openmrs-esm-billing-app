import React, { useState } from 'react';
import { mutate } from 'swr';
import {
  ExtensionSlot,
  Workspace2,
  type Workspace2DefinitionProps,
  navigate,
  showSnackbar,
  useConfig,
  usePatient,
} from '@openmrs/esm-framework';
import {
  Button,
  ButtonSet,
  Column,
  Dropdown,
  Form,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { TrashCan } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type z } from 'zod';

import { Autosuggest } from '../autosuggest/autosuggest.component';
import { getBillUuidFromSaveResponse, getInvoiceUrl } from '../helpers';
import useBillableServices from '../hooks/useBillableServices';
import { billingFormSchema, processBillItems } from '../billing.resource';
import { type BillingService } from '../types';
import { type BillingConfig } from '../config-schema';

import styles from './billing-form.scss';

type BillingFormProps = {
  patientUuid: string;
  onSuccess?: () => void;
  workspaceTitle?: string;
  /** Renders patient-header-slot when true. Default false. */
  showPatientHeader?: boolean;
  /** When set, called on Discard instead of closing the workspace. */
  onDiscard?: () => void;
  /** After a successful save, navigate to the bill URL using the API response uuid. */
  navigateToBillAfterSave?: boolean;
};

type FormType = z.infer<typeof billingFormSchema>;
type BillingServicePrice = BillingService['servicePrices'][number];

const matchesBillableServiceSearch = (service: BillingService, searchText: string) => {
  const normalizedSearchText = searchText.trim().toLocaleLowerCase();
  return [service.name, service.shortName].some((value) => value?.toLocaleLowerCase().includes(normalizedSearchText));
};

const resolveDefaultServicePrice = (
  service: BillingService | undefined,
  defaultPaymentMethodName?: string,
): BillingServicePrice | undefined => {
  if (service?.servicePrices?.length !== 1) {
    return undefined;
  }

  const normalizedConfiguredDefaultPaymentMethod = defaultPaymentMethodName?.trim().toLowerCase();

  return (
    service.servicePrices.find(
      (price) => price.paymentMode?.name?.trim().toLowerCase() === normalizedConfiguredDefaultPaymentMethod,
    ) ?? service.servicePrices[0]
  );
};

const BillingForm: React.FC<Workspace2DefinitionProps<BillingFormProps>> = ({ closeWorkspace, workspaceProps }) => {
  const { t } = useTranslation();
  const patientUuidProp = workspaceProps?.patientUuid;
  const onSuccess = workspaceProps?.onSuccess;
  const workspaceTitle = workspaceProps?.workspaceTitle;
  const showPatientHeader = workspaceProps?.showPatientHeader === true;
  const onDiscardProp = workspaceProps?.onDiscard;
  const navigateToBillAfterSave = workspaceProps?.navigateToBillAfterSave === true;
  const patientUuid = patientUuidProp;
  const { patient } = usePatient(patientUuid);
  const { billableServices, error, isLoading } = useBillableServices();
  const [searchTermValue, setSearchTermValue] = useState('');
  const { cashPointUuid, cashierUuid, defaultPaymentMethodName } = useConfig<BillingConfig>();

  const form = useForm<FormType>({
    resolver: zodResolver(billingFormSchema),
    defaultValues: {
      cashPoint: cashPointUuid,
      cashier: cashierUuid,
      patient: patientUuid,
      status: 'PENDING',
      lineItems: [],
      payments: [],
    },
  });

  const onSubmit = async (values: FormType) => {
    try {
      const payload = { ...values };
      const response = await processBillItems(payload);
      void mutate(
        (key) => typeof key === 'string' && key.startsWith('/ws/rest/v1/cashier/bill'),
      );
      showSnackbar({
        title: t('billItems', 'Save Bill'),
        subtitle: 'Bill processing has been successful',
        kind: 'success',
        timeoutInMs: 3000,
      });
      const billUuid = getBillUuidFromSaveResponse(response);
      if (navigateToBillAfterSave && billUuid && patientUuid) {
        navigate({ to: getInvoiceUrl(patientUuid, billUuid) });
      }
      onSuccess?.();
      closeWorkspace({ discardUnsavedChanges: true });
    } catch (e) {
      showSnackbar({ title: 'Bill processing error', kind: 'error', subtitle: e });
    }
  };

  const handleDiscard = () => {
    if (onDiscardProp) {
      onDiscardProp();
      return;
    }
    closeWorkspace({ discardUnsavedChanges: true });
  };

  const handleSearch = async (searchText: string) => {
    setSearchTermValue(searchText);
    return billableServices.filter(
      (service) =>
        matchesBillableServiceSearch(service, searchText) &&
        lineItemsToWatch.findIndex((item) => item.billableService === service?.uuid) === -1,
    );
  };

  const lineItemsToWatch = form.watch('lineItems');

  const handleSuggestionSelected = (field: string, value: string) => {
    if (value) {
      const selectedService = billableServices.find((service) => service.uuid === value);
      const defaultServicePrice = resolveDefaultServicePrice(selectedService, defaultPaymentMethodName);

      form.setValue('lineItems', [
        ...lineItemsToWatch,
        {
          billableService: value,
          lineItemOrder: 0,
          quantity: 1,
          price: defaultServicePrice?.price ?? 0,
          paymentStatus: 'PENDING',
          priceName: defaultServicePrice?.name ?? 'Default',
          priceUuid: defaultServicePrice?.uuid ?? '',
        },
      ]);
    }
    setSearchTermValue('');
  };

  const handleError = (errors: any) => {
    console.error('errors', errors);
    showSnackbar({ title: t('error', 'Error'), kind: 'error', subtitle: JSON.stringify(errors) });
  };

  return (
    <Workspace2 title={workspaceTitle ?? t('billingForm', 'Billing Form')}>
      <Form onSubmit={form.handleSubmit(onSubmit, handleError)}>
        {showPatientHeader && patient && patientUuid ? (
          <ExtensionSlot
            name="patient-header-slot"
            state={{
              patient,
              patientUuid,
              hideActionsOverflow: true,
            }}
          />
        ) : null}
        <Stack gap={4} className={styles.grid}>
          <Column>
            <Autosuggest
              value={searchTermValue}
              onClear={() => setSearchTermValue('')}
              getDisplayValue={(item: BillingService) => item.name}
              getFieldValue={(item: BillingService) => item.uuid}
              getSearchResults={handleSearch}
              onSuggestionSelected={handleSuggestionSelected}
              labelText={t('search', 'Search')}
              placeholder={t('searchPlaceHolder', 'Find your billables here...')}
            />
          </Column>
          <Column className={styles.billingItem}>
            <Table aria-label="sample table">
              <TableHead>
                <TableRow>
                  <TableHeader>{t('item', 'Item')}</TableHeader>
                  <TableHeader>{t('quantity', 'Quantity')}</TableHeader>
                  <TableHeader>{t('paymentMethod', 'Payment method')}</TableHeader>
                  <TableHeader>{t('price', 'Price')}</TableHeader>
                  <TableHeader>{t('total', 'Total')}</TableHeader>
                  <TableHeader></TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineItemsToWatch.map(({ billableService, quantity, price }, index) => {
                  const service = billableServices.find((serv) => serv.uuid === billableService);
                  return (
                    <TableRow key={billableService}>
                      <TableCell>{service?.name}</TableCell>
                      <TableCell>
                        <Controller
                          control={form.control}
                          name={`lineItems.${index}.quantity` as any}
                          render={({ field }) => (
                            <input
                              ref={field.ref}
                              value={field.value}
                              onChange={({ target: { value } }) => {
                                field.onChange(value);
                              }}
                              type="number"
                              className="form-control"
                              id={billableService}
                              min={1}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          control={form.control}
                          name={`lineItems.${index}.priceUuid`}
                          render={({ field }) => (
                            <Dropdown
                              autoAlign
                              className={styles.paymentMethodDropdown}
                              hideLabel
                              ref={field.ref}
                              invalid={form.formState.errors[field.name]?.message}
                              invalidText={form.formState.errors[field.name]?.message}
                              id="priceUuid"
                              onChange={(e) => {
                                field.onChange(e.selectedItem);
                                const price = service?.servicePrices.find((p) => p.uuid === e.selectedItem)?.price;
                                form.setValue(`lineItems.${index}.price`, price ?? 0);
                              }}
                              selectedItem={field.value}
                              label={t('choosePrice', 'Choose price')}
                              titleText={t('choosePrice', 'Choose price')}
                              items={service?.servicePrices.map((r) => r.uuid) ?? []}
                              itemToString={(item) => service?.servicePrices.find((r) => r.uuid === item)?.name ?? ''}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell id={service?.name + 'Price'}>{price}</TableCell>
                      <TableCell id={service?.name + 'Total'}>{price * quantity}</TableCell>
                      <TableCell id={service?.name + 'Delete'}>
                        <Button
                          renderIcon={TrashCan}
                          iconDescription={t('delete', 'Delete')}
                          kind="danger"
                          hasIconOnly
                          onClick={() => {
                            form.setValue(
                              'lineItems',
                              lineItemsToWatch.filter((item) => item.billableService !== billableService),
                            );
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>

                  <TableCell style={{ fontWeight: 'bold' }}>{t('grandTotal', 'Grand Total')}:</TableCell>
                  <TableCell id="GrandTotalSum">
                    {lineItemsToWatch.reduce((prev, curr) => {
                      const total = curr.quantity * curr.price;
                      return prev + total;
                    }, 0)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Column>
        </Stack>

        <ButtonSet className={styles.buttonSet}>
          <Button className={styles.button} kind="secondary" type="button" onClick={handleDiscard}>
            {t('discard', 'Discard')}
          </Button>
          <Button className={styles.button} kind="primary" type="submit" disabled={form.formState.isSubmitting}>
            {t('saveAndClose', 'Save & Close')}
          </Button>
        </ButtonSet>
      </Form>
    </Workspace2>
  );
};

export default BillingForm;
