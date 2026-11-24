#!/usr/bin/env node
// Edit-list lint. Usage: lint-edit.mjs <edit.json> [--final] [--takes-dir DIR]
// Errors stop the render. --final turns placeholder shots, missing sources and unreviewed spoiler fields into errors.
// Shot types: card, gameplay, title (first shot only), cta, ca_open, ca_close (theme "ca" only). Joins: cut | glitch | blur | dissolve (glitch/blur/dissolve only next to a card or the title; 'card' follows effects.cardJoin).
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { takesDirFor } from './mission.mjs';
import { loadEdit } from './load-edit.mjs';
import { buildTimeline, framingAt, visibleRect, ASPECTS, JOIN_FRAMES, CA_ONLY_JOINS, CA_BANNED_JOINS, isCardLike, sourceRef, freezeSec } from '../src/timeline.js';
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const args = process.argv.slice(2); const final = args.includes('--final');
const tdi = args.indexOf('--takes-dir');
const file = args.find((a, i) => !a.startsWith('--') && !(tdi >= 0 && i === tdi + 1));
if (!file) { console.error('usage: lint-edit.mjs <edit.json> [--final] [--takes-dir DIR]'); process.exit(2); }
const edit = loadEdit(file);
const rawShots = JSON.parse(fs.readFileSync(file, 'utf8')).shots || []; // loadEdit drops the preset names; the CA rules need them
const ca = edit.theme === 'ca';
const cc = edit.theme === 'cc'; // Critical Cases (Incident Simulations): cc_open, cc_close, cards with style "cc"
let takesDir = tdi >= 0 ? args[tdi + 1] : null;   // default video_out/<edit.mission>/takes
if (!takesDir && edit.mission) takesDir = takesDirFor(repo, edit, file);
const errors = [], warns = [];
if (!edit.mission) errors.push('edit: "mission" field missing (for example "mission": "m01"); takes and renders live under video_out/<mission>/');
const E = (id, m) => errors.push(`${id}: ${m}`), W = (id, m) => warns.push(`${id}: ${m}`);
const fps = edit.fps;
if (!Number.isInteger(fps) || fps < 24) E('edit', 'fps must be an integer >= 24');
if (!edit.shots?.length) { E('edit', 'no shots'); }
const tl = buildTimeline(edit);
/** a cc shot's own cc block over the edit-level one (the same merge the composition does) */
const ccOf = (s) => ({ ...(edit.cc || {}), ...(s.cc || {}) });
const beat = edit.beat?.period, boff = edit.beat?.offset ?? 0;
const halfFrame = 0.5 / fps;
if (!beat) E('edit', 'beat.period missing');
const music = edit.music || {};
if (music.none) { /* silent bumper: no music bed, clip sound only */ }
else if (!music.track) E('music', 'track missing');
else if (!fs.existsSync(path.join(repo, 'public/break_escape/assets/music', music.track))) E('music', `track file not found: ${music.track}`);
if (!music.none && (music.start == null || music.length == null)) E('music', 'start/length missing');
const total = tl.totalFrames / fps;
if (music.length != null && Math.abs(total - music.length) > 1 / fps + 1e-6) E('music', `shots total ${total.toFixed(3)} s but music window is ${music.length} s`);
if (!music.none && music.start != null && music.start + music.length > 0) {
  const an = music.analysis && path.join(repo, 'tools/video/edits/music', music.analysis);
  if (an && fs.existsSync(an)) { const a = JSON.parse(fs.readFileSync(an, 'utf8')); if (music.start + music.length > a.duration) E('music', 'window runs past the end of the track'); }
}
if (edit.duck?.db == null || edit.duck.db > -8 || edit.duck.db < -10.5) W('duck', 'plan asks for -8 to -10 dB under dialogue');
if (!edit.audio?.fade_ms || edit.audio.fade_ms < 5 || edit.audio.fade_ms > 10) E('audio', 'fade_ms must be 5-10');
const takeFiles = takesDir && fs.existsSync(takesDir) ? new Set(fs.readdirSync(takesDir)) : new Set();
const clipDirs = [path.join(repo, 'tools/video/assets/placeholders'), path.join(repo, 'tools/video/assets/clips'), ...(process.env.BE_CLIPS_DIR ? [process.env.BE_CLIPS_DIR] : [])];
const clipFiles = new Set(clipDirs.flatMap((d) => (fs.existsSync(d) ? fs.readdirSync(d) : [])));
const brandDir = path.join(repo, 'tools/video/assets/brand');
const placeholders = [];
if (edit.effects?.cardJoin != null && !['glitch', 'dissolve'].includes(edit.effects.cardJoin)) E('edit', `effects.cardJoin must be glitch|dissolve, got ${edit.effects.cardJoin}`);
const ids = new Set();

