// Gap tests for ui/influence-bar.js: out-of-range and junk values, degenerate scales, threshold
// equality, change-line rules (silent, zero, other character, ink, new_call), seeding from the
// service log and from a reloaded pretext session, destroy and double destroy, display flags.
// Run with: bin/test-js test/js/social-gap-influence-bar.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-influence-bar-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['ui/influence-bar.js', 'systems/social-influence.js', 'systems/global-writer.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.warn = () => {};
const { createInfluenceBar, readBarConfig, InfluenceBar } = await import(pathToFileURL(join(dir, 'ui/influence-bar.js')));

function dispatcher() {
    const l = new Map();
    return {
        on(n, f) { l.set(n, [...(l.get(n) || []), f]); },
        off(n, f) { l.set(n, (l.get(n) || []).filter((x) => x !== f)); },
        emit(n, d) { (l.get(n) || []).slice().forEach((f) => f(d)); },
        count(n) { return (l.get(n) || []).length; },
    };
}
const chars = (over = {}) => ({
    amy: {
        displayName: 'Amy',
        influence: { global: 'amy_influence', min: -100, max: 100, start: 0 },
        thresholds: [{ id: 'trusts', at: 40, icon: 'trusts' }, { id: 'wary', at: -40, icon: 'wary' }, { id: 'weird_one', at: -90 }],
        ...over,
    },
});
function setup({ characters = chars(), globals = {}, display, declared = { amy_influence: 0 } } = {}) {
    const scenario = { globalVariables: declared, social: { characters, ...(display ? { influenceDisplay: display } : {}) } };
    window.gameScenario = scenario;
    window.gameState = { globalVariables: { ...declared, ...globals } };
    window.eventDispatcher = dispatcher();
    delete window.socialInfluence;
    document.body.innerHTML = '';
    return scenario;
}
const mount = (o = { characterId: 'amy' }) => { const b = createInfluenceBar(o); if (b) document.body.appendChild(b.el); return b; };
const g = () => window.gameState.globalVariables;
const change = (b) => b.el.querySelector('.ib-infl-change').textContent;
const emit = (d) => window.eventDispatcher.emit('npc_influence_changed', d);

// ── factory ──────────────────────────────────────────────────────────────────

test('createInfluenceBar returns null for no scenario, a non-string id, an unknown id, and a non-object character', () => {
    setup();
    assert.equal(createInfluenceBar({}), null);
    assert.equal(createInfluenceBar({ characterId: 5 }), null);
    assert.equal(createInfluenceBar({ characterId: 'nobody' }), null);
    window.gameScenario = null;
    assert.equal(createInfluenceBar({ characterId: 'amy' }), null);
    assert.equal(createInfluenceBar({ characterId: 'amy', scenario: { social: { characters: { amy: 'str' } } } }), null);
    assert.equal(createInfluenceBar({ characterId: 'amy', scenario: { social: { characters: { amy: [] } } } }), null);
});

test('an explicit scenario option beats window.gameScenario', () => {
    setup();
    const b = createInfluenceBar({ characterId: 'zed', scenario: { social: { characters: { zed: { displayName: 'Zed' } } } }, getGlobals: () => ({}) });
    assert.ok(b);
    assert.match(b.el.getAttribute('aria-label'), /^Zed:/);
});

// ── config parsing ───────────────────────────────────────────────────────────

test('readBarConfig: defaults, junk bounds, a collapsed scale, and threshold filtering', () => {
    const cfg = readBarConfig({ social: { characters: { a: { influence: { min: 'x', max: null }, thresholds: [null, { id: 'ok', at: -5 }, { id: 5, at: 1 }, { id: 'n', at: '3' }, { id: 'up', at: 7, icon: 9 }, { id: 'explicit', at: 5, when: 'below' }] } } } }, 'a');
    assert.equal(cfg.min, -100);
    assert.equal(cfg.max, 100);
    assert.equal(cfg.global, 'a_influence');
    assert.deepEqual(cfg.thresholds.map((t) => [t.id, t.when, t.icon]), [['ok', 'below', null], ['up', 'above', null], ['explicit', 'below', null]]);
    const collapsed = readBarConfig({ social: { characters: { a: { influence: { min: 10, max: 10 } } } } }, 'a');
    assert.equal(collapsed.max, 11, 'a zero-width scale is widened so the percent never divides by zero');
    const reversed = readBarConfig({ social: { characters: { a: { influence: { min: 50, max: -50 } } } } }, 'a');
    assert.equal(reversed.max, 51);
    assert.equal(readBarConfig(null, 'a'), null);
    assert.equal(readBarConfig({}, 'a'), null);
});

