import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditableBillItemCell from './editable-bill-item-cell.component';
import { EditableCellHarness, testBillableServices, testLineItem } from './editable-cell-test-utils';
import styles from './editable-line-item-cells.scss';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('@openmrs/esm-framework', () => ({
  EditIcon: () => <span>Edit</span>,
}));

describe('EditableBillItemCell', () => {
  it('renders the production bill item value', () => {
    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey, onCommit }) => (
          <EditableBillItemCell
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

    expect(screen.getByRole('button', { name: /consultation/i })).toBeInTheDocument();
  });

  it('places text bill item affordance as a floating overlay after left-aligned full-width content', () => {
    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey, onCommit }) => (
          <EditableBillItemCell
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

    const cell = screen.getByTestId('editable-text-cell');
    const affordance = screen.getByTestId('editable-text-affordance');
    const content = screen.getByTestId('editable-text-content');

    expect(cell).toHaveClass(styles.textEditableCell);
    expect(affordance).toHaveClass(styles.floatingAffordance);
    expect(affordance).toHaveClass(styles.textAffordance);
    expect(content).toHaveClass(styles.editableCellContent);
    expect(content).toHaveClass(styles.textContent);
    expect(content).toHaveClass(styles.cellSurfaceButton);
    expect(content).not.toHaveClass(styles.numericContent);
    expect(content.tagName).toBe('BUTTON');
    expect(content).toHaveTextContent('Consultation');
    expect(affordance).toContainElement(screen.getByLabelText(/select bill item/i));
  });

  it('runs the bill item inline action from the full text content surface', async () => {
    const user = userEvent.setup();
    const setActiveEditorKey = jest.fn();

    render(
      <EditableBillItemCell
        lineItem={testLineItem}
        billableServices={testBillableServices}
        isEditable
        activeEditorKey={null}
        setActiveEditorKey={setActiveEditorKey}
        onCommit={jest.fn()}
      />,
    );

    await user.click(screen.getByTestId('editable-text-content'));

    expect(setActiveEditorKey).toHaveBeenCalledTimes(1);
  });

  it('keeps the rich bill item icon separate from the inline surface action', async () => {
    const user = userEvent.setup();
    const setActiveEditorKey = jest.fn();

    render(
      <EditableBillItemCell
        lineItem={testLineItem}
        billableServices={testBillableServices}
        isEditable
        activeEditorKey={null}
        setActiveEditorKey={setActiveEditorKey}
        onCommit={jest.fn()}
      />,
    );

    await user.click(screen.getByLabelText(/select bill item/i));

    expect(setActiveEditorKey).toHaveBeenCalledTimes(1);
  });

  it('commits a selected bill item from the production picker', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableBillItemCell
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

    await user.click(screen.getByLabelText(/select bill item/i));
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    await user.click(
      within(screen.getByRole('dialog', { name: /bill item options/i })).getByRole('button', { name: 'Consultation' }),
    );

    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommit).toHaveBeenCalledWith(
      testLineItem,
      expect.objectContaining({ billableService: 'service-consultation:Consultation' }),
      expect.objectContaining({ billableService: 'service-consultation:Consultation' }),
    );
  });

  it('opens the production picker from the whole text cell and anchors it to the cell', async () => {
    const user = userEvent.setup();

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey, onCommit }) => (
          <EditableBillItemCell
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

    await user.click(screen.getByRole('button', { name: /consultation/i }));

    expect(screen.getByRole('dialog', { name: /bill item options/i })).toBeInTheDocument();
    expect(screen.getByTestId('editable-cell-overlay-layer')).toHaveAttribute('data-align', 'bottom-left');
    expect(screen.getByTestId('editable-text-cell')).toHaveClass(styles.activeEditableCell);
  });

  it('preserves a manual price override when changing bill item', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});
    const customPriceLineItem = {
      ...testLineItem,
      price: 2111,
      priceName: '',
      priceUuid: '',
    };
    const services = [
      ...testBillableServices,
      {
        uuid: 'service-clear-aligner',
        name: 'Clear Aligner',
        shortName: 'Clear Aligner',
        serviceStatus: 'ENABLED',
        servicePrices: [
          {
            uuid: 'price-clear-aligner-default',
            name: 'Default',
            price: 249999,
          },
        ],
      },
    ];

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableBillItemCell
            lineItem={customPriceLineItem}
            billableServices={services}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByRole('button', { name: /consultation/i }));
    await user.click(screen.getByRole('button', { name: /clear aligner/i }));

    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommit).toHaveBeenCalledWith(
      customPriceLineItem,
      expect.not.objectContaining({ price: 249999 }),
      expect.objectContaining({ price: 2111 }),
    );
  });

  it('renders locked rows without edit affordances', () => {
    render(
      <EditableBillItemCell
        lineItem={testLineItem}
        billableServices={testBillableServices}
        isEditable={false}
        activeEditorKey={null}
        setActiveEditorKey={jest.fn()}
        onCommit={jest.fn()}
      />,
    );

    expect(screen.getByText('Consultation')).toBeInTheDocument();
    expect(screen.queryByLabelText(/select bill item/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('editable-text-content')?.tagName).toBe('SPAN');
  });
});
