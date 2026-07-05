## Why

The editable line-item cells are changing the invoice table column widths because their internal wrappers now contribute intrinsic minimum width to the table's auto-layout calculation. The table must own column geometry; editable-cell controls, floating icons, and portaled popovers must not reshape columns that were already correct.

## What Changes

- Make editable line-item cell internals layout-neutral inside invoice table cells.
- Remove editable-cell minimum widths and full-width/flex behavior that force DataTable column expansion.
- Preserve existing table-owned column widths for Bill item, Quantity, Price, Discount, Tax, Total, and Action.
- Keep values aligned according to their column type: text left-aligned and numbers right-aligned.
- Keep floating edit icons outside table layout space without reserving column width.
- Keep welded popovers portaled and anchored to cells without affecting table measurement.
- Add regression coverage proving editable cell wrappers do not introduce intrinsic sizing pressure.

## Capabilities

### New Capabilities

- `editable-cell-layout-neutrality`: Defines the requirement that editable line-item cell internals must not alter invoice table column widths or intrinsic table layout.

### Modified Capabilities

- None.

## Impact

- Affects production editable line-item cell styles and wrapper geometry.
- Affects Storybook production stories used to inspect invoice table column widths.
- Affects focused tests for editable cell layout contracts.
- No backend API or billing data model changes are expected.
