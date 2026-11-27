// Loads an edit list and resolves shot presets. Every script that reads an edit list uses loadEdit() (lint, render props, mix, srt, stills, sync).
// A shot {"preset": "<name>", ...overrides} is replaced by tools/video/edits/presets/<name>.json merged shallowly (overrides win); the "preset" key is dropped.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
export const presetsDir = path.resolve(here, '../../edits/presets');
export function resolveEdit(edit, file = 'edit list') {
  if (!Array.isArray(edit.shots)) return edit;
  const shots = edit.shots.map((s, i) => {
    if (!s || typeof s.preset !== 'string') return s;
    const p = path.join(presetsDir, `${s.preset}.json`);
    if (!/^[\w-]+$/.test(s.preset) || !fs.existsSync(p)) throw new Error(`${file}: shot #${i}: unknown preset "${s.preset}" (looked for ${p})`);
    const { preset, ...over } = s;
    return { ...JSON.parse(fs.readFileSync(p, 'utf8')), ...over };
  });
  return { ...edit, shots };
}
export function loadEdit(file) { return resolveEdit(JSON.parse(fs.readFileSync(file, 'utf8')), file); }
