## Context

The editable bill-item cell now uses the active table cell as the searchable combobox input and renders the options list in a portaled overlay. Functionally this is correct: the popover no longer contains a nested Carbon ComboBox input. Visually, however, the options list still inherits the generic popover shell, so it reads as a separate floating control below the active cell.

The implementation should refine only the bill-item options menu surface. It must not revisit the Downshift wiring, selection semantics, price recalculation, or the price/discount editor popovers.

## Goals / Non-Goals

**Goals:**

- Make the bill-item options list visually weld to the active bill-item cell.
- Ensure the active cell and options list share the same left edge, width, border rhythm, and visual surface.
- Remove the standalone popover feel from the bill-item options list while preserving the portaled overlay implementation.
- Increase option row height and vertical rhythm so menu options look intentional and not compressed.
- Keep the selected row and highlighted row visually clear.

**Non-Goals:**

- Do not replace Downshift or change combobox behavior.
- Do not reintroduce a nested input inside the options menu.
- Do not change price, discount, payments, invoice actions, or table column sizing behavior.
- Do not change bill-item commit, filtering, Escape, blur, or keyboard navigation semantics.

## Decisions

### Scope the visual treatment to the bill-item menu

Use bill-item-specific classes such as `billItemComboboxPopover`, `billItemOption`, and related menu classes rather than changing the generic `.popover` or `.optionButton` defaults globally.

Alternative considered: Change the generic popover styles. Rejected because price and discount editors intentionally use different surfaces and should not inherit the welded bill-item treatment.

### Let the menu width come from the active cell anchor

The overlay layer already receives the active cell width from `EditableCellOverlay`. The bill-item popover content should honor that geometry by using the overlay-provided width rather than imposing a larger independent `min-width`.

The bill-item menu surface should be `box-sizing: border-box`, `width: 100%`, and avoid bill-item-specific fixed minimum widths that make the menu wider than the active cell. If a minimum width is still needed for usability, it must not override the visual requirement that the menu reads as welded to the active cell in the default pending bill story.

Alternative considered: Keep a larger menu width for longer names. Rejected for this change because the reported issue is the detached appearance caused by the menu looking like a separate surface.

### Weld the top edge instead of stacking a separate card

The menu should sit immediately under the active cell without a visible vertical gap. The menu top edge should visually continue the active cell edge, either by removing the menu top border or overlapping it by one pixel where needed.

The menu should not use a heavy standalone shadow that separates it from the active cell. A subtle lower shadow is acceptable only if it reads as depth for the combined editor surface rather than as an independent card.

Alternative considered: Keep the current popover border and shadow. Rejected because it is the root visual cause of the "separate thing" complaint.

### Give bill-item options an explicit row height

Bill-item options should use an explicit comfortable row height or min-height instead of relying on compact generic padding. The target should visually match the row rhythm from the mockups: readable labels, enough vertical space for selection state, and no compressed list appearance.

Alternative considered: Increase only padding on the generic option class. Rejected because it would affect price menu options and other option lists.

## Risks / Trade-offs

- Wider bill-item names may truncate earlier when the menu exactly follows the cell width. Mitigation: preserve existing ellipsis behavior and rely on the active cell/table width as the source of truth.
- Removing standalone shadow may reduce perceived layering over nearby content. Mitigation: keep a subtle lower-only shadow if needed, while avoiding a full detached card treatment.
- CSS module class changes could accidentally affect price options if selectors are too broad. Mitigation: apply welded styles only through bill-item-specific classes.
- Browser zoom and table resizing could reveal one-pixel seams. Mitigation: validate visually in Storybook at the default pending bill story and avoid gap-producing margins.
