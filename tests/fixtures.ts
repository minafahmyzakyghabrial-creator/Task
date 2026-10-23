import { test as base, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export type User = { name: string; email: string; password: string };
export class AuthPage {
  constructor(readonly page: Page) {}
  async signup(user: User) {
    await this.page.goto('/signup');
    await this.page.getByLabel('Name', { exact: true }).fill(user.name);
    await this.credentials(user.email, user.password);
    await this.page.getByRole('button', { name: 'Create account' }).click();
  }
  async credentials(email: string, password: string) {
    await this.page.getByLabel('Email', { exact: true }).fill(email);
    await this.page.getByLabel('Password', { exact: true }).fill(password);
  }
  async signin(email: string, password: string) {
    await this.page.goto('/signin');
    await this.credentials(email, password);
    await this.page.getByRole('button', { name: 'Sign in', exact: true }).click();
  }
  async account(user: User) {
    await expect(this.page).toHaveURL('/account');
    await expect(this.page.getByRole('heading', { name: 'Your account' })).toBeVisible();
    await expect(this.page.locator('#name')).toHaveText(user.name.trim());
    await expect(this.page.locator('#email')).toHaveText(user.email.trim().toLowerCase());
  }
  async signout() {
    await this.page.getByRole('button', { name: 'Sign out' }).click();
    await expect(this.page).toHaveURL('/signin');
  }
}
export const test = base.extend<{ user: User; auth: AuthPage }>({
  user: async ({}, use) => use({ name: 'Mina Tester', email: `test-${randomUUID()}@example.test`, password: 'DemoPass123!' }),
  auth: async ({ page }, use) => use(new AuthPage(page)),
});
export { expect };
