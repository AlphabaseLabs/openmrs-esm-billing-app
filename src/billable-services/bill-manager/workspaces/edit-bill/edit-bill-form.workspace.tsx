import React, { useEffect } from 'react';
import { mutate } from 'swr';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Controller, type SubmitHandler, useForm, useWatch } from 'react-hook-form';
import {
  Button,
  ComboBox,
  ButtonSet,
  ContentSwitcher,
  Dropdown,
  Form,
  NumberInput,
  InlineLoading,
  InlineNotification,
  Switch,
  TextArea,
  TextInput,
  FormLabel,
} from '@carbon/react';
import {
  type DefaultWorkspaceProps,
  ResponsiveWrapper,
  restBaseUrl,
  showSnackbar,
  useLayoutType,
} from '@openmrs/esm-framework';
import { useProviderOptions, type ProviderOption } from '../../../../payment-points/payment-points.resource';

import { type LineItem, type MappedBill } from '../../../../types';
import { processBillPayment } from '../../../../billing.resource';
import { formatCurrencySimple } from '../../../../helpers/currency';
import styles from './edit-bill.scss';
import { createEditBillPayload } from './edit-bill-util';
import classNames from 'classnames';
import {
  type EditBillFormData,
  getDiscountSponsorFromLineItem,
  useDefaultEditBillFormValues,
  useEditBillFormSchema,
  useFormInitialValues,
} from './useEditBillFormSchema';
const DISCOUNT_METHODS = { PERCENTAGE: 'percentage', FIXED: 'fixed' } as const;

type EditBillFormProps = DefaultWorkspaceProps & { lineItem: LineItem; bill: MappedBill };

