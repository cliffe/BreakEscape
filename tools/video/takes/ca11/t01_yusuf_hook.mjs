// t01_yusuf_hook: the hook. Yusuf's talk line "Handovers go out fast when it's busy." (sentence 1 of cached 5c66bd4a, speech 0.28 to 2.41 s of 6.74 s;
// sentence 2 "One wrong recipient and resident details land where they shouldn't." starts 2.98 s and is cut) in his person-chat view, not-caught branch.
// The chat is closed at audio start + 2.61 s (the edit's out), before sentence 2 and the choice menu. The game's bar prints sentence 2 (and the caught/react
// text), so the EDIT crops the bar in every format and burns sentence 1 as the caption; this take logs the bar's box so the crop can be proven.
// Entry state (fresh game, kiosk never touched; Yusuf's thirst need sends him to the cooler about 30 s after start, so the walk starts at once):
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca11_misdirected_data t01_yusuf_hook "--set kit_defend_done=true" "--hide-hud --zoom-step 1"
// Marks: start-hold, player-sprite, walk-*, talk, frame:npc-portrait-up, tts-response, h1_audio_start, h1_cut (= start + 2.61 s), bar-box, chat-closed, end.
import { sleep, prepare, spriteCheck, walkToNpc, talkTo, closeBeforeMenu, watchVoice, waitVoiceStart, watchTts2 } from './_ca11.mjs';

export async function setup(page, bridge) {
  await prepare(page, bridge); await sleep(300);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_caught === true || g.kit_key_caught === true) throw new Error('entry state wrong: ' + JSON.stringify({ d: g.kit_defend_done, c: g.kit_caught, k: g.kit_key_caught }));
}

export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark); const tw = watchTts2(page, mark);
  await spriteCheck(page, mark);
  mark('start-hold'); await sleep(600);
  await walkToNpc(bridge, 'kit_yusuf_demir', mark);
  await talkTo(page, bridge, mark, 'kit_yusuf_demir', /Yusuf/i);
  const h1 = await waitVoiceStart(page, /Handovers go out fast/i, 30000);
  if (!h1) throw new Error('hook line never started; heard: ' + JSON.stringify(await page.evaluate(() => (window.__voiceEvents || []).map(e => e.text))));
  mark('h1_audio_start', null, h1.start);
  mark('h1_cut', { est: true, plusS: 2.61 }, h1.start + 2610);
  // where the person-chat bar sits and what it prints (the edit crops it): box and text length only, no DOM dump
  const bar = await page.evaluate(() => { const els = [...document.querySelectorAll('body *')].filter(e => e.offsetParent && /Handovers go out fast/.test(e.innerText || '') && ![...e.children].some(c => /Handovers go out fast/.test(c.innerText || ''))); const e = els[0]; if (!e) return null; const r = e.getBoundingClientRect(); return { cls: String(e.className).slice(0, 60), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), text: (e.innerText || '').slice(0, 140) }; }).catch(() => null);
  mark('bar-box', bar);
  while (Date.now() < h1.start + 2610) { await sleep(20); }
  await closeBeforeMenu(page, bridge, mark, 0);
  await sleep(300);
  const ok = tw.log.some(l => l.status === 200 && /audio/.test(l.ct) && /Handovers go out fast/.test(l.text));
  mark('tts-proof', { ok, log: tw.log.map(l => [l.status, l.ct, l.bytes, l.text.slice(0, 40)]) });
  await vw.stop(); tw.stop();
  await sleep(700); mark('end');
  if (!ok) throw new Error('hook line not voiced by /tts: ' + JSON.stringify(tw.log));
};
