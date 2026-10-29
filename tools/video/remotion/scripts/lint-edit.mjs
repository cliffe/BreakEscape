#!/usr/bin/env node
// Edit-list lint. Usage: lint-edit.mjs <edit.json> [--final] [--takes-dir DIR]
// Errors stop the render. --final turns placeholder sources and unreviewed spoiler fields into errors.
import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline, framingAt, visibleRect, ASPECTS } from '../src/timeline.js';
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const args = process.argv.slice(2); const final = args.includes('--final');
const tdi = args.indexOf('--takes-dir');
const file = args.find((a, i) => !a.startsWith('--') && !(tdi >= 0 && i === tdi + 1));
const takesDir = args.includes('--takes-dir') ? args[args.indexOf('--takes-dir') + 1] : path.join(repo, 'video_out/m01/takes');
if (!file) { console.error('usage: lint-edit.mjs <edit.json> [--final]'); process.exit(2); }
const edit = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [], warns = [];
const E = (id, m) => errors.push(`${id}: ${m}`), W = (id, m) => warns.push(`${id}: ${m}`);
const fps = edit.fps;
if (!Number.isInteger(fps) || fps < 24) E('edit', 'fps must be an integer >= 24');
if (!edit.shots?.length) { E('edit', 'no shots'); }
const tl = buildTimeline(edit);
const beat = edit.beat?.period, boff = edit.beat?.offset ?? 0;
const halfFrame = 0.5 / fps;
if (!beat) E('edit', 'beat.period missing');
const music = edit.music || {};
if (!music.track) E('music', 'track missing');
else if (!fs.existsSync(path.join(repo, 'public/break_escape/assets/music', music.track))) E('music', `track file not found: ${music.track}`);
if (music.start == null || music.length == null) E('music', 'start/length missing');
const total = tl.totalFrames / fps;
if (music.length != null && Math.abs(total - music.length) > 1 / fps + 1e-6) E('music', `shots total ${total.toFixed(3)} s but music window is ${music.length} s`);
if (music.start != null && music.start + music.length > 0) {
  const an = music.analysis && path.join(repo, 'tools/video/edits/music', music.analysis);
  if (an && fs.existsSync(an)) { const a = JSON.parse(fs.readFileSync(an, 'utf8')); if (music.start + music.length > a.duration) E('music', 'window runs past the end of the track'); }
}
if (edit.duck?.db == null || edit.duck.db > -8 || edit.duck.db < -10.5) W('duck', 'plan asks for -8 to -10 dB under dialogue');
if (!edit.audio?.fade_ms || edit.audio.fade_ms < 5 || edit.audio.fade_ms > 10) E('audio', 'fade_ms must be 5-10');
const takeFiles = fs.existsSync(takesDir) ? new Set(fs.readdirSync(takesDir)) : new Set();
const ids = new Set();

