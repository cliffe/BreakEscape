// t07_hall_walk: the player through the north door into Battery Hall 1 (responder, 3.6 s) and a quiet Hall 1 for side_b (slow push-in on one rack row, 3.6 s). No alarm, so no bark.
// Entry state: tools/video/takes/run-take.sh sis02 t07_hall_walk "--unlock battery_hall_1 --set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
//   (--unlock opens the badge lock without the badge item; --give cannot give the badge, items have no ids.) Fresh game, starts in the control room.
// Actions: bridge.moveTo the north door (48,32), through it into battery_hall_1, walk on into the hall; then moveTo the dial (analog_thermometer) and hold 0.5 s on it.
// Dry run: the door opens by itself when the interact approaches it (open-door frame at 0.8 s, dark doorway after).
// Marks: sprite, door-before (door/lock state), walk-start, room-changed (room id after the door), frame:walk_t+N, hall-nearby (ids + coords),
//   dial-rect (the dial's on-screen size in px: is the number readable?), frame:dial_hold, bark-check, end.
import { interact, sleep, prepare, sprite, HIDE_BUBBLES, MUTE_BARKS, muteSummary, watchSays, frame, logNearby } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  await page.evaluate(HIDE_BUBBLES); await page.evaluate(MUTE_BARKS);
  const says = await watchSays(page, mark);
  const s0 = await bridge.getState(); mark('start', { room: s0.room, x: s0.player.x, y: s0.player.y });
  mark('walk-start', {}); frame(mark, 'walk_t+0');
  const t0 = Date.now();
  await interact(bridge, mark, 'door:scada_control_room->battery_hall_1');
  const w = (async () => { await sleep(300); return bridge.moveTo(48, -30, { timeoutMs: 15000 }).catch(e => ({ ok: false, err: String(e).slice(0, 80) })); })().catch(e => ({ ok: false, err: String(e).slice(0, 80) }));
  let fi = 0, room0 = s0.room, changed = false; const F = [0.8, 1.6, 2.4, 3.2, 4.0, 5.0, 6.0];
  while (Date.now() - t0 < 14000) {
    while (fi < F.length && (Date.now() - t0) / 1000 >= F[fi]) { frame(mark, 'walk_t+' + F[fi]); fi++; }
    const s = await bridge.getState(); if (!changed && s.room !== room0) { changed = true; mark('room-changed', { room: s.room, x: s.player.x, y: s.player.y }); }
    if (changed && fi >= F.length) break; await sleep(150);
  }
  const wr = await w; mark('walk-result', { ok: wr && wr.ok, err: wr && wr.err });
  const s1 = await logNearby(bridge, mark); mark('hall-state', { room: s1.room, x: s1.player.x, y: s1.player.y });
  const dial = (s1.nearby || []).find(n => n.id === 'analog_thermometer'); mark('dial-nearby', dial || null);
  await says.drain();
  if (dial && dial.x != null) { await bridge.moveTo(dial.x + 8, dial.y + 40, { timeoutMs: 15000 }).catch(() => {}); }
  await sleep(500); frame(mark, 'dial_hold');
  mark('bark-check', { says: await page.evaluate(() => [...(window.npcWorldBubbles?.says || new Map()).keys()]), mute: await muteSummary(page) });
  mark('end');
};
