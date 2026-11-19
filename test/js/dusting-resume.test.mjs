// Dusting D183 item 3: dusting progress survives a reload through per-viewer localStorage only.
// Keyed by game id + object id, small and bounded, every storage call guarded, cleared on completion,
// and nothing is written to the synced game state.
// Run with: node --max-old-space-size=2048 test/js/dusting-resume.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = mkdtempSync(join(tmpdir(), 'dusting-resume-'));
cpSync(join(here, '../../public/break_escape/js'), join(root, 'js'), { recursive: true });
writeFileSync(join(root, 'package.json'), '{"type":"module"}');

const el = () => ({ setAttribute() {}, appendChild() {}, style: {} });
const mem = new Map();
const fakeStorage = {
    getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: k => { mem.delete(k); }
};
globalThis.window = { gameState: { globalVariables: {}, biometricSamples: [] }, localStorage: fakeStorage, breakEscapeConfig: { gameId: 77 } };
globalThis.document = { getElementById: () => null, createElement: el, head: { appendChild() {} }, body: { appendChild() {} } };
globalThis.Image = class {};
const m = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-model.js')).href);
const { DustingMinigame } = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-game.js')).href);
const { DustField, TOOLS, PROGRESS_MAX_CHARS, PROGRESS_MAX_ENTRIES } = m;

function dusted() {
    const f = new DustField(128, { pfog: 6 });
    f.brushLine(30, 40, 90, 40, TOOLS.fine); f.brushLine(90, 50, 30, 50, TOOLS.fine);
    return f;
}
const entryOf = (f, powder = 'black') => m.packProgress({ step: 'dust', powder, tool: 'fine', quality: 0.5 }, f);
const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };

test('round trip: saved field comes back with the same coverage shape (downsampled)', () => {
    mem.clear();
    const f = dusted();
    assert.ok(m.saveProgress(77, 'obj1', entryOf(f)) === true, 'saved');
    const back = m.loadProgress(77, 'obj1');
    assert.ok(back && back.powder === 'black' && back.step === 'dust', 'entry returns');
    const g = new DustField(128, { pfog: 6 });
    m.upsampleInto(g.P, 128, back.p);
    let near = 0, far = 0;
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const i = y * 128 + x; if (f.P[i] > 0.5 && g.P[i] > 0.1) near++; if (f.P[i] === 0 && g.P[i] > 0.5) far++; }
    assert.ok(near > 200, `dusted area survives: ${near}`);
    assert.ok(far < 400, `little spill outside: ${far}`);
});

test('keyed by game id and object id', () => {
    mem.clear();
    m.saveProgress(77, 'a', entryOf(dusted()));
    assert.ok(m.loadProgress(78, 'a') === null, 'other game sees nothing');
    assert.ok(m.loadProgress(77, 'b') === null, 'other object sees nothing');
    assert.ok(m.loadProgress(77, 'a') !== null, 'same game and object does');
});

test('size bound: one entry is under the limit and the store never holds more than the entry cap', () => {
    mem.clear();
    const f = new DustField(128, { pfog: 6 }); f.fill(30);   // worst case, every cell saturated
    const text = JSON.stringify(entryOf(f));
    assert.ok(text.length <= PROGRESS_MAX_CHARS, `entry ${text.length} chars`);
    for (let k = 0; k < PROGRESS_MAX_ENTRIES + 5; k++) m.saveProgress(77, `o${k}`, entryOf(dusted()));
    const keys = [...mem.keys()].filter(k => k !== 'breakEscape.dusting.index');
    assert.ok(keys.length <= PROGRESS_MAX_ENTRIES, `${keys.length} entries kept`);
    assert.ok(m.loadProgress(77, 'o0') === null, 'oldest pruned');
    assert.ok(m.loadProgress(77, `o${PROGRESS_MAX_ENTRIES + 4}`) !== null, 'newest kept');
    assert.ok(m.saveProgress(77, 'big', { ...entryOf(dusted()), extra: 'x'.repeat(PROGRESS_MAX_CHARS) }) === false, 'oversize entry refused');
});

test('clearing removes the entry and its index record', () => {
    mem.clear();
    m.saveProgress(77, 'c', entryOf(dusted()));
    m.clearProgress(77, 'c');
    assert.ok(m.loadProgress(77, 'c') === null, 'gone');
    assert.ok(!(mem.get('breakEscape.dusting.index') || '').includes('.c"'), 'index pruned');
});

