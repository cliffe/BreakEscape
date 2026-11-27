// Live proof for the m03 R1 fixes: the receptionist's badge cloned with Darkside through to the save (STEP=clone),
// and the Ffion "Lean in" route to the save (STEP=ffion). Headless, setFPS(20) after each load.
//   SHOT_DIR=<dir> STEP=clone|ffion node tools/playtest/m03-r1-fix-proof.mjs <gameId> <port>
// Drive only a game id new-game.rb printed in this run.
import { createRequire } from 'node:module';
const REPO_ROOT = new URL('../../', import.meta.url).pathname;
const require = createRequire(`${REPO_ROOT}node_modules/`);
const { chromium } = require('playwright-core');
const EXEC = process.env.CHROMIUM || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`;
const [gid, port = '3109'] = process.argv.slice(2);
const STEP = process.env.STEP || 'clone';
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
const t = ms => page.waitForTimeout(ms);
const shot = n => page.screenshot({ path: `${process.env.SHOT_DIR}/${n}.png` });
const out = { gid, STEP, errs, log: [] };
const T = (...a) => out.log.push(a.join(' '));
async function load() {
  await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.gameScenario && window.__test && window.player && window.player.body && window.eventDispatcher && window.game && window.game.sys, null, { timeout: 90000 });
  // frame rate set by eval after each reload; fixed steps stay ON
  await page.evaluate(() => { const loop = window.game.sys.game.loop, raf = loop.raf; if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); } loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20); });
  await t(2500);
}
const dismissTitle = async () => { await page.evaluate(() => { const m = window.MinigameFramework?.currentMinigame; if (m && /title/i.test(m.constructor?.name || '')) window.MinigameFramework.endMinigame(true); }); await t(800); };
const dlg = () => page.evaluate(() => { const s = window.__test.minigame.getState(); return s && { m: s.id || s.type || s.name, d: s.dialogue && { text: String(s.dialogue.text || s.dialogue.lines || '').slice(0, 200), choices: (s.dialogue.choices || []).map(c => c.text) } }; });
const gv = n => page.evaluate(k => window.gameState.globalVariables[k], n);
const task = id => page.evaluate(i => { for (const a of window.objectivesManager.aims) for (const k of a.tasks) if (k.taskId === i) return k.status; return 'none'; }, id);
await load();
// Drive the open person-chat: prefer the first matching pattern, else continue, until it closes or maxSteps.
async function drive(prefs, maxSteps = 60, stopWhen = null) {
  for (let i = 0; i < maxSteps; i++) {
    if (stopWhen && await stopWhen()) return true;
    const s = await page.evaluate(() => { const g = window.__test.minigame.getState(); return g && { type: g.id || g.type || g.name, choices: (g.dialogue?.choices || []).map(c => c.text), text: g.dialogue?.text }; });
    if (!s || !s.type || !/chat/.test(String(s.type))) return false;
    if (s.choices && s.choices.length) {
      const hit = prefs.find(p => s.choices.some(c => new RegExp(p, 'i').test(c)));
      T('choices:', JSON.stringify(s.choices), '->', hit);
      if (!hit) return 'nochoice:' + JSON.stringify(s.choices);
      await page.evaluate(p => window.__test.minigame.choose(p), hit);
    } else {
      await page.evaluate(() => window.__test.minigame.continue_());
    }
    await t(500);
  }
  return 'maxsteps';
}
if (STEP === 'clone') {
  // briefing: ask how to clone, then leave through to the mission
  out.briefing = await drive(['How do I clone', 'Skip the background', "That's everything", 'Understood', 'flexible', '.'], 120);
  out.cloner_explained = await gv('cloner_explained');
  out.phase = await gv('mission_phase');
  await page.evaluate(() => { try { window.MinigameFramework?.endMinigame?.(true); } catch (e) {} });
  await t(1500);
  out.room = await page.evaluate(() => window.currentPlayerRoom || window.player?.currentRoom);
  out.pos = await page.evaluate(() => [window.player.x, window.player.y]);
  out.state = await dlg();
  await shot('after-briefing');
}
if (STEP === 'ffion') {
  await dismissTitle();
  out.cloner_explained = await gv('cloner_explained');
  out.interact = await page.evaluate(() => window.__test.interact('ffion_rees').then(r => JSON.stringify(r).slice(0, 200)));
  await t(1500);
  out.talk = await drive(['Lean in', 'Where do I sign', 'Freelance', 'thanks|sign'], 40, async () => /rfid|flipper|clone/i.test(String((await page.evaluate(() => window.__test.minigame.which?.()))?.id || '')));
  out.which = await page.evaluate(() => window.__test.minigame.which?.());
  await t(3000);
  const ctl = () => page.evaluate(() => { const g = window.__test.minigame.getState(); return { id: g.id, ctl: (g.controls || []).map(c => c.label || c.text || JSON.stringify(c)).slice(0, 12), text: String(g.text || '').slice(0, 160) }; });
  const clickLabel = (re) => page.evaluate(r => { const mg = window.MinigameFramework.currentMinigame; const b = [...mg.container.querySelectorAll('button, .clickable, [role=button]')].filter(e => e.offsetParent !== null).find(e => new RegExp(r, 'i').test(e.innerText)); if (b) { b.click(); return b.innerText.trim(); } return null; }, re);
  out.rfid = [];
  await shot('ffion-rfid-0');
  const seq = (process.env.SEQ || 'Crack keys|Read|Info').split(',');
  for (let i = 0; i < 40; i++) {
    const c = await ctl(); out.rfid.push(c);
    if (c.id !== 'rfid') break;
    let clicked = null;
    for (const re of ['Darkside', 'Save', 'Continue|Next|OK']) { clicked = await clickLabel(re); if (clicked) break; }
    if (!clicked) clicked = await clickLabel('Crack|Read|Clone|Start|Begin|Proceed');
    out.rfid.push('clicked: ' + clicked);
    if (/Darkside/i.test(clicked || '')) { await t(1500); await shot('rfid-darkside-running'); await t(14000); }
    await t(2500);
    if (/Save/i.test(clicked || '')) { await shot('rfid-saved'); }
  }
  out.afterRfid = { which: await page.evaluate(() => window.__test.minigame.which?.()), task: await task('clone_reception_badge'), cloned: await gv('reception_badge_cloned') };
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
