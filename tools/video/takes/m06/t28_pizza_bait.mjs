// t28_pizza_bait (m06, keyless, NOT YET RUN): blockchain_lab pizza (pizza_boxes, takeable, droppable, magnet tempt 60, only hunger-need NPCs, the two trading-floor extras). Pick it up, walk it through the unlocked lab door to trading_floor (lab connects west to the floor), drop it ("Drop here" via inventoryAct), watch about 12 s for staff drifting to it. Needs office-life sims running. The whole run is long; the edit takes 0.5 s.
// Entry state (new-game): --imports=none --unlock trading_floor --start-room blockchain_lab --set briefing_played=true   Record flags: "--hide-hud --zoom-step 1"   (hud hidden: the drop uses inventoryAct, no tray needed on camera)
// Record: MISSION=m06 run.sh daniel_seo t28_pizza_bait "<flags above>" "--hide-hud --zoom-step 1"
// Marks: pizza-picked, floor-entered, pizza-dropped, watch-end (with npc positions).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom } from '../m05/_live.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear('pizza', { timeoutMs: 25000 }); await sleep(800); }
export default async (page, bridge, mark) => {
  await sleep(900);
  const r = await bridge.interact('pizza', { timeoutMs: 20000, approach: false }); await sleep(900);
  const inv = (await bridge.getState()).inventory.map(x => x.name);
  mark('pizza-picked', { ok: r && r.ok, inv }); if (!inv.some(n => /pizza/i.test(n))) throw new Error('pizza not in inventory ' + JSON.stringify(inv));
  const DOOR = 'door:blockchain_lab->trading_floor';
  const mv = await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); mark('door-near', { r: JSON.stringify(mv).slice(0, 200), p: (await bridge.getState()).player });
  const it = await bridge.interact(DOOR, { timeoutMs: 20000, approach: false }); mark('door-interact', { r: JSON.stringify(it).slice(0, 200) });
  await sleep(4000);
  if ((await bridge.getState()).player.room !== 'trading_floor') { const e = await bridge.enterRoom('trading_floor', { timeoutMs: 30000 }); mark('enterRoom', { r: JSON.stringify(e).slice(0, 200) }); }
  if ((await bridge.getState()).player.room !== 'trading_floor') throw new Error('did not reach trading_floor');
  mark('floor-entered'); await sleep(1200);
  const d = await bridge.inventoryAct('pizza', 'Drop here'); mark('pizza-dropped', { ok: d && d.ok, r: JSON.stringify(d).slice(0, 160) });
  await sleep(12000);
  mark('watch-end', { npcs: await page.evaluate(() => ['lerato_dlamini', 'tomasz_wisniewski', 'trader_npc'].map(id => { const n = window.npcManager.getNPC(id); return n && n._sprite && [id, Math.round(n._sprite.x), Math.round(n._sprite.y)]; })) });
};
