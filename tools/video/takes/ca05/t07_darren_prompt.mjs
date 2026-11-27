// t07_darren_prompt: the step-away beat, one take for TWO shots: the hook (Darren's bark 1 "Voicemail's come through by email. Signing in to hear it.",
// about 1.5 s after Look up) and the end line (bark 2 "Password's in, and now my phone wants me to approve it. Fine to say yes?", about 9 to 10 s after).
// Kiosk opens on the "Before the debrief" panel, Look up, then Darren leaves for his workstation and speaks on his own. NEVER click in the room,
// never open the chat (the choice menu is Deny / Approve / Say nothing and a 45 s timer defaults it). The take ends at bark 2's end + 0.4 s.
// Entry state (step-away flags only: kit_quiet is set by the game itself, dry run 23 Nov):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca05_signin_pages t07_darren_prompt \
//     "--set episode_e5_signin_pages_state={\"done\":[\"brief\",\"osint\",\"build\",\"write\",\"flip\",\"defend\"]} --set episode_e5_signin_pages_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e5_signin_pages_defend_percent=100 " \
//     "--hide-hud --zoom-step 1"
// The hook is cut at bark1_start - 0.15 (if bark 1 starts later than 1.5 s after look_up the hook breaks the 5.0 s cold-open limit: retake).
// Marks: player-sprite, kiosk-open, look_up, bubble-start/end:kit_darren_price (text), bark1_start, bark2_start, bark2_end (bark 1 has no own end: its bubble clears when bark 2 starts),
//   tts (each POST /tts answer), frame:t+N every 2 s, choice-menu-opened (only if it shows), end.
import { sleep, prepare, openKiosk, pressButton, waitButton, watchBubbles, checkSprite, watchTts } from './_ca05.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true) throw new Error('entry state wrong: kit_defend_done is not true');
}

export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark);
  const tw = watchTts(page, mark);
  await checkSprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed');
  await sleep(1000);
  const g0 = (await bridge.getState()).globals || {};
  mark('globals-before-look-up', { kit_quiet: g0.kit_quiet, kit_ca05_out: g0.kit_ca05_out, kit_ca05_there: g0.kit_ca05_there });
  mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let b1 = false, b2 = false, b2end = false, menu = false, next = 2;
  const open = () => page.evaluate(() => !!(window.npcWorldBubbles && window.npcWorldBubbles.says && [...window.npcWorldBubbles.says.values()].some(s => /approve it/.test((s.pages || []).join(' ')))));
  while (Date.now() - t0 < 40000) {
    const el = (Date.now() - t0) / 1000;
    await bw.drain();
    if (!b1 && bw.seen.some(e => /Voicemail/i.test(e.text))) { b1 = true; mark('bark1_start'); }
    if (!b2 && bw.seen.some(e => /approve it/i.test(e.text))) { b2 = true; mark('bark2_start'); }
    if (b2 && !b2end && !(await open())) { b2end = true; mark('bark2_end'); break; }
    const st = await bridge.getState();
    if (!menu && (st.dialogue || st.interactionMenu || st.activeMinigame)) { menu = true; mark('choice-menu-opened', { dialogue: !!st.dialogue }); }
    if (el >= next) { mark('frame:t+' + next); next += 2; }
    await sleep(100);
  }
  await bw.drain();
  if (!b1 || !b2end) { await bw.stop(); tw.stop(); throw new Error('barks missing: bark1 ' + b1 + ' bark2 ' + b2 + ' bark2_end ' + b2end); }
  await sleep(400); mark('frame:end'); mark('end');
  const g1 = (await bridge.getState()).globals || {};
  mark('globals-end', { kit_quiet: g1.kit_quiet, kit_ca05_out: g1.kit_ca05_out, kit_ca05_there: g1.kit_ca05_there, prompt: g1.kit_ca05_prompt_choice, asked: g1.kit_ca05_asked });
  await bw.stop(); tw.stop();
};
