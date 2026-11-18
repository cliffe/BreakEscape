// S3 midday proof. usage: node showcase-s3-run.mjs <gid> <mode> [--sound-off]
//   A full midday: gate (kitchen unseen, owner away, clear), B4, Jun PC coupling, badge, catch, then cake
import { start, install, ev, waitAtPost, NPCS, shot, clock, dump, near, log, needsOf, gv, waitFor, lunchTry, closeChat, dlg } from './showcase-s3-lib.mjs';
const gid = process.argv[2], mode = process.argv[3] || 'A', soundOff = process.argv.includes('--sound-off');
const h = await start(gid);
for (const id of NPCS) await waitAtPost(h, id, 60000);
await install(h);
if (soundOff) { await ev(h, () => { window.barkSystem.soundEnabled = false; window.game.sound.mute = true; }); log(await clock(h), 'sound off', await ev(h, () => [window.barkSystem.soundEnabled, window.game.sound.mute])); }
const R = { gid, mode, soundOff, pcOnly: process.argv.includes('--pc-only') };
const kitchen = async () => { await ev(h, () => window.__test.enterRoom('kitchen')); await h.t(800); await ev(h, () => window.__test.moveTo(-250, 262, { timeoutMs: 20000 })).catch(() => {}); await ev(h, () => window.__test.enterRoom('office')); await h.t(800); };
const allAway = () => ev(h, () => ({ c: window.gameState.globalVariables.chidi_pc_owner_away, j: window.gameState.globalVariables.jun_pc_owner_away }));

// 1a kitchen unseen
log(await clock(h), 'lunch before kitchen'); R.gate_unseen = await lunchTry(h); console.log(JSON.stringify(R.gate_unseen)); await closeChat(h);
R.act_after_unseen = await gv(h, 'act_midday');
await kitchen(); R.kitchen_seen = await gv(h, 'kitchen_seen'); log(await clock(h), 'kitchen_seen', R.kitchen_seen);
// 1b owner away: wait for Chidi's (or Jun's) first coffee leave
await ev(h, () => window.__test.moveTo(300, 296, { timeoutMs: 20000 })).catch(() => {});
const away = await waitFor(h, () => window.gameState.globalVariables.chidi_pc_owner_away === true || window.gameState.globalVariables.jun_pc_owner_away === true, null, 400);
R.away = { reached: away, flags: await allAway(), clock: await clock(h) }; log(await clock(h), 'someone away', JSON.stringify(R.away));
if (away) { await h.t(1500); R.gate_away = await lunchTry(h); console.log(JSON.stringify(R.gate_away)); R.flags_at_away_try = await allAway(); await closeChat(h); R.act_after_away = await gv(h, 'act_midday'); }
// 1c all back
const back = await waitFor(h, () => { const g = window.gameState.globalVariables; return !g.chidi_pc_owner_away && !g.jun_pc_owner_away && ['chidi_okeke','jun_watanabe'].every(i => { const s = window.__test.needs.state(i); return s.atPost && !s.job; }); }, null, 240);
R.back = back; log(await clock(h), 'both back', back);
await h.t(2500);
R.gate_clear = await lunchTry(h); console.log(JSON.stringify(R.gate_clear)); await closeChat(h);
R.act_after_clear = await gv(h, 'act_midday'); R.callClock = await clock(h); log(R.callClock, 'act_midday', R.act_after_clear);
for (const id of ['chidi_okeke','jun_watanabe','graham_whitfield','agnieszka_duda']) R['hunger_'+id] = (await needsOf(h, id))?.needs?.hunger;
console.log('hunger after call', JSON.stringify(Object.fromEntries(Object.entries(R).filter(([k]) => k.startsWith('hunger_')))));
await ev(h, () => window.__test.moveTo(300, 296, { timeoutMs: 20000 })).catch(() => {});
await dump(h, `run-${mode}-${gid}-pre`);
fs_write: { const fs = await import('node:fs'); fs.writeFileSync(`tmp/s3/R-${mode}-${gid}.json`, JSON.stringify(R)); }
console.log('errs', h.errs.slice(0, 5));
if (process.argv.includes('--stop-after-gate')) { await dump(h, `run-${mode}-${gid}`); await h.browser.close(); process.exit(0); }
// phase 2 handled by showcase-s3-midday.mjs in same session? (kept in one script below)
await (await import('./showcase-s3-midday.mjs')).midday(h, R);
await h.browser.close();
