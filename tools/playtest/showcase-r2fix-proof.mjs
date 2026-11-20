// R2 fixes live proof for office_life_showcase (BUILD_REPORT "R2 fixes: live check").
//   PORT=3094 node tools/playtest/showcase-r2fix-proof.mjs g1 <gameId>
//     game as printed by new-game.rb (heard_exchange_cooler_chat false). Runs, in order:
//     check 3 (tour_notice board fit), check 2 negative (morning try-next gives A7, not A32),
//     lunch, check 4 (Call it a day confirm, Not yet back to hub), the evening turn, then
//     check 1 (office coffee switched off while Zainab walks to it).
//   PORT=3094 node tools/playtest/showcase-r2fix-proof.mjs g2 <gameId>
//     game made with `new-game.rb office_life_showcase --set heard_exchange_cooler_chat=true`.
//     Runs check 2 positive (morning try-next gives A32).
// Keyless server, headless, setFPS(20) with fixed steps on (lib open), POST /tts aborted by the
// lib's URL predicate. Evidence goes to tmp/r2fix/proof-<mode>-<gid>.json and screenshots to
// planning/screens/r2fix-*.png.
import fs from 'node:fs';
import { start, ev, dlg, waitAtPost, NPCS, PORT, OUT, nearNpc, closeChat, toKitchen, toOffice } from './showcase-s4-lib.mjs';
import { dismiss } from './m01-ol-lib.mjs';

const [mode, gid] = process.argv.slice(2);
if (!['g1', 'g2'].includes(mode) || !gid) {
  console.error('usage: PORT=3094 node tools/playtest/showcase-r2fix-proof.mjs g1|g2 <gameId>');
  process.exit(2);
}
const R = { mode, gid, port: PORT, checks: {} };
const shot = (h, n) => h.page.screenshot({ path: `${OUT}/r2fix-${n}.png` });
const gv = (h, k) => ev(h, k => window.gameState.globalVariables[k], k);
const taskSt = (h, t) => ev(h, t => window.objectivesManager.getTask(t)?.status ?? null, t);
const zainabJob = h => ev(h, () => {
  const s = window.__test.needs.state('zainab_hussain');
  const j = s?.job;
  return { atPost: !!s?.atPost, job: j ? `${j.need || j.kind}:${j.targetId}:${j.phase}` : null };
});
const body = d => (d.text || '').split('\n').map(x => x.trim()).filter(x => x && !/^(×|Skip)/.test(x));

// Open a person's chat and step through it. `picks` are substrings of the choices to take in order.
// Every dialogue step is recorded (text, blank flag, pick markers) so blank bubbles can be checked.
// Stops when the chat closes, or when every pick is used and a choice list is showing.
async function talk(h, id, picks, { snap = {} } = {}) {
  await nearNpc(h, id);
  const r = await ev(h, id => window.__test.interact(id), id).catch(e => ({ ok: false, err: String(e) }));
  await h.t(1500);
  const lines = [], steps = [], choicesSeen = [];
  let pi = 0, stop = 'timeout';
  for (let i = 0; i < 70; i++) {
    const d = await dlg(h);
    if (!d.active) { stop = 'closed'; break; }
    const text = body(d).join('\n');
    const hasChoice = d.controls.some(c => /^\d\./.test(c));
    steps.push({ text, blank: !text.trim(), choice: hasChoice });
    for (const l of body(d)) if (!lines.includes(l)) lines.push(l);
    if (hasChoice) {
      choicesSeen.push(d.controls);
      if (pi >= picks.length) { stop = 'choices'; break; }
      if (snap[pi]) await shot(h, snap[pi]);
      const p = await ev(h, p => window.__test.minigame.chooseMatching(p), picks[pi]);
      if (!p?.ok) { stop = `nochoice:${picks[pi]}`; lines.push(`NO CHOICE ${picks[pi]}: ${d.controls.join(' | ')}`); break; }
      steps.push({ pick: picks[pi] });
      pi++;
      await h.t(900);
      continue;
    }
    await h.page.keyboard.press('Space');
    await h.t(900);
  }
  return { interact: r?.ok ?? r, picked: pi, stop, lines, steps, choicesSeen };
}

