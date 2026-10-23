import { test, expect } from './fixtures.js';

test('AUTH-01 signup creates a registered account that can sign in after logout', async ({ page, auth, user }) => {
  const created = page.waitForResponse(r => r.url().endsWith('/api/signup') && r.request().method() === 'POST');
  await auth.signup(user);
  expect((await created).status()).toBe(201);
  await auth.account(user);
  const profile = await page.request.get('/api/me');
  expect(profile.status()).toBe(200);
  expect(await profile.json()).toEqual({ name: user.name, email: user.email });
  await auth.signout();
  await auth.signin(user.email, user.password);
  await auth.account(user);
});

test('AUTH-02 duplicate email including mixed case is rejected', async ({ page, auth, user }) => {
  await auth.signup(user); await auth.account(user); await auth.signout();
  await auth.signup({ ...user, email: user.email.toUpperCase() });
  await expect(page.getByRole('alert')).toHaveText('An account with this email already exists.');
  expect((await page.request.get('/api/me')).status()).toBe(401);
});

for (const scenario of ['unknown email', 'wrong password'] as const) {
  test(`AUTH-03 ${scenario} cannot sign in`, async ({ page, auth, user }) => {
    if (scenario === 'wrong password') { await auth.signup(user); await auth.account(user); await auth.signout(); }
    await auth.signin(user.email, scenario === 'wrong password' ? 'WrongPass123!' : user.password);
    await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.');
    await expect(page).toHaveURL('/signin');
    expect((await page.request.get('/api/me')).status()).toBe(401);
  });
}

for (const form of ['signup', 'signin']) {
  for (const field of ['email', 'password', ...(form === 'signup' ? ['name'] : [])]) {
    test(`AUTH-04 ${form} requires ${field}`, async ({ page, auth, user }) => {
      await page.goto(`/${form}`);
      if (form === 'signup') await page.getByLabel('Name', { exact: true }).fill(user.name);
      await auth.credentials(user.email, user.password);
      await page.locator(`#${field}`).fill('');
      let submitted = false;
      page.on('request', r => { if (r.method() === 'POST') submitted = true; });
      await page.getByRole('button').click();
      expect(await page.locator(`#${field}`).evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
      expect(submitted).toBe(false);
      await expect(page).toHaveURL(`/${form}`);
    });
  }
}

test('AUTH-05 malformed email is blocked by browser validation', async ({ page, auth, user }) => {
  await page.goto('/signup');
  await page.getByLabel('Name', { exact: true }).fill(user.name);
  await auth.credentials('not-an-email', user.password);
  await page.getByRole('button').click();
  expect(await page.getByLabel('Email', { exact: true }).evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(true);
  await expect(page).toHaveURL('/signup');
});

for (const password of ['short1', 'onlyletters', '12345678']) {
  test(`AUTH-06 weak password ${password} does not create an account`, async ({ page, auth, user }) => {
    await auth.signup({ ...user, password });
    if (password === 'short1') {
      expect(await page.getByLabel('Password', { exact: true }).evaluate((input: HTMLInputElement) => input.validity.tooShort)).toBe(true);
    } else {
      await expect(page.getByRole('alert')).toContainText('a letter and a number');
    }
    expect((await page.request.get('/api/me')).status()).toBe(401);
    await auth.signin(user.email, password);
    await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.');
  });
}

test('AUTH-07 session survives reload; password remains case sensitive', async ({ page, auth, user }) => {
  await auth.signup(user); await auth.account(user);
  await page.reload(); await auth.account(user); await auth.signout();
  await auth.signin(user.email.toUpperCase(), user.password.toLowerCase());
  await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.');
  await auth.signin(user.email.toUpperCase(), user.password); await auth.account(user);
});

test('AUTH-08 logout invalidates session, blocks direct access and Back navigation', async ({ page, auth, user }) => {
  await auth.signup(user); await auth.account(user);
  const cookies = await page.context().cookies();
  const sid = cookies.find(c => c.name === 'sid');
  expect(sid?.httpOnly).toBe(true);
  await auth.signout();
  // Replay the former cookie to prove server-side invalidation, not merely UI hiding.
  const replay = await page.request.get('/api/me', { headers: { Cookie: `sid=${sid!.value}` } });
  expect(replay.status()).toBe(401);
  await page.goBack();
  await expect(page).toHaveURL('/signin');
  await expect(page.getByRole('heading', { name: 'Your account' })).toHaveCount(0);
  await page.goto('/account'); await expect(page).toHaveURL('/signin');
});

test('AUTH-09 separate browser context has no authenticated session', async ({ browser, auth, user }) => {
  await auth.signup(user); await auth.account(user);
  const isolated = await browser.newContext();
  try {
    const tab = await isolated.newPage(); await tab.goto('http://127.0.0.1:3100/account');
    await expect(tab).toHaveURL('http://127.0.0.1:3100/signin');
  } finally { await isolated.close(); }
});

for (const failure of ['network', 'server'] as const) {
  test(`AUTH-10 ${failure} failure shows recovery and allows retry`, async ({ page, auth, user }) => {
    await auth.signup(user); await auth.account(user); await auth.signout();
    await page.route('**/api/signin', route => failure === 'network' ? route.abort('failed') : route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Unavailable"}' }));
    await auth.signin(user.email, user.password);
    await expect(page.getByRole('alert')).toHaveText(failure === 'network' ? 'Unable to connect. Please try again.' : 'The service is unavailable. Please try again.');
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled();
    await page.unroute('**/api/signin');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await auth.account(user);
  });
}

test('AUTH-11 keyboard submission and layout fit the configured viewport', async ({ page, auth, user }) => {
  await page.goto('/signup');
  await page.getByLabel('Name', { exact: true }).fill(user.name);
  await auth.credentials(user.email, user.password);
  await page.getByLabel('Password', { exact: true }).press('Enter');
  await auth.account(user);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await page.getByRole('button', { name: 'Sign out' }).boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
});

test('AUTH-12 server validation rejects browser-validation bypass', async ({ request, user }) => {
  for (const data of [ { ...user, name: '   ' }, { ...user, email: 'invalid' }, { ...user, password: 'weak' }, { ...user, password: 'x'.repeat(129) }, { ...user, name: 'x'.repeat(81) } ]) {
    const response = await request.post('/api/signup', { data });
    expect(response.status()).toBe(400);
  }
  expect((await request.get('/api/me')).status()).toBe(401);
});
