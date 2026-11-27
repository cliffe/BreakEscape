// t05b_rfid_door: the RFID badge tap at the IT Security office door (from Ward 7). The crescendo uses 4 f of it.
// Entry state: tools/video/takes/run-take.sh sis01 t05b_rfid_door "" "--hide-hud --zoom-step 1"
// FRESH game, no flags: the card has no object id, so --give cannot add it. The take skips through the cutscene (every line after 0.45 s); line 8 (#give_item:keycard) gives the card.
// Walks to the door, interacts with it (door id door:ward_7->it_security_office), holds on the unlock tap, then lets the player step through.
// Marks: door-pos, inventory, walk-start/arrived, tap_click, door-state-after, frame:door_pre, frame:tap_t+N, frame:open, room-after, end.
import { sleep, prepare, sprite, interact, frame, CHAT_CSS } from './_sis01.mjs';

export default async (page, bridge, mark) => {
  await sprite(page, mark);
  await page.addStyleTag({ content: CHAT_CSS }).catch(() => {});
  // skip the arrival cutscene (9 lines) to receive the keycard
  const tc = Date.now(); let seen = false;
  while (Date.now() - tc < 60000) {
    const d = (await bridge.getState()).dialogue;
    if (d) { seen = true; if (d.canContinue) { await sleep(450); await bridge.minigame.continue_().catch(() => {}); } await sleep(100); continue; }
    if (seen) break; await sleep(150);
  }
  mark('cutscene-skipped', { seen });
  await sleep(800);
  await prepare(page, bridge, mark);
  const s0 = await bridge.getState({ radius: 2000, limit: 200 });
  mark('inventory', (s0.inventory || []).map(i => i.name || i.id || i.type));
  const door = (s0.nearby || []).find(n => /^door:ward_7->it_security_office/.test(n.id)) || (s0.nearby || []).find(n => /door/.test(n.id));
  mark('door-pos', door ? { id: door.id, x: door.x | 0, y: door.y | 0, inRange: door.inRange } : (s0.nearby || []).filter(n => /door/i.test(n.id + n.name)).map(n => n.id));
  mark('nearby-doors', (s0.nearby || []).filter(n => /door/i.test(n.kind + n.id)).map(n => n.id));
  if (door) { mark('walk-start'); const w = await bridge.moveTo(Math.round(door.x), Math.round(door.y + 60), { timeoutMs: 20000 }).catch(() => ({ ok: false })); mark('walk-arrived', { ok: w && w.ok }); }
  await sleep(500); frame(mark, 'door_pre'); if (process.env.BE_DRY) await sleep(700);
  mark('tap_click');
  const r = await interact(bridge, mark, door ? door.id : 'door:ward_7->it_security_office');
  mark('tap-result', { ok: r && r.ok, mode: r && r.mode, reason: r && r.reason });
  const t0 = Date.now();
  for (const t of [0.2, 0.5, 0.9, 1.4]) { await sleep(Math.max(0, t * 1000 - (Date.now() - t0))); frame(mark, 'tap_t+' + t); if (process.env.BE_DRY) await sleep(700); }
  const s1 = await bridge.getState();
  mark('room-after', { room: s1.room, pl: [s1.player.x | 0, s1.player.y | 0], mg: s1.activeMinigame && s1.activeMinigame.id, toast: await page.evaluate(() => (document.body.innerText || '').match(/(unlock|access|card|keycard)[^\n]{0,60}/i)?.[0] || null) });
  await sleep(1200); frame(mark, 'after'); await sleep(700);
  mark('end');
};
