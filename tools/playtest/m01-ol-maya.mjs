// Step 5 / test 14: Maya's trip and its privacy guards, one route per run.
//   node tools/playtest/m01-ol-maya.mjs <route> <gameId> [port]
// Routes: post, tipoff, tellall, topicchoices, getstarted, inout, away, attack
// Headless, setFPS(20), fixed steps on. Never setManualClock. A null needs state counts as at post.
import { open, load, ev, dlg, converse, waitAtPost, dismiss } from './m01-ol-lib.mjs';
const [route, gid, port = '3094'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
const G = () => ev(h, () => { const g = window.gameState?.globalVariables || {}; return { away: g.maya_away, settled: g.maya_settled, disc: g.discussed_operation, ko: g.maya_ko }; });
const mst = () => ev(h, () => { const s = window.__test.needs.state('maya_chen'); const sp = window.npcBehaviorManager?.getBehavior('maya_chen')?.sprite; return { mode: s?.mode, atPost: s?.atPost, job: s?.job ? { obj: s.job.objectId, phase: s.job.phase } : null, room: window.npcManager?.getNPC?.('maya_chen')?.roomId, x: sp ? +(sp.body.center.x / 32).toFixed(1) : null, y: sp ? +(sp.body.center.y / 32).toFixed(1) : null, room_p: window.currentPlayerRoom }; });
const talk = async () => { const r = await ev(h, () => window.__test.interact('maya_chen')); await h.t(1500); return r; };
const esc = async () => { await h.page.keyboard.press('Escape'); await h.t(900); const d = await dlg(h); if (d.active) { await h.page.keyboard.press('Escape'); await h.t(700); } return !(await dlg(h)).active; };
const lastLines = async () => (await dlg(h)).text;
// advance with Space until the dialogue shows choices or closes; return text history
async function toChoices(max = 25) { const seen = []; for (let i = 0; i < max; i++) { const d = await dlg(h); if (!d.active) return { closed: true, seen }; const t = (d.text || '').split('\n').filter(x => x.trim() && !/^(×|Skip)/.test(x.trim())); const l = t[t.length - 1]; if (l && !seen.includes(l)) seen.push(l); if (d.controls.some(c => /^\d\./.test(c))) return { closed: false, seen, choices: d.controls }; await h.page.keyboard.press('Space'); await h.t(800); } return { seen, timeout: true }; }
const pick = async re => { const r = await ev(h, p => window.__test.minigame.chooseMatching(p), re); await h.t(900); return r?.ok; };
async function followMaya(maxMs = 20000) { const t0 = Date.now(); while (Date.now() - t0 < maxMs) { const m = await mst(); if (m.job || m.mode !== 'idle') return m; await h.t(300); } return await mst(); }

const go = async (...rooms) => { for (const r of rooms) { const x = await ev(h, async r => await window.__test.enterRoom(r), r); if (!x.ok) log('enterRoom failed', { r, reason: x.reason }); await h.t(1200); } };
// Games start in main_office_area (so the cooler's room is loaded); walk to her office the real way
if (route !== 'post') await go('hallway_east', 'maya_office'); else await go('hallway_east', 'maya_office');
async function tripAndAway() {
  const sample = async (label) => log(label, await mst());
  let m = await mst(); const t0 = Date.now(); while (Date.now() - t0 < 6000 && !m.job) { await h.t(300); m = await mst(); }
  await sample('trip state');
  await go('hallway_east');
  await h.t(1500); await sample('player in hallway_east');
  // talk to her while she walks / waits / is at the cooler
  for (let k = 1; k <= 3; k++) {
    const r = await ev(h, () => window.__test.interact('maya_chen')); await h.t(1500);
    const d = await dlg(h);
    log(`away talk ${k}`, { ok: r?.ok, reason: r?.reason, m: await mst(), g: await G(), text: d.text, controls: d.controls });
    if (d.active) { const c = await toChoices(); log(`away talk ${k} choices`, c); await esc(); }
    await h.t(2500);
    if (k === 1) { await go('main_office_area'); await h.t(2000); }
  }
  await h.page.screenshot({ path: 'tmp/m01-maya-away.png' });
  // reload while away, talk again
  await load(h); await h.t(3000);
  const r2 = await ev(h, () => window.__test.interact('maya_chen')); await h.t(1500);
  const d2 = await dlg(h);
  log('after reload, away talk', { ok: r2?.ok, m: await mst(), g: await G(), text: d2.text, controls: d2.controls });
  if (d2.active) await esc();
  // back to her office: wait for her home, then full hub
  await go('hallway_east', 'maya_office');
  const w = await waitAtPost(h, 'maya_chen', 60000);
  log('back at post', { w, g: await G() });
  const r3 = await ev(h, () => window.__test.interact('maya_chen')); await h.t(1500);
  const c3 = await toChoices(); log('at office talk', { g: await G(), c3 });
  await esc();
}
async function coolerRoute() {
  // quick trip: tell her everything via set, then start the trip through the real mapping path is covered in tipoff;
  // here use the needs control path (same as the mapping's needs.set) with the ink flags set by a real talk.
  await waitAtPost(h, 'maya_chen', 20000);
  await ev(h, () => window.__test.interact('maya_chen')); await h.t(1500);
  let r = await toChoices(); await pick("That's right"); r = await toChoices(); await pick('SAFETYNET sent me'); r = await toChoices(); await pick('Tell me everything'); r = await toChoices(); await pick("okay with that"); r = await toChoices();
  await pick('keep investigating'); await h.t(500); await esc();
  await go('hallway_east', 'main_office_area');
  const t0 = Date.now(); let m = await mst();
  while (Date.now() - t0 < 60000) { m = await mst(); if (m.job?.phase === 'using' || m.mode === 'using' || (m.job && /use/.test(m.job.phase) && m.job.phase !== 'goto_target')) break; await h.t(500); }
  log('at cooler?', m);
  // meanwhile make both extras thirsty to test sharing
  await ev(h, () => { window.__test.needs.set('fatima_begum', 'thirst', 20); window.__test.needs.set('graham_whitfield', 'thirst', 20); });
  await h.t(800);
  const rr = await ev(h, () => window.__test.interact('maya_chen')); await h.t(1500);
  const d = await dlg(h);
  log('cooler talk', { ok: rr?.ok, reason: rr?.reason, text: d.text, controls: d.controls, g: await G() });
  if (d.active) await esc();
  await h.page.screenshot({ path: 'tmp/m01-maya-cooler.png' });
  const share = [];
  for (let i = 0; i < 40; i++) {
    const o = await ev(h, () => ['maya_chen', 'fatima_begum', 'graham_whitfield'].map(id => { const s = window.__test.needs.state(id); return [id, s?.mode, s?.job?.objectId || null, s?.job?.phase || null, s?.avoiding || null]; }));
    share.push(o);
    await h.t(1000);
  }
  const both = share.filter(o => { const mj = o[0][2] === 'office_cooler' && /us/.test(o[0][3] || ''); const ex = o.slice(1).some(x => x[2] === 'office_cooler' && /us/.test(x[3] || '')); return mj && ex; }).length;
  log('samples with Maya and an extra both using', both);
  log('sample first/mid/last', [share[0], share[20], share[39]]);
  // attack her at the cooler (or wherever she is)
  await go('main_office_area');
  const st = await mst(); log('before attack', st);
  await ev(h, () => window.__test.moveToNear('maya_chen', { timeoutMs: 15000 })).catch(() => {});
  let hostile = null;
  for (let i = 0; i < 12; i++) { await ev(h, () => { const s = window.npcBehaviorManager.getBehavior('maya_chen').sprite; window.playerCombat.attack({ x: s.x, y: s.y }); }); await h.t(500); const c = await ev(h, () => ({ h: window.npcHostileSystem.isNPCHostile('maya_chen'), ko: window.npcHostileSystem.isNPCKO('maya_chen'), g: window.gameState.globalVariables.maya_ko, al: window.gameState.globalVariables.m01_staff_alarmed })); if (c.h || c.ko) { hostile = { i: i + 1, c }; break; } await ev(h, () => window.__test.moveToNear('maya_chen', { timeoutMs: 8000 })).catch(() => {}); }
  log('hostile', hostile);
  for (let i = 0; i < 25; i++) { await ev(h, () => { const s = window.npcBehaviorManager.getBehavior('maya_chen').sprite; window.playerCombat.attack({ x: s.x, y: s.y }); }); await h.t(500); const k = await ev(h, () => window.npcHostileSystem.isNPCKO('maya_chen')); if (k) break; await ev(h, () => window.__test.moveToNear('maya_chen', { timeoutMs: 8000 })).catch(() => {}); }
  log('after punches', { ko: await ev(h, () => window.npcHostileSystem.isNPCKO('maya_chen')), g: await G(), m: await mst() });
  await h.page.screenshot({ path: 'tmp/m01-maya-attacked.png' });
}
log('start', { m: await mst(), g: await G() });
if (route === 'post') {
  log('fresh at post', await waitAtPost(h, 'maya_chen', 20000));
  await load(h); await h.t(3000);
  log('after reload at post', { w: await waitAtPost(h, 'maya_chen', 20000), m: await mst() });
}
if (route === 'cooler') await coolerRoute();

// Route inout: quick room changes around her office; maya_away must track and no not_here line plays at her desk.
async function inoutRoute() {
  await waitAtPost(h, 'maya_chen', 20000);
  // enterRoom's pointer pathing gets stuck inside her office (feet at the spawn, "did-not-cross"); real arrow keys cross the door fine, so use them.
  const hold = async (key, ms) => { await h.page.keyboard.down(key); await h.t(ms); await h.page.keyboard.up(key); await h.t(150); };
  const holdUntil = async (key, room, limit = 1800, retried = false) => { await h.page.keyboard.down(key); const t = Date.now(); while (Date.now() - t < limit && (await ev(h, () => window.currentPlayerRoom)) !== room) await h.t(60); await h.page.keyboard.up(key); await h.t(150); if ((await ev(h, () => window.currentPlayerRoom)) !== room && !retried) { await dismiss(h); await hold('ArrowLeft', 150); await holdUntil(key, room, limit, true); } };
  const step = async (label, room) => { const t = Date.now(); await dismiss(h); if (room === 'hallway_east') { const px = await ev(h, () => window.player.body.center.x); if (px > 205) await hold('ArrowLeft', Math.min(600, Math.round((px - 203) / 0.14))); else if (px < 200) await hold('ArrowRight', Math.round((203 - px) / 0.14)); await holdUntil('ArrowDown', 'hallway_east'); } else { await holdUntil('ArrowUp', 'maya_office'); await hold('ArrowUp', 450); } log(label, { ms: Date.now() - t, pos: await ev(h, () => [Math.round(window.player.body.center.x), Math.round(window.player.body.center.y)]), g: await G(), room_p: await ev(h, () => window.currentPlayerRoom) }); };
  const deskTalk = async label => { const r = await ev(h, () => window.__test.interact('maya_chen')); await h.t(1500); const c = await toChoices(); log(label, { ok: r?.ok, reason: r?.reason, g: await G(), seen: c.seen, choices: c.choices, notHere: /not here/i.test(JSON.stringify(c.choices || [])) }); await esc(); };
  await step('hall', 'hallway_east');
  await step('office (away flag should clear)', 'maya_office');
  await deskTalk('desk talk 1 (baseline)');
  const t0 = Date.now();
  await step('A1 out to hall', 'hallway_east');
  await step('A2 back to office', 'maya_office');
  log('A total ms', Date.now() - t0);
  await deskTalk('desk talk after A (expect no Not here)');
  const t1 = Date.now();
  await step('B1 hall', 'hallway_east');
  await step('B2 office', 'maya_office');
  await step('B3 hall', 'hallway_east');
  log('B total ms (expect under 5000)', Date.now() - t1);
  log('after B ends in hall (expect away true)', await G());
  await step('B4 office again', 'maya_office');
  await deskTalk('desk talk after B (expect no Not here)');
  // also main office and back through
  await step('C1 hall', 'hallway_east');
  for (const r of ['main_office_area', 'hallway_east', 'maya_office']) { const x = await ev(h, async r => await window.__test.enterRoom(r), r); await h.t(300); log('C enterRoom ' + r, { ok: x.ok, g: await G(), room_p: await ev(h, () => window.currentPlayerRoom) }); }
  await deskTalk('desk talk after C (expect no Not here)');
}
// Route attack: arm the trip with the real talk, then punch her while she is on it.
async function attackRoute() {
  await waitAtPost(h, 'maya_chen', 20000);
  await ev(h, () => { window.__test.needs.set('fatima_begum', 'thirst', 100); window.__test.needs.set('graham_whitfield', 'thirst', 100); });
  await ev(h, () => window.__test.interact('maya_chen')); await h.t(1500);
  let r = await toChoices(); await pick("That's right"); r = await toChoices(); await pick('SAFETYNET sent me'); r = await toChoices(); await pick('Tell me everything'); r = await toChoices(); await pick("okay with that"); r = await toChoices();
  await pick('keep investigating'); await h.t(500); await esc();
  await go('hallway_east', 'main_office_area');
  const t0 = Date.now(); let m = await mst();
  while (Date.now() - t0 < 40000) { m = await mst(); if (m.room_p === 'main_office_area' && m.room === 'main_office_area' && m.job) break; await h.t(400); }
  log('Maya on trip in main office?', m);
  const punch = async () => { await ev(h, () => { const s = window.npcBehaviorManager.getBehavior('maya_chen').sprite; window.playerCombat.attack({ x: s.x, y: s.y }); }); await h.t(500); };
  let hostile = null;
  for (let i = 0; i < 14; i++) {
    await ev(h, () => window.__test.moveToNear('maya_chen', { timeoutMs: 8000 })).catch(() => {});
    await punch();
    const c = await ev(h, () => ({ h: window.npcHostileSystem.isNPCHostile('maya_chen'), ko: window.npcHostileSystem.isNPCKO('maya_chen'), alarmed: window.gameState.globalVariables.m01_staff_alarmed }));
    if (c.h || c.ko) { hostile = { punches: i + 1, c, m: await mst() }; break; }
  }
  log('hostile after punches', hostile);
  let ko = false;
  for (let i = 0; i < 30 && !ko; i++) { await ev(h, () => window.__test.moveToNear('maya_chen', { timeoutMs: 8000 })).catch(() => {}); await punch(); ko = await ev(h, () => window.npcHostileSystem.isNPCKO('maya_chen')); }
  await h.t(1500);
  log('after KO', { ko, g: await G(), m: await mst(), alarmed: await ev(h, () => window.gameState.globalVariables.m01_staff_alarmed), cooler_off: await ev(h, () => window.__test.needs.state('maya_chen')?.mode) });
  await h.page.screenshot({ path: 'tmp/m01-maya-attack.png' });
  // after KO: can she still be talked to, and does the critical path stay open (door to her office, hall, main office)?
  const tk = await ev(h, () => window.__test.interact('maya_chen')); await h.t(1500);
  log('talk to KO Maya', { tk, d: await dlg(h) });
  await dismiss(h);
  const nav = []; for (const r of ['hallway_east', 'main_office_area']) { const x = await ev(h, async r => await window.__test.enterRoom(r), r); nav.push([r, x.ok]); await h.t(600); }
  log('navigation after attack', nav);
  const st = await ev(h, () => window.__test.getState()); log('game state blocking?', { busy: !!(st.activeMinigame || st.blockingUi) });
}
if (route === 'inout') await inoutRoute();
if (route === 'attack') await attackRoute();
if (route === 'tipoff' || route === 'tellall' || route === 'topicchoices' || route === 'getstarted') {
  await waitAtPost(h, 'maya_chen', 20000);
  log('talk1', (await talk())?.ok);
  let r = await toChoices(); log('opener', r);
  await pick("That's right"); r = await toChoices(); log('after opener', r);
  if (route === 'tipoff') { await pick('What message'); r = await toChoices(); log('reveal', r); await pick('Tell me more'); }
  else { await pick('SAFETYNET sent me'); r = await toChoices(); log('informant', r); await pick('Tell me everything'); }
  // now on the first operation line(s)
  await h.t(600);
  if (route === 'topicchoices') { r = await toChoices(); log('topic choices', { seen: r.seen, choices: r.choices, g: await G() }); }
  else log('first op line', { text: await lastLines(), g: await G() });
  log('esc closed', await esc());
  await h.t(5000);
  log('5s after Esc (expect at post, no trip)', { m: await mst(), g: await G() });
  // reopen
  log('talk2', (await talk())?.ok);
  r = await toChoices(); log('resume', r);
  if (route === 'getstarted') {
    // finish this topic to the hub, then tactical advice and "I'll get started"
    await pick("okay with that"); r = await toChoices(); log('after topic', { seen: r.seen, choices: r.choices, g: await G() });
    log('esc at hub?', 'no, continue'); await pick('What should I do first'); r = await toChoices(); log('tactical', r);
    await pick("I'll get started"); await h.t(2500);
    log('after get started: dialogue', await dlg(h));
    await esc(); await h.t(5000);
    log('5s after I\'ll get started (expect at post)', { m: await mst(), g: await G() });
    log('talk3', (await talk())?.ok);
    r = await toChoices(); log('next talk (expect tail line then hub)', r);
    log('settled at hub', await G());
    await pick('keep investigating'); await h.t(500); await esc(); 
    const t0 = Date.now(); let m = await mst(); while (Date.now() - t0 < 9000 && !m.job) { await h.t(300); m = await mst(); }
    log('trip armed after close at hub', m);
    if (!m.job) { const t1 = Date.now(); while (Date.now() - t1 < 15000 && !m.job) { await h.t(300); m = await mst(); } log('trip after a further 15 s', m); }
    log('diag', await ev(h, () => ({ lv: window.__test.needs.state('maya_chen')?.levels, nlog: window.__test.needs.log(0).filter(e => e.npc === 'maya_chen').slice(-8), dlg: window.__test.minigame.isActive() })));
  } else {
    await pick("okay with that"); r = await toChoices(); log('back at hub choices', { seen: r.seen, choices: r.choices, g: await G() });
    await pick('keep investigating'); await h.t(500); await esc();
    const t0 = Date.now(); let m = await mst(); while (Date.now() - t0 < 9000 && !m.job) { await h.t(300); m = await mst(); }
    log('trip started after close at hub', { m, g: await G(), ms: Date.now() - t0 });
    if (route === 'tipoff') await tripAndAway();
    log('diag', await ev(h, () => ({ lv: window.__test.needs.state('maya_chen')?.levels, nlog: window.__test.needs.log(0).slice(-8) })));
  }
}
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.page.screenshot({ path: `tmp/m01-maya-${route}.png` });
await h.browser.close();