test('storage missing or throwing: save, load and clear return quietly', () => {
    assert.ok(m.saveProgress(77, 'x', entryOf(dusted()), throwing) === false, 'save false');
    assert.ok(m.loadProgress(77, 'x', throwing) === null, 'load null');
    m.clearProgress(77, 'x', throwing);
    assert.ok(m.saveProgress(77, 'x', entryOf(dusted()), null) === false, 'null storage');
    assert.ok(m.loadProgress(77, 'x', null) === null, 'null storage load');
});

test('corrupt or hostile entries load as nothing', () => {
    mem.clear();
    for (const raw of ['{', '"x"', '{"v":1,"step":"dust","powder":"nope","tool":null,"p":[],"f":[]}', '{"v":2}']) {
        mem.set(m.progressKey(77, 'bad'), raw);
        assert.ok(m.loadProgress(77, 'bad') === null, `rejected ${raw.slice(0, 20)}`);
    }
});

function game(step = 'dust') {
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, {
        gameId: 77, objectId: 'panelX', step, found: true, powder: 'black', tool: 'fine', field: dusted(), metrics: { coverage: 0.5 },
        _resultSent: false, resume: null, announced: [], steps: []
    });
    g._currentQuality = () => 0.6;
    g._setStep = s => { g.steps.push(s); g.step = s; };
    g._refreshMetrics = () => {}; g._setBrushed = () => {}; g.announce = t => g.announced.push(t);
    return g;
}

test('game: save in the dust step, resume restores powder, tool and field', () => {
    mem.clear();
    const g = game();
    assert.ok(g._saveProgress() === true, 'saved');
    const h = game('examine'); h.field = new DustField(128, { pfog: 6 }); h.powder = null; h.tool = null; h.found = false;
    h.resume = m.loadProgress(77, 'panelX');
    assert.ok(h.resume !== null, 'entry found on reopen');
    h._resumeDusting();
    assert.ok(h.powder === 'black' && h.tool === 'fine' && h.found === true, 'state back');
    assert.ok(h.steps[h.steps.length - 1] === 'dust', 'lands on the dust step');
    assert.ok(h.field.P[40 * 128 + 60] > 0.2, 'dusted cell restored');
});

test('game: nothing dusted, a result already sent, or the wrong step saves nothing', () => {
    mem.clear();
    const e = game(); e.field = new DustField(128, { pfog: 6 });
    assert.ok(e._saveProgress() === false, 'empty field');
    const d = game(); d._resultSent = true;
    assert.ok(d._saveProgress() === false, 'after result');
    const f = game('find');
    assert.ok(f._saveProgress() === false, 'find step');
    assert.ok(mem.size === 0, 'store untouched');
});

test('game: completion clears the entry', () => {
    mem.clear();
    const g = game(); g._saveProgress();
    assert.ok(m.loadProgress(77, 'panelX') !== null, 'present before');
    g._clearProgress();
    assert.ok(m.loadProgress(77, 'panelX') === null, 'cleared');
});

test('game: with storage throwing the game paths do not throw', () => {
    const real = window.localStorage;
    window.localStorage = throwing;
    try {
        const g = game();
        assert.ok(g._saveProgress() === false, 'save false');
        g._clearProgress();
        g.resume = null; g._resumeDusting();
        assert.ok(g.steps.includes('find'), 'resume with nothing falls back to find');
    } finally { window.localStorage = real; }
});

test('nothing synced: saving does not touch gameState', () => {
    mem.clear();
    const before = JSON.stringify(window.gameState);
    game()._saveProgress();
    assert.ok(JSON.stringify(window.gameState) === before, 'gameState unchanged');
});

