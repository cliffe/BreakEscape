// S5 full run for office_life_showcase: spawn to recap, following Ama's hints in order, timed.
// usage: PORT=3092 node tools/playtest/showcase-s5-run.mjs <gameId>
// No needs nudges unless a step waits more than NUDGE_S (180) real seconds; every nudge is logged as NUDGE.
// Aborts only POST /tts (URL predicate), never a glob.
import fs from 'node:fs';
import { start, ev, dlg, waitAtPost, NPCS, OUT, near, toKitchen, toOffice, nearNpc, closeChat, waitFor } from './showcase-s4-lib.mjs';

const gid = process.argv[2];
const NUDGE_S = 180;
const TASKS = ['see_queue', 'hear_queue_chat', 'see_coffee_off', 'hear_cooler_exchange', 'use_open_screen', 'see_caught', 'see_cake_eaten', 'see_who_stays'];
const GLOBALS = ['kitchen_seen', 'office_coffee_off', 'act_midday', 'act_evening', 'chidi_pc_owner_away', 'jun_pc_owner_away', 'heard_exchange_cooler_chat'];
const shot = (h, n) => h.page.screenshot({ path: `${OUT}/s5-${n}.png` });
const T0 = Date.now();
const wall = () => +((Date.now() - T0) / 1000).toFixed(1);
const R = { gid, steps: [], nudges: [], taskTimes: {} };
let h;
const clock = () => ev(h, () => +(window.npcNeedsSystem.clockMs / 1000).toFixed(1));
const log = async (m) => { const c = await clock().catch(() => '?'); const line = `[wall ${wall()} needs ${c}] ${m}`; console.log(line); R.steps.push(line); };
const taskStatus = () => ev(h, ts => Object.fromEntries(ts.map(t => [t, window.objectivesManager.getTask(t)?.status])), TASKS);
const noteTasks = async () => {
  const s = await taskStatus();
  for (const [t, v] of Object.entries(s)) if (v === 'completed' && !R.taskTimes[t]) R.taskTimes[t] = { wall: wall(), needs: await clock() };
  return s;
};
// Wait for fn() in the page; on NUDGE_S real seconds, run the nudge (logged) and keep waiting up to 2 x NUDGE_S more.
async function wait(label, fn, arg, nudge) {
  const t0 = Date.now();
  let nudged = false;
  for (;;) {
    if (await ev(h, fn, arg)) { await noteTasks(); await log(`${label}: done after ${((Date.now() - t0) / 1000).toFixed(0)}s`); return true; }
    const el = (Date.now() - t0) / 1000;
    if (el > NUDGE_S && !nudged && nudge) { nudged = true; R.nudges.push(label); await log(`NUDGE at ${label}`); await nudge(); }
    if (el > NUDGE_S * (nudge ? 3 : 1.5)) { await log(`${label}: TIMEOUT after ${el.toFixed(0)}s`); return false; }
    await noteTasks();
    await h.t(500);
  }
}
const waitTask = (t, nudge) => wait(`task ${t}`, t => window.objectivesManager.getTask(t)?.status === 'completed', t, nudge);

// Ama: open, pick one or more hub choices in the same conversation, return the lines heard.
async function ama(picks, { keepOpen = false } = {}) {
  await nearNpc(h, 'ama_owusu');
  const r = await ev(h, () => window.__test.interact('ama_owusu'));
  await h.t(1500);
  const lines = []; let pi = 0, refused = false;
  const body = d => (d.text || '').split('\n').filter(x => x.trim() && !/^(×|Skip)/.test(x.trim()));
  for (let i = 0; i < 80; i++) {
    const d = await dlg(h);
    if (!d.active) break;
    const last = body(d).slice(-1)[0] || ''; if (last && !lines.includes(last)) lines.push(last);
    if (d.controls.some(c => /^\d\./.test(c))) {
      if (pi >= picks.length) { if (!keepOpen) break; break; }
      const p = await ev(h, p => window.__test.minigame.chooseMatching(p), picks[pi]);
      if (!p?.ok) { lines.push('NO CHOICE ' + picks[pi]); refused = true; break; }
      pi++; await h.t(900); continue;
    }
    await h.page.keyboard.press('Space'); await h.t(900);
  }
  return { opened: r?.ok, lines, picked: pi, refused };
}

