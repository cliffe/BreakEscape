// titleScreenName is read by the server (show.html.erb) and by the title screen, so the schema (the
// validator's one list of known keys) must know it (it used to warn "will be ignored by the game engine").
// Run with: node --test test/js/validator-title-screen-name.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('the scenario schema declares titleScreenName as a string of at most 80 characters', () => {
    const schema = JSON.parse(readFileSync(join(root, 'scripts/scenario-schema.json'), 'utf8'));
    const p = schema.properties.titleScreenName;
    assert.equal(p.type, 'string');
    assert.equal(p.maxLength, 80);
});

test('the validator knows titleScreenName as a top-level field', { skip: spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found' }, () => {
    // The unknown-key check reads the schema (no hand list), so a declared field never warns.
    const script = `$PROGRAM_NAME = 'x'
require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
puts JSON.generate(check_unknown_fields(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify({ titleScreenName: 'Title', rooms: {} }),
        encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const issues = JSON.parse(r.stdout.trim().split('\n').pop());
    assert.ok(!issues.some(s => s.includes('titleScreenName')), issues.join('\n'));
});
