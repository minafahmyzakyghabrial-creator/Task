# Intended test cases

Target: <https://automationexercise.com>. Each test gets a fresh browser context and a unique synthetic email, and its account is deleted afterwards. All cases run in five projects: desktop Chrome, Firefox and WebKit, plus Pixel 7 (Chrome) and iPhone 13 (WebKit) emulation.

| ID | Procedure | Expected outcome | Status on site |
| --- | --- | --- | --- |
| AUTH-01 | Sign up through the UI (name, email, then the full account form); log out; log back in | "Account Created!", "Logged in as &lt;name&gt;", and the same new user can sign in again | Pass |
| AUTH-02 | Create a user, then try to sign up with the same email | "Email Address already exist!", still on signup, not logged in | Pass |
| AUTH-03a | Sign in with an unregistered email | "Your email or password is incorrect!", stays on /login, not logged in | Pass |
| AUTH-03b | Sign in with a registered email and wrong password | Same generic error, no session | Pass |
| AUTH-04 | Leave each required field empty: login email, login password, signup name, signup email, step-2 password | Browser reports a missing value and the form stays on its current page | Pass |
| AUTH-05 | Enter a malformed email on signup | Browser type-mismatch validation blocks the form | Pass |
| AUTH-07 | Reload while signed in; sign in with the password in a different case | Session survives the reload; the case-changed password fails; the correct password works | Pass |
| AUTH-08 | Log out; press Back; replay the old `sessionid` cookie in a new context | Cookie is HttpOnly; Back and the replayed cookie both show a signed-out page | Pass |
| AUTH-09 | Open the site in a second browser context while signed in | No session is shared | Pass |
| AUTH-10a | Abort the login POST (network failure), then retry | User stays signed out; the retry signs in | Pass |
| AUTH-10b | Return HTTP 503 for the login POST, then retry | User stays signed out; the retry signs in | Pass |
| AUTH-11 | Submit login with Enter; check the layout | Keyboard sign-in works; no horizontal overflow at the project's viewport | Pass |



## Not covered (site has no such feature)

Email verification, password reset, MFA, CAPTCHA, rate limiting or lockout, session expiry, and SSO. For a real product these would be agreed with the product owner and added, together with password length limits, Unicode emails, concurrent duplicate signups, double-click submission and multi-tab logout.

16 browser tests per project, 80 across all five projects. AUTH-01 retains a video and trace for submission.

API-only probes and speculative password policies are excluded; the public site publishes no password-strength requirement.
