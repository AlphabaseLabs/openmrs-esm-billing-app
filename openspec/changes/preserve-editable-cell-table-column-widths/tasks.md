## 1. Diagnose Column Sizing Source

- [x] 1.1 Inspect the current invoice table row/cell markup and identify which editable-cell wrappers participate in `td` intrinsic width measurement.
- [x] 1.2 Identify CSS rules in editable line-item cells that introduce `min-width`, fixed width, flex min-content expansion, padding reservation, or icon layout lanes.
- [x] 1.3 Confirm that portaled popovers are not direct participants in table column measurement.

## 2. Remove Editable-Cell Sizing Pressure

- [x] 2.1 Remove or neutralize editable-cell `min-width` rules that force Price or Discount columns wider than their table-owned width.
- [x] 2.2 Ensure editable cell root, content, and button wrappers use shrink-safe behavior such as `min-width: 0` without forcing a larger intrinsic width.
- [x] 2.3 Ensure numeric editable-cell display values and inline editors right-align inside the existing `td` width.
- [x] 2.4 Ensure text editable-cell display values left-align inside the existing `td` width.
- [x] 2.5 Ensure floating edit icons remain absolutely positioned and do not add padding, margin, grid, or flex lanes that reserve horizontal space.

## 3. Preserve Existing Editor Behavior

- [x] 3.1 Verify Bill item, Price, and Discount popovers remain portaled and cell-anchored after layout-neutral CSS changes.
- [x] 3.2 Verify welded active-cell styling does not add border-box width that shifts table columns.
- [x] 3.3 Verify inline Price and Discount editors still commit/cancel according to the existing editable-cell behavior.
- [x] 3.4 Verify locked rows remain static and do not expose editable affordances.

## 4. Regression Coverage

- [x] 4.1 Add or update focused tests that assert editable-cell wrappers do not expose intrinsic minimum width classes or layout-reserved icon lanes.
- [x] 4.2 Add or update tests that assert floating icon affordances remain outside normal layout flow.
- [x] 4.3 Add or update Storybook coverage or story metadata so the default pending bill and open-editor states can be inspected for column-width stability using production components.

## 5. Validation

- [ ] 5.1 Run focused editable-line-item-cell tests.
- [ ] 5.2 Run TypeScript validation.
- [ ] 5.3 Run Storybook outside the sandbox and inspect that opening Bill item, Price, and Discount editors does not shift table columns.
