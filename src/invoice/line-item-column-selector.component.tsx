import React, { useId, useState } from 'react';
import { IconButton, Checkbox } from '@carbon/react';
import { Column } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { EditableCellPopover } from '../editable-carbon-table-cell-kit';
import { getHideableLineItemColumnDefinitions, type LineItemColumnKey } from './line-item-column-visibility';
import styles from './invoice-table.scss';

type LineItemColumnSelectorProps = {
  visibleColumnKeys: Array<LineItemColumnKey>;
  onOpen: () => void;
  onVisibilityChange: (columnKey: LineItemColumnKey, visible: boolean) => void;
};

const LineItemColumnSelector: React.FC<LineItemColumnSelectorProps> = ({
  visibleColumnKeys,
  onOpen,
  onVisibilityChange,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const visibleColumnKeySet = new Set(visibleColumnKeys);
  const idPrefix = useId();
  const menuId = `${idPrefix}-line-item-column-visibility-menu`;

  const toggleMenu = () => {
    if (!isOpen) {
      onOpen();
    }
    setIsOpen((open) => !open);
  };

  return (
    <EditableCellPopover
      align="bottom-right"
      dataTestId="line-item-column-selector"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <IconButton
          aria-controls={menuId}
          aria-expanded={isOpen}
          align="top-end"
          label={t('chooseColumnsToDisplay', 'Choose columns to display')}
          kind="ghost"
          onClick={toggleMenu}
          size="sm">
          <Column size={16} />
        </IconButton>
      }>
      <div
        aria-label={t('lineItemColumns', 'Line item columns')}
        className={styles.columnVisibilityMenu}
        id={menuId}
        role="group">
        {getHideableLineItemColumnDefinitions().map((column) => (
          <div className={styles.columnVisibilityOption} key={column.key}>
            <Checkbox
              checked={visibleColumnKeySet.has(column.key)}
              className={styles.columnVisibilityCheckbox}
              id={`${idPrefix}-line-item-column-${column.key}`}
              labelText={t(column.translationKey, column.defaultLabel)}
              onChange={(_event, { checked }) => onVisibilityChange(column.key, checked)}
            />
          </div>
        ))}
      </div>
    </EditableCellPopover>
  );
};

export default LineItemColumnSelector;
