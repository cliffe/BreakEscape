// Shared helpers for the sis03 (Meridian Cyber Insurance: Coverage Determination) take scripts. Copied from sis02/_sis02.mjs (sis02 is in progress; not imported). Generic helpers come from ../lib/lib.mjs and ../lib/dlg.mjs.
// Nothing here sets a game global: every action is a real click or a bridge interact; entry states are --set seeds passed to new-game.sh
// (--set fires no events). Every take needs a FRESH game (a used game skips the opening).
import { sleep, watchVoice, clearScreen, awaitChoice, pickChoice, walk } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
import { checkSprite } from '../ca13/_ca13.mjs';
export { sleep, watchVoice, clearScreen, awaitChoice, pickChoice, walk, runDialogue };

export const SCENARIO = 'sis03_cyber_insurance';
/** Entry-state flags for run-take.sh / new-game.sh. */
export const SEEDS = {
  // --set fires no events. briefing_played=true skips the opening timedConversation (Eleanor's greeting, skipIfGlobal) and, because the briefing_played
  // eventMapping is a global_variable_changed event, a --set does not fire it either: the 3 s timed text should NOT arrive (dry run proves it).
  base: '--set briefing_played=true',
  archive: '--start-room meridian_evidence_archive --set briefing_played=true --set evidence_archive_unlocked=true',
};

/** Hides the person-chat "Received: ..." toast (the keycard, chat-helpers.js:144; a centred 2 s DOM toast) in every chat shot. */
export const CHAT_CSS = '.person-chat-notification{display:none !important}';

/** Marks the player's sprite key. Strict in a real run; lenient in the dry run (BE_DRY=1, BE_SPRITE not set there). */
export const sprite = (page, mark) => checkSprite(page, mark, { strict: !process.env.BE_DRY });

/** Fresh-game start for a take that skips the cutscene: wait for ready, close the Mission Brief notes panel and the tutorial prompt, inject CHAT_CSS. */
export async function prepare(page, bridge, mark) {
  await page.addStyleTag({ content: CHAT_CSS }).catch(() => {});
  await sleep(1200);
  await clearScreen(page, bridge, mark);
  await sleep(300);
}

/** Hide every NPC world bubble (Phaser containers: CSS cannot reach them). Existing and future bubbles; the says/pages state is untouched. */
export const HIDE_BUBBLES = () => {
  const nb = window.npcWorldBubbles; if (!nb || nb.__sis02hidden) return !!nb;
  const patch = (bb) => { const b = bb && bb.box; if (!b || b.__sis02) return bb; b.__sis02 = true; b.setVisible = function () { this.visible = false; return this; }; b.setAlpha = function () { this.alpha = 0; return this; }; b.visible = false; b.alpha = 0; return bb; };
  const make = nb._make; nb._make = function (...a) { return patch(make.apply(this, a)); };
  for (const bb of nb.bubbles.values()) patch(bb);
  nb.__sis02hidden = true; return true;
};

/** Mute every NPC bark voice (barkSystem.ttsManagers audio elements: muted + volume 0, re-applied every 5 ms, ca03 t05 method) and keep a per-50 ms sample log
 *  (window.__abLog) so the take can prove no bark was audible. Cutscene/person-chat audio is a different manager and is not touched. */
export const MUTE_BARKS = () => {
  if (window.__muteBarks) return true; window.__abLog = [];
  window.__muteBarks = setInterval(() => { try { const m = window.barkSystem && window.barkSystem.ttsManagers; if (m) for (const [, mgr] of m) if (mgr && mgr.audio) { mgr.audio.muted = true; mgr.audio.volume = 0; } } catch (_) {} }, 5);
  window.__abSample = setInterval(() => { try { const m = window.barkSystem && window.barkSystem.ttsManagers; if (!m) return; const row = { t: performance.now() | 0, els: {} };
    for (const [id, mgr] of m) { const a = mgr.audio; if (!a) continue; row.els[id] = { paused: a.paused, muted: a.muted, vol: a.volume, cur: +a.currentTime.toFixed(2) }; } window.__abLog.push(row); } catch (_) {} }, 50);
  return true;
};
export const muteSummary = (page) => page.evaluate(() => { const L = window.__abLog || []; const ids = new Set(); L.forEach(r => Object.keys(r.els).forEach(k => ids.add(k)));
  const out = {}; for (const id of ids) { const rows = L.map(r => r.els[id]).filter(Boolean); const pl = rows.filter(r => !r.paused && r.cur > 0); out[id] = { samples: rows.length, playingSamples: pl.length, allMuted: rows.every(r => r.muted), maxVolWhilePlaying: Math.max(0, ...pl.map(r => r.vol)) }; } return out; });

