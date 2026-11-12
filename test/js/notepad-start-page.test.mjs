// The notepad opens on a note added since it was last looked at (UX devices R1, shot 04:
// a fact just noted was on page 3 while the notepad opened on page 1), else on the page last
// shown. notepadStartIndex is cut out of notes-minigame.js (the rest needs Phaser).
// Run with: node --test test/js/notepad-start-page.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const src = readFileSync(join(js, 'minigames/notes/notes-minigame.js'), 'utf8');
const start = src.indexOf('const notepadMemory');
const end = src.indexOf("if (typeof window !== 'undefined') {\n    window.notepadStartIndex");
assert.ok(start > 0 && end > start, 'notepadStartIndex block found');
const mod = await import('data:text/javascript,' + encodeURIComponent(src.slice(start, end)));
const { notepadStartIndex } = mod;
const notes = (n) => Array.from({ length: n }, (_, i) => ({ id: i }));

test('a note added since the notepad was last shown: open on the newest', () => {
    assert.equal(notepadStartIndex(notes(3), { seenCount: 2, lastIndex: 0 }), 2);
    assert.equal(notepadStartIndex(notes(3), { seenCount: 0, lastIndex: 0 }), 2, 'never opened (or after a reload)');
});

test('nothing new: the page last shown, clamped to the list', () => {
    assert.equal(notepadStartIndex(notes(3), { seenCount: 3, lastIndex: 1 }), 1);
    assert.equal(notepadStartIndex(notes(3), { seenCount: 5, lastIndex: 7 }), 0);
});

test('no notes: page 0', () => {
    assert.equal(notepadStartIndex([], { seenCount: 0, lastIndex: 0 }), 0);
    assert.equal(notepadStartIndex(undefined), 0);
});

test('the tray notepad asks for its start page, and the notepad item has a real picture', () => {
    const inter = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    assert.match(inter, /startNotesMinigame\(notepadItem, '', '', window\.notepadStartIndex\?\.\(\) \?\? 0/);
    const inv = readFileSync(join(js, 'systems/inventory.js'), 'utf8');
    assert.match(inv, /sprite: 'notes5'/);
});
