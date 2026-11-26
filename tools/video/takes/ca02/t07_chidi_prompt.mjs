// t07_chidi_prompt: the end shot. Kiosk opens on the step-away panel ("Before the debrief"), a hold on it, Look up, the room opens and Chidi (at kit_ca02_pc) barks C1
// "Got a CV in for the driver job." (2.33 s cached, speech 0.22 to 2.04 s) about 1.5 s after the press; bark 2 (the enable-content question, which names the tell) follows ~5.5 s after
// kit_ca02_there and must NOT be in the shot: the edit's out is bark1_start + 2.8 s. The take runs to look_up + 20 s (nothing is pressed; no choice menu opens, no ask cue is clicked)
// so the margin to Fatima's third bark (about 16 s after Look up) is logged. NEVER click in the room.
// Edit use: in = bark1_start - 2.8 s (opens on the Look up panel 1.3 s before the press), out = bark1_start + 2.8 s (shot 5.6 s).
// Entry state (step-away; kit_quiet comes from the game, percent under 85):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca02_cv_lures t07_chidi_prompt "--set episode_e2_cv_lures_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\",\"defend\"]} --set episode_e2_cv_lures_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e2_cv_lures_defend_percent=60" "--hide-hud --zoom-step 1"
// Marks: player-sprite, kiosk-open, panel-up (Look up visible), globals-before-look-up, look_up, bark1_start, bark2_start, bark3_start (Fatima), bubble-start/end:<npc>,
//   tts-response (per bark), audio-start/end:<npc>, ca02-out-set, ca02-there-set, frame:* (panel, t+N every 1 s), choice-menu-opened (only if it shows), globals-end, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, watchBubbles, spriteCheck, watchBarkAudio, watchTts2 as watchTts } from './_ca02.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_caught === true) throw new Error('entry state wrong: kit_defend_done true and kit_caught not true needed; got ' + JSON.stringify({ d: g.kit_defend_done, c: g.kit_caught, q: g.kit_quiet }));
}

export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark); const tw = watchTts(page, mark); const aw = await watchBarkAudio(page, mark);
  await spriteCheck(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons: ' + JSON.stringify(await buttons(page)));
  mark('panel-up'); await sleep(1100); mark('frame:look-up-panel'); await sleep(400);   // the dry-run screenshot is async: leave it time before the press
  const g0 = (await bridge.getState()).globals || {};
  mark('globals-before-look-up', { kit_quiet: g0.kit_quiet, kit_ca02_out: g0.kit_ca02_out, kit_ca02_there: g0.kit_ca02_there });
  mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let out = false, there = false, b1 = false, b2 = false, b3 = false, menu = false, next = 1;
  const norm = (s) => s.replace(/\s+/g, ' ');
  while (Date.now() - t0 < 20000) {
    const el = (Date.now() - t0) / 1000; await bw.drain(); await aw.drain();
    const g = (await bridge.getState()).globals || {};
    if (!out && g.kit_ca02_out) { out = true; mark('ca02-out-set'); }
    if (!there && g.kit_ca02_there) { there = true; mark('ca02-there-set'); }
    if (!b1 && bw.seen.some(e => /Got a CV in for the driver job/i.test(norm(e.text)))) { b1 = true; mark('bark1_start'); mark('frame:bark1'); }
    if (!b2 && bw.seen.some(e => /blocked it/i.test(norm(e.text)))) { b2 = true; mark('bark2_start'); mark('frame:bark2'); }
    if (!b3 && bw.seen.some(e => /IT have asked anyone/i.test(norm(e.text)))) { b3 = true; mark('bark3_start'); }
    const st = await bridge.getState();
    if (!menu && (st.dialogue || st.interactionMenu || st.activeMinigame)) { menu = true; mark('choice-menu-opened', { dialogue: !!st.dialogue, minigame: !!st.activeMinigame }); }
    if (el >= next) { mark('frame:t+' + next); next += 1; }
    await sleep(80);
  }
  await bw.drain(); await aw.drain();
  console.error('SEEN', JSON.stringify(bw.seen.map(e => [e.id, norm(e.text).slice(0, 40)])));
  console.error('TTS', JSON.stringify(tw.log));
  const g1 = (await bridge.getState()).globals || {};
  mark('globals-end', { kit_quiet: g1.kit_quiet, out: g1.kit_ca02_out, there: g1.kit_ca02_there, asked: g1.kit_ca02_asked, choice: g1.kit_ca02_cv_choice });
  await bw.stop(); await aw.stop(); tw.stop(); mark('end');
  if (!b1) throw new Error('bark 1 bubble never seen');
};
