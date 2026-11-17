// Does Maya need needsDeferMin on m01? Sets both extras thirsty, waits until one is using the cooler, sets Maya
// thirsty (she avoids them, so her trip parks), then times from "cooler clear" (neither extra has a cooler job)
// to Maya setting off, and records park/wake log events and whether she returns to her post.
//   node tools/playtest/m01-ol-maya-defer.mjs <gameId> [port=3092] [capSecs=300]
import { open, ev, waitAtPost } from './m01-ol-lib.mjs';
const [gid, port = '3092', cap = '300'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
await h.t(6000);
const go = async (...rooms) => { for (const r of rooms) { for (let k = 0; k < 3; k++) { const x = await ev(h, async r => await window.__test.enterRoom(r), r); if (x.ok) break; await h.t(1500); } await h.t(1500); } };
await go('hallway_east', 'maya_office');
log('maya at post', await waitAtPost(h, 'maya_chen', 20000));
await go('hallway_east', 'main_office_area');
log('needsDeferMin on Maya', await ev(h, () => window.npcNeedsSystem._rec(window.npcNeedsSystem.states.get('maya_chen')).needsDeferMin ?? null));
const clk = () => ev(h, () => window.npcNeedsSystem.clockMs / 1000);
const st = () => ev(h, () => {
  const j = id => { const s = window.__test.needs.state(id); return s ? { mode: s.mode, tgt: s.job?.targetId || null, ph: s.job?.phase || null, atPost: !!s.atPost, parked: s.parked ? Object.keys(s.parked) : [] } : null; };
  return { m: j('maya_chen'), f: j('fatima_begum'), g: j('graham_whitfield') };
});
await ev(h, () => { window.__test.needs.set('fatima_begum', 'thirst', 20); window.__test.needs.set('graham_whitfield', 'thirst', 20); });
const usingCooler = s => ['f', 'g'].some(k => s[k]?.tgt === 'office_cooler');
let t1 = Date.now(), s;
while (Date.now() - t1 < 90000) { s = await st(); if (['f', 'g'].some(k => s[k]?.tgt === 'office_cooler' && s[k].ph === 'using')) break; await h.t(500); }
log('extra using cooler', s);
await ev(h, () => window.__test.needs.set('maya_chen', 'thirst', 20));
const tSet = await clk(); log('maya set (clock s)', tSet);
let tClear = null, tOff = null, tBack = null, mayaSeen = false, last = '';
const w0 = Date.now();
while ((Date.now() - w0) / 1000 < Number(cap)) {
  s = await st(); const c = await clk();
  const key = JSON.stringify(s);
  if (key !== last) { log(`clk+${(c - tSet).toFixed(1)}s`, s); last = key; }
  if (tClear === null && !usingCooler(s)) tClear = c;
  if (tOff === null && s.m && s.m.tgt) { tOff = c; mayaSeen = true; }
  if (tOff !== null && tBack === null && s.m && s.m.atPost && !s.m.tgt && c - tOff > 3) { tBack = c; break; }
  await h.t(500);
}
const events = await ev(h, () => window.__test.needs.log(0).filter(e => e.npc === 'maya_chen').map(e => ({ ...e })).slice(-30));
log('maya log', events);
log('RESULT', { game: gid, clearAt: tClear && +(tClear - tSet).toFixed(1), setOffAt: tOff && +(tOff - tSet).toFixed(1),
  setOffAfterClear: tClear !== null && tOff !== null ? +(tOff - tClear).toFixed(1) : null, backAtPostAfterSetOff: tBack && tOff ? +(tBack - tOff).toFixed(1) : null, mayaSeen });
log('errs', h.errs);
await h.browser.close();
