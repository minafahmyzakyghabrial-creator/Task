# Demonstration and code walkthrough

An automatically captured, captioned code walkthrough is supplied in `recordings/code-walkthrough.webm` (about 72 seconds, no audio). It presents real source excerpts with explanations of architecture, fixtures, registration assertions, failure handling and CI. Regenerate it with `node scripts/record-walkthrough.mjs`. The longer script below is available if a spoken editor walkthrough is preferred.

## Functionality recording

Run `npm run test:demo`. The DEMO test uses `video: 'on'` and `trace: 'on'`, so the successful Chrome journey is recorded under `test-results/`. It shows creation of a fresh account, the registered profile, logout, returning-user login and final logout. Run `npm run report` to inspect the report and open the video attachment. The browser video is evidence of functionality; it has no microphone narration or editor view.

## Code walkthrough recording script (about 5 minutes)

Use a screen recorder with microphone to capture the editor and terminal. Record these steps:

1. **0:00–0:30 — Goal and target.** “This framework tests authentication in MemberSpace, a local controlled app. It exercises the browser and a real HTTP server. Accounts persist through logout but reset when the demo server stops.”
2. **0:30–1:15 — Configuration.** Show `playwright.config.ts`: branded Chrome, Firefox, WebKit, Pixel and iPhone emulation; server startup; reporters; failure evidence; CI-only retry.
3. **1:15–2:00 — Isolation and maintainability.** Show `tests/fixtures.ts`: UUID accounts, fresh browser contexts, page object, accessible locators and automatic waits.
4. **2:00–2:45 — Registration proof.** Show AUTH-01: UI signup, HTTP 201, protected profile, logout, and returning-user login. Explain why this verifies actual registration rather than only a success message.
5. **2:45–3:30 — Failure handling.** Show duplicate/wrong credentials, native and server validation, session invalidation, and route-based network/503 injection with retry. Distinguish injected failures from the unmocked happy path.
6. **3:30–4:15 — Live test.** Run `npm run test:demo -- --headed`, show its output, then run `npm run report` and open the recording/trace.
7. **4:15–5:00 — CI and limitations.** Show `.github/workflows/e2e.yml`, the test matrix and actual validation results. Explain required PR checks, artifact retention, mobile emulation limits and missing production identity features.

Submit the repository URL, a successful CI run URL, the browser demo video, and the captioned code walkthrough (or your spoken walkthrough if required by the evaluator).
