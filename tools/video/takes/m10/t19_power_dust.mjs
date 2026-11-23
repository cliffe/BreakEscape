// t19_power_dust (m10, keyless, NOT YET RUN): power_room, the fingerprint kit on the Bypass Panel (bypass_panel, hasFingerprint, easy). BRUSH ONLY via dustBrush (no lift, no compare: candidate cards carry names). Crop the edit to .dusting-canvas.
// Entry (new-game): --imports=none --start-room power_room --unlock power_room --set briefing_played=true   Record: "--hide-hud --zoom-step 1"   (avatar ngozi_adeyemi)
// start-room does not fire room_entered, so Wendell stays hidden and the HaX call does not ring (cut_by_hand unset). Motion lights may be dark until moved; check the frame behind the minigame.
// Record: MISSION=m10 run.sh ngozi_adeyemi t19_power_dust "<flags>" "--hide-hud --zoom-step 1"
// Marks: kit-open, step:find, found, powder, dust-pass, dusted, dust-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { dustBrush } from './_c10.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); const m = await bridge.moveToNear('bypass_panel', { timeoutMs: 25000 }); if (!m || !m.ok) throw new Error('moveToNear bypass_panel ' + JSON.stringify(m).slice(0, 200)); await sleep(800); }
export default async (page, bridge, mark) => { await sleep(1600); await dustBrush(page, bridge, mark, 'bypass_panel'); };
