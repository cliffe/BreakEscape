// Live proof for the Resume overlay's Start over confirm step: danger button under a theme,
// no Keep button, Escape and Enter close the step, focus returns. Headless; writes PNGs.
// Run from the worktree: node tools/playtest/ko-restart-overlay-proof.mjs <game_url> <outdir> [theme ...]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [url, outdir, ...themes] = process.argv.slice(2);
let bad = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) bad++; };
const browser = await chromium.launch();
for (const theme of (themes.length ? themes : ['default'])) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  // A new game has no progress, so the overlay would not show; the stored row is untouched.
  await page.route('**/break_escape/games/**', async (route) => {
    const r = await route.fetch();
    const ct = r.headers()['content-type'] || '';
    if (!ct.includes('text/html')) return route.fulfill({ response: r });
    await route.fulfill({ response: r, body: (await r.text()).replace('hasProgress: false', 'hasProgress: true') });
  });
  const u = new URL(url);
  if (theme !== 'default') u.searchParams.set('ui_theme', theme);
  await page.goto(u.toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.game?.loop, null, { timeout: 60000 });
  await page.evaluate(() => { const l = window.game.loop; l.fpsLimit = 20; l.hasFpsLimit = true; window.game.physics?.world?.setFPS?.(20); });
  await page.waitForSelector('#session-resume-overlay', { state: 'visible', timeout: 30000 });
  await page.waitForTimeout(500);
  const tag = theme;
  await page.screenshot({ path: `${outdir}/${tag}-1-resume-overlay.png` });
  check(await page.$('#session-restart-keep-btn') === null, `${tag}: no Keep button in the DOM`);
  await page.click('#session-restart-btn');
  await page.waitForTimeout(300);
  check(await page.evaluate(() => document.activeElement?.id) === 'session-restart-close-btn', `${tag}: focus on X when the step opens`);
  await page.screenshot({ path: `${outdir}/${tag}-2-confirm-step.png` });
  const st = await page.evaluate(() => {
    const b = document.getElementById('session-restart-confirm-btn'); const c = getComputedStyle(b);
    const r = document.getElementById('session-resume-btn') ; 
    return { color: c.color, border: c.borderTopWidth + ' ' + c.borderTopStyle + ' ' + c.borderTopColor, bg: c.backgroundColor, radius: c.borderRadius, font: c.fontFamily,
      theme: document.documentElement.dataset.uiTheme || document.body.dataset.uiTheme || null };
  });
  console.log(tag, JSON.stringify(st));
  check(/^0px/.test(st.radius), `${tag}: no border radius`);
  check(/2px solid/.test(st.border) && st.border !== (await page.evaluate(() => { const c = getComputedStyle(document.getElementById('session-restart-close-btn')); return c.borderTopWidth + ' ' + c.borderTopStyle + ' ' + c.borderTopColor; })), `${tag}: confirm border is distinct from the X button`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check(await page.evaluate(() => document.getElementById('session-restart-confirm').style.display) === 'none', `${tag}: Escape closes the step`);
  check(await page.evaluate(() => document.activeElement?.id) === 'session-restart-btn', `${tag}: focus back on Start over`);
  check(await page.evaluate(() => document.getElementById('session-resume-overlay').style.display) !== 'none', `${tag}: overlay still up after Escape`);
  await page.keyboard.press('Escape');
  check(await page.evaluate(() => document.getElementById('session-resume-overlay').style.display) !== 'none', `${tag}: Escape on the main row does nothing`);
  await page.click('#session-restart-btn');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  check(await page.evaluate(() => document.getElementById('session-restart-confirm').style.display) === 'none' && await page.evaluate(() => window.breakEscapeSessionOverlayShowing) === true, `${tag}: Enter closes the step, does not resume`);
  await page.screenshot({ path: `${outdir}/${tag}-3-after-enter.png` });
  await page.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
