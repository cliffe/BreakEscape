#!/usr/bin/env node
// edit-info.mjs <edit.json> <id|mission|target_lufs|true_peak|length|sep>: prints one resolved field for render.sh (presets resolved).
import { loadEdit } from './load-edit.mjs';
import { missionKey } from './mission.mjs';
const [f, k] = process.argv.slice(2); const e = loadEdit(f);
const v = { id: () => e.id, mission: () => missionKey(e, f), target_lufs: () => e.audio.target_lufs, true_peak: () => e.audio.true_peak ?? -1.5, length: () => e.length, sep: () => e.file_sep ?? '_', norm_mode: () => (e.audio.peak_normalize ? 'peak' : '') }[k];
if (!v) { console.error('usage: edit-info.mjs <edit.json> id|mission|target_lufs|true_peak|length|sep|norm_mode'); process.exit(2); }
try { console.log(v()); } catch (err) { console.error(err.message); process.exit(1); }
