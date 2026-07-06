## 1. Percent Display Polish

- [x] 1.1 Replace fixed 4-decimal settled percent formatting with max-4-decimal formatting that trims trailing zeroes.
- [x] 1.2 Preserve the tiny non-zero percent floor indicator for values below the visible precision floor.
- [x] 1.3 Ensure whole percent values display without decimals, such as `10` instead of `10.0000`.
- [x] 1.4 Ensure meaningful decimal values keep only needed decimals, such as `10.5`, `10.05`, and `0.0038`.

## 2. Popover Geometry

- [x] 2.1 Change the discount popover overlay alignment so the popover left border aligns to the discount cell left border.
- [x] 2.2 Preserve the welded seam and existing popover content while changing only the anchor alignment.
- [x] 2.3 Ensure price and bill-item popover alignment is not changed.

## 3. Percent Affordance Visibility

- [x] 3.1 Keep the `%` affordance visible on hover/focus while the discount popover is closed.
- [x] 3.2 Hide the `%` affordance while the discount popover is open.
- [x] 3.3 Preserve active cell styling and popover visibility while the `%` affordance is hidden.

## 4. Test Coverage

- [x] 4.1 Add coverage for whole percent formatting: `10`, not `10.0000`.
- [x] 4.2 Add coverage for decimal trimming: `10.5`, not `10.5000`.
- [x] 4.3 Add coverage that small non-zero percentages still display as non-zero, such as `0.0038`.
- [x] 4.4 Add coverage that the discount overlay uses left-edge alignment.
- [x] 4.5 Add coverage that the `%` affordance is hidden while the discount popover is open.
- [x] 4.6 Add coverage or assertions that price and bill-item editor behavior is unchanged where relevant.
