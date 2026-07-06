## ADDED Requirements

### Requirement: Discount amount and percent stay rounded and synchronized
The discount editor SHALL keep amount and percent linked, formatting amount as whole currency and percent to exactly 2 decimal places on every rendered display path. Amount SHALL represent per-item discount and SHALL be computed against the selected item price; total discount SHALL be computed as `quantity x amount`. Amount input SHALL clamp to `0..subtotal`, and percent input SHALL clamp to `0..100`.

#### Scenario: Amount input derives rounded percent
- **WHEN** a user enters amount `10` for a line item with quantity `1` and selected price `249999`
- **THEN** the amount field displays `10` and the percent field displays `0.00` without a raw floating-point tail

#### Scenario: Percent input derives whole amount
- **WHEN** a user enters percent `100` for a line item with selected price `249999`
- **THEN** the amount field displays `249999` and the percent field displays `100.00`

#### Scenario: Out-of-range values are bounded
- **WHEN** a user enters an amount greater than the line item subtotal or a percent greater than `100`
- **THEN** the editor clamps the displayed and applied value to the maximum allowed discount

### Requirement: Discount value controls use inline unit suffixes
The discount editor SHALL render amount and percent under one group label, `Enter discount value`, with two side-by-side field surfaces. Each field SHALL place the editable value on the left and a muted inline unit suffix on the right: `amount` for the amount field and `percent` for the percent field. The editor SHALL NOT render redundant stacked `Amount` and `Percent` labels above the individual fields.

#### Scenario: Discount value group renders compact fields
- **WHEN** the discount editor popover is open
- **THEN** the value controls display under `Enter discount value` and each control reads as `value ... amount|percent` in a single surface

### Requirement: Discount calculation read-outs are visible and live
The discount editor SHALL show a `Discount per item` read-out whose emphasized value tracks the amount field live. The editor SHALL also show a muted total discount calculation line in the form `Total discount: <quantity> x <per-item> = <total>`, recomputed whenever quantity or per-item amount changes.

#### Scenario: Per-item and total read-outs update from amount
- **WHEN** a user enters amount `2000` for a line item with quantity `1`
- **THEN** the editor shows `Discount per item` as `2,000` and the total line as `Total discount: 1 x 2,000 = 2,000`

#### Scenario: Total line reflects quantity
- **WHEN** a line item has quantity `3` and per-item discount `2000`
- **THEN** the total line shows `Total discount: 3 x 2,000 = 6,000`

### Requirement: Discount sponsor is a pre-filled selector
The discount editor SHALL render discount sponsor as a single-select control pre-filled with the current sponsor. The selector SHALL expose sponsor options including `Practice and doctor`, `Practice`, and `Doctor`, and SHALL include the trailing entity/token icon affordance from the mockup or the matching app selector affordance.

#### Scenario: Sponsor selector opens available sponsors
- **WHEN** a user opens the sponsor selector
- **THEN** the editor displays the available sponsor options and marks the current sponsor as selected

#### Scenario: Sponsor selector displays selected sponsor and icon
- **WHEN** the discount editor popover is open
- **THEN** the sponsor field displays the selected sponsor and the trailing selector/entity icon, not an empty plain input

### Requirement: Discount comment is a compact textarea
The discount editor SHALL render comment as a compact multi-line textarea using the same quiet field treatment as the rest of the discount editor fields.

#### Scenario: Comment supports multi-line input
- **WHEN** the discount editor popover is open
- **THEN** the comment control accepts multi-line text in a 2-3 row textarea

### Requirement: Discount editor uses explicit live-apply semantics
The discount editor SHALL apply amount, percent, sponsor, and comment edits live while the popover is open. Reset SHALL revert those fields to the last saved/opening discount state. Closing by click-away or Esc SHALL keep the current live-applied values. The editor SHALL NOT render Save or Cancel buttons.

#### Scenario: Reset reverts live edits
- **WHEN** a user changes the discount amount while the popover is open and then activates Reset
- **THEN** the discount amount, percent, sponsor, comment, row totals, and bill summary return to the last saved/opening discount state

#### Scenario: Closing keeps live edits
- **WHEN** a user changes the discount amount and closes the popover by click-away or Esc
- **THEN** the changed discount remains applied to the row totals and bill summary

### Requirement: Discount editor matches welded quiet visual language
The discount editor SHALL use the welded/quiet visual language used by the other editable-cell editors: quiet field surfaces, caption labels, body-sized field values, emphasized but table-scale per-item value, muted total calculation line, one seam between active cell and popover, and a subtle popover shadow on the menu surface only. The popover SHALL remain visually above the Payments card without reading as a separate floating card.

#### Scenario: Popover visually sits above underlying content
- **WHEN** the discount editor opens above the Payments card
- **THEN** the menu surface has a subtle popover shadow and border while preserving one seam at the trigger-cell join

### Requirement: Discount trigger cell uses the corrected chevron pattern
The discount trigger cell SHALL match the corrected editable-cell trigger pattern: the open-state input surface is transparent and borderless, the content remains readable, and the chevron is a bare right-aligned affordance that flips up while open. The trigger SHALL NOT show the old blue filled nested input plus boxed/pill chevron issue.

#### Scenario: Discount trigger opens with corrected affordance
- **WHEN** the discount editor popover is open
- **THEN** the discount cell shows the value with a transparent/borderless in-cell surface and a right-aligned chevron in the open orientation

### Requirement: Price and bill-item editors remain unchanged
This change SHALL NOT modify price editor or bill-item editor behavior, layout, option rendering, or commit semantics except where shared styling primitives are reused without changing their rendered behavior.

#### Scenario: Existing non-discount editors are unaffected
- **WHEN** the change is implemented
- **THEN** bill-item and price editor behavior remains equivalent to the state before this change
