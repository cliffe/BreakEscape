// t01_zainab_hook: the hook. Zainab's welcome in person-chat is three lines that auto-advance (confirmed in the dry run): line 1 "Welcome to the Tarrowby exercise..." (6.50 s cached),
// line 2 "Working on the road is normal and fine; it's the small things that catch people." (4.97 s), line 3 the hook line "A screen someone reads, a call someone hears, a bag left for
// a minute, a password typed into the wrong Wi-Fi page." (e961b33f, 8.69 s; speech: "A screen someone reads," 0.23-1.98, "a call someone hears," 2.21-3.69, "a bag left" 4.08-). The hook takes
// line 3 up to "hears": in = line 3 audio start - 0.1 s, out = + 3.89 s. The bar prints the WHOLE ink line, so the edit crops the bar in every format and burns the caption; this take logs the
// bar's box and text (the proof that "a bag left..." and "a password typed..." are only ever inside the cropped region) and closes the chat at line 3 start + 4.3 s, before the menu. Continue
// is never clicked. FRESH GAME ONLY: with kit_defend_done set she plays the done branch.
// Entry state: fresh game, no flags, kiosk never touched.
//   real run: tools/video/takes/run-take.sh ca20 t01_zainab_hook "" "--hide-hud --zoom-step 1"
// Marks: start-hold, player-sprite, interact:*, talk, frame:npc-portrait-up, l1_start, l2_start (autoAdvanced, gapS), l3_start (the hook's audio start), h_in (= l3_start - 0.1, est), h_out
//   (= l3_start + 3.89, est), bar-box (x y w h, text), name-box, frame:hook-mid (l3 + 2.0 s), tts-proof, chat-closed, end.
import { sleep, prepare, sprite, talkTo, closeBeforeMenu, watchVoice, waitVoiceStart, watchTts2, boxOf, buttons } from './_ca20.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge); await sleep(300);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done === true) throw new Error('entry state wrong: kit_defend_done already set (she would play the done branch)');
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); const tw = watchTts2(page, mark);
  await sprite(page, mark);
  mark('start-hold'); await sleep(600);
  await talkTo(page, bridge, mark, 'zainab_hussain', /Zainab/i);
  const l1 = await waitVoiceStart(page, /Welcome to the Tarrowby/i, 30000);
  if (!l1) throw new Error('line 1 never started; heard: ' + JSON.stringify(await page.evaluate(() => (window.__voiceEvents || []).map(e => e.text))));
  mark('l1_start', null, l1.start);
  const l2 = await waitVoiceStart(page, /normal and fine/i, 15000);
  if (!l2) throw new Error('line 2 did not start by itself (needs Continue?); buttons ' + JSON.stringify(await buttons(page)));
  mark('l2_start', { autoAdvanced: true, gapS: +((l2.start - l1.start) / 1000).toFixed(2) + ' (start to start)' }, l2.start);
  const l3 = await waitVoiceStart(page, /A screen someone reads/i, 15000);
  if (!l3) throw new Error('line 3 (the hook) did not start by itself; buttons ' + JSON.stringify(await buttons(page)));
  mark('l3_start', { startToStartS: +((l3.start - l2.start) / 1000).toFixed(2) }, l3.start);
  mark('h_in', { est: true, minusS: 0.1 }, l3.start - 100); mark('h_out', { est: true, plusS: 3.89 }, l3.start + 3890);
  const bar = await boxOf(page, /A screen someone reads/i);
  const barText = await page.evaluate(() => { const e = [...document.querySelectorAll('body *')].find(x => x.offsetParent && /A screen someone reads/.test(x.innerText || '') && ![...x.children].some(c => /A screen someone reads/.test(c.innerText || ''))); return e ? e.innerText.replace(/\s+/g, ' ') : null; });
  mark('bar-box', { ...bar, text: barText, hasWholeLine: /wrong Wi-Fi page/i.test(barText || '') });
  mark('name-box', await boxOf(page, /^Zainab/i));
  mark('buttons-at-l3', { b: await buttons(page) });
  while (Date.now() < l3.start + 2000) await sleep(20);
  mark('frame:hook-mid');
  while (Date.now() < l3.start + 4300) await sleep(20);
  await closeBeforeMenu(page, bridge, mark, 0);
  await sleep(300);
  const ok = tw.log.some(l => l.status === 200 && /audio/.test(l.ct) && /A screen someone reads/.test(l.text));
  mark('tts-proof', { ok, log: tw.log.map(l => [l.status, l.ct, l.bytes, l.text.slice(0, 40)]) });
  await vw.stop(); tw.stop();
  await sleep(500); mark('end');
  if (!ok) throw new Error('hook line not voiced by /tts');
};
