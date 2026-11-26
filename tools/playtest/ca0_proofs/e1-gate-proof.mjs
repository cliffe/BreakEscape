// E1 gate proofs on the throwaway test_side_door_gate scenarios (window on, no vest).
//   node tools/playtest/ca0_proofs/e1-gate-proof.mjs <east|west> <gameId> <port> <outDir>
//   east: game test_side_door_gate_east_start (starts in east_room, the secured room).
//   west: game test_side_door_gate (starts in west_room; opener NPC walks the route).
// Clicks go through __test.enterRoom (the real door click path). No Escape press.
import { launch, sleep } from './_pl.mjs';
const [mode, gid, port, out] = process.argv.slice(2);
const L = await launch(gid, port, out); const { page } = L;
const gates = () => page.evaluate(() => { const o = []; for (const [rid, r] of Object.entries(window.rooms || {})) for (const d of r.doorSprites || []) if (d.doorProperties?.gate) o.push({ room: rid, to: d.doorProperties.connectedRoom, alive: !d.destroyed && d.scene != null, vis: d.visible, act: d.active !== false }); return o; });
const here = () => page.evaluate(() => window.currentPlayerRoom);
const unlockPosts = from => L.posts.slice(from).filter(p => /unlock/.test(p.url)).length;
const gateEvents = () => page.evaluate(() => window.__test.drainLog().filter(e => /door_gate/.test(e.name || e.event || '')).map(e => `${e.name || e.event} ${JSON.stringify(e.data || e.detail || {}).slice(0, 120)}`));
const say = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v).slice(0, 300));
const res = { mode, gid, steps: {} };
say('start', { room: await here(), gates: await gates() });
await page.evaluate(() => window.__test.clearLog());
if (mode === 'east') {
  // Proof 1a: click the gate from inside the secured room, at once.
  const p = L.posts.length; const r = await page.evaluate(() => window.__test.enterRoom('west_room'));
  await sleep(1500); const ev = await gateEvents();
  res.steps.exit = { ok: r?.ok, reason: r?.reason || r?.error || null, room: await here(), posts: unlockPosts(p), gates: await gates(), ev };
  say('1a exit-click', res.steps.exit); await L.shot('e1_1a_exit');
} else {
  // Proof 2: click the gate from the outside (west) and count unlock POSTs.
  // Direct click: stand on the room side of the gate, then click the gate sprite itself.
  const door = await page.evaluate(() => { const d = window.rooms[window.currentPlayerRoom]?.doorSprites?.find(d => d.doorProperties?.gate); return d && { x: d.x, y: d.y, to: d.doorProperties.connectedRoom }; });
  const near = await page.evaluate(d => ({ x: d.x - 24, y: d.y }), door);
  await page.evaluate(n => window.__test.moveTo(n.x, n.y), near); await sleep(800);
  const pp = await page.evaluate(() => ({ x: Math.round(window.player.x), y: Math.round(window.player.y) }));
  const p = L.posts.length; const c = await page.evaluate(d => window.__test.clickAt(d.x, d.y), door);
  await sleep(2000); const ev = await gateEvents();
  res.steps.outsideClick = { door, playerBefore: pp, clickOk: c?.ok, room: await here(), posts: unlockPosts(p), gates: await gates(), ev };
  say('2 outside-click', res.steps.outsideClick); await L.shot('e1_2_outside_click');
}
if (mode === 'east') {
  // Proof 1b: walk back to the gate from outside (west room) and click it.
  await page.evaluate(() => window.__test.clearLog());
  // Direct click: stand on the room side of the gate, then click the gate sprite itself.
  const door = await page.evaluate(() => { const d = window.rooms[window.currentPlayerRoom]?.doorSprites?.find(d => d.doorProperties?.gate); return d && { x: d.x, y: d.y, to: d.doorProperties.connectedRoom }; });
  const near = await page.evaluate(d => ({ x: d.x - 24, y: d.y }), door);
  await page.evaluate(n => window.__test.moveTo(n.x, n.y), near); await sleep(800);
  const p = L.posts.length; const c = await page.evaluate(d => window.__test.clickAt(d.x, d.y), door);
  await sleep(2000); const ev = await gateEvents();
  res.steps.outsideClick = { door, clickOk: c?.ok, room: await here(), posts: unlockPosts(p), gates: await gates(), ev };
  say('1b outside-click', res.steps.outsideClick); await L.shot('e1_1b_outside_click');
  res.steps.ordinaryDoor = 'N/A: the scenario has no ordinary locked door, only the gate.';
} else {
  // Proof 2b: the openFor NPC (opener) walks his route: watch the gate open, then shut.
  await page.evaluate(() => window.__test.clearLog());
  // Walk the player well away from the gate: a player standing near it holds it open.
  await page.evaluate(d => window.__test.moveTo(d.x - 150, d.y), await page.evaluate(() => { const d = window.rooms.west_room?.doorSprites?.find(d => d.doorProperties?.gate); return { x: d.x, y: d.y }; })); await sleep(1500);
  const seen = []; const t0 = Date.now();
  while (Date.now() - t0 < 90000) { await sleep(1000); for (const e of await gateEvents()) seen.push(`${((Date.now() - t0) / 1000).toFixed(0)}s ${e}`); if (seen.some(s => /door_gate_closed/.test(s)) && seen.some(s => /door_gate_opened/.test(s))) break; }
  res.steps.npcGate = { events: seen.slice(0, 12), gates: await gates(), room: await here() };
  say('2b npc-gate', res.steps.npcGate); await L.shot('e1_2b_npc');
}
res.errs = L.errs;
L.save('e1-result.json', res); L.save('console.log', L.log.join('\n'));
console.log('errs', L.errs.length);
await L.browser.close();
