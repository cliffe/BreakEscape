// t02_two_rooms (ca12, beat 1 or 8): the studio and Delphine's lobby desk in one frame. The shot list assumed both rooms are on screen
// from the start, but only training_room is loaded in a fresh game and the studio door is badge-locked, so the lobby cannot be reached
// without the call (Approach teleports there; D1 unlocks the door). Setup (unrecorded) therefore plays the pretext call through to the
// "Door unlocked: Studio" toast, presses Done, Continue and closes the kiosk flip screen, and leaves the player at the unlocked door with both rooms loaded (they sit side by side). The take
// is a 4 s hold at the studio's east door (lobby beside it), then a short key-driven walk east through the door (stops by distance, not time). Frames show no call UI.
// Entry state: PLAYTEST_PORT=<port> tools/playtest/new-game.sh ca12_visitor_tailgater
// Record: run-take.sh ca12_visitor_tailgater t02_two_rooms "" "--hide-hud --zoom-step 1"
// Marks: hold-start, frame:hold, walk-start, leg:*, frame:walking, walk-end. Needs the avatar window (player in frame at the door).
import { sleep, prepare, kioskStart, openFriendface, pressButton, playCallToUnlock } from './_ca12a.mjs';
import { keyLegs } from '../lib/walklib.mjs';

export async function setup(page, bridge, mark = () => {}) {
  await prepare(page, bridge); await kioskStart(page, bridge, mark); await openFriendface(page, mark);
  await pressButton(page, /Pin$/); await sleep(900);
  await bridge.minigame.close().catch(() => {}); await sleep(1000);
  await pressButton(page, /Prepare the call/i); await sleep(1200);
  await playCallToUnlock(page, bridge, mark);
  mark('call-played');
  await bridge.minigame.close().catch(() => {}); await sleep(1200);   // close() brings up the Call debrief modal
  await pressButton(page, /^Done$/, 20000); await sleep(1500);   // the Call debrief modal: Done closes the call (it stays up until pressed)
  // Done opens the kiosk flip screen straight away (spoiler text, never on camera): Continue ticks the strip to Defend, then close the kiosk.
  await pressButton(page, /^Continue$/, 20000); await sleep(1500);
  await bridge.minigame.close().catch(() => {}); await sleep(1200);
  await bridge.waitForMinigameClosed({ timeoutMs: 5000 }).catch(() => {});
  await bridge.moveTo(268, 84, { timeoutMs: 15000 }).catch(() => {}); await sleep(1500);   // stand by the studio's east door, both rooms in view
}

export default async (page, bridge, mark) => {
  mark('hold-start', { room: (await bridge.getState()).player.room });
  await sleep(2000);
  mark('frame:hold');
  await sleep(2000);
  const p = (await bridge.getState()).player;
  mark('walk-start', { x: p.x, y: p.y, room: p.room });
  await keyLegs(bridge, [['right', p.x + 40]], 60, mark);
  mark('frame:walking');
  await sleep(300);
  const q = (await bridge.getState()).player;
  mark('walk-end', { x: q.x, y: q.y, room: q.room });
};
