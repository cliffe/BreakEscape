// t01_anjali_hook: the hook. Anjali's welcome in her person-chat view. One ink line, 9.26 s cached (e989a909): "Anjali Rao," 0.18-0.95, "information security." 1.11-2.18,
// pause, clause 1 of sentence 2 ("I'm the one who gets the call when something looks wrong,") 2.71-5.45, comma pause 5.45-5.58, "and I'd always rather hear about nothing than miss something." 5.58-8.80.
// The hook plays clause 1 only: in = line audio start + 2.48 s, out = + 5.48 s (30 to 40 ms fade in the edit). The game's bar prints the WHOLE line at once, so the edit crops the bar in every
// format and burns clause 1 as the caption (plus the name plate "Anjali, information security"). This take logs the bar's box and text, then closes the chat at start + 5.6 s, before "and I'd always
// rather...". No reply is clicked. Entry state: fresh game, no flags, kiosk never touched. Interact only after the first 5 s of game time (no chatter bark in the hook window).
//   tools/video/takes/run-take.sh ca19_malware_and_updates t01_anjali_hook "" "--hide-hud --zoom-step 1"
// Marks: start-hold, player-sprite, talk, frame:npc-portrait-up, h_audio_start, h_in (= start + 2.48 s, est), h_out (= start + 5.48 s, est), bar-box, name-box, bar-hidden-check, frame:clause1, tts-proof,
//   bark-audio-in-window, chat-closed, end.
import { sleep, prepare, sprite, talkTo, closeBeforeMenu, watchVoice, waitVoiceStart, watchTts2, watchBarkAudio, boxOf } from './_ca19.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge); await sleep(300);
  const g = (await bridge.getState()).globals || {};
  if (g.episode_e19_malware_and_updates_defend_complete === true || g.kit_defend_done === true) throw new Error('entry state wrong: defend already complete');
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); const tw = watchTts2(page, mark); const aw = await watchBarkAudio(page, mark);
  await sprite(page, mark);
  mark('start-hold'); await sleep(5200);                       // no chatter bark in the hook window: wait out the first 5 s of game time
  await talkTo(page, bridge, mark, 'anjali_rao', /Anjali/i);
  const h = await waitVoiceStart(page, /I'm the one who gets the call/i, 30000);
  if (!h) throw new Error('welcome line never started; heard: ' + JSON.stringify(await page.evaluate(() => (window.__voiceEvents || []).map(e => e.text))));
  mark('h_audio_start', null, h.start);
  mark('h_in', { est: true, plusS: 2.48 }, h.start + 2480); mark('h_out', { est: true, plusS: 5.48 }, h.start + 5480);
  const sel = /I'm the one who gets the call/i;
  const bar = await boxOf(page, sel);
  const barText = await page.evaluate(() => { const e = [...document.querySelectorAll('body *')].find(x => x.offsetParent && /I'm the one who gets the call/.test(x.innerText || '') && ![...x.children].some(c => /I'm the one who gets the call/.test(c.innerText || ''))); return e ? e.innerText.replace(/\s+/g, ' ') : null; });
  mark('bar-box', { ...bar, text: barText, hasTail: /miss something/i.test(barText || '') });
  mark('name-box', await boxOf(page, /^Anjali Rao$/));
  while (Date.now() < h.start + 4000) await sleep(20);
  mark('frame:clause1');
  while (Date.now() < h.start + 5600) await sleep(20);
  await aw.drain(); mark('bark-audio-in-window', { events: await page.evaluate(() => (window.__audioEvents || []).map(e => [e.type, e.npc, Math.round(e.t - performance.timeOrigin)]).slice(0, 12)) });
  await closeBeforeMenu(page, bridge, mark, 0);
  await sleep(300);
  const ok = tw.log.some(l => l.status === 200 && /audio/.test(l.ct) && /I'm the one who gets the call/.test(l.text));
  mark('tts-proof', { ok, log: tw.log.map(l => [l.status, l.ct, l.bytes, l.text.slice(0, 40)]) });
  await vw.stop(); tw.stop(); await aw.stop();
  await sleep(500); mark('end');
  if (!ok) throw new Error('hook line not voiced by /tts');
};
