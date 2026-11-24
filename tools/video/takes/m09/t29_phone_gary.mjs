// t29_phone_gary.mjs (m09, keyless, NOT YET RUN): Gary Whitlock's voiced incoming call as the "phone chat with reply choices showing" shot. It rings 1.5 s after the first try at the salvage keypad (door_unlock_attempt, m02_gary_protected). The take opens the keypad off camera, closes it, waits for the ring, answers, subtitle-observes, and stops when the reply menu shows ("How's the new job?" / "Thanks, Gary."), held 2 s; never picks. His call names the cipher type (a hint, no answer): the edit may use the menu only.
// Entry state (new-game): --imports=none --start-room tape_room --unlock tape_room --set briefing_played=true --set m02_gary_protected=true   Record: ""   Env: BE_KEEP_RING=1
// Record: BE_KEEP_RING=1 MISSION=m09 run.sh vivian_ashby t29_phone_gary "<flags>" ""
// Marks: keypad-tried, ring-seen, answered, sub:*, choices-shown, linger-end. TODO first run: door id (resolved from nearby), and whether opening the keypad fires door_unlock_attempt (else interact once more).
import { sleep, clearScreen, watchVoice, awaitChoice } from '../lib/lib.mjs';
import { closeAll, doorId } from './_c9x.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await page.evaluate(() => { window.__subs = []; const seen = new WeakSet(); setInterval(() => document.querySelectorAll('.call-subtitle').forEach(n => { if (!seen.has(n)) { seen.add(n); window.__subs.push({ t: performance.timeOrigin + performance.now(), text: n.textContent.trim() }); } }), 40); });
  let nsub = 0; const drain = async () => { const a = await page.evaluate(() => window.__subs.slice()).catch(() => []); for (; nsub < a.length; nsub++) mark('sub:' + a[nsub].text.slice(0, 60), { text: a[nsub].text }, a[nsub].t); };
  const timer = setInterval(drain, 200);
  await sleep(1000); const D = await doorId(bridge, 'tape_room', 'salvage_cage');
  await bridge.moveToNear(D, { timeoutMs: 25000 }); await sleep(700); const ir = await bridge.interact(D, { timeoutMs: 20000, approach: false }).catch(e => ({ err: String(e).slice(0, 120) })); mark('keypad-tried', { D, ir: JSON.stringify(ir).slice(0, 200), mg: (await bridge.getState()).activeMinigame }); await sleep(900); await closeAll(page, bridge);
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < 20000) { ok = await page.evaluate(() => { const b = document.querySelector('.incoming-call-answer'); return !!(b && b.offsetParent); }).catch(() => false); if (ok) break; await sleep(100); }
  if (!ok) throw new Error('no ring'); mark('ring-seen'); await sleep(1500);
  await page.evaluate(() => document.querySelector('.incoming-call-answer').click()); mark('answered');
  const d = await awaitChoice(bridge, 60000).catch(() => null); mark('choices-shown', { choices: d && d.choices && d.choices.map(c => c.text) }); await sleep(2000);
  await vw.stop(); clearInterval(timer); await drain(); mark('linger-end');
};
