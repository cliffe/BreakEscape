// scripts/validate_scenario.rb check_engine_limits on postitNoteVariants (ca09 post-it view):
// each variant needs a submitText, and the object must be a plain pc: no lockType, not
// locked, no triggerOnInteract.
// Run with: node --test test/js/validator-postit-note-variants.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

function issues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_engine_limits(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const has = (list, frag) => list.some(s => s.includes(frag));

const variant = { condition: 'globalVars.note_up === true', value: 'Tarrowby2468', submitText: 'You stop before signing in.' };
function scenario(objOverrides = {}, variantOverrides = {}) {
    return {
        startRoom: 'office',
        rooms: { office: { type: 'room_office', objects: [
            { type: 'pc', name: 'PC', id: 'pc1', postitNoteVariants: [{ ...variant, ...variantOverrides }], ...objOverrides }
        ] } }
    };
}

test('a plain pc with a complete variant raises none of the postit rules', { skip }, () => {
    const out = issues(scenario());
    assert.ok(!has(out, 'postitNoteVariants'), out.join('\n'));
    assert.ok(!has(out, 'submitText'), out.join('\n'));
});

test('a variant without submitText is an error', { skip }, () => {
    const noKey = scenario();
    delete noKey.rooms.office.objects[0].postitNoteVariants[0].submitText;
    assert.ok(has(issues(noKey), 'needs a non-empty submitText'));
    assert.ok(has(issues(scenario({}, { submitText: '  ' })), 'needs a non-empty submitText'));
});

test('locked: true is an error', { skip }, () => {
    assert.ok(has(issues(scenario({ locked: true })), 'postitNoteVariants and locked: true'));
});

test('a non-empty triggerOnInteract is an error, an empty one is not', { skip }, () => {
    assert.ok(has(issues(scenario({ triggerOnInteract: ['some_event'] })), 'non-empty triggerOnInteract'));
    assert.ok(!has(issues(scenario({ triggerOnInteract: [] })), 'non-empty triggerOnInteract'));
});

test('a non-pc object is an error', { skip }, () => {
    const out = issues(scenario({ type: 'notes' }));
    assert.ok(has(out, "type 'notes', not 'pc'"), out.join('\n'));
});

test('a pc with a lockType is an error', { skip }, () => {
    const out = issues(scenario({ lockType: 'login' }));
    assert.ok(has(out, "lockType 'login'"), out.join('\n'));
});
