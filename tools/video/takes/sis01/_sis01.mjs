// Shared helpers for the sis01 (Northgate General: Code Black) take scripts. Generic helpers come from ../lib/lib.mjs and ../lib/dlg.mjs.
// Nothing here sets a game global: every action is a real click or a bridge interact; entry states are --set seeds passed to new-game.sh
// (--set fires no events). Every take needs a FRESH game (the Bed 4 / ICO timers run from game start, and a used game skips the cutscene).
import { sleep, watchVoice, clearScreen, awaitChoice, pickChoice, walk } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
import { checkSprite } from '../ca13/_ca13.mjs';
export { sleep, watchVoice, clearScreen, awaitChoice, pickChoice, walk, runDialogue };

export const SCENARIO = 'sis01_healthcare';
/** Entry-state flags for run-take.sh / new-game.sh. */
export const SEEDS = {
  skipBrief: '--set briefing_played=true',
  ward: '--set briefing_played=true',
  charts: '--set briefing_played=true --set paper_charts_collected=true',
  itoffice: '--start-room it_security_office --set briefing_played=true',
  incident: '--start-room major_incident_room --set briefing_played=true',
  checker: '--set briefing_played=true --set manufacturer_datasheet_available=true --set paper_charts_collected=true',
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
  const nb = window.npcWorldBubbles; if (!nb || nb.__sis01hidden) return !!nb;
  const patch = (bb) => { const b = bb && bb.box; if (!b || b.__sis01) return bb; b.__sis01 = true; b.setVisible = function () { this.visible = false; return this; }; b.setAlpha = function () { this.alpha = 0; return this; }; b.visible = false; b.alpha = 0; return bb; };
  const make = nb._make; nb._make = function (...a) { return patch(make.apply(this, a)); };
  for (const bb of nb.bubbles.values()) patch(bb);
  nb.__sis01hidden = true; return true;
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
