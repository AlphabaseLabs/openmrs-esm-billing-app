## Context

Invoice line-item table cells now include editable values, active editors, and edit affordances. The current layout allows these pieces to participate in normal inline flow, so the visual alignment of numbers changes based on whether a row is read-only, editable inactive, or actively being edited.

The table needs a stable geometry contract. The edit affordance is cell chrome, not part of the value. The value or editor must own the alignment edge, while the affordance lane remains predictable and does not push text around.

## Goals / Non-Goals

**Goals:**

- Define one reusable editable-cell geometry for all invoice editable cells.
- Align numeric editable cells on a stable right edge.
- Place numeric edit affordances on the left of the numeric value/editor lane.
- Prevent icon visibility and active editor state from changing the cell's alignment contract.
- Keep table column sizing predictable when an active editor opens.

**Non-Goals:**

- Changing editable-cell commit behavior.
- Changing price, discount, bill-item validation rules.
- Changing overlay/portal ownership for rich popovers.
- Replacing Carbon `DataTable`.
- Redesigning the invoice table visual language.
- Creating Storybook-only editable cell implementations.

## Decisions

### Use lane-based editable cell layout

Each editable cell will use two lanes:

```text
affordance lane: fixed width, edit icon or empty reserved slot
content lane: flexible width, display text or active editor
```

The affordance lane must have stable width whether the icon is visible, hidden, disabled, or absent for a particular row. This prevents icon visibility from shifting values.

Alternative considered: keep flex inline layout with opacity-hidden icons. Rejected because opacity preserves width but does not provide column-wide lane discipline or consistent numeric alignment.

### Use numeric and text orientation variants

Numeric editable cells use this order:

```text
[icon lane] [right-aligned value/editor lane]
```

Text editable cells use this order:

```text
[left-aligned value/editor lane] [icon lane]
```

Rationale: numbers align by their right edge; text aligns by its left edge. Reversing the numeric order lets the number/editor own the column's right alignment axis while keeping the edit affordance accessible.

### Active editors replace the content lane only

Opening an inline editor should replace the display value inside the content lane. It must not add new uncontrolled inline width outside that lane, and it must not move the affordance lane across the cell.

For numeric cells, the active editor should be right-aligned within the content lane. The active editor width should be bounded by the table column's intended minimum width.

### Column widths must budget for active states

Editable columns should reserve enough width for the largest intended cell state:

```text
column min width =
  table cell padding
  + fixed affordance lane
  + lane gap
  + max(display value width, active editor width)
```

This avoids table reflow when a user opens an editor.

### Header alignment should match value lanes

Numeric column headers should align with the numeric content lane, not the whole cell including the affordance lane. If a numeric column reserves an icon lane on the left, the header alignment should still visually point to the right-aligned value/editor lane.

## Risks / Trade-offs

- [Risk] Reserving icon lanes for rows without visible icons can create extra whitespace. -> Mitigation: this is intentional geometry; stable alignment is preferred over per-row width variation.
- [Risk] Numeric editor controls may still be wider than available column width on narrow screens. -> Mitigation: set explicit column/editor minimum widths and rely on existing table overflow instead of per-cell reflow.
- [Risk] Existing tests may assert direct text layout rather than geometry. -> Mitigation: update tests to assert lane roles, ordering, and stable affordance behavior instead of incidental DOM order where needed.
- [Risk] Text and numeric cells need different orientation. -> Mitigation: implement geometry as a reusable component/style variant rather than one-off CSS per cell.
