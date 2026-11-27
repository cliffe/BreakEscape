// t26_phone_hax (m08, keyless, NOT YET RUN): the player's phone, contact "Agent HaX" (agent_0x99): list, thread, hub choices shown, nothing picked. Early-state hub choices ("What does the Director need from me?", "Where would the door logs be?", "How do I get into the server room?", ...) name no suspect; her first-call text says "a name I probably know". Replaces the live-mode t02_hax_phone for this set.
// Entry state (new-game): --imports=none --set briefing_played=true   Record: "" (no --hide-hud: the phone opens from the tray)
// Record: MISSION=m08 run.sh marcus_hale t26_phone_hax "--imports=none --set briefing_played=true" ""
// Marks: phone-open, contact-picked, thread-shown, linger-end. Check frames: no suspect named, no PIN/code text.
import { sleep, clearScreen, awaitChoice } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1200); const r = await bridge.openInventoryItem('phone'); if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 }); mark('phone-open'); await sleep(2200);
  const c = await bridge.minigame.clickText('Agent HaX'); mark('contact-picked', { ok: c && c.ok }); await sleep(2500);
  const d = await awaitChoice(bridge, 8000).catch(() => null);
  mark('thread-shown', { choices: d && d.choices.map(x => x.text) }); await sleep(3500); mark('linger-end');
};
