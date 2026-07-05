## Context

Invoice line-item cells now support inline editing for bill item, price, and discount values. Earlier geometry work introduced explicit icon/content lanes so numeric cells could place the edit affordance before the right-aligned value and text cells could place the affordance after the text value.

That lane model is too strong for the desired table behavior. Even if alignment is predictable, the edit icon still participates in table cell layout. In constrained table widths, that allocated lane changes the available content geometry and can make text or numbers appear misaligned against non-editable cells.

The rich editor popover content is a separate concern and should continue to use the existing portal overlay behavior that escapes table overflow. This change focuses only on the compact edit trigger icon geometry inside editable cells.

## Goals / Non-Goals

**Goals:**

- Make editable-cell edit icons allocate zero normal layout space inside text and numeric table cells.
- Keep text and numeric values in the same table content flow as non-editable cells.
- Keep numeric values and inline numeric editors right-aligned across the full cell width.
- Keep text values and text editors left-aligned across the full cell width.
- Allow the icon to visually overlap content when space is tight, without truncating content or reserving content padding.
- Make the icon readable over content by giving it a compact white or gray background.
- Preserve production `InvoiceTable`, editable-cell, and Storybook production-story code paths.
- Preserve the existing rich popover portal behavior.

**Non-Goals:**

- Moving the compact edit trigger itself into a document-level portal.
- Redesigning the invoice table or replacing Carbon table layout.
- Adding a Storybook-only editable-cell implementation.
- Changing line-item validation or backend update APIs.
- Hiding or truncating cell content to make room for the icon.

## Decisions

### Use an absolutely positioned trigger inside the editable cell shell

The edit trigger should remain in the table cell DOM for semantic ownership, focus behavior, and event locality, but it MUST be removed from normal layout flow with absolute positioning.

Rationale: the trigger is a small affordance for that specific cell, not a floating editor panel. Keeping it in the cell preserves accessibility and ownership while still avoiding cell-width allocation.

Alternative considered: portal the trigger like the rich popover. Rejected because it introduces unnecessary focus, hit-testing, and scroll-position complexity for a small cell-local control.

Alternative considered: keep explicit grid or flex lanes. Rejected because lanes allocate width and are the source of the current alignment problem.

### Content owns the full cell width

The display value and active inline editor should occupy the cell's normal content area. The implementation should not add an icon lane, reserved grid column, flex gap, or padding reservation to protect the value from the icon.

Rationale: the table should size and align cells based on the actual value/editor content, not the edit affordance. The icon can overlap because it is a transient visual affordance.

### Numeric and text cells use opposite icon edges

Numeric cells should place the icon at inline-start while numeric values and editors remain right-aligned. Text cells should place the icon at inline-end while text values and editors remain left-aligned.

Rationale: this minimizes natural overlap in the common case. Numeric content grows from the right edge, so the icon belongs on the left. Text content grows from the left edge, so the icon belongs on the right.

### Do not truncate content for the icon

Editable-cell content should not be truncated solely to protect the icon. If content and icon collide in a very narrow cell, the icon may visually overlap the content.

Rationale: the user specifically wants the icon to float above content rather than cause content geometry changes. Readability of the icon is solved by icon background, not content truncation.

### Give the icon its own readable surface

The icon button should have a small white or gray background, border or subtle shadow as needed, and appropriate focus styling. This makes the icon readable when it visually overlaps values or text.

Rationale: an overlay affordance must remain visible without forcing content to move.

### Preserve the rich popover portal

Opening a rich price, discount, or bill-item editor should continue to render the editor content outside table overflow through the existing overlay portal. Only the compact trigger icon placement changes.

Rationale: the portal solves table overflow clipping. Reverting to inline popover ownership would reintroduce table scroll and clipping bugs.

## Risks / Trade-offs

- [Risk] In very narrow cells, the icon can overlap content. -> Mitigation: use opposite-edge placement for text vs numeric cells and give the icon a compact readable background.
- [Risk] Absolutely positioned triggers can become harder to test with layout-insensitive DOM tests. -> Mitigation: assert DOM order does not include a dedicated icon layout lane and assert CSS classes represent out-of-flow trigger placement.
- [Risk] Focus styling may obscure content. -> Mitigation: keep focus ring compact and cell-local.
- [Risk] Removing lanes can affect the recent numeric/text geometry tests. -> Mitigation: replace lane-specific assertions with out-of-flow affordance assertions and alignment assertions for value/editor content.
- [Risk] Developers may accidentally add padding or lanes later. -> Mitigation: add tests and spec language that explicitly forbid layout allocation for the edit icon.
