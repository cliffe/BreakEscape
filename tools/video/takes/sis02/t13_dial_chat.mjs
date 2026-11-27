// t13_dial_chat: Helen, hub "That dial in the hall. Which do we believe?" then "Neither yet. The historian will show which one has drifted." (end_line, Helen a0fe34
//   "Fair enough. Be quick, mind. If the dial's right, every minute counts."; the 3x close-up is an integer crop of this take in the edit).
// Entry state: tools/video/takes/run-take.sh sis02 t13_dial_chat "--set anomaly_detected=true --set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
// SPOILER: the knot's first line ("Fifty-one on the dial. Twenty-eight on my screen.") shows in the bar while the choices are up; its bar text and audio are never kept. After the pick the bar holds a0fe34's text.
//   The choices and the bar are cropped in every aspect. The pick sets gauge_verdict=historian (ink #set_global).
// Marks: sprite, choices-before-pick, gauge-first-line (bar text before the pick; NEVER in the edit), choices-before-line, end_start/end_end, bar-text (at line start: must not contain 51 / 28 / Fifty / Twenty),
//   frame:end_t+N, globals-check (gauge_verdict), toast-check, tts, chat-closed, end.
import { sleep, watchVoice, prepare, sprite, watchTts, playLine, openChat, markChatRects, visibleChoices, pickChoice, awaitChoice } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  watchTts(page, mark); await sprite(page, mark);
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1200);
  await openChat(bridge, mark, 'helen_marsh');
  const d = await awaitChoice(bridge, 30000);
  mark('choices-before-pick', { choices: d && d.choices.map(c => c.text) });
  await pickChoice(bridge, /dial in the hall/i);
  const d2 = await awaitChoice(bridge, 60000);   // the gauge_decision line is voiced (skipped by the audio mute in the edit); its choices appear
  mark('gauge-first-line', { text: (d2.text || '').slice(0, 120), choices: d2.choices.map(c => c.text) });
  await pickChoice(bridge, /Neither yet/i);
  await sleep(150);
  mark('choices-before-line', await visibleChoices(page));
  await markChatRects(page, mark, 'bar-rect');
  const bt = await page.evaluate(() => (document.querySelector('.person-chat-bar, [class*=dialogue-box], [class*=chat-bar], .person-chat-dialogue') || {}).innerText || '');
  mark('bar-text', { text: bt.slice(0, 200), has51: /51|fifty|twenty|28/i.test(bt) });
  const toast = page.evaluate(() => new Promise(r => { let n = 0; const iv = setInterval(() => { n += [...document.querySelectorAll('.person-chat-notification, [class*=notification], .game-notification')].filter(e => e.offsetParent !== null && getComputedStyle(e).display !== 'none').length; }, 50); setTimeout(() => { clearInterval(iv); r(n); }, 4500); }));
  await playLine(page, mark, vw, /Be quick, mind/i, 'end', [0.3, 0.8, 1.2, 2.0, 3.0]);
  mark('toast-check', { visibleSamples: await toast });
  const st = await bridge.getState(); mark('globals-check', { gauge_verdict: st.globals && st.globals.gauge_verdict });
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await vw.stop(); await sleep(400); mark('end');
};
