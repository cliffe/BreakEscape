// ESD pushbutton minigame (minigames/esd-pushbutton): an ESD object that is not locked
// must not post an unlock. The server answers POST /unlock for an unlocked object with
// 422 "Object not found", a console error on every press in sis02. A locked one still posts.
// Run with: node test/js/esd-no-unlock-post.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = { gameState: { globalVariables: {} }, eventDispatcher: { emit() {} } };
globalThis.__applied = [];
const { EsdPushbuttonMinigame } = await import(dataUrl(readFileSync(join(js, 'minigames/esd-pushbutton/esd-pushbutton-minigame.js'), 'utf8')
    .split("'../framework/base-minigame.js'").join(`'${dataUrl('export class MinigameScene {}')}'`)
    .split("'../../systems/apply-actions.js'").join(`'${dataUrl('export function applyActions(a, o) { globalThis.__applied.push(...a.map(x => x.type)); }')}'`)
    .split("'../../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../../utils/conditional-text.js'").join(`'${dataUrl('export const resolveConditionalText = (s) => s;')}'`)
    .split("'../../utils/escape-html.js'").join(`'${dataUrl('export const escapeHtml = (s) => String(s);')}'`)));

const press = (locked) => {
    globalThis.__applied = [];
    window.gameState.unlockedObjects = [];
    const sd = { id: 'esd_station_console', locked };
    EsdPushbuttonMinigame.prototype.applyEsdOutcome.call({ _sd: {}, lockable: { scenarioData: sd } });
    return sd;
};

test('an unlocked ESD object posts no unlock but still completes', () => {
    const sd = press(false);
    assert.ok(!__applied.includes('unlock_object'));
    assert.equal(sd.esdState, 'activated');
    assert.deepEqual(window.gameState.unlockedObjects, ['esd_station_console']);
});

test('an object with no locked field posts no unlock', () => {
    press(undefined);
    assert.ok(!__applied.includes('unlock_object'));
});

test('a locked ESD object still persists its unlock', () => {
    const sd = press(true);
    assert.ok(__applied.includes('unlock_object'));
    assert.equal(sd.locked, false);
});
