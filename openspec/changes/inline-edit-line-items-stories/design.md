## Context

This repo is the Alphabase fork of `openmrs-esm-billing-app`. Its invoice table already includes the target columns from the design discussion: `Price`, `Discount`, `Tax`, and `Total`. The repo uses a Webpack application toolchain and did not have a local Storybook setup on the clean `inline-edits` branch.

The purpose of this change is to create a focused design and review surface for the inline edit interaction before changing production table behavior.

## Goals / Non-Goals

**Goals:**
- Add only the Storybook infrastructure needed to render focused billing UI stories in this repo.
- Add stories for the invoice line-items table area and the rich popup states needed for price, discount, tax, and total review.
- Use deterministic local fixtures so stories do not depend on OpenMRS runtime services or backend invoice responses.

**Non-Goals:**
- Implement production inline-edit saving behavior.
- Change invoice APIs, bill mutation calls, or backend validation.
- Create stories for every billing component.
- Rework global billing layout, patient header, payments, or navigation.

## Decisions

- Use `@storybook/react-webpack5` because the app uses Webpack scripts (`webpack`, `webpack serve`) and not Vite.
- Keep stories under `src/**/*.stories.tsx` so they remain close to the billing surface they document.
- Use a story-only line-items harness for popup-open states because the production table cannot yet represent those states without production feature work.
- Model popup-open, read-only, and validation states through story args/fixtures instead of live API state.
- Preserve the existing production invoice table behavior while using Storybook to explore the upcoming inline-edit UI.

## Risks / Trade-offs

- Risk: Story-only popup markup may drift from future production implementation. Mitigation: keep the harness small and aligned to the invoice table columns and Carbon/OpenMRS styling primitives.
- Risk: Adding Storybook dependencies increases install size. Mitigation: use only the Webpack Storybook packages and loaders needed for this repo.
- Risk: Mocked billing data may miss backend edge cases. Mitigation: include fixtures for pending, paid, discounted, taxed, total-calculation, and validation-error states.

## Migration Plan

- No data migration is required.
- Add Storybook as local development tooling and keep production build behavior unchanged.
- If the approach needs rollback, remove Storybook config/scripts and the new story files.

## Open Questions

- Should the final production implementation reuse the story-only popup harness directly, or treat it only as a design reference?
- Should save-failure/server-validation states be added now, or after the mutation contract is finalized?
