#!/usr/bin/env node
/**
 * check-take.mjs <take.mkv> [--out trimmed.mkv] [--threshold 33] [--no-trim] [--no-correct]
 * Finds the start and end slates (white frames in picture, 1 kHz tone in sound), reports the A/V
 * offset at each end (positive = audio late), duplicated/dropped frames, and writes a copy trimmed
 * between the slates (audio shifted by the start-slate offset unless --no-correct).
 * --video-only: title-screen takes, whose start slate has no tone: trims on the two picture slates, no offset check.
 * Also writes <base>.contact.jpg: a contact sheet of the trimmed take (1 frame per second, tiled 6 across, 320 px wide tiles, time-labelled).
 * Exit 0 = pass (offset < threshold ms at both ends and drops+dups < 1%).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const av = process.argv.slice(2);
const file = av.find(x => !x.startsWith('--') && fs.existsSync(x));
const opt = {};
for (let i = 0; i < av.length; i++) if (av[i].startsWith('--')) opt[av[i].slice(2)] = (av[i + 1] && !av[i + 1].startsWith('--')) ? av[++i] : true;
if (!file) { console.error('usage: check-take.mjs take.mkv [--out trimmed.mkv] [--threshold 33] [--no-trim]'); process.exit(2); }
const THRESH = Number(opt.threshold) || 33;
const base = file.replace(/\.mkv$/, '');
const run = (cmd, args, o = {}) => spawnSync(cmd, args, { maxBuffer: 1 << 30, ...o });

// ---- stream info ----
const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]).stdout.toString());
const vs = probe.streams.find(s => s.codec_type === 'video'), as = probe.streams.find(s => s.codec_type === 'audio');
if (!vs || !as) { console.error('missing video or audio stream'); process.exit(1); }
const vStart = Number(vs.start_time || 0), aStart = Number(as.start_time || 0);
const [fn, fd] = vs.avg_frame_rate.split('/').map(Number); const fps = fn / fd;

// ---- picture: per-frame mean luma ----
const vf = run('ffmpeg', ['-v', 'error', '-i', file, '-an', '-vf', 'scale=64:36,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-']).stdout.toString();
const frames = [];
{ let pts = null; for (const line of vf.split('\n')) { const m = /pts_time:([\d.]+)/.exec(line); if (m) pts = Number(m[1]); const y = /YAVG=([\d.]+)/.exec(line); if (y && pts !== null) { frames.push({ t: pts, y: Number(y[1]) }); pts = null; } } }
const white = frames.map(f => f.y > 225);
const vRuns = []; for (let i = 0; i < frames.length; i++) if (white[i]) { let j = i; while (j + 1 < frames.length && white[j + 1]) j++; vRuns.push({ start: frames[i].t, end: frames[j].t + 1 / fps, n: j - i + 1 }); i = j; }
const vSlates = vRuns.filter(r => r.n >= 1);

// ---- sound: 1 kHz Goertzel on 16 kHz mono ----
const SR = 16000;
const pcm = run('ffmpeg', ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(SR), '-f', 's16le', '-']).stdout;
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
const WIN = 80; // 5 ms
const coef = 2 * Math.cos(2 * Math.PI * 1000 / SR);
const tone = [];
for (let i = 0; i + WIN <= samples.length; i += WIN) {
  let s1 = 0, s2 = 0, e = 0;
  for (let k = 0; k < WIN; k++) { const x = samples[i + k] / 32768; const s0 = x + coef * s1 - s2; s2 = s1; s1 = s0; e += x * x; }
  const p = (s1 * s1 + s2 * s2 - coef * s1 * s2) / WIN;       // power at 1 kHz (x WIN/2 scaling)
  const rms = Math.sqrt(e / WIN);
  tone.push(rms > 0.02 && (2 * p) / (e + 1e-12) > 0.5 ? 1 : 0);
}
const aRuns = []; for (let i = 0; i < tone.length; i++) if (tone[i]) { let j = i; while (j + 1 < tone.length && tone[j + 1]) j++; if (j - i + 1 >= 8) aRuns.push({ start: aStart + i * WIN / SR, end: aStart + (j + 1) * WIN / SR }); i = j; }

const res = { file, fps, videoStart: vStart, audioStart: aStart, durationS: Number(probe.format.duration), videoSlates: vSlates, audioSlates: aRuns, pass: false, problems: [] };
if (vSlates.length < 2) res.problems.push(`found ${vSlates.length} picture slate(s), need 2`);
if (!opt['video-only'] && aRuns.length < 2) res.problems.push(`found ${aRuns.length} tone slate(s), need 2`);

// ---- frames: count vs expected, ffmpeg dup/drop from sidecar ----
const nb = frames.length;
const expected = Math.round((frames[frames.length - 1].t - frames[0].t) * fps) + 1;
let gaps = 0, maxGap = 0; for (let i = 1; i < nb; i++) { const d = frames[i].t - frames[i - 1].t; maxGap = Math.max(maxGap, d); if (d > 1.5 / fps) gaps += Math.round(d * fps) - 1; }
res.frames = { decoded: nb, expectedFromSpan: expected, missingFromPtsGaps: gaps, maxGapMs: Math.round(maxGap * 1000) };
let dup = null, drop = null;
if (fs.existsSync(base + '.markers.json')) { const m = JSON.parse(fs.readFileSync(base + '.markers.json', 'utf8')); dup = m.ffmpeg?.dup ?? null; drop = m.ffmpeg?.drop ?? null; res.ffmpegSidecar = { dup, drop, speedMin: m.ffmpeg?.speedMin, speedMean: m.ffmpeg?.speedMean }; }
const lost = (dup || 0) + (drop || 0) + gaps;
res.dropPct = +(100 * lost / nb).toFixed(2);

if (opt['video-only'] && vSlates.length >= 2) {
  const vs0 = vSlates[0], vs1 = vSlates[vSlates.length - 1];
  res.slateGapS = +(vs1.start - vs0.end).toFixed(2);
  res.offsetMode = 'video-only';
  res.pass = res.dropPct < 1;
  if (!opt['no-trim']) {
    const out = opt.out || base + '.trimmed.mkv';
    const t0 = vs0.end + 0.05, t1 = vs1.start - 0.05;
    const r = run('ffmpeg', ['-y', '-v', 'error', '-ss', String(t0), '-i', file, '-t', String(t1 - t0), '-map', '0:v', '-map', '0:a', '-c:v', 'libx264', '-crf', '14', '-preset', 'veryfast', '-pix_fmt', vs.pix_fmt, '-c:a', 'pcm_s16le', out]);
    res.trimmed = r.status === 0 ? { out, fromS: +t0.toFixed(3), toS: +t1.toFixed(3), audioShiftMs: 0 } : { error: r.stderr.toString().slice(-300) };
  }
} else if (vSlates.length >= 2 && aRuns.length >= 2) {
  const vs0 = vSlates[0], vs1 = vSlates[vSlates.length - 1], as0 = aRuns[0], as1 = aRuns[aRuns.length - 1];
  res.offsetStartMs = Math.round((as0.start - vs0.start) * 1000);
  res.offsetEndMs = Math.round((as1.start - vs1.start) * 1000);
  res.driftMs = res.offsetEndMs - res.offsetStartMs;
  res.offsetOkStart = Math.abs(res.offsetStartMs) < THRESH; res.offsetOkEnd = Math.abs(res.offsetEndMs) < THRESH;
  res.slateGapS = +(vs1.start - vs0.end).toFixed(2);
  // pass: both ends within the threshold, or a constant offset (drift under the threshold) that the trim corrects
  res.constantOffsetMs = Math.round((res.offsetStartMs + res.offsetEndMs) / 2);
  res.residualStartMs = res.offsetStartMs - res.constantOffsetMs; res.residualEndMs = res.offsetEndMs - res.constantOffsetMs;
  res.offsetMode = (res.offsetOkStart && res.offsetOkEnd) ? 'within-threshold' : (Math.abs(res.residualStartMs) < THRESH && Math.abs(res.residualEndMs) < THRESH ? 'constant-offset-corrected' : 'drifting');
  res.pass = res.offsetMode !== 'drifting' && res.dropPct < 1;
  if (!opt['no-trim']) {
    const out = opt.out || base + '.trimmed.mkv';
    const t0 = vs0.end + 0.05, t1 = vs1.start - 0.05;
    const corr = opt['no-correct'] ? 0 : res.constantOffsetMs / 1000;     // audio late by corr s: read audio from corr later
    const args = ['-y', '-v', 'error', '-ss', String(t0), '-i', file, '-ss', String(Math.max(0, t0 + corr)), '-i', file, '-t', String(t1 - t0),
      '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '14', '-preset', 'veryfast', '-pix_fmt', vs.pix_fmt, '-c:a', 'pcm_s16le', out];
    const r = run('ffmpeg', args); res.trimmed = r.status === 0 ? { out, fromS: +t0.toFixed(3), toS: +t1.toFixed(3), audioShiftMs: Math.round(corr * 1000) } : { error: r.stderr.toString().slice(-300) };
  }
}
// ---- markers re-timed to the trimmed file: trimmed_t = (slate-relative t) + slateStart - trimFrom ----
if (res.trimmed && res.trimmed.out && vSlates.length && fs.existsSync(base + '.markers.json')) {
  const m = JSON.parse(fs.readFileSync(base + '.markers.json', 'utf8'));
  const shift = vSlates[0].start - res.trimmed.fromS;       // seconds to add to a slate-relative time
  const f = (ms) => Math.round(ms + shift * 1000);
  const out = { trimmedFile: res.trimmed.out, shiftMs: Math.round(shift * 1000), durationS: +(res.trimmed.toS - res.trimmed.fromS).toFixed(2),
    markers: m.markers.map(x => ({ ...x, tMs: f(x.tMs) })), events: (m.events || []).map(x => ({ ...x, tMs: f(x.tMs) })) };
  fs.writeFileSync(base + '.trimmed.markers.json', JSON.stringify(out, null, 2));
  res.trimmedMarkers = base + '.trimmed.markers.json';
}
// ---- contact sheet of the trimmed take ----
if (res.trimmed && res.trimmed.out) {
  const d = Number(JSON.parse(run('ffprobe', ['-v', 'error', '-show_format', '-of', 'json', res.trimmed.out]).stdout.toString()).format.duration);
  const n = Math.max(1, Math.ceil(d)), cols = Math.min(6, n), rows = Math.ceil(n / cols);
  const font = ['/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'].find(f => fs.existsSync(f));
  const label = font ? `drawtext=fontfile=${font}:text='%{pts\\:hms}':x=4:y=4:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,` : '';
  const sheet = base + '.contact.jpg';
  const r = run('ffmpeg', ['-y', '-v', 'error', '-i', res.trimmed.out, '-an', '-vf', `fps=1,scale=320:-1,${label}tile=${cols}x${rows}`, '-frames:v', '1', '-q:v', '3', sheet]);
  res.contactSheet = r.status === 0 ? { file: sheet, tiles: n, cols, rows } : { error: r.stderr.toString().slice(-300) };
}
console.log(JSON.stringify(res, null, 2));
process.exit(res.pass ? 0 : 1);
