// t04_chidi_flip: Chidi's C1 after the send: "Your message has gone over to Kaylee. Now take the other seat and go through a Tarrowby work phone, the way it would land on your break."
// (cached, 8.50 s; speech 0.27 to 8.02 s, sentence gap 1.98 to 2.71 s). Person-chat view; the chat is closed right after the line so the choice ("Thanks, Chidi.") never shows.
// Entry state (the ink needs phish_mobile_staff_attempts > 0 and defend not done; the kiosk is never opened):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca06_texts_and_qr t04_chidi_flip "--set episode_e6_texts_and_qr_state={\"done\":[\"brief\",\"osint\",\"write\"]} --set phish_mobile_staff_attempts=1" "--hide-hud --zoom-step 1"
// The take throws if the first line voiced is not C1. Never click in the chat. Cut in at c1_start minus 0.25 s, out at c1_end plus 0.1.
// Marks: start-hold, player-sprite, interact:chidi_okeke, npc_portrait_up, frame:npc-portrait-up, c1_start, c1_end (durMs), tts (POST /tts status, content-length), menu-up (if shown), chat-closed, end.
import { sleep, prepare, interactRetry, waitNpcPortrait, checkSprite, closeBeforeMenu, watchVoice, watchTts } from './_ca06.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (!(Number(g.phish_mobile_staff_attempts) > 0)) throw new Error('entry state wrong: phish_mobile_staff_attempts is ' + g.phish_mobile_staff_attempts);
  await sleep(400);
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const tw = watchTts(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  const up = waitNpcPortrait(page, bridge, mark, /Chidi/i, 30000); up.catch(() => {});
  await interactRetry(bridge, 'chidi_okeke', mark);
  await up; mark('npc_portrait_up');
  const c1 = await vw.waitForLine(/Your message has gone over|Welcome|Tarrowby|work phone/i, 30000);
  if (!c1) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/Your message has gone over to Kaylee/i.test(c1.text)) throw new Error('first line is not C1: ' + c1.text);
  mark('c1_start', null, c1.start); mark('c1_end', { durMs: c1.durMs }, c1.end);
  await sleep(120);
  await vw.stop(); tw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(800); mark('end');
};
