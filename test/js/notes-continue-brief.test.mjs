// A05: the notepad has no Continue button beside its X, except when it opens as the Mission
// Brief popup at game start. The real notes module runs against jsdom.
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

const { NotesMinigame, notesShowsContinue, showMissionBrief, startNotesMinigame } =
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

test('notesShowsContinue: only the Mission Brief popup', () => {
    assert.equal(notesShowsContinue({ missionBrief: true }), true);
    assert.equal(notesShowsContinue({}), false);
    assert.equal(notesShowsContinue({ missionBrief: 'yes' }), false);
    assert.equal(notesShowsContinue(undefined), false);
});

test('an ordinary note is built with no Continue, whatever the caller asks', () => {
    document.body.innerHTML = '<div id="mg"></div>';
    const mg = new NotesMinigame(document.getElementById('mg'), { title: 'Sticky', showCancel: true });
    assert.equal(mg.params.showCancel, false);
});

test('the Mission Brief popup is built with Continue', () => {
    document.body.innerHTML = '<div id="mg"></div>';
    const mg = new NotesMinigame(document.getElementById('mg'), { title: 'Mission Brief', missionBrief: true });
    assert.equal(mg.params.showCancel, true);
    assert.equal(mg.params.cancelText, 'Continue');
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
