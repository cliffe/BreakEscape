// systems/costume-actions.js: set_costume / clear_costume against a scenario `disguises` map,
// the persisted global pp_disguise, and re-apply after a reload. player-costume.js is replaced by
// stubs (its worn state is module-local and is exactly what a reload loses).
// apply-actions.js dispatch is checked with a stub costume-actions.js (lazy dynamic import).
// Run with: bin/test-js test/js/costume-actions.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
globalThis.window = { gameState: { globalVariables: {} } };
const { setCostume, clearCostume, reapplyPersistedCostume, disguiseFor, DISGUISE_KEY } =
    await import(pathToFileURL(join(js, 'systems/costume-actions.js')).href);

const scenario = { disguises: { alpha: { sprite: 'sprite_a', talk: 'a_talk.png' }, beta: { sprite: 'sprite_b' }, bad: { nosprite: 1 } } };

function rig() {
    const globals = {};
    const calls = [];
    let worn = null;
    return {
        globals, calls,
        deps: {
            scenario, globals,
            write: (k, v) => { globals[k] = v; },
            applyCostume: async (c) => { calls.push(['apply', c]); worn = c.sprite; return true; },
            removeCostume: async () => { calls.push(['remove']); const had = worn !== null; worn = null; return had; }
        },
        worn: () => worn
    };
}

test('disguiseFor reads an open map and rejects entries without a sprite', () => {
    assert.equal(disguiseFor('alpha', scenario).sprite, 'sprite_a');
    assert.equal(disguiseFor('beta', scenario).sprite, 'sprite_b');
    assert.equal(disguiseFor('bad', scenario), null);
    assert.equal(disguiseFor('nope', scenario), null);
    assert.equal(disguiseFor('', scenario), null);
});

test('set_costume swaps the sprite and writes pp_disguise', async () => {
    const r = rig();
    assert.equal(await setCostume('alpha', r.deps), true);
    assert.deepEqual(r.calls[0], ['apply', { sprite: 'sprite_a', talk: 'a_talk.png' }]);
    assert.equal(r.globals[DISGUISE_KEY], 'alpha');
    assert.equal(DISGUISE_KEY, 'pp_disguise');
});

test('set_costume with an unknown id changes nothing', async () => {
    const r = rig();
    assert.equal(await setCostume('nope', r.deps), false);
    assert.equal(r.calls.length, 0);
    assert.equal(r.globals.pp_disguise, undefined);
});

test('a costume that fails to load does not set the global', async () => {
    const r = rig();
    r.deps.applyCostume = async () => false;
    assert.equal(await setCostume('alpha', r.deps), false);
    assert.equal(r.globals.pp_disguise, undefined);
});

test('clear_costume removes it and empties pp_disguise', async () => {
    const r = rig();
    await setCostume('beta', r.deps);
    assert.equal(await clearCostume(r.deps), true);
    assert.equal(r.globals.pp_disguise, '');
    assert.equal(r.worn(), null);
});

test('reload: worn state is gone, the persisted global re-applies the costume', async () => {
    const first = rig();
    await setCostume('alpha', first.deps);
    // New page: fresh rig (nothing worn), globals restored from the save.
    const after = rig();
    after.globals.pp_disguise = first.globals.pp_disguise;
    assert.equal(after.worn(), null);
    assert.equal(await reapplyPersistedCostume(after.deps), true);
    assert.equal(after.worn(), 'sprite_a');
});

test('re-apply does nothing for an empty or unknown pp_disguise', async () => {
    const empty = rig();
    empty.globals.pp_disguise = '';
    assert.equal(await reapplyPersistedCostume(empty.deps), false);
    const unknown = rig();
    unknown.globals.pp_disguise = 'gone';
    assert.equal(await reapplyPersistedCostume(unknown.deps), false);
    assert.equal(empty.calls.length + unknown.calls.length, 0);
});

test('apply-actions routes set_costume / clear_costume to costume-actions', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'costume-act-'));
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
    mkdirSync(join(dir, 'systems'), { recursive: true });
    const dataUrl = (src) => 'data:text/javascript,' + encodeURIComponent(src);
    writeFileSync(join(dir, 'systems', 'costume-actions.js'),
        "export async function setCostume(id){ (globalThis.__log ||= []).push(['set', id]); }\n" +
        "export async function clearCostume(){ (globalThis.__log ||= []).push(['clear']); }\n");
    const src = readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
        .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
        .split("'../utils/escape-html.js'").join(`'${dataUrl('export const escapeHtml = (s) => String(s == null ? "" : s);')}'`)
        .split("'../utils/author-html.js'").join(`'${dataUrl('export const authorHtml = (s) => String(s == null ? "" : s);')}'`)
        .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal(){}')}'`)
        .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact(){return{granted:false};} export function readyToastText(){return "";} export function readyToastTitle(){return "";}')}'`);
    writeFileSync(join(dir, 'systems', 'apply-actions.mjs'), src);
    globalThis.window = { gameState: { globalVariables: {} } };
    globalThis.document = { querySelector: () => null };
    const { applyActions } = await import(pathToFileURL(join(dir, 'systems', 'apply-actions.mjs')).href);
    applyActions([{ type: 'set_costume', costume: 'alpha' }, { type: 'clear_costume' }, { type: 'set_costume' }]);
    await new Promise(r => setTimeout(r, 50));
    assert.deepEqual(globalThis.__log, [['set', 'alpha'], ['clear']]);
});
