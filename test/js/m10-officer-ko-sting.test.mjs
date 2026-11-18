// m10 carries m08's two duty-officer knock-downs (julian_ko, agnieszka_ko) into the same
// Tesseract "put someone on the floor" sting as the other bystanders (D151 option b).
// Run with: node --test test/js/m10-officer-ko-sting.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const Story = inkjs.Story || inkjs.default.Story;
const json = readFileSync(join(root, 'scenarios/m10_full_disclosure/ink/m10_tesseract.json'), 'utf8');

function sting(vars) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString('ko_sting');
    const lines = [];
    try {
        while (s.canContinue) lines.push(s.Continue().trim());
    } catch (e) { /* the knot ends in a tunnel return with no caller; the lines are already read */ }
    return lines.filter(Boolean);
}

const ONCE = /put someone on the floor who wasn't armed\. Once\./;

test('neither officer knocked down: no line', () => {
    assert.deepEqual(sting({}), []);
});

test('only julian_ko: the one-time sting plays', () => {
    const l = sting({ m08_julian_ko: true });
    assert.equal(l.length, 1);
    assert.match(l[0], ONCE);
});

test('only agnieszka_ko: the one-time sting plays', () => {
    const l = sting({ m08_agnieszka_ko: true });
    assert.equal(l.length, 1);
    assert.match(l[0], ONCE);
});

test('both officers count as one mission, not two', () => {
    const l = sting({ m08_julian_ko: true, m08_agnieszka_ko: true });
    assert.equal(l.length, 1);
    assert.match(l[0], ONCE);
});
