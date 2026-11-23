// t26_case_safe (m06, keyless, NOT YET RUN): satoshi_office (Kemal is not in this room). (1) the biometric pad on satoshi_signing_case (briefcase): needs one injected unnamed lift in gameState.biometricSamples or it refuses with a toast; held 3 s, nothing presented, closed (check frames for any name or code text). (2) the PIN pad of executive_safe (safe): three wrong digits (DIGITS), never ENTER, closed.
// Entry state (new-game): --imports=none --unlock executive_wing --unlock satoshi_office --start-room satoshi_office --set briefing_played=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh marcus_hale t26_case_safe "<flags above>" "--hide-hud --zoom-step 1"
// Marks: case-open, case-held, case-closed, safe-open, safe-typed, safe-closed. Satoshi stands at (5,6): moveToNear may bump him; he has no sight challenge.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, typeKeys, closeAll, DIGITS } from './_cres.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await page.evaluate(() => { const gs = window.gameState; gs.biometricSamples = gs.biometricSamples || []; gs.biometricSamples.push({ id: 'fp_unknown_lift', type: 'fingerprint', owner: 'Unknown', ownerId: 'unknown', ownerName: 'Unknown', quality: 0.55, rating: 'Fair', pattern: 'loop', identified: false, sourceObjectId: 'x', sourceRoomId: 'satoshi_office', sourceName: 'Lift', collectedAt: new Date().toISOString() }); });
  await sleep(300);
}
export default async (page, bridge, mark) => {
  await sleep(900);
  await bridge.moveToNear('satoshi_signing_case', { timeoutMs: 25000 }); await sleep(800);
  await openMg(bridge, 'satoshi_signing_case', 'case', mark); await sleep(3200); mark('case-held');
  await closeAll(page, bridge); mark('case-closed'); await sleep(900);
  await bridge.moveToNear('executive_safe', { timeoutMs: 25000 }); await sleep(800);
  await openMg(bridge, 'executive_safe', 'safe', mark); await sleep(1800);
  await typeKeys(page, DIGITS, mark, 'safe', 500); await sleep(1500);
  await closeAll(page, bridge); mark('safe-closed'); await sleep(1000);
};
