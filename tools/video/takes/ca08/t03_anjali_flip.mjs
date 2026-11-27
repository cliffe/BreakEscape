// t03_anjali_flip: the flip. The kiosk opens on "Now it lands on you" (section.aw-flip in .epr-body) with the strip on the Flip step; the body under the heading is hidden by CSS,
// the heading and strip are held 1 s, the kiosk is closed, the player walks to Anjali and talks: A3 "Good. The email's gone, and your colleague signed in, the way most people
// eventually do. Now take their seat and see what someone else is doing with their account." (10.22 s cached). The take throws if the first line is not A3. The chat is closed
// before the menu, so A4 and the choices never show.
// Entry state (scout S7; Ayaan's attempt counted, flip not done):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca08_after_the_click t03_anjali_flip \
//     "--set episode_e8_after_the_click_state={\"done\":[\"brief\",\"osint\",\"write\"]} --set phish_takeover_victim_attempts=1" "--hide-hud --zoom-step 1"
// setup() (off camera): prepare (Skip tutorial, close the Brief), the flip body CSS.
// Hidden by CSS: .aw-flip children except the heading and Continue (visibility:hidden).
// Marks: start-hold, player-sprite, kiosk-open, flip-heading (frame, heading and strip only), kiosk-closed, walk-start, leg:*, walk-end, talk, frame:npc-portrait-up,
//   a3-subtitle-start, line-start/line-end, a3-audio-start, a3-audio-end, menu-up (if shown before the close), chat-closed, tts-response, end.
import { sleep, prepare, openKiosk, waitButton, walkToNpc, talkTo, closeBeforeMenu, watchSubtitles, spriteCheck, watchTts } from './_ca08.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge); await sleep(300);
  await page.addStyleTag({ content: '.aw-flip > :not(.aw-heading):not(h1):not(h2):not(h3):not(.aw-continue){visibility:hidden !important}' });
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); const tw = watchTts(page, mark);
  const sw = await watchSubtitles(page, mark, [{ name: 'a3-subtitle-start', re: /The email.s gone/i }]);
  await spriteCheck(page, mark);
  mark('start-hold'); await sleep(1200);
  await openKiosk(page, bridge, mark); mark('kiosk-open');
  await page.waitForFunction(() => [...document.querySelectorAll('section.aw-flip')].some(e => e.offsetParent && /Now it lands on you/i.test(e.innerText)), null, { timeout: 10000 })
    .catch(async () => { throw new Error('flip heading not up; buttons/text: ' + (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300)))); });
  await sleep(250); mark('frame:flip-heading'); mark('flip-heading');
  await sleep(1000);
  await bridge.minigame.close(); mark('kiosk-closed'); await sleep(900);
  await walkToNpc(bridge, 'anjali_rao', mark);
  await talkTo(page, bridge, mark, 'anjali_rao', /Anjali/i);
  const a3 = await vw.waitForLine(/The email.s gone|Welcome|Good\.|Ring the person back|You stopped/i, 30000);
  if (!a3) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/The email.s gone/i.test(a3.text)) throw new Error('first line is not A3: ' + a3.text);
  mark('a3-audio-start', null, a3.start); mark('a3-audio-end', { durMs: a3.durMs }, a3.end);
  await sleep(120);
  await vw.stop(); await sw.stop(); tw.stop();
  await closeBeforeMenu(page, bridge, mark);
  await sleep(1000); mark('end');
};
