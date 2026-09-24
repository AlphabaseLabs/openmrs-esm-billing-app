import React from 'react';
import { ExtensionSlot, WorkspaceContainer } from '@openmrs/esm-framework';
import PatientBills from './patient-bills.component';
import styles from './bill-manager.scss';
import { EmptyState } from '@openmrs/esm-patient-common-lib';
import { useTranslation } from 'react-i18next';
import BillingHeader from '../../billing-header/billing-header.component';
import { usePatientBills } from '../../prompt-payment/prompt-payment.resource';

interface BillManagerProps {
  showHeader?: boolean;
}

const BillManager: React.FC<BillManagerProps> = ({ showHeader = true }) => {
  const [patientUuid, setPatientUuid] = React.useState<string>(undefined);
  const { t } = useTranslation();
  const { patientBills: bills, isLoading } = usePatientBills(patientUuid);
  const filteredBills = bills.filter((bill) => patientUuid === bill.patientUuid) ?? [];

  return (
    <>
      {showHeader ? <BillingHeader title={t('billManager', 'Bill Manager')} /> : null}
      <div className={styles.billManagerContainer}>
        <ExtensionSlot
          name="patient-search-bar-slot"
          state={{
            selectPatientAction: (patientUuid: string) => setPatientUuid(patientUuid),
            buttonProps: {
              kind: 'primary',
            },
          }}
        />
        {!patientUuid ? (
          <div className={styles.emptyStateContainer}>
            <EmptyState
              displayText={t('notSearchedState', 'Please search for a patient in the input above')}
              headerTitle="Not Searched"
            />
          </div>
        ) : (
          <PatientBills bills={filteredBills} isLoading={isLoading} />
        )}
      </div>
      <WorkspaceContainer overlay contextKey="bill-manager" />
    </>
  );
};

export default BillManager;
