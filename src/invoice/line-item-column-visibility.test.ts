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
      'no',
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

  it.each([
    ['default', getDefaultVisibleLineItemColumnKeys(), 1800],
    ['all', getLineItemColumnDefinitions().map((column) => column.key), 2400],
    ['required', normalizeLineItemVisibleColumnKeys([]), 1600],
  ] as const)('equalizes the %s data columns without stretching selection or counts', (_, keys, availableWidth) => {
    const definitions = getLineItemColumnDefinitions().filter((column) => keys.includes(column.key));
    const layoutColumns = getLineItemTableLayoutColumns(definitions, true);
    const layout = calculateLineItemTableColumnLayout(layoutColumns, availableWidth);
    const widths = new Map(layout.columns.map((column) => [column.key, column.width]));

    expect(layout.columns.reduce((sum, column) => sum + column.width, 0)).toBe(availableWidth);
    expect(widths.get('__selection__')).toBe(48);
    for (const column of definitions) {
      if (column.isFixed) {
        expect(widths.get(column.key)).toBe(column.minWidth);
      } else {
        expect(widths.get(column.key)).toBeGreaterThanOrEqual(column.minWidth);
      }
    }

    const dataWidths = definitions.filter((column) => !column.isFixed).map((column) => widths.get(column.key)!);
    expect(Math.max(...dataWidths) - Math.min(...dataWidths)).toBeLessThanOrEqual(1);
  });

  it.each([0, 900, 1200])('preserves readable minimums at a %ipx container width', (availableWidth) => {
    const definitions = getLineItemColumnDefinitions().filter((column) => column.defaultVisible);
    const layoutColumns = getLineItemTableLayoutColumns(definitions, false);
    const layout = calculateLineItemTableColumnLayout(layoutColumns, availableWidth);

    expect(layout.columns.reduce((sum, column) => sum + column.width, 0)).toBe(layout.layoutWidth);
    for (const column of definitions) {
      expect(layout.columns.find(({ key }) => key === column.key)?.width).toBeGreaterThanOrEqual(column.minWidth);
    }
    expect(layout.layoutWidth).toBe(Math.max(availableWidth, layout.totalMinWidth));
    expect(layout.columns.find(({ key }) => key === 'billItem')?.width).toBe(192);
    expect(layout.columns.find(({ key }) => key === 'provider')?.width).toBe(176);
  });

  it('does not allocate surplus width when there are no flexible data columns', () => {
    const layoutColumns = getLineItemTableLayoutColumns(
      getLineItemColumnDefinitions().filter((column) => column.isFixed),
      true,
    );

    expect(calculateLineItemTableColumnLayout(layoutColumns, 1600)).toEqual({
      columns: [
        { key: '__selection__', width: 48 },
        { key: 'no', width: 112 },
        { key: 'quantity', width: 80 },
      ],
      totalMinWidth: 240,
      layoutWidth: 240,
    });
    expect(calculateLineItemTableColumnLayout([], 1600)).toEqual({
      columns: [],
      totalMinWidth: 0,
      layoutWidth: 0,
    });
  });
});
