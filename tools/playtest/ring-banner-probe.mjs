// Live probe for the incoming-call banner over an open minigame (UI backlog 5d, review R1 M1/m1/m2).
// Opens a scene, rings a call, and MEASURES boxes: which spot the banner took, and whether it
// overlaps any control (button, input, key, PIN display, anything with a pointer cursor), title or X
// in the scene, or a toast. Also raises a warning toast with no banner and notes whether it covers a
// title (main's behaviour). Exit 1 if the banner overlaps a control, title or toast.
//   node tools/playtest/ring-banner-probe.mjs --port 3470 --game 4258 --size 915x412 [--scene pin|ehr-terminal]
//        [--out dir]   (shots: <out>/<scene>-{noring,ring,ring-warn,warn}-<size>.png)
// Needs a keyless server and a fresh game (tools/playtest/new-game.rb). Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '3470');
const game = arg('game');
const [w, h] = arg('size', '915x412').split('x').map(Number);
const scene = arg('scene', 'pin');
const out = arg('out', '.');
if (!game) { console.error('--game <id> is required'); process.exit(2); }
mkdirSync(out, { recursive: true });
const tag = `${scene}-${w}x${h}`;

const b = await chromium.launch({ headless: true, ignoreDefaultArgs: ['--hide-scrollbars'], executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
const p = await b.newPage({ viewport: { width: w, height: h } });
await p.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch {} });
await p.goto(`http://127.0.0.1:${port}/break_escape/games/${game}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 60; i++) {
  if (await p.evaluate(() => !!window.__test).catch(() => false)) break;
  const pick = await p.$('[data-character="female_hacker_hood_v2"], [data-key="female_hacker_hood_v2"], [data-sprite="female_hacker_hood_v2"]');
  if (pick) { await pick.click().catch(() => {}); const go = await p.$('button:has-text("Start"), button:has-text("Confirm"), button:has-text("Play")'); if (go) await go.click().catch(() => {}); }
  await p.waitForTimeout(1000);
}
await p.waitForFunction(() => !!window.__test, null, { timeout: 240000 });
await p.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
await p.waitForTimeout(2000);
await p.evaluate(() => { try { window.game?.physics?.world?.setFPS?.(20); } catch {} });

// Measured in the page, independently of hud-lanes.js: every shown control, title and toast box
const boxes = () => p.evaluate(() => {
  const R = (e) => { const r = e.getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom) }; };
  const shown = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const mg = [...document.querySelectorAll('.minigame-container')].filter(shown);
  const area = innerWidth * innerHeight;
  const controls = []; const titles = [];
  for (const m of mg) {
    m.querySelectorAll('.console-titlebar, .minigame-header, [class*="minigame-title"], .minigame-close-button').forEach(e => { if (shown(e)) titles.push({ name: (e.className || e.tagName).toString().slice(0, 40), ...R(e) }); });
    m.querySelectorAll('*').forEach(e => {
      if (!shown(e) || e.closest('#phone-ring-layer')) return;
      const isCtl = e.matches('button, input, textarea, select, a[href], [role="button"], [onclick], [tabindex]:not([tabindex="-1"]), .pin-minigame-display') || getComputedStyle(e).cursor === 'pointer';
      const r = e.getBoundingClientRect();
      if (isCtl && r.width * r.height <= area / 2) controls.push({ name: (e.className || e.tagName).toString().slice(0, 40), text: (e.textContent || '').trim().slice(0, 12), ...R(e) });
    });
  }
  const ban = document.querySelector('#phone-ring-layer .incoming-call');
  const toasts = [...document.querySelectorAll('#notification-container .notification')].filter(shown).map(R);
  return { titles, controls, banner: ban && shown(ban) ? R(ban) : null, toasts, spot: window.__hudLanes?.ringSpot?.name || null, vw: innerWidth, vh: innerHeight };
});
const hit = (a, c) => a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
const report = { size: `${w}x${h}`, scene, failures: [] };

await p.evaluate((sc) => window.MinigameFramework.startMinigame(sc, null, sc === 'pin'
  ? { title: "Enter PIN: Director's Safe", correctPin: '1234', pinLength: 4, maxAttempts: 3 } : { title: sc }), scene);
await p.waitForTimeout(900);
await p.screenshot({ path: `${out}/${tag}-noring.png` });

// 1. ring over the open scene
await p.evaluate(() => window.phoneRinger.offer({ npcId: 'agent_0x99', knot: 'ring_probe', ring: true, conversationMode: 'phone-chat' }));
await p.waitForTimeout(1200);
let m = await boxes();
report.spot = m.spot; report.banner = m.banner;
report.controlsMeasured = m.controls.length; report.titlesMeasured = m.titles.length;
if (!m.banner) report.failures.push('no banner shown');
else {
  report.overlapControls = m.controls.filter(c => hit(m.banner, c));
  report.overlapTitles = m.titles.filter(c => hit(m.banner, c));
  report.inViewport = m.banner.left >= 0 && m.banner.top >= 0 && m.banner.right <= m.vw && m.banner.bottom <= m.vh;
  if (m.spot !== 'default') {
    if (report.overlapControls.length) report.failures.push(`banner (${m.spot}) overlaps ${report.overlapControls.length} control(s)`);
    if (report.overlapTitles.length) report.failures.push(`banner (${m.spot}) overlaps a title or the X`);
  } else report.note = 'no clear spot: top centre fallback (a title may be covered)';
  if (!report.inViewport) report.failures.push('banner leaves the viewport');
}
await p.screenshot({ path: `${out}/${tag}-ring.png` });

// 2. a warning toast with the banner up: banner and toast must not meet
await p.evaluate(() => window.showNotification('That PIN is not right. Two tries left before the safe locks out.', 'warning', 'Wrong PIN', 8000));
await p.waitForTimeout(1000);
m = await boxes();
report.bannerAfterWarnSpot = m.spot;
report.toastVsBanner = m.banner ? m.toasts.filter(t => hit(m.banner, t)).length : null;
if (report.toastVsBanner && m.spot !== 'default') report.failures.push('banner overlaps a toast');
else if (report.toastVsBanner) report.note2 = 'no clear spot: top centre fallback overlaps the toast';
await p.screenshot({ path: `${out}/${tag}-ring-warn.png` });

// 3. the warning with no banner: the lane starts below the titles
await p.evaluate(() => { document.querySelectorAll('#phone-ring-layer .incoming-call-decline').forEach(x => x.click()); });
await p.waitForTimeout(900);
m = await boxes();
report.warnToasts = m.toasts;
report.warnOverTitle = m.titles.filter(t => m.toasts.some(x => hit(x, t))).map(t => t.name);
report.warnOverControls = m.controls.filter(c => m.toasts.some(x => hit(x, c))).length;
if (!m.toasts.length) report.failures.push('warning toast not shown');
if (report.warnOverTitle.length) report.note3 = 'warning toast covers a title (main behaviour; see IDEAS_BACKLOG 2026-11-14)';
await p.screenshot({ path: `${out}/${tag}-warn.png` });

console.log(JSON.stringify(report));
await b.close();
process.exit(report.failures.length ? 1 : 0);
