import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditablePriceCell from './editable-price-cell.component';
import { EditableCellHarness, testBillableServices, testLineItem } from './editable-cell-test-utils';
import { PaymentStatus } from '../../types';
import { editableCellStyles as styles } from '../../editable-carbon-table-cell-kit';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('@carbon/react/icons', () => ({
  ChevronDown: () => <span>Chevron down</span>,
}));

describe('EditablePriceCell', () => {
  it('commits a valid inline price edit', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditablePriceCell
            lineItem={testLineItem}
            billableServices={testBillableServices}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByTestId('editable-numeric-content'));
    const input = screen.getByRole('textbox', { name: /price/i });
    const editor = screen.getByTestId('editable-inline-numeric-editor');
    expect(editor).toHaveClass(styles.numericEditor);
    expect(editor).toHaveClass(styles.inlineNumericEditor);
    expect(input.closest(`.${styles.inlineNumericInput}`)).toBeTruthy();
    expect(input.closest('[data-testid="editable-inline-numeric-editor"]')).toBe(editor);
    expect(screen.queryByRole('spinbutton', { name: /price/i })).not.toBeInTheDocument();
    await user.clear(input);
    await user.type(input, '2,100{Enter}');

    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommit).toHaveBeenCalledWith(testLineItem, { price: 2100 }, expect.objectContaining({ price: 2100 }));
  });

  it('commits a selected preset price', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditablePriceCell
            lineItem={testLineItem}
            billableServices={testBillableServices}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByLabelText(/select price option/i));
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/current price/i)).not.toBeInTheDocument();
    expect(screen.getByText(/select price option/i)).toHaveClass(styles.popoverTitle);
    expect(screen.getByTestId('editable-cell-overlay-layer')).toHaveAttribute('data-align', 'bottom-right');
    expect(screen.getByTestId('editable-numeric-cell')).toHaveClass(styles.activeEditableCell);
    expect(screen.getByText('Default - (2,000)')).toHaveClass(styles.priceOptionText);
    expect(screen.getByText('Card - (2,300)')).toHaveClass(styles.priceOptionText);
    expect(screen.getByRole('button', { current: true })).toContainElement(screen.getByText('✓'));
    expect(screen.getByRole('button', { name: /card - \(2,300\)/i })).toHaveClass(styles.priceOptionButton);
    await user.click(screen.getByRole('button', { name: /card - \(2,300\)/i }));

    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommit).toHaveBeenCalledWith(
      testLineItem,
      {
        price: 2300,
        priceName: 'Card',
        priceUuid: 'price-consultation-card',
      },
      expect.objectContaining({ price: 2300, priceName: 'Card', priceUuid: 'price-consultation-card' }),
    );
  });

  it('places numeric price content first with the affordance as a right-side floating overlay', () => {
    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey, onCommit }) => (
          <EditablePriceCell
            lineItem={testLineItem}
            billableServices={testBillableServices}
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
    expect(content).toHaveTextContent('2,000');
    expect(screen.getByLabelText(/select price option/i)).toHaveTextContent('Chevron down');
  });

  it('portals the rich price picker outside the table overflow boundary while preserving the floating trigger contract', async () => {
    const user = userEvent.setup();

    render(
      <div data-testid="table-overflow-boundary">
        <EditableCellHarness>
          {({ activeEditorKey, setActiveEditorKey, onCommit }) => (
            <EditablePriceCell
              lineItem={testLineItem}
              billableServices={testBillableServices}
              isEditable
              activeEditorKey={activeEditorKey}
              setActiveEditorKey={setActiveEditorKey}
              onCommit={onCommit}
            />
          )}
        </EditableCellHarness>
      </div>,
    );

    await user.click(screen.getByLabelText(/select price option/i));

    const boundary = screen.getByTestId('table-overflow-boundary');
    const dialog = screen.getByRole('dialog', { name: /price options/i });

    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveClass(styles.priceOptionsPopover);
    expect(screen.queryByRole('textbox', { name: /price/i })).not.toBeInTheDocument();
    expect(within(boundary).queryByRole('dialog', { name: /price options/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('editable-numeric-affordance')).toContainElement(
      screen.getByLabelText(/select price option/i),
    );
  });

  it('shows no selected price tier for a custom value that does not match an option', async () => {
    const user = userEvent.setup();

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey, onCommit }) => (
          <EditablePriceCell
            lineItem={{ ...testLineItem, price: 2111, priceName: '', priceUuid: '' }}
            billableServices={testBillableServices}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByLabelText(/select price option/i));

    expect(screen.queryByRole('button', { current: true })).not.toBeInTheDocument();
  });

  it('keeps invalid inline price active without committing', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditablePriceCell
            lineItem={testLineItem}
            billableServices={testBillableServices}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByTestId('editable-numeric-content'));
    const input = screen.getByRole('textbox', { name: /price/i });
    expect(input).toHaveValue('2,000');
    await user.clear(input);
    await user.keyboard('{Enter}');

    expect(await screen.findByText(/enter a valid price/i)).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('renders locked rows without edit affordances', () => {
    render(
      <EditablePriceCell
        lineItem={{ ...testLineItem, paymentStatus: PaymentStatus.PAID }}
        billableServices={testBillableServices}
        isEditable={false}
        activeEditorKey={null}
        setActiveEditorKey={jest.fn()}
        onCommit={jest.fn()}
      />,
    );

    expect(screen.queryByLabelText(/select price option/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('editable-numeric-content')).toHaveTextContent('2,000');
    expect(screen.getByTestId('editable-numeric-content').tagName).toBe('SPAN');
  });
});
