#!/usr/bin/env node
// loudnorm.mjs <in.wav> <out.wav> [I=-14] [TP=-1.5] [peak] : with `peak` (edit audio.peak_normalize, for silent bumpers whose clip sound is too quiet to reach -14 LUFS) the gain only brings the true peak to TP.
// Default: two-pass ffmpeg loudnorm (measure, then linear apply). Prints before/after.
import { spawnSync } from 'node:child_process';
const [inp, out, I = '-14', TP = '-1.5', mode = ''] = process.argv.slice(2); const LRA = '11';
if (mode === 'peak') {
  const q = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', inp, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; const t = q.slice(q.lastIndexOf('Summary'));
  const pk = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(t)[1]); const g = Number(TP) - pk;
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-y', '-i', inp, '-af', `volume=${g}dB`, '-ar', '48000', '-c:a', 'pcm_s16le', out], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
  console.log(`peak normalise: ${g.toFixed(2)} dB gain, true peak ${pk} -> ${TP} dBTP (no LUFS target)`); process.exit(0);
}
const p1 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', inp, '-af', `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
const m = /\{[\s\S]*?\}/.exec(p1.stderr); if (!m) { console.error(p1.stderr); process.exit(1); }
const j = JSON.parse(m[0]);
console.log(`loudnorm pass 1: ${j.input_i} LUFS, TP ${j.input_tp} dB, LRA ${j.input_lra}`);
const af = `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true:print_format=summary`;
const p2 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-y', '-i', inp, '-af', af, '-ar', '48000', '-c:a', 'pcm_s16le', out], { encoding: 'utf8' });
if (p2.status !== 0) { console.error(p2.stderr); process.exit(1); }
const chk = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', out, '-af', `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
const c = JSON.parse(/\{[\s\S]*?\}/.exec(chk.stderr)[0]);
console.log(`loudnorm result: ${c.input_i} LUFS, TP ${c.input_tp} dB (target ${I} / ${TP})`);
// Short clips (bumpers, under 20 s): loudnorm's own measurement is unreliable there (it read -14.06 where an EBU R128 measurement gave -12.3).
// Re-measure with ebur128 and, if off by more than 0.2 LU, redo it as plain gain steps with a true-peak limiter, re-measuring each time.
// Longer videos (the 60 s trailers) never reach this code, so their output is unchanged.
const ebur = (f) => { const q = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; const t = q.slice(q.lastIndexOf('Summary')); return { i: Number(/I:\s+(-?[\d.]+) LUFS/.exec(t)[1]), tp: Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(t)[1]) }; };
const dur = Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', inp], { encoding: 'utf8' }).stdout);
if (dur < 20) {
  let m0 = ebur(out);
  if (Math.abs(m0.i - Number(I)) > 0.2 || m0.tp > Number(TP) + 0.05) {
    console.log(`ebur128 reads ${m0.i} LUFS, TP ${m0.tp} on a ${dur.toFixed(1)} s clip: using gain steps with a limiter`);
    const lim = Math.pow(10, Number(TP) / 20); let g = Number(I) - ebur(inp).i;
    for (let k = 0; k < 8; k++) {
      const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-y', '-i', inp, '-af', `volume=${g}dB,alimiter=limit=${lim.toFixed(4)}:level=disabled:attack=1:release=50`, '-ar', '48000', '-c:a', 'pcm_s16le', out], { encoding: 'utf8' });
      if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
      m0 = ebur(out); console.log(`  step ${k}: ${m0.i} LUFS, TP ${m0.tp} dB`);
      if (Math.abs(m0.i - Number(I)) <= 0.1) break; g += Number(I) - m0.i;
    }
  }
}
