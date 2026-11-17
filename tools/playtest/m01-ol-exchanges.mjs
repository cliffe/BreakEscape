// Test 11: each exchange heard once, none after the pair has heard both, none after a reload.
//   node tools/playtest/m01-ol-exchanges.mjs <gameId> [port]
import { open, load, ev } from './m01-ol-lib.mjs';
const [gid, port = '3094'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
const G = () => ev(h, () => { const g = window.gameState?.globalVariables || {}; return { interns: g.heard_ex_interns, biscuits: g.heard_ex_biscuits }; });
async function round(label) {
  const since = await ev(h, () => (window.__test.needs.log().slice(-1)[0]?.t) || 0);
  await ev(h, () => { window.__test.needs.set('fatima_begum', 'thirst', 20); window.__test.needs.set('graham_whitfield', 'thirst', 20); });
  const t0 = Date.now(); let done = false;
  while (Date.now() - t0 < 110000) {
    await h.t(2000);
    const st = await ev(h, () => ['fatima_begum', 'graham_whitfield'].map(i => window.__test.needs.state(i)?.mode));
    if (Date.now() - t0 > 20000 && st.every(m => m === 'idle')) { done = true; break; }
  }
  const evs = await ev(h, s => window.__test.needs.log(s).filter(e => /exchange|chatter|using/.test(e.ev) && (e.ev !== 'using' || e.need === 'thirst')).map(e => `${e.t}:${e.npc}:${e.ev}:${e.knot || e.need || ''}`), since);
  log(label, { done, globals: await G(), evs });
}
await h.t(6000);
log('start', await G());
await round('round1'); await round('round2'); await round('round3');
await load(h, h.url); await h.t(6000);
log('after reload', await G());
await round('round4 after reload');
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
