import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from '@carbon/react/icons';
import { useCombobox } from 'downshift';
import { useTranslation } from 'react-i18next';
import { type BillableService, type LineItem } from '../../types';
import { EditableTextCell, editableCellStyles as styles } from '../../editable-carbon-table-cell-kit';
import { type ActiveEditorKey, type EditableLineItemCommit, getEditorKey } from './types';
import { findSelectedServicePrice, findServiceForLineItem, getLineItemLabel, recalculateLineItem } from './utils';

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
  const lineItemLabel = getLineItemLabel(lineItem);
  const selectedServiceName = selectedService?.name ?? lineItemLabel;
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(selectedServiceName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isActive) {
      setIsOpen(false);
      setInputValue(selectedServiceName);
    }
  }, [isActive, selectedServiceName]);

  useEffect(() => {
    if (isActive && isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isActive, isOpen]);

  const close = () => {
    setInputValue(selectedServiceName);
    setIsOpen(false);
    setActiveEditorKey(null);
  };

  const activateInlineSurface = () => {
    if (!isEditable) {
      return;
    }

    setInputValue(selectedServiceName);
    setIsOpen(true);
    setActiveEditorKey(editorKey);
  };

  const commitBillableService = async (service: BillableService) => {
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
  };

  const filteredBillableServices = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    const selectedName = selectedService?.name.toLowerCase();

    if (!query || query === selectedName) {
      return billableServices;
    }

    return billableServices.filter((service) => service.name.toLowerCase().includes(query));
  }, [billableServices, inputValue, selectedService]);

  const { getInputProps, getItemProps, getMenuProps, getToggleButtonProps, highlightedIndex } =
    useCombobox<BillableService>({
      inputValue,
      isOpen: isActive && isOpen,
      itemToString: (item) => item?.name ?? '',
      items: filteredBillableServices,
      selectedItem: selectedService ?? null,
      onInputValueChange: ({ inputValue: nextInputValue }) => {
        setInputValue(nextInputValue ?? '');
      },
      onSelectedItemChange: ({ selectedItem }) => {
        if (!selectedItem) {
          return;
        }

        void commitBillableService(selectedItem);
      },
    });

  if (!isEditable || !isActive || !isOpen) {
    getInputProps({}, { suppressRefError: true });
    getMenuProps({}, { suppressRefError: true });
  }

  return (
    <EditableTextCell
      activeContent={
        isActive && isOpen ? (
          <input
            {...getInputProps({
              'aria-label': t('selectBillItem', 'Select bill item'),
              className: `${styles.editableCellContent} ${styles.textContent} ${styles.cellSearchInput}`,
              'data-testid': 'editable-bill-item-search-input',
              onBlur: (event) => {
                const nextTarget = event.relatedTarget as HTMLElement | null;

                if (nextTarget?.closest('[role="listbox"]')) {
                  return;
                }

                window.setTimeout(() => {
                  close();
                }, 0);
              },
              onClick: (event) => {
                event.stopPropagation();
              },
              ref: inputRef,
            })}
          />
        ) : null
      }
      className={`${styles.billItemEditableCell} ${isActive && isOpen ? styles.activeEditableCell : ''}`}
      isActive={isActive}
      isEditable={isEditable}
      isOpen={isOpen}
      onActivate={activateInlineSurface}
      popover={{
        align: 'bottom-left',
        ariaLabel: t('billItemOptions', 'Bill item options'),
        buttonProps: getToggleButtonProps({
          'aria-label': t('selectBillItem', 'Select bill item'),
          onClick: (event) => {
            event.stopPropagation();

            if (isActive && isOpen) {
              close();
              return;
            }

            activateInlineSurface();
          },
          type: 'button',
        }),
        className: styles.billItemComboboxPopover,
        content: (
          <>
            <ul className={styles.optionList} {...getMenuProps({}, { suppressRefError: true })}>
              {filteredBillableServices.length ? (
                filteredBillableServices.map((service, index) => {
                  const isSelected = selectedService?.uuid === service.uuid;

                  return (
                    <li
                      key={service.uuid}
                      className={`${styles.optionButton} ${styles.billItemOption} ${
                        isSelected ? styles.selectedOption : ''
                      } ${highlightedIndex === index ? styles.highlightedOption : ''}`}
                      {...getItemProps({
                        'aria-selected': isSelected,
                        index,
                        item: service,
                      })}>
                      <span className={styles.billItemOptionLabel}>{service.name}</span>
                      {isSelected ? (
                        <span className={styles.optionCheck} aria-hidden="true">
                          ✓
                        </span>
                      ) : null}
                    </li>
                  );
                })
              ) : (
                <li className={styles.noOptionsMessage}>{t('noResults', 'No results')}</li>
              )}
            </ul>
          </>
        ),
        isOpen: isActive && isOpen,
        onClose: close,
        trigger: <ChevronDown size={16} />,
      }}
      value={lineItemLabel}
    />
  );
};

export default EditableBillItemCell;