test('m1: fog does not drop across save and restore (fog passes are max-pooled, not averaged)', () => {
    mem.clear();
    for (const pfog of [5, 6, 7]) {
        const f = new DustField(128, { pfog });
        const tool = { ...TOOLS.fine, radius: TOOLS.fine.radius * 2, strength: TOOLS.fine.strength * 2 };
        for (let pass = 0; pass < 3; pass++) { f.brush(40, 40, tool); f.brushLine(40, 40, 90, 40, tool, 0); f.brushLine(90, 40, 40, 40, tool, 0); }
        const total = fld => { let t = 0; for (let i = 0; i < fld.FP.length; i++) t += fld.fog(i); return t; };
        const before = total(f);
        assert.ok(before > 5, `pfog ${pfog}: the test stroke fogs (${before.toFixed(2)})`);
        assert.ok(m.saveProgress(77, 'fog' + pfog, entryOf(f)) === true, 'saved');
        const back = m.loadProgress(77, 'fog' + pfog), g = new DustField(128, { pfog });
        m.upsampleInto(g.P, 128, back.p); m.upsampleInto(g.FP, 128, back.f);
        const after = total(g), r = after / before;
        assert.ok(r >= 0.8, `pfog ${pfog}: fog ${before.toFixed(2)} before, ${after.toFixed(2)} after (${r.toFixed(2)}x)`);
        assert.ok(r <= 2, `pfog ${pfog}: fog does not balloon on restore (${r.toFixed(2)}x)`);
    }
});

globalThis.cancelAnimationFrame = globalThis.cancelAnimationFrame || (() => {});
const Base = Object.getPrototypeOf(DustingMinigame.prototype);
function withBaseStubs(fn) {
    const c = Base.cleanup, k = Base.complete;
    Base.cleanup = function () { this._baseCleaned = true; };
    Base.complete = function (ok) { this._baseCompleted = ok; return ok; };
    try { fn(); } finally { Base.cleanup = c; Base.complete = k; }
}
const forGame = () => {
    const g = game();
    Object.assign(g, { _timers: [], mounted: true, final: false, params: {}, _buildResult: () => ({ quality: 0.8 }) });
    return g;
};

test('m2: cleanup after the peel (scripted call mid-compare) logs the lift and clears the resume entry', () => {
    withBaseStubs(() => {
        mem.clear();
        const g = forGame(); g._saveProgress();
        assert.ok(m.loadProgress(77, 'panelX') !== null, 'entry present before');
        g.final = true; g.step = 'compare';
        let logged = 0; g.params = { onForcedEnd: r => { logged += r.viaClose ? 1 : 0; } };
        g.cleanup();
        assert.ok(logged === 1, 'lift logged once');
        assert.ok(m.loadProgress(77, 'panelX') === null, 'resume entry cleared, so the next interact shows Lift on file');
    });
});

test('m3: X mid-dust (complete) and a forced cleanup mid-dust save the work; no save once a result is sent', () => {
    withBaseStubs(() => {
        mem.clear();
        const g = forGame();
        g.complete(false);
        assert.ok(m.loadProgress(77, 'panelX') !== null, 'complete(false) mid-dust saved');
        mem.clear();
        const h = forGame(); h.cleanup();
        assert.ok(m.loadProgress(77, 'panelX') !== null, 'cleanup mid-dust saved');
        mem.clear();
        const d = forGame(); d._resultSent = true; d.complete(false); d.cleanup();
        assert.ok(m.loadProgress(77, 'panelX') === null, 'nothing saved after a result');
        const l = forGame(); l.step = 'lift'; l.complete(false);
        assert.ok(m.loadProgress(77, 'panelX') === null, 'the lift step is not saved');
    });
});

test('m3: keyboard only: Enter turns brushing on, arrows brush, Enter off saves', () => {
    mem.clear();
    const g = forGame();
    Object.assign(g, { gameState: { isActive: true }, reticle: { x: 30, y: 90 }, field: new DustField(128, { pfog: 6 }), difficultyId: 'medium', toolStrokes: 0,
        stickyBrush: false, spaceHeld: false, dirty: false, _refreshDynamic() {}, _updateNear() {} });
    g.metrics = { coverage: 0.1 };
    const key = (k, extra = {}) => g._onKeyDown({ key: k, target: { tagName: 'CANVAS' }, preventDefault() {}, ctrlKey: false, metaKey: false, altKey: false, ...extra });
    key('Enter');
    assert.ok(g.stickyBrush === true && g._brushCarry === 0, 'brushing on, carry reset');
    for (let i = 0; i < 12; i++) key('ArrowRight');
    assert.ok(g.field.P.some(v => v > 0), 'arrow steps laid powder');
    assert.ok(m.loadProgress(77, 'panelX') === null, 'nothing saved while brushing');
    key('Enter');
    assert.ok(g.stickyBrush === false, 'brushing off');
    const back = m.loadProgress(77, 'panelX');
    assert.ok(back !== null && back.p.some(v => v > 0), 'Enter off saved the powder');
});
