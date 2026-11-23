// Shared helpers for the ca01 (Invoice fraud) take scripts. Generic kiosk/button/bubble helpers come from ../ca15/_ca15.mjs (which
// re-exports ../ca12/_ca12b.mjs). Nothing here sets a game global; every action is a real click, a select change or a key walk.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, checkSprite, hideText } from '../ca15/_ca15.mjs';
import { keyLegs } from '../lib/walklib.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, checkSprite, hideText, keyLegs };

export const SPEED = 145;   // player px/s (m02 measured); keyLegs corrects in pulses

/** True when a visible element matching `sel` (and, if given, whose text matches `re`) exists. */
export const visible = (page, sel, re = null) => page.evaluate(([s, src, fl]) => {
  const r = src ? new RegExp(src, fl) : null;
  return [...document.querySelectorAll(s)].some(e => e.offsetParent && (!r || r.test((e.innerText || '').replace(/\s+/g, ' '))));
}, [sel, re && re.source, re && re.flags]);

/** Wait until `visible()` is true (the mark must be logged when the element is really on screen, not when the click was sent). */
export async function waitVisible(page, sel, re = null, timeoutMs = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { if (await visible(page, sel, re)) return true; await sleep(60); }
  throw new Error('never visible: ' + sel + (re ? ' ' + re : ''));
}

/** Real mouse move then click on the first visible element matching `sel` (and text `re`). Returns its centre. */
export async function mouseClick(page, sel, re = null, { steps = 10, dwell = 250, click = true } = {}) {
  const pt = await page.evaluate(([s, src, fl]) => {
    const r = src ? new RegExp(src, fl) : null;
    const e = [...document.querySelectorAll(s)].find(x => x.offsetParent && (!r || r.test((x.innerText || '').replace(/\s+/g, ' '))));
    if (!e) return null; e.scrollIntoView({ block: 'nearest' });
    const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  }, [sel, re && re.source, re && re.flags]);
  if (!pt) throw new Error('nothing to click: ' + sel + (re ? ' ' + re : ''));
  await page.mouse.move(pt.x, pt.y, { steps }); await sleep(dwell);
  if (click) await page.mouse.click(pt.x, pt.y);
  return pt;
}

/** Marks `<name>` the first time the visible person-chat subtitle (.person-chat-dialogue-text, whitespace-normalised, so line wraps
 *  do not matter) matches each spec's regex. Page clock, polled every 25 ms. specs: [{ name, re }]. Returns { stop() }. */
export async function watchSubtitles(page, mark, specs) {
  await page.evaluate((sp) => {
    if (window.__subWatch) clearInterval(window.__subWatch);
    const rs = sp.map(s => ({ name: s.name, re: new RegExp(s.src, s.fl) })); const ev = window.__subEvents = []; const fired = new Set();
    window.__subWatch = setInterval(() => {
      const el = document.querySelector('.person-chat-dialogue-text'); if (!el || !el.offsetParent) return;
      const t = (el.innerText || '').replace(/\s+/g, ' ');
      for (const r of rs) if (!fired.has(r.name) && r.re.test(t)) { fired.add(r.name); ev.push({ name: r.name, t: performance.timeOrigin + performance.now(), text: t.slice(0, 160) }); }
    }, 25);
  }, specs.map(s => ({ name: s.name, src: s.re.source, fl: s.re.flags })));
  let n = 0, alive = true;
  const drain = async () => { const evs = await page.evaluate(() => window.__subEvents ? window.__subEvents.slice() : []).catch(() => []); for (; n < evs.length; n++) mark(evs[n].name, { text: evs[n].text }, evs[n].t); };
  const timer = setInterval(() => { if (alive) drain(); }, 100);
  return { drain, async stop() { alive = false; clearInterval(timer); await drain(); await page.evaluate(() => { clearInterval(window.__subWatch); }).catch(() => {}); } };
}

/** Walk in straight legs to just below an NPC (left/right first, then up), then fall back to moveToNear if the legs did not get in range.
 *  Positions are read live (office-life NPCs move). Leaves the final approach to interactRetry. */
export async function walkToNpc(bridge, id, mark, stopBelow = 44) {
  const find = async () => (await bridge.getState({ radius: 14 * 32, limit: 40 })).nearby.find(n => n.kind === 'npc' && n.id === id);
  const n = await find(); if (!n) throw new Error('npc not found nearby: ' + id);
  mark('walk-start', { npc: id, x: Math.round(n.x), y: Math.round(n.y), player: (await bridge.getState()).player });
  await keyLegs(bridge, [['left', n.x], ['up', n.y + stopBelow]], SPEED, mark);
  const m = await find(); mark('walk-end', { inRange: m && m.inRange, distance: m && Math.round(m.distance) });
  if (!m || !m.inRange) { mark('walk-fallback-moveToNear'); await bridge.moveToNear(id, { timeoutMs: 15000 }).catch(() => {}); }
}

/** Talk to an NPC: marks `talk` when the chat is open and `frame:npc-portrait-up` when the NPC's portrait replaces the player's. */
export async function talkTo(page, bridge, mark, id, nameRe) {
  const up = waitNpcPortrait(page, bridge, mark, nameRe, 30000); up.catch(() => {});
  await interactRetry(bridge, id, mark); mark('talk');
  await up;
}

/** After a line ends: watch 150 ms for the choice menu (mark menu-up if it shows), then close the chat (mark chat-closed). */
export async function closeBeforeMenu(page, bridge, mark, waitMs = 150) {
  const t0 = Date.now(); let menu = false;
  while (Date.now() - t0 < waitMs) { const d = (await bridge.getState()).dialogue; if (d && d.awaitingChoice && !menu) { menu = true; mark('menu-up'); } await sleep(40); }
  await bridge.minigame.close().catch(() => {}); mark('chat-closed'); return menu;
}
