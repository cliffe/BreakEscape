// Slice 3 live checks for m07 office life (PLAN section 10.2 to 10.4). Headless, setFPS(20), fixed steps on.
// Usage: node tools/playtest/m07-ol-s3.mjs <mode> <gameId> [port=3098] [npcId] [arg]
// Modes: l1 (45 s from entry), trip (natural cooler trip), talk (talk, trip, talk again),
//        ex (exchange globals over forced trips), walk (west door, desk, east door; arg=post|cool).
import { open, ev, load, converse, dismiss } from './m01-ol-lib.mjs';
import { route } from './m07-ol-route.mjs';
const [mode, gid, port = '3098', npc = 'adaeze_okafor', arg = ''] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
const OPS = ['adaeze_okafor', 'gwen_pritchard'];
const snap = () => ev(h, (ids) => {
  const gs = window.__test.getState();
  const o = {};
  for (const i of ids) {
    const s = window.__test.needs.state(i);
    if (!s) { o[i] = { state: null, vis: window.npcBehaviorManager.getBehavior(i)?.sprite?.visible ?? null }; continue; }
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
const usingCooler = s => OPS.every(i => s[i].job && s[i].job[2] === "using" && s[i].x >= 360 && s[i].x <= 460 && s[i].y >= 225 && s[i].y <= 265);
const shot = name => h.page.screenshot({ path: `tmp/m07-s3-${name}-${gid}.png` });
const logTail = (from) => ev(h, (f) => window.__test.needs.log().slice(f).map(e => JSON.stringify(e).slice(0, 160)), from);
const bg = () => ev(h, () => { const m = window.MinigameFramework?.currentMinigame; return m ? { bg: m.background ?? null, ui: m.ui?.background ?? null } : null; });
// A seated operator's chair box (40 px wide, 19 px left of her sprite centre) sits under the centre aim
// point that interact(id) picks, so the click can open the chair bark ("A chair.") instead of the chat.
// Talk the way a player would: stand beside her and click her body, 12 px right of centre.
const talkTo = async (id) => {
  await ev(h, (i) => window.__test.moveToNear(i), id);
  await h.t(500);
  return ev(h, (i) => { const sp = window.npcBehaviorManager.getBehavior(i).sprite; return window.__test.clickAt(Math.round(sp.x) + 12, Math.round(sp.y)); }, id);
};
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
  const blk = () => ev(h, () => { const st = window.__test.getState(); const dom = [...document.querySelectorAll('[id*=popup],[class*=popup],[id*=modal],[class*=modal],[class*=minigame],[id*=phone],[class*=dialog]')].filter(e => e.offsetParent !== null).map(e => (e.id || e.className).toString().slice(0, 50) + '|' + (e.innerText || '').replace(/\s+/g, ' ').slice(0, 90)).slice(0, 5); return { blockingUi: st.blockingUi ?? null, mg: st.activeMinigame ? (st.activeMinigame.id || 'open') : null, dom }; });
  log('blk t' + T(), await blk());
  while (T() < 240 && (await ev(h, () => { const st = window.__test.getState(); return !!(st.blockingUi || st.activeMinigame); }))) { log('blk t' + T(), JSON.stringify(await blk()).slice(0, 260)); await ev(h, () => window.__test.dismissBlockingUi()); await h.t(1500); }
  log('blocking cleared at T', T());
  let it = await talkTo(npc);
  log('interact', { ok: it?.ok, menu: it?.menu ? 'open' : null });
  await h.t(2500); await shot(`talk1-${npc}`); log('chat1 bg', await bg());
  const r1 = await converse(h, '.', 40);
  const tClose = T();
  log('chat1', { closed: r1.closed, lines: r1.lines, picked: r1.picked, fail: r1.fail || null, closeAtT: tClose });
  const hit = await watch(tClose + 120, usingCooler, 'after-chat1');
  log('chat1 close to first job (s)', firstJobAt === null ? null : firstJobAt - tClose);
  log('chat1 close to both-using (s)', hit === null ? null : hit - tClose);
  await h.t(3000);
  const it2 = await talkTo(npc);
  log('interact2', { ok: it2?.ok, menu: it2?.menu ? 'open' : null });
  await h.t(2500); await shot(`talk2-${npc}`); log('chat2 bg', await bg());
  const r2 = await converse(h, '.', 40);
  log('chat2', { closed: r2.closed, lines: r2.lines, fail: r2.fail || null });
  const lg = await logTail(L0);
  log('needs log since entry', lg);
  log('no_beside_cell count', lg.filter(x => /no_beside_cell/.test(x)).length);
}

if (mode === 'ex') {
  // Natural trips only (no needs.set: the brief forbids forcing needs). Prints each world bubble once
  // (speaker, event, text) and each change to the ex_/heard_ globals, so a repeat shows up as a second line.
  const endAt = Number(arg) || 420;
  if (process.env.PARK) { for (let i = 0; i < 12; i++) { const b = await ev(h, () => window.__test.getState().blockingUi || null); if (!b) break; await ev(h, () => window.__test.dismissBlockingUi()); await h.t(800); } const [px, py] = process.env.PARK.split(',').map(Number); log('park', await ev(h, ([x, y]) => window.__test.moveTo(x, y, { timeoutMs: 25000 }).then(r => ({ ok: r?.ok, feetAt: r?.feetAt })), [px, py])); }
  const seen = new Set();
  let prevG = ''; let prevUsing = false; const trips = [];
  while (T() < endAt) {
    const s = await snap();
    const u = usingCooler(s);
    if (u && !prevUsing) { trips.push(T()); log('both-using-cooler t' + T(), {}); }
    prevUsing = u;
    const bl = await ev(h, () => (window.npcWorldBubbles?.log || []).map(e => ({ t: e.t, npc: e.npcId, ev: e.event, text: e.text })));
    for (const e of bl) { const k = JSON.stringify(e); if (!seen.has(k)) { seen.add(k); log('bubble', e); } }
    const nl = await ev(h, () => window.__test.needs.log().map(e => ({ t: e.t, npc: e.npc, ev: e.ev, knot: e.knot || null, complete: e.complete ?? null, with: e.with || null })));
    for (const e of nl) { const k = 'N' + JSON.stringify(e); if (!seen.has(k)) { seen.add(k); if (/exchange|going|speak|call/.test(e.ev) || /ex_/.test(e.knot || '')) { log('need-event', e); await shot(`ex-${e.ev}-${seen.size}`); } } }
    const g = await ev(h, () => { const gl = window.__test.getState().globals || {}; return Object.fromEntries(Object.entries(gl).filter(([k]) => /heard|ex_|last_two|going|ops_staff/.test(k))); });
    const gk = JSON.stringify(g);
    if (gk !== prevG) { log('globals t' + T(), g); prevG = gk; }
    await h.t(1000);
  }
  log('both-using starts (s from entry)', trips);
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


if (mode === 'atk') {
  // arg: walk-adaeze | seat-gwen | cool-adaeze. Punches with the real playerCombat.attack (as m01-ol-music does).
  const [when, who] = arg.split('-');
  const target = who === 'gwen' ? 'gwen_pritchard' : 'adaeze_okafor';
  const other = OPS.find(i => i !== target);
  const home = await snap();
  log('home', { target: home[target].x + ',' + home[target].y, other: home[other].x + ',' + home[other].y });
  if (when === 'cool') await watch(T() + 200, usingCooler, 'atk-wait-cool');
  if (when === 'walk') await watch(T() + 200, s => s[target].job && s[target].job[2] === 'goto_target', 'atk-wait-walk');
  const pre = await snap();
  log('attack start', { t: T(), target: pre[target].job, other: pre[other].job });
  let ko = false; let n = 0;
  for (; n < 40 && !ko; n++) {
    await ev(h, (i) => window.__test.moveToNear(i), target);
    await ev(h, (i) => { const s = window.npcBehaviorManager.getBehavior(i).sprite; window.playerCombat.attack({ x: s.x, y: s.y }); }, target);
    await h.t(450);
    ko = await ev(h, (i) => window.npcHostileSystem.isNPCKO(i), target);
    if (n < 3 || !ko) {
      const pp = await ev(h, (o) => { const p = window.player; return { px: Math.round(p.x), py: Math.round(p.y + 31), dir: p.lastDirection, oh: window.npcHostileSystem.isNPCHostile(o), hp: window.playerCombat?.playerHealth ?? null }; }, other);
      if (n < 3 || pp.oh) { log('punch ' + n, pp); if (pp.oh) break; }
    }
  }
  log('punches', { n, ko, hostile: await ev(h, (i) => window.npcHostileSystem.isNPCHostile(i), target) });
  await shot(`atk-${when}-${who}-ko-${gid}`);
  const koAt = T();
  // Watch 60 s after the KO: does the other operator walk home, does anyone start a cooler job?
  const jobs = [];
  for (let k = 0; k < 60; k++) {
    const s = await snap();
    const kk = JSON.stringify(OPS.map(i => [s[i].m, s[i].job && s[i].job[0], s[i].job && s[i].job[2], s[i].x, s[i].y]));
    if (!jobs.length || jobs[jobs.length - 1][1] !== kk) jobs.push([T(), kk]);
    await h.t(1000);
  }
  for (const j of jobs) log('after-ko t' + j[0], j[1]);
  const fin = await snap();
  const g = await ev(h, () => { const gl = window.__test.getState().globals || {}; return Object.fromEntries(Object.entries(gl).filter(([k]) => /upset|ops_staff|hostile|ko/.test(k))); });
  log('globals', g);
  log('state', { ko: await ev(h, (i) => window.npcHostileSystem.isNPCKO(i), target), hostile: await ev(h, (i) => window.npcHostileSystem.isNPCHostile(i), target),
    otherHostile: await ev(h, (i) => window.npcHostileSystem.isNPCHostile(i), other), targetPos: fin[target].x + ',' + fin[target].y, home: home[target].x + ',' + home[target].y,
    otherPos: fin[other].x + ',' + fin[other].y, blockingUi: await ev(h, () => window.__test.getState().blockingUi ?? null) });
  log('bubbles', await ev(h, () => (window.npcWorldBubbles?.log || []).slice(-8).map(e => ({ t: e.t, npc: e.npcId, text: e.text }))));
  log('needs log since entry', await logTail(L0));
}

if (mode === 'reload') {
  // arg: 'pre' = reload on the ops floor before the server room. Both sample before and after the reload.
  await ev(h, () => window.__test.enterRoom('operations_floor', { timeoutMs: 20000 }));
  await h.t(40000);
  log('before reload', await snap());
  await shot('reload-before-' + gid);
  await h.page.reload({ waitUntil: 'load' });
  await h.t(6000);
  await ev(h, () => window.__test.waitUntilReady ? window.__test.waitUntilReady({ timeoutMs: 30000 }) : null);
  log('after reload, room', await ev(h, () => window.__test.getState().currentRoom ?? null));
  await ev(h, () => window.__test.enterRoom('operations_floor', { timeoutMs: 20000 }));
  await h.t(15000);
  log('after reload, ops floor', await snap());
  await shot('reload-after-' + gid);
}

// Part 4 modes. l6: route to server_room, check both hidden, walk back, check none seated. arg 'reload' also reloads after.
// ko: KO one operator (arg adaeze|gwen) then route. pre: reload on ops floor before the server room.
const hiddenNow = () => ev(h, (ids) => Object.fromEntries(ids.map(i => { const b = window.npcBehaviorManager.getBehavior(i); const sp = b?.sprite; const st = window.__test.needs.state(i); return [i, { vis: sp?.visible ?? null, active: sp?.active ?? null, hasSprite: !!sp, seat: !!b?._seat, state: st ? st.mode : null, x: sp ? Math.round(sp.x) : null, y: sp ? Math.round(sp.y) : null }]; })), OPS);
const waitReady = async () => { await h.page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body && window.npcNeedsSystem, null, { timeout: 90000 }); await h.t(2000);
  // A real reload shows the session-resume overlay over the title screen: pick Resume, as a player would.
  const rb = await h.page.$('#session-resume-btn'); if (rb) { await rb.click(); log('clicked Resume', true); await h.t(6000); }
  for (let i = 0; i < 20; i++) { const b = await ev(h, () => window.__test.getState().blockingUi || null); if (!b) break; await ev(h, () => window.__test.dismissBlockingUi()); await h.t(800); } };
const toOps = async () => { for (let i = 0; i < 4; i++) { const r = await ev(h, () => window.__test.enterRoom('operations_floor', { timeoutMs: 20000 })); log('enter ops try ' + i, { ok: r?.ok, reason: r?.reason }); if (!r?.ok) log('  ui', await ev(h, () => { const g = window.__test.getState(); return { am: g.activeMinigame ? JSON.stringify(g.activeMinigame).slice(0, 200) : null, blk: g.blockingUi || null, which: window.__test.minigame.which() }; })); if (r && r.ok) return true; await h.t(2500); } return false; };
const clearUi = async () => { for (let i = 0; i < 20; i++) { const mgOpen = await ev(h, () => !!window.__test.minigame.which()); if (mgOpen) { await ev(h, () => window.__test.minigame.close()); await h.t(800); } const b = await ev(h, () => window.__test.getState().blockingUi || null); if (!b && !mgOpen) return; if (!b) continue; await ev(h, () => window.__test.dismissBlockingUi()); await h.t(800); } };
const opsReady = async () => { await h.t(3000); for (let i = 0; i < 40; i++) { const st = await ev(h, (ids) => ids.every(x => window.__test.needs.state(x) != null), OPS); if (st) return true; await h.t(1000); } return false; };

if (mode === 'ko') {
  const target = arg === 'gwen' ? 'gwen_pritchard' : 'adaeze_okafor';
  const other = OPS.find(i => i !== target);
  await opsReady();
  log('start', await snap());
  let ko = false; let n = 0;
  for (; n < 40 && !ko; n++) {
    await ev(h, (i) => window.__test.moveToNear(i), target);
    await ev(h, (i) => { const s = window.npcBehaviorManager.getBehavior(i).sprite; window.playerCombat.attack({ x: s.x, y: s.y }); }, target);
    await h.t(450);
    ko = await ev(h, (i) => window.npcHostileSystem.isNPCKO(i), target);
    const pp = await ev(h, (o) => { const p = window.player; return { px: Math.round(p.x), py: Math.round(p.y + 31), oh: window.npcHostileSystem.isNPCHostile(o) }; }, other);
    if (n < 3 || pp.oh) log('punch ' + n, pp);
    if (pp.oh) break;
  }
  log('ko result', { n, ko, otherHostile: await ev(h, (i) => window.npcHostileSystem.isNPCHostile(i), other) });
  await shot('ko-before-route');
  await h.t(2000);
}
if (mode === 'l6' || mode === 'ko' || mode === 'pre2') {
  if (mode !== 'ko') { await opsReady(); log('ops start', await hiddenNow()); }
  const mg = await route(h, (k, v) => log(k, v));
  await clearUi();
  const room = await ev(h, () => window.currentPlayerRoom);
  log('in room', room);
  await h.t(2000);
  log('server room: operators', await hiddenNow());
  await shot('server-room');
  if (room === 'server_room') {
    await toOps(); await clearUi(); await h.t(4000);
    log('back on ops floor', await hiddenNow()); log('snap', await snap());
    await shot('ops-after-server');
    if (arg === 'reload' || mode === 'pre2') {
      await h.page.reload({ waitUntil: 'load' }); await waitReady();
      log('after reload room', await ev(h, () => window.currentPlayerRoom || null));
      await clearUi(); await toOps(); await clearUi(); await opsReady(); await h.t(8000);
      log('after reload, ops floor', await hiddenNow()); await shot('ops-after-reload');
    }
  }
}
if (mode === 'pre') {
  await opsReady(); await h.t(20000);
  log('before reload', await snap());
  await h.page.reload({ waitUntil: 'load' }); await waitReady();
  log('room after reload', await ev(h, () => window.currentPlayerRoom || null));
  await clearUi(); await toOps(); await clearUi();
  log('right after entry', await hiddenNow());
  const ok = await opsReady();
  log('needs.state non-null', ok);
  await h.t(5000);
  log('after reload snap', await snap()); await shot('reload-pre');
}
if (mode === 'walk2') {
  // west door -> supervisor's desk -> east door. arg post | cool
  await opsReady(); await clearUi();
  if (arg === 'cool') await watch(T() + 200, usingCooler, 'walk-wait-cool');
  log('start', await snap());
  log('objects', await ev(h, () => Object.values(window.rooms.operations_floor.objects || {}).filter(o => /desk|supervis|chair|cooler/i.test((o.scenarioData?.name || '') + (o.scenarioData?.id || ''))).map(o => [o.scenarioData?.id || o.scenarioData?.name, Math.round(o.x), Math.round(o.y)]).slice(0, 14)));
  const doors = await ev(h, () => window.__test.doorways('operations_floor'));
  const list = (Array.isArray(doors) ? doors : Object.values(doors || {})).map(d => d.id);
  log('doors', list);
  const west = list.find(id => /operations_floor->security_checkpoint/.test(id));
  const east = list.find(id => /operations_floor->server_room/.test(id));
  const r1 = await ev(h, () => window.__test.moveTo(346, 82, { timeoutMs: 25000 })); log('to west door', { ok: r1?.ok, feetAt: r1?.feetAt, reason: r1?.reason });
  const [dx, dy] = (process.env.DESK || '440,230').split(',').map(Number);
  const r2 = await ev(h, ([x, y]) => window.__test.moveTo(x, y, { timeoutMs: 25000 }), [dx, dy]); log('to desk ' + dx + ',' + dy, { ok: r2?.ok, feetAt: r2?.feetAt, reason: r2?.reason });
  const r3 = await ev(h, (id) => window.__test.moveToNear(id), east); log('to east door', { ok: r3?.ok, feetAt: r3?.feetAt, reason: r3?.reason });
  await shot('walk2-' + arg); log('end', await snap());
}

log('errs', h.errs.filter(e => !/503/.test(e)).slice(0, 8));
await h.browser.close();
