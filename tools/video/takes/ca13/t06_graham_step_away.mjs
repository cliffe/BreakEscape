// t06_graham_step_away: the step-away beat, one take for TWO shots: the hook (Graham's bark G1 "Assistant's done the inbox for me." [first sentence of
// "...Lovely, saves me reading."], about 1.5 s after Look up) and the end line (bark G2 "Assistant says Pennine Oat Mills need our customer list for a recall.
// Reply's drafted. Just send it?", about 7.0 s after Look up). Kiosk opens on the "Before the debrief" panel, Look up, Graham speaks beside his PC. NEVER click in the
// room, never open the chat, never examine the PC (the ask opens a chat whose menu is outcomes; a 45 s timer defaults it). Ends at G2's end + 0.4 s.
// Entry state (kit_quiet=true IS needed: G1's mapping is gated on it and --set does not fire the mapping that sets it):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca13_ai_assistant t06_graham_step_away \
//     "--set episode_e13_ai_assistant_state={\"done\":[\"brief\",\"write\",\"flip\",\"defend\"]} --set episode_e13_ai_assistant_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e13_ai_assistant_defend_percent=60 --set kit_quiet=true" \
//     "--hide-hud --zoom-step 1"
// Keep _defend_percent under 85 (85 and over sets kit_caught). Hook cut: in = G1 audio start - 0.15, out = in + 2.6 (first sentence ends 2.18 s in the file). Office: in = G2 start - 0.3, out = G2 speech end + 0.3.
// Marks: player-sprite, kiosk-open, globals-before-look-up, look_up, bubble-start/end:kit_graham_whitfield (text), bark1_start, bark2_start, bark2_end,
//   audio-start/end:<npc> (clip length and how far it got), tts (each POST /tts: status, bytes), person-chat-opened (only if the ask opens a chat), frame:t+N, end, globals-end.
import { sleep, prepare, openKiosk, pressButton, waitButton, watchBubbles, checkSprite, watchTts, watchBarkAudio } from './_ca13.mjs';

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
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons: ' + JSON.stringify(await (await import('./_ca13.mjs')).buttons(page)));
  await sleep(1000);
  const g0 = (await bridge.getState()).globals || {};
  mark('globals-before-look-up', { kit_quiet: g0.kit_quiet, kit_ca13_out: g0.kit_ca13_out, kit_ca13_there: g0.kit_ca13_there });
  mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let b1 = false, b2 = false, b2end = false, chat = false, next = 2;
  const open = () => page.evaluate(() => !!(window.npcWorldBubbles && window.npcWorldBubbles.says && [...window.npcWorldBubbles.says.values()].some(s => /Just send it\?/.test((s.pages || []).join(' ')))));
  while (Date.now() - t0 < 40000) {
    const el = (Date.now() - t0) / 1000;
    await bw.drain();
    if (!b1 && bw.seen.some(e => /done the inbox/i.test(e.text))) { b1 = true; mark('bark1_start'); }
    if (!b2 && bw.seen.some(e => /Pennine|Just send it\?/i.test(e.text))) { b2 = true; mark('bark2_start'); }
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
  mark('globals-end', { kit_quiet: g1.kit_quiet, kit_ca13_out: g1.kit_ca13_out, kit_ca13_there: g1.kit_ca13_there, asked: g1.kit_ca13_asked, send_choice: g1.kit_ca13_send_choice });
  await aw.stop(); await bw.stop(); tw.stop();
};
