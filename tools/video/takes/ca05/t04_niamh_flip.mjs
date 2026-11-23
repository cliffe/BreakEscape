// t04_niamh_flip: Niamh's N1 after the send: "Your email with the link has gone to Hana. Now take the other seat and check the pages that land behind
// links like yours." (7.13 s, cached). Person-chat view; the chat is closed right after the line so the choice ("Thanks, Niamh.") never shows.
// Entry state (the ink needs phish_sso_staff_attempts > 0 and defend not done; the kiosk is never opened):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca05_signin_pages t04_niamh_flip "--set episode_e5_signin_pages_state={\"done\":[\"brief\",\"osint\",\"build\",\"write\",\"flip\"]} --set phish_sso_staff_attempts=1" "--hide-hud --zoom-step 1"
// The take throws if the first line voiced is not N1. Never click in the chat. Cut in a little before n1_start, out at n1_end + 0.1 (edit window 2.5-10.0 s).
// Marks: start-hold, player-sprite, interact:niamh_doherty, npc_portrait_up, frame:npc-portrait-up, n1_start, n1_end (durMs), tts (POST /tts status, content-length), menu-up (if shown), chat-closed, end.
import { sleep, prepare, interactRetry, waitNpcPortrait, checkSprite, closeBeforeMenu, watchVoice, watchTts } from './_ca05.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (!(Number(g.phish_sso_staff_attempts) > 0)) throw new Error('entry state wrong: phish_sso_staff_attempts is ' + g.phish_sso_staff_attempts);
  await sleep(400);
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const tw = watchTts(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  const up = waitNpcPortrait(page, bridge, mark, /Niamh/i, 30000); up.catch(() => {});
  await interactRetry(bridge, 'niamh_doherty', mark);
  await up; mark('npc_portrait_up');
  const n1 = await vw.waitForLine(/Your email with the link|Welcome|That's both seats|Your password went/i, 30000);
  if (!n1) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/Your email with the link has gone to Hana/i.test(n1.text)) throw new Error('first line is not N1: ' + n1.text);
  mark('n1_start', null, n1.start); mark('n1_end', { durMs: n1.durMs }, n1.end);
  await sleep(120);
  await vw.stop(); tw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(800); mark('end');
};
