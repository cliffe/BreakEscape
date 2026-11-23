// t05_step_away: the end beat. Kiosk opens on the step-away panel, Look up, Anjali's workstation spare PC shows the sign-in screen (kit_ca03_out), she walks to it
// (kit_ca03_there) and barks E1 "I came over to use the spare and it's on the sign-in screen, asking for everything again. Darren, is it doing this to everyone?"
// (8.33 s cached). Darren's E2 "Someone's password got out, ..." follows 4.5 s after kit_ca03_there. Nothing is pressed after Look up.
// Marks: player-sprite, kiosk-open, look_up, ca03-out-set, ca03-there-set, bubble-start/end:<npc>, tts-response (per bark), audio-start/end:<npc>, e1_start, e1_sentence1_end (= e1 audio start + 5.68, est),
//   e2_start, frame:* every 1 s, end. The take runs to E1 start + 14 s (past both barks); the edit picks the out.
// Entry state (defend complete, not caught; percent under 85):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca03_helpdesk_reset t05_step_away \
//     "--set episode_e3_helpdesk_reset_state={\"done\":[\"brief\",\"osint\",\"write\",\"mfa\",\"flip\",\"defend\"]} --set episode_e3_helpdesk_reset_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e3_helpdesk_reset_defend_percent=60" "--hide-hud --zoom-step 1"
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, watchBubbles, spriteCheck, watchBarkAudio, watchTts2 as watchTts } from './_ca03.mjs';

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
  await sleep(1500); mark('frame:step-away-panel');
  mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let out = false, there = false, e1 = null, e2 = null, next = 1;
  const norm = (s) => s.replace(/\s+/g, ' ');
  while (Date.now() - t0 < 30000) {
    const el = (Date.now() - t0) / 1000; await bw.drain(); await aw.drain();
    const g = (await bridge.getState()).globals || {};
    if (!out && g.kit_ca03_out) { out = true; mark('ca03-out-set'); }
    if (!there && g.kit_ca03_there) { there = true; mark('ca03-there-set'); }
    if (!e1 && bw.seen.some(e => /came over to use the spare/i.test(norm(e.text)))) { e1 = Date.now(); mark('e1_start'); mark('frame:e1-bubble'); }
    if (!e2 && bw.seen.some(e => /password got out/i.test(norm(e.text)))) { e2 = Date.now(); mark('e2_start'); mark('frame:e2-bubble'); }
    if (el >= next) { mark('frame:t+' + next); next += 1; }
    if (e1 && Date.now() - e1 > 14000) break;
    await sleep(80);
  }
  await bw.drain(); await aw.drain();
  console.error('SEEN', JSON.stringify(bw.seen.map(e => [e.id, norm(e.text).slice(0, 40)])));
  console.error('TTS', JSON.stringify(tw.log));
  await bw.stop(); await aw.stop(); tw.stop(); mark('end');
  if (!e1) throw new Error('E1 bubble never seen');
};
