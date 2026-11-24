// t12_power_room (m10, keyless, NOT YET RUN, needs BE_KEEP_RING=1): the NEW MECHANIC chain (picks "New mechanic"). Start workshop_floor, walk east into the dark power room (motion lights strike; room_entered rings HaX 1.5 s later), answer,
// "Top row. The third breaker from the left feeds the shutter." (3.70 s), menu [And the gallery camera?] > [Just that one?] > "Third from the left. Go and pull it." > [Got it.]; walk to the Shutter Isolator, click: lamp amber to green,
// Wendell (visible on entry, wendell_outcome seeded) barks "Your funeral. I didn't see a thing." (3.38 s). cut_step=2 stays seeded: the isolator mapping writes cut_step 3 then gallery_shutter_cut, which is what the bark tests.
// Entry (new-game): --imports=none --start-room workshop_floor --unlock workshop_floor --unlock power_room --set briefing_played=true --set cut_by_hand=true --set cut_step=2 --set wendell_outcome='"worked_round"'   Record: ""
// Record: BE_KEEP_RING=1 MISSION=m10 run.sh lucia_moreno t12_power_room "<flags>" ""
// Marks: walk-start, entered, lights?, ring-seen, answered, sub:*, choice:*, to-isolator, isolator-click, bark-seen, linger-end. Do NOT set breach_open (it reveals Kowalczyk/Arakawa/Quintero copies in this room). Imran/Gary in workshop_floor may open a chat first: check.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { playThrough } from '../m05/_live.mjs';
import { watchSubs, throttle } from './_c10.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await throttle(page); await sleep(800); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); const stopSubs = await watchSubs(page, mark);
  await sleep(1200); for (let i = 0; i < 3; i++) { await clearScreen(page, bridge, () => {}); await sleep(600); } mark('walk-start');
  const e = await bridge.enterRoom('power_room', { timeoutMs: 45000 }); mark('entered', { ok: e && e.ok, r: JSON.stringify(e).slice(0, 120) });
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < 20000) { ok = await page.evaluate(() => { const b = document.querySelector('.incoming-call-answer'); return !!(b && b.offsetParent); }).catch(() => false); if (ok) break; const mg = (await bridge.getState().catch(() => ({}))).activeMinigame; if (mg) { mark('call-already-open', { mg: JSON.stringify(mg).slice(0, 120) }); break; } await sleep(100); }
  if (!ok && !(await bridge.getState()).activeMinigame) throw new Error('no ring on power_room entry (room_entered not fired? a chat open?)');
  mark('ring-seen', { afterMs: Date.now() - t0 }); await sleep(1500);
  if (ok) await page.evaluate(() => document.querySelector('.incoming-call-answer').click()); mark('answered'); await sleep(1200);
  await playThrough(page, bridge, mark, vw, { steps: [/And the gallery camera/i, /Just that one/i, /Got it/i], dwellMs: 1800, settleMs: 700, timeoutMs: 90000 });
  await vw.stop(); await sleep(1200); await stopSubs();
  await bridge.moveToNear('shutter_isolator', { timeoutMs: 25000 }); await sleep(900); mark('to-isolator', (await bridge.getState()).player);
  mark('isolator-click'); await bridge.interact('shutter_isolator', { timeoutMs: 15000, approach: false });
  await sleep(1800); mark('bark-seen?', { note: 'check frames for the Wendell bubble and the green lamp' });
  await sleep(2500); await clearScreen(page, bridge, () => {}); mark('linger-end');
};
