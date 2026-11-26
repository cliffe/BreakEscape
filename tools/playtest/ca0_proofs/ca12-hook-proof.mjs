// Proof A (ca12 hook): Jun patrol, Yusuf resume_patrol after patrolOverride, Camila walkIn arrival, hand-back grace 7500 ms.
//   game: new-game.sh ca12_visitor_tailgater --set ca12_world_on=true --set ca12_runner_go=true
//   node ca12-hook-proof.mjs <gameId> <port> <outDir>
import { launch, sleep } from './_pl.mjs';
const [gid, port, out] = process.argv.slice(2);
const L = await launch(gid, port, out); const { page } = L;
const snap = () => page.evaluate(() => { const o = {}; for (const id of ['ca12_jun_watanabe', 'ca12_yusuf_demir', 'kit_camila_ospina']) {
  const b = window.npcBehaviorManager?.getBehavior?.(id), sp = b?.sprite; o[id] = sp ? { r: b.roomId || sp.roomId, x: Math.round(sp.x), y: Math.round(sp.y), vis: sp.visible, st: b.currentState || b.state || null } : null; }
  const g = window.gameState?.globalVariables || {}; o.g = { entered: g.ca12_entered, done: g.ca12_world_done, out: g.kit_ca12_out, go: g.kit_ca12_visitor_go, room: window.currentPlayerRoom }; return o; });
const evs = () => page.evaluate(() => window.__test.drainLog().filter(e => e.kind === 'event' && /npc_arrived|door_gate|room_entered|global_variable_changed:(ca12|kit_ca12)|patrol/.test(e.name || e.event || JSON.stringify(e))).map(e => `${e.t} ${(e.name || e.event || '')} ${JSON.stringify(e.data || e.detail || '').slice(0, 90)}`));
const T0 = Date.now(); const trace = [];
await page.evaluate(() => window.__test.clearLog());
for (let i = 0; i < 20; i++) { const s = await snap(); trace.push({ t: ((Date.now() - T0) / 1000).toFixed(1), ...s }); await sleep(1000); }
await L.shot('a1_before_go');
// the hook: the learner steps away (kit_ca12_out) then the visitor arrives
await page.evaluate(() => { const gs=window.gameState,o=gs.globalVariables.kit_ca12_out;gs.globalVariables.kit_ca12_out=true;window.eventDispatcher.emit('global_variable_changed:kit_ca12_out',{name:'kit_ca12_out',value:true,oldValue:o}); });
await sleep(1500);
await page.evaluate(() => { const gs=window.gameState,o=gs.globalVariables.kit_ca12_visitor_go;gs.globalVariables.kit_ca12_visitor_go=true;window.eventDispatcher.emit('global_variable_changed:kit_ca12_visitor_go',{name:'kit_ca12_visitor_go',value:true,oldValue:o}); });
const T1 = Date.now();
for (let i = 0; i < 70; i++) { const s = await snap(); trace.push({ t: ((Date.now() - T0) / 1000).toFixed(1), ...s }); await sleep(1000); }
await L.shot('a2_after_walkin');
const events = await evs();
L.save('hook-result.json', { gid, trace, events, errs: L.errs, posts: L.posts.length });
L.save('console.log', L.log.join('\n'));
console.log(JSON.stringify({ errs: L.errs, events: events.slice(0, 40) }, null, 0).slice(0, 1500));
const c = n => n ? `${n.r}:${n.x},${n.y}${n.vis ? '' : '(h)'}/${n.st}` : '-';
for (const r of trace.filter((_, i) => i % 4 === 0)) console.log(r.t, 'jun', c(r.ca12_jun_watanabe), 'yus', c(r.ca12_yusuf_demir), 'cam', c(r.kit_camila_ospina), 'done', r.g.done);
await L.browser.close();
