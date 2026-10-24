# Code Explanation: Authentication End-to-End Framework

This document explains how the project uses Playwright and TypeScript to test signup, sign-in and sign-out on Automation Exercise. The tests interact with the real website at https://automationexercise.com. They use synthetic accounts and attempt to delete those accounts after each test.

## 1. Project structure

| File | Responsibility |
| --- | --- |
| `playwright.config.ts` | Test execution settings, browser/device projects and reports |
| `tests/fixtures.ts` | Reusable browser actions, user data, API setup and cleanup |
| `tests/auth.spec.ts` | Authentication scenarios and expected results |
| `package.json` | Dependencies and commands |
| `tsconfig.json` | TypeScript checks and module settings |
| `.github/workflows/e2e.yml` | GitHub Actions test pipeline |
| `scripts/record-walkthrough.mjs` | Generates a captioned source-code walkthrough video |
| `docs/TEST-CASES.md` | Intended test-case coverage |
| `docs/VALIDATION.md` | Recorded execution results and remaining verification |

The main separation is between what a test proves and how it operates the page. The test file describes scenarios; `AuthPage` supplies the browser interactions. If a signup selector changes, it can usually be corrected in the page object without changing every scenario.

## 2. Playwright configuration

`playwright.config.ts` exports a configuration created with `defineConfig()`.

- `testDir: './tests'` tells Playwright where to discover tests.
- `fullyParallel: true` allows tests in the same file to run independently. `workers: 2` limits simultaneous execution to reduce load on the shared practice site.
- `forbidOnly` rejects accidentally committed `test.only()` calls in CI.
- Local runs allow one retry; CI allows two. A retry is an execution policy, not proof that a failure is harmless. The documented headed review used `--retries=0`.
- Each test has a 60-second timeout. Retrying assertions, such as `toBeVisible()`, have a default 10-second timeout.
- `baseURL` lets `page.goto('/login')` resolve to the target website.
- `headless: !!process.env.CI` shows browsers locally and runs without visible windows when CI is set to a nonempty value. For example, `CI=false` is still a nonempty string and therefore enables headless mode.

Five projects execute the same tests: branded desktop Google Chrome, Firefox, WebKit, Pixel 7 with Chrome, and iPhone 13 with WebKit. Device presets emulate characteristics such as viewport, user agent and touch behavior. They do not run on physical phones; WebKit is the browser engine used for Safari-oriented coverage.

Three reporters provide terminal output, an HTML report and JUnit XML. Configuration defaults retain traces and videos on failure and screenshots only on failure. However, `auth.spec.ts` overrides video and trace settings to `on`, retaining those artifacts for successful tests too.

## 3. User model and page object

`tests/fixtures.ts` defines the data needed by authentication tests:

```ts
export type User = { name: string; email: string; password: string };
```

The `AuthPage` class receives a Playwright `Page`. Its methods centralize actions and checks:

| Method | Behavior |
| --- | --- |
| `signup(user)` | Opens the login page, fills the new-user name and email, and submits the first signup step |
| `completeSignup(user)` | Checks the signup URL, fills account/address information, submits registration, checks the creation message and continues |
| `signin(email, password)` | Opens the login page and submits credentials |
| `account(user)` | Checks the displayed account name and visible Logout link |
| `signedOut(page)` | Checks the Signup / Login link and absence of the logged-in label; optionally accepts another page |
| `signout()` | Clicks Logout, checks the login URL and verifies signed-out navigation |
| `loginError()` / `signupError()` | Returns a locator for the corresponding error message |

Most form controls use the site's `data-qa` attributes. Navigation links use accessible roles and names. These selectors describe the intended element more clearly than position-based selectors.

`await` makes each asynchronous interaction finish before the next dependent action begins. Playwright locators wait for applicable actionability conditions, and assertions such as `toHaveText()` retry until they pass or time out. Test interactions use these mechanisms instead of fixed delays.

## 4. Fixtures: setup, test execution and teardown

