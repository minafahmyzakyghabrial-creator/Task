# Validation - 23 October 2026

Reviewed the framework against the assignment and removed redundant or out-of-scope tests.

| Check | Observed result |
| --- | --- |
| TypeScript: npm run typecheck | Passed, exit code 0 |
| Headed desktop Google Chrome, one worker, no retries | 16 passed in 5.8 minutes, exit code 0 |
| Firefox, WebKit and mobile emulation | Configured; not rerun in this review |
| GitHub publication and remote CI | Not verified in this review |
| Code walkthrough recording | Regenerated from current source; eight captioned chapters, no audio |

Command: npm run test:headed -- --workers=1 --retries=0

This Windows host uses Node 20.16.0; the project and CI target Node 22+. The run used NODE_OPTIONS=--preserve-symlinks --preserve-symlinks-main to handle local sandbox path resolution.

## Evidence

- HTML report: playwright-report/index.html
- JUnit: test-results/junit.xml
- Successful signup/logout/login/logout video: test-results/auth-AUTH-01-signup-create-45047-at-can-sign-in-after-logout-chrome/video.webm
- Each browser test retains its video and trace under test-results/.

## Scope decisions

Removed the duplicate DEMO test; npm run test:demo now selects AUTH-01, which includes final logout and retains a recording. Removed API-only login and validation probes, speculative password-strength checks, and the case-variant duplicate test that used an unconfirmed expected-failure marker. Browser duplicate-email rejection remains covered. API calls remain for account setup and cleanup.

The retained suite has 16 tests per project (80 configured test instances). No finite suite can identify every possible failure. Email verification, MFA and password reset are outside this practice site's available features. A later local report contains five successful AUTH-01 instances across all configured projects; this verifies the recorded happy path, not the entire 80-instance matrix. GitHub publication, full-matrix execution and a remote CI run remain to be verified before final submission.

## Submission recordings

- `recordings/functionality-chrome.webm`: copied from the successful Chrome AUTH-01 artifact (52.6 seconds).
- `recordings/functionality-mobile-chrome.webm`: copied from the successful mobile Chrome AUTH-01 artifact.
- `recordings/code-walkthrough.webm`: regenerated explanation with actual source excerpts and captions, approximately 128 seconds, silent.

Recording frames were visually inspected. See `docs/WALKTHROUGH.md` for reproduction and submission instructions.
