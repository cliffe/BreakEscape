// t05_cutscene: the opening cutscene on a FRESH game (arrival_briefing; skipped when briefing_played is set). Feeds: normal (Helen 947018) and responder (Helen 680ab6).
// Entry state: fresh game, NO flags: tools/video/takes/run-take.sh sis02 t05_cutscene "" "--hide-hud --zoom-step 1"
// Narrator lines (about 29 s) and the other Helen lines are skipped after 0.45 s each; 947018 ("Every reading on that screen's normal. Too normal for a night on charge.") and
// 680ab6 ("There's an old dial gauge at Rack A2, on no network at all. Tell me what it says.") play in full with frame marks. The badge branch plays by itself on a fresh game.
// The keycard toast ("Received: ...") is hidden by CHAT_CSS. The take STOPS 0.5 s after 680ab6 ends and never continues: the cutscene's last lines set helen_briefed and start the timers.
// Marks: sprite, line-start/line-end for every voiced line, normal_start/_end, responder_start/_end, bar-rect, frame:normal_t+N, frame:responder_t+N, toast-check, end.
import { sleep, watchVoice, prepare, sprite, rectOf, watchTts, CHAT_CSS, BAR_SEL } from './_sis02.mjs';

const TARGETS = [
  { name: 'normal', re: /Every reading on that screen/i, frames: [0.3, 1.0, 2.5, 4.0] },
  { name: 'responder', re: /old dial gauge at Rack A2/i, frames: [0.3, 1.0, 2.0, 3.5, 5.0] },
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
  const done = new Set(); const t0 = Date.now(); let barMarked = false; const allLines = [];
  while (Date.now() - t0 < 120000) {
    const d = (await bridge.getState()).dialogue;
    if (!d) { if (done.size === TARGETS.length) break; await sleep(150); continue; }
    const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
    if (!allLines.includes(last)) { allLines.push(last); mark('line-text', { speaker: d.speaker, text: last.slice(0, 90) }); }
    const tgt = TARGETS.find(t => t.re.test(last) && !done.has(t.name));
    if (tgt) {
      done.add(tgt.name);
      const st = await startOf(tgt.re);
      if (!st) throw new Error(tgt.name + ' never started (no voice)');
      mark(tgt.name + '_start', { text: last.slice(0, 80), speaker: d.speaker }, st);
      if (!barMarked) { barMarked = true; mark('bar-rect', { bar: await rectOf(page, BAR_SEL) }); }
      let fi = 0; const toastWatch = [];
      const end = await (async () => {
        for (let i = 0; i < 400; i++) {
          while (fi < tgt.frames.length && (Date.now() - st) / 1000 >= tgt.frames[fi]) { mark('frame:' + tgt.name + '_t+' + tgt.frames[fi]); fi++; }
          const toast = await page.evaluate(() => [...document.querySelectorAll('.person-chat-notification')].some(e => getComputedStyle(e).display !== 'none')).catch(() => false);
          if (toast) toastWatch.push(+((Date.now() - st) / 1000).toFixed(2));
          const l = (vw.lines || []).find(x => tgt.re.test(x.text));
          await vw.drain(); if (l) return l; await sleep(60);
        }
        return null;
      })();
      mark(tgt.name + '_end', { durMs: end && end.durMs, toastVisibleAt: toastWatch.slice(0, 5) });
      if (tgt.name === 'responder') { await sleep(500); mark('toast-check', { visibleSamples: toastWatch.length }); break; }   // CAP: end + 0.5 s, no Continue
      await sleep(900);
      if (d.canContinue) await bridge.minigame.continue_().catch(() => {});
    } else if (d.canContinue) { await sleep(450); await bridge.minigame.continue_().catch(() => {}); }
    await sleep(100);
  }
  if (done.size !== TARGETS.length) throw new Error('targets reached: ' + [...done].join(','));
  const st = await bridge.getState(); mark('globals-check', { helen_briefed: st.globals && st.globals.helen_briefed });
  await vw.stop();
  mark('end');
};
