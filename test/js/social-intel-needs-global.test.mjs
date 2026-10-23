// needsGlobal readiness slots re-check on a change to the global they name (MECHANICS_AUDIT
// follow-up, 2026-10-22), not only when a fact is granted. Real modules: systems/social-intel.js,
// systems/global-writer.js and the NPCEventDispatcher (systems/npc-events.js).
//  - a slot waiting on a global flips target_ready_<id> and osint_done when the global changes;
//  - one listener per named global, none for a scenario without needsGlobal (the shipped missions);
//  - a value restored from a save counts at install, with no toast; a live flip toasts once;
//  - a change to some other global, or the named one to false, does nothing.
// Run with: bundle exec node --test test/js/social-intel-needs-global.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-intel-needs-global-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.js');
copy('systems/social-intel.js', 'social-intel.js');
copy('systems/npc-events.js', 'npc-events.js');

globalThis.window = { gameState: { globalVariables: {} } };
const { watchReadinessGlobals, readinessGlobalNames, grantFact } = await import(pathToFileURL(join(dir, 'social-intel.js')).href);
const { writeGlobal } = await import(pathToFileURL(join(dir, 'global-writer.js')).href);
const { default: NPCEventDispatcher } = await import(pathToFileURL(join(dir, 'npc-events.js')).href);

const scenario = () => ({
    social: {
        people: [{ id: 'pierce', forms: { full: 'Melanie Pierce' } }, { id: 'lord', forms: { full: 'Sofia Lord' } }],
        intelFacts: {
            pierce_role: { text: 'Melanie Pierce works in Finance.', subject: 'pierce' },
            lord_portal: { text: 'Sofia uses the payroll portal.', subject: 'lord' }
        },
        intelBoard: {
            people: ['pierce', 'lord'],
            readinessSlots: {
                pierce: [
                    { label: 'Who she is', needsIntel: ['pierce_role'], goalString: 'g', doneString: 'd' },
                    { label: 'The page', needsGlobal: ['landing_built'], goalString: 'g', doneString: 'd' }
                ],
                lord: [
                    { label: 'Her system', needsIntel: ['lord_portal'], needsGlobal: ['landing_built', 'call_done'],
                        goalString: 'g', doneString: 'd' }
                ]
            }
        }
    }
});

let toasts;
function setup(globals = {}, sc = scenario()) {
    toasts = [];
    window.gameState = { globalVariables: { landing_built: false, call_done: false, ...globals } };
    window.gameScenario = sc;
    window.eventDispatcher = new NPCEventDispatcher();
    window.gameAlert = (body, kind, title) => toasts.push({ body, kind, title });
    window.stateSync = { sync() {} };
    window.addNote = () => {};
    return window.eventDispatcher;
}
const G = () => window.gameState.globalVariables;

test('readinessGlobalNames lists each needsGlobal name once, in slot order', () => {
    assert.deepEqual(readinessGlobalNames(scenario().social.intelBoard.readinessSlots), ['landing_built', 'call_done']);
    assert.deepEqual(readinessGlobalNames(null), []);
    assert.deepEqual(readinessGlobalNames({ x: [{ needsIntel: ['a'] }], y: 'junk' }), []);
});

test('a global change re-checks readiness: the target flips ready without a fact grant', () => {
    const d = setup({ se_intel_pierce_role: true });
    assert.deepEqual(watchReadinessGlobals(), ['landing_built', 'call_done']);
    assert.equal(G().target_ready_pierce, undefined, 'not ready while landing_built is false');
    writeGlobal('landing_built', true);
    assert.equal(G().target_ready_pierce, true);
    assert.equal(G().target_ready_lord, undefined, 'lord still needs her fact and call_done');
    assert.equal(G().osint_done, undefined);
    assert.equal(toasts.length, 1);
    assert.equal(toasts[0].title, 'Ready to approach');
    assert.equal(d.listeners.get('global_variable_changed:landing_built').length, 1);
});

test('a fact grant still works alongside, and the last global completes osint_done', () => {
    setup({ se_intel_pierce_role: true, landing_built: true });
    watchReadinessGlobals();
    assert.equal(G().target_ready_pierce, true, 'install catches up on a restored value');
    assert.equal(toasts.length, 0, 'no toast at install');
    grantFact('lord_portal');
    assert.equal(G().target_ready_lord, undefined, 'call_done still false');
    writeGlobal('call_done', true);
    assert.equal(G().target_ready_lord, true);
    assert.equal(G().osint_done, true);
    assert.equal(toasts.length, 1);
});

test('the event alone is enough: a direct gameState write followed by the emit (npc-manager style)', () => {
    setup({ se_intel_pierce_role: true });
    watchReadinessGlobals();
    G().landing_built = true;
    window.eventDispatcher.emit('global_variable_changed:landing_built', { name: 'landing_built', value: true, oldValue: false });
    assert.equal(G().target_ready_pierce, true);
});

test('other globals, and the named global going false, change nothing', () => {
    setup({ se_intel_pierce_role: true });
    watchReadinessGlobals();
    writeGlobal('something_else', true);
    writeGlobal('landing_built', false);
    assert.equal(G().target_ready_pierce, undefined);
    assert.equal(toasts.length, 0);
});

test('installing twice on one dispatcher adds no second listener', () => {
    const d = setup({ se_intel_pierce_role: true });
    watchReadinessGlobals();
    watchReadinessGlobals();
    assert.equal(d.listeners.get('global_variable_changed:landing_built').length, 1);
    writeGlobal('landing_built', true);
    assert.equal(toasts.length, 1, 'one toast, not two');
});

test('a scenario with no needsGlobal slot, or no social block, installs nothing and writes nothing', () => {
    const sc = scenario();
    for (const slots of Object.values(sc.social.intelBoard.readinessSlots)) for (const s of slots) delete s.needsGlobal;
    sc.social.intelBoard.readinessSlots.pierce.pop();
    let d = setup({ se_intel_pierce_role: true }, sc);
    assert.deepEqual(watchReadinessGlobals(), []);
    assert.equal(d.listeners.size, 0);
    assert.equal(G().target_ready_pierce, undefined, 'no catch-up write: readiness stays where the grants put it');
    d = setup({}, { rooms: {} });
    assert.deepEqual(watchReadinessGlobals(), []);
    assert.equal(d.listeners.size, 0);
    assert.deepEqual(Object.keys(G()).sort(), ['call_done', 'landing_built']);
});

test('no dispatcher: returns nothing and does not throw', () => {
    setup({ se_intel_pierce_role: true });
    window.eventDispatcher = null;
    assert.deepEqual(watchReadinessGlobals(), []);
});
