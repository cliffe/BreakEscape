// Part B helpers for the sis01 take scripts (t07 to t12). Imports _sis01.mjs (part A owns it; not edited here).
import { sleep, rectOf, interact } from './_sis01.mjs';
export * from './_sis01.mjs';

/** Selector for the person-chat bar (dialogue text + choices) and the portrait; logged as rects so the edit can crop the bar out. */
export const BAR_SEL = '.person-chat-bar, [class*=dialogue-box], [class*=chat-bar], .person-chat-dialogue';
export const PORTRAIT_SEL = '.person-chat-portrait, [class*=portrait] canvas, [class*=portrait] img, [class*=portrait]';

/** Mark the geometry of the chat bar, choice buttons and portrait (page px, 1920x1080). */
export async function markChatRects(page, mark, label = 'chat-rects') {
  const bar = await rectOf(page, BAR_SEL);
  const choices = await page.evaluate(() => [...document.querySelectorAll('.person-chat-choice, [class*=choice] button, button[class*=choice]')].filter(e => e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })).catch(() => []);
  const portrait = await rectOf(page, PORTRAIT_SEL);
  mark(label, { bar, choices, portrait });
}

/** Open the person-chat on an NPC (bridge interact, retry) and wait for the dialogue state. Returns the dialogue block. */
export async function openChat(bridge, mark, id, timeoutMs = 30000) {
  await interact(bridge, mark, id);
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { const d = (await bridge.getState()).dialogue; if (d) { mark('chat-open:' + id, { speaker: d.speaker }); return d; } await sleep(100); }
  throw new Error('chat never opened for ' + id);
}

/** Visible hub choice buttons right now (text list); used to prove none is on screen before a line starts. */
export const visibleChoices = (page) => page.evaluate(() => [...document.querySelectorAll('.person-chat-choice, [class*=choice] button, button[class*=choice]')].filter(e => e.offsetParent !== null).map(e => (e.textContent || '').trim().slice(0, 60))).catch(() => []);

/** Nearby ids in a room (kind|id|name), logged for the take notes. */
export async function logNearby(bridge, mark, radius = 2000) {
  const s = await bridge.getState({ radius, limit: 200 });
  mark('nearby', s.nearby.map(n => [n.kind, n.id, n.name].join('|')).slice(0, 40));
  return s;
}

/** Wait for a voiced line matching re; marks <name>_start / <name>_end at the voice's own clock and 'frame:<name>_t+N' at each offset from the line start
 *  (the dry run saves a screenshot per frame mark). Returns the line event, or throws. */
export async function playLine(page, mark, vw, re, name, frames = [], timeoutMs = 30000) {
  const t0 = Date.now(); let st = null, fi = 0; playLine.__m = false;
  while (Date.now() - t0 < timeoutMs) {
    if (!st) st = await page.evaluate((src) => (window.__voiceEvents || []).find(e => e.type === 'start' && new RegExp(src, 'i').test(e.text || '')) || null, re.source).catch(() => null);
    if (st && !playLine.__m) { playLine.__m = true; mark(name + '_start', { text: st.text.slice(0, 80) }, st.start); }
    if (st) while (fi < frames.length && (Date.now() - st.start) / 1000 >= frames[fi]) { mark('frame:' + name + '_t+' + frames[fi]); fi++; }
    await vw.drain();
    const l = vw.lines.find(x => re.test(x.text));
    if (l) { mark(name + '_end', { durMs: l.durMs }, l.end); return l; }
    await sleep(40);
  }
  throw new Error(name + ' never completed; heard: ' + JSON.stringify(vw.lines.map(x => x.text.slice(0, 40))));
}

/** Skip through voiced lines (Continue after a short dwell) until the dialogue offers choices; returns the dialogue block. */
export async function skipToChoices(bridge, mark, dwellMs = 450, timeoutMs = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const d = (await bridge.getState()).dialogue;
    if (d && d.awaitingChoice) { mark('choices-shown', { choices: d.choices.map(c => c.text) }); return d; }
    if (d && d.canContinue) { await sleep(dwellMs); await bridge.minigame.continue_().catch(() => {}); }
    await sleep(120);
  }
  throw new Error('no choices appeared');
}

/** Ancestor class chain of a selector's first match (to find the frame to narrow). */
export const chainOf = (page, sel) => page.evaluate((s) => { const out = []; let e = document.querySelector(s); while (e && e !== document.body) { const r = e.getBoundingClientRect(); out.push(e.tagName.toLowerCase() + '.' + String(e.className).split(' ').join('.') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); e = e.parentElement; } return out; }, sel);
