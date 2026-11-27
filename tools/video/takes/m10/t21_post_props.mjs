// t21_post_props (m10, keyless, NOT YET RUN): forward_post props. (1) notes: the Citadel Incident File (incident_file, readDisplay; backstory, no code; CHECK the frame text for anything that names the sleeper); (2) the flag station EMPTY (gate_terminal, flag-station, nothing submitted, never typed into); (3) the kettle (fp_kettle: the interact shows its description only, nothing is taken or drunk); (4) the player's phone: contact list, Agent HaX thread, then Victoria Sterling's contact if listed (try/catch: she may not be listed before her call).
// Entry (new-game): --imports=none --start-room forward_post --set briefing_played=true   Record: "" (no --hide-hud, the phone opens from the tray; hide nothing else)   (avatar daniel_seo)
// Record: MISSION=m10 run.sh daniel_seo t21_post_props "<flags>" ""
// Marks: notes-open, notes-closed, flag-open, flag-closed, kettle-interact, phone-open, contact-picked, thread-shown, victoria-picked, linger-end. NOT the VM console (gate_console) and NOT the Maintenance Tag (host and login). Kowalczyk is in the room: her chat must not open (no clicks near her).
import { sleep, clearScreen, awaitChoice } from '../lib/lib.mjs';
import { openMg, closeAll } from './_c10.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(800); }
const xClose = (page) => page.evaluate(() => { for (const x of document.querySelectorAll('.game-display-dialog .game-modal-close')) x.click(); }).catch(() => {});
export default async (page, bridge, mark) => {
  await sleep(1000);
  await bridge.moveToNear('incident_file', { timeoutMs: 25000 }); await sleep(600); await openMg(bridge, 'incident_file', 'notes', mark); await sleep(3000); await xClose(page); await sleep(400); await closeAll(page, bridge); mark('notes-closed'); await sleep(800);
  await bridge.moveToNear('gate_terminal', { timeoutMs: 25000 }); await sleep(600); await openMg(bridge, 'gate_terminal', 'flag', mark); await sleep(3000); await xClose(page); await sleep(400); await closeAll(page, bridge); mark('flag-closed'); await sleep(800);
  await bridge.moveToNear('fp_kettle', { timeoutMs: 25000 }); await sleep(600); mark('kettle-interact'); await bridge.interact('fp_kettle', { timeoutMs: 15000, approach: false }); await sleep(3000); await xClose(page); await sleep(400); await closeAll(page, bridge); await sleep(600);
  const r = await bridge.openInventoryItem('phone'); if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 }); mark('phone-open'); await sleep(2200);
  const c = await bridge.minigame.clickText('Agent HaX'); mark('contact-picked', { ok: c && c.ok }); await sleep(2500);
  const d = await awaitChoice(bridge, 6000).catch(() => null); mark('thread-shown', { choices: d && d.choices.map(x => x.text) }); await sleep(2500);
  try { await bridge.minigame.clickText('Victoria'); mark('victoria-picked'); await sleep(2500); } catch (e) { mark('victoria-missing', { e: String(e).slice(0, 100) }); }
  await xClose(page); await sleep(400); await closeAll(page, bridge); await sleep(1000); mark('linger-end');
};
