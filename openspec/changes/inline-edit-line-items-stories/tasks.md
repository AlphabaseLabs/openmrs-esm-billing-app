## 1. Storybook Setup

- [x] 1.1 Add Webpack Storybook scripts and development dependencies required for this repo.
- [x] 1.2 Add Storybook config for TypeScript, React, SCSS/CSS modules, and OpenMRS runtime mocks.
- [x] 1.3 Add a Storybook preview decorator that supplies the minimal layout/runtime context needed by focused billing stories.

## 2. Story Surface Setup

- [x] 2.1 Identify the current invoice line-items table component and the smallest renderable story boundary.
- [x] 2.2 Create local story fixtures for pending, paid/read-only, discounted, taxed, total-calculation, and validation-error line items.
- [x] 2.3 Add a focused story-only line-items harness if production components cannot yet represent popup-open inline edit states without feature implementation.

## 3. Focused Story Coverage

- [x] 3.1 Add the default bill line-items table story for the target inline-edit area.
- [x] 3.2 Add an editable state story where price, discount, tax, and total inline controls are visible.
- [x] 3.3 Add a price popup story with the popup open against a representative line item.
- [x] 3.4 Add a discount popup story with amount, percent, sponsor, and comment controls represented.
- [x] 3.5 Add a tax popup story with the popup open against a representative line item.
- [x] 3.6 Add a total calculation story showing deterministic totals from price, discount, and tax fixtures.
- [x] 3.7 Add a read-only story showing disabled or hidden inline edit controls for non-editable bill status.
- [x] 3.8 Add a validation error story showing visible feedback inside the rich popup.

## 4. Scope Control

- [x] 4.1 Keep this change limited to Storybook setup, focused line-items stories, and supporting local fixtures.
- [x] 4.2 Avoid creating stories for unrelated billing components as part of this change.
- [x] 4.3 Confirm OpenSpec reports the change as ready for implementation tracking.