tl.shots.forEach((s, i) => {
  const id = s.id || `shot#${i}`;
  if (!s.id) E(id, 'missing id'); else if (ids.has(s.id)) E(id, 'duplicate id'); ids.add(s.id);
  if (!['card', 'gameplay', 'title', 'cta', 'ca_open', 'ca_close', 'cc_open', 'cc_close'].includes(s.type)) E(id, `type must be card|gameplay|title|cta|ca_open|ca_close|cc_open|cc_close, got ${s.type}`);
  if (s.type === 'title' && i !== 0) E(id, 'a title shot is only allowed as the first shot');
  if (!(s.duration > 0)) E(id, 'duration must be > 0');
  const raw = s.join?.type || 'cut';
  if (!['cut', 'glitch', 'blur', 'dissolve', 'card', 'seam', 'flip'].includes(raw)) E(id, `join type must be cut|glitch|blur|dissolve|seam|flip, got ${raw}`);
  if (!ca && CA_ONLY_JOINS.includes(raw)) E(id, `join '${raw}' is for Cyber Aware edits only (set "theme": "ca")`);
  const jt = s.joinType; // after effects.cardJoin
  // join rule: anything other than a cut needs a card (or the title) on at least one side
  if (jt !== 'cut') {
    const prev = tl.shots[i - 1];
    const cardSide = isCardLike(s) || (prev && isCardLike(prev));
    if (!cardSide && jt !== 'flip') E(id, `join '${jt}' between two gameplay shots (${prev ? prev.id : 'start'} -> ${id}): only cuts allowed`);
    if (i === 0 && !isCardLike(s) && !(ca && jt !== 'cut')) E(id, `first shot has join '${jt}' but is not a card or title`);
    if (i === 0 && (jt === 'dissolve' || jt === 'seam' || jt === 'flip')) E(id, `${jt} needs an outgoing shot: not allowed on the first shot`);
    if (jt === 'flip' && prev && (isCardLike(prev) || isCardLike(s))) E(id, 'flip is a gameplay-to-gameplay join (attacker seat to defender seat); use seam into or out of a card');
    const n = s.joinFrames, fr = JOIN_FRAMES[jt];
    if (fr && !(n >= fr.min && n <= fr.max)) E(id, `${jt} frames must be ${fr.min}-${fr.max}, got ${n}`);
    if (jt === 'dissolve') {
      const b = s.join?.block ?? edit.effects?.dissolveBlock ?? 24;
      if (!Number.isInteger(b) || b < 8 || b % 4) E(id, `dissolve block must be an integer multiple of 4 (>= 8), got ${b}`);
    }
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
  if (s.type === 'title') {
    const t = s.title || {};
    for (const f of [t.art || 'brand/c1_keyhole_hookpick6.png', t.svg || 'brand/safetynet_licence_to_hack.svg']) if (!fs.existsSync(path.join(repo, 'tools/video/assets', f))) E(id, `title asset not found in tools/video/assets: ${f}`);
    for (const [a, v] of Object.entries(t.scale || {})) if (!Number.isInteger(v) || v < 1) E(id, `title.scale.${a} must be an integer >= 1, got ${v}`);
    if (s.source) W(id, 'title has a source (ignored)');
    if (s.clip) { if (!clipFiles.has(s.clip.file)) E(id, `title clip not found: ${s.clip.file}`); if (s.clip.audio && typeof s.clip.audio.gain_db !== 'number') E(id, 'clip.audio.gain_db missing'); }
  } else if (s.type === 'cta') {
    if (!s.clip?.file || !clipFiles.has(s.clip.file)) E(id, `cta needs clip.file in tools/video/assets/clips (${s.clip?.file})`);
    if (!s.phases?.length) E(id, 'cta needs phases[]');
    else { const sum = s.phases.reduce((a, p) => a + p.duration, 0); if (Math.abs(sum - s.duration) > 1 / fps) E(id, `cta phases total ${sum} s, shot is ${s.duration} s`); }
  } else if (s.type === 'cc_open' || s.type === 'cc_close') {
    if (!cc) E(id, `${s.type} is for Critical Cases edits only (set "theme": "cc")`);
    if (!ccOf(s).case1) E(id, `${s.type} needs the case name: cc.case1 (and cc.case2) on the shot or the edit`);
    if (s.source) W(id, `${s.type} has a source (ignored)`);
    if (s.type === 'cc_open' && s.duration < 2) W(id, 'cc_open under 2 s: the logo and the case title have no time to read');
    if (s.type === 'cc_close' && s.duration < 3) W(id, 'cc_close under 3 s: the case name, series name and call to action will not all land');
  } else if (s.type === 'ca_open' || s.type === 'ca_close') {
    if (!ca) E(id, `${s.type} is for Cyber Aware edits only (set "theme": "ca")`);
    if (s.type === 'ca_open' && !s.ca?.title) E(id, 'ca_open needs ca.title');
    if (s.source) W(id, `${s.type} has a source (ignored)`);
    if (s.type === 'ca_close' && s.duration < 2.5) W(id, 'ca_close under 2.5 s: the halves, mark, Hacktivity line and tagline will not all land');
    if (s.type === 'ca_open' && s.duration < 1.5) W(id, 'ca_open under 1.5 s: the title card has no time to read');
  } else if (s.type === 'card') {
    if (s.style === 'ca') {
      if (!(s.text?.length || s.body?.length || s.tool)) E(id, 'ca card needs text[] (GNF lines), body[] (VT323 lines) or tool');
      if (s.chapter != null) {
        if (!['attack', 'defend'].includes(s.chapter)) E(id, `chapter must be attack|defend, got ${s.chapter}`);
        if (!(s.text?.length === 1)) E(id, 'chapter card needs exactly one text[] line (the GNF heading)');
        if ((s.body || []).length > 3) E(id, 'chapter card: at most three bullet lines (body[])');
        if ((s.body || []).some((b) => typeof b !== 'string' || b.length > 60)) W(id, 'chapter card: bullet lines of more than 60 characters will wrap on 9:16');
        if (s.text?.[0] && String(typeof s.text[0] === 'string' ? s.text[0] : s.text[0].text).length > 28) W(id, 'chapter card: heading over 28 characters');
        if (s.tool || s.tab || s.seat) E(id, 'chapter card sets its own tab: no tool, tab or seat');
        if (s.reveal != null) {
          const st = s.reveal.start ?? 1.2, ea = s.reveal.each ?? 2, n = (s.body || []).length;
          if (!(st >= 0) || !(ea > 0)) E(id, 'chapter card: reveal.start must be >= 0 and reveal.each > 0 (seconds)');
          else if (n && s.duration != null && st + (n - 1) * ea + 1.5 > s.duration) E(id, `chapter card: the last bullet shows at ${(st + (n - 1) * ea).toFixed(1)} s and needs 1.5 s on screen; duration is ${s.duration} s`);
          if (ea > 0 && ea < 1.5) W(id, 'chapter card: reveal.each under 1.5 s is too quick to read a sentence');
        }
      } else {
      if ((s.text || []).length > 2) W(id, 'ca card: more than two GNF lines');
      if ((s.body || []).length > 3) W(id, 'ca card: more than three VT323 lines');
      }
    } else if (s.style === 'cc') {
      if (!cc) E(id, 'card style "cc" is for Critical Cases edits only (set "theme": "cc")');
      if (!(s.text?.length)) E(id, 'cc card needs text[]');
      if ((s.text || []).length > 2) W(id, 'cc card: more than two lines');
      if ((s.text || []).some((l) => String(typeof l === 'string' ? l : l.text).length > 14)) W(id, 'cc card: a line over 14 characters (recipe: about 12) will shrink on 9:16');
    } else if (ca) E(id, 'card in a Cyber Aware edit needs "style": "ca"');
    else if (cc) E(id, 'card in a Critical Cases edit needs "style": "cc"');
    else if (s.style) W(id, `unknown card style ${s.style}`);
    if (s.style !== 'ca' && s.kind !== 'logo' && s.kind !== 'logo_end' && !(s.text?.length)) E(id, 'card needs text[]');
    if (s.source) W(id, 'card has a source (ignored)');
    if (s.freeze || s.freezeAt != null) W(id, 'freeze/freezeAt is for gameplay shots (ignored on a card)');
  } else {
    const src = s.source;
    if (!src?.file) E(id, 'gameplay shot needs source.file');
    else {
      if (src.type && !['take', 'clip'].includes(src.type)) E(id, `source.type must be take|clip, got ${src.type}`);
      if (!(src.out > src.in)) E(id, 'source.out must be > source.in');
      if (src.out - src.in + 1e-6 < s.duration) E(id, `source span ${(src.out - src.in).toFixed(2)} s is shorter than duration ${s.duration} s`);
      const isClip = src.type === 'clip';
      if (!(isClip ? clipFiles : takeFiles).has(src.file)) (final ? E : W)(id, `${isClip ? 'clip' : 'take'} file not found yet (${src.file}): placeholder pattern will render`);
      if (isClip && s.placeholder !== true) W(id, 'clip source without placeholder: true (set it unless the clip is final footage)');
      // freeze / freezeAt: the held frame must be a frame of the take (and should sit in the shot's own window)
      if (s.freeze != null && typeof s.freeze !== 'boolean') E(id, `freeze must be true or false, got ${JSON.stringify(s.freeze)}`);
      if (s.freezeAt != null && !(typeof s.freezeAt === 'number' && Number.isFinite(s.freezeAt))) E(id, `freezeAt must be a number (source seconds), got ${JSON.stringify(s.freezeAt)}`);
      else if (s.freezeAt != null && s.freeze === false) E(id, 'freezeAt with freeze: false (drop one of them)');
      const fz = freezeSec(s, fps);
      if (fz != null) {
        if (fz < 0) E(id, `frozen frame ${fz.toFixed(3)} s is before the start of the ${isClip ? 'clip' : 'take'}`);
        const fdir = isClip ? clipDirs.find((d) => fs.existsSync(path.join(d, src.file))) : takesDir;
        const ff = fdir && path.join(fdir, src.file);
        if (ff && fs.existsSync(ff)) {
          const d = Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', ff], { encoding: 'utf8' }).stdout.trim());
          if (d > 0 && fz > d - 1 / fps + 1e-6) E(id, `frozen frame ${fz.toFixed(3)} s is past the last frame of ${src.file} (${d.toFixed(3)} s)`);
        }
        if (fz < src.in - 1e-6 || fz >= src.out - 1e-6) W(id, `frozen frame ${fz.toFixed(3)} s is outside source.in-out (${src.in}-${src.out}); the audio still plays from source.in`);
      }
    }
    if (s.placeholder === true) { placeholders.push(`${id}${src?.type === 'clip' ? ` (clip ${src.file} ${src.in}-${src.out})` : src?.file ? ` (take ${src.file})` : ' (no footage yet)'}${s.placeholder_note ? ': ' + s.placeholder_note : ''}`); if (final) E(id, 'placeholder shot (--final)'); }
    if (!s.audio || typeof s.audio.gain_db !== 'number') E(id, 'audio.gain_db missing');
    if (s.seat != null) {
      const st = typeof s.seat === 'string' ? s.seat : s.seat?.seat;
      if (!ca) E(id, 'seat is for Cyber Aware edits only (set "theme": "ca")');
      if (!['attack', 'defend', 'full'].includes(st)) E(id, `seat must be attack|defend|full, got ${st}`);
      if (typeof s.seat === 'object' && s.seat.chip != null && (typeof s.seat.chip !== 'string' || s.seat.chip.length > 24 || s.seat.chip !== s.seat.chip.toUpperCase())) E(id, 'seat.chip must be an upper-case string of at most 24 characters');
    } else if (ca) W(id, 'gameplay shot in a Cyber Aware edit has no seat (use seat "full" for hook and room shots)');
    for (const [mi, m] of (s.masks || []).entries()) {
      if (![m.x, m.y, m.w, m.h].every((v) => typeof v === 'number' && v >= 0) || !(m.w > 0 && m.h > 0)) E(id, `masks[${mi}] needs numeric x, y and w, h > 0 (source pixels)`);
      if (m.from != null && m.to != null && !(m.to > m.from)) E(id, `masks[${mi}]: to must be > from`);
      if (m.rows != null && !(Number.isInteger(m.rows) && m.rows >= 1 && m.rows <= 12)) E(id, `masks[${mi}].rows must be an integer 1-12`);
    }
    // insets: a magnified copy of a source rectangle (small game UI such as the influence meter), drawn at a fixed output position per aspect
    if (s.insets != null) {
      if (!Array.isArray(s.insets)) E(id, 'insets must be an array');
      else s.insets.forEach((ins, ii) => {
        const tag = `insets[${ii}]`; const [sw, sh] = edit.source_size || [1920, 1080];
        const sr = ins?.src; const num = (v) => typeof v === 'number' && Number.isFinite(v);
        if (!sr || ![sr.x, sr.y, sr.w, sr.h].every(num) || !(sr.w > 0 && sr.h > 0)) { E(id, `${tag}.src needs numeric x, y and w, h > 0 (source pixels)`); return; }
        if (sr.x < 0 || sr.y < 0 || sr.x + sr.w > sw || sr.y + sr.h > sh) E(id, `${tag}.src (${sr.x},${sr.y} ${sr.w}x${sr.h}) is not inside the ${sw}x${sh} take frame`);
        if (ins.from != null && !num(ins.from)) E(id, `${tag}.from must be a number (shot seconds)`);
        if (ins.to != null && !num(ins.to)) E(id, `${tag}.to must be a number (shot seconds)`);
        if (num(ins.from) && num(ins.to) && !(ins.to > ins.from)) E(id, `${tag}: to must be > from`);
        if (num(ins.from) && (ins.from < 0 || ins.from >= s.duration)) E(id, `${tag}.from ${ins.from} s is outside the shot (0-${s.duration} s)`);
        if (num(ins.to) && ins.to > s.duration + 1e-6) W(id, `${tag}.to ${ins.to} s is past the end of the shot (${s.duration} s)`);
        if (ins.label != null && (typeof ins.label !== 'string' || !ins.label || ins.label.length > 20 || ins.label !== ins.label.toUpperCase())) E(id, `${tag}.label must be an upper-case string of at most 20 characters`);
        if (!ins.at || typeof ins.at !== 'object' || !Object.keys(ins.at).length) { E(id, `${tag}.at needs an entry per aspect ("16:9", "9:16", "1:1")`); return; }
        for (const [a, p] of Object.entries(ins.at)) {
          if (!ASPECTS[a]) { E(id, `${tag}.at: unknown aspect ${a}`); continue; }
          if (!p || ![p.x, p.y, p.scale].every(num)) { E(id, `${tag}.at["${a}"] needs numeric x, y, scale`); continue; }
          if (p.scale < 1.5 || p.scale > 4) E(id, `${tag}.at["${a}"].scale must be 1.5-4, got ${p.scale}`);
          const [ow, oh] = (edit.aspects || ASPECTS)[a]; const bw = Math.round(sr.w * p.scale), bh = Math.round(sr.h * p.scale);
          if (p.x < 0 || p.y < 0 || p.x + bw > ow || p.y + bh > oh) E(id, `${tag}.at["${a}"]: the inset (${p.x},${p.y} ${bw}x${bh}) is not inside the ${ow}x${oh} output frame`);
          else if (ins.label) { const u = Math.max(1, Math.round(Math.min(ow, oh) / 540)), tf = Math.max(16, Math.round((Math.min(ow, oh) * 0.022) / 8) * 8), ts = Math.max(8, Math.round((tf * 0.67) / 8) * 8); const th = ts + 2 * Math.round(ts * 0.5) + 4 * u; if (p.y < th) W(id, `${tag}.at["${a}"]: y ${p.y} leaves no room for the label tab above (needs ${th} px)`); }
        }
      });
    }
    if (s.dialogue) {
      if (!s.audio?.dialogue || !s.audio.duck_music) E(id, 'dialogue shot needs audio.dialogue and audio.duck_music true');
      if (!s.lines?.length) E(id, 'dialogue shot needs lines[] (for the .srt)');
      if (s.audio && s.audio.gain_db < -1) W(id, 'dialogue should sit at full level');
    } else if (s.audio && s.audio.gain_db > -3) W(id, `montage shot gain ${s.audio.gain_db} dB: plan says about -6 dB`);
    for (const a of Object.keys(ASPECTS)) {
      const fr = framingAt(s, a, 1); const [w, h] = (edit.aspects || ASPECTS)[a];
      // zoom < 1 is a letterbox: allowed while the source is not shrunk (scale >= 1, so 9:16 down to 0.5625); never in 16:9.
      if (fr.zoom < 1 && (a === '16:9' || Math.max(w / (edit.source_size || [1920, 1080])[0], h / (edit.source_size || [1920, 1080])[1]) * fr.zoom < 1 - 1e-6)) E(id, `${a}: zoom ${fr.zoom} shrinks the source (letterbox allowed only while scale >= 1, never in 16:9)`);
      if (s.pushin?.crops_ui) {
        const r = visibleRect(fr, w, h, edit.source_size || [1920, 1080]);
        const ui = s.pushin.ui_bottom_fraction ?? 0.22;
        if (r.y1 > 1 - ui + 1e-6) E(id, `${a}: push-in end still shows the dialogue UI (visible bottom ${r.y1.toFixed(2)} > ${(1 - ui).toFixed(2)})`);
      }
    }
  }
});

// Cyber Aware edit rules (theme "ca"): opens with ca-open, closes with ca-close, nothing from SAFETYNET, at most one flip.
if (edit.theme != null && edit.theme !== 'ca' && edit.theme !== 'cc') E('edit', `unknown theme ${edit.theme} (only "ca" or "cc")`);
// Critical Cases edit rules (theme "cc"): exactly one cc_open and one cc_close (the last shot), nothing from SAFETYNET or Cyber Aware, no seam or flip, no brand names on cards.
if (cc) {
  const shots = tl.shots;
  const opens = shots.filter((s) => s.type === 'cc_open'), closes = shots.filter((s) => s.type === 'cc_close');
  if (opens.length !== 1) E('edit', `a cc edit needs exactly one cc_open shot (the title card), found ${opens.length}`);
  if (closes.length !== 1) E('edit', `a cc edit needs exactly one cc_close shot (the end card), found ${closes.length}`);
  else if (closes[0].index !== shots.length - 1) E(closes[0].id, 'cc_close must be the last shot');
  if (!edit.cc && !shots.every((s) => s.type === 'gameplay' || s.cc)) W('edit', 'no edit-level cc block: every cc shot needs its own cc ({case, accent, panel, case1, case2})');
  rawShots.forEach((r, i) => {
    const id = shots[i]?.id || `shot#${i}`;
    if (r.preset && !/^cc-/.test(r.preset)) E(id, `preset "${r.preset}" is not a Critical Cases preset (cc- presets only)`);
  });
  const banned = /safetynet|hax\b|entropy|cyber aware|break escape|licence to hack/i;
  shots.forEach((s) => {
    const id = s.id;
    if (s.type === 'title' || s.type === 'cta' || s.type === 'ca_open' || s.type === 'ca_close') E(id, `${s.type} is a SAFETYNET or Cyber Aware shot type: not allowed in a cc edit`);
    if (s.type === 'card' && (s.kind === 'logo' || s.kind === 'logo_end')) E(id, 'SAFETYNET logo card: not allowed in a cc edit (use cc_close)');
    if (s.type === 'card' && s.style === 'ca') E(id, 'Cyber Aware card: not allowed in a cc edit');
    const raw = s.join?.type || 'cut';
    if (['seam', 'flip', 'blur', 'card'].includes(raw)) E(id, `join '${raw}' is not allowed in a cc edit: use cut, dissolve, or glitch for the hook-to-title join only`);
    if (raw === 'glitch' && s.type !== 'cc_open') E(id, 'glitch join in a cc edit is for the hook-to-title join only (the shot that leads into cc_open)');
    if (s.hit) E(id, 'hit (glitch FX) is not allowed in a cc edit');
    const c = ccOf(s);
    for (const t of [...(s.text || []).map((l) => (typeof l === 'string' ? l : l.text)), ...(s.body || []), s.tab, c.case1, c.case2, ...(c.series || []), c.cta].filter((t) => typeof t === 'string')) {
      if (banned.test(t)) E(id, `brand name not allowed on a Critical Cases card: "${t}"`);
      if (/\b(color|organization|recogniz\w*|behavior|center|favorite|analyz\w*)\b/i.test(t)) W(id, `US spelling in card text (UK English): "${t}"`);
    }
  });
  const ccAccents = new Set(shots.map((s) => ccOf(s).accent).filter(Boolean));
  if (ccAccents.size > 1) W('edit', `more than one cc accent in one trailer: ${[...ccAccents].join(', ')}`);
}
if (ca) {
  const shots = tl.shots;
  const opens = shots.filter((s) => s.type === 'ca_open'), closes = shots.filter((s) => s.type === 'ca_close');
  if (opens.length !== 1) E('edit', `a CA edit needs exactly one ca_open shot (the ca-open preset), found ${opens.length}`);
  else if (opens[0].index > 1 || (opens[0].index === 1 && !(shots[0].type === 'gameplay' && shots[0].duration <= 5))) E(opens[0].id, 'ca_open must be the first shot, or the second after one cold-open gameplay shot of at most 5 s (one voiced line)');
  if (closes.length !== 1) E('edit', `a CA edit needs exactly one ca_close shot (the ca-close preset), found ${closes.length}`);
  else if (closes[0].index !== shots.length - 1) E(closes[0].id, 'ca_close must be the last shot');
  rawShots.forEach((r, i) => {
    const id = shots[i]?.id || `shot#${i}`;
    if (r.preset && !/^ca-/.test(r.preset)) E(id, `preset "${r.preset}" is not a Cyber Aware preset (SAFETYNET presets are not allowed in a CA edit)`);
    if (r.preset === 'ca-open' && shots[i].type !== 'ca_open') E(id, 'ca-open preset must stay type ca_open');
    if (r.preset === 'ca-close' && shots[i].type !== 'ca_close') E(id, 'ca-close preset must stay type ca_close');
  });
  shots.forEach((s) => {
    const id = s.id;
    if (s.type === 'title' || s.type === 'cta') E(id, `${s.type} is a SAFETYNET shot type: not allowed in a CA edit`);
    if (s.type === 'card' && (s.kind === 'logo' || s.kind === 'logo_end')) E(id, 'SAFETYNET logo card: not allowed in a CA edit (use ca_close)');
    const raw = s.join?.type || 'cut';
    if (CA_BANNED_JOINS.includes(raw)) E(id, `join '${raw}' is not allowed in a CA edit (no glitch, no blur streak): use seam, flip, dissolve or cut`);
    if (s.hit) E(id, 'hit (glitch FX) is not allowed in a CA edit');
    if (s.type === 'gameplay' && s.joinType === 'seam' && !isCardLike(shots[s.index - 1] || {}) && !isCardLike(s)) E(id, 'seam between two gameplay shots: only flip or cut');
  });
  if (edit.effects?.cardJoin === 'glitch') E('edit', 'effects.cardJoin "glitch" is not allowed in a CA edit');
  const flips = shots.filter((s) => s.joinType === 'flip');
  if (flips.length > 1) E(flips[1].id, `at most one flip join per trailer, found ${flips.length} (${flips.map((f) => f.id).join(', ')})`);
  for (const f of flips) { const sd = (x) => (typeof x?.seat === 'string' ? x.seat : x?.seat?.seat); if (sd(shots[f.index - 1]) !== 'attack' || sd(f) !== 'defend') W(f.id, 'flip should go from an attack seat to a defend seat'); }
  // Chapter cards: at most one attack and one defend chapter, attack first (the red page says what the attack half covers, the blue page opens the defend half)
  const chapters = shots.filter((s) => s.type === 'card' && s.chapter != null);
  const atkCh = chapters.filter((s) => s.chapter === 'attack'), defCh = chapters.filter((s) => s.chapter === 'defend');
  if (atkCh.length > 1) E(atkCh[1].id, `at most one attack chapter card, found ${atkCh.length}`);
  if (defCh.length > 1) E(defCh[1].id, `at most one defend chapter card, found ${defCh.length}`);
  if (atkCh[0] && defCh[0] && atkCh[0].index > defCh[0].index) E(defCh[0].id, 'the attack chapter card must come before the defend chapter card');
  if (defCh[0] && !atkCh[0]) W(defCh[0].id, 'defend chapter card without an attack chapter card (every CA episode trailer has both)');
  if (atkCh[0] && !defCh[0]) W(atkCh[0].id, 'attack chapter card without a defend chapter card (every CA episode trailer has both)');
  if (atkCh[0] && defCh[0]) {
    const fl = shots.find((s) => s.joinType === 'flip');
    if (fl && defCh[0].index < fl.index) W(defCh[0].id, 'defend chapter card comes before the flip');
    if (fl && atkCh[0].index > fl.index) W(atkCh[0].id, 'attack chapter card comes after the flip');
  }
  // UK English and banned vocabulary on every designed text field (cards, ca blocks, seat chips)
  const bannedWords = /\b(delve[sd]?|intricate|tapestry|pivotal|underscore[sd]?|landscape|foster(?:s|ed|ing)?|enhance[sd]?|crucial|robust|profound)\b/i;
  const us = /\b(color|organization|recogniz\w*|behavior|center|favorite|analyz\w*)\b/i;
  shots.forEach((s) => {
    const texts = [...(s.text || []).map((l) => (typeof l === 'string' ? l : l.text)), ...(s.body || []), s.tool, s.tab, s.seat?.chip, ...(s.ca ? [s.ca.title, s.ca.company, s.ca.name, s.ca.tagline] : [])].filter((t) => typeof t === 'string');
    for (const t of texts) { if (bannedWords.test(t)) E(s.id, `banned word in card text: "${t}"`); if (us.test(t)) W(s.id, `US spelling in card text (UK English): "${t}"`); }
  });
}
// Voice-over lane: edit.vo = [{ id, start, end, text, file?, onCard?, gain_db? }] in global seconds; every cue is burned as a caption and, with a file, mixed in.
if (edit.vo != null) {
  if (!Array.isArray(edit.vo)) E('vo', 'vo must be an array of cues');
  else {
    const vids = new Set(); const okCues = []; const num = (v) => typeof v === 'number' && Number.isFinite(v);
    edit.vo.forEach((c, i) => {
      const id = `vo ${c?.id ?? `#${i}`}`;
      if (!c?.id) E(id, 'missing id'); else if (vids.has(c.id)) E(id, 'duplicate id'); vids.add(c?.id);
      if (!num(c?.start) || !num(c?.end)) { E(id, 'start and end must be numbers (global seconds)'); return; }
      if (typeof c.text !== 'string' || !c.text.trim()) { E(id, 'text missing'); return; }
      if (c.start < 0 || c.end > total + 1e-6) E(id, `cue ${c.start}-${c.end} s is outside the trailer (0-${total.toFixed(2)} s)`);
      if (!(c.start < c.end)) { E(id, 'start must be < end'); return; }
      if (c.onCard != null && c.onCard !== 'hide') E(id, `onCard must be "hide" (or left out), got ${JSON.stringify(c.onCard)}`);
      if (c.gain_db != null && !num(c.gain_db)) E(id, 'gain_db must be a number');
      if (c.text.length > 90) W(id, `text is ${c.text.length} characters (over 90): too long for a plate on 9:16`);
      const words = c.text.trim().split(/\s+/).length, wps = words / (c.end - c.start);
      if (wps > 3.0) W(id, `${words} words in ${(c.end - c.start).toFixed(2)} s is ${wps.toFixed(1)} words/s (over 3.0): too fast to say`);
      let fileOk = false;
      if (c.file != null) {
        const f = typeof c.file === 'string' ? (path.isAbsolute(c.file) ? c.file : path.join(takesDir || '', c.file)) : null;
        if (!f || !fs.existsSync(f)) (final ? E : W)(id, `file not found (${c.file}): not voiced yet (caption only)`);
        else {
          fileOk = true;
          const d = Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).stdout.trim());
          if (d > 0 && d > c.end - c.start + 0.3) W(id, `audio runs ${d.toFixed(2)} s but the cue is ${(c.end - c.start).toFixed(2)} s: the caption goes before the voice stops`);
        }
      } else W(id, 'not voiced yet (caption only)');
      okCues.push(c);
    });
    const sorted = [...okCues].sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) if (sorted[i].start < sorted[i - 1].end - 1e-6) E(`vo ${sorted[i].id}`, `overlaps vo ${sorted[i - 1].id} (${sorted[i - 1].start}-${sorted[i - 1].end} s): one narrator, one plate at a time`);
    // narrator talking over a character: any dialogue line overlapped by more than 0.3 s
    for (const c of okCues) for (const s of tl.shots) {
      if (!s.dialogue || s.type !== 'gameplay') continue;
      for (const l of s.lines || []) {
        const t0 = s.startSec + Math.max(-(s.audio?.pre ?? 0), l.start), t1 = s.startSec + Math.min(s.duration + (s.audio?.post ?? 0), l.end);
        const ov = Math.min(c.end, t1) - Math.max(c.start, t0);
        if (ov > 0.3) W(`vo ${c.id}`, `overlaps ${s.id}'s dialogue line by ${ov.toFixed(2)} s (narrator talking over a character)`);
      }
    }
  }
}
if (tl.shots.length && !isCardLike(tl.shots[0]) && !ca && !cc) W('edit', 'first shot is not a card or title');
if (placeholders.length) { console.log(`PLACEHOLDERS (${placeholders.length}):`); for (const p of placeholders) console.log('  -', p); }
for (const w of warns) console.log('WARN ', w);
for (const e of errors) console.log('ERROR', e);
console.log(`lint ${path.basename(file)}: ${tl.shots.length} shots, ${total.toFixed(2)} s, ${errors.length} error(s), ${warns.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
