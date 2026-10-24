# Demonstration and code walkthrough

## Submission files

- `recordings/functionality-chrome.webm`: successful signup, logout, returning-user login and final logout.
- `recordings/functionality-mobile-chrome.webm`: the same flow in Pixel 7 emulation.
- `recordings/code-walkthrough.webm`: eight captioned chapters explaining the actual source, approximately 2 minutes 8 seconds, no audio.

Submit the Chrome functionality video and the code walkthrough together; the mobile video is additional evidence. Videos are ignored by Git and must be attached separately.

## Functionality recording

Run `npm run test:demo`. AUTH-01 runs in desktop Chrome with `video: 'on'`, `trace: 'on'`. It creates a new account on automationexercise.com, shows "Logged in as", logs out, signs back in as the returning user and logs out again. The video is saved under `test-results/`. Run `npm run report` and open the AUTH-01 test to play it.

For a mobile recording, run `npx playwright test --grep AUTH-01 --project=mobile-chrome`.

## Captioned code walkthrough

`node scripts/record-walkthrough.mjs` writes `recordings/code-walkthrough.webm`, about 128 seconds and silent. It shows real source excerpts with captions on the architecture, configuration, fixtures, registration proof, negative cases and CI.

## Spoken walkthrough script (about 5 minutes)

Record the editor and terminal with a microphone:

1. **0:00–0:30 — Goal and target.** The framework tests signup, sign-in and sign-out on the public practice site automationexercise.com, with real browsers and real HTTP requests.
2. **0:30–1:15 — Configuration.** Show `playwright.config.ts`: base URL, branded Chrome, Firefox, WebKit, Pixel 7 and iPhone 13 emulation, two workers because the site is shared, retries, reporters and failure artifacts.
3. **1:15–2:00 — Fixtures.** Show `tests/fixtures.ts`: the `AuthPage` page object with `data-qa` locators, the UUID user, API account creation, ad blocking, and account deletion after each test.
4. **2:00–2:45 — Registration proof.** Show AUTH-01: UI signup, "Account Created!", "Logged in as", logout and a fresh login with the same credentials, which proves the user is really registered.
5. **2:45–3:30 — Failure scenarios.** Show unregistered and wrong-password logins, duplicates, required fields, malformed email, session invalidation with cookie replay, and network/503 injection with retry.
6. **3:30–4:15 — Live run.** Run `npm run test:demo -- --headed`, then `npm run report` and open the video and trace.
7. **4:15–5:00 — CI/CD.** Show `.github/workflows/e2e.yml`, the artifact upload, and explain the required status check and staging gate from the README.

Submit the repository URL, a green CI run URL, the functionality video and the walkthrough recording.
