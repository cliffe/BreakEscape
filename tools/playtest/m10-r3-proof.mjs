// m10 blind R3 m1 live proof (keyless server, headless, fixed steps ON, 20 fps):
// hall_guard_a engaged -> player KO -> Respawn -> reload -> he challenges again.
//   M10_PORT=3162 node tools/playtest/m10-r3-proof.mjs <gameId>
import { start } from './m10-ol-lib.mjs';
const gid = process.argv[2];
const G = (g) => g.ev(() => { const s = window.__test.getState().globals; return { hall_a_engaged: s.hall_a_engaged, hall_a_warnings: s.hall_a_warnings, hall_b_engaged: s.hall_b_engaged, hall_b_warnings: s.hall_b_warnings }; });
const dlg = (g) => g.ev(() => { const s = window.__test.getState(); return { mg: s.activeMinigame && s.activeMinigame.type, d: s.dialogue ? JSON.stringify(s.dialogue).slice(0, 160) : null }; });
let g = await start(gid, { reload: true });
console.log('start', JSON.stringify(await G(g)));
// server_hall is behind story-locked doors (no editing the game row), so the hostility comes from the same
// engine call the fight choice uses; the guard need not be loaded for the state and the events to exist.
await g.ev(() => window.npcHostileSystem.setNPCHostile('hall_guard_a', true));
await g.ev(() => window.npcHostileSystem.setNPCHostile('hall_guard_b', true));
await g.t(1500);
console.log('after hostile', JSON.stringify(await G(g)));
// Player goes down.
await g.ev(() => window.playerHealth ? window.playerHealth.damage(1000, 'guard') : null);
await g.t(2500);
console.log('KO overlay respawn btn', await g.ev(() => !!document.getElementById('game-over-respawn-btn')));
await g.ev(() => document.getElementById('game-over-respawn-btn') && document.getElementById('game-over-respawn-btn').click());
await g.page.waitForNavigation({ timeout: 30000 }).catch(() => {});
await g.page.waitForFunction(() => window.gameScenario && window.__test && window.__test.getState && window.player && window.player.body, null, { timeout: 90000 });
await g.t(4000);
console.log('after respawn', JSON.stringify(await G(g)), 'url', g.page.url());
const gl = await G(g);
console.log('repeat-challenge condition a (warnings !== 0 && !engaged):', gl.hall_a_warnings !== 0 && !gl.hall_a_engaged, ' b:', gl.hall_b_warnings !== 0 && !gl.hall_b_engaged);
await g.close();
