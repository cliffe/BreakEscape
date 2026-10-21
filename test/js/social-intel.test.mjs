// systems/social-intel.js (00 §4, §5; 02 N2) and the grant_fact action (00 S15):
//  - grantFact flips once: a second grant emits nothing, adds no note, writes nothing;
//  - the se_intel_ naming rule (bare ids and prefixed names both work);
//  - the note follows the naming rule in 03 (name once held, else a neutral label);
//  - note ids stay unique within one millisecond (window.addNote, notes-minigame.js);
//  - evaluateReadiness: target_ready_<id> on the flip, osint_done when all people are
//    ready, Hampshire needs all three of her facts, needsGlobal slots;
//  - applyActions grant_fact grants and toasts "Noted: <label>" once.
// Run with: bundle exec node --test test/js/social-intel.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-intel-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/social-intel.js', 'social-intel.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('utils/display-dashes.js', 'display-dashes.mjs');
copy('systems/apply-actions.js', 'apply-actions.mjs', s => s
    .replace("'../utils/display-dashes.js'", "'./display-dashes.mjs'")
    .replace("'./global-writer.js'", "'./global-writer.mjs'")
    .replace("'./social-intel.js'", "'./social-intel.mjs'"));

// The id counter and addNote, cut out of notes-minigame.js (the rest of that file needs Phaser).
const notesSrc = readFileSync(join(js, 'minigames/notes/notes-minigame.js'), 'utf8');
const addNoteSrc = notesSrc.slice(notesSrc.indexOf('// Unique note ids'));
assert.ok(addNoteSrc.includes('window.addNote = function'), 'addNote block found');

globalThis.window = { gameState: { globalVariables: {} } };
const intel = await import(pathToFileURL(join(dir, 'social-intel.mjs')).href);
const { applyActions } = await import(pathToFileURL(join(dir, 'apply-actions.mjs')).href);
const { grantFact, evaluateReadiness, computeReadiness } = intel;

const scenario = () => ({
    social: {
        people: [
            { id: 'pierce', kind: 'cast', forms: { full: 'Melanie Pierce' } },
            { id: 'hampshire', kind: 'cast', forms: { full: 'Chris Hampshire' } },
            { id: 'lord', kind: 'cast', forms: { full: 'Sofia Lord' } }
        ],
        intelFacts: {
            pierce_role: { text: 'Melanie Pierce works in Finance.', subject: 'pierce' },
            pierce_trusts_jed: { text: 'Melanie trusts Jed Baker.', subject: 'pierce' },
            email_pattern: { text: 'Staff addresses are initial.surname@ledgerwell.example.', subject: 'company' },
            pierce_expects_balance_sheet: {
                text: 'Melanie expects a Q3 balance sheet from Jed on Fridays.', subject: 'pierce',
                provides: [{ type: 'name', about: 'recipient', value: 'pierce_short', label: 'Mel' }]
            },
            hampshire_careers: { text: 'The careers inbox accepts CVs from anyone.', subject: 'hampshire', label: 'the careers inbox is open' },
            careers_attachment: { text: 'Chris takes .odt and .docx files.', subject: 'hampshire' },
            hampshire_cv_backlog: { text: 'Chris is behind on CVs.', subject: 'hampshire' },
            lord_intern: { text: 'Sofia is a new intern.', subject: 'lord' },
            lord_portal: { text: 'Sofia uses a staff payroll portal.', subject: 'lord' }
        },
        intelBoard: {
            people: ['pierce', 'hampshire', 'lord'],
            readinessSlots: {
                pierce: [
                    { label: 'Who she is', needsIntel: ['pierce_role'] },
                    { label: 'Who she trusts', needsIntel: ['pierce_trusts_jed', 'email_pattern'] },
                    { label: 'What she expects', needsIntel: ['pierce_expects_balance_sheet'] }
                ],
                hampshire: [
                    { label: 'Where mail goes', needsIntel: ['hampshire_careers'] },
                    { label: 'What the file should be', needsIntel: ['careers_attachment'] },
                    { label: 'Why she would read it', needsIntel: ['hampshire_cv_backlog'] }
                ],
                lord: [{ label: 'Her payroll system', needsIntel: ['lord_portal', 'lord_intern'] }]
            }
        }
    }
});

