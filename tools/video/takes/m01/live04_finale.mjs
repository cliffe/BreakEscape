// live04_finale (m01): the launch-code decision + ending. ONE-SHOT - film this LAST, immediately before --finish, because
// aborting/launching sets ready_for_debrief and the debrief/conclusion completes the game (which closes the VM console
// link). The flag-3 payoff (the launch code) decides the ending: the closing debrief (m01_closing_debrief.ink) branches on
// whether Operation Shatter was ABORTED or LAUNCHED. The intended heroic path is ABORT.
//
// Finale sequence (driven live by the stage-2 agent; this script captures the device beat safely and documents the rest):
//   1. Confront Derek Lawson (derek_lawson, boss, break_room). The confrontation (m01_derek_confrontation.ink) only opens
//      once the ENTROPY network reveal is read (entropy_reveal_read - set by reading the archive's Network Architecture
//      file in live03). Drive the confrontation; Derek is subdued and drops the ENTROPY Launch Device (takeable).
//   2. Take the launch device, then open it: it is a launch-abort device (mode "launch-abort", id entropy_launch_device).
//      Submit the launch authorisation code (shatter_server:flag_3) OFF CAMERA (never film the flag-entry field). The
//      device then arms: "Launch authorisation accepted - Operation Shatter is yours to abort."
//   3. ON CAMERA: hold on the ARMED device screen, then ABORT (abortConfirmText -> attack_aborted). This is the
//      launch-code decision payoff.
//   4. Call Agent HaX / file the debrief (m01_closing_debrief.ink). If the "optional objectives still open" warning
//      appears, click "End the mission" ON CAMERA (ending-check-end). The conclusion is a bond_visualiser -> credits.
//
// This DEFAULT export is the SAFE device-screen beat only: it opens the launch device from the inventory (if already
// held) and holds on its screen WITHOUT submitting or aborting, so it stays replayable. The real one-shot abort + debrief
// + ending is driven live by the stage-2 agent (bridge.converse / mg + the session's flag-3 submission), not by this
// file, because it depends on live confrontation state. Set FINALE_OPEN_DEVICE=0 to skip even the device open.
// Entry state: LIVE game 90 (playtest04, m01, set 930), all four flags earned; for the device beat, the launch device
// must be in the inventory (after the Derek confrontation).
// Record (LIVE mode):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/90 STORAGE_STATE=<playtest04 login.mjs state> \
//   tools/video/takes/run-take.sh m01 live04_finale "" "--zoom-step 1"
// Marks: device-open, armed-screen, linger-end, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';

const DEVICE_ID = 'entropy_launch_device';

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const inv = ((await bridge.getState()).inventory || []).map(i => i.name || i.id);
  console.error('SETUP inventory', JSON.stringify(inv));
  if (process.env.FINALE_OPEN_DEVICE !== '0' && !inv.some(n => /launch device/i.test(n) || n === DEVICE_ID)) {
    throw new Error('launch device not in inventory - run the Derek confrontation first, or set FINALE_OPEN_DEVICE=0');
  }
  await sleep(500);
}

export default async (page, bridge, mark) => {
  if (process.env.FINALE_OPEN_DEVICE === '0') { mark('skip-device'); await sleep(500); return; }
  await sleep(1000);
  const r = await bridge.openInventoryItem(DEVICE_ID);
  if (!r || r.ok === false) throw new Error('could not open launch device ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('flag-station', { timeoutMs: 8000 }).catch(() => {});
  mark('device-open', await bridge.minigame.getState().catch(e => String(e)));
  await sleep(3500); // hold on OPERATION SHATTER - ARMED. T-72 HOURS TO LAUNCH WINDOW.
  mark('armed-screen');
  await sleep(2500);
  mark('linger-end');
  // SAFE: close without submitting/aborting. The real abort is done live by the stage-2 agent.
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
};
