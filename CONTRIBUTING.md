# Contributing

Thank you for your interest in contributing to `@obsidia-my/myinvois-sdk`.

---

## Development setup

**Prerequisites:** Node.js 18 or later, npm 9 or later.

```bash
git clone https://github.com/obsidia-my/myinvois-sdk.git
cd myinvois-sdk
npm install
```

---

## Project structure

```
src/
  client/
    auth/          TokenManager — OAuth 2.0 token lifecycle
    http/          HttpClient — fetch wrapper with retry/rate-limit handling
    api/           LHDN API wrappers (submit, documents, taxpayer)
    MyInvoisClient.ts
  codes/           Enumeration constants (state codes, tax types, etc.)
  documents/
    types/         TypeScript interfaces for all document types
    builder/       Fluent builder (BaseBuilder + per-type subclasses)
    validator/     DocumentValidator — pre-submission business rule checks
    serialiser/    JsonSerialiser, XmlSerialiser
    signer/        XadesSigner, Canonicaliser, CertificateLoader
tests/
  unit/
    api/           Token manager, HTTP client, submit
    documents/     Builder, validator, serialiser, signer, canonicaliser
  integration/     Sandbox end-to-end (skipped unless MYINVOIS_SANDBOX=true)
  fixtures/        Shared test data
docs/              Developer documentation (markdown)
```

---

## Common commands

```bash
# Type-check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build (CJS + ESM + .d.ts)
npm run build

# Run integration tests (requires sandbox credentials)
MYINVOIS_SANDBOX=true \
MYINVOIS_TIN=C20830570210 \
MYINVOIS_CLIENT_ID=your-client-id \
MYINVOIS_CLIENT_SECRET=your-client-secret \
MYINVOIS_CERT_PATH=./cert.pem \
MYINVOIS_KEY_PATH=./key.pem \
npm test
```

The CI pipeline runs `typecheck → lint → test → build` on Node 18, 20, and 22.

---

## Code standards

- **TypeScript strict mode** — no `any`, no `!` non-null assertions, no `@ts-ignore`
- **No comments** unless the *why* is non-obvious (hidden constraint, counterintuitive workaround)
- **No abstractions beyond what the task requires** — three similar lines beat a premature helper
- **Error handling only at real boundaries** — don't add fallbacks for things that can't fail
- **All public exports must be typed** — the published `.d.ts` is the API contract

The ESLint config enforces most of these. Run `npm run lint` before opening a PR.

---

## Adding a new document type

1. Add an interface in `src/documents/types/` extending `BaseDocument`
2. Add a builder class in `src/documents/builder/` extending `BaseBuilder<YourType>`
3. Export from `src/documents/index.ts`
4. Export the builder from `MyInvoisClient` as a factory method
5. Add a test in `tests/unit/documents/builder.test.ts`

---

## Adding a new code table

Code files live in `src/codes/`. Each file exports:
- A `const` array or `Set` of valid values
- A TypeScript union type derived from it
- An `isKnownX()` helper if useful

Export the new module from `src/codes/index.ts`.

---

## Pull requests

- Target the `main` branch
- Keep PRs focused — one concern per PR
- All tests must pass, lint must pass, typecheck must pass
- For features, add or update tests before opening the PR
- For bug fixes, add a regression test that fails before your fix

Describe *why* the change is needed, not just *what* it does — the diff already shows what.

---

## Reporting bugs

Open an issue on GitHub with:
- The SDK version (`npm list @obsidia-my/myinvois-sdk`)
- Node.js version (`node --version`)
- A minimal reproduction
- The error output (full stack trace)

If the bug is in XAdES signing or the LHDN API response, include the LHDN error payload (redact any PII or credentials).

---

## Releasing

Releases are published automatically by GitHub Actions when a GitHub Release is created. The release tag becomes the npm version. Only maintainers can create releases.
