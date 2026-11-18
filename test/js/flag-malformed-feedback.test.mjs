// A flag that is not shaped like flag{...} is refused with a line saying what a
// flag looks like; every other refusal keeps its wording.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const F = await import(pathToFileURL(join(root, 'public/break_escape/js/utils/flag-wording.js')).href);

test('looksLikeFlag accepts flag{...} and rejects other shapes', () => {
    for (const ok of ['flag{abc}', ' FLAG{x_y-1} ', 'flag{m09_catalogue_index}']) assert.equal(F.looksLikeFlag(ok), true, ok);
    for (const bad of ['', 'abc', 'not a flag', 'flag{', 'flag{}', 'flag}abc{', 'lag{abc}', null, undefined]) {
        assert.equal(F.looksLikeFlag(bad), false, String(bad));
    }
});

test('a malformed value gets the format line, never a silent or generic one', () => {
    for (const typed of ['abc', 'not a flag', 'flag{unclosed']) {
        const line = F.flagRefusalLine('Invalid flag', { flagValue: typed });
        assert.match(line, /^✗ Flag not accepted\. A flag looks like flag\{\.\.\.\}/);
        assert.ok(line.length > 20);
    }
});

test('a well-formed wrong flag keeps the copied-in-full line', () => {
    assert.match(F.flagRefusalLine('Invalid flag', { flagValue: 'flag{not-a-real-flag}' }), /copied in full/);
    assert.match(F.flagRefusalLine('Invalid flag'), /copied in full/);
});

test('wrong-station and already-submitted lines are unchanged by the typed value', () => {
    assert.match(F.flagRefusalLine('Incorrect flag', { reason: 'wrong_station', flagValue: 'oops' }), /different machine/);
    assert.equal(F.flagRefusalLine('Flag already submitted', { flagValue: 'oops' }), '✗ Flag already submitted');
});

test('the station passes what was typed on both refusal paths', () => {
    const src = readFileSync(join(root, 'public/break_escape/js/minigames/flag-station/flag-station-minigame.js'), 'utf8');
    assert.equal((src.match(/flagRefusalLine\([^)]*flagValue/g) || []).length, 3);
});