test('start value: influence.start, else the declared global, else 0', () => {
    const sc = (influence, declared) => ({ globalVariables: declared, social: { characters: { a: { influence } } } });
    assert.equal(readBarConfig(sc({ start: 7 }, { a_influence: 3 }), 'a').start, 7);
    assert.equal(readBarConfig(sc({}, { a_influence: 3 }), 'a').start, 3);
    assert.equal(readBarConfig(sc({}, {}), 'a').start, 0);
    assert.equal(readBarConfig(sc({ start: 'x' }, { a_influence: 'y' }), 'a').start, 0);
    assert.equal(readBarConfig(sc({ global: 'custom' }, { custom: 9 }), 'a').start, 9);
});

// ── value and drawing ────────────────────────────────────────────────────────

test('a value beyond the scale draws a full or empty track but prints and announces the real number', () => {
    setup({ globals: { amy_influence: 250 } });
    const b = mount();
    assert.equal(b.el.querySelector('.ib-infl-fill').style.width, '100%');
    assert.equal(b.el.querySelector('.ib-infl-number').textContent, '250');
    assert.equal(b.el.querySelector('[role="meter"]').getAttribute('aria-valuenow'), '250');
    g().amy_influence = -999;
    b.update();
    assert.equal(b.el.querySelector('.ib-infl-fill').style.width, '0%');
});

test('a non-numeric or NaN global falls back to the start value', () => {
    for (const bad of ['12', NaN, null, {}, Infinity]) {
        setup({ globals: { amy_influence: bad } });
        const b = mount();
        assert.equal(b.value(), 0, String(bad));
    }
});

test('percent maps the scale ends to 0 and 100 and the middle to 50; marks sit at their value, clamped to the track', () => {
    setup({ characters: chars({ thresholds: [{ id: 'far_left', at: -500 }, { id: 'far_right', at: 500, when: 'above' }, { id: 'mid', at: 0 }] }) });
    const b = mount();
    const left = (id) => b.el.querySelector(`.ib-infl-mark[data-threshold="${id}"]`).style.left;
    assert.equal(left('far_left'), '0%');
    assert.equal(left('far_right'), '100%');
    assert.equal(left('mid'), '50%');
    g().amy_influence = -100; b.update(); assert.equal(b.getState().percent, 0);
    g().amy_influence = 100; b.update(); assert.equal(b.getState().percent, 100);
    g().amy_influence = 0; b.update(); assert.equal(b.getState().percent, 50);
});

test('threshold marks and legend: equality is reached on both sides; one short is not; both read the same words', () => {
    setup({ globals: { amy_influence: 40 } });
    const b = mount();
    const st = () => Object.fromEntries(b.getState().thresholds.map((t) => [t.id, t.reached]));
    assert.equal(st().trusts, true);
    assert.equal(st().wary, false);
    g().amy_influence = 39; b.update();
    assert.equal(st().trusts, false);
    g().amy_influence = -40; b.update();
    assert.equal(st().wary, true);
    const item = b.el.querySelector('.ib-infl-legend-item[data-threshold="wary"]');
    assert.match(item.textContent.replace(/\s+/g, ' '), /Wary at -40: reached/);
    assert.ok(b.el.querySelector('.ib-infl-mark[data-threshold="wary"]').classList.contains('is-reached'));
    g().amy_influence = -39; b.update();
    assert.match(item.textContent, /not reached/);
});

test('a threshold id with underscores reads in words in the legend', () => {
    setup();
    const b = mount();
    assert.match(b.el.querySelector('[data-threshold="weird_one"] .ib-infl-legend-name').textContent, /^Weird one at -90:/);
});

test('is-below-start / is-above-start follow the value against the start; at the start neither', () => {
    setup({ globals: { amy_influence: 5 } });
    const b = mount();
    assert.ok(b.el.classList.contains('is-above-start'));
    g().amy_influence = -5; b.update();
    assert.ok(b.el.classList.contains('is-below-start'));
    g().amy_influence = 0; b.update();
    assert.ok(!b.el.classList.contains('is-below-start') && !b.el.classList.contains('is-above-start'));
});

