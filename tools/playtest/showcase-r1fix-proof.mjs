// R1 fixes live proof for office_life_showcase (BUILD_REPORT "R1 fixes: live proof").
// Two games, one mode each:
//   PORT=3094 node tools/playtest/showcase-r1fix-proof.mjs b1 <gameId>    check 1 (B1)
//   PORT=3094 node tools/playtest/showcase-r1fix-proof.mjs talk <gameId>  checks 2 to 5
// Checks 2 to 5 share one game: the Ama and Chidi talks (M1, M2), the morning and midday
// try-next lines, and the tour_notice board, in that order. Each check writes its evidence
// (dialogue lines, choices offered, globals, task status, Zainab's job) to tmp/r1fix/.
// Keyless server, headless, setFPS(20) with fixed steps on (lib load), POST /tts aborted by
// the lib's URL predicate, reload only with page.reload() at least 20 s after the last talk.
import fs from 'node:fs';
import { start, ev, dlg, waitAtPost, NPCS, OUT, nearNpc, closeChat, toKitchen, toOffice } from './showcase-s4-lib.mjs';
import { dismiss } from './m01-ol-lib.mjs';

const [mode, gid] = process.argv.slice(2);
if (!['b1', 'talk'].includes(mode) || !gid) {
  console.error('usage: PORT=3094 node tools/playtest/showcase-r1fix-proof.mjs b1|talk <gameId>');
  process.exit(2);
}
const R = { mode, gid, checks: {} };
const shot = (h, n) => h.page.screenshot({ path: `${OUT}/r1fix-${n}.png` });
const gv = (h, k) => ev(h, k => window.gameState.globalVariables[k], k);
const taskSt = (h, t) => ev(h, t => window.objectivesManager.getTask(t)?.status ?? null, t);
const zainabJob = h => ev(h, () => {
  const s = window.__test.needs.state('zainab_hussain');
  const j = s?.job;
  return { atPost: !!s?.atPost, job: j ? `${j.need || j.kind}:${j.targetId}:${j.phase}` : null };
});
const body = d => (d.text || '').split('\n').map(x => x.trim()).filter(x => x && !/^(×|Skip)$/.test(x));

// Open a person's chat and step through it. `picks` are regex sources for the choices to take in
// order. Stops when the chat closes, or when every pick is used and a choice list is showing.
async function talk(h, id, picks, { snap = {}, beforePick = null } = {}) {
  await nearNpc(h, id);
  const r = await ev(h, id => window.__test.interact(id), id).catch(e => ({ ok: false, err: String(e) }));
  await h.t(1500);
  const lines = [], choicesSeen = [];
  let pi = 0, stop = 'timeout';
  for (let i = 0; i < 70; i++) {
    const d = await dlg(h);
    if (!d.active) { stop = 'closed'; break; }
    for (const l of body(d)) if (!lines.includes(l)) lines.push(l);
    if (d.controls.some(c => /^\d\./.test(c))) {
      choicesSeen.push(d.controls);
      if (pi >= picks.length) { stop = 'choices'; break; }
      if (beforePick) await beforePick(pi, h);
      if (snap[pi]) await shot(h, snap[pi]);
      const p = await ev(h, p => window.__test.minigame.chooseMatching(p), picks[pi]);
      if (!p?.ok) { stop = `nochoice:${picks[pi]}`; lines.push(`NO CHOICE ${picks[pi]}: ${d.controls.join(' | ')}`); break; }
      pi++;
      await h.t(900);
      continue;
    }
    await h.page.keyboard.press('Space');
    await h.t(900);
  }
  return { interact: r?.ok ?? r, picked: pi, stop, lines, choicesSeen };
}

// Reload exactly as a player does (same settle as the BC1 probe, without the staff hold).
async function reloadGame(h) {
  await h.page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await h.page.waitForFunction(() => {
    const ov = document.getElementById('session-resume-overlay');
    return (ov && getComputedStyle(ov).display !== 'none') || (window.player && window.player.body);
  }, null, { timeout: 90000 });
  const resumed = await h.page.evaluate(() => {
    const ov = document.getElementById('session-resume-overlay');
    const btn = document.getElementById('session-resume-btn');
    if (ov && getComputedStyle(ov).display !== 'none' && btn && !btn.disabled) { btn.click(); return true; }
    return false;
  });
  if (resumed) await h.t(1000);
  await h.page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body && window.npcNeedsSystem, null, { timeout: 90000 });
  await h.t(2000);
  await dismiss(h);
  await h.page.evaluate(() => {
    const loop = window.game.sys.game.loop, raf = loop.raf;
    if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); }
    loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20);
  });
  await h.t(3000);
}

