// t15_disguise_tailgate (lab_physical_pentest, for ca12 and ca15 trailers): the player in the courier hi-vis follows Len through the
// records door as it opens for his badge read; he says "Delivery, is it? Records desk is straight ahead." (cached, 3.70 s). No challenge.
// Entry state: fresh default game, NO new-game flags (start room briefing_room). setup() (off camera) closes Ruth's opening briefing,
// takes the vest from its hook and puts it on through the real confirm button (briefing room = unseen), walks to the parking tile
// (open_plan tile 6,2 = world 1168,80, between the ledger shelves), then waits for one whole door cycle so the take starts on a shut gate.
// Run (the game is lab_physical_pentest, so the mission arg must name it; see the scout note on run-take.sh):
//   tools/video/takes/run-take.sh lab_physical_pentest t15_disguise_tailgate "" "--hide-hud --zoom-step 1"   (the script lives in takes/ca12/)
// Marks: vest-on, parked, gate-shut-seen, gate-open (len_at_door true), walk-start, leg:*, room-entered:secure_area, bark_start/bark_end
// (Len, bubble), tailgate-credited (kp_badge_tailgated true), end. The 3 s cut-down is gate-open - 0.5 s .. room-entered + 1.5 s.
import { sleep, labStart, takeKit, toOpenPlan, waitGlobal, globals, pressButton, watchBubbles, keyLegs, SPEED } from './_labpp.mjs';

export async function setup(page, bridge) {
  const mark = (n, d) => console.error('setup:' + n, d ? JSON.stringify(d) : '');
  await labStart(page, bridge, mark, { readRoe: false });
  await bridge.moveToNear('kit_hivis', { timeoutMs: 15000 }).catch(() => {});
  await bridge.interact('kit_hivis', { timeoutMs: 15000 }); await sleep(1000);
  await pressButton(page, /Put it on/, 8000); await sleep(1500);
  if ((await globals(bridge)).courier_ready !== true) throw new Error('vest not worn (courier_ready false)');
  await toOpenPlan(bridge, mark);
  for (const [x, y] of [[1230, 170], [1230, 120], [1190, 90], [1168, 80]]) await bridge.moveTo(x, y, { timeoutMs: 15000 }).catch(() => {});
  const p = (await bridge.getState()).player; mark('parked', p);
  if (Math.hypot(p.x - 1168, p.y - 80) > 40) throw new Error('not on the parking tile: ' + JSON.stringify(p));
  await waitGlobal(bridge, 'len_at_door', true, 70000); await waitGlobal(bridge, 'len_at_door', false, 70000);   // start on a shut gate
}

export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark);
  mark('vest-on', { courier_ready: (await globals(bridge)).courier_ready });
  mark('gate-shut-seen');
  await waitGlobal(bridge, 'len_at_door', true, 40000); mark('gate-open');
  await sleep(300); mark('walk-start', (await bridge.getState()).player);
  await keyLegs(bridge, [['left', 1008], ['up', 10]], SPEED, mark);
  const t0 = Date.now(); let room = null;
  while (Date.now() - t0 < 6000) { room = await page.evaluate(() => window.currentPlayerRoom).catch(() => null); if (room === 'secure_area') break; await sleep(80); }
  mark('room-entered:' + room);
  if (room !== 'secure_area') { await bw.stop(); throw new Error('did not get into secure_area (gate shut first?); room=' + room); }
  const t1 = Date.now(); let bark = false, cred = false;
  while (Date.now() - t1 < 4500) {
    await bw.drain();
    if (!bark && bw.seen.some(e => /Delivery, is it/i.test(e.text))) { bark = true; mark('bark_start'); }
    if (!cred && (await globals(bridge)).kp_badge_tailgated === true) { cred = true; mark('tailgate-credited'); }
    await sleep(100);
  }
  if (!bark) mark('bark-not-seen');
  await bw.stop(); mark('end');
};
