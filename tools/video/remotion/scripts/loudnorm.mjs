#!/usr/bin/env node
// loudnorm.mjs <in.wav> <out.wav> [I=-14] [TP=-1.5] : two-pass ffmpeg loudnorm (measure, then linear apply). Prints before/after.
import { spawnSync } from 'node:child_process';
const [inp, out, I = '-14', TP = '-1.5'] = process.argv.slice(2); const LRA = '11';
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
