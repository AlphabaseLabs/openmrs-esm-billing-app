export type LineItemColumnKey =
  | 'no'
  | 'date'
  | 'billItem'
  | 'provider'
  | 'status'
  | 'quantity'
  | 'price'
  | 'discount'
  | 'tax'
  | 'total'
  | 'actionButton';

export type LineItemColumnDefinition = {
  key: LineItemColumnKey;
  translationKey: string;
  defaultLabel: string;
  required: boolean;
  defaultVisible: boolean;
  minWidth: number;
  isFixed: boolean;
};

export type LineItemTableLayoutColumnKey = LineItemColumnKey | '__selection__';

export type LineItemTableLayoutColumn = {
  key: LineItemTableLayoutColumnKey;
  minWidth: number;
  isFixed: boolean;
};

export type LineItemTableComputedColumn = {
  key: LineItemTableLayoutColumnKey;
  width: number;
};

export type LineItemTableColumnLayout = {
  columns: Array<LineItemTableComputedColumn>;
  totalMinWidth: number;
  layoutWidth: number;
};

export const LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY =
  'openmrs-esm-billing-app.invoice-table.visible-optional-columns.v2';

export const lineItemColumnDefinitions: Array<LineItemColumnDefinition> = [
  {
    key: 'no',
    translationKey: 'number',
    defaultLabel: 'Number',
    required: false,
    defaultVisible: true,
    minWidth: 112,
    isFixed: true,
  },
  {
    key: 'billItem',
    translationKey: 'billItem',
    defaultLabel: 'Bill item',
    required: true,
    defaultVisible: true,
    minWidth: 192,
    isFixed: false,
  },
  {
    key: 'provider',
    translationKey: 'provider',
    defaultLabel: 'Provider',
    required: false,
    defaultVisible: true,
    minWidth: 176,
    isFixed: false,
  },
  {
    key: 'quantity',
    translationKey: 'quantity',
    defaultLabel: 'Quantity',
    required: false,
    defaultVisible: false,
    minWidth: 80,
    isFixed: true,
  },
  {
    key: 'price',
    translationKey: 'price',
    defaultLabel: 'Price',
    required: true,
    defaultVisible: true,
    minWidth: 100,
    isFixed: false,
  },
  {
    key: 'discount',
    translationKey: 'discount',
    defaultLabel: 'Discount',
    required: false,
    defaultVisible: true,
    minWidth: 100,
    isFixed: false,
  },
  {
    key: 'tax',
    translationKey: 'tax',
    defaultLabel: 'Tax',
    required: false,
    defaultVisible: false,
    minWidth: 80,
    isFixed: false,
  },
  {
    key: 'total',
    translationKey: 'total',
    defaultLabel: 'Total',
    required: true,
    defaultVisible: true,
    minWidth: 100,
    isFixed: false,
  },
  {
    key: 'status',
    translationKey: 'status',
    defaultLabel: 'Status',
    required: false,
    defaultVisible: true,
    minWidth: 100,
    isFixed: false,
  },
  {
    key: 'actionButton',
    translationKey: 'action',
    defaultLabel: 'Action',
    required: true,
    defaultVisible: true,
    minWidth: 75,
    isFixed: false,
  },
  {
    key: 'date',
    translationKey: 'date',
    defaultLabel: 'Date',
    required: false,
    defaultVisible: true,
    minWidth: 120,
    isFixed: false,
  },
];

export const lineItemSelectionColumnDefinition: LineItemTableLayoutColumn = {
  key: '__selection__',
  minWidth: 48,
  isFixed: true,
};

const lineItemColumnKeys = new Set(lineItemColumnDefinitions.map((column) => column.key));
const hideableLineItemColumnKeys = new Set(
  lineItemColumnDefinitions.filter((column) => !column.required).map((column) => column.key),
);

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

export const isLineItemColumnKey = (value: unknown): value is LineItemColumnKey =>
  typeof value === 'string' && lineItemColumnKeys.has(value as LineItemColumnKey);

export const isHideableLineItemColumnKey = (value: unknown): value is LineItemColumnKey =>
  isLineItemColumnKey(value) && hideableLineItemColumnKeys.has(value);

export const getLineItemColumnDefinitions = () => lineItemColumnDefinitions;

export const getHideableLineItemColumnDefinitions = () =>
  lineItemColumnDefinitions.filter((column) => !column.required);

export const getDefaultVisibleLineItemColumnKeys = () =>
  lineItemColumnDefinitions.filter((column) => column.defaultVisible).map((column) => column.key);