h = await start(gid);
await log('page loaded');
for (const id of NPCS) await waitAtPost(h, id, 60000);
// recorders (read only)
await ev(h, ({ tasks, globals }) => {
  const sys = window.npcNeedsSystem, L = window.__rec = [];
  const clk = () => +(sys.clockMs / 1000).toFixed(1);
  const add = (k, o) => L.push({ c: clk(), k, ...o });
  const bs = window.barkSystem, ob = bs.showBark; bs.showBark = function (p) { add('bark', { npc: p?.npcId, text: String(p?.text || p?.message || '').slice(0, 100) }); return ob.apply(this, arguments); };
  const w = sys.world, os = w.speak; if (typeof os === 'function') w.speak = function (id, line) { add('speak', { id, line: String(line).slice(0, 80) }); return os.apply(this, arguments); };
  const oe = w.emit; w.emit = function (n, d) { if (/^(npc_queued|npc_turned_back|npc_chatted|npc_left_post|npc_caught|magnet|npc_left_item)/.test(n)) { let dd; try { dd = JSON.stringify(d).slice(0, 160); } catch (e) { dd = '?'; } add('emit', { n, d: dd }); } return oe.apply(this, arguments); };
}, { tasks: TASKS, globals: GLOBALS });
const tStart = wall(); const cStart = await clock();
await log('PLAY START (all five staff at post)');
await shot(h, '01-spawn');

// ---- MORNING ----
R.amaIntro = await ama(["What am I looking at", "What should I try next"]);
await log(`Ama intro lines ${JSON.stringify(R.amaIntro.lines)}`);
await closeChat(h);
await near(h);
await shot(h, '02-office-after-ama');
// A5: wait for the coffee run
await wait('queue forms (see_queue)', () => window.objectivesManager.getTask('see_queue')?.status === 'completed', null,
  async () => { await ev(h, () => { window.__test.needs.set('chidi_okeke', 'caffeine', 10); window.__test.needs.set('jun_watanabe', 'caffeine', 10); }); });
await shot(h, '03-coffee-queue');
await waitTask('hear_queue_chat');
// A6: switch it off at the wall socket while they are queued
const queuers = () => ev(h, () => window.__test.needs.ids().filter(i => /queue/.test(`${window.__test.needs.state(i)?.job?.phase}`)));
R.queuedAtLever = await queuers();
await ev(h, () => window.__test.moveToNear('office_coffee_socket', { timeoutMs: 30000 })).catch(() => {});
await ev(h, () => window.__test.interact('office_coffee_socket')).catch(() => {}); await h.t(800);
await ev(h, () => document.querySelector('.game-confirm-ok')?.click()); await h.t(700);
R.coffeeOff = await ev(h, () => window.gameState.globalVariables.office_coffee_off);
await log(`socket pulled, office_coffee_off=${R.coffeeOff}, queued at lever ${JSON.stringify(R.queuedAtLever)}`);
await shot(h, '04-coffee-off');
await waitTask('see_coffee_off', async () => { await ev(h, () => { window.__test.needs.set('graham_whitfield', 'caffeine', 10); window.__test.needs.set('agnieszka_duda', 'caffeine', 10); }); });
// A7/A8: open the kitchen and hang about by the cooler
await toKitchen(h);
await log('in kitchen');
await shot(h, '05-kitchen');
await ev(h, () => window.__test.moveToNear('water_cooler', { timeoutMs: 20000 })).catch(() => {});
await waitTask('hear_cooler_exchange', async () => { await ev(h, () => { window.__test.needs.set('graham_whitfield', 'social', 5); window.__test.needs.set('agnieszka_duda', 'thirst', 5); }); });
await shot(h, '06-cooler-exchange');

