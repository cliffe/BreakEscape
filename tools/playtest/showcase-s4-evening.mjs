// S4 live proof A: T17, T18, T19, R10. Usage: node showcase-s4-evening.mjs <gameId>
import { start, install, shot, dump, clock, gv, log, ev, nearNpc, amaPick, closeChat, spriteState, lightState, toKitchen, toOffice, waitFor, HIDDEN, rec } from './showcase-s4-lib.mjs';
const gid = process.argv[2]; const NO10 = process.argv[3] === 'noR10'; const tag = NO10 ? 'T' : 'R';
const h = await start(gid); const R = {};
await install(h);
const states = async () => Object.fromEntries(await Promise.all(HIDDEN.map(async i => [i, await spriteState(h, i)])));
await toKitchen(h); await h.t(1200); await shot(h, tag + '-kitchen-before'); R.kitchenBefore = await lightState(h, 'kitchen');
await toOffice(h); await h.t(1200); await shot(h, tag + '-office-before');
R.officeBefore = await lightState(h, 'office'); R.statesBefore = await states(); log(await clock(h), 'before', JSON.stringify(R.officeBefore), JSON.stringify(R.kitchenBefore));
R.kitchenSeen = await gv(h, 'kitchen_seen');
R.lunch = await amaPick(h, "Let's do lunch"); log(await clock(h), 'lunch', JSON.stringify(R.lunch), 'midday', await gv(h, 'act_midday'));
await closeChat(h);
// R10: switch coffee off at the socket before the turn
const lever = async () => {
  await ev(h, () => window.__test.moveToNear('office_coffee_socket', { timeoutMs: 30000 })).catch(() => {});
  const ir = await ev(h, () => window.__test.interact('office_coffee_socket')).catch(e => String(e)); await h.t(800);
  const dlgText = await ev(h, () => { const b = document.querySelector('.game-confirm-ok'); const box = b?.closest('.game-confirm, .game-confirm-dialog, [class*=confirm]'); return { ok: b ? b.textContent : null, text: (box || document.body).innerText.slice(0, 200) }; });
  await ev(h, () => document.querySelector('.game-confirm-ok')?.click()); await h.t(700);
  return { ir: ir?.ok ?? ir, dlgText };
};
R.leverOff = NO10 ? null : await lever(); R.coffeeOffBefore = await gv(h, 'office_coffee_off'); log(await clock(h), 'lever1', JSON.stringify(R.leverOff), 'off=', R.coffeeOffBefore);
R.cake = await amaPick(h, "Call it a day"); const tTurn = await clock(h);
log(tTurn, 'evening', JSON.stringify(R.cake), 'act_evening', await gv(h, 'act_evening'));
await closeChat(h); await h.t(1200); await shot(h, tag + '-office-after');
R.officeAfter = await lightState(h, 'office'); R.statesAfter = await states(); R.kitchenAfter = await lightState(h, 'kitchen');
R.coffeeOffAfterTurn = await gv(h, 'office_coffee_off');
log(await clock(h), 'after', JSON.stringify(R.officeAfter), JSON.stringify(R.kitchenAfter), JSON.stringify(R.statesAfter));
// R10: one click on socket
R.leverOn = NO10 ? null : await lever(); R.coffeeOffAfterClick = await gv(h, 'office_coffee_off'); log(await clock(h), 'lever2', JSON.stringify(R.leverOn), 'off=', R.coffeeOffAfterClick);
await shot(h, tag + '-office-socket-click');
// T18: wait for Zainab
R.zainab = await waitFor(h, () => window.objectivesManager.getTask('see_who_stays')?.status === 'completed', null, 70, 500);
R.task = await ev(h, () => window.objectivesManager.getTask('see_who_stays')?.status);
log(await clock(h), 'see_who_stays', R.task);
// T19: wait for Zainab back at her post so the motion sensor sees nobody
R.zBack = await waitFor(h, () => window.npcNeedsSystem.getState('zainab_hussain')?.atPost === true, null, 40, 500); log(await clock(h), 'zainab back', R.zBack);
await toKitchen(h); await h.t(1500); R.kitchenEntered = await lightState(h, 'kitchen'); await shot(h, tag + '-kitchen-entered-evening');
await toOffice(h); const tLeave = await clock(h); await h.t(4000); R.kitchen4s = await lightState(h, 'kitchen');
await h.t(8500); R.kitchen12s = await lightState(h, 'kitchen'); await shot(h, tag + '-office-12s-after-kitchen-leave');
R.leaveGap = +((await clock(h)) - tLeave).toFixed(1);
const recs = await dump(h, `evening-${tag}-${gid}`);
R.barks = recs.rec.filter(r => r.k === 'bark' && r.npc === 'zainab_hussain');
R.zJobs = recs.rec.filter(r => r.k === 'job' && r.id === 'zainab_hussain');
R.vis = recs.rec.filter(r => r.k === 'vis');
R.kitchenLightingEvents = recs.rec.filter(r => r.k === 'task' || (r.k === 'global' && r.g === 'act_evening'));
console.log(JSON.stringify(R, null, 1)); console.log('errs', h.errs); await h.browser.close();
