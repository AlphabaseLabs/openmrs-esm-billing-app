import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from '@carbon/react/icons';
import { useCombobox } from 'downshift';
import { useTranslation } from 'react-i18next';
import { EditableTextCell, editableCellStyles as styles } from '../../editable-carbon-table-cell-kit';
import { type ProviderOption } from '../../payment-points/payment-points.resource';
import { type LineItem } from '../../types';
import { type ActiveEditorKey, type EditableLineItemCommit, getEditorKey } from './types';

type EditableProviderCellProps = {
  lineItem: LineItem;
  providerName: string;
  providerOptions: Array<ProviderOption>;
  isLoadingProviders: boolean;
  isEditable: boolean;
  activeEditorKey: ActiveEditorKey;
  setActiveEditorKey: (key: ActiveEditorKey) => void;
  onCommit: EditableLineItemCommit;
};

const EditableProviderCell: React.FC<EditableProviderCellProps> = ({
  lineItem,
  providerName,
  providerOptions,
  isLoadingProviders,
  isEditable,
  activeEditorKey,
  setActiveEditorKey,
  onCommit,
}) => {
  const { t } = useTranslation();
  const editorKey = getEditorKey(lineItem.uuid, 'provider');
  const isActive = activeEditorKey === editorKey;
  const currentProvider = lineItem.provider;
  const currentProviderOption = useMemo(
    () => providerOptions.find((provider) => provider.uuid === currentProvider?.uuid) ?? null,
    [currentProvider?.uuid, providerOptions],
  );
  const noProviderOption = useMemo<ProviderOption>(
    () => ({ id: '__no_provider__', uuid: '', label: t('noProvider', 'No provider') }),
    [t],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(providerName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isActive) {
      setIsOpen(false);
      setInputValue(providerName);
    }
  }, [isActive, providerName]);

  useEffect(() => {
    if (isActive && isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isActive, isOpen]);

  const close = () => {
    setInputValue(providerName);
    setIsOpen(false);
    setActiveEditorKey(null);
  };

  const open = () => {
    if (!isEditable || isLoadingProviders) {
      return;
    }

    setInputValue(providerName);
    setActiveEditorKey(editorKey);
    setIsOpen(true);
  };

  const commit = async (provider: ProviderOption | null) => {
    await onCommit(
      lineItem,
      { provider: provider?.uuid ?? null },
      {
        ...lineItem,
        provider: provider ? { uuid: provider.uuid, display: provider.label } : null,
      },
    );
    close();
  };

  const filteredProviderOptions = useMemo(() => {
    const options = [noProviderOption, ...providerOptions];
    const query = inputValue.trim().toLowerCase();

    if (!query || query === providerName.toLowerCase()) {
      return options;
    }

    return options.filter((provider) => provider.label.toLowerCase().includes(query));
  }, [inputValue, noProviderOption, providerName, providerOptions]);

  const { getInputProps, getItemProps, getMenuProps, getToggleButtonProps, highlightedIndex } =
    useCombobox<ProviderOption>({
      inputValue,
      isOpen: isActive && isOpen,
      itemToString: (item) => item?.label ?? '',
      items: filteredProviderOptions,
      selectedItem: currentProviderOption ?? (currentProvider ? null : noProviderOption),
      onInputValueChange: ({ inputValue: nextInputValue }) => setInputValue(nextInputValue ?? ''),
      onSelectedItemChange: ({ selectedItem }) => {
        if (!selectedItem) {
          return;
        }

        void commit(selectedItem.uuid ? selectedItem : null);
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
              'aria-label': t('searchProviders', 'Search providers'),
              className: `${styles.editableCellContent} ${styles.textContent} ${styles.cellSearchInput}`,
              onBlur: (event) => {
                const nextTarget = event.relatedTarget as HTMLElement | null;

                if (nextTarget?.closest('[role="listbox"]')) {
                  return;
                }

                window.setTimeout(close, 0);
              },
              onClick: (event) => event.stopPropagation(),
              ref: inputRef,
            })}
          />
        ) : null
      }
      className={isActive && isOpen ? styles.activeEditableCell : undefined}
      isActive={isActive}
      isEditable={isEditable}
      isOpen={isOpen}
      onActivate={open}
      popover={{
        align: 'bottom-left',
        ariaLabel: t('providerOptions', 'Provider options'),
        buttonProps: getToggleButtonProps({
          'aria-label': t('selectProvider', 'Select provider'),
          disabled: isLoadingProviders,
          onClick: (event) => {
            event.stopPropagation();
            if (isActive && isOpen) {
              close();
            } else {
              open();
            }
          },
          type: 'button',
        }),
        className: styles.billItemComboboxPopover,
        content: (
          <ul
            className={`${styles.optionList} ${styles.scrollableOptionList}`}
            {...getMenuProps({}, { suppressRefError: true })}>
            {filteredProviderOptions.length ? (
              filteredProviderOptions.map((provider, index) => {
                const isSelected = provider.uuid ? currentProvider?.uuid === provider.uuid : !currentProvider;

                return (
                  <li
                    key={provider.id}
                    className={`${styles.optionButton} ${styles.billItemOption} ${
                      isSelected ? styles.selectedOption : ''
                    } ${highlightedIndex === index ? styles.highlightedOption : ''}`}
                    {...getItemProps({
                      'aria-selected': isSelected,
                      index,
                      item: provider,
                    })}>
                    <span className={styles.billItemOptionLabel}>{provider.label}</span>
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
        ),
        isOpen: isActive && isOpen,
        onClose: close,
        trigger: <ChevronDown size={16} />,
      }}
      value={providerName}
    />
  );
};

export default EditableProviderCell;
