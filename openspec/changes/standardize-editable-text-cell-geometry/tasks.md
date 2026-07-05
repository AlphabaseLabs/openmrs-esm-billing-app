## 1. Diagnose text-cell geometry

- [x] 1.1 Map current bill-item text cell DOM structure and identify how icon trigger, display value, and editor are laid out.
- [x] 1.2 Compare current text-cell behavior against the bill-item/chevron pattern and document the width-shift root causes.
- [x] 1.3 Confirm table column classes and header classes used by the bill-item column.

## 2. Define text-cell lane contract

- [x] 2.1 Define shared lane classes for text editable cells (content-first lane order).
- [x] 2.2 Define fixed affordance lane width/gap using existing spacing tokens.
- [x] 2.3 Ensure affordance lane remains reserved when trigger is hidden/disabled.
- [x] 2.4 Verify popover anchoring remains compatible with the current overlay implementation.

## 3. Apply production geometry updates

- [x] 3.1 Update text editable cell component(s) to use the shared lane wrapper.
- [x] 3.2 Ensure display value and editor render in the content lane only.
- [x] 3.3 Ensure chevron trigger occupies trailing affordance lane and keeps keyboard/focus interactions.
- [x] 3.4 Preserve non-editable rows without changing value alignment axis.

## 4. Table alignment and sizing

- [x] 4.1 Update bill-item column sizing rules so lane geometry remains stable when entering edit state.
- [x] 4.2 Align bill-item header with content lane as required by the new lane contract.
- [x] 4.3 Validate no table overflow regressions are introduced.

## 5. Validation and handoff

- [x] 5.1 Update tests for lane order, reserved affordance width, and editor state swap behavior.
- [x] 5.2 Verify storybook stories still render real production editable text components only.
- [x] 5.3 Verify no regression in commit, cancel, and disabled edit workflows.
