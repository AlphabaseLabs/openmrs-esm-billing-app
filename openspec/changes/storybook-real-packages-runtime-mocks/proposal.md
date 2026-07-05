## Why

Setting up Storybook for an OpenMRS ESM repo is easy to get superficially working but hard to make production-faithful. The billing setup showed that the reliable pattern is to render production component code with real shared visual packages while mocking only shell/runtime side effects.

This change captures that pattern so the current setup is reviewable and can be reused as a one-prompt setup plan for the next OpenMRS repo.

## What Changes

- Establish Storybook as a production-fidelity design surface for this OpenMRS ESM repo.
- Use Storybook Webpack rather than Vite for compatibility with OpenMRS package source, Sass, CSS modules, and Carbon/OpenMRS styles.
- Compile production component source from this repo and selected real OpenMRS visual packages.
- Start the real visual package allowlist with `@openmrs/esm-patient-common-lib`, so shared UI such as `CardHeader` is rendered from production package code.
- Mock only runtime side effects and OpenMRS shell services such as fetch, navigation, sessions, config, visit state, feature flags, modals, snackbars, and workspace launchers.
- Keep stories deterministic through fixture data rather than a live backend.
- Create focused production stories only for the components needed by upcoming billing work, not every component in the repo.
- Document the known failure modes and the setup prompt to use in future OpenMRS repos.

## Capabilities

### New Capabilities
- `storybook-production-fidelity`: Storybook can render focused OpenMRS production component stories with real visual dependencies, runtime-only mocks, and deterministic fixtures.

### Modified Capabilities

## Impact

- Affects `.storybook` configuration and mocks.
- Affects fixture-backed production stories for billing surfaces such as `InvoiceTable`, `BillDetails`, and `Payments`.
- Affects OpenSpec documentation for reviewing and reusing this setup pattern.
- Does not change production billing runtime behavior, backend APIs, or bill-level discount implementation.
