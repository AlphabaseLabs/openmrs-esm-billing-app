import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditableDiscountCell from './editable-discount-cell.component';
import { EditableCellHarness, testDiscountedLineItem, testLineItem } from './editable-cell-test-utils';
import { PaymentStatus } from '../../types';
import { editableCellStyles as styles } from '../../editable-carbon-table-cell-kit';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string, options?: Record<string, string | number>) =>
      Object.entries(options ?? {}).reduce(
        (text, [key, value]) => text.replace(`{{${key}}}`, String(value)),
        fallback,
      ),
  }),
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
    const editor = screen.getByTestId('editable-inline-numeric-editor');
    expect(editor).toHaveClass(styles.numericEditor);
    expect(editor).toHaveClass(styles.inlineNumericEditor);
    expect(input.closest(`.${styles.inlineNumericInput}`)).toBeTruthy();
    expect(input.closest('[data-testid="editable-inline-numeric-editor"]')).toBe(editor);
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

  it('auto-commits valid percent edits as actual discount amounts without save or cancel actions', async () => {
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

    await user.click(screen.getByLabelText(/open discount editor/i));
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('editable-cell-overlay-layer')).toHaveAttribute('data-align', 'bottom-left');
    expect(screen.getByLabelText(/open discount editor/i)).toHaveClass(styles.discountOptionsButtonHidden);
    expect(screen.getByTestId('editable-numeric-cell')).toHaveClass(styles.activeEditableCell);
    expect(screen.queryByRole('textbox', { name: /amount/i })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /percent/i })).toHaveValue('25');
    await user.clear(screen.getByRole('textbox', { name: /percent/i }));
    await user.type(screen.getByRole('textbox', { name: /percent/i }), '30');

    await waitFor(() => expect(onCommit).toHaveBeenCalled());
    expect(screen.getByRole('textbox', { name: /percent/i })).toHaveValue('30');
    expect(onCommit).toHaveBeenLastCalledWith(
      testDiscountedLineItem,
      { discounts: [expect.objectContaining({ amount: 600, baseAmount: 2000, rate: 0.3 })] },
      expect.objectContaining({ discounts: [expect.objectContaining({ amount: 600 })] }),
    );
  });

  it('rounds percent display without showing redundant amount readouts', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});
    const highPriceLineItem = {
      ...testLineItem,
      price: 259999,
      discounts: [{ amount: 10, baseAmount: 259999, rate: 10 / 259999 }],
    };

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableDiscountCell
            lineItem={highPriceLineItem}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByLabelText(/open discount editor/i));

    expect(screen.getByRole('textbox', { name: /percent/i })).toHaveValue('0.0038');
    expect(screen.queryByRole('textbox', { name: /amount/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/discount per item/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/total discount/i)).not.toBeInTheDocument();
  });

  it('clamps percent drafts and commits the bounded amount', async () => {
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

    await user.click(screen.getByLabelText(/open discount editor/i));
    fireEvent.change(screen.getByRole('textbox', { name: /percent/i }), { target: { value: '300' } });

    expect(screen.getByRole('textbox', { name: /percent/i })).toHaveValue('300');
    await waitFor(() => expect(onCommit).toHaveBeenCalled());
    expect(onCommit).toHaveBeenLastCalledWith(
      testDiscountedLineItem,
      { discounts: [expect.objectContaining({ amount: 2000, baseAmount: 2000 })] },
      expect.objectContaining({ discounts: [expect.objectContaining({ amount: 2000 })] }),
    );
  });

  it('clears discount from the bottom action and keeps the form open', async () => {
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

    await user.click(screen.getByLabelText(/open discount editor/i));
    await user.click(screen.getByRole('button', { name: /^clear$/i }));

    await waitFor(() => expect(onCommit).toHaveBeenCalled());
    expect(screen.getByRole('textbox', { name: /percent/i })).toHaveValue('0');
    expect(onCommit).toHaveBeenLastCalledWith(
      testDiscountedLineItem,
      { discounts: [] },
      expect.objectContaining({ discounts: [] }),
    );
    expect(screen.getByRole('dialog', { name: /discount form/i })).toBeInTheDocument();
  });

  it('renders only percent input, sponsor selector, compact comment textarea, and clear action in the popover', async () => {
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

    await user.click(screen.getByLabelText(/open discount editor/i));
    expect(screen.getByRole('textbox', { name: /percent/i })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /amount/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Discount$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/discount per item/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/total discount/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^clear$/i })).toBeInTheDocument();
    const sponsorSelect = screen.getByRole('combobox', { name: /discount sponsor/i });
    expect(sponsorSelect).toHaveValue('Practice and doctor');
    expect(screen.getByRole('textbox', { name: /comment/i }).tagName).toBe('TEXTAREA');

    await user.click(sponsorSelect);
    expect(screen.getByRole('listbox', { name: /discount sponsor/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Practice' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Doctor' })).toBeInTheDocument();
  });

  it('places numeric discount content first with the affordance as a right-side floating overlay', () => {
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
    expect(screen.getByLabelText(/open discount editor/i)).toHaveTextContent('%');
    expect(screen.getByLabelText(/open discount editor/i)).not.toHaveClass(styles.discountOptionsButtonHidden);
  });

  it('derives popover percent from price and updates the actual table amount from percent', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});
    const lineItem = {
      ...testLineItem,
      price: 100,
      discounts: [{ amount: 20, baseAmount: 100, rate: 0.2 }],
    };

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableDiscountCell
            lineItem={lineItem}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByLabelText(/open discount editor/i));
    expect(screen.getByRole('textbox', { name: /percent/i })).toHaveValue('20');
    await user.clear(screen.getByRole('textbox', { name: /percent/i }));
    await user.type(screen.getByRole('textbox', { name: /percent/i }), '30');

    await waitFor(() => expect(onCommit).toHaveBeenCalled());
    expect(screen.getByRole('textbox', { name: /percent/i })).toHaveValue('30');
    expect(onCommit).toHaveBeenLastCalledWith(
      lineItem,
      { discounts: [expect.objectContaining({ amount: 30, rate: 0.3 })] },
      expect.objectContaining({ discounts: [expect.objectContaining({ amount: 30 })] }),
    );
  });

  it('preserves raw focused percent text and normalizes on blur', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});
    const lineItem = {
      ...testLineItem,
      price: 259999,
      discounts: [{ amount: 10, baseAmount: 259999, rate: 10 / 259999 }],
    };

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableDiscountCell
            lineItem={lineItem}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByLabelText(/open discount editor/i));
    const percentInput = screen.getByRole('textbox', { name: /percent/i });
    await user.clear(percentInput);
    await user.type(percentInput, '10.');

    expect(percentInput).toHaveValue('10.');
    await user.type(percentInput, '5');

    expect(percentInput).toHaveValue('10.5');
    await waitFor(() => expect(onCommit).toHaveBeenCalled());
    expect(onCommit).toHaveBeenLastCalledWith(
      lineItem,
      { discounts: [expect.objectContaining({ amount: 27300, rate: expect.any(Number) })] },
      expect.objectContaining({ discounts: [expect.objectContaining({ amount: 27300 })] }),
    );
    const lastCommitCall = onCommit.mock.calls[onCommit.mock.calls.length - 1] as any[];
    const lastDiscountRate = lastCommitCall?.[1]?.discounts?.[0]?.rate;
    expect(lastDiscountRate).toBeCloseTo(27300 / lineItem.price);

    fireEvent.blur(percentInput);
    expect(percentInput).toHaveValue('10.5');
  });

  it('does not multiply percent conversion by quantity', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});
    const lineItem = {
      ...testLineItem,
      quantity: 2,
      price: 100,
      discounts: [{ amount: 20, baseAmount: 100, rate: 0.2 }],
    };

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableDiscountCell
            lineItem={lineItem}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByLabelText(/open discount editor/i));
    await user.clear(screen.getByRole('textbox', { name: /percent/i }));
    await user.type(screen.getByRole('textbox', { name: /percent/i }), '30');

    await waitFor(() => expect(onCommit).toHaveBeenCalled());
    expect(onCommit).toHaveBeenLastCalledWith(
      lineItem,
      { discounts: [expect.objectContaining({ amount: 30, rate: 0.3 })] },
      expect.objectContaining({ discounts: [expect.objectContaining({ amount: 30 })] }),
    );
  });

  it('clamps invalid inline discount edits without leaving the editor invalid', async () => {
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

    await waitFor(() => expect(onCommit).toHaveBeenCalled());
    expect(onCommit).toHaveBeenCalledWith(
      testLineItem,
      { discounts: [expect.objectContaining({ amount: 2000, baseAmount: 2000 })] },
      expect.objectContaining({ discounts: [expect.objectContaining({ amount: 2000 })] }),
    );
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

    expect(screen.queryByLabelText(/open discount editor/i)).not.toBeInTheDocument();
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

    await user.click(screen.getByLabelText(/open discount editor/i));

    expect(screen.getByRole('dialog', { name: /discount form/i })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /^discount$/i })).not.toBeInTheDocument();
  });
});
