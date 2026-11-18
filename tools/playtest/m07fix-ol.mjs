// m07 gate minors: office life survives a server-room visit; hides on generator_room / scada_control.
import { open, ev, dismiss } from './m01-ol-lib.mjs';
const [gid, port='3168', out] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
await ev(h, () => window.__test.throttleFps(20));
const OPS = ['adaeze_okafor','gwen_pritchard'];
const vis = () => ev(h, (ids) => ({ ...Object.fromEntries(ids.map(i => [i, window.npcBehaviorManager.getBehavior(i)?.sprite?.visible ?? null])), gone: window.gameState?.globalVariables?.ops_staff_gone, hall: window.gameState?.globalVariables?.server_hall_reached, room: window.currentPlayerRoom }), OPS);
// Escape would open the pause menu, so close it via Resume and wait out HaX phone barks instead of using dismiss().
const unblock = async () => { await h.page.evaluate(() => { const b=[...document.querySelectorAll('#game-menu-overlay button, #game-menu-overlay .menu-item, #game-menu-overlay *')].find(e=>e.children.length===0 && e.textContent.trim()==='Resume'); if (b) b.click(); document.querySelectorAll('.npc-bark').forEach(e=>e.click()); }).catch(()=>{}); await h.t(1500); };
const go = async (room) => { for (let i=0;i<8;i++){ const r = await ev(h,(r)=>window.__test.enterRoom(r,{timeoutMs:20000}),room); if (r.ok) return r; console.log('go-fail', room, JSON.stringify(r).slice(0,300)); await h.t(2500); await unblock();} return null; };
const shot = n => h.page.screenshot({ path: `${out}/${n}.png` });
const log = (k,v)=>console.log(k, JSON.stringify(v));
await h.t(3000);
await go('operations_floor');
await ev(h,()=>window.__test.moveTo(520,248,{timeoutMs:25000}));
log('1 ops floor', await vis()); await shot('ol1-ops-floor');
await go('server_room');
await h.t(1500);
log('2 in server room (old build hid them here)', await vis());
await go('operations_floor');
await ev(h,()=>window.__test.moveTo(520,248,{timeoutMs:25000}));
await h.t(1000);
log('3 back on ops floor', await vis()); await shot('ol2-back-on-ops-floor');
const t0 = Date.now(); let ex = null;
while (Date.now()-t0 < 240000) {
  const l = await ev(h, () => window.__test.needs.log().filter(e => /exchange/.test(e.ev)).map(e=>`${e.npc}:${e.ev}:${e.knot||''}`));
  if (l.length) { ex = l; await h.t(1500); await shot('ol3-exchange'); break; }
  await h.t(2000);
}
log('4 exchange after server-room visit', { waitedSec: Math.round((Date.now()-t0)/1000), ex });
await go('server_room'); await go('generator_room');
await h.t(1000);
log('5 generator room entered', await vis());
await go('server_room'); await go('operations_floor');
await h.t(1500);
log('6 ops floor after generator room', await vis()); await shot('ol4-ops-empty');
log('errs', h.errs.filter(e=>!/503/.test(e)));
await h.browser.close();
