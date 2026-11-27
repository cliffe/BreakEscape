// Gap tests for systems/social-intel.js: readiness on thin or odd boards, repeated and
// out-of-order grants, prefixed and junk ids, osint_done boundaries, restore of held facts,
// the watcher on globals, and the "Ready to approach" toast text.
// Run with: bin/test-js test/js/social-gap-intel.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-intel-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/social-intel.js', 'social-intel.mjs', (s) => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
globalThis.window = { gameState: { globalVariables: {} } };
const realWarn = console.warn;
console.warn = () => {};
const I = await import(pathToFileURL(join(dir, 'social-intel.mjs')).href);

const social = () => ({
    people: [{ id: 'amy', forms: { full: 'Amy Ng' } }, { id: 'bo', name: 'Bo Li' }],
    intelFacts: {
        amy_role: { text: 'Amy is in finance.', subject: 'amy', label: 'Amy role' },
        amy_boss: { text: 'Amy reports to Bo.', subject: 'amy' },
        bo_name: { subject: 'bo', provides: [{ type: 'name', value: 'bo_full' }] },
        co_pattern: { text: 'Pattern first.last', subject: 'company' },
        no_text: { subject: 'bo' },
    },
    intelBoard: {
        people: ['amy', 'bo'],
        readinessSlots: {
            amy: [{ label: 'who', needsIntel: ['amy_role'] }, { label: 'boss', needsIntel: ['amy_boss'] }],
            bo: [{ label: 'name', needsIntel: ['bo_name', 'co_pattern'] }],
        },
        ...({}),
    },
    characters: { amy: { channels: { phone: 'amy_phone' } }, bo: { channels: { email: 'b@x', person: 'bo_desk' } } },
});
function world({ globals = {}, withNotes = true } = {}) {
    const sc = { social: social() };
    const events = [];
    const notes = [];
    const syncs = { n: 0 };
    window.gameScenario = sc;
    window.gameState = { globalVariables: { ...globals } };
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]), on() {}, off() {} };
    window.addNote = withNotes ? (t, x, f) => notes.push([t, x, f]) : undefined;
    window.stateSync = { sync() { syncs.n++; } };
    return { sc, events, notes, syncs, g: window.gameState.globalVariables };
}

// ── grantFact ────────────────────────────────────────────────────────────────

test('grantFact rejects empty, non-string and whitespace-free junk ids without writing anything', () => {
    const { g, events } = world();
    for (const bad of [undefined, null, '', 5, {}, []]) assert.equal(I.grantFact(bad).granted, false, String(bad));
    assert.deepEqual(g, {});
    assert.equal(events.length, 0);
});

test('grantFact with no game state returns not granted rather than throwing', () => {
    world();
    window.gameState = undefined;
    assert.deepEqual(I.grantFact('amy_role'), { granted: false, id: 'amy_role' });
});

test('an unknown fact is refused when the scenario has an intelFacts map, and the refusal writes nothing', () => {
    const { g, events } = world();
    assert.equal(I.grantFact('nope').granted, false);
    assert.equal(g.se_intel_nope, undefined);
    assert.equal(events.length, 0);
});

test('the prefixed name and the bare id are the same fact; a double prefix is unknown', () => {
    const { g } = world();
    assert.equal(I.grantFact('se_intel_amy_role').granted, true);
    assert.equal(g.se_intel_amy_role, true);
    assert.equal(I.grantFact('amy_role').granted, false);
    assert.equal(I.grantFact('se_intel_se_intel_amy_boss').granted, false);
});

test('a fact held as the string "true" is not held: it is granted and overwritten with the boolean', () => {
    const { g } = world({ globals: { se_intel_amy_role: 'true' } });
    assert.equal(I.grantFact('amy_role').granted, true);
    assert.equal(g.se_intel_amy_role, true);
});

test('a fact with no text adds no note; a fact with text adds exactly one, not auto-focused', () => {
    const { notes } = world();
    I.grantFact('no_text');
    assert.equal(notes.length, 0);
    I.grantFact('amy_role');
    assert.equal(notes.length, 1);
    assert.equal(notes[0][2], false);
    I.grantFact('amy_role');
    assert.equal(notes.length, 1);
});

test('no addNote function and a throwing stateSync do not stop a grant', () => {
    const { g } = world({ withNotes: false });
    window.stateSync = { sync() { throw new Error('offline'); } };
    assert.equal(I.grantFact('amy_role').granted, true);
    assert.equal(g.se_intel_amy_role, true);
    window.stateSync = undefined;
    assert.equal(I.grantFact('amy_boss').granted, true);
});

test('the event carries the id, fact, label, subject and source; the label falls back to text then id', () => {
    const { events } = world();
    I.grantFact('amy_role', { source: 'osint' });
    I.grantFact('amy_boss');
    I.grantFact('no_text');
    const [a, b, c] = events.filter(([n]) => n === 'intel_collected').map(([, d]) => d);
    assert.equal(a.label, 'Amy role');
    assert.equal(a.source, 'osint');
    assert.equal(b.label, 'Amy reports to Bo.');
    assert.equal(b.source, 'scenario');
    assert.equal(c.label, 'no_text');
});

