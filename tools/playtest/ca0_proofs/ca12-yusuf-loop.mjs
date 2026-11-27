// Does Yusuf's authored patrol loop run (before any world flag), with the player outside then inside the lobby?
//   node ca12-yusuf-loop.mjs <gameId> <port> <outDir>   (fresh ca12 game)
import { launch, sleep } from './_pl.mjs';
const [gid, port, out] = process.argv.slice(2);
const L = await launch(gid, port, out); const { page } = L; const T0 = Date.now();
const y = () => page.evaluate(() => { const b = window.npcBehaviorManager.getBehavior('ca12_yusuf_demir'), sp = b.sprite; const p = b.config?.patrol || {}; return { r: b.roomId, xy: [Math.round(sp.x), Math.round(sp.y)], st: b.currentState, tgt: b.patrolTarget && [Math.round(b.patrolTarget.x), Math.round(b.patrolTarget.y)], wait: b._routeWait ? 'y' : '', pf: b.pathFollowingActive, ovr: b._patrolOverridden, en: p.enabled, nwp: p.waypoints?.length, vis: sp.visible, room: window.currentPlayerRoom }; });
let prev = '';
const sample = async tag => { const s = await y(); const k = JSON.stringify([s.xy, s.st, s.tgt]); if (k !== prev) console.log(((Date.now() - T0) / 1000).toFixed(0), tag, JSON.stringify(s)); prev = k; };
for (let i = 0; i < 30; i++) { await sample('train'); await sleep(1000); }
const r = await page.evaluate(() => window.__test.enterRoom('lobby')); console.log('enter', r.ok);
for (let i = 0; i < 40; i++) { await sample('lobby'); await sleep(1000); }
await L.browser.close();