/** Bark/says watcher: marks 'bubble-start:<npc>' with the text when a world bubble's says entry appears (state read, works while bubbles are hidden). */
export async function watchSays(page, mark) {
  await page.evaluate(() => {
    if (window.__saysWatch) return; window.__saysEv = []; const seen = new Set();
    window.__saysWatch = setInterval(() => { try { const nb = window.npcWorldBubbles; if (!nb || !nb.says) return;
      for (const [id, s] of nb.says) { const txt = ((s && s.pages) || []).join(' ').trim(); const k = id + '|' + txt; if (txt && !seen.has(k)) { seen.add(k); window.__saysEv.push({ id, txt, t: performance.timeOrigin + performance.now() }); } } } catch (_) {} }, 40);
  });
  let n = 0;
  const drain = async () => { const ev = await page.evaluate(() => (window.__saysEv || []).slice()).catch(() => []); for (; n < ev.length; n++) mark('bubble-start:' + ev[n].id, { text: ev[n].txt.slice(0, 120) }, ev[n].t); return ev; };
  return { drain };
}

/** Logs every POST /tts answer (status, bytes, content type) to the marks, once per request. */
export function watchTts(page, mark) {
  page.on('response', async (r) => { try { if (r.request().method() === 'POST' && /\/tts(\?|$)/.test(r.url())) { const b = await r.body().catch(() => null); mark('tts', { status: r.status(), bytes: b ? b.length : null, type: r.headers()['content-type'] }); } } catch (_) {} });
}

/** Run a minigame take frame check: a 'frame:<name>' mark (the dry run saves a screenshot; the edit reads it as "check this frame"). */
export const frame = (mark, name) => mark('frame:' + name);

/** Narrow a DOM panel (9:16 / 1:1 variants): max-width 560 px, centred. */
export const narrow = (page, sel, maxW = 560) => page.addStyleTag({ content: `${sel}{max-width:${maxW}px !important;width:${maxW}px !important;margin-left:auto !important;margin-right:auto !important;box-sizing:border-box !important}` });

/** Bounding box of the first visible element matching a CSS selector (page px), or null. Logged as a 'rect:' mark so the edit can crop to it. */
export const rectOf = (page, sel) => page.evaluate((s) => { const e = [...document.querySelectorAll(s)].find(x => x.offsetParent !== null || getComputedStyle(x).position === 'fixed'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }, sel);

/** interact() with one retry (a first "no-effect-confirmed" reply is usual for a far target; the game walks the player over). */
export async function interact(bridge, mark, id, opts) {
  let r = await bridge.interact(id, opts).catch(e => ({ ok: false, error: String(e).slice(0, 120) }));
  mark('interact:' + id, { ok: r && r.ok, mode: r && r.mode, reason: r && r.reason });
  if (!r || !r.ok) { await sleep(1200); r = await bridge.interact(id, opts).catch(e => ({ ok: false, error: String(e).slice(0, 120) })); mark('interact-retry:' + id, { ok: r && r.ok, mode: r && r.mode, reason: r && r.reason }); }
  return r;
}


/** Hide Eleanor's timed-message toast / phone badge if one shows (3 s after briefing_played; see the dry run). Class names are probed, so this is broad and CSS-only. */
export const TOAST_CSS = '.person-chat-notification, .notification-container, .notification, [class*=toast], .phone-badge, .unread-badge{display:none !important}';

/** Click a DOM element by selector and visible text (the harness bridge cannot click DOM buttons). Returns true if a click was sent. */
export async function clickSel(page, sel, re) {
  const box = await page.evaluate(([s, src]) => { const e = [...document.querySelectorAll(s)].find(x => x.offsetParent !== null && new RegExp(src, 'i').test(x.textContent || '')); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, [sel, re.source]);
  if (!box) return false; await page.mouse.move(box.x, box.y, { steps: 8 }); await sleep(120); await page.mouse.click(box.x, box.y); return true;
}

/** Wait for a selector to be visible (polls 100 ms). */
export async function waitSel(page, sel, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate((s) => [...document.querySelectorAll(s)].some(e => e.offsetParent !== null), sel).catch(() => false)) return true; await sleep(100); } return false; }

