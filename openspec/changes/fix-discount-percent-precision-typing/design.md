## Context

The discount popover was simplified so the popover contains a single percent input while the table cell remains the actual discount amount editor. That model is correct, but the current formatting policy causes two UX defects:

- A small non-zero amount can derive to a percent below `0.01`, then display as `0.00`.
- The controlled input formats to fixed decimals on every keystroke, so normal typing is interrupted.

This change keeps the current live-apply model and fixes only percent display precision and focused typing behavior.

## Goals / Non-Goals

**Goals:**
- Make non-zero derived percentages visibly non-zero.
- Allow users to type multi-digit and decimal percent values naturally.
- Continue live-applying percent edits to the actual discount amount using `price * percent / 100`.
- Normalize percent text only when the value is settled.

**Non-Goals:**
- Do not change the simplified popover content.
- Do not add amount back into the popover.
- Do not change sponsor, comment, or clear behavior.
- Do not change price, bill-item, or table amount editing behavior.

## Decisions

### Decision: use separate raw and settled percent text

The percent input needs two display modes:

- **Settled mode:** used on popover open, blur, and close. The value is formatted using the chosen precision policy.
- **Focused typing mode:** used while the input has focus. The component stores the user's raw text exactly enough to support partial values like `1`, `10`, `10.`, and `10.5`.

The raw text is still parsed on each change. If parsing succeeds, the live discount amount commit continues immediately. The component must not rewrite the field to fixed precision during active typing.

Alternative considered: keep a single formatted string state. That caused the current cursor/input fight, because every keystroke rewrites the field.

### Decision: use a precision floor for non-zero percentages

Settled percent display should not round a real discount to apparent zero. Use four decimal places for settled display. If the derived percent is greater than `0` but below the smallest visible non-zero value for the chosen precision, display a non-zero floor indicator rather than `0.0000`.

The preferred policy is:

```text
precision = 4 decimal places
minimum visible non-zero = 0.0001
if percent > 0 and percent < 0.0001, show "<0.0001"
otherwise show percent.toFixed(4)
```

This means `10 / 259999 * 100 = 0.003846...` displays as `0.0038`, not `0.00`.

Alternative considered: use two decimals plus `<0.01`. That avoids the false zero but hides useful precision for small discounts that are still above `0.0001`.

### Decision: keep writeback math unchanged

This change only affects display/input behavior. The writeback formula remains:

```text
discountAmount = roundCurrency(price * percent / 100)
```

The table continues to display the actual discount amount, not percent.

## Risks / Trade-offs

- [Higher precision may look more detailed than normal billing amounts] → Limit the behavior to percent input display; amount display remains currency formatted.
- [Raw text can temporarily be incomplete, such as `10.`] → Parse only when valid, keep the raw text visible, and do not treat partial typing as a formatting event.
- [Live apply can generate repeated commits while typing] → Preserve current live-apply semantics; this change does not alter commit timing.
