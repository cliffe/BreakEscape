// scripts/validate_scenario.rb check_retired_keys (hardening step 7).
// A rendered template carries current field names and no formatVersion. The validator errors on a
// template that sets formatVersion and on any retired key (renamed by a FormatUpgrade step), unless
// an alias keeps it for a deployed scenario (a warning). Author notes are skipped.
// Run with: node --test test/js/validator-retired-keys.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

// inject is a Ruby snippet run after the require and before the call (to push fixture steps/aliases).
function issues(scenario, inject = '') {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      ${inject}
      puts JSON.generate(check_retired_keys(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

const oneStep = `BreakEscape::FormatUpgrade::STEPS.concat([{version:1,name:"r",` +
    `scenario:->(d){},player_state:->(s){},retired:[{path:nil,key:"downIf",now:"offWhen"}]}])`;

test('no steps and no formatVersion: no issues', { skip }, () => {
    assert.deepEqual(issues({ rooms: { a: { resources: { net: { downIf: 'g' } } } } }), []);
});

test('a retired key is one error naming the new name', { skip }, () => {
    const out = issues({ rooms: { a: { resources: { net: { downIf: 'g' } } } } }, oneStep);
    assert.equal(out.length, 1);
    assert.match(out[0], /ERROR:.*downIf.*renamed to 'offWhen' in format 1/);
});

test('a retired key inside an author note is not reported', { skip }, () => {
    const out = issues({ rooms: { a: { _draft: { resources: { net: { downIf: 'g' } } } } } }, oneStep);
    assert.deepEqual(out, []);
});

test('a template that sets formatVersion is an error', { skip }, () => {
    const out = issues({ formatVersion: 0, rooms: {} });
    assert.equal(out.length, 1);
    assert.match(out[0], /ERROR:.*formatVersion.*server stamps formatVersion at creation/);
});

test('an aliased retired key is a warning, not an error', { skip }, () => {
    const alias = oneStep +
        `\nmodule BreakEscape; module FormatUpgrade; def self.aliased?(k); k == "downIf"; end; end; end`;
    const out = issues({ rooms: { a: { resources: { net: { downIf: 'g' } } } } }, alias);
    assert.equal(out.length, 1);
    assert.match(out[0], /WARNING:.*downIf.*alias/);
});
