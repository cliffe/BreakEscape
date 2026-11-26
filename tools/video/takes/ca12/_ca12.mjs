// Shared helpers for the ca12 (Visitors and tailgating) take scripts. Mission-specific: the kiosk, the Resume and tutorial
// gates, the button-driven kiosk panels, bubble marks. Generic helpers stay in ../lib/. Every helper here drives the real UI
// (bridge or DOM clicks on the real buttons); nothing sets a global except the entry-state flags new-game.rb was given.
import { sleep } from '../lib/lib.mjs';
export { sleep };

/** Visible button labels (the kiosk panels, the OSINT browser, the pretext card and the triage are all DOM buttons). */
export const buttons = (page) => page.$$eval('button', bs => bs.filter(b => b.offsetParent).map(b => b.innerText.trim()).filter(Boolean));

/** Click the first visible button whose text matches `re`; returns its label or null. */
export const clickText = (page, re) => page.evaluate(([src, fl]) => {
  const r = new RegExp(src, fl);
  const b = [...document.querySelectorAll('button')].filter(x => x.offsetParent && r.test(x.innerText.trim()))[0];
  if (!b) return null; b.click(); return b.innerText.trim();
}, [re.source, re.flags]);

/** Wait until a visible button matches `re` (returns its label) or time out (returns null). */
export async function waitButton(page, re, timeoutMs = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { const bs = await buttons(page); const b = bs.find(x => re.test(x)); if (b) return b; await sleep(150); }
  return null;
}

/** Click a button once it is visible; throws with the labels on screen if it never shows. */
export async function pressButton(page, re, timeoutMs = 15000) {
  const l = await waitButton(page, re, timeoutMs);
  if (!l) throw new Error('button ' + re + ' never showed; on screen: ' + JSON.stringify((await buttons(page)).slice(0, 12)));
  await clickText(page, re); return l;
}

/** Before recording: after a reload press Resume, then Skip tutorial, close the Mission Brief notes and the phone ringer.
 *  (clearScreen in lib.mjs also closes the ringer, but does not know the Resume gate.) */
export async function prepare(page, bridge, mark = () => {}) {
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => { try { window.phoneRinger?.close?.(); } catch (_) {} }).catch(() => {});
    const s = await bridge.getState();
    if (s.blockingUi && s.blockingUi.buttons.some(b => /^Resume$/.test(b.label))) { mark('resume'); await bridge.dismissBlockingUi('Resume'); await sleep(2500); continue; }
    if (s.blockingUi) {
      const tut = /tutorial/i.test((s.blockingUi.classes || '') + s.blockingUi.text);
      mark('dismiss-ui', { text: String(s.blockingUi.text).slice(0, 50) });
      await bridge.dismissBlockingUi(tut ? 'figure it out' : null).catch(() => {}); await sleep(800); continue;
    }
    if (s.activeMinigame && /Notes|Title/i.test(String(s.activeMinigame.type || s.activeMinigame.id || ''))) { mark('close-brief'); await bridge.minigame.close().catch(() => {}); await sleep(800); continue; }
    if (i >= 1 && !s.activeMinigame) break;
    await sleep(500);
  }
  await sleep(300);
}

/** interact(id) up to 3 times (the first is often swallowed) until a minigame or dialogue opens. */
export async function interactRetry(bridge, id, mark = () => {}, tries = 3, { acceptBlockingUi = false } = {}) {
  for (let i = 0; i < tries; i++) {
    const r = await bridge.interact(id, { timeoutMs: 15000 }).catch(e => ({ ok: false, reason: String(e).slice(0, 80) }));
    await sleep(1200);
    const s = await bridge.getState();
    mark('interact:' + id, { attempt: i, ok: r && r.ok, reason: r && r.reason });
    // A confirm_action dialog (e.g. the ca12 kit bag's "Put the hi-vis on?") shows as blockingUi, not a minigame.
    if (s.activeMinigame || s.dialogue || (acceptBlockingUi && s.blockingUi)) return s;
    await sleep(800);
  }
  throw new Error('interact ' + id + ' opened nothing after ' + tries + ' tries');
}

/** Open the training kiosk (Merrin & Sallow panel). Returns the buttons now on screen. */
export async function openKiosk(page, bridge, mark = () => {}) {
  await interactRetry(bridge, 'training_kiosk', mark);
  await sleep(600);
  return buttons(page);
}

/** Marks 'bubble-start:<npc>: <text>' and 'bubble-end:<npc>' from the world speech bubbles (ambient barks). The cut points for
 *  A1, A3, A4, A5 are these marks (picture clock), plus the audio the game plays with the bubble. Returns { stop(), seen }. */
export async function watchBubbles(page, mark) {
  await page.evaluate(() => {
    if (window.__bubbleWatch) return;
    const ev = []; window.__bubbleEvents = ev; const open = new Map();
    const epoch = () => performance.timeOrigin + performance.now();
    window.__bubbleWatch = setInterval(() => {
      try {
        const says = window.npcWorldBubbles && window.npcWorldBubbles.says; if (!says) return;
        for (const [id, st] of says) {
          const text = (st.pages && st.pages.join(' ')) || '';
          if (!open.has(id) || open.get(id).text !== text) { if (open.has(id)) ev.push({ type: 'end', id, text: open.get(id).text, t: epoch() }); open.set(id, { text }); ev.push({ type: 'start', id, text, t: epoch() }); }
        }
        for (const id of [...open.keys()]) if (!says.has(id)) { ev.push({ type: 'end', id, text: open.get(id).text, t: epoch() }); open.delete(id); }
      } catch (_) {}
    }, 50);
  });
  let n = 0; const seen = []; let alive = true;
  const drain = async () => {
    const evs = await page.evaluate(() => window.__bubbleEvents ? window.__bubbleEvents.slice() : []).catch(() => []);
    for (; n < evs.length; n++) { const e = evs[n]; mark(`bubble-${e.type}:${e.id}`, { text: e.text }, e.t); if (e.type === 'start') seen.push(e); }
  };
  const timer = setInterval(() => { if (alive) drain(); }, 200);
  return { seen, drain, async stop() { alive = false; clearInterval(timer); await drain(); } };
}

/** First frame where the NPC's portrait is up: the player's own portrait (save name "playtest") shows first. Returns the dialogue
 *  block once its speaker is not the player. Marks 'frame:npc-portrait-up' (the dry-run screenshot and the editor's cut-in point). */
export async function waitNpcPortrait(page, bridge, mark, npcRe, timeoutMs = 20000) {
  const t0 = Date.now(); let last = null;
  while (Date.now() - t0 < timeoutMs) {
    const d = (await bridge.getState()).dialogue; last = d;
    const portraitUp = await page.evaluate((src) => {
      const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame; if (!mg) return null;
      const el = mg.container || document;
      const names = [...el.querySelectorAll('.person-chat-speaker-name, .speaker-name, [class*=speaker]')].filter(e => e.offsetParent).map(e => e.innerText.trim());
      return names.join('|') || null;
    }, npcRe.source).catch(() => null);
    if (d && d.speaker && npcRe.test(String(d.speaker))) { mark('frame:npc-portrait-up', { speaker: d.speaker, portraitUp }); return d; }
    await sleep(100);
  }
  throw new Error('NPC portrait never up (speaker ' + JSON.stringify(last && last.speaker) + ')');
}
