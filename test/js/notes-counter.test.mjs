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

// R1 follow-ups

import { readFileSync } from 'node:fs';
const src = readFileSync(join(js, 'minigames/notes/notes-minigame.js'), 'utf8');
const mk = (n) => Array.from({ length: n }, (_, i) => ({ id: i, title: `T${i}`, text: i % 2 ? `odd ${i}` : `even ${i}`, timestamp: i }));

function open(params, notes) {
    document.body.innerHTML = '<div id="mg"></div>';
    window.gameState = { notes };
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.playUISound = () => {};
    const m = new NotesMinigame(document.getElementById('mg'), params);
    m.init();
    m.start();
    return m;
}

test('navigateToNote(1) moves on and the counter follows', () => {
    const m = Object.create(NotesMinigame.prototype);
    m.container = document.createElement('div');
    m.container.innerHTML = '<div class="notes-minigame-counter"></div>';
    m.params = {};
    m.collectedNotes = mk(3);
    m.currentNoteIndex = 0;
    m.playPageTurnSound = () => {};
    m.updateDisplayedNote = () => {};
    m.navigateToNote(1);
    assert.equal(text(m), 'Note 2 of 3');
    m.navigateToNote(-1);
    m.navigateToNote(-1);
    assert.equal(text(m), 'Note 3 of 3', 'wraps round');
});

test('every counter write goes through noteCounterText or the counterText helper', () => {
    const writes = src.match(/noteCounter\.textContent = .*/g) || [];
    assert.ok(writes.length >= 1);
    for (const w of writes) assert.ok(/noteCounterText\(|this\.counterText\(/.test(w), w);
    assert.match(src, /return noteCounterText\(/);
});

test('search counts matches, widens on backspace, and says No match', () => {
    const m = open({ title: 'Notepad', noteContent: '', item: { scenarioData: { type: 'notepad', name: 'Notepad' } } }, mk(6));
    assert.equal(text(m), 'Note 1 of 6');
    m.searchNotes('odd');
    assert.equal(text(m), 'Match 1 of 3');
    m.searchNotes('odd 1');
    assert.equal(text(m), 'Match 1 of 1');
    m.searchNotes('odd');
    assert.equal(text(m), 'Match 1 of 3', 'backspacing widens the matches');
    m.searchNotes('zzz');
    assert.equal(text(m), 'No match');
    assert.equal(m.collectedNotes.length, 3, 'the page is left alone');
    m.searchNotes('');
    assert.equal(text(m), 'Note 1 of 6');
});

test('the nav row sits straight under the notepad, in the game container column', () => {
    const m = open({ title: 'Notepad', noteContent: '', item: { scenarioData: { type: 'notepad', name: 'Notepad' } } }, mk(3));
    const nav = m.container.querySelector('.notes-minigame-nav-container');
    assert.equal(nav.previousElementSibling, m.gameContainer);
});

test('a filed item (autoAddToNotes false) is not added and its own page stays', () => {
    const notes = mk(3);
    const item = { scenarioData: { type: 'text_file', name: 'Filed page', text: 'filed body' } };
    const m = open({ title: 'Filed page', item, noteContent: 'filed body', observationText: '', autoAddToNotes: false, navigateToNote: null }, notes);
    assert.equal(notes.length, 3, 'notes unchanged');
    assert.equal(window.gameState.notes.length, 3);
    assert.equal(m.container.querySelector('.notes-minigame-title').textContent, 'Filed page');
    assert.match(m.container.querySelector('.notes-minigame-text').textContent, /filed body/);
    assert.equal(m.container.querySelector('.notes-minigame-counter'), null, 'no counter for a page outside the list');
});

test('autoAddToNotes defaults on and honours false', () => {
    const on = open({ title: 'x', noteContent: 'x' }, []);
    assert.equal(on.autoAddToNotes, true);
    const off = open({ title: 'x', noteContent: 'x', autoAddToNotes: false }, []);
    assert.equal(off.autoAddToNotes, false);
});
