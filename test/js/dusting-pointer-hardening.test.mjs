// Dusting hardening: `wide` uses the same phone test as the CSS (max-width: 760px), and a stroke whose pointer capture
// is lost (or cancelled) ends cleanly. Run with: node --max-old-space-size=2048 test/js/dusting-pointer-hardening.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const root = mkdtempSync(join(tmpdir(), 'dusting-ptr-'));
cpSync(join(pub, 'js'), join(root, 'js'), { recursive: true });
writeFileSync(join(root, 'package.json'), '{"type":"module"}');

const el = () => ({ setAttribute() {}, appendChild() {}, style: {} });
globalThis.window = { gameState: { globalVariables: {} }, innerWidth: 1280, innerHeight: 720 };
globalThis.document = { getElementById: () => null, createElement: el, head: { appendChild() {} }, body: { appendChild() {} } };
globalThis.Image = class {};
const { DustingMinigame } = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-game.js')).href);
const proto = DustingMinigame.prototype;
const src = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');

function layoutAt(w, mm) {
    window.innerWidth = w; window.innerHeight = 900;
    if (mm) window.matchMedia = q => ({ matches: mm(w), media: q }); else delete window.matchMedia;
    const g = {
        step: 'examine', root: { classList: { contains: () => false, toggle() {} } }, canvas: { style: {}, hidden: false },
        _placeFoot() {}, _zoomInStage: () => false
    };
    try { proto._layout.call(g); } finally { delete window.matchMedia; }
    return g.wide;
}

test('wide: exactly 760 wide is phone, 761 is wide (matchMedia present, as in a browser)', () => {
    const mm = w => w <= 760;   // what (max-width: 760px) does
    assert.ok(layoutAt(760, mm) === false, '760 is not wide');
    assert.ok(layoutAt(761, mm) === true, '761 is wide');
    assert.ok(layoutAt(390, mm) === false, '390 is not wide');
});

test('wide: without matchMedia the innerWidth fallback agrees (760 phone, 761 wide)', () => {
    assert.ok(layoutAt(760, null) === false, '760 is not wide');
    assert.ok(layoutAt(761, null) === true, '761 is wide');
});

test('wide follows matchMedia over innerWidth', () => {
    assert.ok(layoutAt(1280, () => true) === false, 'matchMedia says phone');
    assert.ok(layoutAt(390, () => false) === true, 'matchMedia says wide');
});

test('a real lostpointercapture event on the canvas ends the stroke (listener is bound and routed)', () => {
    const cv = new EventTarget();
    const captured = new Set([7]);
    cv.setPointerCapture = id => captured.add(id); cv.releasePointerCapture = id => captured.delete(id);
    cv.hasPointerCapture = id => captured.has(id);
    const saved = [];
    const g = {
        canvas: cv, hcBox: new EventTarget(), steadyBox: new EventTarget(), step: 'dust', pointerDown: true, _pointerId: 7, lastPt: { x: 1, y: 1 }, _touchFind: false, _brushCarry: 2,
        _saveProgress() { saved.push(1); }, _attemptFind() {}, _bindPanel() {}, _onPointerDown() {}, _onPointerMove() {},
        addEventListener(target, type, fn) { target.addEventListener(type, fn); },
        _onPointerUp: proto._onPointerUp
    };
    const keep = { d: globalThis.document, w: globalThis.window };
    globalThis.document = new EventTarget(); globalThis.window = Object.assign(new EventTarget(), { gameState: {} });
    try { proto._bind.call(g); } finally { globalThis.document = keep.d; globalThis.window = keep.w; }
    const lost = new Event('lostpointercapture'); lost.pointerId = 7;
    captured.delete(7);
    cv.dispatchEvent(lost);
    assert.ok(g.pointerDown === false && g._pointerId === null && g.lastPt === null, 'stroke ended by the event');
    assert.ok(saved.length === 1, 'dust progress saved once');
    cv.dispatchEvent(lost);
    assert.ok(saved.length === 1, 'a second lostpointercapture after the end does nothing');
    // a fresh stroke, then a real pointercancel on the canvas ends it too
    Object.assign(g, { pointerDown: true, _pointerId: 7, lastPt: { x: 2, y: 2 } }); captured.add(7);
    const cancel = new Event('pointercancel'); cancel.pointerId = 7;
    cv.dispatchEvent(cancel);
    assert.ok(g.pointerDown === false && g._pointerId === null && g.lastPt === null, 'stroke ended by pointercancel');
    assert.ok(saved.length === 2, 'dust progress saved by the cancel');
});

function stroker(step = 'dust') {
    const saved = [], captured = new Set();
    const g = {
        step, pointerDown: false, lastPt: null, reticle: null, _touchFind: false, _brushCarry: 0, dirty: false,
        canvas: {
            setPointerCapture: id => captured.add(id), releasePointerCapture: id => captured.delete(id),
            hasPointerCapture: id => captured.has(id), focus() {}
        },
        _canvasPos: e => ({ x: e.x, y: e.y }), _countStroke() {}, _updateNear() {}, _saveProgress() { saved.push(1); },
        _act() {}, _attemptFind() { g.found = (g.found || 0) + 1; }
    };
    return { g, saved, captured };
}
const ev = (type, pointerId, x = 5, y = 5, pointerType = 'touch') => ({ type, pointerId, x, y, pointerType, preventDefault() {} });

