// R1 n4: KO Maya with real punches before her first talk. No crash, no trip, no console error, mission still navigable.
//   node tools/playtest/m01-ol-maya-ko-first.mjs <gameId> [port]
import { open, ev } from './m01-ol-lib.mjs';
const [gid, port = '3094'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
const st = () => ev(h, () => { const g = window.gameState.globalVariables || {}; const s = window.__test.needs.state('maya_chen'); const sp = window.npcBehaviorManager.getBehavior('maya_chen').sprite; return { room: window.currentPlayerRoom, mayaRoom: sp.roomId || null, x: +(sp.x / 32).toFixed(2), y: +(sp.y / 32).toFixed(2), mode: s?.mode ?? null, job: s?.job ? s.job.phase : null, ko: window.npcHostileSystem.isNPCKO('maya_chen'), hostile: window.npcHostileSystem.isNPCHostile('maya_chen'), g: { maya_ko: g.maya_ko, maya_away: g.maya_away, maya_settled: g.maya_settled, discussed_operation: g.discussed_operation, alarmed: g.m01_staff_alarmed } }; });
await h.t(6000);
for (const r of ['hallway_east', 'maya_office']) { const x = await ev(h, async r => await window.__test.enterRoom(r), r); log('enter ' + r, x); await h.t(1500); }
log('before', await st());
await ev(h, () => window.__test.moveToNear('maya_chen', { timeoutMs: 15000 })).catch(() => {});
let ko = null;
for (let i = 0; i < 60; i++) {
  await ev(h, () => { const s = window.npcBehaviorManager.getBehavior('maya_chen').sprite; window.playerCombat.attack({ x: s.x, y: s.y }); }); await h.t(450);
  if ((await st()).ko) { ko = i + 1; break; }
  if (i % 3 === 2) await ev(h, () => window.__test.moveToNear('maya_chen', { timeoutMs: 8000 })).catch(() => {});
}
log('KO after punches', ko);
await h.t(3000);
log('after KO +3s', await st());
await h.t(15000);
log('after KO +18s (no trip)', await st());
const nav = [];
for (const r of ['hallway_east', 'main_office_area', 'hallway_east', 'maya_office']) { const x = await ev(h, async r => await window.__test.enterRoom(r), r); nav.push({ r, ok: x.ok, reason: x.reason || null }); await h.t(1200); }
log('navigation', nav);
log('blocking ui', await ev(h, () => { const s = window.__test.getState(); return { m: !!s.activeMinigame, b: !!s.blockingUi }; }));
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
