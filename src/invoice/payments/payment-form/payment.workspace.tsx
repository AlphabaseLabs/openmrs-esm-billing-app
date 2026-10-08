import React from 'react';
import { useTranslation } from 'react-i18next';
import { type LineItem, type MappedBill, PaymentStatus } from '../../../types';
import styles from './payment.scss';
import { Stack, TextInput, Button, ButtonSet, InlineLoading, Dropdown } from '@carbon/react';
import {
  ResponsiveWrapper,
  Workspace2,
  type Workspace2DefinitionProps,
  showSnackbar,
  useConfig,
  useLayoutType,
} from '@openmrs/esm-framework';
import classNames from 'classnames';
import { Controller } from 'react-hook-form';
import { addPaymentToBill, createPendingPayment, usePaymentModes } from '../../../billing.resource';
import { type BillingConfig } from '../../../config-schema';
import { usePaymentForm } from './use-payment-form';
import { type z } from 'zod';
import { mutate } from 'swr';
import { convertToCurrency } from '../../../helpers';
import { createLineItemAllocationBuilder } from '../ai-payments.integration';
import { getActiveBillingRecords } from '../../../billing-voided-utils';
import { extractErrorMessagesFromResponse } from '../../../utils';

type PaymentWorkspaceProps = {
  bill: MappedBill;
  selectedLineItems?: Array<LineItem>;
};

