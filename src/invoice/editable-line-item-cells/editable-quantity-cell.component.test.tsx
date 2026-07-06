import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditableQuantityCell from './editable-quantity-cell.component';
import { EditableCellHarness, testLineItem } from './editable-cell-test-utils';
import { PaymentStatus } from '../../types';
import { editableCellStyles as styles } from '../../editable-carbon-table-cell-kit';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

describe('EditableQuantityCell', () => {
  it('opens an inline quantity editor without a popover', async () => {
    const user = userEvent.setup();

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey, onCommit }) => (
          <EditableQuantityCell
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

    expect(screen.getByRole('textbox', { name: /quantity/i })).toHaveValue('1');
    expect(screen.getByTestId('editable-inline-numeric-editor')).toHaveClass(styles.inlineNumericEditor);
    expect(screen.queryByTestId('editable-cell-overlay-layer')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('commits a valid quantity edit on Enter', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableQuantityCell
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
    await user.clear(screen.getByRole('textbox', { name: /quantity/i }));
    await user.type(screen.getByRole('textbox', { name: /quantity/i }), '3{Enter}');

    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommit).toHaveBeenCalledWith(
      testLineItem,
      { quantity: 3 },
      expect.objectContaining({ quantity: 3, amount: 6000, total: 6000 }),
    );
  });

  it('commits a valid quantity edit on blur', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <>
        <EditableCellHarness>
          {({ activeEditorKey, setActiveEditorKey }) => (
            <EditableQuantityCell
              lineItem={testLineItem}
              isEditable
              activeEditorKey={activeEditorKey}
              setActiveEditorKey={setActiveEditorKey}
              onCommit={onCommit}
            />
          )}
        </EditableCellHarness>
        <button type="button">Outside</button>
      </>,
    );

    await user.click(screen.getByTestId('editable-numeric-content'));
    await user.clear(screen.getByRole('textbox', { name: /quantity/i }));
    await user.type(screen.getByRole('textbox', { name: /quantity/i }), '4');
    await user.click(screen.getByRole('button', { name: /outside/i }));

    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommit).toHaveBeenCalledWith(
      testLineItem,
      { quantity: 4 },
      expect.objectContaining({ quantity: 4, amount: 8000, total: 8000 }),
    );
  });

  it('cancels quantity edits on Escape', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableQuantityCell
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
    await user.clear(screen.getByRole('textbox', { name: /quantity/i }));
    await user.type(screen.getByRole('textbox', { name: /quantity/i }), '5');
    await user.keyboard('{Escape}');

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByTestId('editable-numeric-content')).toHaveTextContent('1');
    expect(screen.queryByRole('textbox', { name: /quantity/i })).not.toBeInTheDocument();
  });

  it.each(['', '0', '-1', '1.5', 'abc'])('rejects invalid quantity value %p without committing', async (value) => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableQuantityCell
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
    const input = screen.getByRole('textbox', { name: /quantity/i });
    await user.clear(input);
    if (value) {
      await user.type(input, value);
    }
    await user.keyboard('{Enter}');

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: /quantity/i })).toHaveValue('1');
    expect(screen.getByText(/enter a valid quantity/i)).toBeInTheDocument();
  });

  it('restores the previous quantity after invalid blur', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <>
        <EditableCellHarness>
          {({ activeEditorKey, setActiveEditorKey }) => (
            <EditableQuantityCell
              lineItem={testLineItem}
              isEditable
              activeEditorKey={activeEditorKey}
              setActiveEditorKey={setActiveEditorKey}
              onCommit={onCommit}
            />
          )}
        </EditableCellHarness>
        <button type="button">Outside</button>
      </>,
    );

    await user.click(screen.getByTestId('editable-numeric-content'));
    await user.clear(screen.getByRole('textbox', { name: /quantity/i }));
    await user.type(screen.getByRole('textbox', { name: /quantity/i }), '1.5');
    await user.click(screen.getByRole('button', { name: /outside/i }));

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByTestId('editable-numeric-content')).toHaveTextContent('1');
    expect(screen.queryByRole('textbox', { name: /quantity/i })).not.toBeInTheDocument();
  });

  it('renders non-editable quantity as static text without edit affordances', () => {
    render(
      <EditableQuantityCell
        lineItem={{ ...testLineItem, paymentStatus: PaymentStatus.PAID }}
        isEditable={false}
        activeEditorKey={null}
        setActiveEditorKey={jest.fn()}
        onCommit={jest.fn()}
      />,
    );

    expect(screen.getByTestId('editable-numeric-cell')).toHaveClass(styles.staticValue);
    expect(screen.getByTestId('editable-numeric-cell')).toHaveClass(styles.quantityEditableCell);
    expect(screen.getByTestId('editable-numeric-content')).toHaveTextContent('1');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('editable-numeric-affordance')).not.toBeInTheDocument();
  });

  it('uses shared numeric alignment classes for display and inline editor geometry', async () => {
    const user = userEvent.setup();

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableQuantityCell
            lineItem={testLineItem}
            isEditable={true}
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={jest.fn()}
          />
        )}
      </EditableCellHarness>,
    );

    const cell = screen.getByTestId('editable-numeric-cell');
    const content = screen.getByTestId('editable-numeric-content');

    expect(cell).toHaveClass(styles.quantityEditableCell);
    expect(content).toHaveClass(styles.numericContent);
    expect(content).toHaveClass(styles.cellSurfaceButton);

    await user.click(content);

    expect(screen.getByTestId('editable-inline-numeric-editor')).toHaveClass(styles.inlineNumericEditor);
    expect(screen.queryByTestId('editable-cell-overlay-layer')).not.toBeInTheDocument();
  });
});
