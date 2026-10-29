#!/usr/bin/env node
// Populates remotion/public/ (git-ignored) from the repo, so nothing is duplicated in git:
//   fonts/PressStart2P-Regular.woff2   copied from public/break_escape/assets/fonts
//   brand/<file>                       copies of tools/video/assets/brand/* (logos, title SVG, keyhole art)
//   brand-derived/logo-*.svg           the Hacktivity logos split into the shared word and the sub-lines (same viewBox, so they register)
//   takes/<name>                       copies of video_out/m01/takes/*.trimmed.mkv
//   clips/<name>                       any other video file: tools/video/assets/placeholders/*.mp4 (+ BE_CLIPS_DIR); edit source {type:'clip', file}
//   manifest.json                      which takes and clips exist (the composition falls back to a placeholder pattern)
import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const repo = path.resolve(root, '../../..');
const pub = path.join(root, 'public');
const assets = path.join(repo, 'public/break_escape/assets');
const takesDir = process.env.BE_TAKES_DIR || path.join(repo, 'video_out/m01/takes');
fs.mkdirSync(path.join(pub, 'fonts'), { recursive: true });
fs.mkdirSync(path.join(pub, 'takes'), { recursive: true });
fs.copyFileSync(path.join(assets, 'fonts/PressStart2P-Regular.woff2'), path.join(pub, 'fonts/PressStart2P-Regular.woff2'));
// brand art
const brandDir = path.join(repo, 'tools/video/assets/brand');
fs.mkdirSync(path.join(pub, 'brand'), { recursive: true }); fs.mkdirSync(path.join(pub, 'brand-derived'), { recursive: true });
for (const f of fs.readdirSync(brandDir)) if (!/\.md$/i.test(f)) fs.copyFileSync(path.join(brandDir, f), path.join(pub, 'brand', f));
const group = (label) => new RegExp(`<g\\s+aria-label="${label}"[\\s\\S]*?</g>`);
const labs = fs.readFileSync(path.join(brandDir, 'hacktivity-logo.svg'), 'utf8');
const games = fs.readFileSync(path.join(brandDir, 'hacktivity-games-logo.svg'), 'utf8');
for (const [name, svg, drop] of [
  ['logo-labs-word.svg', labs, 'Cyber Security Labs'],   // "Hacktivity" word only
  ['logo-labs-sub.svg', labs, 'Hacktivity'],            // "Cyber Security Labs" only
  ['logo-games-sub.svg', games, 'Hacktivity'],          // "Games" only
]) {
  const out = svg.replace(group(drop), '');
  if (out === svg) throw new Error(`sync: group "${drop}" not found for ${name}`);
  fs.writeFileSync(path.join(pub, 'brand-derived', name), out);
}
fs.rmSync(path.join(pub, 'logo-hacktivity-word.svg'), { force: true });

// takes
// (real copies, not symlinks: Remotion's bundler and server do not follow links out of the project. Takes are small, ~0.2 MB/s.)
for (const f of fs.readdirSync(path.join(pub, 'takes'))) fs.rmSync(path.join(pub, 'takes', f), { force: true });
const manifest = { takes: {}, music: {} };
if (fs.existsSync(takesDir)) {
  for (const f of fs.readdirSync(takesDir)) {
    if (!/\.trimmed\.mkv$/.test(f)) continue;
    fs.copyFileSync(path.join(takesDir, f), path.join(pub, 'takes', f));
    manifest.takes[f] = true;
  }
}
// clips: general video sources (placeholders, old-trailer cuts, anything an edit names with source.type 'clip')
fs.mkdirSync(path.join(pub, 'clips'), { recursive: true });
for (const f of fs.readdirSync(path.join(pub, 'clips'))) fs.rmSync(path.join(pub, 'clips', f), { force: true });
manifest.clips = {};
for (const dir of [path.join(repo, 'tools/video/assets/placeholders'), ...(process.env.BE_CLIPS_DIR ? [process.env.BE_CLIPS_DIR] : [])]) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(mp4|mkv|mov|webm)$/i.test(f)) continue;
    fs.copyFileSync(path.join(dir, f), path.join(pub, 'clips', f));
    manifest.clips[f] = true;
  }
}
fs.writeFileSync(path.join(pub, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`sync: ${Object.keys(manifest.takes).length} take(s) in ${takesDir}, ${Object.keys(manifest.clips).length} clip(s)`);
