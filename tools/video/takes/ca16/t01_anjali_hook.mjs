// t01_anjali_hook: the hook. Anjali's welcome in her person-chat view. One ink line, 10.30 s cached (a33a8692): sentence 1 0.29-2.54, sentence 2 3.58-7.34
// ("This week someone's leaving and there's a bit of talk going round."), sentence 3 8.37-9.89 ("You're not here to catch anyone."). The hook takes sentence 2 only:
// in = line audio start + 3.38 s, out = + 7.54 s. The game's bar prints ALL THREE sentences at once, so the edit crops the bar in every format and burns sentence 2 as
// the caption. This take logs the bar's box and text (the proof that "You're not here to catch anyone" is only ever inside the cropped region) and closes the chat at
// start + 7.7 s, before sentence 3 and before the choice menu. No reply is clicked.
// Entry state: fresh game, no flags, kiosk never touched.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca16_insider_risk t01_anjali_hook "" "--hide-hud --zoom-step 1"
// Marks: start-hold, player-sprite, walk-*, talk, frame:npc-portrait-up, h_audio_start, s2_in (= start + 3.38 s, est), s2_out (= start + 7.54 s, est), bar-box, name-box,
//   frame:s2-mid, tts-proof, chat-closed, end.
import { sleep, prepare, spriteCheck, talkTo, closeBeforeMenu, watchVoice, waitVoiceStart, watchTts2, boxOf } from './_ca16.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge); await sleep(300);
  const g = (await bridge.getState()).globals || {};
  if (g.episode_e16_insider_risk_defend_complete === true) throw new Error('entry state wrong: defend already complete');
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); const tw = watchTts2(page, mark);
  await spriteCheck(page, mark);
  mark('start-hold'); await sleep(600);
  await talkTo(page, bridge, mark, 'anjali_rao', /Anjali/i);
  const h = await waitVoiceStart(page, /This week someone's leaving/i, 30000);
  if (!h) throw new Error('welcome line never started; heard: ' + JSON.stringify(await page.evaluate(() => (window.__voiceEvents || []).map(e => e.text))));
  mark('h_audio_start', null, h.start);
  mark('s2_in', { est: true, plusS: 3.38 }, h.start + 3380); mark('s2_out', { est: true, plusS: 7.54 }, h.start + 7540);
  const bar = await boxOf(page, /This week someone's leaving/i);
  const barText = await page.evaluate(() => { const e = [...document.querySelectorAll('body *')].find(x => x.offsetParent && /This week someone's leaving/.test(x.innerText || '') && ![...x.children].some(c => /This week someone's leaving/.test(c.innerText || ''))); return e ? e.innerText.replace(/\s+/g, ' ') : null; });
  mark('bar-box', { ...bar, text: barText, hasSentence3: /not here to catch anyone/i.test(barText || '') });
  mark('name-box', await boxOf(page, /^Anjali Rao$/));
  while (Date.now() < h.start + 5000) await sleep(20);
  mark('frame:s2-mid');
  while (Date.now() < h.start + 7700) await sleep(20);
  await closeBeforeMenu(page, bridge, mark, 0);
  await sleep(300);
  const ok = tw.log.some(l => l.status === 200 && /audio/.test(l.ct) && /This week someone's leaving/.test(l.text));
  mark('tts-proof', { ok, log: tw.log.map(l => [l.status, l.ct, l.bytes, l.text.slice(0, 40)]) });
  await vw.stop(); tw.stop();
  await sleep(500); mark('end');
  if (!ok) throw new Error('hook line not voiced by /tts');
};
