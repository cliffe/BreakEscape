// t07_lorna_photo: the step-away room beat (the hook). Kiosk opens on the "Before the debrief" panel, Look up; Lorna's bark L1 "Got a lovely one of the team
// for the studio page." (3.46 s clip, speech 0.33 to 3.05 s) about 1.5 s later, then the ask L2 "It's all of us at our desks. Fine to post?" (3.29 s) about 8 s after L1.
// Nothing is pressed after Look up and Lorna is never talked to (a photo choice would fire Delphine's D1 8 s later; the 45 s silent timer is not reached).
// Entry state (step-away flags; kit_quiet seeded because only the episode-state mapping sets it):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca14_social_media t07_lorna_photo \
//     --set episode_e14_social_media_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\",\"defend\"]} --set episode_e14_social_media_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true --set episode_e14_social_media_defend_percent=100 \
//     "--hide-hud --zoom-step 1"    (pass the --set flags as separate words, JSON without single quotes)
// Marks: player-sprite, kiosk-open, look_up, bubble-start/end:<npc>, l1_start, l2_start, audio-start/end:<npc> (page clock), tts-response (200 audio/mpeg per line,
//   bytes > 0), l1_audio_start, l2_audio_start, gap (L1 start to L2 start, s), frame:t+N each second, end (L2 audio end + 1 s).
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, watchBubbles, spriteCheck, watchTts, watchBarkAudio } from './_ca14.mjs';

export const SEED_STEP_AWAY = ['--set', 'episode_e14_social_media_state={"done":["brief","osint","write","flip","defend"]}', '--set', 'episode_e14_social_media_defend_complete=true', '--set', 'kit_defend_done=true', '--set', 'kit_attack_done=true', '--set', 'kit_quiet=true', '--set', 'episode_e14_social_media_defend_percent=100'];

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_quiet !== true) throw new Error('entry state wrong: kit_defend_done and kit_quiet must be true; got ' + JSON.stringify({ d: g.kit_defend_done, q: g.kit_quiet }));
}

export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark); const tw = await watchTts(page, mark); const aw = await watchBarkAudio(page, mark);
  await spriteCheck(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(1200); mark('frame:step-away-panel');
  mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let l1 = null, l2 = null, next = 1;
  while (Date.now() - t0 < 22000) {
    const el = (Date.now() - t0) / 1000; await bw.drain(); await aw.drain();
    const said = (re) => bw.seen.some(e => re.test(e.text.replace(/\s+/g, ' ')));
    if (!l1 && said(/lovely one of the team/i)) { l1 = Date.now(); mark('l1_start'); mark('frame:l1-bubble'); }
    if (!l2 && said(/all of us at our desks/i)) { l2 = Date.now(); mark('l2_start'); mark('frame:l2-bubble'); }
    if (el >= next) { mark('frame:t+' + next); next += 1; }
    if (l2 && Date.now() - l2 > 4500) break;
    await sleep(80);
  }
  await bw.drain(); await aw.drain(); await tw.drain();
  if (!l1) { await bw.stop(); await aw.stop(); await tw.stop(); throw new Error('L1 bubble never seen (kit_quiet seed did not start it?)'); }
  if (!l2) { await bw.stop(); await aw.stop(); await tw.stop(); throw new Error('L2 bubble never seen'); }
  mark('gap', { l1ToL2S: +((l2 - l1) / 1000).toFixed(2) });
  const voiced = tw.all.filter(l => l.status === 200 && /audio/.test(l.type || '') && l.bytes > 0);
  for (const re of [/lovely one of the team/i, /all of us at our desks/i]) if (!voiced.some(l => re.test(l.text))) { await tw.stop(); throw new Error('line not voiced (no 200 audio, bytes > 0): ' + re + '; tts: ' + JSON.stringify(tw.all)); }
  await bw.stop(); await aw.stop(); await tw.stop(); mark('end');
};
