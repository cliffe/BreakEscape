import { chromium } from 'playwright';
const PORT = Number(process.env.PORT), BASE = `http://127.0.0.1:${PORT}`;
const id = process.argv[2];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const out = { phases: {} };
const browser = await chromium.launch({ headless: true });
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
  // The opening "Mission Brief" notes minigame locks main-world input (interact refuses with minigame-active).
  // Close it as the player would; close() clears a gameDisplay first, so allow a few tries.
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
const summarise = ev => ({
  gatedSpoken: ev.filter(e => e.k === 'speak' && /^Gated/.test(e.line)).map(e => `${e.id}:${e.line}`),
  plainSpoken: ev.filter(e => e.k === 'speak' && /^Plain/.test(e.line)).map(e => `${e.id}:${e.line}`),
  chatted: ev.filter(e => e.k.startsWith('npc_chatted')).length,
  chattedWithLine: ev.filter(e => e.k.startsWith('npc_chatted') && e.d.line).length,
  chattedPictureOnly: ev.filter(e => e.k.startsWith('npc_chatted') && !e.d.line).length,
  used: ev.filter(e => e.k.startsWith('npc_used')).map(e => `${e.d.npcId}@${e.t}`),
  useStarted: ev.filter(e => e.k.startsWith('npc_use_started')).map(e => `${e.d.npcId}@${e.t}`)
});
const gate = page => page.evaluate(() => window.gameState?.globalVariables?.chatter_gate_open);
async function watch(page, label, ms) {
  await sleep(ms);
  const ev = await take(page);
  out.phases[label] = { gate: await gate(page), ...summarise(ev) };
  console.log(label, JSON.stringify(out.phases[label]));
}
let page = await open(id);
console.log('throttle', JSON.stringify(out.throttle));
await watch(page, 'a_gate_open', 120000);
// flip by play: walk to the switch, interact, answer the confirm
let r = await page.evaluate(() => window.__test.interact('gate_switch'));
console.log('interact', JSON.stringify(r));
await sleep(1500);
let bl = await page.evaluate(() => window.__test.getState().blockingUi);
console.log('blockingUi', JSON.stringify(bl));
if (bl) { await page.evaluate(x => window.__test.dismissBlockingUi(x), 'Close it'); await sleep(1500); }
const bl2 = await page.evaluate(() => window.__test.getState().blockingUi);
if (bl2) { await page.evaluate(x => window.__test.dismissBlockingUi(x), bl2.buttons[0].label); await sleep(800); }
console.log('gate after flip', await gate(page));
await take(page);
await watch(page, 'b_gate_closed', 150000);
await sleep(3000);
await page.close();
page = await open(id);
console.log('gate after reload', await gate(page));
await watch(page, 'c_after_reload', 150000);
await browser.close();
console.log(JSON.stringify(out));
