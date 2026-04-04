import { InlineLoading } from '@carbon/react';
import { ExtensionSlot, usePatient } from '@openmrs/esm-framework';
import { ErrorState } from '@openmrs/esm-patient-common-lib';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useBill } from '../billing.resource';
import BillDetails from './bill-details.component';
import styles from './invoice.scss';

const Invoice: React.FC = () => {
  const { t } = useTranslation();
  const { billUuid, patientUuid } = useParams();
  const { patient, isLoading: isLoadingPatient, error: patientError } = usePatient(patientUuid);
  const { bill, isLoading: isLoadingBill, error: billingError } = useBill(billUuid);

  if (isLoadingPatient || isLoadingBill) {
    return (
      <div className={styles.invoiceContainer}>
        <InlineLoading
          className={styles.loader}
          status="active"
          iconDescription="Loading"
          description="Loading patient header..."
        />
      </div>
    );
  }

  if (billingError || patientError) {
    return (
      <div className={styles.errorContainer}>
        <ErrorState headerTitle={t('invoiceError', 'Invoice error')} error={billingError ?? patientError} />
      </div>
    );
  }

  return (
    <div className={styles.invoiceContainer}>
      {patient && patientUuid && <ExtensionSlot name="patient-header-slot" state={{ patient, patientUuid }} />}
      <BillDetails bill={bill} isLoadingBill={isLoadingBill} />
    </div>
  );
};

export default Invoice;
