## Context

Editable line-item cells use option buttons to expose secondary edit actions: bill item selection, price selection, and discount editing. These controls are conceptually the same affordance, but their visual surfaces have drifted. Bill item and price chevrons still use a white elevated box, while the discount `%` affordance now uses a transparent bordered box.

The existing `.optionsButton` class is the right shared styling surface because it is already used by these editable-cell option triggers and already owns common behavior such as opacity, focus state, hover visibility, sizing, and click target behavior.

## Goals / Non-Goals

**Goals:**

- Make `.optionsButton` the single shared editable-cell affordance box surface.
- Standardize `.optionsButton` to the transparent bordered box used by the discount `%` affordance.
- Reuse the standardized surface for bill item, price, and discount option buttons.
- Keep chevron glyph behavior for bill item and price, including open-state rotation.
- Keep discount `%` glyph behavior and discount editor behavior.
- Remove duplicated per-cell box styling where it only restates shared size, radius, background, border, centering, or box shadow.

**Non-Goals:**

- Do not change bill-item search, price selection, discount editing, popover positioning, popover layout, table layout, calculations, or payment behavior.
- Do not change glyph semantics: bill item and price remain chevrons; discount remains `%`.
- Do not introduce a new component abstraction unless styling cannot be safely centralized in `.optionsButton`.

## Decisions

1. Treat `.optionsButton` as the shared box layer.

   The shared class should own the box geometry: fixed size, border radius, transparent background, light grey border, content centering, cursor, opacity transition, and focus outline. This avoids three separate definitions for the same visual control.

2. Keep glyph-specific rules separate from box rules.

   Bill item and price may need SVG rotation on open. Discount may need percent glyph font alignment. Those rules should remain specific to their glyphs and should not redefine the box surface.

3. Replace the white elevated chevron surface with the transparent bordered surface.

   The transparent bordered box is now the target visual language for editable-cell option buttons. Removing the white/shadow treatment reduces visual weight and keeps all three controls consistent.

4. Preserve existing visibility behavior.

   `.optionsButton` should continue to remain hidden at rest where it currently does, and become visible on hover, focus-within, or open state. This change standardizes the visible surface, not when the affordance is shown.

## Risks / Trade-offs

- Shared class changes could affect all editable-cell option buttons at once -> Mitigate by limiting the change to known `.optionsButton` affordance properties and preserving existing behavior properties.
- Removing per-cell overrides could accidentally remove chevron rotation -> Mitigate by keeping rotation in a glyph/open-state rule instead of deleting all bill-item or price-specific rules blindly.
- Transparent bordered controls may be less visually prominent than white elevated controls -> Mitigate by retaining a clear light grey border and focus outline.
- Existing discount-specific `%` box styling may duplicate the shared surface -> Mitigate by reducing it to glyph alignment only after `.optionsButton` owns the surface.