export const getVisibleOptionalLineItemColumnKeys = (visibleColumnKeys: Array<LineItemColumnKey>) => {
  const visibleColumnKeySet = new Set(visibleColumnKeys);

  return lineItemColumnDefinitions
    .filter((column) => !column.required && visibleColumnKeySet.has(column.key))
    .map((column) => column.key);
};

export const normalizeLineItemVisibleColumnKeys = (visibleOptionalColumnKeys: unknown): Array<LineItemColumnKey> => {
  if (!Array.isArray(visibleOptionalColumnKeys)) {
    return getDefaultVisibleLineItemColumnKeys();
  }

  const visibleOptionalColumnKeySet = new Set(visibleOptionalColumnKeys.filter(isHideableLineItemColumnKey));

  return lineItemColumnDefinitions
    .filter((column) => column.required || visibleOptionalColumnKeySet.has(column.key))
    .map((column) => column.key);
};

export const readLineItemColumnVisibilityPreference = (storage = getStorage()) => {
  if (!storage) {
    return getDefaultVisibleLineItemColumnKeys();
  }

  try {
    const storedValue = storage.getItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY);

    if (!storedValue) {
      return getDefaultVisibleLineItemColumnKeys();
    }

    return normalizeLineItemVisibleColumnKeys(JSON.parse(storedValue));
  } catch {
    return getDefaultVisibleLineItemColumnKeys();
  }
};

export const writeLineItemColumnVisibilityPreference = (
  visibleColumnKeys: Array<LineItemColumnKey>,
  storage = getStorage(),
) => {
  if (!storage) {
    return;
  }

  storage.setItem(
    LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY,
    JSON.stringify(getVisibleOptionalLineItemColumnKeys(visibleColumnKeys)),
  );
};

export const getLineItemTableLayoutColumns = (
  visibleColumns: Array<LineItemColumnDefinition>,
  includeSelectionColumn: boolean,
): Array<LineItemTableLayoutColumn> => [
  ...(includeSelectionColumn ? [lineItemSelectionColumnDefinition] : []),
  ...visibleColumns.map(({ key, minWidth, isFixed }) => ({ key, minWidth, isFixed })),
];

export const calculateLineItemTableColumnLayout = (
  columns: Array<LineItemTableLayoutColumn>,
  availableWidth: number,
): LineItemTableColumnLayout => {
  const totalMinWidth = columns.reduce((sum, column) => sum + column.minWidth, 0);
  const normalizedAvailableWidth = Number.isFinite(availableWidth) && availableWidth > 0 ? availableWidth : 0;
  let flexibleColumns = columns.map((column, index) => ({ ...column, index })).filter((column) => !column.isFixed);
  const layoutWidth = Math.max(
    Math.ceil(totalMinWidth),
    flexibleColumns.length > 0 ? Math.floor(normalizedAvailableWidth) : 0,
  );
  const unroundedWidths = columns.map((column) => column.minWidth);
  let remainingWidth = layoutWidth - columns.reduce((sum, column) => sum + (column.isFixed ? column.minWidth : 0), 0);

  // Equalize the data columns, reserving wider minimums first when space is limited.
  while (flexibleColumns.length > 0) {
    const equalWidth = remainingWidth / flexibleColumns.length;
    const constrainedColumns = flexibleColumns.filter((column) => column.minWidth > equalWidth);

    if (constrainedColumns.length === 0) {
      for (const column of flexibleColumns) {
        unroundedWidths[column.index] = equalWidth;
      }
      break;
    }

    remainingWidth -= constrainedColumns.reduce((sum, column) => sum + column.minWidth, 0);
    flexibleColumns = flexibleColumns.filter((column) => column.minWidth <= equalWidth);
  }

  const floorWidths = unroundedWidths.map(Math.floor);
  const remainders = unroundedWidths
    .map((width, index) => ({ index, remainder: width - floorWidths[index] }))
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  let remainderToDistribute = layoutWidth - floorWidths.reduce((sum, width) => sum + width, 0);

  while (remainderToDistribute > 0 && remainders.length > 0) {
    for (const { index } of remainders) {
      if (remainderToDistribute === 0) {
        break;
      }

      floorWidths[index] += 1;
      remainderToDistribute -= 1;
    }
  }

  return {
    columns: columns.map((column, index) => ({
      key: column.key,
      width: floorWidths[index] ?? column.minWidth,
    })),
    totalMinWidth,
    layoutWidth,
  };
};
