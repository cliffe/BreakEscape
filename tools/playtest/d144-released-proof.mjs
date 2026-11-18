// D144 live proof (keyless server, standalone page; Hacktivity state forced in the page, no game row edited).
//  1. the released vm-launcher dialog (button in its own row, no underline)
//  2. the Resume overlay on a released game: New Session and Start over hidden, note, Back to missions
//  3. the overlay on a non-released game: unchanged
// Run: node tools/playtest/d144-released-proof.mjs <game_url> <outdir>
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [url, outdir] = process.argv.slice(2);
let bad = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) bad++; };
const browser = await chromium.launch();

async function open(released) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.route('**/break_escape/games/**', async (route) => {
    const r = await route.fetch();
    const ct = r.headers()['content-type'] || '';
    if (!ct.includes('text/html')) return route.fulfill({ response: r });
    let body = (await r.text()).replace('hasProgress: false', 'hasProgress: true');
    if (released) {
      body = body.replace(/vmSetState: '[a-z]*'/, "vmSetState: 'released'")
                 .replace(/shellMenuUrl: [^,\n]*,/, "shellMenuUrl: '/break_escape/missions',");
    }
    await route.fulfill({ response: r, body });
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.game?.loop, null, { timeout: 60000 });
  await page.evaluate(() => { const l = window.game.loop; l.fpsLimit = 20; l.hasFpsLimit = true; window.game.physics?.world?.setFPS?.(20); });
  await page.waitForSelector('#session-resume-overlay', { state: 'visible', timeout: 30000 });
  await page.waitForTimeout(500);
  return page;
}

// 2. released overlay
let page = await open(true);
console.log(await page.evaluate(() => JSON.stringify({ s: window.breakEscapeConfig.vmSetState, m: window.breakEscapeConfig.shellMenuUrl })));
await page.screenshot({ path: `${outdir}/released-overlay.png` });
const vis = (id) => page.evaluate((i) => { const e = document.getElementById(i); return !!e && getComputedStyle(e).display !== 'none'; }, id);
check(!(await vis('session-new-btn')), 'released: New Session hidden');
check(!(await vis('session-restart-btn')), 'released: Start over hidden');
check(await vis('session-resume-btn'), 'released: Resume shown');
check(await vis('session-back-link'), 'released: Back to missions shown');
check(await page.evaluate(() => document.getElementById('session-back-link')?.getAttribute('href')) === `${new URL(url).origin}/break_escape/missions`, 'released: link target same-origin');
check(await vis('session-released-note'), 'released: note shown');

// 1. launcher dialog, released
await page.click('#session-resume-btn');
await page.waitForTimeout(300);
await page.evaluate(() => {
  window.breakEscapeConfig.hacktivityMode = true;
  window.MinigameFramework.startMinigame('vm-launcher', null, { title: 'VM Console Access', vm: { title: 'kali', ip: '10.0.0.5' }, hacktivityMode: true });
});
await page.waitForSelector('.vm-launcher .vm-released', { timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${outdir}/released-launcher.png` });
const geo = await page.evaluate(() => {
  const a = document.querySelector('.vm-released a.vm-action-btn');
  const p = [...document.querySelectorAll('.vm-released p')].pop();
  const ar = a.getBoundingClientRect(), pr = p.getBoundingClientRect(), cs = getComputedStyle(a);
  return { gap: ar.top - pr.bottom, deco: cs.textDecorationLine, radius: cs.borderRadius, font: cs.fontFamily };
});
console.log(JSON.stringify(geo));
check(geo.gap >= 8, `launcher: button clears the text above (gap ${geo.gap}px)`);
check(geo.deco === 'none', 'launcher: no underline');
check(/^0px/.test(geo.radius), 'launcher: no border radius');
await page.close();

// 3. non-released
page = await open(false);
await page.screenshot({ path: `${outdir}/normal-overlay.png` });
check(await vis('session-new-btn') && await vis('session-restart-btn'), 'normal: New Session and Start over still shown');
check(!(await vis('session-back-link')) && !(await vis('session-released-note')), 'normal: no released note or link');
await page.close();
await browser.close();
process.exit(bad ? 1 : 0);
