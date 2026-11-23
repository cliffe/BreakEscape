// t16_biometric_door (m04, keyless): the plant-room fingerprint reader in Hall 2. The lift is injected in setup (window.gameState.biometricSamples, the shape normaliseSample gives), off camera, so the take
// is just: reader opens, the lifted print is presented (key 1), Access Granted, the door opens. Relay is marked defeated so her walk-in chat does not fire.
// Entry state: new-game.rb m04_critical_failure --imports=none --start-room battery_hall_2 --set briefing_played=true --set cipher_walked=true --set operative_relay_defeated=true --set vance_print_lifted=true
// Record: BE_SPRITE=frank_callahan tools/video/takes/run-take.sh m04 t16_biometric_door "<same flags>" "--hide-hud --zoom-step 1"
// Marks: reader-open, print-presented, door-open, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await page.evaluate(() => {
    const gs = window.gameState; gs.biometricSamples = gs.biometricSamples || [];
    gs.biometricSamples.push({ id: 'fp_robert_vance', type: 'fingerprint', owner: 'Robert Vance', ownerId: 'robert_vance', ownerName: 'Robert Vance', quality: 0.96, rating: 'Perfect', pattern: 'loop', identified: true, sourceObjectId: 'hall1_round_panel', sourceRoomId: 'battery_hall_1', sourceName: 'Duty Round Panel', collectedAt: new Date().toISOString() });
    try { window.__test.throttleFps(20); } catch (_) {}
  });
  const m = await bridge.moveToNear('door:battery_hall_2->plant_room', { timeoutMs: 20000 });
  console.error('NEAR DOOR', JSON.stringify(m).slice(0, 200));
  await sleep(1000);
}
export default async (page, bridge, mark) => {
  await sleep(1500);
  const r = await bridge.interact('door:battery_hall_2->plant_room', { approach: false, timeoutMs: 20000 });
  mark('reader-open', { ok: r && r.ok, mg: (await bridge.getState()).activeMinigame });
  await sleep(2800);
  await page.keyboard.press('1');
  mark('print-presented');
  for (let i = 0; i < 40 && (await bridge.getState()).activeMinigame; i++) await sleep(200);
  await sleep(600);
  for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
  mark('door-open');
  await sleep(2500);
  mark('linger-end');
};
