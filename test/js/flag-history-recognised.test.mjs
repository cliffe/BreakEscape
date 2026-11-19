// Key-type flags (hintOnlyFlags) the station recognises are listed in the submitted list,
// marked as keys for another device; consumed flags keep their tick.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { flagHistoryHtml } = await import(pathToFileURL(join(root, 'public/break_escape/js/utils/flag-wording.js')).href);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

test('an empty list says nothing submitted yet', () => {
    assert.match(flagHistoryHtml([], [], esc), /No flags submitted yet/);
    assert.match(flagHistoryHtml(undefined, undefined, esc), /No flags submitted yet/);
});

test('a recognised key flag shows in the list, not as a tick', () => {
    const html = flagHistoryHtml([], [{ flag: 'flag{key}', note: 'Decryption Key validated' }], esc);
    assert.doesNotMatch(html, /No flags submitted yet/);
    assert.match(html, /flag\{key\}/);
    assert.match(html, /flag-recognised/);
    assert.match(html, /Valid key, use elsewhere/);
    assert.match(html, /title="Decryption Key validated"/);
    assert.doesNotMatch(html, /DONE/);
});

test('consumed flags keep the tick and come first; a flag in both lists shows once', () => {
    const html = flagHistoryHtml(['flag{a}'], [{ flag: 'flag{k}', note: '' }, { flag: 'flag{a}', note: '' }], esc);
    assert.equal((html.match(/<li /g) || []).length, 2);
    assert.ok(html.indexOf('flag{a}') < html.indexOf('flag{k}'));
    assert.match(html, /DONE/);
});

test('flag and note text is escaped', () => {
    const html = flagHistoryHtml([], [{ flag: '<b>x</b>', note: 'a"b' }], esc);
    assert.doesNotMatch(html, /<b>/);
    assert.match(html, /a&quot;b/);
});

test('the minigame wires the helper and records recognised flags per station', () => {
    const src = readFileSync(join(root, 'public/break_escape/js/minigames/flag-station/flag-station-minigame.js'), 'utf8');
    assert.match(src, /flagHistoryHtml\(this\.submittedFlags, this\.recognisedFlags/);
    assert.match(src, /stationRecognisedFlags/);
});
