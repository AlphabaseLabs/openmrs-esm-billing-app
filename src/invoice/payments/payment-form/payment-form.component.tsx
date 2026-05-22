import React from 'react';
import { Controller, useFormContext, useWatch, type FieldArrayWithId } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Dropdown, NumberInputSkeleton, TextInput, NumberInput } from '@carbon/react';
import { ErrorState } from '@openmrs/esm-patient-common-lib';
import styles from './payment-form.scss';
import { type PaymentFormValue, type PaymentMethod } from '../../../types';
import { PaymentRowRemoveAction } from '../ai-payments.integration';

type PaymentFormProps = {
  disablePayment: boolean;
  fields: Array<FieldArrayWithId<PaymentFormValue, 'payment', 'id'>>;
  isLoading: boolean;
  error: Error | null | undefined;
  onRemovePaymentRow: (index: number) => void;
  paymentModes: Array<PaymentMethod>;
};

const PaymentForm: React.FC<PaymentFormProps> = ({
  disablePayment,
  error,
  fields,
  isLoading,
  onRemovePaymentRow,
  paymentModes,
}) => {
  const { t } = useTranslation();
  const {
    control,
    formState: { errors },
    setFocus,
  } = useFormContext<PaymentFormValue>();
  const paymentRows = useWatch({
    control,
    name: 'payment',
  });

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
      {fields.map((formField, index) => {
        const showReferenceCode = Boolean(paymentRows?.[index]?.method?.attributeTypes?.length);

        return (
          <div className={styles.paymentMethodContainer} key={formField.id}>
            <Controller
              control={control}
              name={`payment.${index}.method`}
              render={({ field }) => (
                <Dropdown
                  id={`paymentMethod-${index}`}
                  selectedItem={field.value ?? null}
                  onChange={({ selectedItem }) => {
                    field.onChange(selectedItem ?? null);
                    setFocus(`payment.${index}.amount`);
                  }}
                  titleText={t('paymentMethod', 'Payment method')}
                  label={t('selectPaymentMethod', 'Select payment method')}
                  items={paymentModes}
                  itemToString={(item) => item?.name ?? ''}
                  invalid={!!errors?.payment?.[index]?.method}
                  invalidText={errors?.payment?.[index]?.method?.message}
                />
              )}
            />

            <Controller
              control={control}
              name={`payment.${index}.amount`}
              render={({ field }) => (
                <NumberInput
                  allowEmpty
                  disableWheel
                  hideSteppers
                  id={`paymentAmount-${index}`}
                  onChange={(_, { value }) => {
                    field.onChange(value === '' || value === undefined ? undefined : Number(value));
                  }}
                  invalid={!!errors?.payment?.[index]?.amount}
                  invalidText={errors?.payment?.[index]?.amount?.message}
                  label={t('amount', 'Amount')}
                  placeholder={t('enterAmount', 'Enter amount')}
                  value={field.value ?? ''}
                />
              )}
            />

            {showReferenceCode ? (
              <Controller
                name={`payment.${index}.referenceCode`}
                control={control}
                render={({ field }) => (
                  <TextInput
                    id={`paymentReferenceCode-${index}`}
                    labelText={t('referenceNumber', 'Reference number')}
                    placeholder={t('enterReferenceNumber', 'Enter ref. number')}
                    type="text"
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    value={field.value ?? ''}
                    invalid={!!errors?.payment?.[index]?.referenceCode}
                    invalidText={errors?.payment?.[index]?.referenceCode?.message}
                  />
                )}
              />
            ) : (
              <div className={styles.referenceCodePlaceholder} />
            )}

            <div className={styles.paymentRowActions}>
              {fields.length > 1 ? <PaymentRowRemoveAction index={index} onRemove={onRemovePaymentRow} t={t} /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PaymentForm;
