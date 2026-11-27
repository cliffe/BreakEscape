// Live proof for the CA loading screen (D350). Usage: node tools/playtest/ca-loading-proof.mjs <gameId> <port> <outPrefix> [WxH]
// Opens the game headless, takes screenshots while the title screen shows, and reports which style it drew.
import { createRequire } from 'node:module';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const [gid, port, out, size = '1280x720'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const browser = await chromium.launch({ headless: true, executablePath: EXEC, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: w, height: h } });
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}`, { waitUntil: 'domcontentloaded' });
const probe = () => page.evaluate(() => {
  const c = document.querySelector('.title-screen-container');
  const q = (s) => document.querySelector(s);
  return { present: !!c, ca: !!q('.ca-ts'), caCssLinked: !!document.getElementById('title-screen-ca-css'),
    title: (q('.ca-ts-title') || q('.title-screen-typed-text'))?.textContent ?? null, company: q('.ca-ts-company')?.textContent ?? null,
    status: q('.ca-ts-status')?.textContent ?? null, lit: document.querySelectorAll('.ca-ts-sbar-l s.on').length,
    logo: !!q('.title-screen-logo'), font: q('.ca-ts-title') ? getComputedStyle(q('.ca-ts-title')).fontFamily : null,
    radius: q('.ca-ts-tab') ? getComputedStyle(q('.ca-ts-tab')).borderRadius : null };
});
for (const [name, ms] of [['a_early', 600], ['b_mid', 1500], ['c_ready', 4000]]) {
  await page.waitForTimeout(ms - (name === 'a_early' ? 0 : name === 'b_mid' ? 600 : 1500));
  console.log(name, JSON.stringify(await probe()));
  await page.screenshot({ path: `${out}_${name}.png` });
}
console.log('errs', errs.slice(0, 4));
await browser.close();