test('subject naming: a neutral label until a held fact names the person; the fact being granted counts; the company reads as "the company"', () => {
    const { notes } = world();
    I.grantFact('co_pattern');
    assert.match(notes[0][0], /the company/);
    I.grantFact('amy_role');
    assert.match(notes[1][0], /Amy Ng/);
    world();
    window.addNote = (t) => notes.push([t]);
    notes.length = 0;
    I.grantFact('no_text'); // subject bo, no text -> no note
    I.grantFact('bo_name');
    assert.equal(notes.length, 0, 'bo_name has no text');
});

test('subjectLabel directly: a name form provided by another fact names the person; a person with only a name field is used', () => {
    const sc = social();
    const globals = { se_intel_bo_name: true };
    assert.equal(I.subjectLabel(sc, sc.intelFacts.no_text, 'no_text', globals), 'Bo Li');
    assert.equal(I.subjectLabel(sc, sc.intelFacts.no_text, 'no_text', {}), 'Bo Li', 'the fact being granted has subject bo');
    assert.equal(I.subjectLabel(sc, { subject: 'ghost' }, 'x', {}), 'a colleague');
    assert.equal(I.subjectLabel(sc, undefined, 'x', {}), 'the company');
    assert.equal(I.subjectLabel(null, { subject: 'amy' }, 'x', {}), 'a colleague');
    assert.equal(I.subjectLabel(sc, { subject: 'company' }, 'x', {}), 'the company');
});

test('factLabel falls back: label, text, id', () => {
    assert.equal(I.factLabel({ label: 'L', text: 'T' }, 'id'), 'L');
    assert.equal(I.factLabel({ text: 'T' }, 'id'), 'T');
    assert.equal(I.factLabel({}, 'id'), 'id');
    assert.equal(I.factLabel(null, 'id'), 'id');
});

test('a scenario with no intelFacts map grants any id (stand-in grants in early missions)', () => {
    const { g } = world();
    window.gameScenario = { social: {} };
    assert.equal(I.grantFact('anything').granted, true);
    assert.equal(g.se_intel_anything, true);
    window.gameScenario = null;
    assert.equal(I.grantFact('other').granted, true);
});

// ── readiness ────────────────────────────────────────────────────────────────

test('computeReadiness: empty, null and junk inputs', () => {
    assert.deepEqual(I.computeReadiness(undefined, {}), { ready: {}, osintDone: false });
    assert.deepEqual(I.computeReadiness({}, {}), { ready: {}, osintDone: false });
    assert.deepEqual(I.computeReadiness({ a: 'x', b: null, c: [] }, {}).ready, { a: false, b: false, c: false });
    assert.equal(I.computeReadiness({ a: [{ needsIntel: [] }] }, {}).ready.a, true, 'a slot that needs nothing is done');
    assert.equal(I.computeReadiness({ a: [null] }, null).ready.a, true, 'a null slot needs nothing (vacuous)');
});

test('osintDone needs every listed person ready; a person with no slots, an empty people list, and a people list naming an unknown id', () => {
    const slots = { a: [{ needsIntel: ['x'] }], b: [{ needsIntel: ['y'] }] };
    const g = { se_intel_x: true, se_intel_y: true };
    assert.equal(I.computeReadiness(slots, g, ['a', 'b']).osintDone, true);
    assert.equal(I.computeReadiness(slots, g, ['a', 'b', 'ghost']).osintDone, false);
    assert.equal(I.computeReadiness(slots, g, []).osintDone, false);
    assert.equal(I.computeReadiness(slots, g, ['a']).osintDone, true);
    assert.equal(I.computeReadiness(slots, g, null).osintDone, true);
    assert.equal(I.computeReadiness(slots, { se_intel_x: true }, null).osintDone, false);
});

test('slotDone: facts must be exactly true; needsGlobal too; mixed needs; junk need lists count as none', () => {
    assert.equal(I.slotDone({ needsIntel: ['x'] }, { se_intel_x: 1 }), false);
    assert.equal(I.slotDone({ needsGlobal: ['flag'] }, { flag: 'yes' }), false);
    assert.equal(I.slotDone({ needsIntel: ['x'], needsGlobal: ['f'] }, { se_intel_x: true, f: true }), true);
    assert.equal(I.slotDone({ needsIntel: ['x'], needsGlobal: ['f'] }, { se_intel_x: true }), false);
    assert.equal(I.slotDone({ needsIntel: 'x' }, {}), true);
    assert.equal(I.slotDone(null, null), true);
});

test('granting facts in any order readies each person exactly once and osint_done only after the last', () => {
    const { g, events } = world();
    for (const f of ['co_pattern', 'amy_boss', 'bo_name']) I.grantFact(f);
    assert.equal(g.target_ready_bo, true);
    assert.equal(g.target_ready_amy, undefined);
    assert.equal(g.osint_done, undefined);
    const last = I.grantFact('amy_role');
    assert.deepEqual(last.readiness.newlyReady, ['amy']);
    assert.equal(last.readiness.osintDoneSet, true);
    assert.equal(g.osint_done, true);
    const again = I.grantFact('amy_role');
    assert.equal(again.granted, false);
    assert.equal(again.readiness, undefined);
});

