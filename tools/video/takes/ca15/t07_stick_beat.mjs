// t07_stick_beat: the step-away room beat. Kiosk opens on the "Before the debrief" panel, Look up, then Fatima's bark ("Hang on,
// someone's dropped a memory stick over here."), the stick on the floor, and her ask ("No name on it, nothing. What do you reckon I do with it?").
// Entry state (step-away flags):
//   BE_SPRITE=female_office_worker_v2 run-take.sh ca15_shadow_it t07_stick_beat \
//     "--set episode_e15_shadow_it_state={\"done\":[\"brief\",\"mistake\",\"flip\",\"defend\"]} --set episode_e15_shadow_it_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e15_shadow_it_defend_percent=60" \
//     "--hide-hud --zoom-step 1"
// Holds to look_up + 13 s then ends; never talks to Fatima (the default 'leave' fires at about +53 s, not reached).
// Marks: kiosk-open, look_up, bubble-start/end:<npc>, bark_start, ask_start, ask_end, frame:t+N every 2 s, end. stick_visible is read
// from the frames afterwards (logged in docs/video/takes_ca15.md).
import { sleep, prepare, openKiosk, pressButton, waitButton, watchBubbles, checkSprite } from './_ca15.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true) throw new Error('entry state wrong: kit_defend_done is not true');
}

export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark);
  await checkSprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed');
  await sleep(1000);
  mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let bark = false, ask = false, askEnd = false, next = 2;
  while (Date.now() - t0 < 13000) {
    const el = (Date.now() - t0) / 1000;
    await bw.drain();
    if (!bark && bw.seen.some(e => /memory stick/i.test(e.text))) { bark = true; mark('bark_start'); }
    if (!ask && bw.seen.some(e => /No name on it/i.test(e.text))) { ask = true; mark('ask_start'); }
    if (el >= next) { mark('frame:t+' + next); next += 2; }
    await sleep(100);
  }
  if (!bark || !ask) { await bw.stop(); throw new Error('bubbles missing: bark ' + bark + ' ask ' + ask); }
  const open = await page.evaluate(() => !!(window.npcWorldBubbles && window.npcWorldBubbles.says && [...window.npcWorldBubbles.says.values()].some(s => /No name on it/.test((s.pages || []).join(" ")))));
  if (!open) mark('ask_end'); else mark('ask_still_up_at_end');
  await bw.stop(); mark('end');
};
