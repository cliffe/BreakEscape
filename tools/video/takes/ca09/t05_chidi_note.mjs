// t05_chidi_note: the end beat. Kiosk opens on the step-away panel, "Look up", then Chidi's bark with the sticky note on his locked screen:
// C1 "Right, sorted. New one's on a sticky note on my screen so I don't forget it. Owt I should flag?" (cached, 6.46 s). Room view with the avatar.
// NEVER examine or interact with Chidi's PC (kit_ca09_pc): its examine text is the note's password. The take only watches.
// Entry state (scout S9; the ca12/ca15 step-away list):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca09 t05_chidi_note "--set episode_e9_passwords_state={\"done\":[\"brief\",\"osint\",\"guess\",\"flip\",\"defend\"]} --set episode_e9_passwords_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e9_passwords_defend_percent=100" "--hide-hud --zoom-step 1"
// Ends 1.2 s after C1's bubble clears (or at 12 s after Look up at the latest), long before the ask-cue menu (timers run to 45 s); never talks to Chidi.
// Marks: kiosk-open, look_up, bubble-start/end:<npc> (every bark), c2_start (if C2 barks), c1_start, c1_end, frame:t+N every 2 s, tts-response, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, watchBubbles, checkSprite, watchTts } from './_ca09.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true) throw new Error('entry state wrong: kit_defend_done is not true');
}

export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark);
  const vw = await watchVoice(page, mark);
  const tts = await watchTts(page, mark);
  await checkSprite(page, mark);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed; buttons: ' + JSON.stringify(await page.$$eval('button', b => b.filter(x => x.offsetParent).map(x => x.innerText.trim()))));
  await sleep(1000);
  mark('look_up'); await pressButton(page, /Look up/);
  const t0 = Date.now(); let c1 = false, c2 = false, c1End = null, next = 2;
  while (Date.now() - t0 < 20000) {
    const el = (Date.now() - t0) / 1000;
    await bw.drain();
    if (!c2 && bw.seen.some(e => !/sticky note/i.test(e.text) && /./.test(e.text))) { c2 = true; mark('other_bark_seen', { text: bw.seen.find(e => !/sticky note/i.test(e.text)).text.slice(0, 80) }); }
    if (!c1 && bw.seen.some(e => /sticky note/i.test(e.text))) { c1 = true; mark('c1_start'); }
    if (c1 && !c1End) {
      const up = await page.evaluate(() => !!(window.npcWorldBubbles && window.npcWorldBubbles.says && [...window.npcWorldBubbles.says.values()].some(s => /sticky note/.test((s.pages || []).join(' ')))));
      if (!up) { c1End = Date.now(); mark('c1_end'); }
    }
    if (el >= next) { mark('frame:t+' + next); next += 2; }
    if (c1End && Date.now() - c1End > 1200) break;
    await sleep(100);
  }
  if (!c1) { await bw.stop(); await vw.stop(); await tts.stop(); throw new Error('C1 never barked; seen: ' + JSON.stringify(bw.seen.map(e => e.text.slice(0, 60)))); }
  mark('voice-lines', { lines: vw.lines.map(l => ({ text: l.text.slice(0, 60), durMs: l.durMs })) });
  await bw.stop(); await vw.stop(); await tts.stop(); mark('end');
};
