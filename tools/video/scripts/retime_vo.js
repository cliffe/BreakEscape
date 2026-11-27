// Retime the edit's vo cues to real narrator clip lengths; grow shots that are too short.
const fs = require('fs'); const { execSync } = require('child_process');
const [f, voDir, takes] = process.argv.slice(2);
const e = JSON.parse(fs.readFileSync(f, 'utf8'));
const len = (p) => parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${p}"`).toString());
const dur = (s) => s.duration ?? (s.preset === 'ca-open' ? 3.1 : 3);
let t = 0; const st = {}; for (const s of e.shots) { st[s.id] = t; t += dur(s); }
const ownerOf = (v) => { let id = null; for (const s of e.shots) if (v.start >= st[s.id] - 1e-6) id = s.id; return id; };
const groups = {}; for (const v of e.vo) (groups[ownerOf(v)] ||= []).push(v);
const GAP = 0.25, TAIL = 0.3;
for (const s of e.shots) {
  const g = groups[s.id]; if (!g) continue;
  let cur = g[0].start - st[s.id];
  for (const v of g) { v.file = `${voDir}/${v.id}.mp3`; v._off = cur; v._len = len(v.file); cur += v._len + GAP; }
  const need = +(cur - GAP + TAIL).toFixed(2);
  if (need > dur(s) + 1e-6) {
    const ext = +(need - dur(s)).toFixed(2);
    if (s.source) {
      const fl = len(`${takes}/${s.source.file}`);
      const room = fl - s.source.out;
      const outExt = Math.min(ext, Math.max(0, room - 0.05));
      s.source.out = +(s.source.out + outExt).toFixed(2);
      s.source.in = +(s.source.in - (ext - outExt)).toFixed(2);
      console.log(`extend ${s.id} +${ext}s (out +${outExt.toFixed(2)}, in -${(ext - outExt).toFixed(2)}) -> ${s.source.in}-${s.source.out}`);
      if (s.lines) for (const l of s.lines) { l.start = +(l.start + (ext - outExt)).toFixed(2); l.end = +(l.end + (ext - outExt)).toFixed(2); }
    } else console.log(`extend ${s.id} +${ext}s (card/preset)`);
    s.duration = need;
  }
}
t = 0; for (const s of e.shots) { st[s.id] = t; t += dur(s); }
for (const s of e.shots) for (const v of groups[s.id] || []) { v.start = +(st[s.id] + v._off).toFixed(2); v.end = +(v.start + v._len).toFixed(2); delete v._off; delete v._len; }
e.length = +t.toFixed(2);
e.title = e.title.replace(/retime pending.*\)/, 'voiced: Sulafat)');
fs.writeFileSync(f, JSON.stringify(e, null, 1) + '\n');
console.log('length', e.length);
for (const s of e.shots) console.log(s.id, st[s.id].toFixed(2), dur(s));
