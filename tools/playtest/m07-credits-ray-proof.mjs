// m07: the credits Ray line for an evaded guard, with and without the handover sheet read.
// usage: node m07-credits-ray-proof.mjs <gid> <port>
import { open, ev } from './m01-ol-lib.mjs';
const [gid, port = '3214'] = process.argv.slice(2);
const h = await open(gid, port);
await h.t(2500);
const out = await ev(h, async () => {
  const m = await import('/break_escape/js/music/closing-sequence.js');
  const g = window.gameState.globalVariables;
  const test = (c) => { try { return !!new Function('globalVars', `return (${c});`)(g); } catch (e) { return false; } };
  const r = m.replayEndingEntry(window.gameScenario.music?.events, g, (c) => test(c));
  const seq = r ? r.sequence : [];
  return { found: !!r, renewal: g.renewal_signoff_read, resolved: g.hollis_resolved,
    ray: seq.map(s => s.text).filter(t => /RAY HOLLIS/.test(t)) };
});
console.log(gid, JSON.stringify(out));
console.log('errs', JSON.stringify(h.errs.filter(e => !/503|tts/i.test(e))));
await h.browser.close();
