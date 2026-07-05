import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditableDiscountCell from './editable-discount-cell.component';
import { EditableCellHarness, testDiscountedLineItem, testLineItem } from './editable-cell-test-utils';
import { PaymentStatus } from '../../types';
import styles from './editable-line-item-cells.scss';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('@openmrs/esm-framework', () => ({
  EditIcon: () => <span>Edit</span>,
}));

describe('EditableDiscountCell', () => {
  it('commits a valid inline discount edit', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableDiscountCell
            lineItem={testLineItem}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByTestId('editable-numeric-content'));
    const input = screen.getByRole('textbox', { name: /discount/i });
    expect(screen.queryByRole('spinbutton', { name: /discount/i })).not.toBeInTheDocument();
    await user.clear(input);
    await user.type(input, '1,000{Enter}');

    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommit).toHaveBeenCalledWith(
      testLineItem,
      { discounts: [expect.objectContaining({ amount: 1000, baseAmount: 2000 })] },
      expect.objectContaining({ discounts: [expect.objectContaining({ amount: 1000 })] }),
    );
  });

  it('auto-commits valid rich discount amount edits without save or cancel actions', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableDiscountCell
            lineItem={testDiscountedLineItem}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByLabelText(/edit discount/i));
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('editable-cell-overlay-layer')).toHaveAttribute('data-align', 'bottom-right');
    expect(screen.getByTestId('editable-numeric-cell')).toHaveClass(styles.activeEditableCell);
    await user.clear(screen.getByRole('textbox', { name: /amount/i }));
    await user.type(screen.getByRole('textbox', { name: /amount/i }), '600');

    await waitFor(() => expect(onCommit).toHaveBeenCalled());
    expect(onCommit).toHaveBeenLastCalledWith(
      testDiscountedLineItem,
      { discounts: [expect.objectContaining({ amount: 600, baseAmount: 2000 })] },
      expect.objectContaining({ discounts: [expect.objectContaining({ amount: 600 })] }),
    );
  });

  it('keeps invalid rich discount drafts local without committing', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableDiscountCell
            lineItem={testDiscountedLineItem}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByLabelText(/edit discount/i));
    fireEvent.change(screen.getByRole('textbox', { name: /amount/i }), { target: { value: '3000' } });

    expect(await screen.findAllByText(/enter a discount/i)).toHaveLength(2);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('resets discount inline and keeps the form open', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableDiscountCell
            lineItem={testDiscountedLineItem}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByLabelText(/edit discount/i));
    await user.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommit).toHaveBeenCalledWith(
      testDiscountedLineItem,
      { discounts: [] },
      expect.objectContaining({ discounts: [] }),
    );
    expect(screen.getByRole('dialog', { name: /discount form/i })).toBeInTheDocument();
  });

  it('places numeric discount affordance as a floating overlay before right-aligned full-width content', () => {
    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey, onCommit }) => (
          <EditableDiscountCell
            lineItem={testLineItem}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    const cell = screen.getByTestId('editable-numeric-cell');
    const affordance = screen.getByTestId('editable-numeric-affordance');
    const content = screen.getByTestId('editable-numeric-content');

    expect(cell).not.toHaveClass(styles.numericEditableCell);
    expect(affordance).toHaveClass(styles.floatingAffordance);
    expect(affordance).toHaveClass(styles.numericAffordance);
    expect(content).toHaveClass(styles.editableCellContent);
    expect(content).toHaveClass(styles.numericContent);
    expect(content).toHaveClass(styles.cellSurfaceButton);
    expect(content).not.toHaveClass(styles.textContent);
    expect(content.tagName).toBe('BUTTON');
    expect(content).toHaveTextContent('0');
  });

  it('keeps invalid inline discount active without committing', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableDiscountCell
            lineItem={testLineItem}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByTestId('editable-numeric-content'));
    const input = screen.getByRole('textbox', { name: /discount/i });
    expect(input).toHaveValue('0');
    await user.clear(input);
    await user.type(input, '3000{Enter}');

    expect(await screen.findByText(/enter a discount/i)).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('renders locked rows without edit affordances', () => {
    render(
      <EditableDiscountCell
        lineItem={{ ...testLineItem, paymentStatus: PaymentStatus.PAID }}
        isEditable={false}
        activeEditorKey={null}
        setActiveEditorKey={jest.fn()}
        onCommit={jest.fn()}
      />,
    );

    expect(screen.queryByLabelText(/edit discount/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('editable-numeric-content')).toHaveTextContent('0');
    expect(screen.getByTestId('editable-numeric-content').tagName).toBe('SPAN');
  });

  it('keeps the rich discount icon separate from inline editing', async () => {
    const user = userEvent.setup();

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey, onCommit }) => (
          <EditableDiscountCell
            lineItem={testDiscountedLineItem}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByLabelText(/edit discount/i));

    expect(screen.getByRole('dialog', { name: /discount form/i })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /^discount$/i })).not.toBeInTheDocument();
  });
});
