// t04_gwen_flip: Gwen's W2 after the send: "That's your brief sent. Now take the inbox at the kiosk, and treat what the assistant hands you like a note from a stranger."
// The edit uses the SECOND sentence only: in = W2 audio start + 1.80 s, out = W2 audio start + 8.05 s (speech 2.06 to 7.80 s in the file). Person-chat view; the chat is closed
// right after the line, before the choice menu ("Thanks, Gwen." is a hub choice and only appears in that menu, so it never shows). The kiosk is never opened.
// Entry state: flip seed (ink needs phish_assist_reader_attempts > 0 and defend not complete; the kiosk is not needed):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca13_ai_assistant t04_gwen_flip "--set episode_e13_ai_assistant_state={\"done\":[\"brief\",\"write\"]} --set phish_assist_reader_attempts=1 --set phish_assist_reader_landed=true" "--hide-hud --zoom-step 1"
// The take throws if the first line is not W2. Walk: key legs below Gwen (she stands at (5.5, 3.8)), then interact.
// Marks: start-hold, player-sprite, walk-start, leg:*, walk-end, talk, frame:npc-portrait-up, w2-subtitle-start, w2-sentence2-subtitle, w2-audio-start, w2-audio-end, tts, menu-up (if shown before the close),
//   chat-closed, thanks-visible (whether "Thanks, Gwen." was in the DOM at the close), end.
import { sleep, prepare, checkSprite, walkToNpc, talkTo, closeBeforeMenu, watchSubtitles, watchVoice, watchTts, visible } from './_ca13.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(300); }

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  const tw = watchTts(page, mark);
  const sw = await watchSubtitles(page, mark, [{ name: 'w2-subtitle-start', re: /That.s your brief sent/i }, { name: 'w2-sentence2-subtitle', re: /Now take the inbox/i }]);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  await walkToNpc(bridge, 'gwen_pritchard', mark);
  await talkTo(page, bridge, mark, 'gwen_pritchard', /Gwen/i);
  const w2 = await vw.waitForLine(/That.s your brief sent|Welcome\. Brightwell Assist|That.s them handled|You stopped the request|You caught the one/i, 30000);
  if (!w2) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/That.s your brief sent/i.test(w2.text)) throw new Error('first line is not W2: ' + w2.text);
  mark('w2-audio-start', null, w2.start); mark('w2-audio-end', { durMs: w2.durMs }, w2.end);
  await sleep(120);
  const thanks = await visible(page, 'body *', /Thanks, Gwen\./);
  await vw.stop(); await sw.stop(); tw.stop();
  await closeBeforeMenu(page, bridge, mark);
  mark('thanks-visible', { visibleBeforeClose: thanks });
  await sleep(1000); mark('end');
};
