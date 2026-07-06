## 1. Diagnose Current Quantity Alignment

- [x] 1.1 Locate the Quantity editable cell adapter and confirm which class or prop creates centered display/editor alignment.
- [x] 1.2 Locate the shared editable numeric cell kit styles used by Price and Discount and identify the baseline left-edge alignment to preserve.

## 2. Align Quantity With Shared Numeric Geometry

- [x] 2.1 Remove or replace Quantity-specific centered alignment rules so Quantity display content uses the same left content edge as Price and Discount.
- [x] 2.2 Ensure the Quantity hover affordance follows the same horizontal geometry as Price and Discount editable numeric cells.
- [x] 2.3 Ensure the Quantity inline input text aligns to the same left content edge as the Quantity display value.
- [x] 2.4 Preserve Quantity inline-only behavior and do not add a popover.
- [x] 2.5 Avoid fixed-width or in-flow DOM changes that can alter table column widths.

## 3. Regression Coverage

- [x] 3.1 Update or add focused Quantity editable cell tests for display, hover/focus affordance, and inline input alignment class behavior.
- [x] 3.2 Update or add Storybook/DOM smoke coverage that verifies Quantity edit mode does not change table column widths.
- [x] 3.3 Confirm existing Price and Discount behavior remains unchanged.

## 4. Validation

- [x] 4.1 Run the focused Quantity editable cell test suite.
- [x] 4.2 Run focused editable cell kit tests if alignment styles are changed in the kit.
- [x] 4.3 Run TypeScript validation.
