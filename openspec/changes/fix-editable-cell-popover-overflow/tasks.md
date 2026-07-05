## 1. Confirm the overflow boundary

- [x] 1.1 Identify the Carbon/OpenMRS table wrapper that owns scroll or overflow for `InvoiceTable`.
- [x] 1.2 Confirm which editable-cell popovers are rich overlays and which cell interactions can remain inline.
- [x] 1.3 Document the exact DOM ownership problem before changing code: trigger inside table, popover currently inside table overflow.

## 2. Introduce overlay ownership

- [x] 2.1 Add a small production overlay/portal helper for editable line-item cells without adding a Storybook-only implementation.
- [x] 2.2 Move rich price, discount, and bill-item editor popover content out of the table cell DOM and into the overlay helper.
- [x] 2.3 Keep visible cell values, edit triggers, disabled states, and active editor keys owned by the existing production `InvoiceTable` flow.

## 3. Anchor and lifecycle behavior

- [x] 3.1 Position the overlay using active trigger or cell geometry rather than table-cell-relative absolute positioning.
- [x] 3.2 Ensure only one editable line-item overlay can be active at a time.
- [x] 3.3 Close or reposition the active overlay on viewport scroll and resize so it cannot remain detached from its trigger.
- [x] 3.4 Preserve outside-click, escape/cancel, and successful commit behavior after portalization.

## 4. Styling and layout constraints

- [x] 4.1 Remove or neutralize table-cell-local popover positioning styles that cause table overflow ownership.
- [x] 4.2 Keep table wrappers scrollable for responsive production table behavior.
- [x] 4.3 Use app-appropriate overlay z-index and spacing without relying on z-index to escape overflow clipping.

## 5. Tests and stories

- [x] 5.1 Update editable-cell tests to query overlay content from the document or overlay root while keeping triggers inside the table.
- [x] 5.2 Add or update a regression test proving the rich popover is not rendered as a descendant of the table scroll container.
- [x] 5.3 Confirm existing line-item commit tests still pass for price, discount, and bill-item edits.
- [x] 5.4 Confirm production Storybook stories continue to use real `BillDetails`, `InvoiceTable`, and editable-cell code paths.

## 6. Final validation

- [x] 6.1 Run the focused editable line-item cell tests.
- [x] 6.2 Run TypeScript validation if code or test types changed.
- [x] 6.3 Manually inspect Storybook pending bill behavior: opening a rich editor must not make the table/icon area scroll.
- [x] 6.4 Confirm no new Storybook-only editable-cell implementation was introduced.
