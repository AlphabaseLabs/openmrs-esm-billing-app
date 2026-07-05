## 1. Diagnose current geometry

- [x] 1.1 Identify current editable-cell DOM structure for bill item, price, and discount cells.
- [x] 1.2 Identify current CSS rules that control editable-cell layout, icon sizing, icon visibility, numeric alignment, and active editor width.
- [x] 1.3 Confirm which table columns require numeric editable-cell geometry.
- [x] 1.4 Document the root cause of the visible misalignment before changing implementation.

## 2. Define reusable lane primitives

- [x] 2.1 Introduce reusable editable-cell lane classes.
- [x] 2.2 Define a fixed affordance lane width and fixed gap using existing Carbon/OpenMRS spacing tokens.
- [x] 2.3 Ensure hidden, disabled, visible, and absent edit affordances preserve lane geometry.
- [x] 2.4 Ensure lane primitives are production code and are not Storybook-only.

## 3. Apply numeric geometry

- [x] 3.1 Update price editable cells to use left affordance lane and right-aligned value/editor lane.
- [x] 3.2 Update discount editable cells to use left affordance lane and right-aligned value/editor lane.
- [x] 3.3 Ensure read-only numeric cells preserve the same value alignment axis as editable numeric cells.
- [x] 3.4 Ensure active numeric editors replace only the content lane and remain right-aligned.

## 5. Stabilize table sizing and header alignment

- [x] 5.1 Define editable column minimum widths that account for display values, active editor width, affordance lane, gap, and table cell padding.
- [x] 5.2 Align numeric headers with numeric value/editor lanes rather than the full cell including affordance lane.
- [x] 5.3 Confirm narrow viewports use existing table overflow behavior rather than breaking editable-cell lane geometry.

## 6. Tests and stories

- [x] 6.1 Update editable-cell tests to assert numeric lane order: icon lane before content lane.
- [x] 6.2 Add or update tests proving icon visibility does not remove the numeric affordance lane.
- [x] 6.3 Confirm existing commit, cancel, disabled-state, and overlay behavior remains unchanged.
- [x] 6.4 Confirm production Storybook stories continue to use real `BillDetails`, `InvoiceTable`, and editable-cell code paths.

## 7. Validation

- [x] 7.1 Run focused editable-cell tests.
- [x] 7.2 Run TypeScript validation if code or test types changed.
- [x] 7.3 Inspect Storybook pending bill at desktop width and confirm numeric values, active numeric editor, and edit icons follow the lane standard.
- [x] 7.4 Inspect Storybook pending bill at a narrower width and confirm table overflow handles width pressure without breaking editable-cell geometry.
- [x] 7.5 Confirm no Storybook-only editable-cell implementation was introduced.
