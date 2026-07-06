import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import EditableNumericCell from './editable-numeric-cell.component';
import EditableTextCell from './editable-text-cell.component';
import styles from './editable-carbon-table-cell-kit.scss';

const meta: Meta = {
  title: 'Editable Carbon Table Cell Kit/Primitives',
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: '32rem', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj;

const NumericPrimitive = () => {
  const [mode, setMode] = useState<'inline' | 'picker' | null>(null);
  const [value, setValue] = useState('249,999');

  return (
    <EditableNumericCell
      activeMode={mode}
      inputId="numeric-primitive"
      inputLabelText="Price"
      inputValue={value}
      isActive={mode !== null}
      isEditable
      onInlineOpen={() => setMode('inline')}
      onInputChange={setValue}
      onInputKeyDown={(event) => {
        if (event.key === 'Escape' || event.key === 'Enter') {
          setMode(null);
        }
      }}
      popover={{
        align: 'bottom-right',
        ariaLabel: 'Price options',
        className: styles.priceOptionsPopover,
        content: (
          <div className={styles.optionList}>
            <button type="button" className={`${styles.optionButton} ${styles.priceOptionButton}`}>
              <span className={styles.priceOptionText}>Default - (249,999)</span>
            </button>
          </div>
        ),
        isOpen: mode === 'picker',
        onClose: () => setMode(null),
        onOpen: (event) => {
          event.stopPropagation();
          setMode('picker');
        },
        trigger: <span>⌄</span>,
        triggerLabel: 'Select price option',
      }}
      sizingValue="249,999"
      value="249,999"
    />
  );
};

const TextPrimitive = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <EditableTextCell
      activeContent={
        <input
          aria-label="Select bill item"
          className={`${styles.editableCellContent} ${styles.textContent} ${styles.cellSearchInput}`}
          defaultValue="Clear Aligner"
        />
      }
      className={isOpen ? styles.activeEditableCell : undefined}
      isActive={isOpen}
      isEditable
      isOpen={isOpen}
      onActivate={() => setIsOpen(true)}
      popover={{
        align: 'bottom-left',
        ariaLabel: 'Bill item options',
        buttonProps: {
          'aria-label': 'Select bill item',
          onClick: (event) => {
            event.stopPropagation();
            setIsOpen((current) => !current);
          },
        },
        className: styles.billItemComboboxPopover,
        content: (
          <ul className={styles.optionList}>
            <li className={`${styles.optionButton} ${styles.selectedOption}`}>Clear Aligner</li>
            <li className={styles.optionButton}>Consultation</li>
          </ul>
        ),
        isOpen,
        onClose: () => setIsOpen(false),
        trigger: <span>⌄</span>,
      }}
      value="Clear Aligner"
    />
  );
};

export const NumericCell: Story = {
  render: () => <NumericPrimitive />,
};

export const TextCell: Story = {
  render: () => <TextPrimitive />,
};
