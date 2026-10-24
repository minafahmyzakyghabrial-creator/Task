# Authentication E2E — Automation Exercise

A TypeScript / Playwright framework that imitates real users signing up, signing in and signing out of the public practice site [automationexercise.com](https://automationexercise.com). It runs in Google Chrome, Firefox, WebKit and two mobile emulations.

## Run

Use Node.js 22+ and npm. From this directory:

```sh
npm ci
npx playwright install chrome firefox webkit
npm run typecheck
npm test            # all five browser/device projects
npm run report      # open the HTML report
```

On Linux, use `npx playwright install --with-deps chrome firefox webkit`. Chrome is the branded browser (`channel: 'chrome'`), not just Chromium. Mobile projects emulate viewport, touch and user agent; they do not replace real-device testing.

```sh
npm run test:chrome   # desktop Chrome only
npm run test:headed   # desktop Chrome with a visible browser
npm run test:ui       # Playwright UI mode
npm run test:demo     # recorded happy-path journey (video + trace kept)
```

Local runs show the browser; set `CI=1` to run headless.

## Structure

| Path | Purpose |
| --- | --- |
| `playwright.config.ts` | Base URL, five browser/device projects, retries, reporters and failure artifacts |
| `tests/fixtures.ts` | `AuthPage` page object, a unique UUID user per test, API account creation, ad blocking and account cleanup |
| `tests/auth.spec.ts` | Positive journey, negative cases, validation, session and fault-injection tests |
| `scripts/record-walkthrough.mjs` | Generates the captioned code-walkthrough video |
| `.github/workflows/e2e.yml` | CI pipeline |
| `docs/` | [Test cases](docs/TEST-CASES.md), [walkthrough](docs/WALKTHROUGH.md), [validation results](docs/VALIDATION.md) |

## Design

- **Real registration proof.** AUTH-01 signs up through the UI, checks "Logged in as &lt;name&gt;", logs out, then signs in again with the same credentials. A success banner alone cannot pass the test.
- **Isolation.** Every test gets a fresh browser context and a unique `pw-<uuid>@example.test` email, so tests run in parallel with no order dependency.
- **Fast preconditions.** Tests that only need an existing user create it through the site's public `createAccount` API instead of the UI.
- **Cleanup.** The `user` fixture deletes the account through `deleteAccount` after every test, so the shared site is not littered with test users.
- **Stability.** Ad and consent-banner hosts are blocked; they otherwise cover buttons. Locators use the site's `data-qa` attributes and accessible roles, with Playwright's auto-waiting instead of sleeps.

Browser tests retain videos and traces for review. Reports go to `playwright-report/`; JUnit XML, screenshots, videos and traces of failures go to `test-results/`. View a trace with `npx playwright show-trace <trace.zip>`.

## CI/CD integration

`.github/workflows/e2e.yml` runs on every pull request, on pushes to `main`, nightly, and on manual dispatch:

1. Checkout, set up Node 22 with npm cache, `npm ci`.
2. Install Chrome, Firefox and WebKit with OS dependencies.
3. `npm run typecheck`, then `npm test` across all five projects with `CI=1` (headless, 2 retries).
4. Upload the HTML report, JUnit XML, traces, screenshots and videos as artifacts, even when tests fail (14-day retention).

To use it as a quality gate:

- Mark the `e2e` job as a **required status check** in branch protection, so pull requests cannot merge while it is red.
- In a delivery pipeline, run it **after deploying to a staging environment** (point `baseURL` at staging through an environment variable) and block promotion to production on failure. Run a short smoke subset (`--grep AUTH-01`) after the production deployment.
- Publish `test-results/junit.xml` to the CI test dashboard to track trends, and review any test that passes only on retry as flaky instead of hiding it.
- Shard large matrices across machines with `--shard=1/4` and merge the blob reports.
- Keep credentials in CI secrets. The tests here use synthetic, self-deleting accounts only.

The nightly run matters because the target is an external site: it can change without a pull request in this repository.

## Scope and limits

The practice site has no email verification, password reset, MFA, CAPTCHA or account lockout, so those are out of scope. This is not a security audit, load test or full accessibility audit. Because it is a shared public site, workers are capped at 2 and occasional slowness is absorbed by retries.
