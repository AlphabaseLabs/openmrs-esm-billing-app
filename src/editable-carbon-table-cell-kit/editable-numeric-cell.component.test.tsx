import React, { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditableNumericCell from './editable-numeric-cell.component';
import styles from './editable-carbon-table-cell-kit.scss';

const NumericHarness = ({ disabled = false }: { disabled?: boolean }) => {
  const [mode, setMode] = useState<'inline' | 'picker' | null>(null);
  const [value, setValue] = useState('2,000');

  return (
    <div data-testid="table-overflow-boundary">
      <EditableNumericCell
        activeMode={mode}
        inputId="price-test"
        inputLabelText="Price"
        inputValue={value}
        isActive={mode !== null}
        isEditable={!disabled}
        onInlineOpen={() => setMode('inline')}
        onInputChange={setValue}
        onInputKeyDown={(event) => {
          if (event.key === 'Escape') {
            setMode(null);
          }
        }}
        popover={{
          align: 'bottom-right',
          ariaLabel: 'Price options',
          className: styles.priceOptionsPopover,
          content: <button type="button">Default - (2,000)</button>,
          isOpen: mode === 'picker',
          onClose: () => setMode(null),
          onOpen: (event) => {
            event.stopPropagation();
            setMode('picker');
          },
          trigger: <span>Chevron down</span>,
          triggerLabel: 'Select price option',
        }}
        sizingValue="2,000"
        value="2,000"
      />
    </div>
  );
};

describe('EditableNumericCell', () => {
  it('renders inactive numeric content with a floating affordance', () => {
    render(<NumericHarness />);

    expect(screen.getByTestId('editable-numeric-cell')).toHaveClass(styles.numeric);
    expect(screen.getByTestId('editable-numeric-content')).toHaveClass(styles.cellSurfaceButton);
    expect(screen.getByTestId('editable-numeric-affordance')).toHaveClass(styles.floatingAffordance);
    expect(screen.getByLabelText(/select price option/i)).toHaveTextContent('Chevron down');
  });

  it('renders the active inline editor over an in-flow sizing value', async () => {
    const user = userEvent.setup();
    render(<NumericHarness />);

    await user.click(screen.getByTestId('editable-numeric-content'));

    const editor = screen.getByTestId('editable-inline-numeric-editor');
    expect(editor).toHaveClass(styles.numericEditor);
    expect(editor).toHaveClass(styles.inlineNumericEditor);
    expect(screen.getByText('2,000')).toHaveClass(styles.inlineNumericSizingValue);
    expect(screen.getByRole('textbox', { name: /price/i })).toHaveValue('2,000');
  });

  it('ports popover content outside the local table overflow boundary', async () => {
    const user = userEvent.setup();
    render(<NumericHarness />);

    await user.click(screen.getByLabelText(/select price option/i));

    const boundary = screen.getByTestId('table-overflow-boundary');
    const dialog = await screen.findByRole('dialog', { name: /price options/i });

    expect(dialog).toHaveClass(styles.priceOptionsPopover);
    expect(within(boundary).queryByRole('dialog', { name: /price options/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('editable-cell-overlay-layer')).toHaveAttribute('data-align', 'bottom-right');
  });

  it('closes popovers through the shared Escape key behavior', async () => {
    const user = userEvent.setup();
    render(<NumericHarness />);

    await user.click(screen.getByLabelText(/select price option/i));
    expect(screen.getByRole('dialog', { name: /price options/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog', { name: /price options/i })).not.toBeInTheDocument());
  });

  it('renders disabled numeric cells without editable affordances', () => {
    render(<NumericHarness disabled />);

    expect(screen.getByTestId('editable-numeric-content').tagName).toBe('SPAN');
    expect(screen.queryByLabelText(/select price option/i)).not.toBeInTheDocument();
  });
});
