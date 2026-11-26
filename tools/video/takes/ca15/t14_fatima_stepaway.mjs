// t14_fatima_stepaway: beat 15 of the ca15 r3 trailer. Post-defend "Before the debrief" panel, Look up, Fatima's bark ("Hang on, someone's
// dropped a memory stick over here."), the stick on the floor, then her ask ("No name on it, nothing. What do you reckon I do with it?").
// Same entry state and flow as t07, no hold, no camera move, never talks to Fatima. The edit takes its marks from the audio:
//   bark_end = end of the bark speech, ask_audio_start/end = speech edges (silencedetect -40 dB on the trimmed take).
//   in = bark_end + 0.4, out = in + 6.32; requires ask_audio_start - bark_end >= 1.9 s and ask_audio_end <= out - 0.3.
// Entry state:
//   BE_SPRITE=female_office_worker_v2 run-take.sh ca15_shadow_it t14_fatima_stepaway \
//     "--set episode_e15_shadow_it_state={\"done\":[\"brief\",\"mistake\",\"flip\",\"defend\"]} --set episode_e15_shadow_it_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e15_shadow_it_defend_percent=60" \
//     "--hide-hud --zoom-step 1"
// Marks: kiosk-open, look_up, bubble-start/end:<npc>, bark_start, ask_start, ask_end (bubble gone), frame:t+N every 2 s, end.
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
  const t0 = Date.now(); let bark = false, ask = false, next = 2, askGoneAt = 0;
  while (Date.now() - t0 < 16000) {
    const el = (Date.now() - t0) / 1000;
    await bw.drain();
    if (!bark && bw.seen.some(e => /memory stick/i.test(e.text))) { bark = true; mark('bark_start'); }
    if (!ask && bw.seen.some(e => /No name on it/i.test(e.text))) { ask = true; mark('ask_start'); }
    if (ask) {
      const open = await page.evaluate(() => !!(window.npcWorldBubbles && window.npcWorldBubbles.says && [...window.npcWorldBubbles.says.values()].some(s => /No name on it/.test((s.pages || []).join(' ')))));
      if (!open && !askGoneAt) { askGoneAt = Date.now(); mark('ask_end'); }
      if (askGoneAt && Date.now() - askGoneAt > 1500) break;
    }
    if (el >= next) { mark('frame:t+' + next); next += 2; }
    await sleep(100);
  }
  if (!bark || !ask) { await bw.stop(); throw new Error('bubbles missing: bark ' + bark + ' ask ' + ask); }
  await bw.stop(); mark('end');
};
