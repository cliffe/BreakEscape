// S4 live proof B: T20 / R5 turn the evening during a coffee / food use. Usage: node showcase-s4-during-use.mjs <gameId>
import { start, install, shot, dump, clock, gv, log, ev, nearNpc, closeChat, spriteState, toKitchen, toOffice, waitFor, HIDDEN, dlg } from './showcase-s4-lib.mjs';
const gid = process.argv[2]; const COFFEE = process.argv[3] === 'coffee'; const tag = COFFEE ? 'Bc' : 'B';
const h = await start(gid); const R = {};
await install(h);
const claims = () => ev(h, () => { const s = window.npcNeedsSystem; const out = {}; for (const id of ['office_coffee', 'kitchen_coffee', 'microwave', 'fridge', 'washing_up_tray', 'water_cooler']) { try { out[id] = s._claims(id, null); } catch (e) { out[id] = '?'; } } return out; });
const jobs = () => ev(h, () => Object.fromEntries(['chidi_okeke', 'jun_watanabe', 'graham_whitfield', 'agnieszka_duda', 'zainab_hussain'].map(i => { const st = window.__test.needs.state(i); const j = st?.job; return [i, j ? `${j.need || j.kind}:${j.targetId}:${j.phase}` : (st?.atPost ? 'post' : st?.mode)]; })));
const states = async () => Object.fromEntries(await Promise.all(HIDDEN.map(async i => [i, await spriteState(h, i)])));
await toKitchen(h); await h.t(800); await toOffice(h); await h.t(3500); await shot(h, tag + '-office-before');
// lunch to unlock "Call it a day"
await nearNpc(h, 'ama_owusu'); await ev(h, () => window.__test.interact('ama_owusu')); await h.t(1500);
const pick = async re => { for (let i = 0; i < 40; i++) { const d = await dlg(h); if (!d.active) return 'closed'; if (d.controls.some(c => /^\d\./.test(c))) { const p = await ev(h, p => window.__test.minigame.chooseMatching(p), re); if (!p?.ok) return 'nochoice:' + d.controls.join('|'); await h.t(900); for (let k = 0; k < 20; k++) { const e = await dlg(h); if (!e.active || e.controls.some(c => /^\d\./.test(c))) break; await h.page.keyboard.press('Space'); await h.t(800); } return 'picked'; } await h.page.keyboard.press('Space'); await h.t(800); } return 'timeout'; };
R.lunch = await pick("Let's do lunch"); await closeChat(h); R.midday = await gv(h, 'act_midday'); log(await clock(h), 'midday', R.midday);
// reopen Ama and sit on the hub, then trigger uses
await nearNpc(h, 'ama_owusu'); await ev(h, () => window.__test.interact('ama_owusu')); await h.t(1500);
// reach hub: advance until choices present
for (let i = 0; i < 30; i++) { const d = await dlg(h); if (d.controls.some(c => /Call it a day/.test(c))) break; await h.page.keyboard.press('Space'); await h.t(700); }
R.hubControls = (await dlg(h)).controls;
await ev(h, c => { const n = window.__test.needs; n.set('graham_whitfield', 'caffeine', 10); if (!c) { n.set('agnieszka_duda', 'caffeine', 10); n.set('chidi_okeke', 'hunger', 20); n.set('jun_watanabe', 'hunger', 20); } }, COFFEE);
const usingNow = () => ev(h, () => ['chidi_okeke', 'jun_watanabe', 'graham_whitfield', 'agnieszka_duda'].filter(i => window.__test.needs.state(i)?.job?.phase === 'using'));
R.using = await waitFor(h, c => (c ? ['graham_whitfield'] : ['chidi_okeke', 'jun_watanabe', 'graham_whitfield', 'agnieszka_duda']).some(i => window.__test.needs.state(i)?.job?.phase === 'using'), COFFEE, 60, 250);
R.usersAtTurn = await usingNow(); R.jobsBefore = await jobs(); R.claimsBefore = await claims(); R.statesBefore = await states();
log(await clock(h), 'using', JSON.stringify(R.usersAtTurn), JSON.stringify(R.jobsBefore), JSON.stringify(R.claimsBefore));
R.pick = await pick("Call it a day"); const t = await clock(h);
await h.t(600); R.jobsAfter600 = await jobs(); R.claimsAfter600 = await claims(); R.statesAfter = await states();
log(await clock(h), 'evening', R.pick, await gv(h, 'act_evening'), JSON.stringify(R.jobsAfter600), JSON.stringify(R.claimsAfter600));
await closeChat(h); await h.t(2500); await shot(h, tag + '-office-after');
await h.t(25000); R.jobsLater = await jobs(); R.claimsLater = await claims(); R.statesLater = await states();
// sitters unseated? check hidden NPC sprites not seated pose and nobody stuck
R.zainab = await ev(h, () => window.npcNeedsSystem.getState('zainab_hussain')?.atPost);
const rec = await dump(h, `during-use-${tag}-${gid}`);
R.vis = rec.rec.filter(r => r.k === 'vis'); R.jobEvents = rec.rec.filter(r => r.k === 'job' && HIDDEN.includes(r.id) && r.c >= t - 1);
console.log(JSON.stringify(R, null, 1)); console.log('errs', h.errs.filter(e => !/ERR_FAILED|503/.test(e))); await h.browser.close();
