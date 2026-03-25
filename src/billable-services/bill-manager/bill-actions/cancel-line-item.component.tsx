import React from 'react';
import { useTranslation } from 'react-i18next';
import { OverflowMenuItem } from '@carbon/react';
import { type LineItem, type MappedBill, PaymentStatus } from '../../../types';
import Payments from '../../../invoice/payments/payments.component';
import { launchBillingWorkspace } from '../../../workspaces';

type CancelLineItemProps = {
  lineItem: LineItem;
  bill: MappedBill;
};

const CancelLineItem: React.FC<CancelLineItemProps> = ({ lineItem, bill }) => {
  const { t } = useTranslation();

  if (lineItem.paymentStatus == PaymentStatus.PAID) {
    return null;
  }
  const handleCancelLineItemWorkspace = () => {
    launchBillingWorkspace('cancel-bill-workspace', {
      bill,
      lineItem,
    });
  };

  return <OverflowMenuItem itemText={t('cancelItem', 'Cancel item')} onClick={handleCancelLineItemWorkspace} />;
};

export default CancelLineItem;
