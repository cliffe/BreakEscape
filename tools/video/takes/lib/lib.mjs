// Shared helpers for take scripts (any mission): voice-line watcher, dialogue pacing, HUD/minigame cleanup. Mission-specific gates and room names live in takes/<mission>/.
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Watches the person-chat / phone-chat voice playback in the page (TTSManager.playing edges, polled every 30 ms) and
 * writes mark('line-start:<text>') / mark('line-end:<text>') at the page's own clock. Returns
 * { lines, waitForLine(re, timeoutMs), stop() }. A line counts as voiced only if TTS playback really started.
 */
export async function watchVoice(page, mark) {
  await page.evaluate(() => {
    if (window.__voiceWatch) return;
    const ev = []; window.__voiceEvents = ev; let was = false, cur = null;
    const epoch = () => performance.timeOrigin + performance.now();
    window.__voiceWatch = setInterval(() => {
      try {
        const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame;
        const tts = mg && mg.ttsManager;
        const playing = !!(tts && tts.playing);
        if (playing && !was) {
          const d = mg.getTestState && mg.getTestState().dialogue;
          const lines = ((d && d.text) || (tts.currentText) || '').split('\n').filter(Boolean);
          cur = { text: (tts.currentText || lines[lines.length - 1] || '').trim(), speaker: d && d.speaker, start: epoch() };
          ev.push({ type: 'start', ...cur });
        } else if (!playing && was && cur) {
          ev.push({ type: 'end', text: cur.text, speaker: cur.speaker, start: cur.start, end: epoch(), durMs: Math.round(epoch() - cur.start) });
          cur = null;
        }
        was = playing;
      } catch (_) {}
    }, 30);
  });
  const lines = []; let seen = 0, alive = true;
  const drain = async () => {
    const evs = await page.evaluate(() => window.__voiceEvents ? window.__voiceEvents.slice() : []).catch(() => []);
    for (; seen < evs.length; seen++) {
      const e = evs[seen];
      if (e.type === 'start') mark('line-start:' + e.text, { speaker: e.speaker, text: e.text }, e.start);
      else { mark('line-end:' + e.text, { speaker: e.speaker, text: e.text, durMs: e.durMs }, e.end); lines.push(e); }
    }
  };
  const timer = setInterval(() => { if (alive) drain(); }, 150);
  return {
    lines,
    drain,
    async waitForLine(re, timeoutMs = 30000) {
      const t0 = Date.now();
      while (Date.now() - t0 < timeoutMs) { await drain(); const l = lines.find(x => re.test(x.text)); if (l) return l; await sleep(100); }
      return null;
    },
    async stop() { alive = false; clearInterval(timer); await drain(); },
  };
}

/** Close a stray minigame / dismiss blocking UI before the shot (head-start games open a Mission Brief notes minigame). */
export async function clearScreen(page, bridge, mark) {
  for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { mark('close-minigame'); await bridge.minigame.close().catch(() => {}); await sleep(800); }
  for (let i = 0; i < 4; i++) {
    const b = (await bridge.getState()).blockingUi; if (!b) break;
    const tut = /tutorial/i.test(b.classes + b.text);
    mark('dismiss-ui', { text: String(b.text).slice(0, 60), buttons: b.buttons.map(x => x.label) });
    await bridge.dismissBlockingUi(tut ? 'figure it out' : null).catch(() => {}); await sleep(800);
  }
}

/** Walk through waypoints [[x,y],...] with a short settle between legs. */
export async function walk(bridge, mark, pts, label = 'walk') {
  for (const [x, y] of pts) {
    mark(`${label}:move`, { x, y });
    const r = await bridge.moveTo(x, y, { timeoutMs: 15000 });
    mark(`${label}:arrived`, { x, y, ok: r && r.ok, reached: r && r.reachedTarget });
    await sleep(150);
  }
}

/** Marks 'lights-on:<room>' / 'lights-off:<room>' at the page clock when LightingSystem's room state flips. */
export async function watchLights(page, mark, roomId) {
  await page.evaluate((roomId) => {
    window.__lightEvents = []; let was = null;
    window.__lightWatch = setInterval(() => {
      const s = window.lightingSystem && window.lightingSystem.rooms.get(roomId);
      if (!s) return;
      if (was !== null && s.on !== was) window.__lightEvents.push({ on: s.on, t: performance.timeOrigin + performance.now() });
      was = s.on;
    }, 20);
  }, roomId);
  let seen = 0;
  const drain = async () => {
    const ev = await page.evaluate(() => window.__lightEvents.slice()).catch(() => []);
    for (; seen < ev.length; seen++) mark(`lights-${ev[seen].on ? 'on' : 'off'}:${roomId}`, null, ev[seen].t);
    return ev;
  };
  return { drain, async waitOn(timeoutMs = 10000) { const t0 = Date.now(); while (Date.now() - t0 < timeoutMs) { const ev = await drain(); if (ev.some(e => e.on)) return true; await sleep(100); } return false; } };
}

/** Wait for the dialogue to offer choices (auto-advancing voiced lines come first). Returns the dialogue block or null. */
export async function awaitChoice(bridge, timeoutMs = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { const d = (await bridge.getState()).dialogue; if (d && d.awaitingChoice) return d; await sleep(100); }
  return null;
}
/** awaitChoice, then choose by regex (strict); throws with the on-screen choices if it fails. */
export async function pickChoice(bridge, re, timeoutMs = 60000) {
  const d = await awaitChoice(bridge, timeoutMs);
  if (!d) throw new Error('no choice appeared for ' + re);
  const r = await bridge.minigame.choose(re);
  if (!r || !r.ok) throw new Error('choose failed ' + JSON.stringify(r));
  return r;
}
