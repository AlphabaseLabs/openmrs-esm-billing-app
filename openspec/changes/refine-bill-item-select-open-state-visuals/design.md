## Context

The bill-item editable cell now uses a searchable single-select pattern where the active table cell functions as the combobox input and the options menu is rendered below it. The behavior is correct, but the open visual state still carries remnants of a standalone input/menu: a colored field fill, a boxed chevron, blue/lavender selected state, inconsistent x-positioning, and a menu that can read as a detached floating element.

This change is a visual refinement of that already-welded bill-item select surface. It must not alter price picker behavior, discount editor behavior, billing calculations, or option selection semantics.

## Goals / Non-Goals

**Goals:**
- Make the active bill-item field transparent and borderless so the table cell remains the visible input surface.
- Render the chevron as a bare glyph with preserved hit area and correct open/closed rotation.
- Use teal as the only selected-state accent for the bill-item options menu.
- Keep hover and keyboard-highlight state neutral and visually distinct from selected state.
- Align display text, active input text, and option text to the same x-coordinate.
- Weld field and menu with one seam and add only subtle menu lift over overlapping content.

**Non-Goals:**
- Do not change the price picker.
- Do not change the discount form.
- Do not change line-item calculations, persistence, option data, or validation rules.
- Do not replace the existing combobox behavior engine.
- Do not introduce new dependencies.

## Decisions

### Decision 1: Keep the current headless combobox behavior and refine only the bill-item visual surface

The bill-item cell already behaves as a searchable select. The correction should be implemented through existing bill-item component classes and SCSS rather than introducing another Carbon `ComboBox` shell.

Rationale: The current issue is not selection behavior. It is visual layering. Reintroducing Carbon's visible list-box field would recreate the "two active surfaces" problem.

Alternative considered: Use Carbon `ComboBox` directly and override its internals. This is rejected unless unavoidable because its default visible shell is the source of the current mismatch.

### Decision 2: The active field inherits table-cell geometry

The active in-cell input must use transparent background, no visible border, no visible box-shadow focus ring, inherited font styles, and the same horizontal inset as display text.

Rationale: Opening the editor must not create a new rectangular input surface. The table row/cell remains the surface, and the caret plus chevron are enough to indicate edit mode.

### Decision 3: The chevron keeps the elevated editable-cell affordance

The chevron control must keep the elevated white box treatment previously used by editable cells. It remains hidden while the bill-item select is closed and idle, becomes visible on hover/focus/open, and rotates up while open and down while closed.

Rationale: The elevated box makes the affordance readable over dense table content without permanently allocating attention. Hiding it in the closed idle state keeps the table calm, while showing it during interaction preserves discoverability.

### Decision 4: Selected and highlighted option states use different visual channels

Selected option state uses teal: light teal fill, 2px teal left bar, and teal check mark. Highlighted option state from hover or keyboard navigation uses neutral grey only. Blue/lavender must not appear in the bill-item menu selected or highlighted states.

Rationale: One accent hue prevents visual ambiguity. Teal is already the confirm/accent direction used in this billing UI, while neutral hover keeps navigation distinct from selected state.

### Decision 5: Field/menu welding uses one shared edge

The active field and menu must meet with one visible seam, not stacked borders. The field should not contribute a visible bottom border at the join when the menu is open, and the menu should provide the single edge or overlap by 1px.

Rationale: A double line makes the menu look detached and reinforces the "separate widget" impression.

### Decision 6: Menu lift is subtle and menu-only

The options menu keeps a border and receives a low-opacity shadow only on the menu surface. The field remains flat and integrated with the row.

Rationale: The menu needs enough lift to read above the Payments card when overlapping it, but not enough to look like an unrelated floating card.

## Risks / Trade-offs

- Focus indication could become too subtle after removing the box surface -> Keep caret visibility and any required accessibility focus styling as a minimal in-cell cue rather than a full rectangle.
- Shared editable-cell styles could leak into price or discount editors -> Scope selectors to bill-item specific classes and avoid broad editable-cell overrides.
- Teal selected styling may conflict with neutral hover if both classes apply -> Explicitly define selected-plus-highlighted state so selected remains selected while hover remains quiet.
- Text alignment can regress if display, input, and option rows use separate padding values -> Centralize or mirror the same horizontal inset values for bill-item display text, search input, and option label.
