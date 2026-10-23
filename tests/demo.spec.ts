import { test } from './fixtures.js';

// Retain a successful browser recording for the assignment submission.
test.use({ video: 'on', trace: 'on', launchOptions: { slowMo: 250 } });
test('DEMO full registration, logout and returning-user journey', async ({ auth, user }) => {
  await test.step('Create a new account through the UI', async () => { await auth.signup(user); await auth.account(user); });
  await test.step('Sign out', async () => { await auth.signout(); });
  await test.step('Sign in using the newly registered account', async () => { await auth.signin(user.email, user.password); await auth.account(user); });
  await test.step('End the session', async () => { await auth.signout(); });
});