// Records npc_used / npc_left_post emits and every see_who_stays status change in window.__r2, so a
// tick can be attributed to the event that caused it (the old npc_left_post mapping also ticks it).
async function hookEvents(h) {
  await ev(h, () => {
    const L = window.__r2 = [];
    const t0 = performance.now();
    const add = (k, o) => L.push({ t: Math.round(performance.now() - t0), k, ...o });
    const w = window.npcNeedsSystem.world, ow = w.emit;
    w.emit = function (n, d) { if (/^(npc_used|npc_left_post)/.test(n)) add('world', { n, d: JSON.stringify(d).slice(0, 200) }); return ow.apply(this, arguments); };
    const ed = window.eventDispatcher, oe = ed.emit;
    ed.emit = function (n, d) { if (/^(npc_used|npc_left_post)/.test(n)) add('ed', { n, d: JSON.stringify(d).slice(0, 200) }); return oe.apply(this, arguments); };
    let prev = '__none__';
    setInterval(() => {
      const s = window.objectivesManager?.getTask?.('see_who_stays')?.status ?? null;
      if (s !== prev) { prev = s; add('task', { s }); }
    }, 100);
  });
}

// Click a switch at the office wall socket and answer its confirm ("Switch off" or "Switch on").
async function socket(h, which) {
  await ev(h, () => window.__test.moveToNear('office_coffee_socket', { timeoutMs: 30000 })).catch(() => {});
  const r = await ev(h, id => window.__test.interact(id), 'office_coffee_socket').catch(e => ({ ok: false, err: String(e) }));
  await h.t(700);
  const label = which === 'off' ? 'Switch off' : 'Switch on';
  const clicked = await h.page.evaluate(label => {
    const b = [...document.querySelectorAll('.game-confirm-overlay button')].find(x => x.textContent.trim() === label);
    if (!b) return false;
    b.click();
    return true;
  }, label);
  await h.t(800);
  await dismiss(h).catch(() => {});
  return { interact: r?.ok ?? r, clicked };
}

// ---- check 3: tour_notice board fits the modal with no scroll ----
async function checkBoard(h) {
  const C = { check: 'tour_notice board fits without scrolling' };
  C.move = await ev(h, () => window.__test.moveToNear('tour_notice', { timeoutMs: 30000 })).then(() => 'ok', e => String(e));
  const ir = await ev(h, () => window.__test.interact('tour_notice')).catch(e => ({ ok: false, err: String(e) }));
  C.interact = ir?.ok ?? ir;
  await h.t(1500);
  C.metrics = await h.page.evaluate(() => {
    const d = document.querySelector('.game-display-dialog');
    const b = document.querySelector('.game-display-body');
    if (!d || !b) return null;
    const r = d.getBoundingClientRect();
    return {
      bodyScrollH: b.scrollHeight, bodyClientH: b.clientHeight,
      dialogScrollH: d.scrollHeight, dialogClientH: d.clientHeight,
      dialogTop: Math.round(r.top), dialogBottom: Math.round(r.bottom), viewportH: innerHeight,
      bodyText: b.innerText,
    };
  });
  if (C.metrics) {
    const m = C.metrics;
    await h.page.locator('.game-display-dialog').screenshot({ path: `${OUT}/r2fix-board-modal.png` });
    C.verdict = m.bodyScrollH <= m.bodyClientH && m.dialogScrollH <= m.dialogClientH &&
      m.dialogTop >= 0 && m.dialogBottom <= m.viewportH &&
      /Morning:/.test(m.bodyText) && /Evening:/.test(m.bodyText) && /Walk into the kitchen/.test(m.bodyText)
      ? 'PASS' : 'FAIL';
  } else {
    C.verdict = 'FAIL (no modal found)';
  }
  await h.page.click('.game-display-dialog .game-modal-close').catch(() => {});
  await h.t(600);
  C.modalClosed = await h.page.evaluate(() => !document.querySelector('.game-display-dialog'));
  return C;
}

