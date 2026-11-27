// E4 proof: a route walker's goToAndStay stop beyond a shut gate (openFor him): he goes to the gate, it opens, he crosses, stands, does not loop.
//   game: new-game.sh test_side_door_gate --set test_window_on=true --unlock east_room
//   node e4-gate-stop-proof.mjs <gid> <port> <out>
import { launch, sleep } from './_pl.mjs';
const [gid, port, out] = process.argv.slice(2);
const L = await launch(gid, port, out); const { page } = L; const T0 = Date.now();
await page.evaluate(() => window.__test.clearLog());
await page.evaluate(() => window.__test.moveTo(120, 250)); await sleep(1000);
const snap = () => page.evaluate(() => { const b = window.npcBehaviorManager.getBehavior('opener'), sp = b.sprite; return { r: b.roomId, x: Math.round(sp.x), y: Math.round(sp.y), st: b.currentState, stop: !!b._stopOnArrival, ovr: !!b._patrolOverridden }; });
const gate = () => page.evaluate(() => window.rooms.west_room?.doorSprites?.find(d => d.doorProperties?.gate)?.doorProperties?.open);
const pos0 = await snap();
const tgt = await page.evaluate(() => { const rp = window.roomPositions.east_room; return { x: rp.x + 5 * 32 + 16, y: rp.y + 3 * 32 + 16 }; });
await page.evaluate(t => window.npcBehaviorManager.goToAndStay('opener', t.x, t.y, 90, {}), tgt);
const tr = []; let arrived = null;
for (let i = 0; i < 60; i++) { await sleep(1000); const s = await snap(); tr.push({ t: i + 1, ...s, gateOpen: await gate() }); }
const ev = await page.evaluate(() => window.__test.drainLog().filter(e => /door_gate|npc_arrived/.test(e.name || e.event || '')).map(e => `${e.t} ${e.name || e.event}`).slice(0, 12));
const last = tr.at(-1), tail = tr.slice(-20);
const res = { pos0, tgt, last, tailDistinct: new Set(tail.map(r => `${r.x},${r.y}`)).size, everEast: tr.some(r => r.r === 'east_room'), everGateOpen: tr.some(r => r.gateOpen), ev, errs: L.errs };
L.save('e4-gate-stop.json', { res, tr }); L.save('console.log', L.log.join('\n'));
console.log(JSON.stringify(res)); console.log(tr.filter((_, i) => i % 4 === 0).map(r => `${r.t}s ${r.r} ${r.x},${r.y} ${r.st} gate=${r.gateOpen}`).join('\n'));
await L.browser.close();
