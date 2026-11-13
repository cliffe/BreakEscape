// RFID cloner, Read screen with no keycard (lab_physical_pentest playtests, finding
// E11): "No keycards in inventory" gave no lead on where a card comes from. A dim line
// under it now says how the cloner gets one, without naming anyone or any scenario.
// Run with: node test/js/rfid-no-keycards-hint.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = (p) => join(root, 'public/break_escape/js', p);
const tmp = mkdtempSync(join(tmpdir(), 'rfid-hint-'));
writeFileSync(join(tmp, 'rfid-protocols.mjs'), readFileSync(src('minigames/rfid/rfid-protocols.js'), 'utf8'));
writeFileSync(join(tmp, 'display-dashes.mjs'), 'export const displayDashes = (s) => s;');
writeFileSync(join(tmp, 'escape-html.mjs'), readFileSync(src('utils/escape-html.js'), 'utf8'));
writeFileSync(join(tmp, 'rfid-ui.mjs'), readFileSync(src('minigames/rfid/rfid-ui.js'), 'utf8')
    .split("'./rfid-protocols.js'").join("'./rfid-protocols.mjs'")
    .split("'../../utils/display-dashes.js'").join("'./display-dashes.mjs'")
    .split("'../../utils/escape-html.js'").join("'./escape-html.mjs'"));

const mk = (tag) => {
    const el = { tag, children: [], style: {}, className: '', textContent: '', _html: '',
        classList: { add() {}, remove() {} },
        appendChild(c) { this.children.push(c); return c; },
        addEventListener() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [] };
    Object.defineProperty(el, 'innerHTML', { get() { return this._html; }, set(v) { this._html = v; this.children = []; } });
    return el;
};
const screen = mk('div');
globalThis.window = {};
globalThis.document = { createElement: mk, getElementById: (id) => (id === 'rfid-screen' ? screen : null) };
const { RFIDUIRenderer, NO_KEYCARDS_HINT } = await import(pathToFileURL(join(tmp, 'rfid-ui.mjs')));

const texts = (el) => [el.textContent, ...el.children.flatMap(texts)].filter(Boolean);
function ui(availableCards) {
    const r = Object.create(RFIDUIRenderer.prototype);
    Object.assign(r, { minigame: { params: { availableCards }, handleCardTap() {} }, dataManager: { getSavedCards: () => [] } });
    r.getScreen = () => screen;
    return r;
}

test('Read with no keycard: the empty line is followed by where a card comes from', () => {
    ui([]).showTapInterface();
    const t = texts(screen);
    const i = t.indexOf('No keycards in inventory');
    assert.ok(i >= 0);
    assert.equal(t[i + 1], NO_KEYCARDS_HINT);
});

test('Read with a keycard: the card is listed and the hint is not shown', () => {
    ui([{ scenarioData: { name: 'Staff badge' } }]).showTapInterface();
    const t = texts(screen);
    assert.ok(t.includes('> Staff badge'));
    assert.ok(!t.includes(NO_KEYCARDS_HINT));
    assert.ok(!t.includes('No keycards in inventory'));
});

test('the hint is short, generic and gives no scenario away', () => {
    assert.ok(NO_KEYCARDS_HINT.length <= 90);
    assert.match(NO_KEYCARDS_HINT, /badge/);
    assert.doesNotMatch(NO_KEYCARDS_HINT, /Len|records|guard|door|[–—]/);
});
