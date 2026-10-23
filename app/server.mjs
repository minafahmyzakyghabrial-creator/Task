import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Deliberately ephemeral demo storage: survives logout/reload, resets on server restart.
const accounts = new Map();
const sessions = new Map();
const origin = 'http://127.0.0.1:3100';
const html = await readFile(new URL('./index.html', import.meta.url));
const publicUser = ({ name, email }) => ({ name, email });
const json = (res, status, data, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(data));
};
const sessionId = req => /(?:^|;\s*)sid=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
const userFor = req => accounts.get(sessions.get(sessionId(req)));
const cookie = value => `sid=${value}; HttpOnly; SameSite=Strict; Path=/`;

http.createServer(async (req, res) => {
  const path = new URL(req.url, origin).pathname;
  if (req.method === 'GET' && path === '/api/health') return json(res, 200, { ok: true });
  if (req.method === 'GET' && path === '/api/me') {
    const user = userFor(req);
    return json(res, user ? 200 : 401, user ? publicUser(user) : { error: 'Please sign in.' });
  }
  if (req.method === 'GET' && ['/','/signup','/signin','/account'].includes(path)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(html);
  }
  if (req.method !== 'POST' || !['/api/signup','/api/signin','/api/signout'].includes(path)) {
    return json(res, 404, { error: 'Not found.' });
  }
  if (req.headers.origin && req.headers.origin !== origin) return json(res, 403, { error: 'Invalid origin.' });
  try {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 16_384) return json(res, 413, { error: 'Request too large.' });
    }
    if (path === '/api/signout') {
      sessions.delete(sessionId(req));
      return json(res, 200, { ok: true }, { 'Set-Cookie': `${cookie('')}; Max-Age=0` });
    }
    let body;
    try { body = JSON.parse(raw); } catch { return json(res, 400, { error: 'Invalid JSON.' }); }
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !password || password.length > 128) {
      return json(res, 400, { error: 'Enter a valid email and password (maximum 128 characters).' });
    }
    if (path === '/api/signup') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name || name.length > 80 || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return json(res, 400, { error: 'Use a name up to 80 characters and a password of 8–128 characters with a letter and a number.' });
      }
      if (accounts.has(email)) return json(res, 409, { error: 'An account with this email already exists.' });
      const salt = randomBytes(16).toString('hex');
      accounts.set(email, { name, email, salt, hash: scryptSync(password, salt, 64) });
    } else {
      const user = accounts.get(email);
      const hash = scryptSync(password, user?.salt || 'unknown-account', 64);
      if (!user || !timingSafeEqual(hash, user.hash)) return json(res, 401, { error: 'Email or password is incorrect.' });
    }
    sessions.delete(sessionId(req));
    const id = randomBytes(32).toString('hex');
    sessions.set(id, email);
    return json(res, path === '/api/signup' ? 201 : 200, publicUser(accounts.get(email)), { 'Set-Cookie': cookie(id) });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) json(res, 500, { error: 'Something went wrong.' });
  }
}).listen(3100, '127.0.0.1', () => console.log(`Demo running at ${origin}`));
