import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';

const out = new URL('../recordings/', import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo: { dir: out.pathname.replace(/^\/([A-Za-z]:)/, '$1'), size: { width: 1440, height: 1000 } } });
const page = await context.newPage();
const sections = [
  ['1 / 6 • Architecture', 'A controlled web app and real HTTP server make registration repeatable. Each test gets a unique account and browser context. The happy path uses real requests; only explicit failure tests intercept traffic.', 'README.md', 0, 34],
  ['2 / 6 • Browser and device configuration', 'Five projects cover branded Chrome, Firefox, WebKit and two mobile emulations. Playwright owns the server lifecycle. Failure traces, screenshots, videos and JUnit results support CI diagnosis.', 'playwright.config.ts', 0, 40],
  ['3 / 6 • Fixtures and page object', 'The fixture creates a UUID email per test. The page object centralizes accessible locators and user actions. Assertions check the actual profile, and automatic waiting replaces sleeps.', 'tests/fixtures.ts', 0, 42],
  ['4 / 6 • Proving new-user registration', 'AUTH-01 submits the signup form, requires HTTP 201 and checks the protected profile. It then signs out and signs in with the same credentials, proving that a registered account exists.', 'tests/auth.spec.ts', 0, 32],
  ['5 / 6 • Negative scenarios and session invalidation', 'Wrong credentials and duplicates are rejected. Logout tests replay the old cookie to check server-side invalidation. Fault injection verifies a visible error and successful recovery after retry.', 'tests/auth.spec.ts', 83, 122],
  ['6 / 6 • CI and practical limits', 'Pull requests run type checking and the full matrix. Artifacts upload even on failure. Configure the check as a merge gate. Mobile profiles are emulation; this demo does not implement email verification, MFA or production persistence.', '.github/workflows/e2e.yml', 0, 40],
];
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
for (const [title, explanation, file, start, end] of sections) {
  const source = (await readFile(new URL(`../${file}`, import.meta.url), 'utf8')).split('\n').slice(start, end).map((line, i) => `${String(start + i + 1).padStart(3)}  ${line}`).join('\n');
  await page.setContent(`<html><body style="margin:0;background:#102235;color:#e8f0f6;font:22px/1.5 system-ui;padding:35px"><p style="color:#72d6ba;font-size:16px">MEMBERSPACE / CODE WALKTHROUGH / CAPTIONED, NO AUDIO</p><h1 style="font-size:32px">${escape(title)}</h1><p>${escape(explanation)}</p><div style="background:#19334d;padding:14px;border-radius:12px"><b style="color:#72d6ba">${file}</b><pre style="font:15px/1.5 Consolas,monospace;white-space:pre-wrap;margin:12px 0">${escape(source)}</pre></div></body></html>`);
  // Deliberate viewing time for the recording, not a synchronization strategy in tests.
  await new Promise(resolve => setTimeout(resolve, 12_000));
}
const video = page.video();
await context.close();
await video.saveAs(new URL('code-walkthrough.webm', out).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
await video.delete();
console.log('Saved recordings/code-walkthrough.webm');
await browser.close();
