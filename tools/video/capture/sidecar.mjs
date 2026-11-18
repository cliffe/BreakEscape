#!/usr/bin/env node
/**
 * sidecar.mjs - the per-take footage sidecar (`<take>.take.json`), source of truth for the
 * footage catalogue (hacktivity-videos/catalogue). One sidecar sits beside each video.
 *
 * At capture time the rig writes a DRAFT: the technical facts and a marks pointer, filled from
 * `<base>.check.json` + `<base>.trimmed.markers.json` (+ `<base>.record.json`) and ffprobe. The
 * capturing agent then adds the human fields - title, description, highlights, spoiler level,
 * status, characters - and leaves the technical block alone (the rig refreshes it on every run,
 * preserving every human field it finds).
 *
 * NEVER put a secret in a sidecar: no flag value, credential, password, PIN or code, and for a
 * console/solution take no exploit, tool, CVE or technique name - describe it neutrally
 * ("console: full solution, flag 2 stage"). The catalogue built from these is git-tracked and may
 * be pushed. The mask log (which may name secrets) lives beside the footage and is referenced by
 * PATH only, never read into the sidecar.
 *
 * CLI (manual / backfill):
 *   node sidecar.mjs <video.trimmed.mkv> [--mission m03] [--kind ingame|console|solution] \
 *        [--shot-type npc_beat] [--title "..."] [--force-technical]
 * Library (rig integration, e.g. check-take.mjs):
 *   import { mergeDraft } from './sidecar.mjs'; mergeDraft(trimmedMkvPath, { mission, kind });
 *
 * Fields: see SCHEMA below and catalogue/README.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const SCHEMA = 'footage-take/1';
export const SHOT_TYPES = ['approach', 'npc_beat', 'phone_call', 'payoff', 'ending',
  'console_clean', 'full_solution', 'walk', 'other'];
export const KINDS = ['ingame', 'console', 'solution'];
export const SPOILERS = ['none', 'mild', 'major', 'ending'];
export const STATUSES = ['good', 'usable', 'superseded', 'reject'];

const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

/** Strip `.trimmed.mkv` / `.mkv` to get the output base, and the bare take id. */
export function splitVideoPath(videoPath) {
  const dir = path.dirname(videoPath);
  const name = path.basename(videoPath);
  const base = name.replace(/\.(trimmed\.)?mkv$/i, '').replace(/\.(trimmed\.)?mp4$/i, '');
  // output base is the path without the final `.trimmed.mkv` / `.mkv` extension (keeps dir)
  const outBase = videoPath.replace(/\.(trimmed\.)?mkv$/i, '').replace(/\.(trimmed\.)?mp4$/i, '');
  return { dir, name, id: base, outBase, sidecarPath: path.join(dir, base + '.take.json') };
}

/** ffprobe the real video: resolution, fps, duration, whether an audio stream is present. */
export function ffprobe(videoPath) {
  const out = { resolution: null, fps: null, duration: null, audio: false };
  try {
    const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format',
      '-of', 'json', videoPath], { encoding: 'utf8', maxBuffer: 8 << 20 }));
    for (const s of j.streams || []) {
      if (s.codec_type === 'video') {
        out.resolution = `${s.width}x${s.height}`;
        if (s.avg_frame_rate && s.avg_frame_rate !== '0/0') {
          const [n, d] = s.avg_frame_rate.split('/').map(Number);
          if (d) out.fps = Math.round((n / d) * 1000) / 1000;
        }
      }
      if (s.codec_type === 'audio') out.audio = true;
    }
    if (j.format && j.format.duration) out.duration = Math.round(parseFloat(j.format.duration) * 1000) / 1000;
  } catch { /* ffprobe missing or file unreadable: leave nulls */ }
  return out;
}

