// t16_gallery_bark (m10, keyless, NOT YET RUN): the payoff of the camera toggle. Walk east from server_hall into the gallery; the monitor guard barks "Camera's dead again. I'll go and look." (3.74 s, onceOnly on room_entered:gallery) and is hidden 3.5 s later.
// Entry (new-game): --imports=none --start-room server_hall --unlock gallery --set briefing_played=true --set gallery_camera_blinded=true --set gallery_open=true --set gallery_shutter_cut=true --set hall_guards_stood_down=true (stops the server_hall guard challenge on spawn)   Record: "--hide-hud --zoom-step 1"   (avatar mei_lin_chow)
// Record: MISSION=m10 run.sh mei_lin_chow t16_gallery_bark "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, entered, line-start:/line-end: (if voiced as a bark), bark-seen?, linger-end. Risks: Victoria/Nightshade may open a chat on entry (clear before the walk if so); lock_guard (patrol, challengeOnSight needs at_keypad, so quiet) is on screen; hax_jammed is also set on entry (should not matter).
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(800); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); await sleep(1200); mark('walk-start');
  const e = await bridge.enterRoom('gallery', { timeoutMs: 45000 }); mark('entered', { ok: e && e.ok, r: JSON.stringify(e).slice(0, 120) });
  await sleep(1000); mark('bark-wait'); await sleep(4200); await vw.drain(); mark('bark-seen?', { note: 'check frames for the guard bubble then him hidden' });
  await vw.stop(); await sleep(800); mark('linger-end');
};
