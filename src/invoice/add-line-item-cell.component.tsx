import React, { useMemo, useRef, useState } from 'react';
import { showSnackbar } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { addBillLineItem } from '../billing.resource';
import { type BillingService, type LineItem, type MappedBill } from '../types';
import { EditableBillItemCell, type ActiveEditorKey } from './editable-line-item-cells';

interface AddLineItemCellProps {
  bill: MappedBill;
  draftId: string;
  billableServices: Array<BillingService>;
  activeEditorKey: ActiveEditorKey;
  setActiveEditorKey: (key: ActiveEditorKey) => void;
  onLineItemUpdated?: (lineItem: LineItem) => void;
  onRefreshBill?: () => unknown;
  onAdded: () => void;
  onSavingChange: (isSaving: boolean) => void;
}

const AddLineItemCell: React.FC<AddLineItemCellProps> = ({
  bill,
  draftId,
  billableServices,
  activeEditorKey,
  setActiveEditorKey,
  onLineItemUpdated,
  onRefreshBill,
  onAdded,
  onSavingChange,
}) => {
  const { t } = useTranslation();
  const pending = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const draft = useMemo(
    () => ({ uuid: draftId, item: '', billableService: '', price: 0, quantity: 1 }) as LineItem,
    [draftId],
  );

  return (
    <EditableBillItemCell
      lineItem={draft}
      emptyLabel={t('selectBillItem', 'Select bill item')}
      billableServices={billableServices}
      isEditable={!isSaving}
      activeEditorKey={activeEditorKey}
      setActiveEditorKey={setActiveEditorKey}
      onCommit={async (_item, updates) => {
        const service = billableServices.find((candidate) => candidate.uuid === updates.billableService?.split(':')[0]);
        if (!service || pending.current) return;
        pending.current = true;
        setIsSaving(true);
        onSavingChange(true);
        try {
          const lineItem = await addBillLineItem(bill.uuid, service);
          onLineItemUpdated?.(lineItem);
          onAdded();
          // Saving succeeded; refresh failures must not invite duplicate additions.
          void Promise.resolve()
            .then(() => onRefreshBill?.())
            .catch(() => undefined);
        } catch {
          showSnackbar({
            title: t('addBillItemError', 'Unable to add bill item'),
            subtitle: t('billCreationRetry', 'Please try again.'),
            kind: 'error',
          });
        } finally {
          pending.current = false;
          setIsSaving(false);
          onSavingChange(false);
        }
      }}
    />
  );
};

export default AddLineItemCell;