/** Integrated loudness (LUFS) via one ffmpeg ebur128 pass. Bounded: skip silent / long takes. */
export function loudnessLufs(videoPath, { maxDurationS = 120, hasAudio = true } = {}) {
  if (!hasAudio) return null;
  try {
    const probe = ffprobe(videoPath);
    if (probe.duration && probe.duration > maxDurationS) return null;
    const stderr = execFileSync('ffmpeg', ['-nostats', '-i', videoPath, '-af', 'ebur128', '-f', 'null', '-'],
      { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'], maxBuffer: 16 << 20 });
    const m = [...stderr.matchAll(/I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/g)];
    if (m.length) return Math.round(parseFloat(m[m.length - 1][1]) * 10) / 10;
  } catch (e) {
    const s = (e.stderr || '').toString();
    const m = [...s.matchAll(/I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/g)];
    if (m.length) return Math.round(parseFloat(m[m.length - 1][1]) * 10) / 10;
  }
  return null;
}

/** sha256 + byte size of the file, for sync verification. */
export function checksum(videoPath) {
  try {
    const out = execFileSync('sha256sum', [videoPath], { encoding: 'utf8' });
    const sha = out.trim().split(/\s+/)[0];
    const bytes = fs.statSync(videoPath).size;
    return { bytes, sha256: sha };
  } catch {
    try { return { bytes: fs.statSync(videoPath).size, sha256: null }; } catch { return { bytes: null, sha256: null }; }
  }
}

/** line-start:/line-end: marker pairs -> voiced_lines with in/out seconds (trimmed clock). */
export function voicedLinesFromMarkers(markers) {
  const open = new Map(); const lines = [];
  for (const m of markers || []) {
    if (typeof m.label !== 'string') continue;
    if (m.label.startsWith('line-start:')) {
      const text = m.label.slice('line-start:'.length);
      open.set(text, { speaker: (m.data && m.data.speaker) || null, text, in: Math.round(m.tMs) / 1000 });
    } else if (m.label.startsWith('line-end:')) {
      const text = m.label.slice('line-end:'.length);
      const o = open.get(text);
      if (o) { o.out = Math.round(m.tMs) / 1000; lines.push(o); open.delete(text); }
    }
  }
  return lines;
}

/** git short hash of the repo that owns a path (best effort). */
function gitCommit(forPath) {
  try {
    const dir = fs.statSync(forPath).isDirectory() ? forPath : path.dirname(forPath);
    return execFileSync('git', ['-C', dir, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim() || null;
  } catch { return null; }
}

/** Build the technical block (media, marks, voiced_lines, sync, provenance stub) from the rig output. */
export function deriveTechnical(videoPath, { withLoudness = true, withChecksum = true } = {}) {
  const { dir, name, outBase } = splitVideoPath(videoPath);
  const check = readJson(outBase + '.check.json');
  const trimmedMarkers = readJson(outBase + '.trimmed.markers.json');
  const rawMarkers = trimmedMarkers || readJson(outBase + '.markers.json');
  const record = readJson(outBase + '.record.json');
  const probe = ffprobe(videoPath);

  const duration = probe.duration
    ?? (check && check.trimmed ? Math.round((check.trimmed.toS - check.trimmed.fromS) * 1000) / 1000 : null)
    ?? (trimmedMarkers && trimmedMarkers.durationS) ?? null;
  const media = {
    file: name,
    duration,
    resolution: probe.resolution || (record && record.size) || null,
    fps: probe.fps || (check && check.fps) || (record && record.fps) || null,
    audio: probe.audio,
    loudness_lufs: null,
    av_drift_ms: check ? (check.driftMs ?? null) : null,
    dropped_pct: check ? (check.dropPct ?? null) : null,
    trim: check && check.trimmed ? { in: check.trimmed.fromS ?? null, out: check.trimmed.toS ?? null } : null,
  };
  if (withLoudness) media.loudness_lufs = loudnessLufs(videoPath, { hasAudio: probe.audio });

  const marks = fs.existsSync(outBase + '.trimmed.markers.json')
    ? { file: path.basename(outBase + '.trimmed.markers.json') }
    : (fs.existsSync(outBase + '.markers.json') ? { file: path.basename(outBase + '.markers.json') } : null);

  const voiced = voicedLinesFromMarkers(rawMarkers && rawMarkers.markers);

  let date = null;
  try { date = fs.statSync(videoPath).mtime.toISOString().slice(0, 10); } catch { /* ignore */ }

  const sync = withChecksum ? checksum(videoPath) : null;

  return {
    media,
    marks,
    voiced_lines: voiced,
    provenance: {
      game: (record && (record.gameId || record.game)) || null,
      set: null,
      date,
      rig_commit: gitCommit(videoPath.includes('/BreakEscape/') ? videoPath : path.dirname(videoPath)),
      take_script_commit: null,
    },
    sync,
  };
}

/** A fresh draft sidecar with the human fields empty and the technical block filled. */
export function draftSidecar(videoPath, { mission = null, kind = null, shotType = null, title = '' } = {}, tech = null) {
  const { id } = splitVideoPath(videoPath);
  const t = tech || deriveTechnical(videoPath);
  return {
    schema: SCHEMA,
    id,
    mission: mission || '',
    kind: kind || '',
    shot_type: shotType || '',
    title: title || '',
    description: '',
    characters: [],
    voiced_lines: t.voiced_lines,
    highlights: [],           // [{ t, desc, trailer_score }] - the key trailer field; t in a safe span
    marks: t.marks,
    media: t.media,
    spoiler: '',              // none | mild | major | ending
    sensitive: {
      needs_mask: false,
      mask_log: null,         // path to the mask log, relative to the mission folder; NEVER its contents
      safe_spans: [],         // [[s,e]] times known clean - thumbnails are taken only from these
      mask_spans: [],         // [[s,e]] times to never show (ranges only, never the secret)
    },
    quality: { status: '', reason: '' },
    provenance: t.provenance,
    thumbnail: { t: null },   // a guaranteed-safe time for the take thumbnail
    sync: t.sync,
    _draft: true,             // cleared by the agent once the human fields are finished
  };
}

/**
 * Write or refresh the sidecar beside a video. Preserves every human field of an existing sidecar
 * and only refreshes the technical block (media, marks, sync, voiced_lines, provenance technical
 * bits), unless forceTechnical replaces the whole technical block. Never fails the caller.
 */
export function mergeDraft(videoPath, { mission = null, kind = null, shotType = null, title = '',
  withLoudness = true, withChecksum = true } = {}) {
  try {
    const { sidecarPath } = splitVideoPath(videoPath);
    const tech = deriveTechnical(videoPath, { withLoudness, withChecksum });
    const existing = readJson(sidecarPath);
    if (!existing) {
      const d = draftSidecar(videoPath, { mission, kind, shotType, title }, tech);
      fs.writeFileSync(sidecarPath, JSON.stringify(d, null, 2) + '\n');
      return { path: sidecarPath, created: true };
    }
    // Refresh technical, keep human fields.
    existing.schema = SCHEMA;
    existing.media = { ...tech.media };
    existing.marks = tech.marks;
    existing.sync = tech.sync;
    // voiced_lines: keep an agent-curated list if present and non-empty, else refresh.
    if (!Array.isArray(existing.voiced_lines) || existing.voiced_lines.length === 0) existing.voiced_lines = tech.voiced_lines;
    existing.provenance = { ...tech.provenance, ...(existing.provenance || {}) };
    if (mission && !existing.mission) existing.mission = mission;
    if (kind && !existing.kind) existing.kind = kind;
    if (shotType && !existing.shot_type) existing.shot_type = shotType;
    if (title && !existing.title) existing.title = title;
    fs.writeFileSync(sidecarPath, JSON.stringify(existing, null, 2) + '\n');
    return { path: sidecarPath, created: false };
  } catch (e) {
    return { error: String(e && e.message || e) };
  }
}

// ---- CLI ----
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const av = process.argv.slice(2);
  const pos = []; const opt = {};
  for (let i = 0; i < av.length; i++) {
    if (av[i].startsWith('--')) { const k = av[i].slice(2); opt[k] = (av[i + 1] && !av[i + 1].startsWith('--')) ? av[++i] : true; }
    else pos.push(av[i]);
  }
  if (!pos[0]) { console.error('usage: sidecar.mjs <video.trimmed.mkv> [--mission m03] [--kind ingame] [--shot-type npc_beat] [--title "..."] [--no-loudness] [--no-checksum]'); process.exit(2); }
  const r = mergeDraft(pos[0], {
    mission: opt.mission || null, kind: opt.kind || null, shotType: opt['shot-type'] || null, title: opt.title || '',
    withLoudness: !opt['no-loudness'], withChecksum: !opt['no-checksum'],
  });
  console.log(JSON.stringify(r));
  process.exit(r.error ? 1 : 0);
}
