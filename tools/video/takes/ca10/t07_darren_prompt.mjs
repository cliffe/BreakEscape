// t07_darren_prompt: Darren's end line D1 "Supplier portal's asking me to prove I'm human now." (4.10 s, speech 0.35 to 3.59 s), a world bark at his workstation after Look up (about 1.5 s later,
// dry run measures it). Feeds darren_end (in = D1 audio start - 0.15 s, 4.0 s). The take stops at D1 start + 4.5 s (D1's bubble stays up until D2 begins, so the end is a timer): it never reaches D2 (the tell, about 7 s after Look up) and never clicks in the room
// or opens the chat (a 45 s kit_ca10_t_tail timer defaults the choice).
// Entry state (step-away flags; kit_quiet and kit_ca10_out are set by the game):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca10_downloads_and_fake_checks t07_darren_prompt "--set episode_e10_downloads_and_fake_checks_state={\"done\":[\"brief\",\"osint\",\"build\",\"write\",\"flip\",\"defend\"]} --set episode_e10_downloads_and_fake_checks_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e10_downloads_and_fake_checks_defend_percent=100" "--hide-hud --zoom-step 1"
// Marks: player-sprite, kiosk-open, globals-before-look-up, look_up, bubble-start/end (text), d1_start (data: sSinceLookUp), d1_end, d2_seen (only if D2's bubble opened before the stop: a retake), tts (each POST /tts answer), frame:t+N every 2 s, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, watchBubbles, checkSprite, watchTts } from './_ca10.mjs';

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
  mark('globals-before-look-up', { kit_quiet: g0.kit_quiet, kit_ca10_out: g0.kit_ca10_out, kit_ca10_there: g0.kit_ca10_there });
  mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let tD1 = 0, d1 = false, d1end = false, d2 = false, next = 2;
  const open = () => page.evaluate(() => !!(window.npcWorldBubbles && window.npcWorldBubbles.says && [...window.npcWorldBubbles.says.values()].some(s => /prove I.m human/.test((s.pages || []).join(' ')))));
  while (Date.now() - t0 < 25000) {
    const el = (Date.now() - t0) / 1000;
    await bw.drain();
    if (!d1 && bw.seen.some(e => /prove I.m human/i.test(e.text))) { d1 = true; tD1 = Date.now(); mark('d1_start', { sSinceLookUp: +el.toFixed(2) }); }
    if (!d2 && bw.seen.some(e => e.text && !/prove I.m human/i.test(e.text) && /Darren|darren/.test(e.id || '') )) { d2 = true; mark('d2_seen', { text: bw.seen.filter(e => !/prove I.m human/i.test(e.text)).map(e => e.text).pop() }); }
    // D1's bubble stays up until D2 starts (dry run: D1 bubble 4.95 to 10.38, D2 audio request at 10.38, 5.4 s after D1 start), so the take ends on a timer at D1 start + 4.5 s (D1 audio 4.10 s), before D2.
    if (d1 && !d1end && Date.now() - tD1 > 4500) { d1end = true; mark('d1_end', { sSinceLookUp: +el.toFixed(2), note: 'timer, D1 audio 4.10 s' }); break; }
    if (el >= next) { mark('frame:t+' + next); next += 2; }
    await sleep(100);
  }
  await bw.drain();
  if (!d1 || !d1end) { await bw.stop(); tw.stop(); throw new Error('D1 missing: d1 ' + d1 + ' end ' + d1end + '; heard ' + JSON.stringify(bw.seen.map(e => e.id + ': ' + e.text))); }
  await sleep(100); mark('frame:end'); mark('end');
  const g1 = (await bridge.getState()).globals || {};
  mark('globals-end', { kit_quiet: g1.kit_quiet, kit_ca10_out: g1.kit_ca10_out, kit_ca10_there: g1.kit_ca10_there });
  await bw.stop(); tw.stop();
};
