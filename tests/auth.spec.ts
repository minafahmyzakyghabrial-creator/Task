import { test, expect, createAccount } from './fixtures.js';

test.use({ video: 'on', trace: 'on' });

test('AUTH-01 signup creates a registered account that can sign in after logout', async ({ auth, user }) => {
  await auth.signup(user);
  await auth.completeSignup(user);
  await auth.account(user);
  await auth.signout();
  await auth.signin(user.email, user.password);
  await auth.account(user);
  await auth.signout();
});

test('AUTH-02 duplicate email is rejected', async ({ page, auth, user, request }) => {
  await createAccount(request, user);
  await auth.signup(user);
  await expect(auth.signupError()).toHaveText('Email Address already exist!');
  await expect(page).toHaveURL('/signup');
  await auth.signedOut();
});

for (const scenario of ['unknown email', 'wrong password'] as const) {
  test(`AUTH-03 ${scenario} cannot sign in`, async ({ page, auth, user, request }) => {
    if (scenario === 'wrong password') await createAccount(request, user);
    await auth.signin(user.email, scenario === 'wrong password' ? 'WrongPass123!' : user.password);
    await expect(auth.loginError()).toHaveText('Your email or password is incorrect!');
    await expect(page).toHaveURL('/login');
    await auth.signedOut();
  });
}

const required = { login: ['login-email', 'login-password'], signup: ['signup-name', 'signup-email'] };
for (const [form, fields] of Object.entries(required)) {
  for (const field of fields) {
    test(`AUTH-04 ${form} requires ${field.split('-')[1]}`, async ({ page, user }) => {
      await page.goto('/login');
      const values: Record<string, string> = { 'login-email': user.email, 'login-password': user.password, 'signup-name': user.name, 'signup-email': user.email };
      for (const f of fields) await page.locator(`[data-qa=${f}]`).fill(f === field ? '' : values[f]);
      let submitted = false;
      page.on('request', r => { if (r.method() === 'POST' && r.isNavigationRequest()) submitted = true; });
      await page.locator(`[data-qa=${form}-button]`).click();
      expect(await page.locator(`[data-qa=${field}]`).evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
      expect(submitted).toBe(false);
      await expect(page).toHaveURL('/login');
    });
  }
}

test('AUTH-04 signup step 2 requires a password', async ({ page, auth, user }) => {
  await auth.signup(user);
  await page.locator('[data-qa=create-account]').click();
  expect(await page.locator('[data-qa=password]').evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
  await expect(page).toHaveURL('/signup');
});

test('AUTH-05 malformed email is blocked by browser validation', async ({ page, user }) => {
  await page.goto('/login');
  await page.locator('[data-qa=signup-name]').fill(user.name);
  await page.locator('[data-qa=signup-email]').fill('not-an-email');
  await page.locator('[data-qa=signup-button]').click();
  expect(await page.locator('[data-qa=signup-email]').evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(true);
  await expect(page).toHaveURL('/login');
});

test('AUTH-07 session survives reload; password is case sensitive', async ({ page, auth, user, request }) => {
  await createAccount(request, user);
  await auth.signin(user.email, user.password);
  await auth.account(user);
  await page.reload();
  await auth.account(user);
  await auth.signout();
  await auth.signin(user.email, user.password.toLowerCase());
  await expect(auth.loginError()).toHaveText('Your email or password is incorrect!');
  await auth.signin(user.email, user.password);
  await auth.account(user);
});

test('AUTH-08 logout invalidates the server session', async ({ page, browser, auth, user, request }) => {
  await createAccount(request, user);
  await auth.signin(user.email, user.password);
  await auth.account(user);
  const sid = (await page.context().cookies()).find(c => c.name === 'sessionid');
  expect(sid?.httpOnly).toBe(true);
  await auth.signout();
  await page.goBack();
  await auth.signedOut();
  await page.goto('/');
  await auth.signedOut();
  // Replay the former cookie in a fresh context to prove server-side invalidation, not merely UI hiding.
  const replay = await browser.newContext();
  try {
    await replay.addCookies([{ ...sid! }]);
    const tab = await replay.newPage();
    await tab.goto('/');
    await auth.signedOut(tab);
  } finally { await replay.close(); }
});

test('AUTH-09 separate browser context has no authenticated session', async ({ browser, auth, user, request }) => {
  await createAccount(request, user);
  await auth.signin(user.email, user.password);
  await auth.account(user);
  const isolated = await browser.newContext();
  try {
    const tab = await isolated.newPage();
    await tab.goto('/');
    await auth.signedOut(tab);
  } finally { await isolated.close(); }
});

for (const failure of ['network', 'server'] as const) {
  test(`AUTH-10 ${failure} failure during sign in leaves the user signed out and allows retry`, async ({ page, auth, user, request }) => {
    await createAccount(request, user);
    await page.route('**/login', route => route.request().method() !== 'POST' ? route.continue()
      : failure === 'network' ? route.abort('failed') : route.fulfill({ status: 503, contentType: 'text/plain', body: 'Unavailable' }));
    await auth.signin(user.email, user.password).catch(() => {}); // an aborted form POST surfaces as a navigation error
    await expect(page.getByText('Logged in as')).toHaveCount(0);
    await page.unroute('**/login');
    await auth.signin(user.email, user.password);
    await auth.account(user);
  });
}

test('AUTH-11 login form submits with the keyboard and fits the viewport', async ({ page, auth, user, request }) => {
  await createAccount(request, user);
  await page.goto('/login');
  await page.locator('[data-qa=login-email]').fill(user.email);
  await page.locator('[data-qa=login-password]').fill(user.password);
  await page.locator('[data-qa=login-password]').press('Enter');
  await auth.account(user);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
