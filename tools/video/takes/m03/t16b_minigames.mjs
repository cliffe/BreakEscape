// t16b_minigames (m03): RFID reader at the server room's card reader (door interact, cloner in the starting kit, nothing emulated), then the Executive Computer pc... see M03_* env for probes.
// Entry state: new-game.rb ... --start-room main_hallway --set briefing_played=true
// Record: BE_SPRITE=marcus_hale tools/video/takes/run-take.sh m03 t16b_minigames "--start-room main_hallway --set briefing_played=true" "--hide-hud --zoom-step 1"
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  console.error('NEARBY', JSON.stringify(s.nearby.map(n => [n.id, n.kind, Math.round(n.x), Math.round(n.y)])), 'player', JSON.stringify(s.player.x + ',' + s.player.y));
  console.error('INV', JSON.stringify(await page.evaluate(() => (window.inventory && window.inventory.items || []).map(i => i && i.scenarioData && [i.scenarioData.type, i.scenarioData.name]))));
}
export default async (page, bridge, mark) => {
  await sleep(1000);
  // Client-side only (no game row edit): put one saved card on the cloner so the reader offers Emulate.
  await page.evaluate(() => {
    const c = window.inventory.items.find(i => i && i.scenarioData && i.scenarioData.type === 'rfid_cloner');
    c.scenarioData.saved_cards = [{ card_id: 'receptionist_badge', rfid_protocol: 'MIFARE_Classic_Weak_Defaults', name: 'Staff Access Badge', rfid_data: { hex: '0000000000', facility: 0, cardNumber: 0 } }];
  });
  const DOOR = process.env.M03_DOOR || 'door:main_hallway->server_room';
  await bridge.moveToNear(DOOR, { timeoutMs: 20000 });
  await sleep(900);
  mark('door-interact');
  const r = await bridge.interact(DOOR, { timeoutMs: 20000 });
  console.error('INTERACT', JSON.stringify(r).slice(0, 300));
  await sleep(1500);
  const st = await bridge.getState();
  mark('open', { mg: st.activeMinigame });
  await sleep(2500);
  if (process.env.M03_PROBE_DOM) console.error('DOM', await page.evaluate(() => document.body.innerText.slice(0, 600)));
  await page.evaluate(() => window.MinigameFramework.endMinigame(false));
  await sleep(900);
  mark('closed');
};
