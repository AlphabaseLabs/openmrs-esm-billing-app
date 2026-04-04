import React, { useState } from 'react';
import { Button, IconButton, Popover, PopoverContent } from '@carbon/react';
import { Close, FolderOpen, OverflowMenuVertical, Printer, Wallet } from '@carbon/react/icons';
import { restBaseUrl, showModal, UserHasAccess } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import startCase from 'lodash-es/startCase';
import { launchBillingWorkspace } from '../workspaces';
import { type MappedBill } from '../types';
import styles from './invoice.scss';

interface InvoiceActionsProps {
  readonly bill: MappedBill;
}

export function InvoiceActions({ bill }: InvoiceActionsProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const openPrintPreview = (documentUrl: string, title: string) => {
    const dispose = showModal('print-preview-modal', {
      onClose: () => dispose(),
      title,
      documentUrl,
    });
    setIsOpen(false);
  };

  const launchBillActionModal = (action: 'close' | 'reopen') => {
    const dispose = showModal('bill-action-modal', {
      closeModal: () => dispose(),
      bill,
      action,
    });
    setIsOpen(false);
  };

  const closeAction = bill?.closed ? 'reopen' : 'close';
  const closeActionLabel = bill?.closed ? t('reopenBill', 'Reopen bill') : t('closeBill', 'Close bill');
  const closeActionIcon = bill?.closed ? FolderOpen : Close;
  const isCloseDisabled = !bill?.closed && bill?.balance !== 0;

  return (
    <Popover align="bottom-right" open={isOpen} onRequestClose={() => setIsOpen(false)}>
      <IconButton
        kind="tertiary"
        label={t('actions', 'Actions')}
        aria-label={t('actions', 'Actions')}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        size="xs"
        className={styles.actionMenuTrigger}>
        <OverflowMenuVertical size={20} />
      </IconButton>
      <PopoverContent>
        <div className={styles.actionMenuContent}>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Printer}
            className={styles.actionMenuItem}
            onClick={() =>
              openPrintPreview(
                `/openmrs${restBaseUrl}/cashier/print?documentType=billstatement&billId=${bill?.id}`,
                `${t('billStatement', 'Bill Statement')} ${bill?.receiptNumber} - ${startCase(bill?.patientName)}`,
              )
            }>
            {t('printStatement', 'Print Statement')}
          </Button>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Wallet}
            className={styles.actionMenuItem}
            onClick={() => {
              launchBillingWorkspace('payment-workspace', { bill });
              setIsOpen(false);
            }}>
            {t('additionalPayments', 'Additional payments')}
          </Button>
          <UserHasAccess privilege={bill?.closed ? 'Reopen Cashier Bills' : 'Close Cashier Bills'}>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={closeActionIcon}
              disabled={isCloseDisabled}
              className={styles.actionMenuItem}
              onClick={() => launchBillActionModal(closeAction)}>
              {closeActionLabel}
            </Button>
          </UserHasAccess>
        </div>
      </PopoverContent>
    </Popover>
  );
}
