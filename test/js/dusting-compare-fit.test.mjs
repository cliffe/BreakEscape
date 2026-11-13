// m08 confirmation N1: at the Compare step on easy (two reference cards drawn at 2x)
// the dusting panel ran ~21 px below a 1000 px window. The cards drop to 1x when the
// panel doesn't fit the window height (dusting-game.js refCardsFit, _drawReferences).
// Run with: node --test test/js/dusting-compare-fit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const root = mkdtempSync(join(tmpdir(), 'dusting-fit-'));
cpSync(join(pub, 'js'), join(root, 'js'), { recursive: true });
writeFileSync(join(root, 'package.json'), '{"type":"module"}');

const el = () => ({ setAttribute() {}, appendChild() {}, style: {} });
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { getElementById: () => null, createElement: el, head: { appendChild() {} }, body: { appendChild() {} } };
globalThis.Image = class {};
const { refCardsFit } = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-game.js')).href);

const box = (h) => ({ getBoundingClientRect: () => ({ height: h }) });

test('the panel fits only with its 12 px padding top and bottom inside the window', () => {
    assert.equal(refCardsFit(box(1021), 1000), false, 'the reported case: 1 to 1022 px');
    assert.equal(refCardsFit(box(976), 1000), true);
    assert.equal(refCardsFit(box(977), 1000), false);
    assert.equal(refCardsFit(null, 1000), true, 'no root: leave the cards alone');
    assert.equal(refCardsFit(box(2000), 0), true, 'no window height: leave the cards alone');
});

test('_drawReferences drops the cards to 1x when the panel overflows', () => {
    const src = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');
    const fn = src.slice(src.indexOf('_drawReferences() {'), src.indexOf('getTestState() {'));
    assert.match(fn, /if \(!refCardsFit\(this\.root, window\.innerHeight\)\) \{[\s\S]*?cv\.style\.width = `\$\{N\}px`/);
});
