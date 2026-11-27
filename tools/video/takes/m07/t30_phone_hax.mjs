// t30_phone_hax (m07, keyless, NOT YET RUN): the player's phone, contact "Agent HaX" (agent_0x99): list, thread, held; nothing picked. Same flow as m05 t19 / m06 t27. HaX's lines are text only (no cached voice).
// Entry state (new-game): --imports=none --start-room operations_floor --set briefing_played=true --set inside_reached=true --set architect_t20_played=true   Record: "" (no --hide-hud: the phone opens from the tray)
// Record: MISSION=m07 run.sh marcus_hale t30_phone_hax "<flags>" ""
// Marks: phone-open, contact-picked, thread-shown, linger-end. TODO: the thread may be short before progress; accept the list if so. Check no PIN/code text in the thread frames.
import { sleep, clearScreen, awaitChoice } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1200); const r = await bridge.openInventoryItem('phone'); if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 }); mark('phone-open'); await sleep(2200);
  const c = await bridge.minigame.clickText('Agent HaX'); mark('contact-picked', { ok: c && c.ok }); await sleep(2500);
  const d = await awaitChoice(bridge, 6000).catch(() => null);
  mark('thread-shown', { choices: d && d.choices.map(x => x.text) }); await sleep(3500); mark('linger-end');
};