// ---- check 2: morning "What should I try next?" with the kitchen seen ----
async function checkGate(h, key, expectA32) {
  const C = R.checks[key] = {
    check: expectA32 ? 'A32 gate: kitchen_seen and heard cooler chat gives A32' : 'A32 gate: kitchen_seen without heard cooler chat gives A7 (not A32)',
  };
  await toKitchen(h);
  await toOffice(h);
  C.kitchenSeen = await gv(h, 'kitchen_seen');
  C.heardCooler = await gv(h, 'heard_exchange_cooler_chat');
  C.talk = await talk(h, 'ama_owusu', ['What should I try next']);
  await shot(h, expectA32 ? 'trynext-morning-heard-true' : 'trynext-morning-heard-false');
  await closeChat(h);
  const says = re => C.talk.lines.some(l => re.test(l));
  C.gotA32 = says(/You've seen the kitchen\. Ask me about lunch/);
  C.gotA7 = says(/^Hang about by the water cooler/); // A35 since the voicing dialogue review
  C.verdict = expectA32
    ? (C.kitchenSeen === true && C.heardCooler === true && C.gotA32 && !C.gotA7 ? 'PASS' : 'FAIL')
    : (C.kitchenSeen === true && C.heardCooler === false && C.gotA7 && !C.gotA32 ? 'PASS' : 'FAIL');
  return C;
}

// ---- check 4: "Call it a day." confirm text, then "Not yet." returns to the hub with no blank bubble ----
async function checkCallItADay(h) {
  const C = R.checks.m2 = { check: 'A31 confirm text; Not yet returns to hub, no blank bubble' };
  C.midday = await gv(h, 'act_midday');
  C.notYet = await talk(h, 'ama_owusu', ['Call it a day', 'Not yet'], { snap: { 1: 'm2-confirm' } });
  C.actEveningAfterNotYet = await gv(h, 'act_evening');
  const confirmStep = C.notYet.steps.find(s => s.choice && /The staff won't be back once they've gone home\. Seen everything you wanted\?/.test(s.text || ''));
  C.confirmText = confirmStep ? 'The staff won\'t be back once they\'ve gone home. Seen everything you wanted?' : null;
  C.confirmChoices = C.notYet.choicesSeen.find(c => c.some(x => /Yes, call it a day/.test(x)) && c.some(x => /Not yet/.test(x))) || null;
  const mark = C.notYet.steps.findIndex(s => s.pick === 'Not yet');
  const after = mark >= 0 ? C.notYet.steps.slice(mark + 1) : [];
  C.stepsAfterNotYet = after.map(s => (s.pick ? `[pick ${s.pick}]` : (s.text || '<blank>').slice(0, 80)));
  const hub = after.find(s => !s.pick);
  C.blankAfterNotYet = after.filter(s => !s.pick && s.blank).length;
  // A36: "Not yet." gives exactly one "Take your time." bubble before the hub choices. The bubble text
  // carries the speaker name on its own line, and the choice list is appended to the same bubble,
  // so count only the plain (non-choice) dialogue steps that have the line.
  C.takeYourTimeCount = after.filter(s => !s.pick && !s.choice &&
    (s.text || '').split('\n').some(l => l.trim() === 'Take your time.')).length;
  // The hub after a return from the confirm shows the choice list again (ink jumps to the choice
  // point, so the "What can I help with?" greeting is not reprinted). Judge it on the choices.
  const hubChoices = after.find(s => !s.pick && s.choice && /Call it a day\./.test(s.text || '') && /I'll have a look round/.test(s.text || ''));
  C.hubAfterNotYet = !!hubChoices;
  C.hubStep = hub ? hub.text.slice(-120) : null;
  await shot(h, 'm2-after-not-yet');
  await closeChat(h);
  C.verdict = C.confirmText && C.confirmChoices && C.hubAfterNotYet && C.blankAfterNotYet === 0 && C.takeYourTimeCount === 1 && C.actEveningAfterNotYet === false
    ? 'PASS' : 'FAIL';
  // Now the real "Yes" so the evening turn happens for check 1.
  C.yes = await talk(h, 'ama_owusu', ['Call it a day', 'Yes, call it a day']);
  C.actEveningAfterYes = await gv(h, 'act_evening');
  await h.t(800);
  await dismiss(h).catch(() => {});
  return C;
}

// ---- check 1: evening, office coffee switched off while Zainab walks to it ----
async function checkEveningCoffee(h) {
  const C = R.checks.b1 = { check: 'evening: coffee off while Zainab walks to it; kitchen fallback (see_who_stays usually ticks first via npc_left_post, so the tick does not prove the fallback)', attempts: [] };
  C.actEvening = await gv(h, 'act_evening');
  C.coffeeOffBefore = await gv(h, 'office_coffee_off');
  for (let n = 1; n <= 3; n++) {
    const A = { n, timeline: [] };
    C.attempts.push(A);
    if (await gv(h, 'office_coffee_off')) A.resetOn = await socket(h, 'on');
    A.taskBeforeAttempt = await taskSt(h, 'see_who_stays');
    await ev(h, () => window.__test.needs.set('zainab_hussain', 'caffeine', 10));
    let last = null;
    const t0 = Date.now();
    let switched = false;
    while (Date.now() - t0 < 30000) {
      const j = await zainabJob(h);
      const key = JSON.stringify(j);
      if (key !== last) { last = key; A.timeline.push({ s: +((Date.now() - t0) / 1000).toFixed(1), ...j }); }
      if (j.job && /:office_coffee:goto_target$/.test(j.job)) {
        A.jobAtSwitch = j.job;
        A.taskAtSwitch = await taskSt(h, 'see_who_stays');
        A.switch = await socket(h, 'off');
        A.coffeeOffAfterSwitch = await gv(h, 'office_coffee_off');
        A.jobJustAfterSwitch = await zainabJob(h);
        switched = true;
        break;
      }
      if (j.job && /:office_coffee:using$/.test(j.job)) { A.missed = 'Zainab reached the machine before the switch'; break; }
      await h.t(150);
    }
    if (!switched) {
      A.result = A.missed ? 'missed (probe timing)' : 'never went to the office coffee';
      // Let her finish before the next attempt.
      const t2 = Date.now();
      while (Date.now() - t2 < 40000) {
        const j = await zainabJob(h);
        if (!j.job || !/:office_coffee:/.test(j.job)) break;
        await h.t(400);
      }
      continue;
    }
    last = null;
    const t1 = Date.now();
    // Wait past the tick until Zainab's own kitchen use is logged (npc_used with her caffeine), so the
    // proof shows the use, not only the npc_left_post that ticks the task when she leaves her post.
    const usedKitchen = () => ev(h, () => (window.__r2 || []).some(e => /^npc_used:/.test(e.n || '') && /zainab_hussain/.test(e.d || '') && /"need":"caffeine"/.test(e.d || '')));
    while (Date.now() - t1 < 75000) {
      const j = await zainabJob(h);
      const st = await taskSt(h, 'see_who_stays');
      const key = JSON.stringify({ j, st });
      if (key !== last) { last = key; (A.after ??= []).push({ s: +((Date.now() - t1) / 1000).toFixed(1), task: st, ...j }); }
      if (st === 'completed' && await usedKitchen()) break;
      await h.t(300);
    }
    A.taskFinal = await taskSt(h, 'see_who_stays');
    A.actEveningFinal = await gv(h, 'act_evening');
    await shot(h, `evening-coffee-off-attempt${n}`);
    const fellBack = (A.after || []).some(s => s.job && /:(kitchen|coffee)/.test(s.job) && !/:office_coffee:/.test(s.job));
    A.fellBackToKitchen = fellBack;
    A.kitchenUseLogged = await usedKitchen();
    A.events = await ev(h, () => window.__r2.slice(-60));
    const done = A.events.find(e => e.k === 'task' && e.s === 'completed');
    const before = done ? A.events.filter(e => e.t <= done.t && e.k !== 'task') : [];
    A.tickedBy = done ? before.slice(-3).map(e => `${e.n} ${e.d}`) : null;
    A.result = A.taskFinal === 'completed' && fellBack && A.coffeeOffAfterSwitch === true && A.kitchenUseLogged ? 'PASS' : 'FAIL';
    if (A.result === 'PASS') break;
  }
  const passed = C.attempts.some(a => a.result === 'PASS');
  const switchedAny = C.attempts.some(a => a.switch);
  C.verdict = passed ? 'PASS'
    : switchedAny ? 'FAIL (switched during walk, see attempts)'
      : 'not proven (probe): Zainab never seen walking to the machine in 3 attempts';
  return C;
}

const h = await start(gid);
try {
  for (const id of NPCS) await waitAtPost(h, id, 60000);
  await h.t(1500);
  await hookEvents(h);
  if (mode === 'g1') {
    R.checks.board = await checkBoard(h);
    await checkGate(h, 'gateNo', false);
    R.checks.lunch = await talk(h, 'ama_owusu', ["Let's do lunch"]);
    await closeChat(h);
    R.checks.lunch.actMidday = await gv(h, 'act_midday');
    await checkCallItADay(h);
    await checkEveningCoffee(h);
  } else {
    await checkGate(h, 'gateYes', true);
  }
  R.errs = h.errs.filter(e => !/ERR_FAILED|503/.test(e)).slice(0, 10);
} catch (e) {
  R.fatal = String(e).slice(0, 400);
} finally {
  fs.mkdirSync('tmp/r2fix', { recursive: true });
  fs.writeFileSync(`tmp/r2fix/proof-${mode}-${gid}.json`, JSON.stringify(R, null, 1));
  console.log(JSON.stringify(R, null, 1));
  await h.browser.close();
}
