// view-texts.js (Ops S6 unit 02): every fixed text the scene exports, with the same name and value.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { scene } from './support/network-view-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, '../../public/break_escape/js/minigames/network-view/view-texts.js');
const T = await import(pathToFileURL(file));

test('the module imports nothing and names no DOM', () => {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /^\s*import\s/m);
    assert.doesNotMatch(text, /\bdocument\.|\bwindow\.|innerHTML/);
});

test('every export equals the scene\'s export of the same name', () => {
    const names = Object.keys(T).filter(n => n !== 'COMPROMISED_TEXT');
    assert.ok(names.length >= 30);
    for (const n of names) {
        assert.equal(typeof T[n], typeof scene[n], n);
        if (typeof T[n] === 'function') {
            for (const args of [[], ['a'], ['a', 'b'], ['share'], ['host'], ['', 'who']]) assert.equal(T[n](...args), scene[n](...args), `${n}(${args})`);
        } else {
            assert.equal(T[n], scene[n], n);
        }
    }
});

test('the scene\'s exported text constants are all here', () => {
    const missing = Object.keys(scene).filter(n => /(_TEXT|_TAG|_LABEL|_HEADING)$|Text$/.test(n) && !(n in T));
    assert.deepEqual(missing, ['MORE_BELOW_TEXT']);
});
