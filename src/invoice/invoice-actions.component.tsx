import React from 'react';
import { Button, Tooltip } from '@carbon/react';
import { showModal, UserHasAccess } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { type MappedBill, PaymentStatus } from '../types';
import { launchBillingWorkspace } from '../workspaces';
import styles from './invoice.scss';

interface InvoiceActionsProps {
  readonly bill: MappedBill;
}

export function InvoiceActions({ bill }: InvoiceActionsProps) {
  const { t } = useTranslation();
  const hasLineItems = Boolean(bill?.lineItems?.length);
  const closeAction = bill?.closed ? 'reopen' : 'close';
  const closeActionLabel = bill?.closed ? t('reopenBill', 'Reopen bill') : t('closeBill', 'Close bill');
  const isCloseDisabled = !hasLineItems || (!bill?.closed && bill?.balance !== 0);
  const closeDisabledReason = !hasLineItems
    ? t('billActionsRequireLineItems', 'Bills without line items cannot be closed or reopened.')
    : t('closeBillRequiresZeroBalance', 'The bill balance must be zero before it can be closed.');

  const launchBillActionModal = () => {
    const dispose = showModal('bill-action-modal', {
      closeModal: () => dispose(),
      bill,
      action: closeAction,
    });
  };
  const launchDeleteBillModal = () => {
    const dispose = showModal('delete-bill-modal', {
      bill,
      isForceDelete: true,
      onClose: () => dispose(),
    });
  };

  const closeButton = (
    <Button kind="ghost" size="sm" disabled={isCloseDisabled} onClick={launchBillActionModal}>
      {closeActionLabel}
    </Button>
  );

  return (
    <div className={styles.billManagementActions} role="group" aria-label={t('billActions', 'Bill actions')}>
      <UserHasAccess privilege={bill?.closed ? 'Reopen Cashier Bills' : 'Close Cashier Bills'}>
        {isCloseDisabled ? (
          <Tooltip autoAlign align="top-start" description={closeDisabledReason}>
            <span className={styles.disabledBillAction} tabIndex={0} role="group" aria-label={closeActionLabel}>
              {closeButton}
            </span>
          </Tooltip>
        ) : (
          closeButton
        )}
      </UserHasAccess>
      <UserHasAccess privilege="Manage Cashier Bills">
        {bill?.status !== PaymentStatus.PAID && (
          <Button
            kind="ghost"
            size="sm"
            disabled={!hasLineItems}
            onClick={() => launchBillingWorkspace('waive-bill-form', { bill })}>
            {t('waiveBill', 'Waive Bill')}
          </Button>
        )}
      </UserHasAccess>
      <UserHasAccess privilege="Force Delete Cashier Bills">
        <Button kind="danger--ghost" size="sm" disabled={!hasLineItems} onClick={launchDeleteBillModal}>
          {t('deleteBill', 'Delete Bill')}
        </Button>
      </UserHasAccess>
    </div>
  );
}