The exported `test` extends Playwright's standard test object with `user` and `auth` fixtures, and customizes the browser context fixture.

A fixture provides a dependency to a test. Code before `await use(value)` prepares it; code after that call performs teardown once the dependent test finishes.

### Browser context

Playwright normally gives each test a separate browser context, isolating cookies and browser storage. The customized context installs a route that aborts requests matching advertising, analytics and consent-related host patterns. This reduces interference from overlays. It also means those third-party integrations are intentionally excluded from the tested experience.

### Unique user

The `user` fixture builds an email such as `pw-<uuid>@example.test` using `randomUUID()`. A distinct address avoids collisions between parallel tests and repeated executions. All user data is synthetic.

After the test, the fixture creates an API request context, calls `/api/deleteAccount` with the email and password, and disposes the request context. Cleanup is attempted even when a test does not create an account. The current code does not assert the deletion response, so it should be described as an attempted cleanup rather than verified deletion.

### AuthPage injection

The `auth` fixture constructs `new AuthPage(page)`. Tests can request their dependencies directly:

```ts
async ({ auth, user }) => {
  await auth.signup(user);
}
```

Playwright prepares the requested fixtures and supplies them to the test function.

## 5. API setup helpers

`postAccount(request, user)` sends form data to `/api/createAccount` and returns the parsed JSON response. It includes the profile and address fields required by the practice API.

`createAccount(request, user)` calls that helper and asserts that the JSON contains `responseCode: 201`. This checks the application's response-body code; it is not an assertion of the HTTP status code.

These helpers provide a registered user for scenarios that need one, such as wrong-password login. The behavior under test still occurs in the browser. The primary registration test creates its account entirely through the UI, so API setup cannot replace or conceal a broken signup journey.

## 6. Main registration journey

AUTH-01 executes this sequence:

```ts
await auth.signup(user);
await auth.completeSignup(user);
await auth.account(user);
await auth.signout();
await auth.signin(user.email, user.password);
await auth.account(user);
await auth.signout();
```

The creation message confirms that the website reports success. The account checks confirm the expected user is displayed. Signing out and signing in again with the same credentials provides stronger evidence that the user was registered and can return to the application. The final logout verifies that the returning session can end successfully.

The fixture then attempts account deletion. No test depends on an account created by an earlier test.

## 7. Failure and session scenarios

The suite expands to 16 tests for each configured project, or 80 instances when the full matrix runs. Some IDs have multiple generated cases, and numbering gaps reflect removed cases.

| ID | What the code checks |
| --- | --- |
| AUTH-01 | Full UI registration, logout, returning-user login and final logout |
| AUTH-02 | An existing email cannot register again; an error appears and the user remains signed out |
| AUTH-03, two cases | Unknown email and registered email with a wrong password produce the generic login error and no authenticated UI |
| AUTH-04, five cases | Missing login email/password, signup name/email and second-step password trigger browser required-field validation |
| AUTH-05 | Malformed signup email triggers the browser's email type-mismatch validation |
| AUTH-07 | Reload preserves login; changing password case fails; the correct password still works |
| AUTH-08 | Logout leaves signed-out navigation after Back and revisiting home; replaying the former session cookie does not restore authenticated UI |
| AUTH-09 | An independent browser context does not inherit the logged-in session |
| AUTH-10, two cases | Aborted login requests and HTTP 503 responses allow a later successful login after the injected fault is removed |
| AUTH-11 | Enter submits login and document width does not exceed the current viewport |

Required-field tests inspect browser validity properties such as `valueMissing`. The four first-step cases also listen for navigation POST requests and assert that none was observed. The second-step password case checks missing-value validity and the unchanged signup URL. Malformed-email validation uses `typeMismatch`.

AUTH-08 captures the original `sessionid` cookie and checks its HttpOnly attribute. After logout, it adds that old cookie to a fresh context and opens the site. The signed-out assertions test that replaying it does not regain authenticated UI. Extra contexts are closed in `finally` blocks.

