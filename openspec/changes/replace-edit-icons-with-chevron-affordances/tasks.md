## 1. Locate Current Affordance Usage

- [x] 1.1 Identify the current pencil icon imports/usages in editable bill item, price, and discount cells.
- [x] 1.2 Identify tests and stories that refer to pencil/edit icon affordances.

## 2. Replace Cell-Level Icons

- [x] 2.1 Replace the bill item cell pencil affordance with the selected chevron icon.
- [x] 2.2 Replace the price cell pencil affordance with the selected chevron icon.
- [x] 2.3 Replace the discount cell pencil affordance with the selected chevron icon.
- [x] 2.4 Preserve existing affordance wrapper classes, position, hit target, active state, and visibility behavior.
- [x] 2.5 Style the chevron affordance as a borderless elevated chip with slight radius and shadow-defined edge.

## 3. Preserve Non-Cell Behavior

- [x] 3.1 Confirm row Action column icons are not changed by the chevron replacement.
- [x] 3.2 Confirm editor popover content, placement, and commit/reset behavior are not changed.
- [x] 3.3 Confirm table column widths, numeric alignment, and text alignment are not changed.

## 4. Update Coverage

- [x] 4.1 Update focused tests to expect chevron affordances for bill item, price, and discount cells.
- [x] 4.2 Update story interactions or assertions that reference pencil/edit affordance details.
- [x] 4.3 Add or update a regression check proving activating the chevron opens the same editor popover.

## 5. Validation

- [ ] 5.1 Run focused editable-line-item-cell tests.
- [ ] 5.2 Run TypeScript validation.
- [ ] 5.3 Run Storybook outside the sandbox and inspect the invoice table editable cells.
