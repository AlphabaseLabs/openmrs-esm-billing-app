## 1. Affordance State Wiring

- [ ] 1.1 Locate the current edit icon visibility classes/usages in bill item, price, discount, and shared editable-cell styles.
- [ ] 1.2 Derive an `isAnyEditorOpen` state from `activeEditorKey !== null` in each editable-cell component that renders an edit icon.
- [ ] 1.3 Apply a shared suppression marker/class to every editable-cell edit icon when `isAnyEditorOpen` is true, including the currently active cell.

## 2. Shared Visibility Rule

- [ ] 2.1 Add a shared SCSS rule that hides suppressed edit icons and disables pointer events.
- [ ] 2.2 Ensure the suppression rule overrides hover, focus-within, and open-state icon visibility.
- [ ] 2.3 Preserve normal hover/focus edit icon behavior when `activeEditorKey` is null.

## 3. Regression Coverage

- [ ] 3.1 Add or update focused tests proving price editor open hides all editable-cell edit icons.
- [ ] 3.2 Add or update focused tests proving hover/focus does not reveal inactive editable-cell icons while any editor is open.
- [ ] 3.3 Add or update focused tests proving row-level Action column icons remain unaffected.

## 4. Validation

- [ ] 4.1 Run focused editable-line-item-cell tests.
- [ ] 4.2 Run TypeScript validation.
- [ ] 4.3 Run Storybook outside the sandbox and inspect the editable-cell open-popover state.
