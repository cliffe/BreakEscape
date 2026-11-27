import { createRequire } from 'node:module';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/node_modules/');
const { chromium } = require('playwright-core');
const EXEC = '/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const gid = process.argv[2];
const browser = await chromium.launch({ headless: true, executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0,200)));
await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
await page.goto(`http://127.0.0.1:3007/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body, null, { timeout: 90000 });
const t = ms => page.waitForTimeout(ms);
await t(2000);
for (let i = 0; i < 6; i++) {
  const busy = await page.evaluate(() => { const st = window.__test.getState(); return !!(st.activeMinigame || st.blockingUi); });
  if (!busy) break;
  await page.keyboard.press('Enter'); await t(400); await page.keyboard.press('Escape'); await t(400);
}
console.log('throttle', JSON.stringify(await page.evaluate(() => window.__test.throttleFps(20))));
await page.evaluate(() => {
  window.__ev = [];
  const ed = window.eventDispatcher, orig = ed.emit.bind(ed);
  ed.emit = (ev, data) => { try { if (/^(npc_use_failed|npc_arrived|npc_sat|npc_returned_post|global_variable_changed:kit_e1_(out|note_up|note_choice|walk|agn_there))/.test(ev)) window.__ev.push({ ms: Math.round(performance.now()-window.__t0), clk: window.npcNeedsSystem.clockMs, ev, data: JSON.stringify(data||{}).slice(0,200) }); } catch(e){} return orig(ev, data); };
  window.__t0 = performance.now();
});
const pos = () => page.evaluate(() => { const b = window.npcBehaviorManager.getBehavior('kit_priya_nair'); const s = b && b.sprite; const st = window.npcNeedsSystem.getState('kit_priya_nair'); return { x: s && +s.x.toFixed(1), y: s && +s.y.toFixed(1), mode: st && st.mode, work: st && st.levels && st.levels.work, seated: !!(window.seatingSystem && window.seatingSystem.isSeated && window.seatingSystem.isSeated('kit_priya_nair')) }; }).catch(e => String(e));
console.log('before', JSON.stringify(await pos()), 'out=', await page.evaluate(() => window.gameState.globalVariables.kit_e1_out));
const tick0 = await page.evaluate(() => window.npcNeedsSystem.tickCount);
await page.evaluate(() => { window.__t0 = performance.now(); window.stateSync.writeGlobal('kit_e1_out', true); });
const samples = [];
for (let i = 0; i < 14; i++) { await t(500); samples.push({ at: (i+1)*0.5, ...(await pos()), note_up: await page.evaluate(() => window.gameState.globalVariables.kit_e1_note_up) }); }
for (const s of samples) console.log(JSON.stringify(s));
console.log('EVENTS'); for (const e of await page.evaluate(() => window.__ev)) console.log(JSON.stringify(e));
console.log('LOG');
for (const e of await page.evaluate((t0) => window.__test.needs.log(t0).filter(e => /kit_priya/.test(e.npc||e.npcId||'') ), tick0)) console.log(JSON.stringify(e).slice(0,260));
const fired = await page.evaluate(() => { const o = {}; for (const [k,v] of window.npcManager.triggeredEvents) if (/kit_priya/.test(k) && /note_up|use_failed/.test(k)) o[k] = v.count; return o; });
console.log('FIRED', JSON.stringify(fired), 'errs', JSON.stringify(errs));
await browser.close();
