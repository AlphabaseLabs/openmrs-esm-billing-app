import React, { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditableTextCell from './editable-text-cell.component';
import styles from './editable-carbon-table-cell-kit.scss';

const TextHarness = ({ disabled = false }: { disabled?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div data-testid="table-overflow-boundary">
      <EditableTextCell
        activeContent={
          <input
            aria-label="Select bill item"
            className={`${styles.editableCellContent} ${styles.textContent} ${styles.cellSearchInput}`}
            data-testid="editable-bill-item-search-input"
            defaultValue="Consultation"
          />
        }
        isActive={isOpen}
        isEditable={!disabled}
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
              <li className={styles.optionButton}>Consultation</li>
            </ul>
          ),
          isOpen,
          onClose: () => setIsOpen(false),
          trigger: <span>Chevron down</span>,
        }}
        value="Consultation"
      />
    </div>
  );
};

describe('EditableTextCell', () => {
  it('renders inactive text content with a floating affordance', () => {
    render(<TextHarness />);

    expect(screen.getByTestId('editable-text-cell')).toHaveClass(styles.textEditableCell);
    expect(screen.getByTestId('editable-text-content')).toHaveClass(styles.cellSurfaceButton);
    expect(screen.getByTestId('editable-text-affordance')).toHaveClass(styles.floatingAffordance);
    expect(screen.getByLabelText(/select bill item/i)).toHaveTextContent('Chevron down');
  });

  it('renders active text content supplied by the consuming adapter', async () => {
    const user = userEvent.setup();
    render(<TextHarness />);

    await user.click(screen.getByTestId('editable-text-content'));

    expect(screen.getByTestId('editable-bill-item-search-input')).toHaveClass(styles.cellSearchInput);
    expect(screen.getByRole('textbox', { name: /select bill item/i })).toHaveValue('Consultation');
  });

  it('ports text popover content outside the local table overflow boundary', async () => {
    const user = userEvent.setup();
    render(<TextHarness />);

    await user.click(screen.getByLabelText(/select bill item/i));

    const boundary = screen.getByTestId('table-overflow-boundary');
    const dialog = await screen.findByRole('dialog', { name: /bill item options/i });

    expect(dialog).toHaveClass(styles.billItemComboboxPopover);
    expect(within(boundary).queryByRole('dialog', { name: /bill item options/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('editable-cell-overlay-layer')).toHaveAttribute('data-align', 'bottom-left');
  });

  it('closes popovers through the shared Escape key behavior', async () => {
    const user = userEvent.setup();
    render(<TextHarness />);

    await user.click(screen.getByLabelText(/select bill item/i));
    expect(screen.getByRole('dialog', { name: /bill item options/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog', { name: /bill item options/i })).not.toBeInTheDocument());
  });

  it('renders disabled text cells without editable affordances', () => {
    render(<TextHarness disabled />);

    expect(screen.getByTestId('editable-text-content').tagName).toBe('SPAN');
    expect(screen.queryByLabelText(/select bill item/i)).not.toBeInTheDocument();
  });
});
