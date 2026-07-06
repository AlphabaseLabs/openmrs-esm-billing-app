## Context

The discount popover has been simplified to a percent editor with sponsor/comment metadata. The remaining issues are not behavioral math problems; they are presentation and geometry problems:

- Settled values like `10.0000` are visually noisy because trailing decimals only matter when non-zero.
- The popover is attached using right-edge alignment, so its left border does not weld to the discount cell's left border.
- The `%` affordance remains visible while the popover is open, even though the open cell and popover already communicate the active state.

## Goals / Non-Goals

**Goals:**
- Display settled percentages with up to 4 decimal places, trimming unnecessary trailing zeroes.
- Preserve visibility for tiny non-zero percentages.
- Align the discount popover's left border to the discount cell's left border.
- Hide the `%` affordance while the discount popover is open.

**Non-Goals:**
- Do not change percent-to-amount math.
- Do not change inline amount editing.
- Do not change the simplified discount popover content.
- Do not change price or bill-item editors.

## Decisions

### Decision: format settled percent values with max precision, not fixed precision

Use a formatter that rounds to 4 decimal places, then trims trailing zeroes and the trailing decimal point. Examples:

```text
10       -> 10
10.5     -> 10.5
10.0500  -> 10.05
0.003846 -> 0.0038
0        -> 0
```

For non-zero percentages smaller than the minimum visible precision, keep the existing floor indicator behavior so a real discount never appears as zero.

Alternative considered: keep fixed 4 decimals. That solved false zeroes but made ordinary whole percentages noisy.

### Decision: left-weld the popover to the discount cell

The discount popover should use left-edge anchoring against the discount cell. The expected alignment is:

```text
[ discount cell ]
[ popover        ]
^ same left edge
```

Right-edge anchoring is wrong for this editor because the popover is wider than the cell and visually detaches from the cell's left boundary.

### Decision: hide the `%` affordance while open

The `%` affordance should remain a closed-state discovery affordance. Once the popover is open, the affordance should be visually hidden so the active cell reads cleanly and the popover owns the interaction. The trigger may remain mounted for overlay anchoring and accessibility, but it must not be visibly shown in the open state.

Alternative considered: keep `%` visible while open. That creates a nested active-control feel and makes the cell look cluttered.

## Risks / Trade-offs

- [Trimmed formatting can produce variable text width] -> The input already supports raw typing and settled formatting; variable width is acceptable because the field surface has fixed width.
- [Changing alignment may affect viewport overflow near the right edge] -> Use the existing overlay positioning system and only change the discount editor alignment preference.
- [Hiding the trigger while open could affect focus cues] -> Keep the active cell and popover visible; hide only the visual affordance, not the actual editor state.
