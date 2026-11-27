// t14a_server_minigames (m02): the backup-recovery screen on hospital_recovery_console in server_room.
//   Ghost's video call ('Before you touch that console') opens over this screen the first time the console is used with the manifest in hand: the entry flags below pre-set ghost_offer_made and ghost_deal_refused so neither of Ghost's two console calls fires.
//   (was: chain, a mark at each beat: (1) hospital_recovery_console (backup-recovery screen), (2) flag_station_dropsite (flag-station screen).
// (The RFID door tap is not achievable: with a keycard the reader just opens the door with a toast, the RFID screen needs a cloner item m02 never gives; skipped, see takes_m02.md.)
// Entry state: head-start in server_room with VM flag 3 submitted (the recovery console needs it):
//   new-game.rb m02_ransomed_trust --start-room server_room --set briefing_played=true --submit-flag hospital_backup_server:flag_3 --set ghost_offer_made=true --set ghost_deal_refused=true
// Record: tools/video/takes/run-take.sh m02 t14a_server_minigames "--start-room server_room --set briefing_played=true --submit-flag hospital_backup_server:flag_3 --set ghost_offer_made=true --set ghost_deal_refused=true" "--hide-hud"   (the screen is a DOM overlay; zoom-step makes no difference to it)
// Marks: recovery-start, recovery-open, recovery-hold-end, recovery-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
async function closeAll(bridge) { for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); } }
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('recovery-start');
  let r = await bridge.interact('hospital_recovery_console', { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('recovery interact ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('backup-recovery', { timeoutMs: 8000 });
  const st = await bridge.minigame.getState();
  mark('recovery-open', { id: st && st.id, title: st && st.title });
  console.error('RECOVERY-TEXT', JSON.stringify(st && st.text).slice(0, 1500));
  await sleep(3200);
  mark('recovery-hold-end');
  await closeAll(bridge);
  mark('recovery-closed');
  await sleep(900);
  await sleep(800);
};
