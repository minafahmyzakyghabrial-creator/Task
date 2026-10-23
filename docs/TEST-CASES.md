# Intended test cases

Each test gets a fresh browser context and unique synthetic email. Positive registration is the precondition for returning-user cases. Tests run independently on all five projects. The matrix lists intended behaviors; execution evidence is recorded separately in VALIDATION.md.

| ID | Procedure | Expected outcome |
| --- | --- | --- |
| AUTH-01 | Submit valid name, email and password; inspect account; log out; log back in | Signup responds 201; protected profile matches; same newly registered user signs in successfully |
| AUTH-02 | Register, log out, register again with uppercase variant of email | Duplicate rejected; no new session |
| AUTH-03a | Sign in with a unique unregistered email | Generic credentials error; remain on sign-in; API unauthorized |
| AUTH-03b | Register then sign in with wrong password | Same generic error and no session |
| AUTH-04 | Omit each required field on both forms (five variants) | Browser reports missing value, no POST is sent, navigation prevented |
| AUTH-05 | Enter malformed email | Browser type-mismatch validation prevents signup |
| AUTH-06 | Try short, letters-only, and numbers-only passwords | Browser/server rejects each; subsequent login proves no account was created |
| AUTH-07 | Reload signed-in page; test password case and email case | Session survives reload; changed password case fails; uppercase email succeeds |
| AUTH-08 | Log out; replay prior session cookie; use Back and direct account URL | Previous token returns 401; account view inaccessible; HttpOnly cookie verified |
| AUTH-09 | Open protected URL in separate browser context | No inherited session; redirected to sign-in |
| AUTH-10a | Abort login request, then retry after restoring connection | Useful error, enabled submit, successful retry |
| AUTH-10b | Return HTTP 503 on login, then retry | Service error, enabled submit, successful retry |
| AUTH-11 | Submit using Enter and inspect account at configured viewport | Keyboard flow completes; no horizontal overflow; logout target at least 44px high |
| AUTH-12 | Directly POST blank name, invalid email, weak/overlong password, overlong name | Server rejects all five with 400 even when native validation is bypassed |
| DEMO | Signup → account → logout → login → account → logout | Entire user lifecycle succeeds; video and trace retained |

21 executable tests per project, 105 across the five projects. AUTH-12 is an API supplement executed within each project; it is not counted as a browser interaction test.

## Risk-based extensions

For a real product, agree on requirements before adding: password min/max boundaries, email/name trimming, Unicode/IDN email support, duplicate signup races, repeated-click deduplication, session expiry, multi-tab logout, failed logout requests, malformed server responses, expired verification links, reset-token reuse, rate limits, MFA, SSO redirects, privacy notices, and accessible screen-reader announcements. These are identified risks, not claims of implemented coverage. Email delivery and durable database registration would need independent integration assertions against that product's infrastructure.