test('a character with no thresholds has no legend and no marks and still draws', () => {
    setup({ characters: chars({ thresholds: [] }) });
    const b = mount();
    assert.equal(b.el.querySelector('.ib-infl-legend'), null);
    assert.equal(b.el.querySelectorAll('.ib-infl-mark').length, 0);
});

test('unknown threshold icon keys fall back to a question mark icon, never a broken name', () => {
    setup({ characters: chars({ thresholds: [{ id: 'a', at: 1, icon: 'made_up' }, { id: 'b', at: 2 }] }) });
    const b = mount();
    for (const img of b.el.querySelectorAll('.ib-infl-mark-icon')) assert.match(img.getAttribute('src'), /mark-question\.png$/);
});

// ── display flags ────────────────────────────────────────────────────────────

test('number:false removes the number but keeps the track; bar:false removes everything; bar:false with number:true is still nothing', () => {
    setup({ display: { number: false } });
    const noNumber = mount();
    assert.equal(noNumber.el.querySelector('.ib-infl-number'), null);
    assert.equal(noNumber.getState().numberShown, false);
    assert.equal(noNumber.getState().numberText, null);
    assert.ok(noNumber.el.querySelector('[role="meter"]'));
    setup({ display: { bar: false, number: true } });
    assert.equal(mount(), null);
});

// ── the change line ──────────────────────────────────────────────────────────

test('events: other characters, silent changes, zero deltas and non-numeric deltas never set the line; own changes do, with the sign', () => {
    setup();
    const b = mount();
    emit({ character: 'someone_else', delta: 5, reason: 'x' });
    emit({ character: 'amy', delta: 5, silent: true });
    emit({ character: 'amy', delta: 0 });
    emit({ character: 'amy', delta: '5' });
    emit(undefined);
    emit('junk');
    assert.equal(change(b), '');
    emit({ character: 'amy', delta: 10, reason: 'urgency' });
    assert.equal(change(b), 'Last change: +10 urgency');
    emit({ character: 'amy', delta: -4, reason: 'senderTrust' });
    assert.equal(change(b), 'Last change: -4 sender trust');
    emit({ delta: 3 }); // no character: counts as ours
    assert.equal(change(b), 'Last change: +3');
});

test('reason words: ink and empty reasons are dropped, ids read as words, factor ids use plain English', () => {
    setup();
    const b = mount();
    emit({ character: 'amy', delta: 1, reason: 'ink' });
    assert.equal(change(b), 'Last change: +1');
    emit({ character: 'amy', delta: 1, reason: '' });
    assert.equal(change(b), 'Last change: +1');
    emit({ character: 'amy', delta: 1, reason: null });
    assert.equal(change(b), 'Last change: +1');
    emit({ character: 'amy', delta: 1, reason: 'payslip_date' });
    assert.equal(change(b), 'Last change: +1 payslip date');
    emit({ character: 'amy', delta: 1, reason: 'linkCredible' });
    assert.equal(change(b), 'Last change: +1 the link');
});

test('a new_call event clears the line and never becomes the line, even with a delta', () => {
    setup();
    const b = mount();
    emit({ character: 'amy', delta: 10, reason: 'urgency' });
    emit({ character: 'amy', delta: -30, reason: 'new_call' });
    assert.equal(change(b), '');
    emit({ delta: 0, reason: 'new_call' });
    assert.equal(change(b), '');
});

test('the global event only redraws: the value changes on screen but the change line stays', () => {
    setup();
    const b = mount();
    emit({ character: 'amy', delta: 10, reason: 'urgency' });
    g().amy_influence = 25;
    window.eventDispatcher.emit('global_variable_changed:amy_influence', { value: 999 });
    assert.equal(b.el.querySelector('.ib-infl-number').textContent, '25', 'reads gameState, not the event value');
    assert.equal(change(b), 'Last change: +10 urgency');
});

test('setChangeFromTurn: empty, junk and non-numeric entries are ignored; the total can be zero; ties go to the later entry', () => {
    setup();
    const b = mount();
    b.setChangeFromTurn();
    b.setChangeFromTurn([]);
    b.setChangeFromTurn([null, 'x', { delta: '5' }]);
    assert.equal(change(b), '');
    b.setChangeFromTurn([{ delta: 10, reason: 'a_fact' }, { delta: -10, reason: 'urgency' }]);
    assert.equal(change(b), 'Last change: 0 urgency');
    b.setChangeFromTurn([{ delta: -20, reason: 'first' }, { delta: 5, reason: 'small' }, { delta: -20, reason: 'second' }]);
    assert.equal(change(b), 'Last change: -35 second');
});

