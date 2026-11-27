// t28_pizza_bait (m06, keyless, NOT YET RUN): blockchain_lab pizza (pizza_boxes, takeable, droppable, magnet tempt 60, only hunger-need NPCs, the two trading-floor extras). Pick it up, walk it through the unlocked lab door to trading_floor (lab connects west to the floor), drop it ("Drop here" via inventoryAct), watch about 12 s for staff drifting to it. Needs office-life sims running. The whole run is long; the edit takes 0.5 s.
// Entry state (new-game): --imports=none --unlock trading_floor --start-room blockchain_lab --set briefing_played=true   Record flags: "--zoom-step 1"   (HUD ON: with --hide-hud the tray is hidden and inventoryAct "Drop here" fails with item-off-screen)
// Record: MISSION=m06 run.sh daniel_seo t28_pizza_bait "<flags above>" "--zoom-step 1"
// Marks: pizza-picked, floor-entered, pizza-dropped, watch-end (with npc positions).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom } from '../m05/_live.mjs';
// The lab's start strip (above the long table) is sealed from the pizza pocket by 7 px gaps: pathing fails (23 Nov), so the player is placed beside the pizza and beside the door by setting the position directly (a cut in the edit; logged).
const tp = (page, x, y) => page.evaluate(([x, y]) => { const p = window.player; p.setPosition(x, y); if (p.body && p.body.reset) p.body.reset(x, y); }, [x, y]);
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await tp(page, 100, 252); await sleep(600); await bridge.moveToNear('pizza', { timeoutMs: 25000 }); await sleep(800); }
export default async (page, bridge, mark) => {
  await sleep(900);
  let r, inv = [];
  for (let k = 0; k < 4 && !inv.some(n => /pizza/i.test(n)); k++) {
    const st = await bridge.getState(); const pz = st.nearby.find(n => n.id === 'pizza');
    mark('pizza-try', { k, player: [Math.round(st.player.x), Math.round(st.player.y)], pizza: pz && [Math.round(pz.x), Math.round(pz.y)] });
    if (k > 0) { await bridge.moveToNear('pizza', { timeoutMs: 25000 }); await sleep(600); }
    r = await bridge.interact('pizza', { timeoutMs: 20000, approach: k > 1 }); await sleep(900);
    inv = (await bridge.getState()).inventory.map(x => x.name);
  }
  mark('pizza-picked', { ok: r && r.ok, inv }); if (!inv.some(n => /pizza/i.test(n))) throw new Error('pizza not in inventory ' + JSON.stringify(inv));
  const DOOR = 'door:blockchain_lab->trading_floor'; await sleep(1500); await tp(page, 40, 80); await sleep(700);
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
