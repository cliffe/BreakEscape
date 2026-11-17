// R4 part 3, task 1: why did Maya not retry her drink? Sets her thirsty while both extras use the cooler,
// then logs parked/unparked events with the needs clock. Optional mode "control": no extras (Maya alone).
//   node tools/playtest/m01-ol-maya-park.mjs <gameId> [port=3095] [mode=avoid|control|wake] [secs=330]
import { open, ev, waitAtPost } from './m01-ol-lib.mjs';
const [gid, port = '3095', mode = 'avoid', secs = '330'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
await h.t(6000);
const go = async (...rooms) => { for (const r of rooms) { for (let k = 0; k < 3; k++) { const x = await ev(h, async r => await window.__test.enterRoom(r), r); if (x.ok) break; console.log('enterRoom failed', r, x.reason, 'try', k + 1); await h.t(1500); } await h.t(1500); } };
await go('hallway_east', 'maya_office');
console.log('maya at post', JSON.stringify(await waitAtPost(h, 'maya_chen', 20000)));
await go('hallway_east', 'main_office_area');
const snap = () => ev(h, () => ['maya_chen', 'fatima_begum', 'graham_whitfield'].map(id => { const s = window.__test.needs.state(id); return [id, s?.mode, s?.job?.targetId || s?.job?.objectId || null, s?.job?.phase || null, s?.levels?.thirst != null ? +s.levels.thirst.toFixed(1) : null, s?.parked ? Object.keys(s.parked) : null]; }));
log('player room', await ev(h, () => ({ room: window.currentPlayerRoom, x: Math.round(window.player.x), y: Math.round(window.player.y) })));
log('start', await snap());
log('clock', await ev(h, () => window.npcNeedsSystem.clockMs));
if (mode !== 'control') await ev(h, () => { window.__test.needs.set('fatima_begum', 'thirst', 20); window.__test.needs.set('graham_whitfield', 'thirst', 20); });
if (mode === 'avoid') { const t1 = Date.now(); while (Date.now() - t1 < 90000) { const a = await ev(h, () => ['fatima_begum', 'graham_whitfield'].some(i => { const j = window.__test.needs.state(i)?.job; return j && j.targetId === 'office_cooler' && j.phase === 'using'; })); if (a) break; await h.t(500); } log('an extra is using the cooler', await snap()); } else await h.t(100);
await ev(h, () => window.__test.needs.set('maya_chen', 'thirst', 20));
log('maya set', { clock: await ev(h, () => window.npcNeedsSystem.clockMs) });
const t0 = Date.now(); let last = '';
while ((Date.now() - t0) / 1000 < Number(secs)) {
  const s = JSON.stringify(await snap());
  if (s !== last) { log(`t=${((Date.now() - t0) / 1000).toFixed(0)}s clk=${await ev(h, () => Math.round(window.npcNeedsSystem.clockMs / 1000))}`, JSON.parse(s)); last = s; }
  if (mode === 'wake' && Date.now() - t0 > 60000 && !globalThis.__w) { globalThis.__w = 1; await ev(h, () => window.npcNeedsSystem._wakeParked()); log('wake called', {}); }
  await h.t(2000);
}
log('maya log', await ev(h, () => window.__test.needs.log(0).filter(e => e.npc === 'maya_chen').slice(-25)));
log('parked detail', await ev(h, () => { const s = window.npcNeedsSystem.states.get('maya_chen'); return s ? s.parked : 'no state'; }));
log('errs', h.errs);
await h.browser.close();
