// The Panels skin's drawing, pinned (Ops S6 unit 01). Each fixture view answer in
// test/js/fixtures/network-view/ is mounted through the real scene; the DOM must equal the saved
// string byte for byte, and each control's press must record the saved call (requests, opened
// screens, toasts, events) with the same DOM while its answer is held. The unplug button's held
// and refused states, the select-then-Use and drag sequences, and the recorded views of the
// existing scenarios (fixtures/network-view/unchanged/) are pinned the same way.
//
// The snapshots were taken on a tree with no engine change. After the Panels split (unit 04) this
// file passes UNEDITED: a difference is a bug in the split, never a reason to record again.
// Run with: node test/js/network-view-panels-same.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURE_DIR, VARIANTS, snapshotVariant, unchangedCases, snapshotUnchanged, fixtureNames, loadFixture } from './support/network-view-harness.mjs';

const BEFORE = join(FIXTURE_DIR, 'panels-before');
const UNCHANGED = join(FIXTURE_DIR, 'unchanged');
const read = (path) => {
    assert.ok(existsSync(path), `the saved snapshot ${path} is missing`);
    return readFileSync(path, 'utf8');
};

test('the fixtures hold no real identifier and each is a GET /network body', () => {
    const real = /CVE-\d{4}-\d+|exploit\/|auxiliary\/|msf/i;
    for (const name of fixtureNames()) {
        const text = readFileSync(join(FIXTURE_DIR, `${name}.json`), 'utf8');
        assert.ok(!real.test(text), name);
        assert.ok(Array.isArray(loadFixture(name).footholds), name);
    }
});

for (const variant of VARIANTS) {
    test(`Panels, ${variant.name}: the DOM and every press match the saved snapshot`, async () => {
        const { dom, data } = await snapshotVariant(variant);
        assert.equal(dom, read(join(BEFORE, `${variant.name}.html`)), 'the mounted DOM');
        assert.deepEqual(data, JSON.parse(read(join(BEFORE, `${variant.name}.json`))), 'the recorded presses');
    });
}

test('unchanged scenarios: each recorded network view draws as saved', async () => {
    const cases = unchangedCases();
    assert.ok(cases.length > 0, 'the folder has views to compare');
    for (const c of cases) {
        assert.equal(await snapshotUnchanged(c), read(join(UNCHANGED, `${c.key}.html`)), c.key);
    }
});
