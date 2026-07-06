## Context

Editable line-item menus have accumulated custom visual treatments across several focused changes. Bill-item and price menus now use custom option surfaces, while the discount sponsor field uses a Carbon combobox. The current result mixes Carbon-like controls with teal selected fills, left accent bars, compressed option rows, and custom checkmark colors.

Carbon dropdown and combo box guidance defines shared anatomy and styling for field, menu, and option rows. Strict alignment means the custom bill-item and price menus should visually match Carbon option semantics, and the discount sponsor combobox should not be overridden away from Carbon option styling.

## Goals / Non-Goals

**Goals:**
- Make bill-item, price, and discount sponsor option menus visually follow Carbon dropdown/combo box standards.
- Replace custom teal selected-option treatments with Carbon selected, hover, active, text, and icon states.
- Normalize option row typography, height, horizontal spacing, menu width, border, shadow, and label overflow.
- Preserve all current editing, filtering, selection, and commit behavior.

**Non-Goals:**
- Do not redesign the editable-cell affordance box.
- Do not change discount amount, percent, or comment input behavior.
- Do not change table column widths or row layout.
- Do not change payment method dropdown styling.
- Do not add new dependencies.

## Decisions

### Use Carbon state tokens instead of app accent colors

Selected, hover, active, text, and checkmark states should follow Carbon dropdown/combo box semantics. This intentionally removes the teal selected fill, teal left bar, and teal checkmark from editable option menus.

Alternative considered: keep teal as the selected accent while only adopting Carbon row geometry. Rejected because the requested direction is strict Carbon alignment, not Carbon-inspired styling.

### Keep custom menu behavior where it already exists

Bill-item and price menus may keep their current headless/custom interaction implementations if behavior is already correct. The implementation should change the visual state mapping and row geometry, not rebuild interaction logic.

Alternative considered: replace all custom menus with Carbon components. Rejected because it risks behavior regressions and is unnecessary for a visual alignment change.

### Treat the discount sponsor combobox as the Carbon baseline

The discount sponsor field is already a Carbon combobox. Its option menu should use Carbon defaults unless scoped overrides are required for width or popover containment.

Alternative considered: custom-style sponsor options to match bill-item and price. Rejected because strict Carbon alignment should move custom menus toward Carbon, not move Carbon components toward custom menus.

### Use Carbon dropdown dimensions consistently per menu

Each option row should match its associated field size. In the table context, small sizing is acceptable when the editable field is small; medium sizing is acceptable if the field uses medium. Mixing compressed rows with larger fields is not acceptable.

## Risks / Trade-offs

- Custom menus may not expose one-to-one Carbon class names -> Map their selected, highlighted, and active states to equivalent Carbon token values through local styles.
- Strict Carbon selected styling may feel less branded than teal accents -> This is intentional and matches the stated direction.
- Wider Carbon spacing may affect tight table cells -> Preserve field/menu alignment and use ellipsis rather than shrinking row height or typography.
- Discount sponsor Carbon internals may be sensitive to over-specific overrides -> Prefer removing custom overrides over adding new ones.

## Migration Plan

Implement as a scoped styling and minimal class-mapping change in editable line-item cell components/styles. Rollback is limited to reverting the styling/class changes for the editable option menus.

## Open Questions

- None.