// ---- check 1: B1, evening turn while Zainab is at the office coffee machine ----
async function checkB1(h) {
  const C = R.checks.b1 = { check: 'B1: evening turn during office-coffee use' };
  await toKitchen(h);
  await toOffice(h);
  C.kitchenSeen = await gv(h, 'kitchen_seen');
  C.lunch = await talk(h, 'ama_owusu', ["Let's do lunch"]);
  await closeChat(h);
  C.actMidday = await gv(h, 'act_midday');
  // Stand by Ama so the turn needs no walk, then send Zainab to the office machine.
  await nearNpc(h, 'ama_owusu');
  await ev(h, () => window.__test.needs.set('zainab_hussain', 'caffeine', 10));
  C.timeline = [];
  let last = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 90000) {
    const j = await zainabJob(h);
    const key = JSON.stringify(j);
    if (key !== last) { last = key; C.timeline.push({ s: +((Date.now() - t0) / 1000).toFixed(1), ...j }); }
    if (j.job && /:using$/.test(j.job)) break;
    await h.t(250);
  }
  C.jobBeforeTurn = await zainabJob(h);
  await shot(h, 'b1-zainab-before-turn');
  // The turn is the "Yes" at the confirm; record Zainab's state just before that press.
  C.jobAtTurn = null;
  C.turn = await talk(h, 'ama_owusu', ['Call it a day', 'Yes, call it a day'], {
    beforePick: async (i) => { if (i === 1) C.jobAtTurn = await zainabJob(h); },
  });
  C.actEvening = await gv(h, 'act_evening');
  C.taskAtTurn = await taskSt(h, 'see_who_stays');
  await closeChat(h);
  await h.t(1000);
  await shot(h, 'b1-evening-turn');
  C.afterTimeline = [];
  last = null;
  const t1 = Date.now();
  while (Date.now() - t1 < 90000) {
    const st = await taskSt(h, 'see_who_stays');
    const j = await zainabJob(h);
    const key = JSON.stringify({ st, j });
    if (key !== last) { last = key; C.afterTimeline.push({ s: +((Date.now() - t1) / 1000).toFixed(1), task: st, ...j }); }
    if (st === 'completed') break;
    await h.t(300);
  }
  C.taskFinal = await taskSt(h, 'see_who_stays');
  await shot(h, 'b1-see-who-stays');
  const inUse = C.jobAtTurn?.job || '';
  C.verdict = C.taskFinal === 'completed' && C.actEvening === true && /office_coffee/.test(inUse)
    ? (/:using$/.test(inUse) ? 'PASS (Zainab mid-use at the turn)' : `PASS (Zainab at office_coffee, phase at turn: ${inUse})`)
    : 'NOT PROVEN (see timeline)';
}

