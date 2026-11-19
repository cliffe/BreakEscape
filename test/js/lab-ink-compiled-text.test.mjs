// Guards two ink pitfalls in the compiled lab ink: `//` read as a comment cuts a URL to
// "http:", and a leading `**Heading:**` is parsed as a choice whose text ends in ":**".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const scenariosDir = path.join(root, 'scenarios');

function* strings(node) {
  if (typeof node === 'string') { yield node; return; }
  if (Array.isArray(node)) { for (const n of node) yield* strings(n); return; }
  if (node && typeof node === 'object') { for (const v of Object.values(node)) yield* strings(v); }
}

// Text of every choice: ink stores the start-content of a choice in an object's "s" array.
function* choiceTexts(node) {
  if (Array.isArray(node)) { for (const n of node) yield* choiceTexts(n); return; }
  if (node && typeof node === 'object') {
    if (Array.isArray(node.s)) yield* strings(node.s);
    for (const v of Object.values(node)) yield* choiceTexts(v);
  }
}

const files = [];
for (const dir of fs.readdirSync(scenariosDir)) {
  if (!dir.startsWith('lab_')) continue;
  const inkDir = path.join(scenariosDir, dir, 'ink');
  if (!fs.existsSync(inkDir)) continue;
  for (const f of fs.readdirSync(inkDir)) {
    if (f.endsWith('.json')) files.push(path.join(inkDir, f));
  }
}

test('lab ink JSON files were found', () => {
  assert.ok(files.length > 0);
});

for (const file of files) {
  const rel = path.relative(root, file);
  test(`${rel}: no truncated URL and no ":**" heading text`, () => {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const s of strings(data)) {
      if (!s.startsWith('^')) continue;
      assert.ok(!/https?:\s*$/.test(s), `truncated URL (a "//" read as an ink comment): ${JSON.stringify(s)}`);
    }
    for (const s of choiceTexts(data)) {
      assert.ok(!/:\*\*\s*$/.test(s), `heading parsed as a choice (leading "**"): ${JSON.stringify(s)}`);
    }
  });
}
