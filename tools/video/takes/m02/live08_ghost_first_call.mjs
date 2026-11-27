// STATUS: NOT RECORDED. The first attempt used 0-based choice index (the bridge is 1-based) and failed after the pickup, which
// spent the one-shot (ghost_contacted_player true on game 93). Fixed to steps: [1]; needs a game where the device is unpicked.
// live08_ghost_first_call (m02): Ghost's FIRST phone call. Picking up the Planted Network Device in the IT department
// (ghost_terminal_device, item_picked_up:phone) fires Ghost's one-shot call (m02_phone_ghost, knot `start`) as a voiced phone
// chat. The take walks to the IT department, takes the device (the call opens by itself), lets every voiced line play in full,
// picks the first reply and stops at the next menu (no further story choice committed), then closes the phone. ONE-SHOT: the
// pickup sets ghost_contacted_player, so setup() refuses if it is already set and the device is gone from the room afterwards.
// Voice: Iapetus, voice-distortion (cached lines, proven by the tts-response marks). No flag, password or PIN on screen.
// Entry state: LIVE game 93 (playtest03, m02, set 931) with Ghost not yet contacted (ghost_contacted_player false).
// Record (LIVE mode, see tools/video/takes/run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/93 STORAGE_STATE=<playtest03 login.mjs state> \
//   tools/video/takes/run-take.sh m02 live08_ghost_first_call "" "--hide-hud --zoom-step 1"
// Marks: approach, pickup {ok}, call-open, tts-response (per voiced line), choices-shown, choice:<text>, menu-reached, linger-end, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom, watchTts, playThrough } from './_live.mjs';

const DEVICE_ID = 'ghost_terminal_device';
const ROUTE = ['reception_lobby', 'ward_vestibule', 'ward_approach', 'hospital_ward', 'ward_hall', 'office_corridor', 'staff_room', 'it_department'];

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const gv = await page.evaluate(() => (window.gameState && window.gameState.globalVariables) || {});
  if (gv.ghost_contacted_player === true) throw new Error('Ghost has already made first contact (one-shot spent)');
  const s = await bridge.getState();
  if (!s.player || s.player.room !== 'it_department') await goRoom(page, bridge, ROUTE);
  await sleep(500);
}

export default async (page, bridge, mark) => {
  const seen = watchTts(page, mark);
  const vw = { lines: seen, async drain() { return seen; } };
  await sleep(1000);
  mark('approach');
  await bridge.moveToNear(DEVICE_ID, { timeoutMs: 20000 }).catch(() => {});
  await sleep(700);
  const r = await bridge.interact(DEVICE_ID, { timeoutMs: 20000 });
  mark('pickup', { ok: !!(r && r.ok !== false) });
  const w = await bridge.waitForMinigame('phone-chat', { timeoutMs: 15000 }).catch(e => ({ ok: false, e: String(e) }));
  mark('call-open', { ok: !!(w && w.ok !== false), minigame: ((await bridge.getState()).activeMinigame || {}).id });
  await playThrough(page, bridge, mark, vw, { steps: [1], settleMs: 1100, dwellMs: 2200, timeoutMs: 120000 });
  await sleep(2500);
  mark('linger-end', { voicedLines: seen.filter(e => e.status === 200 && /audio/.test(e.type)).length });
  for (let i = 0; i < 5 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
};
