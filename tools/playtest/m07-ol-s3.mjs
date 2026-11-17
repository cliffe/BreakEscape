// Slice 3 live checks for m07 office life (PLAN section 10.2 to 10.4). Headless, setFPS(20), fixed steps on.
// Usage: node tools/playtest/m07-ol-s3.mjs <mode> <gameId> [port=3098] [npcId] [arg]
// Modes: l1 (45 s from entry), trip (natural cooler trip), talk (talk, trip, talk again),
//        ex (exchange globals over forced trips), walk (west door, desk, east door; arg=post|cool).
import { open, ev, load, converse, dismiss } from './m01-ol-lib.mjs';
const [mode, gid, port = '3098', npc = 'adaeze_okafor', arg = ''] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
const OPS = ['adaeze_okafor', 'gwen_pritchard'];
const snap = () => ev(h, (ids) => {
  const gs = window.__test.getState();
  const o = {};
  for (const i of ids) {
    const s = window.__test.needs.state(i);
    const b = window.npcBehaviorManager.getBehavior(i);
    const sp = b?.sprite;
    o[i] = { m: s.mode, post: s.atPost, seat: !!b?._seat, job: s.job ? [s.job.kind, s.job.objectId, s.job.phase] : null,
      anim: sp?.anims?.currentAnim?.key ?? null, vis: sp?.visible ?? null,
      x: sp ? Math.round(sp.body.center.x) : null, y: sp ? Math.round(sp.body.center.y) : null,
      th: +s.levels.thirst.toFixed(1), talk: s.talking ?? null };
  }
  o.room = gs.currentRoom || gs.room || null;
  o.mg = gs.activeMinigame ? (gs.activeMinigame.id || 'open') : null;
  return o;
}, OPS);
const usingCooler = s => OPS.every(i => s[i].job && s[i].job[2] === "using" && s[i].x >= 360 && s[i].x <= 420 && s[i].y >= 225 && s[i].y <= 265);
const shot = name => h.page.screenshot({ path: `tmp/m07-s3-${name}-${gid}.png` });
const logTail = (from) => ev(h, (f) => window.__test.needs.log().slice(f).map(e => JSON.stringify(e).slice(0, 160)), from);
const nlog = () => ev(h, () => window.__test.needs.log().length);

await h.t(3000);
const L0 = await nlog();
await ev(h, () => window.__test.enterRoom('operations_floor', { timeoutMs: 20000 }));
const tEnter = Date.now();
const T = () => Math.round((Date.now() - tEnter) / 1000);
let firstJobAt = null;
log('entered', { gid, mode, t: T() });

async function watch(untilT, stopWhen, label) {
  let last = ''; let hit = null;
  while (T() <= untilT) {
    const s = await snap();
    if (firstJobAt === null && OPS.some(i => s[i].job)) firstJobAt = T();
    const k = JSON.stringify(OPS.map(i => [s[i].m, s[i].post, s[i].seat, s[i].job, s[i].anim, s[i].x, s[i].y]));
    if (k !== last) { log(label + ' t' + T(), s); last = k; }
    if (stopWhen && stopWhen(s)) { hit = T(); log(label + ' STOP', { t: hit }); break; }
    await h.t(1000);
  }
  return hit;
}

if (mode === 'l1') {
  let prev = '';
  for (let t = 0; t <= 45; t++) {
    const s = await snap();
    const k = JSON.stringify(OPS.map(i => [s[i].m, s[i].post, s[i].seat, s[i].job, s[i].anim, s[i].x, s[i].y]).concat([s.mg]));
    if (k !== prev) { log('t' + t, s); prev = k; }
    if (t === 5) await shot('l1-5s');
    if (t === 40) await shot('l1-40s');
    await h.t(1000);
  }
  log('needs log since entry', await logTail(L0));
}

