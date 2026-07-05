## 1. Repository and Storybook foundation

- [x] 1.1 Work from the nested OpenMRS ESM repo rather than the workspace root.
- [x] 1.2 Use Webpack Storybook via `@storybook/react-webpack5` for OpenMRS package, SCSS, and CSS module compatibility.
- [x] 1.3 Add Storybook configuration and preview files under `.storybook`.
- [x] 1.4 Import Carbon/OpenMRS-relevant styles needed for production-like rendering.

## 2. Webpack production-fidelity compilation

- [x] 2.1 Configure TS/TSX transpilation for the repo `src` directory.
- [x] 2.2 Configure TS/TSX transpilation for the `.storybook` directory, including `preview.tsx`.
- [x] 2.3 Add an explicit OpenMRS visual package allowlist.
- [x] 2.4 Add `@openmrs/esm-patient-common-lib` to the allowlist.
- [x] 2.5 Configure SCSS/CSS module handling for repo styles and allowlisted package styles.
- [x] 2.6 Avoid broad all-`node_modules` transpilation.

## 3. Runtime mock boundary

- [x] 3.1 Mock OpenMRS framework shell APIs such as fetch, navigation, session, config, visits, feature flags, modals, snackbars, access checks, extensions, and workspace launchers.
- [x] 3.2 Re-export real visual components from allowlisted OpenMRS packages instead of hand-built visual mocks.
- [x] 3.3 Mock only non-visual patient-common runtime APIs such as visit prompts and system visit settings.
- [x] 3.4 Keep resource/API mocks fixture-backed and deterministic.

## 4. Focused production stories

- [x] 4.1 Create focused production stories for the billing surfaces needed by upcoming work.
- [x] 4.2 Use production components in stories rather than duplicating production markup.
- [x] 4.3 Add deterministic fixtures for bills, line items, payments, payment methods, statuses, totals, and selected rows.
- [x] 4.4 Include composed stories such as `BillDetails` for production-layout design review.
- [x] 4.5 Include supporting stories such as `Payments` and `InvoiceTable` where they help isolate behavior.

## 5. Validation and review

- [x] 5.1 Confirm Storybook starts at `localhost:6006` after the Webpack include fixes.
- [ ] 5.2 Confirm focused stories render real shared visual components such as `CardHeader` from package source.
- [ ] 5.3 Confirm stories remain visually close enough to production for upcoming UI design work.
- [x] 5.4 Keep bill-level discount and other product behavior out of this Storybook setup change.

## 6. Reusable setup guidance

- [x] 6.1 Capture the reusable one-prompt setup brief in `design.md`.
- [x] 6.2 Document known failure modes for package TS transpilation, Storybook TS transpilation, visual mock drift, and missing runtime exports.
