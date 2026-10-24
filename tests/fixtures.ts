import { test as base, expect, type Page, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export type User = { name: string; email: string; password: string };

// Ads and consent overlays on the practice site cover buttons and cause flaky clicks.
const ADS = /googlesyndication|doubleclick|googleads|adservice|fundingchoices|googletagservices|google-analytics|googletagmanager/;

export class AuthPage {
  constructor(readonly page: Page) {}
  async signup(user: User) {
    await this.page.goto('/login');
    await this.page.locator('[data-qa=signup-name]').fill(user.name);
    await this.page.locator('[data-qa=signup-email]').fill(user.email);
    await this.page.locator('[data-qa=signup-button]').click();
  }
  async completeSignup(user: User) {
    await expect(this.page).toHaveURL('/signup');
    await this.page.locator('#id_gender1').check();
    await this.page.locator('[data-qa=password]').fill(user.password);
    for (const [field, value] of Object.entries({ first_name: 'Mina', last_name: 'Tester', address: '1 Test Street', state: 'Ontario', city: 'Toronto', zipcode: 'M5V 2T6', mobile_number: '4165550100' })) {
      await this.page.locator(`[data-qa=${field}]`).fill(value);
    }
    await this.page.locator('[data-qa=country]').selectOption('Canada');
    await this.page.locator('[data-qa=create-account]').click();
    await expect(this.page.locator('[data-qa=account-created]')).toHaveText('Account Created!', { ignoreCase: true });
    await this.page.locator('[data-qa=continue-button]').click();
  }
  async signin(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.locator('[data-qa=login-email]').fill(email);
    await this.page.locator('[data-qa=login-password]').fill(password);
    await this.page.locator('[data-qa=login-button]').click();
  }
  async account(user: User) {
    await expect(this.page.getByText(`Logged in as ${user.name}`)).toBeVisible();
    await expect(this.page.getByRole('link', { name: 'Logout' })).toBeVisible();
  }
  async signedOut(page = this.page) {
    await expect(page.getByRole('link', { name: 'Signup / Login' })).toBeVisible();
    await expect(page.getByText('Logged in as')).toHaveCount(0);
  }
  async signout() {
    await this.page.getByRole('link', { name: 'Logout' }).click();
    await expect(this.page).toHaveURL('/login');
    await this.signedOut();
  }
  loginError() { return this.page.locator('.login-form p'); }
  signupError() { return this.page.locator('.signup-form p'); }
}

/** Creates an account through the public API so tests that only need an existing user stay fast. */
export async function createAccount(request: APIRequestContext, user: User) {
  expect(await postAccount(request, user)).toMatchObject({ responseCode: 201 });
}

/** Posts to the public createAccount API and returns its JSON body without asserting the outcome. */
export async function postAccount(request: APIRequestContext, user: User) {
  const response = await request.post('/api/createAccount', {
    form: {
      name: user.name, email: user.email, password: user.password, title: 'Mr', birth_date: '1', birth_month: '1', birth_year: '1990',
      firstname: 'Mina', lastname: 'Tester', company: '', address1: '1 Test Street', address2: '', country: 'Canada',
      zipcode: 'M5V 2T6', state: 'Ontario', city: 'Toronto', mobile_number: '4165550100',
    },
  });
  return response.json();
}

export const test = base.extend<{ user: User; auth: AuthPage }>({
  context: async ({ context }, use) => {
    await context.route(ADS, route => route.abort());
    await use(context);
  },
  user: async ({ playwright, baseURL }, use) => {
    const user = { name: 'Mina Tester', email: `pw-${randomUUID()}@example.test`, password: 'DemoPass123!' };
    await use(user);
    // Remove the account (if one was created) so the shared practice site is not littered with test users.
    const api = await playwright.request.newContext({ baseURL });
    await api.delete('/api/deleteAccount', { form: { email: user.email, password: user.password } });
    await api.dispose();
  },
  auth: async ({ page }, use) => use(new AuthPage(page)),
});
export { expect };
