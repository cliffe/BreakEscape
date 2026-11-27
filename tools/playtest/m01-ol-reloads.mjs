// Test 14-style reloads: after load (day) and during a break (extras at the cooler), then let the day carry on.
//   node tools/playtest/m01-ol-reloads.mjs <gameId> [port]
import { open, load, ev } from './m01-ol-lib.mjs';
const [gid, port = '3094'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
const who = () => ev(h, () => Object.fromEntries(['fatima_begum', 'graham_whitfield'].map(i => { const s = window.__test.needs.state(i); const b = window.npcBehaviorManager.getBehavior(i); const sp = b.sprite; return [i, { mode: s?.mode, job: s?.job ? { obj: s.job.objectId, phase: s.job.phase, need: s.job.need } : null, seated: !!b._seat, vis: !!sp.visible, x: +(sp.body.center.x / 32).toFixed(2), y: +(sp.body.center.y / 32).toFixed(2) }]; })));
const wait = async (pred, ms) => { const t0 = Date.now(); let w; while (Date.now() - t0 < ms) { w = await who(); if (pred(w)) return w; await h.t(1000); } return null; };
await h.t(6000);
log('day, before reload', await who());
await load(h, h.url); await h.t(5000);
log('day, after reload', await who());
await ev(h, () => { window.__test.needs.set('fatima_begum', 'thirst', 20); window.__test.needs.set('graham_whitfield', 'thirst', 20); });
const mid = await wait(w => Object.values(w).some(v => v.job?.phase === 'using' && v.job?.need === 'thirst'), 60000);
log('break, before reload', mid);
await load(h, h.url); await h.t(5000);
log('break, after reload', await who());
const back = await wait(w => Object.values(w).every(v => v.seated || (v.job?.need === 'work' && v.job?.phase === 'using')), 150000);
log('back at desks', back);
const g = await ev(h, () => window.gameState.globalVariables); log('globals', { alarmed: g.m01_staff_alarmed, fko: g.fatima_ko, gko: g.graham_ko });
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
