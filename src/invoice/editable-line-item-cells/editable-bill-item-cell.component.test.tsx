import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditableBillItemCell from './editable-bill-item-cell.component';
import { EditableCellHarness, testBillableServices, testLineItem } from './editable-cell-test-utils';
import { editableCellStyles as styles } from '../../editable-carbon-table-cell-kit';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('@carbon/react/icons', () => ({
  ChevronDown: () => <span>Chevron down</span>,
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
    expect(screen.getByLabelText(/select bill item/i)).toHaveTextContent('Chevron down');
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
            lineItem={testLineItem}
            billableServices={services}
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
    expect(screen.getByRole('dialog', { name: /bill item options/i })).toHaveClass(styles.billItemComboboxPopover);
    expect(within(screen.getByRole('dialog', { name: /bill item options/i })).queryByRole('combobox')).not.toBeInTheDocument();
    const input = screen.getByRole('combobox', { name: /select bill item/i });
    expect(input).toHaveValue('Consultation');
    await user.clear(input);
    await user.type(input, 'Clear');
    await user.click(await screen.findByText('Clear Aligner'));

    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommit).toHaveBeenCalledWith(
      testLineItem,
      expect.objectContaining({
        billableService: 'service-clear-aligner:Clear Aligner',
        price: 249999,
        priceName: 'Default',
        priceUuid: 'price-clear-aligner-default',
      }),
      expect.objectContaining({
        billableService: 'service-clear-aligner:Clear Aligner',
        price: 249999,
        priceName: 'Default',
        priceUuid: 'price-clear-aligner-default',
      }),
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
    expect(within(screen.getByRole('dialog', { name: /bill item options/i })).queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /select bill item/i })).toHaveValue('Consultation');
    expect(screen.getByTestId('editable-bill-item-search-input')).toHaveClass(styles.cellSearchInput);
    expect(screen.getByTestId('editable-cell-overlay-layer')).toHaveAttribute('data-align', 'bottom-left');
    expect(screen.getByTestId('editable-text-cell')).toHaveClass(styles.activeEditableCell);
  });

  it('does not commit typed free text without selecting a billable service', async () => {
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
    const combobox = screen.getByRole('combobox', { name: /select bill item/i });
    await user.clear(combobox);
    await user.type(combobox, 'Custom service{Escape}');

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /consultation/i })).toBeInTheDocument();
  });

  it('communicates when no bill item results are available', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey }) => (
          <EditableBillItemCell
            lineItem={testLineItem}
            billableServices={[]}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByLabelText(/select bill item/i));

    expect(screen.getByRole('combobox', { name: /select bill item/i })).toHaveValue('Consultation');
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('filters options from the in-cell input', async () => {
    const user = userEvent.setup();
    const services = [
      ...testBillableServices,
      {
        uuid: 'service-clear-aligner',
        name: 'Clear Aligner',
        shortName: 'Clear Aligner',
        serviceStatus: 'ENABLED',
        servicePrices: [],
      },
      {
        uuid: 'service-registration',
        name: 'Registration',
        shortName: 'Registration',
        serviceStatus: 'ENABLED',
        servicePrices: [],
      },
    ];

    render(
      <EditableCellHarness>
        {({ activeEditorKey, setActiveEditorKey, onCommit }) => (
          <EditableBillItemCell
            lineItem={testLineItem}
            billableServices={services}
            isEditable
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={onCommit}
          />
        )}
      </EditableCellHarness>,
    );

    await user.click(screen.getByLabelText(/select bill item/i));
    const input = screen.getByRole('combobox', { name: /select bill item/i });
    await user.clear(input);
    await user.type(input, 'Reg');

    expect(screen.getByText('Registration')).toBeInTheDocument();
    expect(screen.queryByText('Clear Aligner')).not.toBeInTheDocument();
  });

  it('reverts typed text on blur without committing', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn(async () => {});

    render(
      <>
        <button type="button">Outside target</button>
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
        </EditableCellHarness>
      </>,
    );

    await user.click(screen.getByLabelText(/select bill item/i));
    const input = screen.getByRole('combobox', { name: /select bill item/i });
    await user.clear(input);
    await user.type(input, 'Custom service');
    await user.click(screen.getByRole('button', { name: /outside target/i }));

    expect(onCommit).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: /consultation/i })).toBeInTheDocument());
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
    const input = screen.getByRole('combobox', { name: /select bill item/i });
    await user.clear(input);
    await user.type(input, 'Clear');
    await user.click(await screen.findByText('Clear Aligner'));

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
