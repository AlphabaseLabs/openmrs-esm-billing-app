import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type LineItem } from '../../types';
import { EditableNumericCell, editableCellStyles as styles } from '../../editable-carbon-table-cell-kit';
import { type ActiveEditorKey, type EditableLineItemCommit, getEditorKey } from './types';
import { recalculateLineItem } from './utils';

type EditableQuantityCellProps = {
  lineItem: LineItem;
  isEditable: boolean;
  activeEditorKey: ActiveEditorKey;
  setActiveEditorKey: (key: ActiveEditorKey) => void;
  onCommit: EditableLineItemCommit;
};

const formatQuantity = (quantity?: number) => `${quantity ?? 0}`;

const parseQuantity = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalizedValue = String(value).replace(/,/g, '').trim();
  if (!/^\d+$/.test(normalizedValue)) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const EditableQuantityCell: React.FC<EditableQuantityCellProps> = ({
  lineItem,
  isEditable,
  activeEditorKey,
  setActiveEditorKey,
  onCommit,
}) => {
  const { t } = useTranslation();
  const editorKey = getEditorKey(lineItem.uuid, 'quantity');
  const isActive = activeEditorKey === editorKey;
  const [mode, setMode] = useState<'inline' | null>(null);
  const [draft, setDraft] = useState(formatQuantity(lineItem.quantity));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isActive) {
      setMode(null);
      setDraft(formatQuantity(lineItem.quantity));
      setError('');
    }
  }, [isActive, lineItem.quantity]);

  const openInlineEditor = () => {
    if (!isEditable) {
      return;
    }

    setDraft(formatQuantity(lineItem.quantity));
    setError('');
    setMode('inline');
    setActiveEditorKey(editorKey);
  };

  const close = () => {
    setMode(null);
    setActiveEditorKey(null);
  };

  const rejectDraft = (options: { closeOnReject?: boolean } = {}) => {
    setDraft(formatQuantity(lineItem.quantity));
    setError(t('quantityValidationError', 'Enter a valid quantity greater than 0'));
    if (options.closeOnReject) {
      close();
    }
  };

  const commitDraft = async (options: { closeOnInvalid?: boolean } = {}) => {
    const nextQuantity = parseQuantity(draft);
    if (nextQuantity === null) {
      rejectDraft({ closeOnReject: options.closeOnInvalid });
      return;
    }

    if (nextQuantity === lineItem.quantity) {
      close();
      return;
    }

    await onCommit(
      lineItem,
      { quantity: nextQuantity },
      recalculateLineItem({
        ...lineItem,
        quantity: nextQuantity,
      }),
    );
    close();
  };

  return (
    <EditableNumericCell
      activeMode={mode}
      className={styles.quantityEditableCell}
      error={error}
      inputId={`quantity-${lineItem.uuid}`}
      inputLabelText={t('quantity', 'Quantity')}
      inputMode="numeric"
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
          void commitDraft({ closeOnInvalid: true });
        }
      }}
      sizingValue={formatQuantity(lineItem.quantity)}
      value={formatQuantity(lineItem.quantity)}
    />
  );
};

export default EditableQuantityCell;