AUTH-10 intercepts the login route. GET requests continue normally, while POST requests are aborted or fulfilled with a 503 response. The code tolerates a possible navigation exception, checks that the logged-in label is absent, removes the route and performs a real successful login. This demonstrates recovery; it does not verify a specific error screen or independently inspect the server session during the injected failure.

AUTH-11's width comparison is a basic layout check. It does not establish complete mobile usability or accessibility.

## 8. Reports and recordings

`auth.spec.ts` enables videos and traces for every test in that file. The HTML report links the results and attachments; JUnit XML supports CI test-result consumers.

- `playwright-report/`: HTML report.
- `test-results/`: JUnit XML and per-test recordings, traces and failure screenshots.
- `recordings/functionality-chrome.webm`: copied successful Chrome journey for submission.
- `recordings/functionality-mobile-chrome.webm`: additional mobile demonstration.
- `recordings/code-walkthrough.webm`: captioned source explanation.

The walkthrough generator reads actual source files, renders eight explanatory chapters in Chrome, and records a 1920 by 1080 video. It checks that each chapter fits the viewport. Its 16-second pauses give viewers time to read; they are presentation timing, not synchronization in authentication tests. It saves the final video and closes the browser. The generated walkthrough is silent.

Videos are excluded from Git and should be attached separately to the assignment submission. Files under `test-results/` can be replaced by later runs, so the copied submission videos provide stable paths.

## 9. Commands and TypeScript

Use Node.js 22 or newer, install dependencies with `npm ci`, and install the browsers with `npx playwright install chrome firefox webkit`.

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | Check TypeScript without generating JavaScript |
| `npm test` | Run the full configured browser/device matrix |
| `npm run test:chrome` | Run desktop Chrome tests |
| `npm run test:headed -- --workers=1 --retries=0` | Run visible Chrome sequentially with no retries |
| `npm run test:demo` | Select AUTH-01 in Chrome for the functionality demonstration |
| `npm run test:ui` | Open Playwright's interactive test interface |
| `npm run report` | Open the HTML report |
| `node scripts/record-walkthrough.mjs` | Generate the captioned code walkthrough |

`package.json` declares ES modules and the Playwright/TypeScript dependencies. `tsconfig.json` enables strict checking, targets ES2022 and uses NodeNext module rules. Imports such as `./fixtures.js` follow the runtime module naming convention while the source file is TypeScript. The `noEmit` setting makes type checking a validation step rather than a build-output step.

## 10. CI/CD workflow

The GitHub Actions workflow runs on pushes to `main`, pull requests, a daily 03:00 UTC schedule and manual dispatch. It uses an Ubuntu runner with a 40-minute job limit.

The job checks out the repository, installs Node 22 and dependencies, installs browsers and operating-system dependencies, runs TypeScript checking, and runs the complete suite with `CI=true`. An artifact-upload step runs even after failures and retains reports and test evidence for 14 days.

To make it a merge gate, configure the job as a required status check in GitHub branch protection. To use it as a deployment gate, run it after a staging deployment and require success before promotion. The current configuration hardcodes the public practice-site URL; testing staging would require changing or parameterizing `baseURL`. The supplied workflow does not deploy the application or configure branch protection itself.

## 11. Scope and interpretation

The framework covers the available authentication journey and selected failure conditions. It does not claim to identify every possible failure or perform a security, accessibility or load audit. Email verification, MFA and password reset are outside the selected practice site's available features.

Browser emulation configuration is separate from execution evidence. A configured project is not automatically a verified project, and one successful registration recording does not prove that every negative case passed in that browser. Refer to `VALIDATION.md` for the recorded scope of each run.

For maintenance, update selectors in `AuthPage`, add independent scenarios to `auth.spec.ts`, document their expectations in `TEST-CASES.md`, and rerun the affected browser/device projects. Review failures that pass only on retry rather than treating retries as a substitute for investigation.
