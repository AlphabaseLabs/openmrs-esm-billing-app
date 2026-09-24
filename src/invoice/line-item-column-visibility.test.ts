import {
  calculateLineItemTableColumnLayout,
  getDefaultVisibleLineItemColumnKeys,
  getHideableLineItemColumnDefinitions,
  getLineItemColumnDefinitions,
  getLineItemTableLayoutColumns,
  getVisibleOptionalLineItemColumnKeys,
  LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY,
  normalizeLineItemVisibleColumnKeys,
  readLineItemColumnVisibilityPreference,
  writeLineItemColumnVisibilityPreference,
} from './line-item-column-visibility';

describe('line-item-column-visibility', () => {
  beforeEach(() => {
    window.localStorage.removeItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY);
  });

  it('keeps required columns visible when normalizing optional column preferences', () => {
    expect(normalizeLineItemVisibleColumnKeys(['tax'])).toEqual(['billItem', 'price', 'tax', 'total', 'actionButton']);
  });

  it('defaults all configured default columns when persisted data is absent or malformed', () => {
    expect(getDefaultVisibleLineItemColumnKeys()).toEqual([
      'billItem',
      'provider',
      'price',
      'discount',
      'total',
      'status',
      'actionButton',
      'date',
    ]);
    expect(readLineItemColumnVisibilityPreference()).toEqual(getDefaultVisibleLineItemColumnKeys());

    window.localStorage.setItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY, '{bad json');

    expect(readLineItemColumnVisibilityPreference()).toEqual(getDefaultVisibleLineItemColumnKeys());
  });

  it('restores a persisted tax column preference even though tax is hidden by default', () => {
    window.localStorage.setItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(['status', 'discount', 'tax']));

    expect(readLineItemColumnVisibilityPreference()).toEqual([
      'billItem',
      'price',
      'discount',
      'tax',
      'total',
      'status',
      'actionButton',
    ]);
  });

  it('ignores unknown ids and required-column ids in persisted optional preferences', () => {
    window.localStorage.setItem(
      LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY,
      JSON.stringify(['status', 'billItem', 'unknown-column']),
    );

    expect(readLineItemColumnVisibilityPreference()).toEqual(['billItem', 'price', 'total', 'status', 'actionButton']);
  });

  it('stores only visible optional column ids', () => {
    writeLineItemColumnVisibilityPreference(['billItem', 'quantity', 'price', 'total', 'actionButton']);

    expect(JSON.parse(window.localStorage.getItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY) ?? '[]')).toEqual([
      'quantity',
    ]);
  });

  it('exposes only optional columns as hideable', () => {
    expect(getHideableLineItemColumnDefinitions().map((column) => column.key)).toEqual([
      'no',
      'provider',
      'quantity',
      'discount',
      'tax',
      'status',
      'date',
    ]);
  });

  it('extracts visible optional ids in registry order', () => {
    expect(getVisibleOptionalLineItemColumnKeys(['tax', 'billItem', 'quantity', 'price', 'actionButton'])).toEqual([
      'quantity',
      'tax',
    ]);
  });

  it('builds rendered layout columns with the synthetic selection column when present', () => {
    const layoutColumns = getLineItemTableLayoutColumns(getLineItemColumnDefinitions(), true);

    expect(layoutColumns.map((column) => column.key)).toEqual([
      '__selection__',
      'no',
      'billItem',
      'provider',
      'quantity',
      'price',
      'discount',
      'tax',
      'total',
      'status',
      'actionButton',
      'date',
    ]);
    expect(layoutColumns[0]).toEqual(
      expect.objectContaining({
        isFixed: true,
        growWeight: 0,
      }),
    );
  });

  it('builds rendered layout columns without the synthetic selection column when absent', () => {
    const layoutColumns = getLineItemTableLayoutColumns(getLineItemColumnDefinitions(), false);

    expect(layoutColumns.map((column) => column.key)).toEqual([
      'no',
      'billItem',
      'provider',
      'quantity',
      'price',
      'discount',
      'tax',
      'total',
      'status',
      'actionButton',
      'date',
    ]);
  });

  it('rounds fractional minimum widths to whole pixels when available width is narrower', () => {
    const layoutColumns = getLineItemTableLayoutColumns(getLineItemColumnDefinitions(), true).map((column) =>
      column.key === 'quantity' ? { ...column, minWidth: 80.8 } : column,
    );
    const layout = calculateLineItemTableColumnLayout(layoutColumns, 100);

    expect(layout.totalMinWidth).toBeCloseTo(1283.8);
    expect(layout.layoutWidth).toBe(1284);
    expect(layout.columns.find((column) => column.key === 'quantity')?.width).toBe(81);
    expect(layout.columns.reduce((sum, column) => sum + column.width, 0)).toBe(layout.layoutWidth);
    expect(layout.columns.find((column) => column.key === 'actionButton')?.width).toBe(75);
  });

  it('distributes surplus only to flexible columns and keeps fixed columns stable', () => {
    const layoutColumns = getLineItemTableLayoutColumns(getLineItemColumnDefinitions(), true);
    const layout = calculateLineItemTableColumnLayout(layoutColumns, 1600);

    expect(layout.columns.reduce((sum, column) => sum + column.width, 0)).toBe(1600);
    expect(layout.columns.find((column) => column.key === '__selection__')?.width).toBe(48);
    expect(layout.columns.find((column) => column.key === 'actionButton')?.width).toBe(75);
    for (const key of ['price', 'discount', 'total']) {
      expect(layout.columns.find((column) => column.key === key)?.width).toBe(100);
    }
    expect(layout.columns.find((column) => column.key === 'status')?.width).toBe(100);
    expect(layout.columns.find((column) => column.key === 'date')?.width).toBe(120);
    expect(layout.columns.find((column) => column.key === 'quantity')?.width).toBe(80);
    expect(layout.columns.find((column) => column.key === 'tax')?.width).toBe(80);
    expect(layout.columns.find((column) => column.key === 'billItem')?.width).toBeGreaterThan(224);
  });
});
