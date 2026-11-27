// Live proof of the m08 chatter-pool gate. Usage: PORT=3094 node tools/playtest/m08-chatter-gate-proof.mjs <gameId>
// Game made with: new-game.rb m08_the_mole --start-room operations_floor (a test-only head start on that game's own row).
// States are set by writing gameState.globalVariables directly, then broadcasting and emitting the change event
// (setG below: the same writes a mapping setGlobal makes), and the needs system's own mapping lever (levels.thirst) to start trips quickly. No game row is edited.
import { chromium } from 'playwright';
const PORT = Number(process.env.PORT), BASE = `http://127.0.0.1:${PORT}`;
const id = process.argv[2];
const id2 = process.argv[3]; // a second fresh game, for the agnieszka_ko phase (ko is never cleared)
const OBS_S = Number(process.env.OBS_S || 150);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const out = { phases: {} };
const browser = await chromium.launch({ headless: true });
const OFFICERS = ['julian_sallow', 'agnieszka_duda'];
async function open(gameId) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await page.route(u => /\/tts$/.test(new URL(u).pathname), r => r.abort());
  await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch {} });
  await page.goto(`${BASE}/break_escape/games/${gameId}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
  for (let i = 0; i < 10; i++) {
    const st = await page.evaluate(() => window.__test.getState().blockingUi);
    if (!st) break;
    const l = st.buttons.map(x => x.label).find(x => /continue|ok|close|got it/i.test(x)) || st.buttons[0].label;
    await page.evaluate(x => window.__test.dismissBlockingUi(x), l); await sleep(700);
  }
  for (let i = 0; i < 4; i++) {
    const cl = await page.evaluate(() => window.__test.minigame.close());
    if (!cl || cl.ok === false && cl.reason === 'no-active-minigame') break;
    await sleep(800);
  }
  out.throttle = await page.evaluate(() => window.__test.throttleFps(20));
  await page.evaluate(() => {
    const s = window.npcNeedsSystem; window.__ev = [];
    const sp = s.world.speak, em = s.world.emit;
    s.world.speak = (id, line, info) => { window.__ev.push({ k: 'speak', id, line, t: Math.round(s.clockMs / 1000) }); return sp?.call(s.world, id, line, info); };
    s.world.emit = (n, d) => { if (/^npc_(chatted|used|use_started)/.test(n)) window.__ev.push({ k: n, d: d && { npcId: d.npcId, speakerId: d.speakerId, line: d.line, picture: d.picture }, t: Math.round(s.clockMs / 1000) }); return em.call(s.world, n, d); };
  });
  return page;
}
const take = page => page.evaluate(() => { const e = window.__ev.slice(); window.__ev.length = 0; return e; });
// Same writes as npc-manager's mapping setGlobal: gameState, conversation broadcast, event, debounced sync.
const setG = (page, n, v) => page.evaluate(([n, v]) => {
  const gv = window.gameState.globalVariables, old = gv[n];
  gv[n] = v;
  window.npcConversationStateManager?.broadcastGlobalVariableChange?.(n, v, null);
  window.eventDispatcher.emit(`global_variable_changed:${n}`, { name: n, value: v, oldValue: old });
  window.stateSync?.requestSoon?.();
  return gv[n];
}, [n, v]);
const G = (page, n) => page.evaluate(n => window.gameState?.globalVariables?.[n], n);
const thirst = (page, v) => page.evaluate(([ids, v]) => ids.map(i => { const s = window.npcNeedsSystem.states.get(i); if (s) s.levels.thirst = v; return !!s; }), [OFFICERS, v]);
const cooler = page => page.evaluate(() => { const o = window.npcNeedsSystem.world.getObject('ops_cooler'); return { off: !!window.npcNeedsSystem._isOff(o) }; });
const summarise = ev => {
  const sp = ev.filter(e => e.k === 'speak' && OFFICERS.includes(e.id));
  return {
    officerSpeak: sp.length, officerSpeakLines: sp.map(e => `${e.id}@${e.t}:${e.line}`),
    chatted: ev.filter(e => e.k.startsWith('npc_chatted')).length,
    chattedWithLine: ev.filter(e => e.k.startsWith('npc_chatted') && e.d.line).length,
    chattedPictureOnly: ev.filter(e => e.k.startsWith('npc_chatted') && !e.d.line).length,
    useStarted: ev.filter(e => e.k.startsWith('npc_use_started')).map(e => `${e.d.npcId}@${e.t}`),
    used: ev.filter(e => e.k.startsWith('npc_used')).map(e => `${e.d.npcId}@${e.t}`)
  };
};
// The duty console as the player meets it: resolved read text, the globals the amber emitter and the
// pc-session claim read, and the claimable state those two give (owner away and screen not locked).
const consoleNow = page => page.evaluate(async () => {
  const { resolveObjectField } = await import('/break_escape/js/utils/conditional-text.js');
  const o = Object.values(window.rooms?.operations_floor?.objects || {}).map(sp => sp.scenarioData).find(x => x?.id === 'julian_console');
  const g = window.gameState.globalVariables;
  const away = !!g.julian_console_owner_away, locked = !!g.julian_console_screen_locked;
  return { upset: !!g.ops_watch_upset, away, locked, claimable: away && !locked, text: resolveObjectField(o, 'text', '', g).split('\n')[0] };
});
async function watch(page, label, secs, extra = {}) {
  // push both officers to thirsty every 40 s so trips repeat inside the window; sample the console every 5 s
  const end = Date.now() + secs * 1000, seen = new Map();
  let nextThirst = 0;
  while (Date.now() < end) {
    if (Date.now() >= nextThirst) { await thirst(page, 5); nextThirst = Date.now() + 40000; }
    const c = await consoleNow(page); const k = JSON.stringify(c); seen.set(k, (seen.get(k) || 0) + 1);
    await sleep(Math.min(5000, Math.max(0, end - Date.now())));
  }
  const ev = await take(page);
  const consoleStates = [...seen].map(([k, n]) => ({ ...JSON.parse(k), samples: n }));
  out.phases[label] = { upset: await G(page, 'ops_watch_upset'), ko: await G(page, 'ops_watch_ko'), cooler: await cooler(page), ...extra, ...summarise(ev), consoleStates };
  console.log(label, JSON.stringify(out.phases[label]));
}
let page = await open(id);
console.log('throttle', JSON.stringify(out.throttle));
console.log('badge audit set', await setG(page, 'found_badge_audit', true));
await sleep(5000); await take(page);
await watch(page, 'a_not_upset', OBS_S);
console.log('upset set', await setG(page, 'ops_watch_upset', true));
await sleep(2000); await take(page);
await watch(page, 'b_upset', OBS_S, { method: 'gameState write + global_variable_changed event (as a mapping setGlobal)' });
await sleep(3000);
await page.close();
page = await open(id);
console.log('after reload upset', await G(page, 'ops_watch_upset'), 'audit', await G(page, 'found_badge_audit'));
await sleep(5000); await take(page);
await watch(page, 'd_after_reload_upset', OBS_S);
console.log('ko set', await setG(page, 'julian_ko', true));
await sleep(3000);
const koState = { upset: await G(page, 'ops_watch_upset'), ko: await G(page, 'ops_watch_ko'), cooler: await cooler(page) };
console.log('after ko', JSON.stringify(koState)); await take(page);
await watch(page, 'c_ko', OBS_S, { method: 'setG(julian_ko,true) (global only; Julian not physically KO)' });
// e: reload with ops_watch_ko true (n2). The server must keep it, and the cooler must stay off.
await sleep(3000);
await page.close();
page = await open(id);
console.log('after reload ko', await G(page, 'ops_watch_ko'), 'upset', await G(page, 'ops_watch_upset'));
await sleep(5000); await take(page);
await watch(page, 'e_after_reload_ko', OBS_S);
await page.close();
// f: agnieszka_ko on a fresh game (n3). Upset starts false, so this also shows the upset-to-KO order from clean.
if (id2) {
  page = await open(id2);
  console.log('badge audit set (game 2)', await setG(page, 'found_badge_audit', true));
  await sleep(5000); await take(page);
  console.log('before ko', JSON.stringify({ upset: await G(page, 'ops_watch_upset'), ko: await G(page, 'ops_watch_ko'), cooler: await cooler(page) }));
  console.log('agnieszka_ko set', await setG(page, 'agnieszka_ko', true));
  await sleep(3000);
  console.log('after agnieszka_ko', JSON.stringify({ upset: await G(page, 'ops_watch_upset'), ko: await G(page, 'ops_watch_ko'), julian_ko: await G(page, 'julian_ko'), cooler: await cooler(page) })); await take(page);
  await watch(page, 'f_agnieszka_ko', OBS_S, { method: 'setG(agnieszka_ko,true) from a clean game (global only; Agnieszka not physically KO)' });
}
await browser.close();
console.log(JSON.stringify(out));
