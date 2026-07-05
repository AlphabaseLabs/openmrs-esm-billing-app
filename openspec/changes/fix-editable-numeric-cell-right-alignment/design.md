## Context

Editable numeric cells now use a full-width interactive content surface so the user can click anywhere in the editable cell area. That surface is implemented with a button-style reset and shares classes with numeric alignment styles.

The regression is that the button reset can override or weaken the numeric alignment contract. The clickable surface may remain full-width, but the number inside it must still be visually aligned to the cell's inline end. In left-to-right layouts this means right-aligned. This is especially important for price and discount columns because users scan numeric columns by the least significant digits.

## Goals / Non-Goals

**Goals:**

- Restore numeric display values to the right edge of editable numeric cells.
- Preserve full-cell click target behavior introduced for editable cell surfaces.
- Preserve right alignment for active inline numeric editors.
- Prevent `cellSurfaceButton` reset styles from overriding numeric alignment again.
- Preserve text editable-cell left alignment.
- Preserve floating edit icon geometry and avoid allocating icon space inside the cell.

**Non-Goals:**

- Changing the editable numeric input primitive.
- Changing row height, column widths, or Carbon table layout.
- Moving edit icons or popovers.
- Changing price/discount parsing or formatting rules.
- Redesigning text editable cells.

## Decisions

### Make numeric alignment explicit after button reset styles

Numeric surface alignment must be expressed on a selector that wins over the generic full-surface button reset. The fix should not rely on CSS source-order accidents or browser defaults.

Rationale: `all: unset` is useful for removing native button chrome, but it also removes inherited and default layout assumptions. Numeric right alignment is a semantic table-column rule, so it should be re-applied explicitly for numeric surfaces.

### Keep one full-width surface, not a smaller value-only button

The implementation must not revert to a small button around the visible number. The full cell content surface remains the click target; only the content alignment inside that surface changes.

Rationale: the previous change fixed hit target behavior. This regression fix should preserve that user interaction improvement.

### Keep text and numeric alignment separate

Text editable surfaces should remain left-aligned while numeric editable surfaces are right-aligned. The shared button reset can define common interaction geometry, but field-type-specific classes must define content alignment.

Rationale: numeric and text table columns have different scanning behavior. A single generic surface alignment would regress one of them.

### Prefer focused CSS and contract tests

The likely implementation should be a small stylesheet correction plus focused tests that assert class composition and computed/semantic alignment expectations. Component logic should only change if class composition is currently insufficient.

Rationale: the bug is a presentation regression caused by style precedence. A narrow style fix minimizes risk.

## Risks / Trade-offs

- [Risk] Fixing alignment with overly broad selectors could right-align text cells. -> Mitigation: scope the rule to numeric content surfaces only.
- [Risk] Reordering generic and numeric styles could create future regressions. -> Mitigation: add a specific numeric surface selector and focused regression tests.
- [Risk] Adding padding to force alignment could change column geometry. -> Mitigation: do not add layout lanes, column width, or icon-reserved space.
- [Risk] Inline editor and display value could diverge. -> Mitigation: validate both display mode and active edit mode keep right alignment.

