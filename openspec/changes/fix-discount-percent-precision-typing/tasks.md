## 1. Percent Precision

- [x] 1.1 Introduce a settled percent formatter that uses 4 decimal places for derived percent display.
- [x] 1.2 Ensure a non-zero percent below the visible precision floor renders as a non-zero floor indicator instead of `0.00` or `0.0000`.
- [x] 1.3 Apply the settled formatter when the popover opens, when the percent field blurs, and when the popover closes.
- [x] 1.4 Keep the existing amount writeback formula `price * percent / 100` unchanged.

## 2. Focused Input Behavior

- [x] 2.1 Add focused raw percent text state so the field can preserve `1`, `10`, `10.`, and `10.5` while typing.
- [x] 2.2 Stop forcing fixed-decimal formatting from the percent input `onChange` handler.
- [x] 2.3 Continue parsing valid focused raw input and live-applying the resulting amount.
- [x] 2.4 Preserve partial-but-typeable input text without cursor jumps or per-keystroke reformatting.
- [x] 2.5 Normalize the raw input to settled display on blur and popover close.

## 3. Scope Preservation

- [x] 3.1 Keep the simplified popover content unchanged: percent input, sponsor selector, comment textarea, bottom `Clear`.
- [x] 3.2 Keep the discount table cell displaying and editing the actual amount.
- [x] 3.3 Do not change price or bill-item editors.

## 4. Test Coverage

- [x] 4.1 Add coverage for amount `10` on price `259999` rendering as a non-zero percent such as `0.0038`, not `0.00`.
- [x] 4.2 Add coverage for typing multi-digit percent `10` without the field being rewritten mid-typing.
- [x] 4.3 Add coverage for typing decimal percent `10.5` and live-applying the correct actual discount amount.
- [x] 4.4 Add coverage for preserving partial decimal input such as `10.` while focused.
- [x] 4.5 Add coverage that focused raw text normalizes only on blur or popover close.
