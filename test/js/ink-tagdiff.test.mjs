// Structure diff for ink files (tags, knots, vars, diverts, choice conditions; prose ignored).
// Run with: node test/js/ink-tagdiff.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const tool = join(root, 'scripts/ink_runtime_check/tagdiff.mjs');
const { compareTexts } = await import(tool);

const BASE = `INCLUDE other.ink
EXTERNAL player_name()
VAR trust = 0
CONST LIMIT = 3
=== start ===
Gary: Hello there. #speaker:gary
* [Ask nicely]
    ~ trust += 5
    You: Please.
    -> ask
+ {trust > 2} [Push]
    -> END
=== ask ===
{ trust > 3:
    Gary: Fine. #give_item:keycard:door
- else:
    Gary: No.
}
{
- trust > 9:
    Gary: Wow.
- else:
    Gary: Meh.
}
= extra
Gary: More. #exit_conversation
-> DONE
`;

const cats = r => r.differences.map(d => d.type[0] + ':' + d.category);

test('identical text has no differences', () => {
    assert.equal(compareTexts(BASE, BASE).differences.length, 0);
});

test('prose-only edits are ignored but counted', () => {
    const edited = BASE.replace('Hello there.', 'Well, hello.').replace('Gary: No.', 'Gary: Not a chance.')
        .replace('You: Please.', 'You: If you would.');
    const r = compareTexts(BASE, edited);
    assert.equal(r.differences.length, 0);
    assert.equal(r.prose.changed, 3);
    assert.equal(r.prose.oldYou, 1);
    assert.equal(r.prose.newYou, 1);
});

test('a tag change is reported with its new line number', () => {
    const r = compareTexts(BASE, BASE.replace('keycard:door', 'keycard:vault'));
    assert.deepEqual(cats(r).sort(), ['a:tag', 'r:tag']);
    const added = r.differences.find(d => d.type === 'added');
    assert.equal(added.line, 15);
    assert.match(added.item, /keycard:vault/);
});

test('whitespace inside a tag is normalised', () => {
    assert.equal(compareTexts(BASE, BASE.replace('#speaker:gary', '# speaker: gary')).differences.length, 0);
});

test('choice condition, divert target and sticky/once changes are structural', () => {
    assert.deepEqual(cats(compareTexts(BASE, BASE.replace('{trust > 2}', '{trust > 3}'))).sort(),
        ['a:choice', 'r:choice']);
    assert.deepEqual(cats(compareTexts(BASE, BASE.replace('-> ask', '-> start'))).sort(),
        ['a:choice', 'a:divert', 'r:choice', 'r:divert']);
    const r = compareTexts(BASE, BASE.replace('+ {trust > 2}', '* {trust > 2}'));
    assert.ok(cats(r).includes('a:choicecount'));
    assert.ok(cats(r).includes('a:choice'));
});

test('declarations, assignments, knots, stitches and includes are compared', () => {
    assert.deepEqual(cats(compareTexts(BASE, BASE.replace('VAR trust = 0', 'VAR trust = 1'))).sort(), ['a:var', 'r:var']);
    assert.deepEqual(cats(compareTexts(BASE, BASE.replace('trust += 5', 'trust += 6'))).sort(), ['a:assign', 'r:assign']);
    // the stitch's own tag and divert move to the new context too
    assert.deepEqual(cats(compareTexts(BASE, BASE.replace('= extra', '= more'))).filter(c => c.endsWith('stitch')).sort(), ['a:stitch', 'r:stitch']);
    assert.deepEqual(cats(compareTexts(BASE, BASE.replace('=== ask ===', '=== question ==='))).filter(c => c.endsWith('knot')).sort(),
        ['a:knot', 'r:knot']);
    assert.deepEqual(cats(compareTexts(BASE, BASE.replace('INCLUDE other.ink', 'INCLUDE another.ink'))).sort(), ['a:include', 'r:include']);
    assert.deepEqual(cats(compareTexts(BASE, BASE.replace('EXTERNAL player_name()', 'EXTERNAL player_name(x)'))).sort(), ['a:external', 'r:external']);
});

test('inline and multi-line conditional conditions are compared', () => {
    assert.deepEqual(cats(compareTexts(BASE, BASE.replace('{ trust > 3:', '{ trust > 4:'))).sort(), ['a:condition', 'r:condition']);
    assert.deepEqual(cats(compareTexts(BASE, BASE.replace('- trust > 9:', '- trust > 8:'))).sort(), ['a:condition', 'r:condition']);
});

test('removed tags and deleted lines are reported as removals', () => {
    const r = compareTexts(BASE, BASE.replace(' #exit_conversation', ''));
    assert.deepEqual(cats(r), ['r:tag']);
    assert.equal(r.differences[0].oldLine, 26);
});

test('CLI: identical files report STRUCTURE UNCHANGED, exit 0', () => {
    // Compares two copies of a fixed fixture, not live mission ink: mission ink is
    // edited between commits, and a test against HEAD would fail whenever it is.
    const dir = mkdtempSync(join(tmpdir(), 'tagdiff-'));
    try {
        writeFileSync(join(dir, 'a.ink'), BASE);
        writeFileSync(join(dir, 'b.ink'), BASE.replace(/\bthe\b/, 'the'));
        const r = spawnSync('node', [tool, '--old', join(dir, 'a.ink'), join(dir, 'b.ink')], { cwd: root, encoding: 'utf8' });
        assert.equal(r.status, 0, r.stdout + r.stderr);
        assert.match(r.stdout, /STRUCTURE UNCHANGED/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('CLI: --old exits 1 and --json is parseable', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tagdiff-'));
    try {
        writeFileSync(join(dir, 'a.ink'), BASE);
        writeFileSync(join(dir, 'b.ink'), BASE.replace('keycard:door', 'keycard:vault'));
        const r = spawnSync('node', [tool, '--json', '--old', join(dir, 'a.ink'), join(dir, 'b.ink')], { encoding: 'utf8' });
        assert.equal(r.status, 1);
        const j = JSON.parse(r.stdout);
        assert.equal(j.differenceCount, 2);
        assert.equal(j.unchanged, false);
        const text = spawnSync('node', [tool, '--old', join(dir, 'a.ink'), join(dir, 'b.ink')], { encoding: 'utf8' });
        assert.match(text.stdout, /2 structural differences/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
});
