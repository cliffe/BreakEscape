// t01_cutscene: the opening cutscene on a FRESH game (arrival_briefing, timedConversation on game_loaded; skipped when briefing_played is set).
// Feeds: hook (Sarah line 5, 024fc8), ahmed (line 7, 7ddd76), end_wide / end_close (line 9, 498a90; the 3x close-up is an integer crop of this take in the edit).
// Entry state: a fresh game, no flags:  tools/video/takes/run-take.sh sis01 t01_cutscene "" "--hide-hud --zoom-step 1"
// The nine lines in order (dry run, 23 Nov): Narrator x3 (exterior background), then Background[room] and Sarah x6:
//   4 "You're the incident response team?..."  5 "That screen behind me's been showing a ransom note..." (HOOK)  6 "So we're on paper..."
//   7 "Mr Ahmed in Bed 4 is two days after heart surgery..." (AHMED)  8 "Ravi left you this pass for the IT office..." (#give_item:keycard)  9 "Whatever you decide up there lands down here." (END)
// Lines 5, 7 and 9 play in full (marks line-start:/line-end: at the page clock, from the voice watcher); every other line is skipped after 0.45 s.
// The keycard toast "Received: Northgate IT Security - Visitor Access Card" shows centred at line 8 (2 s); CHAT_CSS hides it, so line 9 is clean.
// Player stays at the default spawn (the chat background is chosen by x). Ends 1.6 s after line 9 ends, before the Mission Brief notes panel can matter.
// Marks: sprite, line-start:/line-end: (every voiced line), hook_start/hook_end, ahmed_start/ahmed_end, end_start/end_end, bar-rect, frame:hook_t+N, frame:ahmed_t+N, frame:end_t+N, toast-check, end.
import { sleep, watchVoice, prepare, sprite, rectOf, watchTts } from './_sis01.mjs';
import { CHAT_CSS } from './_sis01.mjs';

const TARGETS = [
  { name: 'hook', re: /ransom note since half ten/i, frames: [0.8, 2.7, 4.5, 6.5] },
  { name: 'ahmed', re: /Mr Ahmed in Bed 4 is two days/i, frames: [1.0, 3.0, 5.0, 7.0] },
  { name: 'end', re: /Whatever you decide up there lands down here/i, frames: [0.6, 1.8, 3.2, 4.0] },
];

export default async (page, bridge, mark) => {
  await page.addStyleTag({ content: CHAT_CSS }).catch(() => {});
  watchTts(page, mark);
  await sprite(page, mark);
  const vw = await watchVoice(page, mark);
  const startOf = async (re, timeoutMs = 20000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      const s = await page.evaluate((src) => (window.__voiceEvents || []).find(e => e.type === 'start' && new RegExp(src, 'i').test(e.text || '')) || null, re.source).catch(() => null);
      if (s) return s.start; await sleep(40);
    }
    return null;
  };
  const done = new Set(); let lastTarget = null; const t0 = Date.now(); let barMarked = false;
  while (Date.now() - t0 < 90000) {
    const d = (await bridge.getState()).dialogue;
    if (!d) { if (done.size === TARGETS.length) break; await sleep(150); continue; }
    const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
    const tgt = TARGETS.find(t => t.re.test(last) && !done.has(t.name));
    if (tgt) {
      done.add(tgt.name);
      const st = await startOf(tgt.re);
      if (!st) throw new Error(tgt.name + ' never started (no voice)');
      mark(tgt.name + '_start', { text: last.slice(0, 80) }, st);
      if (!barMarked) { barMarked = true; mark('bar-rect', { bar: await rectOf(page, '.person-chat-bar, [class*=dialogue-box], [class*=chat-bar], .person-chat-dialogue'), skip: await rectOf(page, '.person-chat-skip, [class*=skip]') }); }
      let fi = 0;
      const toastWatch = [];
      const end = await (async () => {
        for (let i = 0; i < 400; i++) {
          const el = (Date.now() - (st - 0)) / 1000; // st is epoch ms
          while (fi < tgt.frames.length && (Date.now() - st) / 1000 >= tgt.frames[fi]) { mark('frame:' + tgt.name + '_t+' + tgt.frames[fi]); fi++; }
          const toast = await page.evaluate(() => !![...document.querySelectorAll('.person-chat-notification')].some(e => getComputedStyle(e).display !== 'none')).catch(() => false);
          if (toast) toastWatch.push(+((Date.now() - st) / 1000).toFixed(2));
          const l = (vw.lines || []).find(x => tgt.re.test(x.text));
          await vw.drain(); if (l) return l; await sleep(60);
        }
        return null;
      })();
      mark(tgt.name + '_end', { durMs: end && end.durMs, toastVisibleAt: toastWatch.slice(0, 5) });
      await sleep(tgt.name === 'end' ? 1600 : 900);
      if (tgt.name === 'end') { mark('toast-check', { visibleSamples: toastWatch.length }); break; }
      if (d.canContinue) await bridge.minigame.continue_().catch(() => {});
    } else if (d.canContinue) { await sleep(450); await bridge.minigame.continue_().catch(() => {}); }
    await sleep(100);
  }
  if (done.size !== TARGETS.length) throw new Error('targets reached: ' + [...done].join(','));
  await vw.stop();
  mark('end');
};
