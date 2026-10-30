#!/usr/bin/env node
// make-srt.mjs <edit.json> <out.srt> [--takes-dir DIR]
// Captions from dialogue shots' line marks. Line times are take-relative seconds (same clock as source.in/out),
// from shot.lines[] in the edit list, or, when none, from <take>.trimmed.markers.json / .markers.json events
// labelled like "line-start"/"line-end" (data: {speaker, text}). Lines are clipped to the shot's in/out span and mapped to the timeline.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { buildTimeline } from '../src/timeline.js';
const here = path.dirname(fileURLToPath(import.meta.url)); const repo = path.resolve(here, '../../../..');
const a = process.argv.slice(2); const [editFile, out] = a;
const ti = a.indexOf('--takes-dir'); const takesDir = ti >= 0 ? a[ti + 1] : path.join(repo, 'video_out/m01/takes');
const edit = JSON.parse(fs.readFileSync(editFile, 'utf8')); const tl = buildTimeline(edit);
const ts = (t) => { const ms = Math.round(t * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
function linesFromMarkers(s) {
  const base = s.source.file.replace(/\.trimmed\.mkv$/, '');
  for (const f of [`${base}.trimmed.markers.json`, `${base}.markers.json`]) {
    const p = path.join(takesDir, f); if (!fs.existsSync(p)) continue;
    const mk = JSON.parse(fs.readFileSync(p, 'utf8')); const ev = [...(mk.markers || []), ...(mk.events || [])];
    const res = []; let open = null;
    for (const e of ev) {
      const label = String(e.label || e.type || ''); const t = (e.tMs ?? e.t * 1000) / 1000;
      if (/line.?(start|begin)/i.test(label)) open = { start: t, speaker: e.data?.speaker, text: e.data?.text };
      else if (/line.?end/i.test(label) && open) { res.push({ ...open, end: t }); open = null; }
    }
    if (res.length) return res;
  }
  return [];
}
const cues = [];
for (const s of tl.shots) {
  if (!s.dialogue) continue;
  const lines = s.lines?.length ? s.lines : linesFromMarkers(s);
  const inT = s.source?.in ?? 0;
  for (const l of lines) {
    // shot.lines times are relative to the shot's in point (start/end), markers are take-absolute (start/end minus in)
    const rel0 = s.lines?.length ? l.start : l.start - inT, rel1 = s.lines?.length ? l.end : l.end - inT;
    const t0 = s.startSec + Math.max(-(s.audio?.pre ?? 0), rel0), t1 = s.startSec + Math.min(s.duration, rel1);
    if (t1 > t0) cues.push({ t0, t1, text: (l.speaker ? `${l.speaker}: ` : '') + l.text });
  }
}
fs.writeFileSync(out, cues.map((c, i) => `${i + 1}\n${ts(c.t0)} --> ${ts(c.t1)}\n${c.text}\n`).join('\n'));
console.error(`srt: ${cues.length} cue(s) -> ${out}`);
