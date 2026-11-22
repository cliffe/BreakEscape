// t02_two_rooms (ca12, beat 1 or 8): the studio and Delphine's lobby desk in one frame. The shot list assumed both rooms are on screen
// from the start, but only training_room is loaded in a fresh game and the studio door is badge-locked, so the lobby cannot be reached
// without the call (Approach teleports there; D1 unlocks the door). Setup (unrecorded) therefore plays the pretext call through to the
// "Door unlocked: Studio" toast, closes the call, and leaves the player in the lobby with the door open and both rooms loaded. The take
// is a 4 s hold at the lobby, then a short key-driven walk toward the studio door (stops by distance, not time). Frames show no call UI.
// Entry state: PLAYTEST_PORT=<port> tools/playtest/new-game.sh ca12_visitor_tailgater
// Record: run-take.sh ca12_visitor_tailgater t02_two_rooms "" "--hide-hud --zoom-step 1"
// Marks: hold-start, frame:hold, walk-start, leg:*, frame:walking, walk-end. Needs the avatar window (player in frame, back in the lobby).
import { sleep, prepare, kioskStart, openFriendface, pressButton, pressEl } from './_ca12a.mjs';
import { keyLegs } from '../lib/walklib.mjs';

export async function setup(page, bridge, mark = () => {}) {
  await prepare(page, bridge); await kioskStart(page, bridge, mark); await openFriendface(page, mark);
  await pressButton(page, /Pin$/); await sleep(900);
  await bridge.minigame.close().catch(() => {}); await sleep(1000);
  await pressButton(page, /Prepare the call/i); await sleep(1200);
  await pressEl(page, /Recipient|choose/i, 8000); await sleep(600);
  await pressEl(page, /^Catherine Merrin$/); await sleep(600);
  await pressButton(page, /^Approach$/); await sleep(2500);
  await bridge.minigame.choose(/sample box for Catherine/i).catch(() => {}); await sleep(3500);
  await bridge.minigame.choose(/buzz me through/i).catch(() => {}); await sleep(3500);
  mark('call-played');
  await bridge.minigame.close().catch(() => {}); await sleep(1200);
}

export default async (page, bridge, mark) => {
  mark('hold-start', { room: (await bridge.getState()).player.room });
  await sleep(2000);
  mark('frame:hold');
  await sleep(2000);
  const p = (await bridge.getState()).player;
  mark('walk-start', { x: p.x, y: p.y, room: p.room });
  await keyLegs(bridge, [['left', p.x - 40]], 60, mark);
  mark('frame:walking');
  await sleep(300);
  const q = (await bridge.getState()).player;
  mark('walk-end', { x: q.x, y: q.y, room: q.room });
};
