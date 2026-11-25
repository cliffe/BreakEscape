import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/systems/inventory.js'), 'utf8');
const body = src.match(/export function restoreNoteFromSave\(item\) \{\n([\s\S]*?)\n\}\n/)[1];

function restore(notes) {
    const win = { gameState: { notes }, addNote: (t, b) => { notes.push({ title: t, text: b }); } };
    return new Function('window', `return function (item) {\n${body}\n};`)(win);
}

test('a reload puts a taken note in the Notepad', () => {
    const notes = [];
    assert.equal(restore(notes)({ type: 'notes1', name: 'Note: records safe', text: 'PIN here' }), true);
    assert.equal(notes.length, 1);
});

test('a reload does not add a note that was never meant for the Notepad (addToNotes false)', () => {
    const notes = [];
    assert.equal(restore(notes)({ type: 'notes1', name: 'Case papers', text: 'Nothing', addToNotes: false }), false);
    assert.equal(notes.length, 0);
});