let emitted, notes, syncs, toasts;
function reset(globals = {}) {
    emitted = []; notes = []; syncs = 0; toasts = [];
    window.gameState = { globalVariables: { ...globals } };
    window.gameScenario = scenario();
    window.eventDispatcher = { emit: (name, data) => emitted.push([name, data]) };
    window.addNote = (title, text, important) => { notes.push({ title, text, important }); };
    window.stateSync = { sync: () => { syncs++; } };
    window.gameAlert = (...args) => toasts.push(args);
}
const names = (prefix) => emitted.map(([n]) => n).filter(n => n.startsWith(prefix));

test('grantFact sets se_intel_<id> once, emits, adds one note, syncs', () => {
    reset();
    const r = grantFact('pierce_role');
    assert.equal(r.granted, true);
    assert.equal(window.gameState.globalVariables.se_intel_pierce_role, true);
    assert.deepEqual(names('global_variable_changed:se_intel_'), ['global_variable_changed:se_intel_pierce_role']);
    assert.equal(emitted.filter(([n]) => n === 'intel_collected').length, 1);
    assert.deepEqual(notes, [{ title: 'Evidence: Melanie Pierce', text: 'Melanie Pierce works in Finance.', important: false }]);
    assert.equal(syncs, 1);
});

test('a second grant is flip-only: no event, no note, no sync', () => {
    reset();
    grantFact('pierce_role');
    emitted.length = 0; notes.length = 0; syncs = 0;
    const again = grantFact('pierce_role');
    assert.equal(again.granted, false);
    assert.deepEqual(emitted, []);
    assert.deepEqual(notes, []);
    assert.equal(syncs, 0);
});

test('the prefixed se_intel_ name is accepted and an unknown fact grants nothing', () => {
    reset();
    assert.equal(grantFact('se_intel_pierce_role').granted, true);
    assert.equal(window.gameState.globalVariables.se_intel_pierce_role, true);
    const warn = console.warn; console.warn = () => {};
    try {
        assert.equal(grantFact('no_such_fact').granted, false);
    } finally { console.warn = warn; }
    assert.equal(window.gameState.globalVariables.se_intel_no_such_fact, undefined);
});

test('the note names a person only once a held fact names them, else a neutral label', () => {
    reset();
    grantFact('email_pattern');
    grantFact('pierce_expects_balance_sheet'); // subject pierce: the fact being granted counts
    grantFact('lord_intern');                  // subject lord, counting itself
    assert.deepEqual(notes.map(n => n.title),
        ['Evidence: the company', 'Evidence: Melanie Pierce', 'Evidence: Sofia Lord']);
    // a name form held through another fact's provides names the person for a fact with another subject
    reset({ se_intel_pierce_expects_balance_sheet: true });
    const s = scenario();
    s.social.intelFacts.email_pattern.subject = 'pierce';
    s.social.intelFacts.pierce_expects_balance_sheet.subject = 'company';
    window.gameScenario = s;
    grantFact('email_pattern');
    assert.equal(notes[0].title, 'Evidence: Melanie Pierce');
    // no name form and no fact with that subject would be held: neutral label
    const sub = intel.subjectLabel({ people: s.social.people, intelFacts: s.social.intelFacts },
        { subject: 'lord' }, 'x', {});
    assert.equal(sub, 'a colleague');
});

test('note ids stay unique within one millisecond', () => {
    const realNow = Date.now;
    Date.now = () => 1_800_000_000_000;
    const w = { gameState: { notes: [] } };
    const saved = globalThis.window;
    globalThis.window = w;
    try {
        new Function(addNoteSrc)();
        for (let i = 0; i < 5; i++) w.addNote(`t${i}`, `body ${i}`);
        const ids = w.gameState.notes.map(n => n.id);
        assert.equal(new Set(ids).size, 5);
        assert.ok(ids.every(Number.isSafeInteger));
    } finally {
        Date.now = realNow;
        globalThis.window = saved;
    }
});

