// R1 m1/m2, R2 m1: Graham too (facePlayerDistance 48); the player stays put near the cooler and the log shows the distance to each.
// R1 m1/m2: at the cooler, who is seated, which way each person faces. Screenshot when both are using.
//   node tools/playtest/m01-ol-cooler-face.mjs <gameId> [port] [shotPath]
import { open, ev } from './m01-ol-lib.mjs';
const [gid, port = '3094', shot = 'tmp/cooler-in-use.png'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
await h.t(8000);
await ev(h, () => { window.__test.needs.set('fatima_begum', 'thirst', 20); window.__test.needs.set('graham_whitfield', 'thirst', 20); });
const t0 = Date.now(); let shotDone = false;
const snap = () => ev(h, () => {
  const o = {};
  for (const i of ['fatima_begum', 'graham_whitfield']) {
    const s = window.__test.needs.state(i); const sp = window.npcBehaviorManager.getBehavior(i)?.sprite;
    const pl = window.player; const d = sp && pl ? +(Math.hypot(sp.body.center.x - pl.body.center.x, sp.body.center.y - pl.body.center.y) / 32).toFixed(2) : null;
    o[i] = { distToPlayerTiles: d, mode: s?.mode, job: s?.job ? { obj: s.job.objectId, phase: s.job.phase, need: s.job.need } : null,
      x: sp ? +(sp.body.center.x / 32).toFixed(2) : null, y: sp ? +(sp.body.center.y / 32).toFixed(2) : null,
      anim: sp?.anims?.currentAnim?.key || null, frame: sp?.frame?.name ?? null, seat: !!sp?._seat, seatChair: sp?._seat?.chair?.scenarioData?.id || sp?._seat?.id || (sp?._seat ? 'yes' : null) };
  }
  return o;
});
let last = '';
while (Date.now() - t0 < 90000) {
  const o = await snap();
  const both = Object.values(o).every(v => v.job?.phase === 'using' && v.job?.need === 'thirst');
  const k = JSON.stringify(o); if (k !== last) { log('t' + Math.round((Date.now() - t0) / 1000), o); last = k; }
  if (both && !shotDone && /_south_/.test(o.fatima_begum.frame || '') && /^pose_drink/.test(o.graham_whitfield.frame || '')) { log('both using, Fatima south', o); await h.page.screenshot({ path: shot }); shotDone = true; break; }
  await h.t(1000);
}
// keep sampling the poses for the rest of the use phase (drink pose direction)
const poses = {};
for (let i = 0; i < 20; i++) { const o = await snap(); for (const [n, v] of Object.entries(o)) if (v.job?.phase === 'using') (poses[n] ||= new Set()).add(v.frame); await h.t(1000); }
log('poses while using', Object.fromEntries(Object.entries(poses).map(([k, v]) => [k, [...v]])));
log('player tile', await ev(h, () => ({ x: +(window.player.body.center.x / 32).toFixed(2), y: +(window.player.body.center.y / 32).toFixed(2) })));
log('shot', shotDone);
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
