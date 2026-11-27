// t16_biometric_door (m05, keyless): the data_center door's biometric reader, BEFORE any scan (no lift is presented, no match filmed). Reader opens, held ~3 s, closed. Needs one injected unnamed lift or it refuses with a toast.
// Entry state: new-game.rb m05_insider_trading --imports=none --start-room server_room --set briefing_played=true
// Record: MISSION=m05 run.sh <avatar> t16_biometric_door "--imports=none --start-room server_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: reader-open, reader-held, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
const DOOR = 'door:server_room->data_center';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  // The reader only opens when at least one lift is held (else a refusal toast). One unidentified, unnamed lift is injected off camera; never presented.
  await page.evaluate(() => { const gs = window.gameState; gs.biometricSamples = gs.biometricSamples || []; gs.biometricSamples.push({ id: 'fp_unknown_lift', type: 'fingerprint', owner: 'Unknown', ownerId: 'unknown', ownerName: 'Unknown', quality: 0.55, rating: 'Fair', pattern: 'loop', identified: false, sourceObjectId: 'x', sourceRoomId: 'server_room', sourceName: 'Lift', collectedAt: new Date().toISOString() }); });
  const m = await bridge.moveToNear(DOOR, { timeoutMs: 20000 });
  console.error('NEAR DOOR', JSON.stringify(m).slice(0, 200));
  await sleep(1000);
}
export default async (page, bridge, mark) => {
  await sleep(1500);
  const r = await bridge.interact(DOOR, { timeoutMs: 20000 });
  console.error('INTERACT', JSON.stringify(r).slice(0, 300));
  await sleep(1200);
  { const st = await bridge.getState(); console.error('AFTER', JSON.stringify({ mg: st.activeMinigame, blk: st.blockingUi, p: st.player && [st.player.x, st.player.y], dlg: st.dialogue })); }
  mark('reader-open', { ok: r && r.ok, mg: JSON.stringify((await bridge.getState()).activeMinigame).slice(0, 120) });
  await sleep(3500);
  mark('reader-held');
  for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
  mark('closed');
  await sleep(1500);
};