test('Hampshire is ready only when all three of her facts are held', () => {
    reset();
    grantFact('hampshire_careers');
    grantFact('careers_attachment');
    assert.equal(window.gameState.globalVariables.target_ready_hampshire, undefined);
    assert.deepEqual(names('global_variable_changed:target_ready_'), []);
    grantFact('hampshire_cv_backlog');
    assert.equal(window.gameState.globalVariables.target_ready_hampshire, true);
    assert.deepEqual(names('global_variable_changed:target_ready_'), ['global_variable_changed:target_ready_hampshire']);
    assert.equal(window.gameState.globalVariables.osint_done, undefined);
});

test('osint_done is set when every board person is ready, once', () => {
    reset();
    for (const f of ['pierce_role', 'pierce_trusts_jed', 'email_pattern', 'pierce_expects_balance_sheet',
        'hampshire_careers', 'careers_attachment', 'hampshire_cv_backlog', 'lord_intern']) grantFact(f);
    assert.equal(window.gameState.globalVariables.osint_done, undefined);
    assert.equal(window.gameState.globalVariables.target_ready_lord, undefined);
    grantFact('lord_portal');
    const g = window.gameState.globalVariables;
    assert.equal(g.target_ready_pierce, true);
    assert.equal(g.target_ready_lord, true);
    assert.equal(g.osint_done, true);
    assert.equal(names('global_variable_changed:osint_done').length, 1);
    // re-evaluating changes and emits nothing
    emitted.length = 0;
    const r = evaluateReadiness(window.gameScenario.social.intelBoard.readinessSlots, g,
        { people: window.gameScenario.social.intelBoard.people });
    assert.deepEqual(r.newlyReady, []);
    assert.equal(r.osintDoneSet, false);
    assert.deepEqual(emitted, []);
});

test('computeReadiness is pure; empty slot lists are not ready; needsGlobal counts', () => {
    const slots = {
        a: [{ needsIntel: ['x'], needsGlobal: ['built'] }],
        b: []
    };
    const before = { se_intel_x: true };
    assert.deepEqual(computeReadiness(slots, before, ['a']), { ready: { a: false, b: false }, osintDone: false });
    const after = { se_intel_x: true, built: true };
    assert.deepEqual(computeReadiness(slots, after, ['a']), { ready: { a: true, b: false }, osintDone: true });
    assert.deepEqual(before, { se_intel_x: true });
    // a scenario without social data grants the flag and adds no note
    reset();
    window.gameScenario = {};
    assert.equal(grantFact('whatever').granted, true);
    assert.deepEqual(notes, []);
});

test('applyActions grant_fact grants, toasts "Noted: <label>" once, and repeats are silent', () => {
    reset();
    applyActions([{ type: 'grant_fact', fact: 'hampshire_careers' }], { source: 'object_interact' });
    assert.equal(window.gameState.globalVariables.se_intel_hampshire_careers, true);
    assert.equal(toasts.length, 1);
    assert.equal(toasts[0][0], 'Noted: the careers inbox is open');
    assert.equal(notes.length, 1);
    applyActions([{ type: 'grant_fact', fact: 'hampshire_careers' }]);
    assert.equal(toasts.length, 1);
    assert.equal(notes.length, 1);
    // label falls back to the fact text
    applyActions([{ type: 'grant_fact', fact: 'careers_attachment' }]);
    assert.equal(toasts[1][0], 'Noted: Chris takes .odt and .docx files.');
    // set_global still emits on every call
    emitted.length = 0;
    applyActions([{ type: 'set_global', key: 'k', value: 1 }, { type: 'set_global', key: 'k', value: 1 }]);
    assert.equal(names('global_variable_changed:k').length, 2);
    // missing fact id: nothing happens
    applyActions([{ type: 'grant_fact' }]);
    assert.equal(toasts.length, 2);
});
