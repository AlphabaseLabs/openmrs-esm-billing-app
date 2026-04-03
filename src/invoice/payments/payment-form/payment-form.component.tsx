import React, { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Dropdown, NumberInputSkeleton, TextInput, NumberInput } from '@carbon/react';
import { useConfig } from '@openmrs/esm-framework';
import { ErrorState } from '@openmrs/esm-patient-common-lib';
import styles from './payment-form.scss';
import { usePaymentModes } from '../../../billing.resource';
import { type PaymentFormValue } from '../../../types';
import { type BillingConfig } from '../../../config-schema';

type PaymentFormProps = {
  disablePayment: boolean;
};

const PaymentForm: React.FC<PaymentFormProps> = ({ disablePayment }) => {
  const { t } = useTranslation();
  const { defaultPaymentMethodName } = useConfig<BillingConfig>();
  const {
    control,
    formState: { errors },
    setFocus,
    getValues,
    setValue,
  } = useFormContext<PaymentFormValue>();
  const { paymentModes, isLoading, error } = usePaymentModes();

  useEffect(() => {
    if (!paymentModes?.length || disablePayment) {
      return;
    }

    const normalizedConfiguredDefaultPaymentMethod = defaultPaymentMethodName?.trim().toLowerCase();
    const defaultPaymentMethod =
      paymentModes.find((mode) => mode.name?.trim().toLowerCase() === normalizedConfiguredDefaultPaymentMethod) ??
      paymentModes.find((mode) => mode.name?.trim().toLowerCase() === 'cash') ??
      paymentModes[0] ??
      null;
    const currentMethod = getValues('payment.0.method');

    if (!currentMethod && defaultPaymentMethod) {
      setValue('payment.0.method', defaultPaymentMethod, { shouldValidate: true });
    }
  }, [defaultPaymentMethodName, disablePayment, getValues, paymentModes, setValue]);

  const shouldShowReferenceCode = (index: number) => {
    const formValues = getValues();
    const attributes = formValues?.payment?.[index]?.method?.attributeTypes ?? [];
    return attributes.some((attribute) => attribute.required) || attributes?.length > 0;
  };

  if (isLoading) {
    return <NumberInputSkeleton />;
  }

  if (error) {
    return (
      <div className={styles.errorPaymentContainer}>
        <ErrorState headerTitle={t('errorLoadingPaymentModes', 'Payment modes error')} error={error} />
      </div>
    );
  }

  if (disablePayment) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.paymentMethodContainer}>
        <Controller
          control={control}
          name="payment.0.method"
          render={({ field }) => (
            <Dropdown
              id="paymentMethod"
              selectedItem={field.value ?? null}
              onChange={({ selectedItem }) => {
                setFocus('payment.0.amount');
                field.onChange(selectedItem);
              }}
              titleText={t('paymentMethod', 'Payment method')}
              label={t('selectPaymentMethod', 'Select payment method')}
              items={paymentModes}
              itemToString={(item) => (item ? item.name : '')}
              invalid={!!errors?.payment?.[0]?.method}
              invalidText={errors?.payment?.[0]?.method?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="payment.0.amount"
          render={({ field }) => (
            <NumberInput
              allowEmpty
              disableWheel
              hideSteppers
              id="paymentAmount"
              onChange={(_, { value }) => {
                const nextValue = value === '' || value === undefined ? undefined : Number(value);
                field.onChange(nextValue);
              }}
              invalid={!!errors?.payment?.[0]?.amount}
              invalidText={errors?.payment?.[0]?.amount?.message}
              label={t('amount', 'Amount')}
              placeholder={t('enterAmount', 'Enter amount')}
              value={field.value ?? ''}
            />
          )}
        />
        {shouldShowReferenceCode(0) && (
          <Controller
            name="payment.0.referenceCode"
            control={control}
            render={({ field }) => (
              <TextInput
                id="paymentReferenceCode"
                labelText={t('referenceNumber', 'Reference number')}
                placeholder={t('enterReferenceNumber', 'Enter ref. number')}
                type="text"
                name={field.name}
                onBlur={field.onBlur}
                onChange={field.onChange}
                value={field.value ?? ''}
                invalid={!!errors?.payment?.[0]?.referenceCode}
                invalidText={errors?.payment?.[0]?.referenceCode?.message}
              />
            )}
          />
        )}
      </div>
    </div>
  );
};

export default PaymentForm;
