import React from 'react';
import { Button } from '@carbon/react';
import { UserHasAccess } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { Scalpel } from '@carbon/react/icons';
import { type MappedBill, PaymentStatus } from '../../../types';
import { launchBillingWorkspace } from '../../../workspaces';

type WaiveBillActionButtonProps = {
  bill: MappedBill;
};

const WaiveBillActionButton: React.FC<WaiveBillActionButtonProps> = ({ bill }) => {
  const { t } = useTranslation();

  if (bill.status === PaymentStatus.PAID) {
    return null;
  }

  const handleOpenWaiveBillWorkspace = () => {
    launchBillingWorkspace('waive-bill-form', { bill });
  };

  return (
    <UserHasAccess privilege="Manage Cashier Bills">
      <Button
        size="sm"
        onClick={handleOpenWaiveBillWorkspace}
        renderIcon={(props) => <Scalpel size={24} {...props} />}
        kind="danger--ghost"
        iconDescription="TrashCan">
        {t('waiveBill', 'Waive Bill')}
      </Button>
    </UserHasAccess>
  );
};

export default WaiveBillActionButton;