// ── seeding on mount ─────────────────────────────────────────────────────────

test('a bar mounted after a service change shows that change; silent and zero entries are skipped; a new_call boundary stops the scan', () => {
    setup();
    window.socialInfluence = { getLog: () => [{ delta: 7, reason: 'urgency' }, { delta: 3, reason: 'x', kind: 'silent' }, { delta: 0, reason: 'y' }, null] };
    assert.equal(change(mount()), 'Last change: +7 urgency');
    window.socialInfluence = { getLog: () => [{ delta: 7, reason: 'old' }, { delta: -30, reason: 'new_call' }, { delta: 0, reason: 'x' }] };
    assert.equal(change(mount()), '');
    window.socialInfluence = { getLog: () => 'not an array' };
    assert.equal(change(mount()), '');
    window.socialInfluence = { getLog: () => { throw new Error('boom'); } };
    assert.doesNotThrow(() => mount());
});

test('after a reload the line comes from the persisted pretext session of this character only, last non-zero entry', () => {
    setup({ globals: {
        pretext_c1_state: { character: 'amy', log: [{ entries: [{ delta: 5, reason: 'first' }] }, { entries: [{ delta: 0, reason: 'zero' }, { delta: -12, reason: 'urgency' }] }, { entries: 'bad' }, null] },
        pretext_c2_state: { character: 'someone_else', log: [{ entries: [{ delta: 99, reason: 'other' }] }] },
        pretext_c3_state: 'junk',
        pretext_c4_state: { character: 'amy', log: 'bad' },
    } });
    assert.equal(change(mount()), 'Last change: -12 urgency');
});

test('no service log and no session leaves the line empty', () => {
    setup();
    assert.equal(change(mount()), '');
});

// ── lifecycle ────────────────────────────────────────────────────────────────

test('destroy unsubscribes both listeners, removes the element, and a second destroy is harmless', () => {
    setup();
    const b = mount();
    const d = window.eventDispatcher;
    assert.equal(d.count('npc_influence_changed'), 1);
    assert.equal(d.count('global_variable_changed:amy_influence'), 1);
    b.destroy();
    assert.equal(d.count('npc_influence_changed'), 0);
    assert.equal(d.count('global_variable_changed:amy_influence'), 0);
    assert.equal(document.querySelector('.influence-bar'), null);
    assert.doesNotThrow(() => b.destroy());
    emit({ character: 'amy', delta: 5 });
});

test('mounting two bars for the same character and destroying one leaves the other live', () => {
    setup();
    const a = mount();
    const b = mount();
    a.destroy();
    g().amy_influence = 33;
    window.eventDispatcher.emit('global_variable_changed:amy_influence', {});
    assert.equal(b.el.querySelector('.ib-infl-number').textContent, '33');
});

test('no dispatcher: the bar draws once and never throws on update; a dispatcher without on() is tolerated', () => {
    setup();
    window.eventDispatcher = null;
    const b = createInfluenceBar({ characterId: 'amy', getGlobals: () => g() });
    assert.ok(b);
    assert.doesNotThrow(() => b.update());
    const c = createInfluenceBar({ characterId: 'amy', dispatcher: {}, getGlobals: () => g() });
    assert.ok(c);
    assert.doesNotThrow(() => c.destroy());
});

test('no getGlobals and no gameState: the value is the start value', () => {
    setup();
    window.gameState = undefined;
    const b = createInfluenceBar({ characterId: 'amy', dispatcher: dispatcher() });
    assert.equal(b.value(), 0);
});

test('the mount label lands on data-mount only when given; aria labels carry the display name', () => {
    setup();
    const a = createInfluenceBar({ characterId: 'amy', mount: 'chat', getGlobals: () => g() });
    assert.equal(a.el.dataset.mount, 'chat');
    const b = createInfluenceBar({ characterId: 'amy', getGlobals: () => g() });
    assert.equal(b.el.dataset.mount, undefined);
    assert.match(a.el.querySelector('[role="meter"]').getAttribute('aria-label'), /^Amy's influence/);
});

test('InfluenceBar class is exported and usable directly with a hand-built config', () => {
    setup();
    const cfg = readBarConfig(window.gameScenario, 'amy');
    const bar = new InfluenceBar(cfg, { bar: true, number: true, pip: true }, { getGlobals: () => g(), dispatcher: dispatcher() });
    assert.equal(bar.getState().value, 0);
});
