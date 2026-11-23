// t05_ravi_line: Ravi Anand, first talk in the IT Security office. Feeds ravi1 (fdd5cf, "You're the response team. Good. I've been waiting for someone who can make a call.")
//   and ravi2 (e1d540 sentence 1, "I can't sign that alone.", reached by the third first-talk choice "Why not cut the link now? It's still spreading.").
// Entry state: tools/video/takes/run-take.sh sis01 t05_ravi_line "--start-room it_security_office --set briefing_played=true" "--hide-hud --zoom-step 1"
// Fresh game. The assess_ward aim gate does not block Ravi's start knot (logged: chat-open, objectives). Line order (ink npc_ravi.ink start): 1 fdd5cf, 2 "Nine hours in...", 3 "The SIEM's on my laptop...",
//   then the choice list; the third choice gives "I can't sign that alone. Cut the wrong link..." (e1d540; the edit uses sentence 1 only: close or cut before sentence 2).
// Marks: ravi-pos, chat-open, objectives, ravi1_start/ravi1_end, frame:ravi1_t+N, choices-shown, rect:choices (before pick), choice:*, ravi2_start/ravi2_end, frame:ravi2_t+N, chat-closed, tts (status per POST /tts), end.
import { sleep, prepare, sprite, interact, rectOf, watchVoice, watchTts, frame } from './_sis01.mjs';

const BAR_SEL = '.person-chat-bar, [class*=dialogue-box], [class*=chat-bar], .person-chat-dialogue';
const PORTRAIT_SEL = '.person-chat-portrait, [class*=portrait] canvas, [class*=portrait] img, [class*=portrait]';
const CHOICE_Q = '.person-chat-choice, [class*=choice] button, button[class*=choice]';
const choiceRects = (page) => page.evaluate((q) => [...document.querySelectorAll(q)].filter(e => e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect(); return { text: (e.textContent || '').trim().slice(0, 60), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }), CHOICE_Q).catch(() => []);

async function line(page, mark, vw, re, name, frames) {
  const t0 = Date.now(); let st = null, fi = 0;
  while (Date.now() - t0 < 30000) {
    if (!st) { st = await page.evaluate((src) => (window.__voiceEvents || []).find(e => e.type === 'start' && new RegExp(src, 'i').test(e.text || '')) || null, re.source).catch(() => null); if (st) mark(name + '_start', { text: st.text.slice(0, 80) }, st.start); }
    if (st) while (fi < frames.length && (Date.now() - st.start) / 1000 >= frames[fi]) { frame(mark, name + '_t+' + frames[fi]); fi++; }
    await vw.drain();
    const l = vw.lines.find(x => re.test(x.text));
    if (l) { mark(name + '_end', { durMs: l.durMs }, l.end); return l; }
    await sleep(40);
  }
  throw new Error(name + ' never completed; heard ' + JSON.stringify(vw.lines.map(x => x.text.slice(0, 40))));
}

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  watchTts(page, mark);
  await sprite(page, mark);
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1200);
  const s0 = await bridge.getState({ radius: 2000, limit: 200 });
  mark('objectives', s0.objectives);
  mark('ravi-pos', (s0.nearby || []).filter(n => /ravi/i.test(n.id)).map(n => ({ id: n.id, x: n.x | 0, y: n.y | 0, inRange: n.inRange })));
  await interact(bridge, mark, 'ravi_anand');
  let d = null; for (let i = 0; i < 300 && !d; i++) { d = (await bridge.getState()).dialogue; if (!d) await sleep(100); }
  if (!d) throw new Error('chat never opened (gate?)');
  mark('chat-open', { speaker: d.speaker });
  mark('bar-rect', { bar: await rectOf(page, BAR_SEL), portrait: await rectOf(page, PORTRAIT_SEL) });
  await line(page, mark, vw, /waiting for someone who can make a call/i, 'ravi1', [0.5, 1.5, 2.5, 3.5, 4.5]);
  // skip through the next lines to the choice list
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > 60000) throw new Error('no choices appeared');
    const dd = (await bridge.getState()).dialogue;
    if (dd && dd.awaitingChoice) { mark('choices-shown', { choices: dd.choices.map(c => c.text) }); break; }
    if (dd && dd.canContinue) { await sleep(450); await bridge.minigame.continue_().catch(() => {}); }
    await sleep(120);
  }
  await sleep(700);
  mark('choices-rect', { choices: await choiceRects(page), bar: await rectOf(page, BAR_SEL) });
  frame(mark, 'choices'); if (process.env.BE_DRY) await sleep(700);
  const ch = await bridge.minigame.choose(/Why not cut the link now/i);
  if (!ch || !ch.ok) throw new Error('choose failed ' + JSON.stringify(ch).slice(0, 200));
  mark('choice:' + ch.chose, { number: ch.number });
  // ravi2: e1d540 plays both sentences (6.1 s); the edit uses sentence 1 only (speech 0.257-1.755, break 1.755-2.430). Frames to 1.9 s, then close at 2.2 s, before sentence 2 starts.
  const t2 = Date.now(); let st2 = null, fi = 0; const F2 = [0.3, 0.9, 1.5, 1.9];
  while (Date.now() - t2 < 20000) {
    if (!st2) { st2 = await page.evaluate(() => (window.__voiceEvents || []).find(e => e.type === 'start' && /can't sign that alone/i.test(e.text || '')) || null).catch(() => null); if (st2) mark('ravi2_start', { text: st2.text.slice(0, 80) }, st2.start); }
    if (st2) { const el = (Date.now() - st2.start) / 1000; while (fi < F2.length && el >= F2[fi]) { frame(mark, 'ravi2_t+' + F2[fi]); fi++; } if (el >= 2.2) break; }
    await sleep(30);
  }
  if (!st2) throw new Error('ravi2 never started');
  mark('ravi2_cut');
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await vw.stop(); await sleep(500); mark('end');
};
