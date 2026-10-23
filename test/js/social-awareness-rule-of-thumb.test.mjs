// aw4 (FUN_DECISIONS): one rule of thumb, identical in every awareness shell's debrief
// (social.awareness.ruleOfThumb, shown above the Monday card by debrief-view.js). The four shell
// generators read it from awareness_deploy.py; the seven full episodes carry the same literal by
// hand. This test is the single guard that all 38 shells still agree, so a change to the text must
// be made in both places or this fails.
// Run with: node --test test/js/social-awareness-rule-of-thumb.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const scenarios = join(root, 'scenarios');

const shells = readdirSync(scenarios, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith('awareness_'))
  .map((d) => d.name)
  .sort();

test('every awareness shell exists (38) and carries social.awareness.ruleOfThumb', () => {
  assert.equal(shells.length, 38, `expected 38 awareness shells, found ${shells.length}`);
  const seen = new Set();
  for (const name of shells) {
    const j = JSON.parse(readFileSync(join(scenarios, name, 'scenario.json.erb'), 'utf8'));
    const rule = j?.social?.awareness?.ruleOfThumb;
    assert.ok(rule && typeof rule.text === 'string' && rule.text.trim().length > 0,
      `${name}: social.awareness.ruleOfThumb.text is missing or empty`);
    seen.add(JSON.stringify(rule));
  }
  assert.equal(seen.size, 1, `the rule of thumb is not identical across shells: ${[...seen].map((t) => t.slice(0, 50)).join(' | ')}`);
});
