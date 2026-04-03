import { Button, InlineLoading } from '@carbon/react';
import { Printer } from '@carbon/react/icons';
import { ExtensionSlot, formatDatetime, parseDate, restBaseUrl, showModal, usePatient } from '@openmrs/esm-framework';
import { ErrorState } from '@openmrs/esm-patient-common-lib';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useBill } from '../billing.resource';
import { convertToCurrency } from '../helpers';
import { type LineItem } from '../types';
import InvoiceTable from './invoice-table.component';
import styles from './invoice.scss';
import Payments from './payments/payments.component';
import { InvoiceActions } from './invoice-actions.component';

const Invoice: React.FC = () => {
  const { t } = useTranslation();
  const { billUuid, patientUuid } = useParams();
  const { patient, isLoading: isLoadingPatient, error: patientError } = usePatient(patientUuid);
  const { bill, isLoading: isLoadingBill, error: billingError } = useBill(billUuid);
  const [selectedLineItems, setSelectedLineItems] = useState<Array<LineItem>>([]);
  const paidLineItems = useMemo(
    () => bill?.lineItems?.filter((item) => item.paymentStatus === 'PAID') ?? [],
    [bill?.lineItems],
  );

  const handleSelectItem = (lineItems: Array<LineItem>) => {
    const uniqueLineItems = [...new Set([...lineItems, ...paidLineItems])];
    setSelectedLineItems(uniqueLineItems);
  };

  useEffect(() => {
    setSelectedLineItems(paidLineItems);
  }, [paidLineItems]);

  const openPrintPreview = (documentUrl: string, title: string) => {
    const dispose = showModal('print-preview-modal', {
      onClose: () => dispose(),
      title,
      documentUrl,
    });
  };

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

  const invoiceDetails = {
    [t('totalAmount', 'Total amount')]: convertToCurrency(bill?.totalAmount),
    [t('amountTendered', 'Amount tendered')]: convertToCurrency(bill?.tenderedAmount),
    [t('invoiceNumber', 'Invoice #')]: bill?.receiptNumber,
    [t('dateAndTime', 'Date and time')]: bill?.dateCreatedUnformatted
      ? formatDatetime(parseDate(bill.dateCreatedUnformatted), { mode: 'standard' })
      : '--',
    [t('invoiceStatus', 'Invoice status')]: bill?.status,
  };

  return (
    <div className={styles.invoiceContainer}>
      {patient && patientUuid && <ExtensionSlot name="patient-header-slot" state={{ patient, patientUuid }} />}
      <div className={styles.detailsContainer}>
        <section className={styles.details}>
          {Object.entries(invoiceDetails).map(([key, value]) => (
            <InvoiceDetails key={key} label={key} value={value} />
          ))}
        </section>
        <div className={styles.actionsContainer}>
          {(bill?.status === 'PAID' || bill?.tenderedAmount > 0) && (
            <Button
              kind="secondary"
              renderIcon={Printer}
              onClick={() =>
                openPrintPreview(
                  `/openmrs${restBaseUrl}/cashier/receipt?billId=${bill?.id}`,
                  `${t('receipt', 'Receipt')} ${bill?.receiptNumber}`,
                )
              }>
              {t('printReceipt', 'Print receipt')}
            </Button>
          )}
          <Button
            kind="primary"
            renderIcon={Printer}
            onClick={() =>
              openPrintPreview(
                `/openmrs${restBaseUrl}/cashier/print?documentType=invoice&billId=${bill?.id}`,
                `${t('invoice', 'Invoice')} ${bill?.receiptNumber}`,
              )
            }>
            {t('printBill', 'Print bill')}
          </Button>
          <InvoiceActions bill={bill} />
        </div>
      </div>
      <div className={styles.invoiceContent}>
        <InvoiceTable bill={bill} isLoadingBill={isLoadingBill} onSelectItem={handleSelectItem} />
        <Payments bill={bill} selectedLineItems={selectedLineItems} />
      </div>
    </div>
  );
};

function InvoiceDetails({ label, value }: { readonly label: string; readonly value: string | number }) {
  return (
    <div>
      <h1 className={styles.label}>{label}</h1>
      <span className={styles.value}>{value}</span>
    </div>
  );
}

export default Invoice;