tl.shots.forEach((s, i) => {
  const id = s.id || `shot#${i}`;
  if (!s.id) E(id, 'missing id'); else if (ids.has(s.id)) E(id, 'duplicate id'); ids.add(s.id);
  if (!['card', 'gameplay'].includes(s.type)) E(id, `type must be card|gameplay, got ${s.type}`);
  if (!(s.duration > 0)) E(id, 'duration must be > 0');
  const jt = s.join?.type || 'cut';
  if (!['cut', 'glitch', 'blur'].includes(jt)) E(id, `join type must be cut|glitch|blur, got ${jt}`);
  // join rule: anything other than a cut needs a card on at least one side
  if (jt !== 'cut') {
    const prev = tl.shots[i - 1];
    const cardSide = s.type === 'card' || (prev && prev.type === 'card');
    if (!cardSide) E(id, `join '${jt}' between two gameplay shots (${prev ? prev.id : 'start'} -> ${id}): only cuts allowed`);
    if (i === 0 && s.type !== 'card') E(id, `first shot has join '${jt}' but is not a card`);
    const n = s.join?.frames;
    if (jt === 'glitch' && !(n >= 6 && n <= 10)) E(id, `glitch frames must be 6-10, got ${n}`);
    if (jt === 'blur' && !(n >= 6 && n <= 14)) E(id, `blur frames must be 6-14, got ${n}`);
  }
  if (s.type === 'gameplay' && i > 0 && tl.shots[i - 1].type === 'gameplay' && jt !== 'cut') { /* covered above */ }
  // beat snapping
  if (s.snap && beat) {
    const onGrid = (t) => { const k = (t - boff) / beat; return Math.abs(k - Math.round(k)) * beat <= halfFrame + 1e-9; };
    if (!onGrid(s.startSec)) E(id, `snap: start ${s.startSec.toFixed(3)} s is off the ${beat}s beat grid`);
    if (!onGrid(s.endSec)) E(id, `snap: end ${s.endSec.toFixed(3)} s is off the beat grid (duration ${s.duration})`);
  }
  // spoiler fields
  const sp = s.spoiler;
  if (!sp) E(id, 'spoiler field missing');
  else {
    for (const k of ['reviewed', 'shows_code', 'shows_identity', 'shows_ending']) if (typeof sp[k] !== 'boolean') E(id, `spoiler.${k} must be a boolean`);
    if (sp.shows_code === true || sp.shows_identity === true || sp.shows_ending === true) E(id, 'spoiler: shot shows a code, an identity or the ending');
    if (!('keypad_partial' in sp)) E(id, 'spoiler.keypad_partial missing (null if not a keypad shot)');
    if (sp.keypad_partial === false) E(id, 'spoiler: keypad is fully entered');
    if (final && sp.reviewed !== true) E(id, 'spoiler not reviewed (--final)');
    else if (sp.reviewed !== true) W(id, 'spoiler not yet reviewed');
  }
  if (s.type === 'card') {
    if (s.kind !== 'logo' && s.kind !== 'logo_end' && !(s.text?.length)) E(id, 'card needs text[]');
    if (s.source) W(id, 'card has a source (ignored)');
  } else {
    const src = s.source;
    if (!src?.file) E(id, 'gameplay shot needs source.file');
    else {
      if (!(src.out > src.in)) E(id, 'source.out must be > source.in');
      if (src.out - src.in + 1e-6 < s.duration) E(id, `source span ${(src.out - src.in).toFixed(2)} s is shorter than duration ${s.duration} s`);
      if (!takeFiles.has(src.file)) (final ? E : W)(id, `take file not found yet (${src.file}): placeholder pattern will render`);
    }
    if (!s.audio || typeof s.audio.gain_db !== 'number') E(id, 'audio.gain_db missing');
    if (s.dialogue) {
      if (!s.audio?.dialogue || !s.audio.duck_music) E(id, 'dialogue shot needs audio.dialogue and audio.duck_music true');
      if (!s.lines?.length) E(id, 'dialogue shot needs lines[] (for the .srt)');
      if (s.audio && s.audio.gain_db < -1) W(id, 'dialogue should sit at full level');
    } else if (s.audio && s.audio.gain_db > -3) W(id, `montage shot gain ${s.audio.gain_db} dB: plan says about -6 dB`);
    for (const a of Object.keys(ASPECTS)) {
      const fr = framingAt(s, a, 1); const [w, h] = (edit.aspects || ASPECTS)[a];
      if (fr.zoom < 1) E(id, `${a}: zoom < 1`);
      if (s.pushin?.crops_ui) {
        const r = visibleRect(fr, w, h, edit.source_size || [1920, 1080]);
        const ui = s.pushin.ui_bottom_fraction ?? 0.22;
        if (r.y1 > 1 - ui + 1e-6) E(id, `${a}: push-in end still shows the dialogue UI (visible bottom ${r.y1.toFixed(2)} > ${(1 - ui).toFixed(2)})`);
      }
    }
  }
});
if (tl.shots.length && tl.shots[0].type !== 'card') W('edit', 'first shot is not a card');
for (const w of warns) console.log('WARN ', w);
for (const e of errors) console.log('ERROR', e);
console.log(`lint ${path.basename(file)}: ${tl.shots.length} shots, ${total.toFixed(2)} s, ${errors.length} error(s), ${warns.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
