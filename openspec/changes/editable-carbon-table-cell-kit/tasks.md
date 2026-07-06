## 1. Baseline Current Behavior

- [x] 1.1 Identify the current editable Price, Discount, and Bill Item source files and shared style files.
- [x] 1.2 Document the current reusable mechanics that must move into the package: affordance surface, inline numeric overlay, hidden sizing value, popover anchoring, and welded active-cell behavior.
- [x] 1.3 Confirm the billing-specific behavior that must remain in app adapters: price options, discount amount/percent/sponsor/comment rules, bill item search, API update payloads, and invoice recalculation.
- [x] 1.4 Capture the current production Storybook scenarios that must remain visually stable after migration.

## 2. Create Local Package Boundary

- [x] 2.1 Create the local package structure for `@alphabase/editable-carbon-table-cell-kit`.
- [x] 2.2 Define package exports for `EditableNumericCell`, `EditableTextCell`, `EditableCellPopover`, and `useEditableCellController`.
- [x] 2.3 Define exported prop and event types for numeric cells, text cells, popovers, commit reasons, and interaction state.
- [x] 2.4 Configure React, React DOM, Carbon React, and Carbon icons as peer dependencies for the package boundary.
- [x] 2.5 Add package style export or import path so consuming adapters can load package-owned editable-cell styles.

## 3. Extract Reusable Editable Cell Mechanics

- [x] 3.1 Move reusable editable-cell layout and affordance styles into the package.
- [x] 3.2 Move numeric display, right-alignment, active editor overlay, and hidden sizing value behavior into `EditableNumericCell`.
- [x] 3.3 Move text/select display, left-alignment, active surface, and popover trigger behavior into `EditableTextCell`.
- [x] 3.4 Move popover portal, anchoring, overflow escape, z-index, outside-click, Escape-close, and welded surface behavior into `EditableCellPopover`.
- [x] 3.5 Move shared hover, focus, open, commit, cancel, and disabled-state interaction logic into `useEditableCellController`.
- [x] 3.6 Verify the extracted package code does not import billing app modules.

## 4. Convert Billing Cells Into Adapters

- [x] 4.1 Convert the Price cell into a billing adapter around `EditableNumericCell` and package popover primitives.
- [x] 4.2 Keep Price service option mapping, selected price commit, and billing update payload logic inside the Price adapter.
- [x] 4.3 Convert the Discount cell into a billing adapter around `EditableNumericCell` and package popover primitives.
- [x] 4.4 Keep Discount amount/percent sync, sponsor, comment, inline reset, validation, and billing update payload logic inside the Discount adapter.
- [x] 4.5 Convert the Bill Item cell into a billing adapter around `EditableTextCell` and package popover primitives.
- [x] 4.6 Keep Bill Item search, option labels, selected item replacement, and billing update payload logic inside the Bill Item adapter.
- [x] 4.7 Confirm Quantity remains unchanged in this change.

## 5. Add Conformance And Adapter Tests

- [x] 5.1 Add package-level tests for numeric display, active inline editor behavior, disabled state, commit, cancel, and keyboard handling.
- [x] 5.2 Add package-level tests for text/select display, popover trigger behavior, disabled state, commit, cancel, and keyboard handling.
- [x] 5.3 Add geometry conformance tests proving Price, Discount, Tax, Total, and Action column positions and widths do not change when numeric editors open.
- [x] 5.4 Add popover conformance tests proving popovers do not increase table scroll width or height.
- [x] 5.5 Add import-boundary test coverage proving package source does not import billing app modules.
- [x] 5.6 Update billing adapter tests for Price, Discount, and Bill Item payload mapping.

## 6. Preserve Production Storybook Coverage

- [x] 6.1 Keep BillDetails production stories rendering real billing adapters after migration.
- [x] 6.2 Add package primitive stories only for reusable numeric cell, text cell, and popover behavior.
- [x] 6.3 Ensure package primitive stories do not replace production billing stories as visual validation.
- [x] 6.4 Confirm production stories still cover pending bill, paid/disabled rows, Price editor, Discount editor, and Bill Item editor states.

## 7. Validate Migration

- [x] 7.1 Run focused package and billing adapter tests.
- [x] 7.2 Run TypeScript validation.
- [x] 7.3 Validate Storybook geometry for BillDetails pending bill.
- [x] 7.4 Confirm opening Price, Discount, and Bill Item editors does not resize table columns.
- [x] 7.5 Confirm opening popovers does not make the line-item table scroll because of popover dimensions.
- [x] 7.6 Confirm no Quantity editable behavior is introduced.

## 8. Prepare For Future Quantity And Publishing

- [x] 8.1 Add package README documenting the adapter boundary and basic usage.
- [x] 8.2 Document the intended future Quantity adapter usage with `EditableNumericCell`.
- [x] 8.3 Document private scoped publishing steps without publishing in this change.
- [x] 8.4 Document consuming-app setup for a future private package release.
- [x] 8.5 Leave actual registry publishing deferred until Quantity proves the package API.
