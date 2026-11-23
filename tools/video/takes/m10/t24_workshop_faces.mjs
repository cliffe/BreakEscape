// t24_workshop_faces (m10, keyless, NOT YET RUN): workshop_floor face flashes: Imran Siddiqui (imran) and Gary Whitlock (gary_tech, shown on room_entered:workshop_floor only when m02_completed is set and m02_gary_protected is not), so the take walks IN from security_office.
// Entry (new-game): --imports=<file {"m02_completed": true}> --start-room security_office --unlock security_office --unlock workshop_floor --set briefing_played=true   Record: "--hide-hud --zoom-step 1"   (avatar frank_callahan)
// Record: MISSION=m10 run.sh frank_callahan t24_workshop_faces "<flags>" "--hide-hud --zoom-step 1"
// Marks: entered, imran-open/-closed, gary_tech-open/-closed, *-error. Risks: m02_completed may change Imran's knot or add a chat on entry (clear it); the duty guard in security_office may spot the player on the way (blind him as in t17 if needed: not scripted here, start-room means no sight until walked). The raid copies stay hidden (breach_open unset).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { faceFlash } from './_c10.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await page.evaluate(() => { const g = window.npcManager.getNPC('duty_guard'); if (g) g.los = { ...(g.los || {}), range: 1, enabled: false }; }); await sleep(600);
}
export default async (page, bridge, mark) => {
  await sleep(900); const e = await bridge.enterRoom('workshop_floor', { timeoutMs: 45000 }); mark('entered', { ok: e && e.ok }); await sleep(1500);
  for (const id of ['imran', 'gary_tech']) { try { await faceFlash(page, bridge, mark, id); } catch (err) { mark(id + '-error', { e: String(err).slice(0, 150) }); } }
};
