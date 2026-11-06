// F26 follow-up: the reference cards were too small to compare at 128 px beside the 3x lift.
// Each card now has a separate "View large" control (and the V key) that shows the card at the
// lift's size in the big frame. Viewing never counts as a pick; picking still works as before.
// Run with: node --test test/js/dusting-card-view.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const root = mkdtempSync(join(tmpdir(), 'dusting-view-'));
cpSync(join(pub, 'js'), join(root, 'js'), { recursive: true });
writeFileSync(join(root, 'package.json'), '{"type":"module"}');

const el = () => ({ setAttribute() {}, appendChild() {}, style: {} });
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { getElementById: () => null, createElement: el, head: { appendChild() {} }, body: { appendChild() {} } };
globalThis.Image = class {};
const { DustingMinigame, nextView } = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-game.js')).href);

const mark = (type, x, y, dx, dy) => ({ type, x, y, dx, dy });

/** A compare-step minigame without the DOM: three cards, the owner's in slot 2. */
function compareGame() {
    const g = Object.create(DustingMinigame.prototype);
    const liftMarks = [mark('ending', 60, 50, 10, -5), mark('bifurcation', 40, 70, -12, 14)];
    const features = (pattern, marks) => ({ pattern, opens: null, marks });
    Object.assign(g, {
        step: 'compare', patternOk: true, identified: false, viewing: null, message: '', dirty: false,
        ownerName: 'Margaret Sorensen', correctIndex: 2,
        print: { pattern: 'whorl', cores: [], deltas: [], minutiae: [] },
        liftMarks, liftFeatures: features('whorl', liftMarks),
        candidates: [
            { index: 0, label: 'Jesse Tran', pattern: 'whorl', correct: false, rejected: false, marks: [mark('ending', 60, 50, 10, -5), mark('ending', 40, 70, -12, 14)] },
            { index: 1, label: 'Noor Haddad', pattern: 'loop', correct: false, rejected: false, marks: [] },
            { index: 2, label: 'Margaret Sorensen', pattern: 'whorl', correct: true, rejected: false, marks: liftMarks }
        ],
        forensicEl: {}, gameState: { isActive: true },
        calls: { panel: 0, draw: 0, painted: [] },
        announced: []
    });
    for (const c of g.candidates) c.features = features(c.pattern, c.marks);
    g._renderPanel = () => { g.calls.panel++; };
    g._drawCard = function () { g.calls.draw++; return DustingMinigame.prototype._drawCard.call(this); };
    g._updateAria = () => {};
    g.announce = (m) => g.announced.push(m);
    // a canvas context that records what the big frame shows
    g.ctx = {
        drawImage() { g.calls.painted.push('lift'); }, save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {},
        closePath() {}, stroke() {}, fill() {}, arc() {}, rect() {}, fillRect() {}, fillText() {}, measureText: () => ({ width: 40 })
    };
    g.cardCanvas = {};
    g._paintReference = (c, cand) => { g.calls.painted.push(`card ${cand.index}`); };
    g._matches = () => [];
    return g;
}

test('nextView steps lift, each card, then back to the lift', () => {
    assert.equal(nextView(null, 3), 0);
    assert.equal(nextView(0, 3), 1);
    assert.equal(nextView(2, 3), null);
    assert.equal(nextView(1, 2), null);
    assert.equal(nextView(null, 0), null);
});

test('View large shows the card at full size in the big frame and is not a pick', () => {
    const g = compareGame();
    g._action('view', { index: '0' });
    assert.equal(g.viewing, 0);
    assert.deepEqual(g.calls.painted.at(-1), 'card 0', 'the big frame shows card 1');
    assert.equal(g.candidates[0].rejected, false, 'viewing never rejects a card');
    assert.equal(g.identified, false);
    assert.equal(g.message, '', 'no wrong-pick sentence');
    assert.match(g.announced.at(-1), /Showing card 1, Jesse Tran, at full size/);
    // the same control again goes back to the lift
    g._action('view', { index: '0' });
    assert.equal(g.viewing, null);
    assert.equal(g.calls.painted.at(-1), 'lift');
});

test('V cycles the big frame through the cards and back to the lift', () => {
    const g = compareGame();
    const press = key => g._onKeyDown({ key, target: null, preventDefault() {} });
    press('v'); assert.equal(g.viewing, 0);
    press('V'); assert.equal(g.viewing, 1);
    press('v'); assert.equal(g.viewing, 2);
    press('v'); assert.equal(g.viewing, null);
    assert.ok(g.candidates.every(c => !c.rejected) && !g.identified, 'cycling picks nothing');
});

test('picks behave as before, and a pick returns the big frame to the lift', () => {
    const g = compareGame();
    g._viewCard(0);
    g._chooseRef(0);
    assert.equal(g.viewing, null);
    assert.equal(g.candidates[0].rejected, true);
    assert.match(g.message, /^No match: same pattern, but the minutiae differ\. Your lift has a fork below and to the left of the centre; that card has a ridge ending there\.$/);
    g._chooseRef(1);
    assert.match(g.message, /that card is a loop and your lift is a whorl/);
    g._viewCard(2);
    g._chooseRef(2);
    assert.equal(g.identified, true);
    assert.equal(g.viewing, null);
    // after the match the view controls do nothing
    g._viewCard(0);
    assert.equal(g.viewing, null);
});

test('number keys still pick; V never does', () => {
    const g = compareGame();
    g._onKeyDown({ key: 'v', target: null, preventDefault() {} });
    g._onKeyDown({ key: '2', target: null, preventDefault() {} });
    assert.equal(g.candidates[1].rejected, true);
    assert.equal(g.viewing, null);
});

test('each card has its own pick button and a separate View large button; none once identified', () => {
    const g = compareGame();
    g.viewing = 1;
    const html = g._refButtons(false);
    assert.equal((html.match(/data-action="ref"/g) || []).length, 3);
    assert.equal((html.match(/data-action="view"/g) || []).length, 3);
    assert.match(html, /data-action="view" data-index="1" aria-pressed="true"[^>]*>Back to my lift</);
    assert.match(html, /data-action="view" data-index="0" aria-pressed="false" aria-label="View card 1, Jesse Tran, at full size">View large</);
    const done = g._refButtons(true);
    assert.equal((done.match(/data-action="view"/g) || []).length, 0);
});

test('the key under the lift explains the marks and that viewing is not a pick; gone once identified', () => {
    const g = compareGame();
    const note = g._compareNote();
    assert.match(note, /ridge ending/);
    assert.match(note, /press V to step through the cards\. Viewing is not a pick/);
    g.identified = true;
    assert.equal(g._compareNote(), '');
});
