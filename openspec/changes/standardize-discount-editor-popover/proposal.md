## Why

The discount editor currently exposes raw calculation artifacts, omits key discount context from the mockup, and visually reads like a default form rather than part of the welded editable-cell editor system. This change closes the UX gap for the discount editor without redesigning the bill-item or price editors.

## What Changes

- Scope the change to the discount editor popover and discount trigger cell only.
- Round synced amount and percent values on every display path so raw floating-point tails never appear.
- Standardize amount/percent editing under one "Enter discount value" group with inline unit suffixes inside the fields.
- Add live "Discount per item" and `qty x per-item = total` read-outs.
- Replace the plain discount sponsor field with a pre-filled single-select including the trailing entity/token icon affordance.
- Replace the comment single-line field with a compact multi-line textarea.
- Keep the existing live-apply commit model deliberately: edits apply as typed, click-away/Esc keep changes, and Reset reverts to the last saved discount state.
- Align the discount editor visual treatment with the welded/quiet editor language: quiet fields, subtle popover lift, single cell/popover seam, and matching discount trigger cell behavior.
- Leave price and bill-item editor behavior untouched.

## Capabilities

### New Capabilities
- `discount-editor-popover`: Discount editor content, value-sync behavior, commit model, and welded visual presentation.

### Modified Capabilities

None.

## Impact

- Affected UI: discount editable cell, discount editor popover, sponsor selector, comment field, and discount trigger-cell open state.
- Affected calculations: amount-to-percent and percent-to-amount display formatting, bounds handling, and live read-outs based on `quantity x price` subtotal.
- Affected tests/stories: discount editable-cell behavior tests and Storybook/fixture coverage for pending bill discount editing.
- No API or dependency changes expected.
