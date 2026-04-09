import { InlineLoading } from '@carbon/react';
import { ExtensionSlot, usePatient } from '@openmrs/esm-framework';
import { ErrorState } from '@openmrs/esm-patient-common-lib';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';
import { useBill } from '../billing.resource';
import { getInvoiceDiscardDestinationFromSearch } from '../helpers';
import BillDetails from './bill-details.component';
import styles from './invoice.scss';

interface InvoiceProps {
  readonly showPatientHeader?: boolean;
  readonly showDiscardButton?: boolean;
}

const Invoice: React.FC<InvoiceProps> = ({ showPatientHeader = true, showDiscardButton = true }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { billUuid, patientUuid } = useParams();
  const { patient, isLoading: isLoadingPatient, error: patientError } = usePatient(patientUuid);
  const { bill, isLoading: isLoadingBill, error: billingError } = useBill(billUuid);
  const isLoadingInvoice = isLoadingBill || (showPatientHeader && isLoadingPatient);
  const invoiceError = billingError ?? (showPatientHeader ? patientError : undefined);
  const discardDestination = getInvoiceDiscardDestinationFromSearch(location.search);

  if (isLoadingInvoice) {
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

  if (invoiceError) {
    return (
      <div className={styles.errorContainer}>
        <ErrorState headerTitle={t('invoiceError', 'Invoice error')} error={invoiceError} />
      </div>
    );
  }

  return (
    <div className={styles.invoiceContainer}>
      {showPatientHeader && patient && patientUuid ? (
        <ExtensionSlot name="patient-header-slot" state={{ patient, patientUuid }} />
      ) : null}
      <BillDetails
        bill={bill}
        isLoadingBill={isLoadingBill}
        showDiscardButton={showDiscardButton}
        discardDestination={discardDestination}
      />
    </div>
  );
};

export default Invoice;
