import React, { useRef, useState } from 'react';
import { Button } from '@carbon/react';
import { Add, Receipt } from '@carbon/react/icons';
import { navigate, showSnackbar, useConfig } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { mutate } from 'swr';
import { type BillingConfig } from './config-schema';
import { processBillItems } from './billing.resource';
import useOpenPatientBill, { fetchOpenPatientBill } from './hooks/useOpenPatientBill';
import { getBillUuidFromSaveResponse, getInvoiceUrl } from './helpers';

interface CreateEmptyBillButtonProps {
  patientUuid: string;
  size?: 'sm' | 'lg';
  className?: string;
  onSuccess?: () => void;
  createBillLabel?: string;
  showIcon?: boolean;
  checkExistingBill?: boolean;
}

const CreateEmptyBillButton: React.FC<CreateEmptyBillButtonProps> = ({
  patientUuid,
  size = 'sm',
  className,
  onSuccess,
  createBillLabel,
  showIcon = true,
  checkExistingBill = false,
}) => {
  const { t } = useTranslation();
  const { cashPointUuid, cashierUuid } = useConfig<BillingConfig>();
  const {
    bill: existingBill,
    isLoading: isCheckingBill,
    error: lookupError,
  } = useOpenPatientBill(patientUuid, checkExistingBill);
  const pending = useRef(false);
  const [isCreating, setIsCreating] = useState(false);

  const createBill = async () => {
    if (pending.current || !patientUuid) return;
    pending.current = true;
    setIsCreating(true);
    const referrer = window.location.pathname;
    try {
      if (checkExistingBill) {
        // Recheck on click so another action cannot leave the search result offering stale creation.
        const openBill = await fetchOpenPatientBill(patientUuid);
        if (openBill) {
          navigate({ to: getInvoiceUrl(patientUuid, openBill.uuid, referrer) });
          onSuccess?.();
          return;
        }
      }
      const response = await processBillItems({
        patient: patientUuid,
        cashPoint: cashPointUuid,
        cashier: cashierUuid,
        status: 'PENDING',
        lineItems: [],
        payments: [],
      });
      const billUuid = getBillUuidFromSaveResponse(response);
      if (!response.ok || !billUuid) throw new Error('Bill creation did not return a bill');
      void mutate((key) => typeof key === 'string' && key.startsWith('/ws/rest/v1/cashier/bill'));
      window.dispatchEvent(new CustomEvent('openmrs:active-visits-billing-refresh'));
      window.dispatchEvent(new CustomEvent('openmrs:active-visits-refresh'));
      navigate({ to: getInvoiceUrl(patientUuid, billUuid, referrer) });
      onSuccess?.();
    } catch (error) {
      showSnackbar({
        title: t('billCreationError', 'Unable to create bill'),
        subtitle: t('billCreationRetry', 'Please try again.'),
        kind: 'error',
      });
    } finally {
      pending.current = false;
      setIsCreating(false);
    }
  };

  return (
    <Button
      className={className}
      kind="tertiary"
      size={size}
      renderIcon={showIcon ? (existingBill ? Receipt : Add) : undefined}
      disabled={isCreating || (checkExistingBill && isCheckingBill)}
      onClick={createBill}>
      {checkExistingBill && (isCheckingBill || isCreating)
        ? t('openingBill', 'Opening bill…')
        : isCreating
          ? t('creatingBill', 'Creating bill…')
          : existingBill
            ? t('processBill', 'Process bill')
            : lookupError
              ? t('retryBillLookup', 'Retry bill lookup')
              : (createBillLabel ?? t('createBill', 'Create bill'))}
    </Button>
  );
};

export default CreateEmptyBillButton;
