// t03_adaeze_flip: Adaeze's A1 after the send: "Your message has gone. Now take the other seat at the kiosk and read the payments inbox the way
// it would land on a busy afternoon." (7.70 s, cached). Person-chat view; the chat is closed right after the line so "Thanks, Adaeze." never shows.
// Entry state (scout S7; the kiosk is never opened). The ink needs phish_supplier_contact_attempts > 0 and defend not done:
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca01 t03_adaeze_flip "--set episode_e1_invoice_fraud_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_supplier_contact_attempts=1" "--hide-hud --zoom-step 1"
// DRY RUN: confirm A1 (not A2 "Welcome to the Brightwell exercise") plays in this state; the take throws if the first line is not A1.
// Walk: straight key legs below Adaeze (Agnieszka stands 16 px to her right at (192,128); the stop is 44 px below), then interact.
// Marks: start-hold, player-sprite, walk-start, leg:*, walk-end, talk, frame:npc-portrait-up, a1-subtitle-start, line-start/line-end, a1-audio-start, a1-audio-end,
//   menu-up (if shown before the close), chat-closed, end.
import { sleep, prepare, checkSprite, walkToNpc, talkTo, closeBeforeMenu, watchSubtitles } from './_ca01.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(300); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const sw = await watchSubtitles(page, mark, [{ name: 'a1-subtitle-start', re: /Your message has gone/i }]);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  await walkToNpc(bridge, 'adaeze_okafor', mark);
  await talkTo(page, bridge, mark, 'adaeze_okafor', /Adaeze/i);
  const a1 = await vw.waitForLine(/Your message has gone|Welcome to the Brightwell|You.ve worked it|Ring the person back|You stopped/i, 30000);
  if (!a1) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/Your message has gone/i.test(a1.text)) throw new Error('first line is not A1: ' + a1.text);
  mark('a1-audio-start', null, a1.start); mark('a1-audio-end', { durMs: a1.durMs }, a1.end);
  await sleep(120);
  await vw.stop(); await sw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(1000); mark('end');
};
