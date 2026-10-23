# MemberSpace authentication E2E

A self-contained TypeScript / Playwright assignment demonstrating realistic signup, returning-user sign-in and sign-out in Google Chrome, Firefox, WebKit and two mobile emulations.

## Run

Use Node.js 22+ and npm. From this directory:

```sh
npm ci
npx playwright install chrome firefox webkit
npm run typecheck
npm test
npm run report
```

On Linux, use `npx playwright install --with-deps chrome firefox webkit`. Chrome is the branded browser (`channel: 'chrome'`), not merely Chromium. Mobile profiles emulate viewport, touch and device settings; they do not replace real-device testing.

```sh
npm run test:chrome
npm run test:headed
npm run test:ui
npm run test:demo
```

Playwright starts and stops the demo server automatically. Port 3100 must be free. To explore manually, run `npm start` and open <http://127.0.0.1:3100>. The server binds only to the loopback interface.

## Design and evidence

- `app/`: responsive demo application, HTTP API, password hashing and opaque HttpOnly cookie sessions. Accounts live in server memory and survive sign-out; restarting the server clears them. This is a controlled test target, not a production identity service.
- `tests/fixtures.ts`: unique per-test accounts and an authentication page object. No test order dependency or shared signed-in state.
- `tests/auth.spec.ts`: UI journeys with observable account/API checks, negative cases, session checks and injected failures.
- `tests/demo.spec.ts`: narrated Playwright steps with successful video and trace retention.
- `playwright.config.ts`: five browser/device projects, server lifecycle, bounded workers and failure artifacts.
- `.github/workflows/e2e.yml`: reproducible CI installation, type checking, all-project execution and artifact upload.

Assertions use accessible roles/labels and Playwright's automatic waiting; there are no fixed sleeps. Signup is performed through the UI. The primary flow verifies HTTP 201, account details from the protected API, logout, and a fresh login with the same credentials. Thus a success message alone cannot satisfy the registration test. Isolated UUID emails permit concurrent execution; the ephemeral server lifecycle cleans up data after each run.

HTML reports are written to `playwright-report/`; JUnit, failed-test screenshots, videos and traces are in `test-results/`. Successful DEMO recordings are retained too. View a trace with `npx playwright show-trace <path-to-trace.zip>`. Artifacts can contain credentials and session data; this project uses synthetic accounts only and excludes generated artifacts from Git.

## Coverage and limits

See [the case matrix](docs/TEST-CASES.md), [recording and code walkthrough](docs/WALKTHROUGH.md), and [delivery plan](docs/DELIVERY.md).

The demo has no email-verification, password-reset, MFA, CAPTCHA, account deletion or lockout feature. Tests for those features are therefore outside scope. This suite is not a security audit, load test or exhaustive accessibility audit. A finite suite cannot enumerate every possible failure. A real application's product rules should drive additional cases and expected outcomes.

## CI/CD

The GitHub Actions workflow runs on pull requests, pushes to `main`, and manual dispatch. It installs browsers and OS dependencies, runs the type checker, and then executes all five projects. Reports upload even when tests fail, with a 14-day retention. Set the `e2e` check as a required branch protection check in GitHub before merging; deployment should depend on its success. One retry in CI preserves failure evidence and helps diagnose transient failures; review flaky passes rather than treating retries as a fix. The local run uses zero retries.

For a staging system, replace the demo web server and page object with the actual application contract, use a dedicated test tenant, inject secrets through GitHub Actions secrets, and implement account cleanup through an authorized test API. Run a small smoke set after deployment and the full matrix before promotion. Do not run destructive registration tests against production without explicit authorization and isolation.

## GitHub submission

Create an empty repository, then run from this directory:

```sh
git init -b main
git add .
git commit -m "Add authentication E2E framework and demo app"
git remote add origin https://github.com/YOUR-USER/YOUR-REPOSITORY.git
git push -u origin main
```

Publish source and `package-lock.json`; keep dependency folders, test artifacts and credentials out of Git. Attach the demonstration video and walkthrough recording to the assignment submission or a GitHub release, and include the repository URL and CI run URL. Check `docs/VALIDATION.md` for what was actually executed in the authoring environment.

## Reference documentation

Configuration follows official Playwright documentation for [projects and device coverage](https://playwright.dev/docs/test-projects), [branded Chrome](https://playwright.dev/docs/browsers), and [automatic server startup](https://playwright.dev/docs/test-webserver).
