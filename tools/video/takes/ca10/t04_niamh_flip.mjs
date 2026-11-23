// t04_niamh_flip: Niamh's N1 after the send: "Good, the email's away to Leo. Now take the other seat and sort a morning of the web the way it really turns up." (7.97 s, cached, no tail in
// the file). Person-chat view; the chat is closed right after the line so the choice never shows. Feeds niamh_flip (in = n1_start - 0.15 s, 8.4 s).
// Entry state (the ink needs phish_order_colleague_attempts > 0 and defend not done; the kiosk is never opened):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca10_downloads_and_fake_checks t04_niamh_flip "--set episode_e10_downloads_and_fake_checks_state={\"done\":[\"brief\",\"osint\",\"build\",\"write\",\"flip\"]} --set phish_order_colleague_attempts=1" "--hide-hud --zoom-step 1"
// The take throws if the first line voiced is not N1. Never click in the chat (the 45 s kit_ca10_t_tail timer sets silent). Mark the AUDIO start (n1_start), not "chat open".
// Marks: start-hold, player-sprite, interact:niamh_doherty, npc_portrait_up, frame:npc-portrait-up, n1_start, n1_end (durMs), tts (POST /tts status, content-length), chat-closed, end.
import { sleep, prepare, interactRetry, waitNpcPortrait, checkSprite, closeBeforeMenu, watchVoice, watchTts } from './_ca10.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (!(Number(g.phish_order_colleague_attempts) > 0)) throw new Error('entry state wrong: phish_order_colleague_attempts is ' + g.phish_order_colleague_attempts);
  await sleep(400);
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const tw = watchTts(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  const up = waitNpcPortrait(page, bridge, mark, /Niamh/i, 30000); up.catch(() => {});
  await interactRetry(bridge, 'niamh_doherty', mark);
  await up; mark('npc_portrait_up'); mark('frame:npc-portrait-up');
  const n1 = await vw.waitForLine(/the email's away to Leo|Welcome back|That's both|Any time/i, 30000);
  if (!n1) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/the email's away to Leo/i.test(n1.text)) throw new Error('first line is not N1: ' + n1.text);
  mark('n1_start', null, n1.start); mark('n1_end', { durMs: n1.durMs }, n1.end);
  await sleep(120);
  await vw.stop(); tw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(800); mark('end');
};
