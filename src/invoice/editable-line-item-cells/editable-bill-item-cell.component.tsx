import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditIcon } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { type BillableService, type LineItem } from '../../types';
import { type ActiveEditorKey, type EditableLineItemCommit, getEditorKey } from './types';
import { findSelectedServicePrice, findServiceForLineItem, getLineItemLabel, recalculateLineItem } from './utils';
import EditableCellOverlay from './editable-cell-overlay.component';
import styles from './editable-line-item-cells.scss';

type EditableBillItemCellProps = {
  lineItem: LineItem;
  billableServices: Array<BillableService>;
  isEditable: boolean;
  activeEditorKey: ActiveEditorKey;
  setActiveEditorKey: (key: ActiveEditorKey) => void;
  onCommit: EditableLineItemCommit;
};

const EditableBillItemCell: React.FC<EditableBillItemCellProps> = ({
  lineItem,
  billableServices,
  isEditable,
  activeEditorKey,
  setActiveEditorKey,
  onCommit,
}) => {
  const { t } = useTranslation();
  const editorKey = getEditorKey(lineItem.uuid, 'billItem');
  const isActive = activeEditorKey === editorKey;
  const selectedService = useMemo(() => findServiceForLineItem(lineItem, billableServices), [billableServices, lineItem]);
  const selectedPrice = useMemo(() => findSelectedServicePrice(lineItem, selectedService), [lineItem, selectedService]);
  const [isOpen, setIsOpen] = useState(false);
  const cellRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isActive) {
      setIsOpen(false);
    }
  }, [isActive]);

  const close = () => {
    setIsOpen(false);
    setActiveEditorKey(null);
  };

  const activateInlineSurface = () => {
    if (!isEditable) {
      return;
    }

    setIsOpen(true);
    setActiveEditorKey(editorKey);
  };

  if (!isEditable) {
    return (
      <span className={`${styles.editableCell} ${styles.textEditableCell} ${styles.staticValue}`}>
        <span className={`${styles.editableCellContent} ${styles.textContent}`} data-testid="editable-text-content">
          {getLineItemLabel(lineItem)}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`${styles.editableCell} ${styles.textEditableCell} ${isActive && isOpen ? styles.activeEditableCell : ''}`}
      data-testid="editable-text-cell"
      ref={cellRef}>
      <button
        type="button"
        className={`${styles.editableCellContent} ${styles.textContent} ${styles.cellSurfaceButton}`}
        data-testid="editable-text-content"
        onClick={activateInlineSurface}>
        {getLineItemLabel(lineItem)}
      </button>
      <span className={`${styles.floatingAffordance} ${styles.textAffordance}`} data-testid="editable-text-affordance">
        <EditableCellOverlay
          anchorRef={cellRef}
          trigger={
            <button
              type="button"
              className={`${styles.optionsButton} ${isOpen ? styles.optionsButtonOpen : ''}`}
              aria-label={t('selectBillItem', 'Select bill item')}
              onClick={(event) => {
                event.stopPropagation();
                activateInlineSurface();
              }}>
              <EditIcon size={14} />
            </button>
          }
          isOpen={isActive && isOpen}
          onClose={close}
          align="bottom-left">
          <div className={styles.popover} role="dialog" aria-label={t('billItemOptions', 'Bill item options')}>
            <p className={styles.popoverTitle}>{t('selectBillItem', 'Select bill item')}</p>
            <div className={styles.optionList}>
              {billableServices.map((service) => (
                <button
                  type="button"
                  key={service.uuid}
                  className={`${styles.optionButton} ${selectedService?.uuid === service.uuid ? styles.selectedOption : ''}`}
                  aria-current={selectedService?.uuid === service.uuid ? 'true' : undefined}
                  onClick={async () => {
                    const firstPrice = service.servicePrices?.[0];
                    const shouldUseDefaultPrice = Boolean(selectedPrice);
                    const nextLineItem = recalculateLineItem({
                      ...lineItem,
                      billableService: `${service.uuid}:${service.name}`,
                      item: `${service.uuid}:${service.name}`,
                      ...(shouldUseDefaultPrice
                        ? {
                            price: Number(firstPrice?.price ?? lineItem.price ?? 0),
                            priceName: firstPrice?.name ?? lineItem.priceName,
                            priceUuid: firstPrice?.uuid ?? lineItem.priceUuid,
                          }
                        : {}),
                    });

                    await onCommit(
                      lineItem,
                      {
                        billableService: nextLineItem.billableService,
                        item: nextLineItem.item,
                        ...(shouldUseDefaultPrice
                          ? {
                              price: nextLineItem.price,
                              priceName: nextLineItem.priceName,
                              priceUuid: nextLineItem.priceUuid,
                            }
                          : {}),
                      },
                      nextLineItem,
                    );
                    close();
                  }}>
                  <span>{service.name}</span>
                  {selectedService?.uuid === service.uuid ? (
                    <span className={styles.optionCheck} aria-hidden="true">
                      ✓
                    </span>
                  ) : null}
                </button>
              ))}
              {!billableServices.length ? <span>{t('noBillItems', 'No bill items')}</span> : null}
            </div>
          </div>
        </EditableCellOverlay>
      </span>
    </span>
  );
};

export default EditableBillItemCell;
