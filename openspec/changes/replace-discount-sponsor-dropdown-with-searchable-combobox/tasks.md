## 1. Sponsor Selector Replacement

- [x] 1.1 Locate the discount sponsor selector in the discount editor popover.
- [x] 1.2 Replace the existing sponsor dropdown/select with a Carbon `ComboBox`.
- [x] 1.3 Keep the fixed sponsor option set: `Practice and doctor`, `Practice`, and `Doctor`.

## 2. Selection Behavior

- [x] 2.1 Initialize the ComboBox with the current selected sponsor.
- [x] 2.2 Update the discount sponsor through the existing update path when a valid sponsor option is selected.
- [x] 2.3 Prevent non-option typed text from committing as a sponsor value.

## 3. Popover Geometry

- [x] 3.1 Add scoped styling so the ComboBox menu overlays instead of taking normal form layout space.
- [x] 3.2 Ensure opening the sponsor options does not push the comment field or other discount popover fields downward.
- [x] 3.3 Keep ComboBox width constrained to the existing sponsor field/popover width.

## 4. Scope Protection

- [x] 4.1 Preserve discount percent and amount editing behavior.
- [x] 4.2 Preserve comment editing, auto-commit behavior, discount calculations, payment totals, and popover anchoring.
- [x] 4.3 Do not change bill-item selectors, price selectors, table layout, or payment UI.
