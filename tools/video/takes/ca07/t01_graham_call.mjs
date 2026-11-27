// t01_graham_call: the step-away beat, one take for TWO shots: the hook (Graham's bark G1 "Ravinder's on the line, from his mobile.", about 1.5 s after Look up)
// and the end line (bark G2 "Sounds just like him. Ashcarr Haulage have changed bank, and he wants them paid today. Go ahead?", about 7.0 s after Look up).
// Kiosk opens on the "Before the debrief" panel, Look up, Graham speaks on his own beside his PC. NEVER click in the room, never open the chat, never examine
// the PC (the choice menu after G2 is "Hang up..." / "Go ahead..." and a 45 s timer defaults it). Ends at G2's end + 0.4 s.
// Entry state (kit_quiet=true IS needed: G1's mapping is gated on it and --set does not fire the mapping that sets it):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca07_voice_ceo t01_graham_call \
//     "--set episode_e7_voice_ceo_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\",\"defend\"]} --set episode_e7_voice_ceo_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e7_voice_ceo_defend_percent=60 --set kit_quiet=true" \
//     "--hide-hud --zoom-step 1"
// Keep _defend_percent under 85 (85 and over sets kit_caught). Hook window is a fixed 3.34 s (G1 start - 0.3 to G1 end + 0.3); office in-point is G2 start - 2.1 s.
// Marks: player-sprite, kiosk-open, globals-before-look-up, look_up, bubble-start/end:kit_graham_whitfield (text), bark1_start, bark2_start, bark2_end,
//   audio-start/end:<npc> (clip length and how far it got), tts (each POST /tts: status, bytes, content-length), person-chat-opened (only if the ask opens a chat), frame:t+N, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, watchBubbles, checkSprite, watchTts } from './_ca07.mjs';
import { watchBarkAudio } from './_ca07.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true) throw new Error('entry state wrong: kit_defend_done is not true');
  if (g.kit_quiet !== true) throw new Error('entry state wrong: kit_quiet is not true (G1 will not play); seed it with --set kit_quiet=true');
}

export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark);
  const aw = await watchBarkAudio(page, mark);
  const tw = watchTts(page, mark);
  await checkSprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed');
  await sleep(1000);
  const g0 = (await bridge.getState()).globals || {};
  mark('globals-before-look-up', { kit_quiet: g0.kit_quiet, kit_ca07_out: g0.kit_ca07_out, kit_ca07_there: g0.kit_ca07_there });
  mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let b1 = false, b2 = false, b2end = false, chat = false, next = 2;
  const open = () => page.evaluate(() => !!(window.npcWorldBubbles && window.npcWorldBubbles.says && [...window.npcWorldBubbles.says.values()].some(s => /Go ahead\?/.test((s.pages || []).join(' ')))));
  while (Date.now() - t0 < 40000) {
    const el = (Date.now() - t0) / 1000;
    await bw.drain();
    if (!b1 && bw.seen.some(e => /on the line/i.test(e.text))) { b1 = true; mark('bark1_start'); }
    if (!b2 && bw.seen.some(e => /Ashcarr|Go ahead\?/i.test(e.text))) { b2 = true; mark('bark2_start'); }
    if (b2 && !b2end && !(await open())) { b2end = true; mark('bark2_end'); break; }
    const st = await bridge.getState();
    if (!chat && (st.dialogue || st.interactionMenu || st.activeMinigame)) { chat = true; mark('person-chat-opened', { dialogue: !!st.dialogue, menu: !!st.interactionMenu, minigame: !!st.activeMinigame }); }
    if (el >= next) { mark('frame:t+' + next); next += 2; }
    await sleep(100);
  }
  await bw.drain();
  if (!b1 || !b2end) { await bw.stop(); await aw.stop(); tw.stop(); throw new Error('barks missing: bark1 ' + b1 + ' bark2 ' + b2 + ' bark2_end ' + b2end); }
  await sleep(400); mark('frame:end'); mark('end');
  const g1 = (await bridge.getState()).globals || {};
  mark('globals-end', { kit_quiet: g1.kit_quiet, kit_ca07_out: g1.kit_ca07_out, kit_ca07_there: g1.kit_ca07_there, asked: g1.kit_ca07_asked, call_choice: g1.kit_ca07_call_choice });
  await aw.stop(); await bw.stop(); tw.stop();
};
