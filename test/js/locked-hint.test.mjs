// lockedHint on the wrong-key paths (SE lab F17 / audit M7): a door with a hint appends it to the
// "Wrong Key" alert; a door without one keeps the old text exactly. Imports the real util; the
// starter and unlock system are checked at source level (they need Phaser to import).
// Run with: node --test test/js/locked-hint.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const js = join(root, 'public/break_escape/js');
// The real file, copied into an ESM folder (the repo has no "type": "module").
const dir = mkdtempSync(join(tmpdir(), 'locked-hint-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(dir, 'locked-hint.js'), readFileSync(join(js, 'utils/locked-hint.js'), 'utf8'));
const { getLockedHint, withLockedHint } = await import(pathToFileURL(join(dir, 'locked-hint.js')));
const WRONG = 'The selected key doesn\'t work with this lock.';

test('hint is read from the door, door properties, scenario data or properties', () => {
    assert.equal(getLockedHint({ lockedHint: 'a' }), 'a');
    assert.equal(getLockedHint({ doorProperties: { lockedHint: 'b' } }), 'b');
    assert.equal(getLockedHint({ scenarioData: { lockedHint: 'c' } }), 'c');
    assert.equal(getLockedHint({ properties: { lockedHint: 'd' } }), 'd');
});

test('a lockable with a hint gets it appended to the wrong-key text', () => {
    const door = { doorProperties: { lockedHint: 'Ask the facilities lead.' } };
    assert.equal(withLockedHint(WRONG, door), `${WRONG} Ask the facilities lead.`);
});

test('without a hint the text is exactly as before', () => {
    for (const l of [{}, { doorProperties: {} }, { doorProperties: { lockedHint: null } },
        { doorProperties: { lockedHint: '' } }, { doorProperties: { lockedHint: 5 } }, null, undefined]) {
        assert.equal(withLockedHint(WRONG, l), WRONG);
        assert.equal(getLockedHint(l), '');
    }
});

test('both Wrong Key alerts in the key starter go through the hint helper', () => {
    const src = readFileSync(join(js, 'systems/minigame-starters.js'), 'utf8');
    assert.match(src, /withLockedHint\('The selected key doesn\\'t work with this lock\.', lockable\)[^;]*'Wrong Key', 4000/);
    assert.match(src, /withLockedHint\('None of your keys work with this lock\.', lockable\)[^;]*'Wrong Keys', 4000/);
    assert.match(src, /import \{ withLockedHint \} from '\.\.\/utils\/locked-hint\.js'/);
});