if (mode === 'trip') {
  const hit = await watch(200, usingCooler, 'trip');
  if (hit !== null) await shot('trip-using');
  await h.t(8000);
  log('after-using 8s', await snap());
  const lg = await logTail(L0);
  log('needs log since entry', lg);
  log('no_beside_cell count', lg.filter(x => /no_beside_cell/.test(x)).length);
}

if (mode === 'talk') {
  await h.t(2000);
  while (T() < 240 && (await ev(h, () => { const st = window.__test.getState(); return !!(st.blockingUi || st.activeMinigame); }))) { await dismiss(h); await h.t(2000); }
  log('blocking cleared at T', T());
  let it = null; for (let k = 0; k < 4 && !it?.ok; k++) { it = await ev(h, (id) => window.__test.interact(id), npc); if (!it?.ok) { await h.t(2000); } }
  log('interact', { ok: it?.ok, mode: it?.mode, reason: it?.reason });
  await h.t(2500); await shot(`talk1-${npc}`);
  const r1 = await converse(h, '.', 40);
  const tClose = T();
  log('chat1', { closed: r1.closed, lines: r1.lines, picked: r1.picked, fail: r1.fail || null, closeAtT: tClose });
  const hit = await watch(tClose + 120, usingCooler, 'after-chat1');
  log('chat1 close to first job (s)', firstJobAt === null ? null : firstJobAt - tClose);
  log('chat1 close to both-using (s)', hit === null ? null : hit - tClose);
  await h.t(3000);
  const it2 = await ev(h, (id) => window.__test.interact(id), npc);
  log('interact2', { ok: it2?.ok, mode: it2?.mode, reason: it2?.reason });
  await h.t(2500); await shot(`talk2-${npc}`);
  const r2 = await converse(h, '.', 40);
  log('chat2', { closed: r2.closed, lines: r2.lines, fail: r2.fail || null });
  const lg = await logTail(L0);
  log('needs log since entry', lg);
  log('no_beside_cell count', lg.filter(x => /no_beside_cell/.test(x)).length);
}

if (mode === 'ex') {
  for (let trip = 0; trip < 3 && T() < 480; trip++) {
    await ev(h, () => window.__test.needs.set('adaeze_okafor', 'thirst', 20));
    await watch(T() + 150, usingCooler, 'ex-trip' + trip);
    await h.t(4000);
    const g = await ev(h, () => { const gl = window.__test.getState().globals || {}; return Object.fromEntries(Object.entries(gl).filter(([k]) => /heard|ex_|last_two|going/.test(k))); });
    log('globals after trip' + trip, g);
    await h.t(15000);
  }
  log('needs log since entry', await logTail(L0));
}

if (mode === 'walk') {
  if (arg === 'cool') await watch(T() + 150, usingCooler, 'walk-wait-cool');
  const doors = await ev(h, () => window.__test.doorways('operations_floor'));
  const list = (Array.isArray(doors) ? doors : Object.values(doors || {})).map(d => d.id);
  log('doors', list);
  const west = list.find(id => /operations_floor->security_checkpoint/.test(id));
  const east = list.find(id => /operations_floor->server_room/.test(id));
  const r1 = await ev(h, (id) => window.__test.moveToNear(id), west);
  log('to west door', { ok: r1?.ok, feetAt: r1?.feetAt, reason: r1?.reason });
  await h.t(800);
  const r2 = await ev(h, () => window.__test.moveTo(440, 230, { timeoutMs: 25000 }));
  log('to desk', { ok: r2?.ok, feetAt: r2?.feetAt, reason: r2?.reason });
  const r3 = await ev(h, (id) => window.__test.moveToNear(id), east);
  log('to east door', { ok: r3?.ok, feetAt: r3?.feetAt, reason: r3?.reason });
  await shot(`walk-${arg || 'post'}`);
  log('snap', await snap());
}

log('errs', h.errs.filter(e => !/503/.test(e)).slice(0, 8));
await h.browser.close();
