// A game with no scenario_brief gets no empty "Mission Brief" note and no brief popup;
// a game with a brief still gets both. Runs the real helpers module against jsdom.
// Run with: node test/js/introduce-scenario-no-brief.test.mjs
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

const { introduceScenario } = await import(pathToFileURL(join(js, 'utils/helpers.js')).href);

function setup(scenario) {
    const notes = [];
    const briefs = [];
    window.gameScenario = scenario;
    window.breakEscapeConfig = {};
    window.gameState = {};
    window.addNote = (title, text) => notes.push({ title, text });
    window.showMissionBrief = () => briefs.push(true);
    window.MinigameFramework = { currentMinigame: null };
    window.npcManager = undefined;
    return { notes, briefs };
}

for (const [label, brief] of [['missing', undefined], ['null', null], ['empty', ''], ['blank', '   \n'], ['not a string', 42]]) {
    test(`no Mission Brief note or popup when the brief is ${label}`, async () => {
        const scenario = { show_scenario_brief: 'always' };
        if (brief !== undefined) scenario.scenario_brief = brief;
        const { notes, briefs } = setup(scenario);
        introduceScenario();
        await new Promise(r => setTimeout(r, 700));
        assert.deepEqual(notes, []);
        assert.deepEqual(briefs, []);
    });
}

test('a real brief is still added to the Notepad and shown', async () => {
    const { notes, briefs } = setup({ show_scenario_brief: 'always', scenario_brief: 'Get in, find the drive.' });
    introduceScenario();
    assert.deepEqual(notes, [{ title: 'Mission Brief', text: 'Get in, find the drive.' }]);
    await new Promise(r => setTimeout(r, 700));
    assert.equal(briefs.length, 1);
});
