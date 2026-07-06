## 1. Discount Amount and Percent Model

- [x] 1.1 Preserve the discount table cell as the inline actual amount editor and avoid converting the table display to percent.
- [x] 1.2 Derive the popover percent field from the current discount amount using the line item price when the popover opens.
- [x] 1.3 Update the actual discount amount when the popover percent changes using `price * percent / 100`.
- [x] 1.4 Clamp percent edits to the valid range and guard zero or missing price without divide-by-zero output.
- [x] 1.5 Round displayed percent values to the chosen precision so raw floating point tails never render.

## 2. Popover Simplification

- [x] 2.1 Remove the redundant amount input from the discount popover.
- [x] 2.2 Remove the popover heading/title, per-item discount readout, total formula line, and top reset link.
- [x] 2.3 Keep a single percent input in the popover.
- [x] 2.4 Keep the discount sponsor selector in the popover.
- [x] 2.5 Keep the comment textarea in the popover.
- [x] 2.6 Move the clear/reset behavior to a bottom `Clear` action.

## 3. Trigger and Styling

- [x] 3.1 Replace the discount cell hover/open affordance from the chevron to a `%` sign.
- [x] 3.2 Keep the discount cell displaying the actual discount amount while the `%` affordance is visible.
- [x] 3.3 Keep the welded popover seam, quiet field styling, and popover lift consistent with the existing editable cell system.
- [x] 3.4 Ensure price and bill-item editor triggers and popovers are not changed.

## 4. Test Coverage

- [x] 4.1 Update discount cell tests so inline amount editing still commits the actual discount amount.
- [x] 4.2 Add coverage for opening the popover after entering amount `20` on price `100` and seeing percent `20`.
- [x] 4.3 Add coverage for changing popover percent from `20` to `30` on price `100` and seeing table discount amount update to `30`.
- [x] 4.4 Add coverage that quantity does not multiply the percent conversion, such as quantity `2`, price `100`, percent `30`, resulting amount `30`.
- [x] 4.5 Add coverage that percent display never shows an unrounded floating point tail.
- [x] 4.6 Add coverage for the simplified popover content and bottom `Clear` action.
- [x] 4.7 Add coverage that the discount affordance renders `%` while price and bill-item affordances remain unchanged.