const PaymentWorkspace: React.FC<Workspace2DefinitionProps<PaymentWorkspaceProps>> = ({
  workspaceProps,
  closeWorkspace,
}) => {
  const { t } = useTranslation();
  const { insurancePaymentMethod } = useConfig<BillingConfig>();
  const { bill, selectedLineItems = [] } = workspaceProps ?? ({} as PaymentWorkspaceProps);
  const isTablet = useLayoutType() === 'tablet';
  const translationWrapper = (key: string, defaultValue?: string) => t(key, defaultValue);
  const { formMethods, paymentSchema } = usePaymentForm(translationWrapper, bill.balance);

  type PaymentFormData = z.infer<typeof paymentSchema>;

  const { paymentModes, isLoading: isLoadingPaymentModes } = usePaymentModes();

  const {
    formState: { isSubmitting, errors },
    control,
    handleSubmit,
  } = formMethods;

  const onSubmit = async (data: PaymentFormData) => {
    const isInsurance = Boolean(insurancePaymentMethod && data.instanceType?.uuid === insurancePaymentMethod);
    const selectedUnpaidLineItems = getActiveBillingRecords(selectedLineItems).filter(
      (item) => item.paymentStatus !== PaymentStatus.PAID,
    );
    const allocations = isInsurance
      ? []
      : createLineItemAllocationBuilder(selectedUnpaidLineItems)(data.amountTendered);
    const payment = {
      instanceType: data.instanceType?.uuid,
      amount: data.amountTendered,
      amountTendered: data.amountTendered,
      attributes: data.attributes
        ? Object.entries(data.attributes).map(([uuid, value]) => ({
            attributeType: {
              uuid,
            },
            value,
          }))
        : [],
      ...(allocations.length ? { allocations } : {}),
    };

    try {
      const referenceCode = data.instanceType?.attributeTypes
        ?.map(({ uuid }) => data.attributes?.[uuid]?.trim())
        .find(Boolean);
      const response = isInsurance
        ? await createPendingPayment(bill.uuid, {
            paymentMode: data.instanceType.uuid,
            amount: data.amountTendered,
            amountTendered: data.amountTendered,
            referenceCode,
          })
        : await addPaymentToBill(bill.uuid, payment);
      if (response.ok) {
        showSnackbar({
          title: t('paymentSaved', 'Payment saved'),
          kind: 'success',
          subtitle: t('paymentSavedSuccessfully', 'Payment saved successfully'),
        });
      }
      const url = `/ws/rest/v1/cashier/bill/${bill.uuid}`;
      mutate((key) => typeof key === 'string' && key.startsWith(url), undefined, { revalidate: true });
      closeWorkspace({ discardUnsavedChanges: true });
    } catch (error: any) {
      showSnackbar({
        title: t('errorSavingPayment', 'Error saving payment'),
        kind: 'error',
        subtitle: error?.responseBody
          ? extractErrorMessagesFromResponse(error.responseBody)
          : error instanceof Error
            ? error.message
            : t('errorSavingPaymentFallback', 'Unable to save payment'),
      });
    }
  };

  const handleError = (error: any) => {
    showSnackbar({
      title: t('errorSavingPayment', 'Error generating payment'),
      kind: 'error',
      subtitle: JSON.stringify(error, null, 2),
    });
  };

  if (isLoadingPaymentModes) {
    return (
      <Workspace2
        title={t('additionalPayment', 'Additional Payment (Balance {{billBalance}})', {
          billBalance: convertToCurrency(bill.balance),
        })}
        hasUnsavedChanges={formMethods.formState.isDirty}>
        <InlineLoading status="active" iconDescription="Loading payment modes" />
      </Workspace2>
    );
  }

  const attributeTypes = (formMethods.watch('instanceType')?.attributeTypes as Array<Record<string, string>>) || [];

  return (
    <Workspace2
      title={t('additionalPayment', 'Additional Payment (Balance {{billBalance}})', {
        billBalance: convertToCurrency(bill.balance),
      })}
      hasUnsavedChanges={formMethods.formState.isDirty}>
      <form onSubmit={handleSubmit(onSubmit, handleError)} className={styles.form}>
        <div className={styles.formContainer}>
          <Stack className={styles.formStackControl} gap={7}>
            <ResponsiveWrapper>
              <Stack gap={4}>
                <Controller
                  name="instanceType"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      {...field}
                      id="instanceType"
                      titleText={t('instanceType', 'Instance Type')}
                      label={t('selectInstanceType', 'Select instance type')}
                      items={paymentModes}
                      onChange={({ selectedItem }) => field.onChange(selectedItem)}
                      itemToString={(item) => (item ? item.name : '')}
                      invalid={!!errors.instanceType}
                      invalidText={errors.instanceType?.message}
                    />
                  )}
                />
              </Stack>
            </ResponsiveWrapper>
            <ResponsiveWrapper>
              <Controller
                name="amountTendered"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    id="amountTendered"
                    value={field.value ?? ''}
                    labelText={t('amountTendered', 'Amount Tendered')}
                    placeholder={t('enterAmountTendered', 'Enter amount tendered, max is {{max}}', {
                      max: bill.balance,
                    })}
                    type="number"
                    step="0.01"
                    max={bill.balance}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    invalid={!!errors.amountTendered}
                    invalidText={errors.amountTendered?.message}
                  />
                )}
              />
            </ResponsiveWrapper>
            <ResponsiveWrapper>
              {attributeTypes.map((attributeType) => (
                <Controller
                  key={attributeType.uuid}
                  name={`attributes.${attributeType.uuid}`}
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      id={attributeType.uuid}
                      value={field.value ?? ''}
                      labelText={`${attributeType.name || 'Attribute'}${
                        attributeType.required ? t('required', ' (Required)') : ''
                      }`}
                      placeholder={attributeType.description || 'Enter value'}
                      invalid={!!errors.attributes?.[attributeType.uuid] || (attributeType.required && !field.value)}
                      invalidText={
                        errors.attributes?.[attributeType.uuid]?.message ||
                        (attributeType.required && !field.value
                          ? t('attributeValueRequired', 'Attribute value is required')
                          : '')
                      }
                    />
                  )}
                />
              ))}
            </ResponsiveWrapper>
          </Stack>
        </div>
        <ButtonSet className={classNames({ [styles.tablet]: isTablet, [styles.desktop]: !isTablet })}>
          <Button style={{ maxWidth: '50%' }} kind="secondary" onClick={() => closeWorkspace()}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button
            disabled={isSubmitting || Object.keys(errors).length > 0}
            style={{ maxWidth: '50%' }}
            kind="primary"
            type="submit">
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
    </Workspace2>
  );
};

export default PaymentWorkspace;
