// Voice FX A/B render (Ghost's voice-distortion preset). An eval function for the playtest
// harness: on any test_voice_fx game page it fetches Ghost's cached clip, renders it offline
// three ways (no FX, the old preset, the current preset) through the real _buildFXChain, and
// returns the length of each render plus median pitch and spectral centroid. The WAVs are left
// in window.__fxWav ({dry, before, after}, base64) for saving and listening.
// Usage:
//   python3 -c "import json;print(json.dumps({'cmd':'eval','fn':open('tools/playtest/voice-fx-render.js').read()}))" > /tmp/r.json
//   tools/playtest/cmd.sh <id> "$(cat /tmp/r.json)"
//   tools/playtest/cmd.sh <id> '{"cmd":"eval","fn":"() => window.__fxWav.after"}'   # base64 WAV
// Measured on 2026-11-21 (game 11142): every render 8.24 s, the clip's own length. Energy at
// 40-90 Hz (the sub-octave): dry 4.5%, old preset 0.2%, new preset 12.2%. Energy at 3.4-5 kHz
// (the drive's grit): old 4.2%, new 2.0%.
async () => {
  const mod = await import('/break_escape/js/systems/tts-manager.js?v=fxproof');
  const TTSManager = mod.default;
  const res = await fetch(location.pathname.replace(/\/$/, '') + '/tts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': (document.querySelector('meta[name=csrf-token]') || {}).content }, body: JSON.stringify({ npc_id: 'ghost', text: "Then you'll do it the long way, and you already know what the long way costs, because you've been standing in it all night." }) });
  const bytes = await res.arrayBuffer();
  const sr = 48000;
  const decoded = await new OfflineAudioContext(1, sr, sr).decodeAudioData(bytes.slice(0));
  const render = async (profile) => {
    const ctx = new OfflineAudioContext(1, decoded.length, sr);
    const src = ctx.createBufferSource(); src.buffer = decoded;
    let tail = src;
    if (profile) { const chain = TTSManager.prototype._buildFXChain.call({ _makeDistortionCurve: TTSManager.prototype._makeDistortionCurve, _buildPitchShift: TTSManager.prototype._buildPitchShift }, ctx, profile); src.connect(chain.input); tail = chain.output; }
    tail.connect(ctx.destination); src.start(0);
    return (await ctx.startRendering()).getChannelData(0);
  };
  const stats = (x) => {
    const win = 4096, f0 = [], cent = [];
    for (let s = 0; s + win < x.length; s += 2400) {
      let rms = 0; for (let i = 0; i < win; i++) rms += x[s + i] ** 2; rms = Math.sqrt(rms / win);
      if (rms < 0.02) continue;
      let best = 0, lag = 0;
      for (let L = Math.floor(sr / 400); L <= Math.floor(sr / 40); L++) { let c = 0; for (let i = 0; i < win - L; i++) c += x[s + i] * x[s + i + L]; if (c > best) { best = c; lag = L; } }
      if (lag) f0.push(sr / lag);
      // zero-crossing-free centroid via a coarse DFT at 64 bands up to 8 kHz
      let num = 0, den = 0;
      for (let b = 1; b <= 64; b++) { const f = b * 125; let re = 0, im = 0; for (let i = 0; i < win; i += 2) { const ph = 2 * Math.PI * f * i / sr; re += x[s + i] * Math.cos(ph); im += x[s + i] * Math.sin(ph); } const m = Math.hypot(re, im); num += m * f; den += m; }
      cent.push(num / den);
    }
    const med = a => { const b = [...a].sort((p, q) => p - q); return Math.round(b[Math.floor(b.length / 2)]); };
    return { frames: f0.length, f0Median: med(f0), centroidMedian: med(cent) };
  };
  const wav = (x) => {
    const n = x.length, buf = new DataView(new ArrayBuffer(44 + n * 2));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) buf.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); buf.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); buf.setUint32(16, 16, true); buf.setUint16(20, 1, true); buf.setUint16(22, 1, true); buf.setUint32(24, sr, true); buf.setUint32(28, sr * 2, true); buf.setUint16(32, 2, true); buf.setUint16(34, 16, true); w(36, 'data'); buf.setUint32(40, n * 2, true);
    let peak = 0; for (const v of x) peak = Math.max(peak, Math.abs(v));
    const g = peak > 0.98 ? 0.98 / peak : 1;
    for (let i = 0; i < n; i++) buf.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x[i] * g)) * 32767, true);
    let bin = ''; const u = new Uint8Array(buf.buffer); for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  const old = { highpass: 220, lowpass: 3400, drive: 6, ringMod: { frequency: 75, mix: 0.10 }, makeup: 1.6 };
  const dry = await render(null), before = await render(old), after = await render(TTSManager.VOICE_FX_PRESETS['voice-distortion']);
  window.__fxWav = { dry: wav(dry), before: wav(before), after: wav(after) };
  return { status: res.status, seconds: { clip: decoded.duration, dry: dry.length / sr, before: before.length / sr, after: after.length / sr }, dry: stats(dry), before: stats(before), after: stats(after) };
}
