## 1. Discount Math and State Model

- [x] 1.1 Locate the existing discount editable-cell component, popover content, trigger-cell styling, and amount/percent sync paths before changing behavior.
- [x] 1.2 Add or update discount formatting helpers so amount displays as whole currency and percent displays to exactly 2 decimal places on every render path.
- [x] 1.3 Update amount-to-percent and percent-to-amount handlers to compute from selected item price, clamp amount to `0..subtotal`, clamp percent to `0..100`, and avoid raw floating-point display tails.
- [x] 1.4 Make the live-apply model explicit by tracking the last saved/opening discount snapshot and wiring Reset to restore amount, percent, sponsor, comment, row totals, and bill summary to that snapshot.
- [x] 1.5 Ensure click-away and Esc close the popover while keeping the current live-applied discount values.

## 2. Discount Popover Content

- [x] 2.1 Replace the separate stacked `Amount` and `Percent` labels with one `Enter discount value` group label above two side-by-side value fields.
- [x] 2.2 Render inline unit suffixes inside the amount and percent fields, with value left-aligned and muted `amount` / `percent` text right-aligned in the same field surface.
- [x] 2.3 Add the `Discount per item` label and emphasized live value that tracks the amount field.
- [x] 2.4 Add the muted live total line in the format `Total discount: <quantity> x <per-item> = <total>`.
- [x] 2.5 Replace the bare sponsor input with a pre-filled single-select containing `Practice and doctor`, `Practice`, and `Doctor`, including the trailing selector/entity icon affordance.
- [x] 2.6 Replace the comment single-line input with a compact 2-3 row textarea using the same quiet field treatment.

## 3. Welded Visual Treatment

- [x] 3.1 Apply quiet editor field styling consistently across amount, percent, sponsor, and comment controls so they do not render as heavy Carbon grey form blocks.
- [x] 3.2 Add the subtle popover shadow to the discount menu surface while keeping the border and avoiding a heavy floating-card appearance.
- [x] 3.3 Preserve one visual seam at the discount cell/popover join and avoid doubled borders between the active cell and menu.
- [x] 3.4 Update only the discount trigger cell to use the corrected transparent/borderless input surface with a bare right-aligned chevron that flips up while open.
- [x] 3.5 Confirm price and bill-item editor behavior and layout are untouched by the discount-specific styling changes.

## 4. Tests and Story Coverage

- [x] 4.1 Update focused discount editor tests for rounded amount/percent display, sync in both directions, and clamping behavior.
- [x] 4.2 Add or update tests for live `Discount per item` and `Total discount` read-outs.
- [x] 4.3 Add or update tests for Reset reverting to the last saved/opening state while click-away/Esc keeps live-applied edits.
- [x] 4.4 Update Storybook fixtures or stories only as needed to expose the discount editor states and sponsor options using production components, not mock replacement components.
- [x] 4.5 Do not run validation commands unless explicitly requested.
