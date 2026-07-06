## 1. Diagnose Current Width Contributors

- [x] 1.1 Inspect editable numeric display and inline edit DOM for price and discount cells.
- [x] 1.2 Identify which inline numeric editor and Carbon `TextInput` wrapper classes can contribute intrinsic width.
- [x] 1.3 Confirm the fix can be scoped to editable-line-item cell styles without changing table column definitions.

## 2. Constrain Inline Numeric Editor Width

- [x] 2.1 Update the inline numeric editor shell to use `box-sizing: border-box`, `min-width: 0`, `max-width: 100%`, and `width: 100%`.
- [x] 2.2 Scope Carbon `TextInput` wrapper constraints under the inline numeric editor class.
- [x] 2.3 Ensure the active input itself is constrained to the cell content width.
- [x] 2.4 Preserve right alignment for active price and discount input text.

## 3. Preserve Existing Behavior

- [x] 3.1 Confirm inline price editing still opens, validates, commits, and cancels as before.
- [x] 3.2 Confirm inline discount editing still opens, validates, commits, and cancels as before.
- [x] 3.3 Confirm rich price and discount popover editors are not changed.
- [x] 3.4 Confirm chevron affordances, row action icons, and table column definitions are not changed.

## 4. Regression Coverage

- [x] 4.1 Add or update focused tests for inline numeric editor width classes.
- [x] 4.2 Add or update focused tests for Carbon wrapper width constraints where practical.
- [x] 4.3 Add or update focused tests proving active numeric input remains right aligned.

## 5. Validation

- [x] 5.1 Run focused editable-line-item-cell tests.
- [x] 5.2 Run TypeScript validation.
- [x] 5.3 Run Storybook outside the sandbox and inspect that clicking price/discount inline cells no longer shifts column widths.
