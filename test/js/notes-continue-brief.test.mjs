// The notepad has no Continue or Cancel button beside its X, the Mission Brief popup included
// (sis01 blind playtest m1; this replaces the A05 exception). The real notes module runs against jsdom.
// Run with: node test/js/notes-continue-brief.test.mjs
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
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const { NotesMinigame, showMissionBrief, startNotesMinigame } =
    await imp('minigames/notes/notes-minigame.js');

// Records what startNotesMinigame hands the framework
function fakeFramework() {
    const started = [];
    window.MinigameFramework = {
        registeredScenes: { notes: NotesMinigame },
        mainGameScene: {},
        startMinigame: (name, _el, params) => started.push({ name, params })
    };
    return started;
}

test('an ordinary note is built with no Continue, whatever the caller asks', () => {
    document.body.innerHTML = '<div id="mg"></div>';
    const mg = new NotesMinigame(document.getElementById('mg'), { title: 'Sticky', showCancel: true });
    assert.ok(mg.params.showCancel === false, 'no bottom button on a note');
});

test('the Mission Brief popup has no Continue either: the X closes it', () => {
    document.body.innerHTML = '<div id="mg"></div>';
    const mg = new NotesMinigame(document.getElementById('mg'), { title: 'Mission Brief', missionBrief: true });
    assert.ok(mg.params.showCancel === false, 'brief built without a bottom button');
    assert.ok(NotesMinigame.keepsCancelButton === false, 'the scene never keeps a Cancel');
    mg.init();
    assert.ok(document.getElementById('minigame-cancel') === null, 'no Continue button in the DOM');
    assert.ok(!/Continue/.test(document.body.textContent), 'no Continue text anywhere');
    assert.ok(document.querySelector('.minigame-close-button, #minigame-close, .minigame-close') !== null, 'the X is present');
});

test('showMissionBrief passes missionBrief; a note opened from the world does not', () => {
    const started = fakeFramework();
    window.gameScenario = { scenario_brief: 'Get in, find the drive.' };
    showMissionBrief();
    startNotesMinigame({ scenarioData: { name: 'Sticky', text: 'hello' } }, 'hello', '');
    const notes = started.filter(s => s.name === 'notes');
    assert.equal(notes.length, 2);
    assert.equal(notes[0].params.missionBrief, true, 'the brief popup');
    assert.equal(notes[1].params.missionBrief, false, 'an ordinary note');
});

// addNote (the global the module installs on window) must not throw when the note body is
// missing. introduceScenario calls window.addNote('Mission Brief', gameScenario.scenario_brief)
// and a scenario that ships no scenario_brief passes undefined: reading text.length then threw
// (TypeError: Cannot read properties of undefined (reading 'length')) and killed the boot.
test('addNote tolerates a missing body (undefined/null) without throwing', () => {
    window.gameState = {};
    let note;
    assert.doesNotThrow(() => { note = window.addNote('Brief With No Body', undefined, false); });
    assert.equal(note.text, '', 'a missing body becomes an empty string');
    assert.doesNotThrow(() => window.addNote('Brief With Null Body', null, false));
    // a real body is still stored verbatim
    const kept = window.addNote('Brief With A Body', 'find the drive', false);
    assert.equal(kept.text, 'find the drive');
});