// ---- MIDDAY ----
await toOffice(h);
await closeChat(h);
// A9 to A11: lunch, use an open screen, close it and wait for its owner, then the cake
let lunch = null;
for (let i = 0; i < 8; i++) {
  lunch = await ama(["Let's do lunch"]);
  await log(`lunch try ${i + 1}: ${JSON.stringify(lunch.lines.slice(-3))}`);
  await closeChat(h);
  if (await ev(h, () => window.gameState.globalVariables.act_midday === true)) break;
  await h.t(8000);
}
R.lunch = lunch;
await shot(h, '07-lunch-called');
const gone = await wait('Jun leaves his screen open', () => window.gameState.globalVariables.jun_pc_owner_away === true, null);
await shot(h, '08-jun-away');
// use the open screen
let mg = null;
for (let i = 0; i < 4 && !mg; i++) {
  await nearNpc(h, 'jun_pc').catch(() => {});
  await ev(h, () => window.__test.moveToNear('jun_pc', { timeoutMs: 30000 })).catch(() => {});
  await ev(h, () => window.__test.interact('jun_pc')); await h.t(1500);
  mg = await ev(h, () => window.__test.getState().activeMinigame);
}
R.pcMinigame = mg?.title || null;
await shot(h, '09-jun-pc');
await waitTask('use_open_screen');
// close it and wait by the desk
await ev(h, () => window.__test.dismissBlockingUi?.()); await h.t(500);
if (await ev(h, () => !!window.__test.getState().activeMinigame)) { await h.page.keyboard.press('Escape'); await h.t(700); }
await ev(h, () => window.__test.moveToNear('jun_pc', { timeoutMs: 30000 })).catch(() => {});
await waitTask('see_caught');
await h.t(3000); await shot(h, '10-caught');
// wait for everyone to be back and sitting, then drop the cake
await wait('all four back at desks', () => ['chidi_okeke', 'jun_watanabe', 'graham_whitfield', 'agnieszka_duda'].every(i => { const s = window.__test.needs.state(i); return s.atPost && !s.job; }), null);
await h.t(3000);
await ev(h, () => window.__test.moveTo(300, 296, { timeoutMs: 20000 })).catch(() => {});
R.cakeDrop = await ev(h, () => window.__test.inventoryAct('cake', 'Drop here'));
await log(`cake dropped ${JSON.stringify(R.cakeDrop)}`);
await h.t(1500); await shot(h, '11-cake-dropped');
await waitTask('see_cake_eaten', async () => { await ev(h, () => { for (const i of ['chidi_okeke', 'jun_watanabe', 'graham_whitfield', 'agnieszka_duda']) window.__test.needs.set(i, 'hunger', 20); }); });
await shot(h, '12-cake-eaten');

// ---- EVENING ----
R.callItADay = await ama(["Call it a day"]);
await log(`call it a day ${JSON.stringify(R.callItADay.lines.slice(-3))}`);
await closeChat(h);
await h.t(1500); await shot(h, '13-evening-office');
await waitTask('see_who_stays');
await shot(h, '14-zainab-stays');
// A15: walk into the kitchen (motion light)
await toKitchen(h); await h.t(1500); await shot(h, '15-kitchen-evening');
await toOffice(h);
// recap
R.recap = await ama(["Give me the short version"]);
await log(`recap ${JSON.stringify(R.recap.lines)}`);
await h.t(1500); await shot(h, '16-recap');
await closeChat(h);
const tEnd = wall(); const cEnd = await clock();
R.timing = { wallS: +(tEnd - tStart).toFixed(1), needsS: +(cEnd - cStart).toFixed(1), wallMin: +((tEnd - tStart) / 60).toFixed(2), needsMin: +((cEnd - cStart) / 60).toFixed(2) };
R.final = await ev(h, () => ({
  concludedAt: window.breakEscapeConfig?.missionConcludedAt ?? null,
  creditsVisible: !!document.querySelector('[class*=credits], #credits'),
  tasks: Object.fromEntries(['see_queue', 'hear_queue_chat', 'see_coffee_off', 'hear_cooler_exchange', 'use_open_screen', 'see_caught', 'see_cake_eaten', 'see_who_stays'].map(t => [t, window.objectivesManager.getTask(t)?.status])),
}));
R.barks = await ev(h, () => window.__rec.filter(r => r.k === 'bark').map(r => `${r.c} ${r.npc}: ${r.text}`));
console.log(JSON.stringify(R, null, 1));
fs.mkdirSync('tmp/s5', { recursive: true });
fs.writeFileSync(`tmp/s5/R-${gid}.json`, JSON.stringify(R));
console.log('errs', h.errs.slice(0, 8));
await h.browser.close();
