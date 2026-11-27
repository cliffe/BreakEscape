#!/usr/bin/env node
// make-stills.mjs <picks.json> [--out DIR]: a mission stills pack from recorded takes.
// picks.json: { "mission": "m01", "stills": [ { "take": "t13_sarah_line", "time": 3.5, "crop": [480, 270, 960, 540], "caption": "One sentence.", "slug": "sarah" }, ... ] }
//   take  a take id: video_out/<mission>/takes/<take>.trimmed.mkv      time  seconds in the trimmed take's clock (the same as its .trimmed.markers.json)
//   crop  optional [x, y, w, h] in take pixels (the take frame is 1920x1080). w must divide 1920 and h = w * 9 / 16, so the crop scales to 1920x1080 by a whole number (2x, 3x ...)
//   slug  optional file name part (default: the take id)
// Output (default video_out/<mission>/stills/): NN_<slug>.png at 1920x1080 (nearest-neighbour, never smoothed), captions.json [{file, caption, source}], contact.png (numbered sheet).
// Spoiler checks are the orchestrator's job (video-stills Step 3): look at every PNG at full size. Run under nice -n 19; extraction is light.
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const a = process.argv.slice(2); const file = a.find((x, i) => !x.startsWith('--') && a[i - 1] !== '--out');
if (!file) { console.error('usage: make-stills.mjs <picks.json> [--out DIR]'); process.exit(2); }
const picks = JSON.parse(fs.readFileSync(file, 'utf8'));
const mission = String(picks.mission || '').replace(/^((?:m|sis)\d+)(_.*)?$/, '$1');
if (!mission) { console.error('picks.json needs "mission" (for example "m01")'); process.exit(2); }
const outDir = a.includes('--out') ? a[a.indexOf('--out') + 1] : path.join(repo, 'video_out', mission, 'stills');
const takesDir = path.join(repo, 'video_out', mission, 'takes');
const W = 1920, H = 1080, pad = (n) => String(n).padStart(2, '0');
const errors = [];
picks.stills.forEach((s, i) => {
  const id = `still ${i + 1} (${s.take})`;
  if (!s.take || typeof s.time !== 'number') errors.push(`${id}: needs take and time (seconds)`);
  else if (!fs.existsSync(path.join(takesDir, `${s.take}.trimmed.mkv`))) errors.push(`${id}: ${takesDir}/${s.take}.trimmed.mkv not found`);
  if (!s.caption) errors.push(`${id}: caption missing`);
  if (/—/.test(s.caption || '')) errors.push(`${id}: caption has an em dash`);
  if (s.crop) {
    const [x, y, w, h] = s.crop;
    if (![x, y, w, h].every(Number.isInteger)) errors.push(`${id}: crop must be four integers`);
    else if (W % w || h * W !== w * H) errors.push(`${id}: crop ${w}x${h} does not scale to ${W}x${H} by a whole number (w must divide ${W}, aspect 16:9)`);
    else if (x < 0 || y < 0 || x + w > W || y + h > H) errors.push(`${id}: crop runs outside the ${W}x${H} frame`);
  }
});
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });
const caps = [];
picks.stills.forEach((s, i) => {
  const name = `${pad(i + 1)}_${(s.slug || s.take).replace(/[^a-z0-9_]+/gi, '_')}.png`;
  const vf = (s.crop ? `crop=${s.crop[2]}:${s.crop[3]}:${s.crop[0]}:${s.crop[1]},` : '') + `scale=${W}:${H}:flags=neighbor`;
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(s.time), '-i', path.join(takesDir, `${s.take}.trimmed.mkv`), '-frames:v', '1', '-vf', vf, path.join(outDir, name)], { encoding: 'utf8' });
  if (r.status !== 0 || !fs.existsSync(path.join(outDir, name))) { console.error(`${name}: ffmpeg failed ${r.stderr}`); process.exit(1); }
  const k = s.crop ? W / s.crop[2] : 1;
  caps.push({ file: name, caption: s.caption, source: `${s.take} at ${s.time} s${s.crop ? ` (crop ${s.crop.join(',')}, ${k}x nearest)` : ''}` });
  console.log(name);
});
fs.writeFileSync(path.join(outDir, 'captions.json'), JSON.stringify(caps, null, 2) + '\n');
// contact sheet: 4 across, 480 px thumbnails, numbered when drawtext and the game font are available
const font = path.join(repo, 'public/break_escape/assets/fonts/PressStart2P-Regular.ttf');
const rows = Math.ceil(caps.length / 4);
const label = (n) => `drawtext=fontfile=${font}:text='${n}':fontcolor=white:fontsize=28:box=1:boxcolor=black@0.7:boxborderw=6:x=8:y=8`;
const inputs = caps.flatMap((c) => ['-i', path.join(outDir, c.file)]);
const filt = caps.map((_, i) => `[${i}:v]scale=480:-2:flags=neighbor,${label(i + 1)}[t${i}]`).join(';') + `;${caps.map((_, i) => `[t${i}]`).join('')}xstack=inputs=${caps.length}:layout=${caps.map((_, i) => `${(i % 4) * 484}_${Math.floor(i / 4) * 274}`).join('|')}:fill=black[sheet]`;
let r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', filt, '-map', '[sheet]', '-frames:v', '1', path.join(outDir, 'contact.png')], { encoding: 'utf8' });
if (r.status !== 0) {   // fall back to an unnumbered tile sheet
  r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-pattern_type', 'glob', '-i', path.join(outDir, '[0-9][0-9]_*.png'), '-vf', `scale=480:-2:flags=neighbor,tile=4x${rows}:padding=4:color=black`, '-frames:v', '1', path.join(outDir, 'contact.png')], { encoding: 'utf8' });
  console.error('contact sheet without numbers (drawtext failed): ' + r.stderr.slice(0, 200));
}
console.log(`${caps.length} stills, captions.json and contact.png in ${outDir}`);
