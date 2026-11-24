// t23c_gen_key (m07, keyless, NOT YET RUN): the KEY lock on door:server_room->generator_room with generator_maintenance_key given by the flags (--give). Key selection screen first (keySelection), pick the maintenance key, then keyTarget click: shoot the last half second of insertion. Same door as t22: use a fresh game.
// Entry state (new-game): --imports=none --unlock server_room --start-room server_room --give generator_maintenance_key --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh marcus_hale t23c_gen_key "<flags>" "--hide-hud --zoom-step 1"
// Marks: interact-door, key-mode, key-selected, key-turn, door-open, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
const DOOR = 'door:server_room->generator_room';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1000); mark('interact-door');
  await bridge.interact(DOOR, { timeoutMs: 20000, approach: false });
  await bridge.waitForMinigame('lockpicking', { timeoutMs: 10000 }); await sleep(900);
  let ks = await bridge.minigame.getState(); mark('key-mode', { keyMode: ks && ks.keyMode }); await sleep(1200);
  const sel = ks && (ks.keySelection || (ks.state && ks.state.keySelection));
  if (sel && sel.length) { const pick = sel.find(s => /maint|plant/i.test(s.label || '')) || sel[0]; await bridge.minigame.clickCanvas(pick.x, pick.y); mark('key-selected', { label: pick.label, n: sel.length }); await sleep(1200); ks = await bridge.minigame.getState(); }
  const kt = ks && (ks.keyTarget || (ks.state && ks.state.keyTarget)); if (!kt) throw new Error('no keyTarget ' + JSON.stringify(ks).slice(0, 400));
  await bridge.minigame.clickCanvas(kt.x, kt.y); mark('key-turn');
  await bridge.waitForMinigameClosed({ timeoutMs: 10000 }); mark('door-open'); await sleep(1000); mark('linger-end');
};
