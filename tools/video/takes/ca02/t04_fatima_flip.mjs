// t04_fatima_flip: Fatima's F1 after the send: "Your application has gone to the recruitment inbox. Now take the other seat at the kiosk and sort the inbox the way it would
// land on a normal day." (8.26 s cached; speech 0.23 to 7.69 s, sentence gap 2.85 to 3.03 s). Person-chat view; the chat is closed right after the line, so the choice menu never shows.
// Entry state (send done, defend not): the ink needs phish_recruiter_contact_attempts > 0 and defend not done:
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca02_cv_lures t04_fatima_flip "--set episode_e2_cv_lures_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_recruiter_contact_attempts=1" "--hide-hud --zoom-step 1"
// The take throws if the first line is not F1 (not the "Welcome to the Tarrowby exercise" line, which means the attempts flag did not seed).
// Marks: start-hold, player-sprite, walk-start, leg:*, walk-end, interact:*, talk, frame:npc-portrait-up, f1-subtitle-start, line-start/line-end, tts-response, f1-audio-start, f1-audio-end,
//   f1-sentence1-end (est: start + 2.85), menu-up (if shown before the close), chat-closed, end.
import { sleep, prepare, spriteCheck, walkToNpc, talkTo, closeBeforeMenu, watchSubtitles, watchTts2 as watchTts } from './_ca02.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge); await sleep(300);
  const g = (await bridge.getState()).globals || {};
  if (!(Number(g.phish_recruiter_contact_attempts) > 0) || g.kit_defend_done === true) throw new Error('entry state wrong: ' + JSON.stringify({ att: g.phish_recruiter_contact_attempts, d: g.kit_defend_done }));
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); const tw = watchTts(page, mark);
  const sw = await watchSubtitles(page, mark, [{ name: 'f1-subtitle-start', re: /Your application has gone/i }]);
  await spriteCheck(page, mark);
  mark('start-hold'); await sleep(1000);
  await walkToNpc(bridge, 'fatima_begum', mark);
  await talkTo(page, bridge, mark, 'fatima_begum', /Fatima/i);
  const f1 = await vw.waitForLine(/Your application has gone|Welcome to the Tarrowby|Inbox and all|A real CV/i, 30000);
  if (!f1) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/Your application has gone/i.test(f1.text)) throw new Error('first line is not F1: ' + f1.text);
  mark('f1-audio-start', null, f1.start); mark('f1-audio-end', { durMs: f1.durMs }, f1.end); mark('f1-sentence1-end', { est: true }, f1.start + 2850);
  if (!tw.log.some(l => l.status === 200 && /audio/.test(l.ct) && /Your application has gone/.test(l.text))) throw new Error('F1 not voiced by /tts: ' + JSON.stringify(tw.log));
  await sleep(120);
  await vw.stop(); await sw.stop(); tw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(1000); mark('end');
};
