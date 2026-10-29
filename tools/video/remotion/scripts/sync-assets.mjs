#!/usr/bin/env node
// Populates remotion/public/ (git-ignored) from the repo, so nothing is duplicated in git:
//   fonts/PressStart2P-Regular.woff2   copied from public/break_escape/assets/fonts
//   logo-hacktivity-word.svg           hacktivity-logo.svg with the "Cyber Security Labs" group removed
//   takes/<name>                       copies of video_out/m01/takes/*.trimmed.mkv (+ placeholders dir)
//   manifest.json                      which takes exist (the composition falls back to a placeholder pattern)
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
let svg = fs.readFileSync(path.join(assets, 'logos/hacktivity-logo.svg'), 'utf8');
svg = svg.replace(/<g\s+aria-label="Cyber Security Labs"[\s\S]*?<\/g>/, '');
fs.writeFileSync(path.join(pub, 'logo-hacktivity-word.svg'), svg);

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
fs.writeFileSync(path.join(pub, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`sync: ${Object.keys(manifest.takes).length} take(s) found in ${takesDir}`);
