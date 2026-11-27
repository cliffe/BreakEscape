// t28_phone_contacts (m09, keyless, NOT YET RUN): the player's phone contact list as the "contact cards" flash: Gary Whitlock, David Torres, the Recruiter, Agent 0x99. Nightshade's row is hidden by a 30 ms DOM interval (his card gives away an m08 outcome) and every last-message preview is hidden (names and avatars only). Nothing picked. List held 3.2 s.
// Entry state (new-game): --imports=none --start-room loading_dock --set briefing_played=true   Record: "" (no --hide-hud: the phone opens from the tray)
// Record: MISSION=m09 run.sh mei_lin_chow t28_phone_contacts "<flags>" ""
// Marks: phone-open (contact names, preview texts), list-held, linger-end. Check frames: no Nightshade row, no preview text.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1200); const r = await bridge.openInventoryItem('phone'); if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await page.evaluate(() => { if (window.__cardHide) return; window.__cardHide = setInterval(() => { document.querySelectorAll('.contact-item').forEach(el => { if (/Nightshade|0x47/i.test(el.textContent)) el.style.display = 'none'; const p = el.querySelector('.contact-last-message'); if (p) p.style.visibility = 'hidden'; }); }, 30); });
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  mark('phone-open', { names: await page.evaluate(() => [...document.querySelectorAll('.contact-item .contact-name')].map(e => e.textContent.trim())) }); await sleep(3200); mark('list-held'); await sleep(600); mark('linger-end');
};
