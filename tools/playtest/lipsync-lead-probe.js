// Lip-sync lead probe. An eval function for the playtest harness: install it on a game page
// before a voiced person-chat line, then read window.__lipScore(). For every rendered frame
// while TTS plays it records the clip position and the viseme column the portrait chose,
// and scores which lookup offset (ms ahead of audio.currentTime) best explains the columns.
// With the output-latency lead the best offset is the reported lead; before it, 0.
// Usage (test_needs_sims has cached voices and viseme sheets):
//   python3 -c "import json;print(json.dumps({'cmd':'eval','fn':open('tools/playtest/lipsync-lead-probe.js').read()}))" > /tmp/p.json
//   tools/playtest/cmd.sh <id> "$(cat /tmp/p.json)"
//   ... play a line (converse stops at a choice; mg chooseIndex lets the next line play out) ...
//   tools/playtest/cmd.sh <id> '{"cmd":"eval","fn":"() => window.__lipScore()"}'
// Measured 2026-11-21, game 11164 (Marek, headless Chromium: baseLatency 0.0107 s,
// outputLatency 0.04 s, lead 51 ms): 313 of 319 frames match the timeline at +51 ms, 229 at 0.
// A line whose decode was still running showed the level-follow shape for one frame.
() => {
  window.__lip2 = [];
  const step = () => {
    const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame;
    const pr = mg && mg.ui && mg.ui.portraitRenderer;
    const tts = pr && pr.ttsManager;
    if (tts && tts.isPlaying() && tts.currentText && pr.visemeSheet) {
      let line = window.__lip2[window.__lip2.length - 1];
      if (!line || line.full !== tts.currentText) { line = { full: tts.currentText, lead: tts.lipSyncLeadMs(), frames: [] }; window.__lip2.push(line); }
      const col = pr._getCurrentVisemeColumn();
      const tl = tts.lipSync && tts.lipSync.text === tts.currentText ? tts.lipSync.timeline : null;
      line.frames.push({ t: tts.audio.currentTime * 1000, col, pend: tts.lipSyncPending === tts.currentText, tl: !!tl });
      if (tl) line.tl = tl;
      line.cf = pr.visemeSheet.columnFor;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  window.__lipScore = () => window.__lip2.map(l => {
    const at = (ms) => { let t = 0; for (const s of l.tl || []) { t += s.duration; if (ms < t) return s.viseme; } return 'rest'; };
    const rb = new Set([l.cf.rest, l.cf.blink]);
    const same = (f, ms) => { const want = l.cf[at(ms)] ?? l.cf.rest; return f.col === want || (rb.has(f.col) && rb.has(want)); };
    const fr = l.frames.filter(f => f.tl);
    const score = d => fr.filter(f => same(f, f.t + d)).length;
    const offsets = [-40, -20, 0, 20, 40, 51, 60, 80];
    return { text: l.full.slice(0, 40), lead: l.lead, frames: l.frames.length, pending: l.frames.filter(f => f.pend).length, aligned: fr.length, matchByOffsetMs: Object.fromEntries(offsets.map(d => [d, score(d)])) };
  });
  return { ok: true };
}
