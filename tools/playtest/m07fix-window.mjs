// m07 gate minors: committing the team with the correction already in hand (projection_revised seeded true) opens the
// redirect window, and Agent HaX texts that the team can still be moved. Needs a FRESH game: the opening briefing fires
// on load and the shared open() helper's dismiss() would close it, so this script loads the page itself.
// usage: node m07fix-window.mjs <gameId> <port> <outDir>
import { createRequire } from 'node:module';
import { EXEC } from './m01-ol-lib.mjs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/node_modules/');
const { chromium } = require('playwright-core');
const [gid, port = '3168', out] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true, executablePath: EXEC, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body, null, { timeout: 90000 });
const ev = (fn, a) => page.evaluate(fn, a);
const t = ms => page.waitForTimeout(ms);
await ev(() => { window.__test.throttleFps(20); });
const log = (k, v) => console.log(k, JSON.stringify(v));
const shot = n => page.screenshot({ path: `${out}/${n}.png` });
const dlg = () => ev(() => window.__test.minigame.getState()?.dialogue || null);
log('globals at load', await ev(() => ({ pr: window.gameState.globalVariables.projection_revised, bp: window.gameState.globalVariables.briefing_played, ta: window.gameState.globalVariables.team_assigned })));
let committed = false;
for (let i = 0; i < 150 && !committed; i++) {
  committed = await ev(() => window.gameState.globalVariables.team_assigned === true);
  if (committed) break;
  const d = await dlg();
  if (i < 6 || i % 10 === 0) log('dlg' + i, d && { ...d, text: (d.text || '').slice(0, 70) });
  if (!d) { await t(1000); continue; }
  if (d.awaitingChoice) {
    const prefs = [/Send them to Fracture/i, /Fracture\. Washington/i, /ready to (make|commit)|made the call|commit/i, /Understood|Talk to me about the other three/i, /walk me through/i];
    const texts = d.choices.map(c => (c && c.text) || String(c));
    log('choices', texts);
    let picked = null;
    for (const re of prefs) { const c = texts.find(x => re.test(x)); if (c) { picked = c; break; } }
    if (!picked) picked = texts[texts.length - 1];
    const idx = texts.indexOf(picked);
    log('pick', picked); await ev(n => window.__test.minigame.chooseIndex(n), idx + 1);
  } else if (d.canContinue) await ev(() => window.__test.minigame.continue());
  await t(700);
}
log('committed', committed);
const t0 = Date.now(), seen = [];
while (Date.now() - t0 < 25000) {
  const g = await ev(() => ({ ta: window.gameState.globalVariables.team_assigned, rfo: window.gameState.globalVariables.revision_found_open }));
  if (!seen.length && g.ta) { log('assigned', g); seen.push(1); }
  const d = await dlg(); if (d && d.canContinue) await ev(() => window.__test.minigame.continue());
  const barks = await ev(() => [...document.querySelectorAll('.npc-bark')].map(e => e.textContent.trim().slice(0, 200)));
  for (const b of barks) if (!seen.includes(b)) { seen.push(b); log('bark@' + Math.round((Date.now() - t0) / 1000) + 's', b); if (/can still be moved/.test(b)) await shot('window1-toast'); }
  await t(500);
}
// open the HaX thread through the phone in the inventory, so the message is seen in the thread and not only as a toast
try {
  await ev(() => document.querySelectorAll('.npc-bark .npc-bark-close, .npc-bark button').forEach(b => b.click()));
  await page.mouse.click(323, 745); await t(2500);
  await page.mouse.click(560, 175); await t(2000);
  const r = await ev(() => ({ mg: window.__test.getState().activeMinigame, text: (document.body.innerText.match(/can still be moved[^\n]*/) || [''])[0].slice(0, 120) }));
  log('thread', r); await shot('window3-thread');
} catch (e) { log('thread-fail', String(e).slice(0, 200)); }
log('rfo', await ev(() => window.gameState.globalVariables.revision_found_open));
await shot('window2-after');
log('errs', errs.filter(e => !/503/.test(e)));
await browser.close();
