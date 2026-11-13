// The dusting panel and the lockpick and container headers show textVariants /
// observationVariants; long dusting text wraps; the stale "Not a whorl..." message
// clears when the candidate list opens (pass 5, approved item 7.4e; m08 E3/E5, m05 M4).
// Run with: node --test test/js/variants-in-lock-panels.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
// Mirror the browser module tree so every relative import resolves as ESM
const root = mkdtempSync(join(tmpdir(), 'variants-panels-'));
cpSync(join(pub, 'js'), join(root, 'js'), { recursive: true });
writeFileSync(join(root, 'package.json'), '{"type":"module"}');

const el = () => ({ setAttribute() {}, appendChild() {}, style: {} });
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { getElementById: () => null, createElement: el, head: { appendChild() {} }, body: { appendChild() {} } };
globalThis.Image = class {};
const { DustingMinigame } = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-game.js')).href);

const item = {
    name: 'Go-Bag',
    observations: 'A canvas bag on the shelf.',
    observationVariants: [{ condition: 'globalVars.tipped_off', value: 'The shelf is empty.' }],
    text: 'PACKED 03:00',
    textVariants: [{ condition: 'globalVars.tipped_off', value: 'Nothing left but a receipt.' }],
};

function examineHtml(vars) {
    window.gameState.globalVariables = vars;
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, { data: item, objectId: null, surface: { description: 'canvas' } });
    return g._htmlExamine();
}

test('dusting examine panel resolves observation and text variants', () => {
    const before = examineHtml({});
    assert.match(before, /A canvas bag on the shelf\./);
    assert.match(before, /PACKED 03:00/);
    const after = examineHtml({ tipped_off: true });
    assert.match(after, /The shelf is empty\./);
    assert.match(after, /Nothing left but a receipt\./);
    assert.doesNotMatch(after, /PACKED 03:00/);
});

test('picking the right pattern clears the last wrong guess', () => {
    const g = Object.create(DustingMinigame.prototype);
    const seen = [];
    Object.assign(g, { print: { pattern: 'loop' }, patternOk: false, message: 'Not a whorl. ...' });
    g._buildCandidates = () => {};
    g._renderPanel = () => seen.push(g.message);
    g._drawCard = () => {};
    g.announce = () => {};
    g._choosePattern('loop');
    assert.equal(g.patternOk, true);
    assert.deepEqual(seen, [''], 'panel re-renders with no stale message');
});

test('.dusting-quote wraps unbroken strings', () => {
    const css = readFileSync(join(pub, 'css/dusting.css'), 'utf8');
    const rule = css.slice(css.indexOf('.dusting-quote {'), css.indexOf('}', css.indexOf('.dusting-quote {')));
    assert.match(rule, /overflow-wrap:\s*anywhere/);
});

test('lockpick and container headers read observations through resolveObjectField', () => {
    const starters = readFileSync(join(pub, 'js/systems/minigame-starters.js'), 'utf8');
    assert.doesNotMatch(starters, /itemObservations = lockable\?\.scenarioData\?\.observations/);
    assert.equal((starters.match(/itemObservations = resolveObjectField\(lockable\?\.scenarioData, 'observations', ''\)/g) || []).length, 2);
    const container = readFileSync(join(pub, 'js/minigames/container/container-minigame.js'), 'utf8');
    assert.doesNotMatch(container, /scenarioData\.observations \|\| ''/);
    assert.match(container, /resolveObjectField\(this\.containerItem\?\.scenarioData, 'observations', ''\)/);
});
