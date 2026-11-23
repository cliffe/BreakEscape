// t05_machine_out: the living-office beat. Kiosk opens on the "Look up from the kiosk" step-away panel, Look up, Darren's workstation switches to
// the locked screen (pc1_locked, kit_ca08_out), he walks to Anjali (kit_ca08_there) and barks D1 "My screen's locked me out and a shared folder won't
// open. If someone's in my account, they'll be sending as me. Reporting it now." (8.93 s cached; 8.88 s in the audio element). Nothing is pressed after Look up.
// DRY-RUN RESULT (take plan in docs/video/takes_ca08.md): Anjali's bark A10 "Thank you. We can shut that account down before it gets past your machine."
// (4.24 s) starts 4.6 s after D1 starts and plays ON TOP of D1 (each NPC has its own audio element), so D1 can NOT play whole and alone.
// D1's first sentence ends 3.84 s into the clip (silence 3.84 to 4.55 s), so the edit cuts at d1_sentence1_end + 0.15 s, before A10's bubble (+4.5 s) and audio.
// The take records the natural sequence to D1 start + 12 s (past both barks) and marks every edge; the edit chooses the out.
// Entry state (step-away flags; percent under 85 so kit_caught stays false):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca08_after_the_click t05_machine_out \
//     "--set episode_e8_after_the_click_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\",\"defend\"]} --set episode_e8_after_the_click_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e8_after_the_click_defend_percent=60" \
//     "--hide-hud --zoom-step 1"
// Marks: player-sprite, kiosk-open, look_up, ca08-out-set (the screen locks), ca08-there-set (Darren arrived), bubble-start/end:<npc>, tts-response (200 audio/mpeg per bark),
//   audio-start/end:<npc> (page clock; end with cur < dur = cut), d1_start, d1_sentence1_end (= d1 audio start + 3.84, est), a10_start, frame:* every 1 s, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, buttons, watchBubbles, spriteCheck, watchTts, watchBarkAudio } from './_ca08.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_caught === true) throw new Error('entry state wrong: kit_defend_done true and kit_caught not true needed; got ' + JSON.stringify({ d: g.kit_defend_done, c: g.kit_caught }));
}

export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark); const tw = watchTts(page, mark); const aw = await watchBarkAudio(page, mark);
  await spriteCheck(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons: ' + JSON.stringify(await buttons(page)));
  await sleep(1500); mark('frame:step-away-panel');
  mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let out = false, there = false, d1 = null, a10 = null, next = 1;
  while (Date.now() - t0 < 24000) {
    const el = (Date.now() - t0) / 1000; await bw.drain(); await aw.drain();
    const g = (await bridge.getState()).globals || {};
    if (!out && g.kit_ca08_out) { out = true; mark('ca08-out-set'); }
    if (!there && g.kit_ca08_there) { there = true; mark('ca08-there-set'); }
    if (!d1 && bw.seen.some(e => e.id === 'kit_darren_price' && /locked me out/i.test(e.text.replace(/\s+/g, ' ')))) { d1 = Date.now(); mark('d1_start'); mark('frame:d1-bubble'); }
    if (!a10 && bw.seen.some(e => e.id === 'anjali_rao' && /shut that account down/i.test(e.text.replace(/\s+/g, ' ')))) { a10 = Date.now(); mark('a10_start'); mark('frame:a10-bubble'); }
    if (el >= next) { mark('frame:t+' + next); next += 1; }
    if (d1 && Date.now() - d1 > 12000) break;
    await sleep(80);
  }
  await bw.drain(); await aw.drain();
  if (!d1) { await bw.stop(); await aw.stop(); tw.stop(); throw new Error('D1 bubble never seen'); }
  const voiced = tw.log.filter(l => l.status === 200 && /audio/.test(l.ct));
  if (!voiced.some(l => /locked me out/i.test(l.text))) throw new Error('D1 was not voiced (no 200 audio/mpeg); tts answers: ' + JSON.stringify(tw.log));
  await bw.stop(); await aw.stop(); tw.stop(); mark('end');
};
