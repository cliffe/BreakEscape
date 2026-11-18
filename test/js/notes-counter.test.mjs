// The notes viewer counter counts notes, and says so ("Note 2 of 3"), in every place it is drawn.
// Run with: node test/js/notes-counter.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { NotesMinigame } = await import(pathToFileURL(join(js, 'minigames/notes/notes-minigame.js')).href);

const text = (m) => m.container.querySelector('.notes-minigame-counter')?.textContent;

test('counter text names what it counts', () => {
    const m = Object.create(NotesMinigame.prototype);
    m.container = document.createElement('div');
    m.container.innerHTML = '<div class="notes-minigame-counter"></div>';
    m.collectedNotes = [{}, {}, {}, {}];
    m.currentNoteIndex = 3;
    m.updateCounter();
    assert.equal(text(m), 'Note 4 of 4');
    m.currentNoteIndex = 0;
    m.updateCounter();
    assert.equal(text(m), 'Note 1 of 4');
});

test('updateNavigation builds the counter with the same wording', () => {
    const m = Object.create(NotesMinigame.prototype);
    m.container = document.createElement('div');
    m.params = {};
    m.collectedNotes = Array.from({ length: 10 }, () => ({}));
    m.currentNoteIndex = 9;
    m.updateNavigation();
    assert.equal(text(m), 'Note 10 of 10');
});