// ---- checks 5, 2, 3, 4 on one game ----
async function checkTalk(h) {
  // Check 5: the tour_notice board.
  const B = R.checks.board = { check: 'tour_notice board is readable' };
  B.move = await ev(h, () => window.__test.moveToNear('tour_notice', { timeoutMs: 30000 })).then(() => 'ok', e => String(e));
  const ir = await ev(h, () => window.__test.interact('tour_notice')).catch(e => ({ ok: false, err: String(e) }));
  await h.t(1500);
  B.interact = ir?.ok ?? ir;
  B.snippet = await ev(h, () => { const t = document.body.innerText; const i = t.indexOf('THINGS TO TRY'); return i >= 0 ? t.slice(i, i + 260) : null; });
  await shot(h, 'board');
  await h.page.keyboard.press('Escape');
  await h.t(600);
  await ev(h, () => window.__test.dismissBlockingUi?.()).catch(() => {});
  await h.t(400);
  B.verdict = B.snippet && /Morning:/.test(B.snippet) ? 'PASS' : 'FAIL';

  // Check 2 (M1): Ama, then a staff greeting; each first talk, then re-talk, then after a reload.
  const M = R.checks.m1 = { check: 'M1: met_* guard on re-talk and after reload' };
  M.amaFirst = await talk(h, 'ama_owusu', ["I'll have a look round"]);
  await closeChat(h);
  await h.t(1000);
  M.amaReopen = await talk(h, 'ama_owusu', ["I'll have a look round"], { snap: { 0: 'm1-ama-reopen-hub' } });
  await closeChat(h);
  M.chidiFirst = await talk(h, 'chidi_okeke', ["I'll let you get on"]);
  await closeChat(h);
  await h.t(1000);
  M.chidiReopen = await talk(h, 'chidi_okeke', ["I'll let you get on"], { snap: { 0: 'm1-chidi-reopen-hub' } });
  await closeChat(h);
  await h.t(22000);
  M.reloadAt = await gv(h, 'act_evening');
  await reloadGame(h);
  M.amaAfterReload = await talk(h, 'ama_owusu', ["I'll have a look round"], { snap: { 0: 'm1-ama-after-reload' } });
  await closeChat(h);
  await h.t(1000);
  M.chidiAfterReload = await talk(h, 'chidi_okeke', ["I'll let you get on"]);
  await closeChat(h);
  const hasAll = (arr, re) => arr.some(l => re.test(l));
  M.verdict = hasAll(M.amaFirst.lines, /Today you watch an office/) &&
    [M.amaReopen, M.amaAfterReload].every(t => hasAll(t.lines, /What can I help with/) && !hasAll(t.lines, /Today you watch|Everyone here is driven/)) &&
    hasAll(M.chidiFirst.lines, /Hiya/) && hasAll(M.chidiReopen.lines, /Still here, still busy/) && !hasAll(M.chidiReopen.lines, /Hiya/) &&
    hasAll(M.chidiAfterReload.lines, /Still here, still busy/) && !hasAll(M.chidiAfterReload.lines, /Hiya/)
    ? 'PASS' : 'FAIL';

  // Check 4a: morning try-next after kitchen_seen shows A32.
  const T1 = R.checks.tryNextMorning = { check: 'try-next morning after kitchen_seen (A32)' };
  await toKitchen(h);
  await toOffice(h);
  T1.kitchenSeen = await gv(h, 'kitchen_seen');
  T1.talk = await talk(h, 'ama_owusu', ['What should I try next']);
  await shot(h, 'trynext-morning');
  await closeChat(h);
  T1.verdict = T1.kitchenSeen === true && hasAll(T1.talk.lines, /You've seen the kitchen/) ? 'PASS' : 'FAIL';

  // Lunch, then check 4b: midday try-next shows A33.
  R.lunch = await talk(h, 'ama_owusu', ["Let's do lunch"]);
  await closeChat(h);
  const T2 = R.checks.tryNextMidday = { check: 'try-next midday (A33)' };
  T2.actMidday = await gv(h, 'act_midday');
  T2.talk = await talk(h, 'ama_owusu', ['What should I try next']);
  await shot(h, 'trynext-midday');
  await closeChat(h);
  T2.verdict = T2.actMidday === true && hasAll(T2.talk.lines, /Once the cake is gone, tell me to call it a day/) ? 'PASS' : 'FAIL';

  // Check 3 (M2): "Call it a day" offers the confirm; "Not yet" returns to the hub; "Yes" runs A17/A18.
  const Q = R.checks.m2 = { check: 'M2: call it a day confirm (A31), not yet, yes (A17/A18)' };
  Q.notYet = await talk(h, 'ama_owusu', ['Call it a day', 'Not yet'], { snap: { 1: 'm2-confirm' } });
  Q.actEveningAfterNotYet = await gv(h, 'act_evening');
  Q.hubAfterNotYet = Q.notYet.stop === 'choices' && Q.notYet.choicesSeen.some(c => c.some(x => /Call it a day/.test(x)));
  await closeChat(h);
  Q.yes = await talk(h, 'ama_owusu', ['Call it a day', 'Yes, call it a day'], { snap: { 1: 'm2-confirm-yes-offered' } });
  Q.actEveningAfterYes = await gv(h, 'act_evening');
  await h.t(1000);
  await shot(h, 'm2-after-yes');
  const offered = Q.notYet.choicesSeen.some(c => c.some(x => /Yes, call it a day/.test(x)) && c.some(x => /Not yet/.test(x)));
  Q.verdict = hasAll(Q.notYet.lines, /Once they go home, they're gone for the day/) && offered && Q.hubAfterNotYet && Q.actEveningAfterNotYet === false &&
    hasAll(Q.yes.lines, /Right\. Home time/) && hasAll(Q.yes.lines, /Have a wander/) && Q.actEveningAfterYes === true
    ? 'PASS' : 'FAIL';
}

const h = await start(gid);
try {
  for (const id of NPCS) await waitAtPost(h, id, 60000);
  await h.t(1500);
  if (mode === 'b1') await checkB1(h);
  else await checkTalk(h);
  R.errs = h.errs.filter(e => !/ERR_FAILED|503/.test(e)).slice(0, 10);
} catch (e) {
  R.fatal = String(e).slice(0, 400);
} finally {
  fs.mkdirSync('tmp/r1fix', { recursive: true });
  fs.writeFileSync(`tmp/r1fix/proof-${mode}-${gid}.json`, JSON.stringify(R, null, 1));
  console.log(JSON.stringify(R, null, 1));
  await h.browser.close();
}