test('lostpointercapture mid-stroke ends the stroke: no stuck brushing, saved once, no stray find attempt', () => {
    for (const step of ['dust', 'lift', 'examine', 'powder']) {
        const { g, saved, captured } = stroker(step);
        proto._onPointerDown.call(g, ev('pointerdown', 7));
        assert.ok(g.pointerDown && captured.has(7), `${step}: stroke running, captured`);
        captured.delete(7);   // the browser has already dropped the capture when the event fires
        proto._onPointerUp.call(g, ev('lostpointercapture', 7));
        assert.ok(g.pointerDown === false && g.lastPt === null && g._pointerId == null, `${step}: stroke ended`);
        assert.ok(captured.size === 0, `${step}: no capture left`);
        assert.ok(saved.length === (step === 'dust' ? 1 : 0), `${step}: progress saved once for dust only`);
        proto._onPointerMove.call(g, ev('pointermove', 7, 9, 9));
        assert.ok(g.lastPt === null, `${step}: a later move does not brush`);
        proto._onPointerDown.call(g, ev('pointerdown', 8));
        assert.ok(g.pointerDown && g._pointerId === 8, `${step}: a fresh stroke can start`);
    }
});

test('lostpointercapture on a touch Find drag does not count as a lift (no find attempt)', () => {
    const { g } = stroker('find');
    proto._onPointerDown.call(g, ev('pointerdown', 3));
    proto._onPointerUp.call(g, ev('lostpointercapture', 3));
    assert.ok(!g.found && g.pointerDown === false && g._touchFind === false, 'ended without a find');
});

test('a second pointer losing capture never ends the stroke', () => {
    const { g } = stroker('dust');
    proto._onPointerDown.call(g, ev('pointerdown', 1));
    proto._onPointerUp.call(g, ev('lostpointercapture', 2));
    assert.ok(g.pointerDown === true && g._pointerId === 1, 'stroke of pointer 1 continues');
});

test('pointerup releases the capture, and the lostpointercapture that follows is a no-op (saved once)', () => {
    const { g, saved, captured } = stroker('dust');
    proto._onPointerDown.call(g, ev('pointerdown', 4));
    proto._onPointerUp.call(g, ev('pointerup', 4));
    assert.ok(captured.size === 0, 'capture released by our own end');
    proto._onPointerUp.call(g, ev('lostpointercapture', 4));
    assert.ok(saved.length === 1 && g.pointerDown === false, 'follow-up event does nothing more');
});

test('pointercancel ends the stroke and releases the capture', () => {
    const { g, captured } = stroker('dust');
    proto._onPointerDown.call(g, ev('pointerdown', 6));
    proto._onPointerUp.call(g, ev('pointercancel', 6));
    assert.ok(g.pointerDown === false && captured.size === 0, 'ended and released');
});

test('a held-open stroke leaves no brush carry for the next one', () => {
    const { g } = stroker('dust');
    proto._onPointerDown.call(g, ev('pointerdown', 1));
    g._brushCarry = 3;
    proto._onPointerUp.call(g, ev('lostpointercapture', 1));
    assert.ok(g._brushCarry === 0, 'carry cleared');
});

test('a touch pointerup in Find attempts the find exactly once', () => {
    const { g } = stroker('find');
    proto._onPointerDown.call(g, ev('pointerdown', 3));
    proto._onPointerUp.call(g, ev('pointerup', 3));
    assert.ok(g.found === 1, 'one find attempt');
    assert.ok(g.pointerDown === false && g._touchFind === false, 'stroke cleared');
});

// releasePointerCapture that fires lostpointercapture synchronously (re-entry into _onPointerUp)
function syncStroker(step) {
    const s = stroker(step);
    const { g, captured } = s;
    g.canvas.releasePointerCapture = id => { captured.delete(id); proto._onPointerUp.call(g, ev('lostpointercapture', id)); };
    return s;
}

test('re-entrant lostpointercapture inside releasePointerCapture: one save in dust', () => {
    const { g, saved } = syncStroker('dust');
    proto._onPointerDown.call(g, ev('pointerdown', 3));
    proto._onPointerUp.call(g, ev('pointerup', 3));
    assert.ok(saved.length === 1, `saved once, got ${saved.length}`);
});

test('re-entrant lostpointercapture inside releasePointerCapture: one find attempt for touch Find', () => {
    const { g } = syncStroker('find');
    proto._onPointerDown.call(g, ev('pointerdown', 3));
    proto._onPointerUp.call(g, ev('pointerup', 3));
    assert.ok(g.found === 1, `find attempted once, got ${g.found}`);
});
