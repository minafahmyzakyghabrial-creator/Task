import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const out = new URL('../recordings/', import.meta.url);
await mkdir(out, { recursive: true });
const sections = [
  ['1 / 8 - What this framework proves', 'Real users register, sign out, sign back in and end their session. AUTH-01 proves the new account is persisted by using the same credentials after logout. The suite contains 16 browser scenarios per project.', 'tests/auth.spec.ts', 0, 13],
  ['2 / 8 - Browser and mobile coverage', 'Branded Google Chrome, Firefox and WebKit cover desktop browsers. Pixel 7 and iPhone 13 emulate mobile devices. CI runs headless; local runs show the browser. Retries and reports help diagnose failures.', 'playwright.config.ts', 0, 30],
  ['3 / 8 - Page object and registration', 'AuthPage centralizes user actions. Stable data-qa selectors and Playwright auto-waiting avoid timing sleeps. Registration fills the full account form and checks the Account Created confirmation.', 'tests/fixtures.ts', 8, 31],
  ['4 / 8 - Login and logout assertions', 'Login submits real credentials. The account check verifies the displayed user and Logout link. Logout checks the login URL and signed-out navigation, so clicking the button alone cannot pass.', 'tests/fixtures.ts', 32, 56],
  ['5 / 8 - Isolated users and cleanup', 'Each test receives a UUID email and a fresh browser context. Existing-user scenarios use API setup to stay focused. The fixture deletes the synthetic account after the test; ads are blocked to prevent covered controls.', 'tests/fixtures.ts', 75, 100],
  ['6 / 8 - Negative scenarios', 'Duplicate signup and unknown or incorrect login credentials must show an error without authenticating. Further cases cover required fields, malformed email, reload persistence and password case sensitivity.', 'tests/auth.spec.ts', 14, 32],
  ['7 / 8 - Failures and recovery', 'Login requests are deliberately aborted or answered with HTTP 503. The test checks that no authenticated user appears, removes the injected failure, and verifies a successful retry. Other tests replay an expired logout cookie and check context isolation.', 'tests/auth.spec.ts', 111, 123],
  ['8 / 8 - CI and submission evidence', 'GitHub Actions installs browsers, type-checks and runs the matrix on pull requests, main pushes and a nightly schedule. Artifacts upload even on failure. Require the job before merging; gate deployment promotion after staging tests. Submit the repository and both videos.', '.github/workflows/e2e.yml', 0, 34],
];
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: fileURLToPath(out), size: { width: 1920, height: 1080 } } });
  const page = await context.newPage();
  for (const [title, explanation, file, start, end] of sections) {
    const source = (await readFile(new URL(`../${file}`, import.meta.url), 'utf8')).split('\n').slice(start, end).map((line, i) => `${String(start + i + 1).padStart(3)}  ${line}`).join('\n');
    await page.setContent(`<html><body style="box-sizing:border-box;margin:0;background:#102235;color:#e8f0f6;font:25px/1.5 system-ui;padding:32px 48px"><div style="color:#72d6ba;font-size:18px">AUTHENTICATION E2E / CODE WALKTHROUGH / CAPTIONED, NO AUDIO</div><h1 style="font-size:36px;margin:14px 0">${escape(title)}</h1><p style="max-width:1780px;margin:0 0 22px">${escape(explanation)}</p><div style="background:#19334d;padding:18px 24px;border-radius:12px"><b style="color:#72d6ba;font-size:20px">${file}</b><pre style="font:18px/1.18 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;margin:12px 0 0">${escape(source)}</pre></div></body></html>`);
    const fits = await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight);
    if (!fits) throw new Error(`Source does not fit the recording: ${file}`);
    if (title.startsWith('3 /')) await page.screenshot({ path: fileURLToPath(new URL('walkthrough-preview.png', out)) });
    // Viewing time for captions; not test synchronization.
    await new Promise(resolve => setTimeout(resolve, 16_000));
  }
  const video = page.video();
  await context.close();
  await video.saveAs(fileURLToPath(new URL('code-walkthrough.webm', out)));
  await video.delete();
  console.log('Saved recordings/code-walkthrough.webm (8 chapters, approximately 128 seconds)');
} finally { await browser.close(); }
