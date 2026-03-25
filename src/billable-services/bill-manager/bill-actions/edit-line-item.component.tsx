import React from 'react';
import { type LineItem, type MappedBill, PaymentStatus } from '../../../types';
import { useTranslation } from 'react-i18next';
import { OverflowMenuItem } from '@carbon/react';
import { launchBillingWorkspace } from '../../../workspaces';

type EditLineItemProps = {
  lineItem: LineItem;
  bill: MappedBill;
};

const EditLineItem: React.FC<EditLineItemProps> = ({ lineItem, bill }) => {
  const { t } = useTranslation();

  if (lineItem.paymentStatus == PaymentStatus.PAID) {
    return null;
  }

  const handleOpenEditLineItemWorkspace = (lineItem: LineItem) => {
    launchBillingWorkspace('edit-bill-form', {
      lineItem,
      bill,
    });
  };
  return (
    <OverflowMenuItem itemText={t('editItem', 'Edit item')} onClick={() => handleOpenEditLineItemWorkspace(lineItem)} />
  );
};

export default EditLineItem;
