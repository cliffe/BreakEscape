#!/usr/bin/env node
// mix-audio.mjs <edit.json> <out.wav> [--takes-dir DIR] [--dry]
// Builds the teaser's audio with ffmpeg from the edit list:
//   music window (fade in/out, gain) with a smooth duck of edit.duck.db under dialogue shots,
//   plus each gameplay shot's take audio at the shot's gain_db with edit.audio.fade_ms fades at both cut points.
// Shots whose take file does not exist yet (placeholders) contribute no take audio.
// Not part of the Remotion render: the render is silent; render.sh muxes this mix and runs loudnorm.
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
import { buildTimeline } from '../src/timeline.js';
const here = path.dirname(fileURLToPath(import.meta.url)); const repo = path.resolve(here, '../../../..');
const a = process.argv.slice(2); const [editFile, out] = a;
const ti = a.indexOf('--takes-dir'); const takesDir = ti >= 0 ? a[ti + 1] : path.join(repo, 'video_out/m01/takes');
const edit = JSON.parse(fs.readFileSync(editFile, 'utf8')); const tl = buildTimeline(edit);
const total = tl.totalFrames / tl.fps;
const m = edit.music; const musicFile = path.join(repo, 'public/break_escape/assets/music', m.track);
const fade = (edit.audio?.fade_ms ?? 8) / 1000;
const inputs = ['-ss', String(m.start), '-t', String(total + 0.05), '-i', musicFile]; let n = 1;
const parts = []; const mixIn = [];
// duck envelope: product of per-window dips with attack/release ramps
const duckK = Math.pow(10, (edit.duck?.db ?? -9) / 20), att = edit.duck?.attack ?? 0.12, rel = edit.duck?.release ?? 0.3;
// consecutive dialogue shots (e.g. a wide shot and its close-up) are one duck window, so the dips don't multiply at the cut
const duckWins = [];
for (const s of tl.shots) { if (!(s.type === 'gameplay' && s.audio?.duck_music)) continue; const l = duckWins[duckWins.length - 1]; if (l && Math.abs(l[1] - s.startSec) < 1e-6) l[1] = s.endSec; else duckWins.push([s.startSec, s.endSec]); }
const dips = duckWins.map(([t0, t1]) => {
  return `(1-${(1 - duckK).toFixed(5)}*min(clip((t-${(t0 - att).toFixed(4)})/${att},0,1),clip((${(t1 + rel).toFixed(4)}-t)/${rel},0,1)))`;
});
const duckExpr = dips.length ? dips.join('*') : '1';
const fo = m.fade_out ?? 0, fi = m.fade_in ?? 0;
let mf = `[0:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${total},asetpts=PTS-STARTPTS,volume=${m.gain_db ?? 0}dB`;
if (fi) mf += `,afade=t=in:d=${fi}`;
if (fo) mf += `,afade=t=out:st=${(total - fo).toFixed(3)}:d=${fo}`;
mf += `,volume='${duckExpr}':eval=frame[music]`;
parts.push(mf); mixIn.push('[music]');
const used = [];
for (const s of tl.shots) {
  // title/cta shots carry a Veo clip whose own sound is mixed (clip.audio.gain_db); the clip freezes on its last frame, so its audio is limited to the clip's length
  const isClipAudio = (s.type === 'title' || s.type === 'cta') && s.clip?.audio;
  if (!isClipAudio && (s.type !== 'gameplay' || !s.source?.file || s.source.type === 'clip')) continue; // clips (old-trailer placeholders) are silent
  const src0 = isClipAudio ? { file: s.clip.file, in: s.clip.in ?? 0 } : s.source;
  const f = isClipAudio ? path.join(repo, 'tools/video/assets/clips', src0.file) : path.join(takesDir, src0.file); if (!fs.existsSync(f)) continue;
  const has = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', f], { encoding: 'utf8' }).stdout.trim();
  if (!has) { console.error(`mix: ${s.id}: take has no audio stream`); continue; }
  const gdb = isClipAudio ? s.clip.audio.gain_db : s.audio.gain_db;
  inputs.push('-ss', String(src0.in), '-t', String(s.duration), '-i', f);
  const d = s.duration, ms = Math.round(s.startSec * 1000);
  parts.push(`[${n}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${d},asetpts=PTS-STARTPTS,volume=${gdb}dB,afade=t=in:d=${fade},afade=t=out:st=${(d - fade).toFixed(4)}:d=${fade},adelay=${ms}|${ms}[t${n}]`);
  mixIn.push(`[t${n}]`); used.push(s.id); n++;
}
parts.push(`${mixIn.join('')}amix=inputs=${mixIn.length}:normalize=0:duration=longest,atrim=0:${total},alimiter=limit=0.95[out]`);
const script = parts.join(';\n');
const sf = out + '.filter.txt'; fs.writeFileSync(sf, script);
console.error(`mix: music + ${used.length} take audio shot(s)${used.length ? ' (' + used.join(', ') + ')' : ''}`);
if (a.includes('--dry')) { console.log(script); process.exit(0); }
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex_script', sf, '-map', '[out]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', out], { stdio: 'inherit' });
process.exit(r.status ?? 1);
