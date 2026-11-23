// t13_tunnel_guard (m10, keyless, NOT YET RUN): action beat. blast_tunnel, one guard (tunnel_guard, ink knot tunnel). He appears on room_entered:blast_tunnel and challenges on sight (los.challengeOnSight, rooms [blast_tunnel]).
// "Hold it. Post's closed till the shift changes." (4.13 s) > [Out of my way.] (#hostile) > "Nobody said let you through armed." (2.66 s) > he charges; take stays 4 s on the fight (throttleFps 20), stops before any KO. Kowalczyk/team copies are not in this room.
// Entry (new-game): --imports=none --start-room forward_post --unlock blast_tunnel --set briefing_played=true --set breach_open=true   Record: "--hide-hud --zoom-step 1"   (walks east through the door; start-room alone may not fire room_entered)
// Record: MISSION=m10 run.sh frank_callahan t13_tunnel_guard "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, entered, spotted, line-start:/line-end:, hold-done, armed-done, charge, linger-end. Briefing is gated off by briefing_played. Tunnel is rfid-locked: --unlock opens it.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { driveTargets, throttle } from './_c10.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await throttle(page); await sleep(800); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); await sleep(1000); mark('walk-start');
  const e = await bridge.enterRoom('blast_tunnel', { timeoutMs: 45000 }); mark('entered', { ok: e && e.ok, r: JSON.stringify(e).slice(0, 120) });
  const t0 = Date.now(); let open = false;
  while (Date.now() - t0 < 30000 && !open) { open = !!(await bridge.getState()).dialogue; if (!open) await sleep(200); }
  if (!open) throw new Error('guard never challenged (cone range 150, patrol x 4-6 tiles; walk toward him?)');
  mark('spotted');
  await driveTargets(page, bridge, mark, vw, { steps: [/Out of my way/i], targets: [{ name: 'hold', re: /Hold it\. Post.s closed/i }, { name: 'armed', re: /Nobody said let you through armed/i }], lingerMs: 300, timeoutMs: 60000 });
  mark('charge'); await sleep(4000); mark('linger-end');
};
