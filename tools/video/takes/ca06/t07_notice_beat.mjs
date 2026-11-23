// t07_notice_beat: the step-away beat, one take for TWO shots: the hook (Zainab's Z1 "Is that new? I've not seen a parking notice up in here before.", about 1.5 s after Look up)
// and the end line (Z2 "This one says my parking permit needs renewing. Is it one of ours?", about 4 s after she reaches the notice). Kiosk opens on "Before the debrief", Look up,
// Zainab walks to the newly revealed parking notice and speaks on her own. NEVER click in the room, never open the chat, never examine the notice (the choice menu after Z2 is
// "Check it with Facilities / Go ahead / Say nothing", and a 45 s timer defaults it). Z1 and Z2 are the same NPC, so Z2 queues behind Z1: the take marks the gap.
// Entry state (kit_quiet=true is needed: Z1's mapping is gated on it and --set does not fire the mapping that sets it):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca06_texts_and_qr t07_notice_beat \
//     "--set episode_e6_texts_and_qr_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\",\"defend\"]} --set episode_e6_texts_and_qr_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true" \
//     "--hide-hud --zoom-step 1"
// Marks: player-sprite, kiosk-open, globals-before-look-up, look_up, bubble-start/end:kit_zainab_hussain (text), bark1_start, bark2_start, bark2_end,
//   audio-start/end:<npc> (clip length), z1_end_to_z2_start (gap seconds, audio to audio; under 0.55 s means two runs), tts (each POST /tts), person-chat-opened (only if it happens), frame:t+N, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, watchBubbles, checkSprite, watchTts, watchBarkAudio } from './_ca06.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true) throw new Error('entry state wrong: kit_defend_done is not true');
  if (g.kit_quiet !== true) throw new Error('entry state wrong: kit_quiet is not true (Z1 will not play); seed it with --set kit_quiet=true');
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
  mark('globals-before-look-up', { kit_quiet: g0.kit_quiet, kit_ca06_out: g0.kit_ca06_out, kit_ca06_there: g0.kit_ca06_there });
  mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let b1 = false, b2 = false, b2end = false, chat = false, next = 2;
  const audio = () => page.evaluate(() => (window.__audioEvents || []).slice());
  while (Date.now() - t0 < 45000) {
    const el = (Date.now() - t0) / 1000;
    await bw.drain();
    if (!b1 && bw.seen.some(e => /Is that new/i.test(e.text))) { b1 = true; mark('bark1_start'); }
    if (!b2 && bw.seen.some(e => /permit needs renewing|one of ours/i.test(e.text))) { b2 = true; mark('bark2_start'); }
    if (b2) { const ev = await audio(); const starts = ev.filter(e => e.type === 'start'), ends = ev.filter(e => e.type === 'end'); if (starts.length >= 2 && ends.length >= 2) { b2end = true; mark('bark2_end'); break; } }
    const st = await bridge.getState();
    if (!chat && (st.dialogue || st.interactionMenu || st.activeMinigame)) { chat = true; mark('person-chat-opened', { dialogue: !!st.dialogue, menu: !!st.interactionMenu, minigame: !!st.activeMinigame }); }
    if (el >= next) { mark('frame:t+' + next); next += 2; }
    await sleep(100);
  }
  await bw.drain(); await aw.drain();
  const ev = await audio(); const starts = ev.filter(e => e.type === 'start'), ends = ev.filter(e => e.type === 'end');
  if (starts.length >= 2 && ends.length >= 1) mark('z1_end_to_z2_start', { sec: +((starts[1].t - ends[0].t) / 1000).toFixed(3), z1dur: starts[0].dur, z2dur: starts[1].dur });
  if (!b1 || !b2end) { await bw.stop(); await aw.stop(); tw.stop(); throw new Error('barks missing: bark1 ' + b1 + ' bark2 ' + b2 + ' bark2_end ' + b2end); }
  await sleep(400); mark('frame:end'); mark('end');
  const g1 = (await bridge.getState()).globals || {};
  mark('globals-end', { kit_quiet: g1.kit_quiet, kit_ca06_out: g1.kit_ca06_out, kit_ca06_there: g1.kit_ca06_there, asked: g1.kit_ca06_asked, choice: g1.kit_ca06_notice_choice });
  await aw.stop(); await bw.stop(); tw.stop();
};
