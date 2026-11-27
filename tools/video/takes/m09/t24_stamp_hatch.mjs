// t24_stamp_hatch (m09, keyless, NOT YET RUN): restricted_stacks. (1) fingerprint dusting on the rubber stamp (sorensen_stamp, hasFingerprint), BRUSH ONLY (closes before lift/compare; the kit is a starting item); crop the edit to .dusting-canvas. (2) face flash Sorensen behind the hatch mesh (sorensen_hatch, static, koImmune): portrait 1.8 s, closed before her opening menu (narrator lines first).
// Entry state (new-game): --imports=none --start-room restricted_stacks --unlock restricted_stacks --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh vivian_ashby t24_stamp_hatch "<flags>" "--hide-hud --zoom-step 1"
// Marks: kit-open, step:find, found, powder, dust-pass, dusted, closed, sorensen_hatch-open, sorensen_hatch-closed. Check no name on the dusting frames; hatch portrait must not show a choice menu.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { dustBrush, faceFlash } from './_c9x.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear('sorensen_stamp', { timeoutMs: 25000 }); await sleep(800); }
export default async (page, bridge, mark) => {
  await sleep(1400); await dustBrush(page, bridge, mark, 'sorensen_stamp'); await sleep(600);
  await faceFlash(page, bridge, mark, 'sorensen_hatch', 1800); await sleep(500);
};
