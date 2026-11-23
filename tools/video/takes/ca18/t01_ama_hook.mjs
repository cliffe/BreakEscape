// t01_ama_hook: the hook. Ama's welcome is two lines: line 1 "Welcome to the Merrin & Sallow exercise. I look after security for the practice." then line 2, the hook, "Attackers rarely pick one person and crack
// them." (cached 3.41 s, speech 0.29 to 3.06 s). Person-chat view, fresh game, first talk. The take logs whether line 2 starts by itself or needs Continue (mark `continue`), plays line 2 whole, closes the chat
// 0.2 s after it ends (line 3 "They scoop up everyone's names..." is not heard) and logs the subtitle bar's rect (the edit crops it out and burns the sentence).
// Entry state: fresh game, no flags, kiosk never opened.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca18 t01_ama_hook "" "--hide-hud --zoom-step 1"
// Marks: start-hold, player-sprite, interact:*, frame:npc-portrait-up, line1_start/line1_end, continue (buttons shown before line 2 / how it advanced), line2_start/line2_end (real TTS edges), line3_start (only if it began),
//   rect:bar, rect:portrait, frame:line2, chat-closed, tts-response, end. The edit's in = line2_start - 0.15, out = line2_end + 0.2.
import { sleep, prepare, checkSprite, talkTo, watchTts, buttons, watchSubtitles } from './_ca18.mjs';
import { watchVoice } from '../lib/lib.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }

export default async (page, bridge, mark) => {
  const tts = await watchTts(page, mark);
  const vw = await watchVoice(page, mark);
  await checkSprite(page, mark);
  mark('start-hold'); await sleep(1500);
  await talkTo(page, bridge, mark, 'ama_owusu', /Ama/i);
  const l1 = await vw.waitForLine(/Welcome to the Merrin|Attackers rarely|See how little/i, 30000);
  if (!l1) throw new Error('no line voiced; heard: ' + JSON.stringify(vw.lines.map(l => l.text)));
  if (!/Welcome to the Merrin/.test(l1.text)) throw new Error('wrong first line (not the welcome): ' + l1.text);
  mark('line1_start', null, l1.start); mark('line1_end', { durMs: l1.durMs }, l1.end);
  const info = await page.evaluate(() => ({ buttons: [...document.querySelectorAll('button')].filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean) }));
  mark('continue', { buttons: info.buttons, note: 'checked right after line 1 ends; line 2 may follow by itself' });
  const l2 = await vw.waitForLine(/Attackers rarely/i, 12000);
  if (!l2) throw new Error('line 2 did not start by itself within 12 s (needs Continue?); heard: ' + JSON.stringify(vw.lines.map(l => l.text)) + ' buttons ' + JSON.stringify(info.buttons));
  mark('line2_start', { autoAdvanced: true, gapS: +((l2.start - l1.end) / 1000).toFixed(2) }, l2.start); mark('line2_end', { durMs: l2.durMs }, l2.end);
  mark('rect:bar', await page.evaluate(() => {
    const out = {}; const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    for (const e of document.querySelectorAll('*')) { const t = (e.innerText || '').trim(); if (e.children.length === 0 && /^Attackers rarely pick one person/.test(t) && e.offsetParent) out.text = R(e); }
    const c = document.querySelector('.minigame-game-container'); if (c) out.container = R(c);
    return out; }));
  mark('frame:line2');
  await sleep(200);
  const l3 = vw.lines.find(l => /They scoop up/.test(l.text)); if (l3) mark('line3_start', null, l3.start);
  await vw.stop(); await tts.stop();
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await sleep(700); mark('end');
};
