// R2: passes the selfClose argument through (the R1 probe dropped it, so every close ran as selfClose=false) and records it.
// Item 10 probe: per ringer call, the time of the last typed line, of _completeRingerCallWithBeat, of complete(),
// whether a clip was playing at the beat, and the minigame closing. Times are performance.now() in ms.
window.__beat = [];
if (window.__beatIv) clearInterval(window.__beatIv);
let seen = null, lastText = null;
window.__beatIv = setInterval(() => {
  const m = window.MinigameFramework && window.MinigameFramework.currentMinigame;
  const t = Math.round(performance.now());
  if (m && m.params && m.params.ringerCall && m !== seen) {
    seen = m; const rec = { npc: m.params.npcId || null, theme: m.params.theme || null, forced: !!m.params.disableClose, openedAt: t, lines: [] };
    window.__beat.push(rec); m.__rec = rec;
    const beat = m._completeRingerCallWithBeat.bind(m);
    m._completeRingerCallWithBeat = function (...args) { rec.beatAt = Math.round(performance.now()); rec.selfClose = args[0]; rec.clipPlayingAtBeat = !!(this._callVoice && this._callVoice.tts && this._callVoice.tts.isPlaying && this._callVoice.tts.isPlaying()); rec.lastLineAtBeat = lastText; if (window.__onBeat) { try { window.__onBeat(rec); } catch (e) {} } return beat(...args); };
    const comp = m.complete.bind(m);
    m.complete = function (s) { if (!rec.completeAt) rec.completeAt = Math.round(performance.now()); return comp(s); };
  }
  if (seen && seen.__rec) {
    const els = [...document.querySelectorAll('.message-text')].map(e => e.innerText.trim()).filter(Boolean);
    const last = els[els.length - 1] || null;
    if (last !== lastText) { lastText = last; seen.__rec.lines.push({ t, text: (last || '').slice(0, 70) }); }
    const c = window.phoneRinger && window.phoneRinger.current && window.phoneRinger.current(); if (seen.__rec.beatAt && c && c.state === 'ringing' && !seen.__rec.nextRingAt) seen.__rec.nextRingAt = t;
    if (m !== seen && !seen.__rec.goneAt) { seen.__rec.goneAt = t; seen.__rec.visibleAtGone = lastText; }
  }
}, 50);
return true;