/** Global values for the proof marks. */
export const globals = async (bridge, names) => { const g = (await bridge.getState()).globals || {}; const o = {}; for (const n of names) o[n] = g[n]; return o; };

/** Scan the page's visible text for words that must never be in a frame; returns the hits. */
export const BAD_WORDS = /\b(SIS|ESD|Ofgem|NCSC|NESO|Containment logged|cable|PIN|playtest|SAFETYNET|Cyber Aware|Break Escape|Likely Breach|Remediation Outstanding)\b/i;
export const textHits = (page) => page.evaluate((src) => { const t = document.body.innerText || ''; const hits = []; for (const m of t.matchAll(new RegExp(src, 'gi'))) hits.push(m[0]); return [...new Set(hits)]; }, BAD_WORDS.source);

/** Eleanor's timed-text watcher: injects TOAST_CSS and samples (every 300 ms for `ms`) every element that TOAST_CSS would hide and that has text or is visible.
 *  Marks 'toast-seen' once per distinct text (a toast that CSS hides still shows up here, since the sample ignores display), and 'toast-watch-end' with the count. */
export function watchToasts(page, mark, ms = 12000) {
  const run = async () => {
    await page.addStyleTag({ content: TOAST_CSS }).catch(() => {});
    const seen = new Set(); const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const rows = await page.evaluate(() => [...document.querySelectorAll('.person-chat-notification, .notification-container .notification, .notification, [class*=toast], .phone-badge, .unread-badge')]
        .map(e => ({ c: String(e.className).slice(0, 60), t: (e.textContent || '').trim().slice(0, 100) })).filter(r => r.t)).catch(() => []);
      for (const r of rows) { const k = r.c + '|' + r.t; if (!seen.has(k)) { seen.add(k); mark('toast-seen', r); } }
      await sleep(300);
    }
    mark('toast-watch-end', { distinct: seen.size });
  };
  return run();
}

/** The capture's own --hide-hud CSS (capture/launch.mjs). Takes that must run WITHOUT --hide-hud (the phone opens from the inventory tray) inject this after the panel opens. */
export { HUD_CSS } from '../../capture/launch.mjs';

/** Hide every visible element inside `root` whose own text matches BAD_WORDS (li, tr, p, div leaf rows). Returns the hidden texts. Used by the FDP take. */
export const hideBadRows = (page, rootSel, rowSel) => page.evaluate(([root, rows, src]) => {
  const re = new RegExp(src, 'i'); const out = []; const r = document.querySelector(root); if (!r) return out;
  r.querySelectorAll(rows).forEach(e => { if (re.test(e.textContent || '')) { e.style.setProperty('display', 'none', 'important'); out.push((e.textContent || '').trim().slice(0, 90)); } });
  return out; }, [rootSel, rowSel, BAD_WORDS.source]);

/** Screen rect (page px) of a world object by id, from its sprite bounds and the camera (for the closed-object crops: the edit crops to it). Null if not found. */
export const objScreenRect = (page, id) => page.evaluate((oid) => {
  try {
    const sc = window.game; const pg = sc.sys.game; const cam = sc.cameras.main; const cv = pg.canvas.getBoundingClientRect(); const k = cv.width / pg.config.width;
    let o = null; for (const r of Object.values(window.rooms || {})) { for (const [k2, v] of Object.entries(r.objects || {})) { if (k2 === oid || (v.scenarioId === oid) || (v.objectId === oid) || (v.scenarioData && v.scenarioData.id === oid)) { o = v; break; } } if (o) break; }
    if (!o) return null; const b = o.getBounds();
    return { x: Math.round(cv.x + (b.x - cam.worldView.x) * cam.zoom * k), y: Math.round(cv.y + (b.y - cam.worldView.y) * cam.zoom * k), w: Math.round(b.width * cam.zoom * k), h: Math.round(b.height * cam.zoom * k), zoom: cam.zoom };
  } catch (e) { return { err: String(e).slice(0, 100) }; }
}, id);
