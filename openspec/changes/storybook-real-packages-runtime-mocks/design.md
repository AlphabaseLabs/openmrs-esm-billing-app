## Context

The billing Storybook setup went through several false starts:

- Rendering shallow local visual mocks compiled quickly but drifted from production UI.
- Importing real OpenMRS package source initially failed because TypeScript/TSX under `node_modules` was not transpiled.
- Switching to an `include`-based TS loader fixed the package transpilation boundary, but also showed that `.storybook` itself must be included so `preview.tsx` and config helpers compile.
- The stable model is not "mock everything" and not "run the full OpenMRS shell". The stable model is real visual primitives plus mocked runtime side effects.

The resulting design is a reusable Storybook setup pattern for OpenMRS ESM repos.

## Goals / Non-Goals

**Goals:**
- Render production components inside Storybook.
- Compile real shared visual packages where those packages affect production UI fidelity.
- Mock only OpenMRS shell/runtime side effects.
- Use deterministic fixtures for story data.
- Create only focused stories needed for upcoming work.
- Provide a one-prompt playbook for setting up another OpenMRS repo in the same way.

**Non-Goals:**
- Do not run a full OpenMRS shell inside Storybook.
- Do not connect stories to a live backend.
- Do not create stories for every component by default.
- Do not recreate production UI markup inside story files.
- Do not implement bill-level discount or other feature behavior as part of Storybook setup.

## Decisions

### Use Storybook Webpack for OpenMRS ESM repos

OpenMRS ESM repos commonly depend on Webpack-friendly behavior for TS/TSX, SCSS, CSS modules, Carbon styles, OpenMRS styleguide Sass variables, and package source imports. Use `@storybook/react-webpack5` unless the repo has a proven Vite-compatible setup.

### Compile repo source, Storybook source, and selected real visual packages

The TS/TSX loader must explicitly include:

- the repo `src` directory
- the `.storybook` directory
- the roots of allowlisted OpenMRS visual packages

Use an explicit `include` list rather than a fragile `exclude: /node_modules/` exception.

Initial visual package allowlist:

- `@openmrs/esm-patient-common-lib`: required for production visual primitives such as `CardHeader` used by billing `Payments` and `BillDetails`.

### Keep real visual primitives, mock runtime side effects

The boundary is:

```text
Real
 ├─ production repo components
 ├─ shared visual components from allowlisted OpenMRS packages
 ├─ SCSS/CSS module styles
 ├─ Carbon/OpenMRS styles and tokens
 └─ story fixtures

Mocked
 ├─ openmrsFetch
 ├─ navigate
 ├─ showSnackbar / showModal
 ├─ launchWorkspace2 / launchWorkspaceGroup2
 ├─ useSession / useConfig / useVisit
 ├─ useFeatureFlag / useLayoutType where shell-owned
 └─ runtime prompts or shell services such as launchStartVisitPrompt
```

### Prefer composed production surfaces for design work

For billing work, `BillDetails` is the primary design surface because it composes patient/bill details, line items, and payments. Supporting stories such as `Payments` and `InvoiceTable` are useful, but visual decisions should be checked against the composed production surface where possible.

### Keep stories focused and fixture-driven

Do not create stories for all components up front. Create focused stories only for components needed by the upcoming change. Fixtures should represent production-shaped data for bills, line items, payments, payment methods, statuses, totals, and selected rows.

## Reusable One-Prompt Setup Brief

```text
We need to set up Storybook for this nested OpenMRS ESM repo with production-fidelity component stories.

Repository hygiene:
- Work only inside this repo: <ABSOLUTE_REPO_PATH>.
- Ignore the workspace root git branch unless explicitly asked.
- Check for uncommitted work in this repo before changing anything.
- If clean, fetch origin, set local dev equal to origin/dev, then create a feature branch named <BRANCH_NAME>.
- Do not operate from the workspace root.

Goal:
Set up Storybook using the repo's actual production component code so UI stories render like the app. Use Webpack Storybook, not Vite, because OpenMRS ESM repos commonly depend on Webpack-compatible SCSS/CSS module handling and package source transpilation.

Storybook setup:
- Install/configure Storybook with `@storybook/react-webpack5`.
- Add `.storybook/main.ts` and `.storybook/preview.tsx`.
- Import Carbon styles and any repo/global styles needed for production-like rendering.
- Configure Webpack to compile TypeScript/TSX from:
  - the repo `src` directory
  - the `.storybook` directory
  - an explicit allowlist of real OpenMRS visual packages
- Start the visual package allowlist with `@openmrs/esm-patient-common-lib`.
- Do not broadly transpile all `node_modules`.

Critical Webpack rule:
- Use an explicit `include` list for `swc-loader` or equivalent.
- Include `src`, `.storybook`, and allowlisted OpenMRS visual package roots.
- Do not rely on fragile `exclude: /node_modules/` exceptions.
- Add SCSS handling that supports CSS modules and Sass imports used by OpenMRS packages.

Mocking policy:
- Mock runtime side effects only.
- Mock `@openmrs/esm-framework` APIs such as `openmrsFetch`, `navigate`, `showSnackbar`, `showModal`, `launchWorkspace2`, `launchWorkspaceGroup2`, `useSession`, `useConfig`, `useVisit`, `useFeatureFlag`, `useLayoutType`, `UserHasAccess`, `ExtensionSlot`, and other shell services.
- For `@openmrs/esm-patient-common-lib`, re-export real visual components such as `CardHeader` from the package source.
- Only mock non-visual runtime exports such as `useSystemVisitSetting` and `launchStartVisitPrompt`.
- Do not hand-build visual mocks for shared production UI components unless the real package cannot be compiled.

Stories:
- Create focused stories only for the production components needed by the upcoming work.
- Do not create stories for every component in the repo by default.
- Use production components, not Storybook-only recreated markup.
- Use deterministic fixtures for bills, line items, payments, payment methods, patient data, and statuses.
- Keep API/resource mocks fixture-backed.
- For billing-style work, create composed stories first for the real surface where design will happen, such as `BillDetails`, then supporting stories like `Payments` and `InvoiceTable`.
- Prefer composed production stories over isolated subcomponent screenshots when judging visual fidelity.

Validation targets:
- Storybook should start at `localhost:6006`.
- Production stories should compile without TypeScript parse errors from OpenMRS packages.
- `CardHeader` and similar shared visual components should come from real OpenMRS package code, not local visual mocks.
- Stories should render realistic production states using fixtures.
- No feature logic should be implemented during Storybook setup unless explicitly requested.

Known failure modes to avoid:
- If Webpack says `The keyword 'interface' is reserved`, a TypeScript file from an OpenMRS package is not being transpiled.
- If Webpack fails on `import type`, `.storybook` files are not included in the TS loader.
- If the story visually differs around shared headers, check whether a real visual component was replaced by a shallow mock.
- If Storybook compiles but runtime exports are missing, add runtime mocks instead of replacing visual components.
```

## Risks / Trade-offs

- Real visual package imports can pull more package source than expected. Keep the allowlist narrow and grow it only when required.
- Runtime mocks can drift if production shell APIs change. Keep mocks production-shaped and minimal.
- Isolated stories may not perfectly match full app screenshots because the OpenMRS shell supplies outer layout. Use composed stories for design judgment.
- Broad `node_modules` transpilation can slow Storybook and expose unrelated package assumptions. Avoid it.
