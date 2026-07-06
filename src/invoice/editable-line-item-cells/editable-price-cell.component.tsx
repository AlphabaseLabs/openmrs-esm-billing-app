import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { formatBillAmount } from '../../helpers';
import { type BillableService, type LineItem } from '../../types';
import { EditableNumericCell, editableCellStyles as styles } from '../../editable-carbon-table-cell-kit';
import { type ActiveEditorKey, type EditableLineItemCommit, getEditorKey } from './types';
import {
  createPriceUpdate,
  findSelectedServicePrice,
  findServiceForLineItem,
  parseEditableNumber,
  recalculateLineItem,
} from './utils';

type EditablePriceCellProps = {
  lineItem: LineItem;
  billableServices: Array<BillableService>;
  isEditable: boolean;
  activeEditorKey: ActiveEditorKey;
  setActiveEditorKey: (key: ActiveEditorKey) => void;
  onCommit: EditableLineItemCommit;
};

const EditablePriceCell: React.FC<EditablePriceCellProps> = ({
  lineItem,
  billableServices,
  isEditable,
  activeEditorKey,
  setActiveEditorKey,
  onCommit,
}) => {
  const { t } = useTranslation();
  const editorKey = getEditorKey(lineItem.uuid, 'price');
  const isActive = activeEditorKey === editorKey;
  const [mode, setMode] = useState<'inline' | 'picker' | null>(null);
  const [draft, setDraft] = useState(formatBillAmount(lineItem.price));
  const [error, setError] = useState('');
  const service = useMemo(() => findServiceForLineItem(lineItem, billableServices), [billableServices, lineItem]);
  const selectedPrice = useMemo(() => findSelectedServicePrice(lineItem, service), [lineItem, service]);

  useEffect(() => {
    if (!isActive) {
      setMode(null);
      setDraft(formatBillAmount(lineItem.price));
      setError('');
    }
  }, [isActive, lineItem.price]);

  const openInlineEditor = () => {
    if (!isEditable) {
      return;
    }

    setDraft(formatBillAmount(lineItem.price));
    setError('');
    setMode('inline');
    setActiveEditorKey(editorKey);
  };

  const openPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!isEditable) {
      return;
    }

    setError('');
    setMode('picker');
    setActiveEditorKey(editorKey);
  };

  const close = () => {
    setMode(null);
    setActiveEditorKey(null);
  };

  const commitDraft = async () => {
    const parsedPrice = parseEditableNumber(draft);
    if (parsedPrice === null || parsedPrice < 0) {
      setError(t('priceValidationError', 'Enter a valid price greater than or equal to 0'));
      return;
    }

    if (parsedPrice === lineItem.price) {
      close();
      return;
    }

    await onCommit(lineItem, createPriceUpdate(parsedPrice), recalculateLineItem({ ...lineItem, price: parsedPrice }));
    close();
  };

  return (
    <EditableNumericCell
      activeMode={mode}
      className={isActive && mode === 'picker' ? styles.activeEditableCell : undefined}
      error={error}
      inputId={`price-${lineItem.uuid}`}
      inputLabelText={t('price', 'Price')}
      inputMode="decimal"
      inputValue={draft}
      isActive={isActive}
      isEditable={isEditable}
      onInlineOpen={openInlineEditor}
      onInputChange={setDraft}
      onInputKeyDown={(event) => {
        if (event.key === 'Enter') {
          void commitDraft();
        }
        if (event.key === 'Escape') {
          close();
        }
      }}
      onBlur={(event) => {
        if (mode === 'inline' && !event.currentTarget.contains(event.relatedTarget as Node)) {
          void commitDraft();
        }
      }}
      popover={{
        align: 'bottom-right',
        ariaLabel: t('priceOptions', 'Price options'),
        className: styles.priceOptionsPopover,
        content: (
          <>
            <p className={styles.popoverTitle}>{t('selectPriceOption', 'Select price option')}</p>
            <div className={styles.optionList}>
              {(service?.servicePrices ?? []).map((priceOption) => {
                const isSelected =
                  selectedPrice?.uuid === priceOption.uuid || Number(priceOption.price) === Number(lineItem.price);
                return (
                  <button
                    type="button"
                    key={priceOption.uuid ?? `${priceOption.name}-${priceOption.price}`}
                    className={`${styles.optionButton} ${styles.priceOptionButton} ${
                      isSelected ? styles.selectedOption : ''
                    }`}
                    aria-current={isSelected ? 'true' : undefined}
                    onClick={async () => {
                      const price = Number(priceOption.price) || 0;
                      await onCommit(
                        lineItem,
                        createPriceUpdate(price, priceOption),
                        recalculateLineItem({
                          ...lineItem,
                          price,
                          priceName: priceOption.name,
                          priceUuid: priceOption.uuid ?? '',
                        }),
                      );
                      close();
                    }}>
                    <span className={styles.priceOptionText}>
                      {priceOption.name} - ({formatBillAmount(Number(priceOption.price) || 0)})
                    </span>
                    {isSelected ? (
                      <span className={styles.optionCheck} aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {!service?.servicePrices?.length ? <span>{t('noPriceOptions', 'No price options')}</span> : null}
            </div>
          </>
        ),
        isOpen: isActive && mode === 'picker',
        onClose: close,
        onOpen: openPicker,
        trigger: <ChevronDown size={12} />,
        triggerLabel: t('selectPriceOption', 'Select price option'),
      }}
      sizingValue={formatBillAmount(lineItem.price)}
      value={formatBillAmount(lineItem.price)}
    />
  );
};

export default EditablePriceCell;
