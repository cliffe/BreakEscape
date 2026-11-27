// t16a_minigames (m03): server_room: key-selection screen on the filing cabinet, then the flag station (drop-site, no flags submitted). Each opens, holds, closes without any action.
// Entry state: new-game.rb ... --start-room server_room --unlock server_room --set briefing_played=true
// Record: BE_SPRITE=marcus_hale tools/video/takes/run-take.sh m03 t16a_minigames "--start-room server_room --unlock server_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// Probe mode (M03_PROBE=1): only dumps nearby objects. Marks: cabinet-open/-closed, station-open/-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  console.error('NEARBY', JSON.stringify(s.nearby.map(n => [n.id, n.kind, Math.round(n.x), Math.round(n.y)])), 'player', JSON.stringify(s.player.x + ',' + s.player.y));
}
// Key-selection screen: m03 has no key items (its cabinets are pick-only), so call the engine's own starter with one made-up brass key (cuts that fit no lock). Never opened by an interact, never unlocks anything.
async function keyScreen(page, bridge, mark, id, hold) {
  await bridge.moveToNear(id, { timeoutMs: 20000 });
  await sleep(900);
  mark('keys-start');
  const r = await page.evaluate((id) => {
    const room = window.rooms && window.rooms.server_room;
    const objs = room && room.objects ? Object.values(room.objects) : [];
    const lockable = objs.find(o => o && o.scenarioData && o.scenarioData.id === id);
    if (!lockable) return 'no lockable (' + objs.length + ')';
    const key = { scenarioData: { id: 'brass_key_demo', key_id: 'brass_key_demo', name: 'Brass Key', type: 'key', keyPins: [20, 40, 25, 60] }, name: 'key', objectId: 'brass_key_demo' };
    window.startKeySelectionMinigame(lockable, 'item', [key], 'cabinet_key_never_matches', () => {});
    return 'ok';
  }, id);
  if (r !== 'ok') throw new Error('key screen: ' + r);
  await sleep(600);
  mark('keys-open', { mg: (await bridge.getState()).activeMinigame });
  await sleep(hold);
  await page.evaluate(() => window.MinigameFramework.endMinigame(false));
  await bridge.waitForMinigameClosed({ timeoutMs: 5000 });
  mark('keys-closed');
  await sleep(900);
}
async function moment(page, bridge, mark, id, tag, hold) {
  await bridge.moveToNear(id, { timeoutMs: 20000 });
  await sleep(900);
  mark(tag + '-interact');
  const r = await bridge.interact(id, { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + id + JSON.stringify(r).slice(0, 200));
  await sleep(600);
  const st = await bridge.getState();
  mark(tag + '-open', { mg: st.activeMinigame });
  await sleep(hold);
  await page.evaluate(() => { if (window.MinigameFramework && window.MinigameFramework.endMinigame) window.MinigameFramework.endMinigame(false); });
  await bridge.waitForMinigameClosed({ timeoutMs: 5000 });
  mark(tag + '-closed');
  await sleep(900);
}
export default async (page, bridge, mark) => {
  if (process.env.M03_PROBE) { await sleep(500); return; }
  await sleep(1000);
  await keyScreen(page, bridge, mark, process.env.M03_CAB, 2500);
  await moment(page, bridge, mark, process.env.M03_STATION, 'station', 2200);
};
