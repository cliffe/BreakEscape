// F22: reloading a concluded game must rebuild the story credits from the saved
// globals, not open the end screen empty.
// Run with: node --test test/js/ending-replay-credits.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const seq = await import(dataUrl(read('music/closing-sequence.js')));
globalThis.window = {};
const om = await import(dataUrl(read('systems/objectives-manager.js')));

// The same shape m10 uses: a global-triggered entry per ending, gated on globalVars.
const events = [
    { trigger: 'game_loaded', playlist: 'x' },
    { trigger: 'global_variable_changed:night_closed', condition: "value === true && globalVars.ending === 'arrest'",
      closingCard: { lines: [{ text: 'Tesseract: in a cell.' }] },
      credits: [{ text: 'MISSION COMPLETE', style: 'title' },
                { section: 'IN THIS OPERATION', people: [{ name: 'AGENT 0x00', clauses: [
                    { text: 'Brought him in.', condition: "globalVars.ending === 'arrest'" }] }] }] },
    { trigger: 'global_variable_changed:night_closed', condition: "value === true && globalVars.ending === 'lethal'",
      credits: [{ text: 'MISSION COMPLETE', style: 'title' }, { text: 'He never put the key down.' }] },
];
// A tiny evaluator like scenario-music-events.js's.
const test_ = (cond, data) => new Function('globalVars', ...Object.keys(data), `return (${cond});`)(globals, ...Object.values(data));
let globals = {};

test('replayEndingEntry picks the ending the globals describe, with card and credits', () => {
    globals = { night_closed: true, ending: 'arrest' };
    const r = seq.replayEndingEntry(events, globals, test_);
    assert.deepEqual(r.sequence.map(s => s.text),
        ['Tesseract: in a cell.', 'MISSION COMPLETE', 'IN THIS OPERATION', 'AGENT 0x00: Brought him in.']);
    globals = { night_closed: true, ending: 'lethal' };
    assert.equal(seq.replayEndingEntry(events, globals, test_).sequence[1].text, 'He never put the key down.');
});

test('replayEndingEntry returns null when no ending holds', () => {
    globals = { ending: 'arrest' };
    assert.equal(seq.replayEndingEntry(events, globals, test_), null);
    assert.equal(seq.replayEndingEntry([], {}, test_), null);
});

test('a replayed bond_visualiser conclusion opens with the rebuilt credits; a live one is untouched', () => {
    const opened = [];
    globals = { night_closed: true, ending: 'arrest' };
    globalThis.window = {
        BondVisualiser: { open: (o) => opened.push(o) },
        gameScenario: { music: { events } },
        endingReplayOptions: (sc) => {
            const r = seq.replayEndingEntry(sc.music.events, globals, test_);
            return r && { credits: r.sequence };
        },
    };
    const mgr = Object.create(om.ObjectivesManager?.prototype ?? om.default.prototype);
    mgr.eventDispatcher = { emit() {} };
    const aim = { aimId: 'end', conclusionScreen: { type: 'bond_visualiser' } };
    mgr.handleMissionConcluded(aim, { replay: true });
    assert.ok(opened[0].credits.length >= 4, 'replay carries the story lines');
    mgr.handleMissionConcluded(aim);
    assert.equal(opened[1].credits, undefined, 'live path leaves the music event to supply credits');
});
