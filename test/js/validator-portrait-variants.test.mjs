// scripts/validate_scenario.rb: NPC portraitVariants (utils/portrait-variants.js) and the
// `# portrait:<name>` ink tag. Inline fixture plus a throwaway ink file.
// Run with: node --test test/js/validator-portrait-variants.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);

// The ink must sit under the repo root (storyPath is repo-relative); tmp/ is git-ignored.
const inkDir = mkdtempSync(join(root, 'tmp', 'portrait-variants-'));
writeFileSync(join(inkDir, 'torres.ink'), '=== start ===\nHi. # portrait:ko\nNo. # portrait:base\nEh. # portrait:missing\n-> END\n');
const storyPath = relative(root, join(inkDir, 'torres.json'));
test.after(() => rmSync(inkDir, { recursive: true, force: true }));

const existing = 'assets/characters/male_nerd_talk.png';
const scenario = {
  globalVariables: { torres_ko: false },
  rooms: {
    lab: {
      npcs: [{
        id: 'david_torres', npcType: 'person', storyPath,
        portraitVariants: [
          { name: 'ko', ko: true, spriteTalk: existing, condition: 'globalVars.torres_ko || globalVars.torres_ko' },
          { name: 'ko', condition: 'globalVars.undeclared_one', spriteTalk: 'assets/characters/nope_talk.png' },
          { spriteTalk: existing },
          { name: 'odd', ko: 'yes', colour: 'red' },
          { name: 'base', ko: false, avatar: existing }
        ]
      }]
    }
  }
};

const run = (method) => {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    puts JSON.generate(${method})`;
  const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
};

test('portraitVariants entries are checked, and # portrait tags must name one',
  { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const issues = run(`check_recurring_bugs(JSON.parse(STDIN.read), ${JSON.stringify(root)})`)
      .filter(s => s.includes('portrait'));
    const has = (re) => assert.ok(issues.some(s => re.test(s)), `expected ${re} in:\n${issues.join('\n')}`);
    has(/portraitVariants\[1\] name 'ko' is used twice/);
    has(/portraitVariants\[1\] condition uses globalVars\.undeclared_one/);
    has(/portraitVariants\[1\] spriteTalk 'assets\/characters\/nope_talk\.png' does not exist/);
    has(/portraitVariants\[2\] has no condition, ko or name/);
    has(/portraitVariants\[3\] has unknown field 'colour'/);
    has(/portraitVariants\[3\] ko should be true/);
    has(/portraitVariants\[3\] sets none of spriteTalk/);
    has(/portraitVariants\[4\] name 'base' is reserved/);
    has(/# portrait:missing names no portraitVariants entry "missing"/);
    assert.ok(!issues.some(s => /portraitVariants\[0\]/.test(s)), `variant 0 is valid:\n${issues.join('\n')}`);
    assert.ok(!issues.some(s => /# portrait:(ko|base) names/.test(s)), `ko and base are fine:\n${issues.join('\n')}`);
  });

test("'||' in a portraitVariants condition is allowed (global-condition.js)",
  { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const issues = run('check_or_in_global_conditions(JSON.parse(STDIN.read))');
    assert.deepEqual(issues.filter(s => s.includes('portraitVariants')), []);
  });

test('portraitVariants is a known NPC field', { skip: ruby.status !== 0 && 'ruby not found' }, () => {
  const src = spawnSync('grep', ['-c', 'gender portraitVariants _comment', join(root, 'scripts/validate_scenario.rb')], { encoding: 'utf8' });
  assert.equal(src.stdout.trim(), '1');
});
