## 1. Confirm current geometry and ownership

- [x] 1.1 Inspect the current editable price, discount, bill-item, overlay, and shared stylesheet implementation before changing code.
- [x] 1.2 Confirm where numeric inline editing still uses `NumberInput` and where rich editor popovers use the portal overlay.
- [x] 1.3 Identify which styles currently allocate icon space through grid columns, flex gaps, padding reservations, or minimum widths.
- [x] 1.4 Record the root cause in implementation notes or code comments only if it clarifies a non-obvious constraint.

## 2. Replace numeric inline editor primitive

- [x] 2.1 Replace inline price `NumberInput` usage with text-based decimal input behavior that can hold comma-formatted draft values.
- [x] 2.2 Replace inline discount `NumberInput` usage with text-based decimal input behavior that can hold comma-formatted draft values.
- [x] 2.3 Preserve Enter commit, Escape cancel, blur commit, focus/select-on-open, validation, and disabled-row behavior for price editing.
- [x] 2.4 Preserve Enter commit, Escape cancel, blur commit, focus/select-on-open, validation, and disabled-row behavior for discount editing.
- [x] 2.5 Update shared numeric parsing helpers so grouped draft strings such as `249,999` parse to valid numeric values.

## 3. Standardize borderless in-cell edit surface

- [x] 3.1 Add or update reusable editable-cell styles so inline numeric editors fill the cell content surface and right-align their text.
- [x] 3.2 Remove boxed input chrome, native stepper geometry, external focus outlines, and margins that make the editor read as a form widget.
- [x] 3.3 Add a quiet focus treatment that remains inside the cell, such as an inset underline or subtle fill.
- [x] 3.4 Ensure entering inline edit mode does not increase invoice line-item row height.
- [x] 3.5 Ensure display value, active draft value, and restored display value use the same font scale and alignment.

## 4. Make edit icons out-of-flow affordances

- [x] 4.1 Replace lane-based editable-cell geometry with a cell shell where value/editor content owns the full cell width.
- [x] 4.2 Position numeric edit icon affordances absolutely at inline-start without allocating layout space.
- [x] 4.3 Position text edit icon affordances absolutely at inline-end without allocating layout space.
- [x] 4.4 Ensure icon hover, focus, and active visibility changes do not change table column widths, content alignment, or row height.
- [x] 4.5 Keep edit icon triggers semantically inside their production table cells for accessibility and event ownership.

## 5. Preserve rich editor portal behavior

- [x] 5.1 Confirm price option picker, discount form, and bill-item picker still render rich content through the editable-cell overlay portal.
- [x] 5.2 Ensure portal positioning still anchors to the out-of-flow trigger geometry.
- [x] 5.3 Ensure outside click, Escape, scroll/resize close behavior, and successful commit behavior still work after geometry changes.
- [x] 5.4 Confirm table overflow wrappers remain scrollable for responsive production behavior and are not changed to `overflow: visible`.

## 6. Update tests

- [x] 6.1 Update price inline-edit tests to cover text-based decimal drafts, comma parsing, right alignment contract, and no `NumberInput` stepper dependency.
- [x] 6.2 Update discount inline-edit tests to cover text-based decimal drafts, comma parsing, right alignment contract, and no `NumberInput` stepper dependency.
- [x] 6.3 Update bill-item tests to assert text-cell icon affordance placement does not consume layout space.
- [x] 6.4 Keep or restore a regression test proving rich editor content is not rendered inside the table overflow boundary.
- [x] 6.5 Add focused class/DOM contract assertions only where they protect the geometry standard without overfitting implementation details.

## 7. Validate production stories and type safety

- [x] 7.1 Run focused editable line-item cell tests.
- [x] 7.2 Run TypeScript validation if component or test types changed.
- [x] 7.3 Start Storybook outside the sandbox if browser inspection is needed.
- [x] 7.4 Inspect the pending bill production story at desktop width: inline price and discount edits should look like in-place table editing, not form controls.
- [x] 7.5 Inspect the pending bill production story at a narrow width: icons may overlap content but must not allocate layout space or alter table sizing.
- [x] 7.6 Confirm no Storybook-only editable-cell implementation or table redesign was introduced.