export const EditBillForm: React.FC<EditBillFormProps> = ({
  lineItem,
  closeWorkspace,
  bill,
  promptBeforeClosing,
  closeWorkspaceWithSavedChanges,
}) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const editBillFormSchema = useEditBillFormSchema();
  const defaultValues = useDefaultEditBillFormValues(lineItem, bill);
  const { selectedServicePrice, isLoadingServices, selectedBillableService } = useFormInitialValues(lineItem);
  const { providerOptions, isLoading: isLoadingProviders } = useProviderOptions();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useForm<EditBillFormData>({
    defaultValues,
    resolver: zodResolver(editBillFormSchema),
    mode: 'all',
  });

  useEffect(() => {
    promptBeforeClosing(() => isDirty);
  }, [isDirty, promptBeforeClosing]);

  const sponsorUuid = getDiscountSponsorFromLineItem(lineItem);
  useEffect(() => {
    if (!sponsorUuid || !providerOptions.length) return;
    const match = providerOptions.find((p) => p.uuid === sponsorUuid);
    if (match) setValue('provider', match, { shouldDirty: false });
  }, [sponsorUuid, providerOptions, setValue]);

  const watchedPrice = useWatch({ control, name: 'price', defaultValue: defaultValues.price });
  const watchedQuantity = useWatch({ control, name: 'quantity', defaultValue: defaultValues.quantity });
  const watchedDiscountValue = useWatch({ control, name: 'discountValue', defaultValue: defaultValues.discountValue });
  const discountMethod = useWatch({ control, name: 'discountMethod', defaultValue: defaultValues.discountMethod }) ?? DISCOUNT_METHODS.PERCENTAGE;

  const subtotal = (parseFloat(watchedPrice ?? '0') || 0) * (parseInt(watchedQuantity ?? '0', 10) || 0);
  const discountAmount =
    discountMethod === DISCOUNT_METHODS.PERCENTAGE
      ? subtotal * ((parseFloat(String(watchedDiscountValue ?? 0)) || 0) / 100)
      : parseFloat(String(watchedDiscountValue ?? 0)) || 0;

  const onSubmit: SubmitHandler<EditBillFormData> = async (formData) => {
    const updateBill = createEditBillPayload(lineItem, formData, bill, formData.adjustmentReason);
    try {
      const response = await processBillPayment(updateBill, bill.uuid);
      if (response.ok) {
        showSnackbar({
          title: t('billUpdate', 'Bill update'),
          subtitle: t('billUpdateSuccess', 'Bill update was successful'),
          kind: 'success',
          timeoutInMs: 5000,
        });
      }
    } catch (error) {
      showSnackbar({
        title: t('billUpdate', 'Bill update'),
        subtitle: t('billUpdateError', 'An error occurred while updating the bill'),
        kind: 'error',
        timeoutInMs: 5000,
      });
    } finally {
      mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/cashier/bill`), undefined, {
        revalidate: true,
      });
      closeWorkspaceWithSavedChanges();
    }
  };

  if (isLoadingServices) {
    return <InlineLoading description={t('loading', 'Loading')} />;
  }

  const formattedPrice = formatCurrencySimple(lineItem.price);

  const subtitleText = `${t('currentPriceAndQuantity', 'Current price and quantity')}: ${t(
    'price',
    'Price',
  )}: ${formattedPrice} ${t('quantity', 'Quantity')}: ${lineItem.quantity}`;

  return (
    <Form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.formContainer}>
        <InlineNotification
          title={lineItem.billableService?.split(':')[1]}
          subtitle={subtitleText}
          kind="info"
          lowContrast
          hideCloseButton
        />
        <ResponsiveWrapper>
          <Controller
            control={control}
            name="price"
            render={({ field }) => (
              <ComboBox
                id={`${field.name}-${field.value}`}
                onChange={({ selectedItem }) => {
                  if (selectedItem) {
                    field.onChange(selectedItem?.price?.toString());
                  }
                }}
                titleText={t('priceOption', 'Price option')}
                items={selectedBillableService?.servicePrices ?? []}
                itemToString={(item) => `${item?.name} - (${item?.price})`}
                placeholder={t('selectPrice', 'Select price')}
                initialSelectedItem={selectedServicePrice}
                disabled={isLoadingServices}
                invalid={!!errors.price}
                invalidText={errors.price?.message}
              />
            )}
          />
        </ResponsiveWrapper>
        <ResponsiveWrapper>
          <Controller
            control={control}
            name="quantity"
            render={({ field }) => (
              <NumberInput
                {...field}
                size="md"
                label={t('quantity', 'Quantity')}
                placeholder={t('pleaseEnterQuantity', 'Please enter Quantity')}
                invalid={!!errors.quantity}
                invalidText={errors.quantity?.message}
                className={styles.formField}
                min={1}
                value={field.value}
                id={`${field.name}-${field.value}`}
                hideSteppers
                disableWheel
              />
            )}
          />
        </ResponsiveWrapper>
        <ResponsiveWrapper>
          <Controller
            control={control}
            name="provider"
            render={({ field }) => (
              <Dropdown
                id="provider"
                titleText={t('discountSponsor', 'Discount sponsor')}
                label={
                  isLoadingProviders
                    ? t('loadingProviders', 'Loading providers...')
                    : t('selectProvider', 'Select provider')
                }
                items={providerOptions}
                itemToString={(item: ProviderOption | null) => (item ? item.label : '')}
                selectedItem={field.value}
                onChange={({ selectedItem }) => field.onChange(selectedItem)}
                invalid={!!errors.provider}
                invalidText={errors.provider?.message}
                disabled={isLoadingProviders}
              />
            )}
          />
        </ResponsiveWrapper>
        <ResponsiveWrapper>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '0', alignItems: 'center' }}>
            <Controller
              control={control}
              name="discountValue"
              render={({ field }) => (
                <NumberInput
                  {...field}
                  size="md"
                  label={t('discountValue', 'Discount Value')}
                  placeholder={t('pleaseEnterDiscountValue', 'Discount Value')}
                  invalid={!!errors.discountValue}
                  invalidText={errors.discountValue?.message}
                  className={styles.formField}
                  min={0}
                  value={field.value}
                  id={`${field.name}-${field.value}`}
                  hideSteppers
                  disableWheel
                />
              )}
            />
            <ContentSwitcher
              selectedIndex={discountMethod === DISCOUNT_METHODS.PERCENTAGE ? 0 : 1}
              onChange={({ name }) => setValue('discountMethod', name as typeof DISCOUNT_METHODS.PERCENTAGE | typeof DISCOUNT_METHODS.FIXED)}
              size="md"
            >
              <Switch name={DISCOUNT_METHODS.PERCENTAGE} text={t('percentage', 'Percentage')} />
              <Switch name={DISCOUNT_METHODS.FIXED} text={t('fixedAmount', 'Value')} />
            </ContentSwitcher>
          </div>
        </ResponsiveWrapper>
        <FormLabel>
          {t('Discount', 'Discount')}: {formatCurrencySimple(discountAmount)}
        </FormLabel>
        <ResponsiveWrapper>
          <Controller
            control={control}
            name="adjustmentReason"
            render={({ field }) => (
              <TextArea
                {...field}
                labelText={t('adjustmentReason', 'Adjustment reason')}
                placeholder={t('pleaseEnterAdjustmentReason', 'Please enter adjustment reason')}
                invalid={!!errors.adjustmentReason}
                invalidText={errors.adjustmentReason?.message}
              />
            )}
          />
        </ResponsiveWrapper>
      </div>
      <ButtonSet className={classNames({ [styles.tablet]: isTablet, [styles.desktop]: !isTablet })}>
        <Button className={styles.button} kind="secondary" onClick={() => closeWorkspace()}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button className={styles.button} disabled={!isValid || !isDirty || isSubmitting} kind="primary" type="submit">
          {isSubmitting ? (
            <InlineLoading className={styles.spinner} description={t('updatingBill', 'Updating bill...')} />
          ) : (
            <span>{t('saveAndClose', 'Save & close')}</span>
          )}
        </Button>
      </ButtonSet>
    </Form>
  );
};
