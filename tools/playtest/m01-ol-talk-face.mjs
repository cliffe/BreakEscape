// R2 n1: talking to Fatima and Graham turns them toward the player, seated at their desks and at the cooler.
//   node tools/playtest/m01-ol-talk-face.mjs <gameId> [port]
import { open, ev, dlg } from './m01-ol-lib.mjs';
const [gid, port = '3094'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
await h.t(6000);
const snap = id => ev(h, id => {
  const sp = window.npcBehaviorManager.getBehavior(id)?.sprite; const s = window.__test.needs.state(id); const p = window.player;
  const dx = p.body.center.x - sp.body.center.x, dy = p.body.center.y - sp.body.center.y;
  const dir = Math.abs(dx) > 2 * Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : Math.abs(dy) > 2 * Math.abs(dx) ? (dy > 0 ? 'south' : 'north') : (dy > 0 ? 'south' : 'north') + '-' + (dx > 0 ? 'east' : 'west');
  return { phase: s?.job?.phase || null, need: s?.job?.need || null, frame: sp.frame?.name, anim: sp.anims?.currentAnim?.key || null, playerIs: dir, distTiles: +(Math.hypot(dx, dy) / 32).toFixed(2) };
}, id);
const closeChat = async () => { for (let i = 0; i < 3; i++) { if (!(await dlg(h)).active) break; await ev(h, () => window.__test.minigame.close()); await h.t(600); } };
const talkTo = async (id, label, south = false) => {
  if (south) await ev(h, id => { const sp = window.npcBehaviorManager.getBehavior(id).sprite; window.player.body.reset(sp.body.center.x, sp.body.center.y + 40); }, id), await h.t(500);
  const before = await snap(id);
  const r = await ev(h, id => window.__test.interact(id), id); await h.t(1800);
  const after = await snap(id); const d = await dlg(h);
  log(label, { interact: { ok: r?.ok, reason: r?.reason }, chatOpen: d.active, before, after });
  await closeChat(); await h.t(800);
};
async function atDesk(id) { const t0 = Date.now(); let st; while (Date.now() - t0 < 90000) { st = await snap(id); if (st.need === 'work' && st.phase === 'using') return st; await h.t(1000); } return st; }
for (const id of ['fatima_begum', 'graham_whitfield']) {
  await atDesk(id); await talkTo(id, id + ' seated at desk (player walks up)');
  await atDesk(id); await talkTo(id, id + ' seated at desk (player placed 1.25 tiles south)', true);
  await ev(h, id => window.__test.needs.set(id, 'thirst', 20), id);
  const t0 = Date.now(); let st;
  while (Date.now() - t0 < 80000) { st = await snap(id); if (st.need === 'thirst' && st.phase === 'using') break; await h.t(1000); }
  log(id + ' at cooler, before talk', st);
  if (st.need === 'thirst' && st.phase === 'using') await talkTo(id, id + ' at cooler');
  await h.t(1000); log(id + ' after chat closed', await snap(id));
}
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
