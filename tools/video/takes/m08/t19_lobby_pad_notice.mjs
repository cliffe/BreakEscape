// t19_lobby_pad_notice (m08, keyless, NOT YET RUN): main_lobby. (1) the visitor badge printer PIN pad (badge_printer, pc, lockType pin): PAD.all typed (3 wrong digits), never ENTER, closed. (2) the clean note: security_notice (smartscreen, "SECURITY POSTURE: LEVEL RED ..."), no credential or digit run, held 2.5 s. Never the break-room post-it.
// Entry state (new-game): --imports=none --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh vivian_ashby t19_lobby_pad_notice "--imports=none --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: pad-open, pad-typed, closed, notice-open, notice-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, typeKeys, closeAll, PAD } from './_c8.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear('badge_printer', { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1200); await openMg(bridge, 'badge_printer', 'pad', mark); await sleep(1800);
  await typeKeys(page, PAD.all, mark, 'pad', 500); await sleep(1500); await closeAll(page, bridge); mark('closed'); await sleep(1000);
  await bridge.moveToNear('security_notice', { timeoutMs: 25000 }); await sleep(800);
  await openMg(bridge, 'security_notice', 'notice', mark); await sleep(2500); await closeAll(page, bridge); mark('notice-closed'); await sleep(800);
};