test('a readiness flag that is already true is not rewritten or reported as newly ready; osint_done already true is reported done but not set again', () => {
    const { g } = world({ globals: { target_ready_amy: true, osint_done: true, se_intel_amy_role: true, se_intel_amy_boss: true } });
    const r = I.evaluateReadiness(social().intelBoard.readinessSlots, g, { people: ['amy'] });
    assert.deepEqual(r, { newlyReady: [], osintDone: true, osintDoneSet: false });
});

test('a readiness flag never goes back to false when facts are missing', () => {
    const { g } = world({ globals: { target_ready_amy: true } });
    I.evaluateReadiness(social().intelBoard.readinessSlots, g, { people: ['amy'] });
    assert.equal(g.target_ready_amy, true);
});

test('evaluateReadiness with no slots or no globals does nothing', () => {
    assert.deepEqual(I.evaluateReadiness(null, {}), { newlyReady: [], osintDone: false, osintDoneSet: false });
    assert.deepEqual(I.evaluateReadiness({ a: [] }, null), { newlyReady: [], osintDone: false, osintDoneSet: false });
});

test('a reload with facts already held does not re-announce readiness that was already stored', () => {
    const { g } = world({ globals: { se_intel_amy_role: true, se_intel_amy_boss: true, target_ready_amy: true } });
    const r = I.grantFact('co_pattern');
    assert.equal(r.readiness.newlyReady.includes('amy'), false);
    assert.equal(g.target_ready_amy, true);
});

test('a reload with facts held but the ready flag lost: the next grant of any fact repairs it', () => {
    const { g } = world({ globals: { se_intel_amy_role: true, se_intel_amy_boss: true } });
    const r = I.grantFact('co_pattern');
    assert.equal(r.readiness.newlyReady.includes('amy'), true);
    assert.equal(g.target_ready_amy, true);
});

// ── watcher on needsGlobal ───────────────────────────────────────────────────

test('watchReadinessGlobals: nothing to watch returns [] and adds no listeners; a dispatcher without on() is tolerated', () => {
    world();
    const events = { on() { throw new Error('should not subscribe'); } };
    assert.deepEqual(I.watchReadinessGlobals({ scenario: { social: social() }, dispatcher: events }), []);
    assert.deepEqual(I.watchReadinessGlobals({ scenario: { social: social() }, dispatcher: {} }), []);
    assert.deepEqual(I.watchReadinessGlobals({ scenario: {}, dispatcher: events }), []);
});

test('watchReadinessGlobals: the first check runs at install so a restored flag counts; later changes toast once', () => {
    const { g } = world({ globals: { gate_open: true } });
    const sc = { social: { ...social() } };
    sc.social.intelBoard = { people: ['amy'], readinessSlots: { amy: [{ needsGlobal: ['gate_open'] }] } };
    window.gameScenario = sc;
    const handlers = new Map();
    const dispatcher = { on: (n, f) => handlers.set(n, f) };
    const alerts = [];
    window.gameAlert = (...a) => alerts.push(a);
    assert.deepEqual(I.watchReadinessGlobals({ scenario: sc, dispatcher }), ['gate_open']);
    assert.equal(g.target_ready_amy, true, 'restored flag counted at install');
    assert.equal(alerts.length, 0, 'no toast for the install-time check');
    g.gate_open = false;
    handlers.get('global_variable_changed:gate_open')();
    assert.equal(alerts.length, 0, 'a flag going false announces nothing');
    delete window.gameAlert;
});

// ── toast text ───────────────────────────────────────────────────────────────

test('readyToastText: custom text wins unless blank; channels read in email, phone, person order; no channels or unknown targets read as email', () => {
    world();
    assert.match(I.readyToastText(['bo']), /mail terminal.*talk to them in person/);
    assert.match(I.readyToastText(['amy']), /call them/);
    assert.match(I.readyToastText(['amy', 'bo']), /mail terminal, or call them, or go and talk/);
    assert.match(I.readyToastText(['unknown']), /mail terminal/);
    assert.match(I.readyToastText([]), /mail terminal/);
    assert.match(I.readyToastText(undefined), /mail terminal/);
    const custom = { social: { intelBoard: { readyToast: 'Go go go.' } } };
    assert.equal(I.readyToastText(['amy'], custom), 'Go go go.');
    const blank = { social: { intelBoard: { readyToast: '   ' }, characters: {} } };
    assert.match(I.readyToastText(['amy'], blank), /You know enough/);
});

test('readyToastText: a character whose channels are all empty falls back to email', () => {
    const sc = { social: { characters: { z: { channels: { phone: '', email: null } } } } };
    assert.match(I.readyToastText(['z'], sc), /mail terminal/);
});

console.warn = realWarn;
