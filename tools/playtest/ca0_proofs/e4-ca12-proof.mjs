// E4 live proof on ca12: Jun patrol.startWhen (with and without runner_go, and across a reload),
// Yusuf patrolOverride then resume_patrol (loop runs again afterwards).
//   mode ctl:  game made with no --set (Jun must stay put)   node e4-ca12-proof.mjs ctl <gid> <port> <out>
//   mode run:  game made with --set ca12_world_on=true --set ca12_runner_go=true   node e4-ca12-proof.mjs run <gid> <port> <out>
import { launch, sleep } from './_pl.mjs';
const [mode, gid, port, out] = process.argv.slice(2);
const L = await launch(gid, port, out); const { page } = L; const T0 = Date.now();
const snap = () => page.evaluate(() => { const o = {}; for (const id of ['ca12_jun_watanabe', 'ca12_yusuf_demir']) { const b = window.npcBehaviorManager?.getBehavior?.(id), sp = b?.sprite; o[id] = sp ? { r: b.roomId, x: Math.round(sp.x), y: Math.round(sp.y), st: b.currentState, ovr: !!b._patrolOverridden, en: b.config?.patrol?.enabled, def: !!b.config?.patrol?.startDeferred } : null; } return o; });
const trace = [];
const run = async (tag, secs) => { for (let i = 0; i < secs; i++) { trace.push({ t: +((Date.now() - T0) / 1000).toFixed(1), tag, ...await snap() }); await sleep(1000); } };
const moved = (tag, id) => { const p = trace.filter(r => r.tag === tag && r[id]).map(r => `${r[id].x},${r[id].y}`); return { distinct: new Set(p).size, first: p[0], last: p.at(-1) }; };
await page.evaluate(() => window.__test.clearLog());
await run('load', 30);
const res = { mode, gid, load: { jun: moved('load', 'ca12_jun_watanabe'), yusuf: moved('load', 'ca12_yusuf_demir') }, junDeferredAtStart: trace[0].ca12_jun_watanabe };
if (mode === 'run') {
  await page.evaluate(() => { const gs = window.gameState, o = gs.globalVariables.ca12_world_done; gs.globalVariables.ca12_world_done = true; window.eventDispatcher.emit('global_variable_changed:ca12_world_done', { name: 'ca12_world_done', value: true, oldValue: o }); });
  await run('override', 25);
  res.override = { yusuf: moved('override', 'ca12_yusuf_demir'), ovrSeen: trace.filter(r => r.tag === 'override').some(r => r.ca12_yusuf_demir?.ovr) };
  await run('resumed', 45);
  res.resumed = { yusuf: moved('resumed', 'ca12_yusuf_demir'), ovrLast: trace.at(-1).ca12_yusuf_demir?.ovr };
  res.events = await page.evaluate(() => window.__test.drainLog().filter(e => /npc_arrived|patrol/.test(e.name || e.event || '')).map(e => `${e.t} ${e.name || e.event} ${JSON.stringify(e.data || {}).slice(0, 80)}`).slice(0, 20));
  // reload: the seeded globals restore, so Jun's startWhen holds again on the first tick
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player?.body, null, { timeout: 90000 });
  await sleep(2500); await page.evaluate(() => window.__test.throttleFps(20));
  for (let i = 0; i < 3; i++) { const s = await page.evaluate(() => window.__test.getState?.() ?? null).catch(() => null); if (s?.blockingUi) { await page.evaluate(b => window.__test.dismissBlockingUi(/tutorial/i.test((b.classes || '') + b.text) ? 'figure it out' : null), s.blockingUi).catch(() => {}); await sleep(700); } }
  await run('reload', 30);
  res.reload = { jun: moved('reload', 'ca12_jun_watanabe'), globals: await page.evaluate(() => ({ go: window.gameState.globalVariables.ca12_runner_go, done: window.gameState.globalVariables.ca12_world_done })) };
}
res.errs = L.errs;
L.save('e4-ca12.json', { res, trace }); L.save('console.log', L.log.join('\n'));
console.log(JSON.stringify(res, null, 1));
await L.browser.close();
