// Live proof of the m08 chatter-pool gate. Usage: PORT=3094 node tools/playtest/m08-chatter-gate-proof.mjs <gameId>
// Game made with: new-game.rb m08_the_mole --start-room operations_floor (a test-only head start on that game's own row).
// States are set through npcManager.setGlobalVariable (the real global path, so mappings fire) and the needs
// system's own mapping lever (levels.thirst) to start trips quickly. No game row is edited.
import { chromium } from 'playwright';
const PORT = Number(process.env.PORT), BASE = `http://127.0.0.1:${PORT}`;
const id = process.argv[2];
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
async function watch(page, label, secs, extra = {}) {
  // push both officers to thirsty every 40 s so trips repeat inside the window
  const end = Date.now() + secs * 1000;
  while (Date.now() < end) { await thirst(page, 5); await sleep(Math.min(40000, end - Date.now())); }
  const ev = await take(page);
  out.phases[label] = { upset: await G(page, 'ops_watch_upset'), ko: await G(page, 'ops_watch_ko'), cooler: await cooler(page), ...extra, ...summarise(ev) };
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
await browser.close();
console.log(JSON.stringify(out));
