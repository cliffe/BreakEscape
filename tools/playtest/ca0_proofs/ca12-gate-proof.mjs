// Proofs A (Jun loop, Yusuf resume_patrol, grace) + B (gate) + C (E4 gate stop) on ca12, player-driven.
//   game: new-game.sh ca12_visitor_tailgater   (fresh; world_on/runner_go are emitted at runtime = what the pretext outcome sets)
//   node ca12-gate-proof.mjs <gameId> <port> <outDir>
import { launch, sleep } from './_pl.mjs';
const [gid, port, out] = process.argv.slice(2);
const L = await launch(gid, port, out); const { page } = L;
const T0 = Date.now(); const ts = () => ((Date.now() - T0) / 1000).toFixed(1);
const emit = (name, value) => page.evaluate(([n, v]) => { const gs = window.gameState, o = gs.globalVariables[n]; gs.globalVariables[n] = v; window.eventDispatcher.emit('global_variable_changed:' + n, { name: n, value: v, oldValue: o }); }, [name, value]);
const npcs = () => page.evaluate(() => { const o = {}; for (const id of ['ca12_jun_watanabe', 'ca12_yusuf_demir']) { const b = window.npcBehaviorManager.getBehavior(id), sp = b?.sprite; o[id] = sp && `${b.roomId}:${Math.round(sp.x)},${Math.round(sp.y)}/${b.currentState}`; } return o; });
const doors = () => page.evaluate(() => { const o = {}; for (const [rid, r] of Object.entries(window.rooms)) o[rid] = (r.doorSprites || []).map(d => ({ to: d.doorProperties?.connectedRoom, gate: !!d.doorProperties?.gate, vis: d.visible, act: d.active, open: !!d.isOpen, tex: d.texture?.key })); return o; });
const events = () => page.evaluate(() => window.__test.drainLog().filter(e => e.kind === 'event' && /npc_arrived|door_gate|room_entered|global_variable_changed:ca12/.test(e.name || e.event || '')).map(e => `${e.t} ${e.name || e.event} ${JSON.stringify(e.data || e.detail || '').slice(0, 100)}`));
const res = { gid, steps: [] }; const step = (n, o) => { res.steps.push({ t: ts(), n, ...o }); console.log(ts(), n, JSON.stringify(o).slice(0, 400)); };
step('doors-initial', await doors());
await page.evaluate(() => window.__test.clearLog());
// B1: world OFF (gate inert = ordinary door): click out through the gate door from the secured room
const p0 = L.posts.length;
const r1 = await page.evaluate(() => window.__test.enterRoom('lobby')); step('B1-enterRoom-lobby', { ok: r1?.ok, room: await page.evaluate(() => window.currentPlayerRoom), why: JSON.stringify({ r: r1?.reason, e: r1?.error, k: r1?.kind }) });
await sleep(1500); step('B1-doors-after-exit', await doors()); await L.shot('b1_in_lobby');
step('B1-posts', { posts: L.posts.slice(p0).map(p => p.url) });
step('B1-events', { ev: await events() });
// world ON (as the pretext outcome sets it): Jun runs; the player is outside the gate in the lobby
await emit('ca12_world_on', true); await emit('ca12_runner_go', true);
for (let i = 0; i < 6; i++) { await sleep(1000); }
step('after-world-on', await npcs());
// B2: click the gate from outside, count POSTs
await page.evaluate(() => window.__test.moveTo(window.player.x - 40, window.player.y + 24).catch(() => null)); await sleep(800);
const gd = await page.evaluate(() => { const d = window.rooms.lobby?.doorSprites?.find(d => d.doorProperties?.gate) || window.rooms.lobby?.doorSprites?.[0]; if (!d) return null; const cam = window.player.scene.cameras.main; return { sx: (d.x - cam.worldView.x) * cam.zoom, sy: (d.y - cam.worldView.y) * cam.zoom, x: d.x, y: d.y }; });
step('gate-click-target', { gd });
const box = await page.evaluate(() => { const c = document.querySelector('canvas').getBoundingClientRect(); return { x: c.x, y: c.y }; });
await page.evaluate(() => window.__test.clearLog()); const p1 = L.posts.length;
if (gd) { await page.mouse.click(box.x + gd.sx, box.y + gd.sy); await sleep(2500); }
step('gate-click-result', { posts: L.posts.slice(p1).map(p => p.url), ev: (await events()).filter(e => /gate/.test(e)), bubble: await page.evaluate(() => [...(window.npcWorldBubbles?.says?.entries?.() || [])].map(([k, v]) => k + ':' + (v.pages || []).join(' ')).slice(0, 3)) });
await L.shot('b2_after_gate_click');
await emit('ca12_wearing_hivis', true);  // seeded: the kit step; lets the player use the gate back in
// A: re-enter training_room (ca12_entered), grace 7.5 s, then Yusuf override + resume_patrol
await page.evaluate(() => window.__test.clearLog());
const r2 = await page.evaluate(() => window.__test.enterRoom('training_room')); step('enterRoom-training', { room: await page.evaluate(() => window.currentPlayerRoom) });
for (let i = 0; i < 40; i++) { await sleep(1000); if (i % 2 === 0) step('post-entry', { ...(await npcs()), done: await page.evaluate(() => window.gameState.globalVariables.ca12_world_done) }); }
res.grace = (() => { const a = L.log.find(l => /Event setGlobal: ca12_entered/.test(l)), b = L.log.find(l => /Timer fired: ca12_t_grace/.test(l)); return a && b ? parseInt(b) - parseInt(a) : null; })(); console.log('GRACE_MS', res.grace);
res.events = await events(); res.errs = L.errs; res.postsAll = L.posts.map(p => p.url);
L.save('gate-result.json', res); L.save('console.log', L.log.join('\n'));
console.log('ERRS', JSON.stringify(L.errs)); console.log(res.events.join('\n').slice(0, 2500));
await L.browser.close();
