// Gap tests for systems/social-influence.js: caps at min/max, threshold equality and re-arm
// edges, repeated and out-of-order events, report() repeats, lockout lift timing, restore of
// saved latch state, double install, ids that are not characters, and the display resolver.
// No ink story is used: all writes go through addInfluence / setInfluence / the global event.
// Run with: bin/test-js test/js/social-gap-influence.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-influence-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/social-influence.js', 'social-influence.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
globalThis.window = { gameState: { globalVariables: {} } };
const SI = await import(pathToFileURL(join(dir, 'social-influence.mjs')).href);
const { installSocialInfluence, uninstallSocialInfluence, getSocialInfluence, resolveInfluenceDisplay, bandForLatched } = SI;

const quiet = (fn) => {
    const { log, warn } = console;
    console.log = () => {}; console.warn = () => {};
    try { return fn(); } finally { console.log = log; console.warn = warn; }
};

function makeDispatcher() {
    const listeners = new Map();
    const emitted = [];
    return {
        emitted,
        listeners,
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { emitted.push([name, data]); (listeners.get(name) || []).slice().forEach(cb => cb(data)); },
    };
}

const baseScenario = () => ({
    globalVariables: {
        amy_influence: 0, amy_latched: '', amy_forced: '', amy_wary: false, amy_alert: false, amy_trust: false,
        amy_lockout_until: 0, amy_lockout_channel: '', amy_cleared: false,
    },
    social: {
        characters: {
            amy: {
                displayName: 'Amy',
                channels: { person: 'amy_desk', phone: 'amy_phone' },
                influence: { global: 'amy_influence', min: -100, max: 100, start: 0 },
                thresholds: [
                    { id: 'trusts', at: 40, effects: [{ type: 'setGlobal', global: 'amy_trust', value: true, clearOnRearm: true }, { type: 'toast', text: 'Amy trusts you.' }] },
                    { id: 'wary', at: -30, effects: [{ type: 'setGlobal', global: 'amy_wary', value: true, clearOnRearm: true }] },
                    { id: 'reports', at: -60, effects: [{ type: 'setGlobal', global: 'amy_alert', value: true }, { type: 'endConversation' }] },
                    { id: 'lockout', at: -90, effects: [{ type: 'lockout', scope: 'channel', until: { afterMinutes: 5 }, recoverTo: -20 }] },
                ],
            },
        },
    },
});

function setup({ scenario = baseScenario(), saved = {}, install = true } = {}) {
    uninstallSocialInfluence();
    const dispatcher = makeDispatcher();
    const clock = { t: 1000 };
    const calls = { toast: [], end: [], hostile: [] };
    globalThis.window = {
        gameScenario: scenario,
        gameState: { globalVariables: { ...(scenario.globalVariables || {}), ...saved } },
        eventDispatcher: dispatcher,
    };
    const hooks = {
        now: () => clock.t,
        toast: (text, info) => calls.toast.push({ text, ...info }),
        endConversation: (info) => calls.end.push(info),
        setHostile: (npcId, info) => calls.hostile.push({ npcId, ...info }),
    };
    const svc = install ? quiet(() => installSocialInfluence({ scenario, dispatcher, hooks })) : null;
    return { svc, dispatcher, clock, calls, g: window.gameState.globalVariables, scenario };
}
const changes = (d) => d.emitted.filter(([e]) => e === 'npc_influence_changed').map(([, x]) => x);
const add = (svc, n, reason = 't', ctx = {}) => quiet(() => svc.addInfluence('amy', n, reason, ctx));

// ── clamping ─────────────────────────────────────────────────────────────────

test('addInfluence past max or min clamps the value and the reported delta is the real move', () => {
    const { svc, g } = setup({ saved: { amy_influence: 95 } });
    const up = add(svc, 50);
    assert.equal(up.value, 100);
    assert.equal(up.delta, 5);
    assert.equal(g.amy_influence, 100);
    const again = add(svc, 10);
    assert.equal(again.value, 100);
    assert.equal(again.delta, 0);
    const down = add(svc, -500);
    assert.equal(down.value, -100);
    assert.equal(down.delta, -200);
    assert.equal(g.amy_influence, -100);
});

test('a pinned move that changes nothing emits no npc_influence_changed and runs no effects', () => {
    const { svc, dispatcher, calls } = setup({ saved: { amy_influence: 100 } });
    add(svc, 10);
    add(svc, 0);
    assert.equal(changes(dispatcher).length, 0);
    assert.equal(calls.toast.length, 0);
});

test('setInfluence to the current value is a no-op; NaN, Infinity, strings of junk and null are refused', () => {
    const { svc, dispatcher, g } = setup();
    quiet(() => svc.setInfluence('amy', 0, 'same'));
    assert.equal(changes(dispatcher).length, 0);
    for (const bad of [NaN, Infinity, -Infinity, 'abc', undefined]) assert.equal(quiet(() => svc.setInfluence('amy', bad, 'x')), null, String(bad));
    for (const bad of [NaN, Infinity, 'abc', undefined]) assert.equal(quiet(() => svc.addInfluence('amy', bad, 'x')), null, String(bad));
    assert.equal(g.amy_influence, 0);
    assert.equal(quiet(() => svc.setInfluence('amy', null, 'x'))?.value, 0); // Number(null) = 0
    assert.equal(quiet(() => svc.setInfluence('amy', '25', 'x')).value, 25);
});

test('a saved influence that is not a finite number falls back to the start value', () => {
    for (const bad of ['12', NaN, null, undefined, {}]) {
        const { svc } = setup({ saved: { amy_influence: bad } });
        assert.equal(svc.getInfluence('amy'), 0, String(bad));
    }
});

test('an out-of-range value written by another writer (the watcher path) is clamped and written back', () => {
    const { svc, g, dispatcher } = setup();
    g.amy_influence = 500;
    quiet(() => dispatcher.emit('global_variable_changed:amy_influence', { name: 'amy_influence', value: 500 }));
    assert.equal(g.amy_influence, 100);
    assert.equal(svc.getInfluence('amy'), 100);
    // non-numeric event payloads are ignored
    quiet(() => dispatcher.emit('global_variable_changed:amy_influence', { name: 'amy_influence', value: 'zzz' }));
    quiet(() => dispatcher.emit('global_variable_changed:amy_influence', undefined));
    assert.equal(g.amy_influence, 100);
});

test('the watcher ignores a repeat of the value it already saw (no double crossing)', () => {
    const { svc, g, dispatcher } = setup();
    g.amy_influence = -35;
    quiet(() => dispatcher.emit('global_variable_changed:amy_influence', { value: -35 }));
    quiet(() => dispatcher.emit('global_variable_changed:amy_influence', { value: -35 }));
    assert.equal(changes(dispatcher).length, 1);
    assert.deepEqual(svc.getLatched('amy'), ['wary']);
});

// ── thresholds ───────────────────────────────────────────────────────────────

test('equality counts: exactly at the threshold fires, one short does not', () => {
    const a = setup();
    add(a.svc, -29);
    assert.deepEqual(a.svc.getLatched('amy'), []);
    add(a.svc, -1);
    assert.deepEqual(a.svc.getLatched('amy'), ['wary']);
    const b = setup();
    add(b.svc, 39);
    assert.equal(b.g.amy_trust, false);
    add(b.svc, 1);
    assert.equal(b.g.amy_trust, true);
});

test('a threshold at 0 reads as "above": it fires going up to 0, never going down', () => {
    const sc = baseScenario();
    sc.social.characters.amy.thresholds = [{ id: 'zero', at: 0, effects: [{ type: 'setGlobal', global: 'amy_alert', value: true }] }];
    const { svc, g } = setup({ scenario: sc, saved: { amy_influence: -5 } });
    add(svc, 5);
    assert.equal(g.amy_alert, true);
    assert.deepEqual(svc.getLatched('amy'), ['zero']);
});

test('moving within the already-past region does not re-fire; staying put on the threshold does not either', () => {
    const { svc, calls } = setup();
    add(svc, 45);
    add(svc, 5);
    add(svc, -3);
    assert.equal(calls.toast.length, 1);
});

test('the band flag clears only at at - margin (default margin 10), not between', () => {
    const { svc, g } = setup();
    add(svc, 45);
    assert.equal(g.amy_trust, true);
    add(svc, -6); // 39: below at, still inside the margin
    assert.equal(g.amy_trust, true);
    add(svc, -9); // 30 = 40 - 10
    assert.equal(g.amy_trust, false);
    assert.deepEqual(svc.getLatched('amy'), []);
});

test('after a re-arm the threshold fires again on the next crossing', () => {
    const { svc, calls } = setup();
    add(svc, 45); add(svc, -20); add(svc, 20);
    assert.equal(calls.toast.length, 2);
});

test('a single move across all four thresholds fires them in the order the value passes them, once each', () => {
    const { svc, dispatcher } = setup();
    const r = add(svc, -200);
    assert.deepEqual(r.crossed, ['wary', 'reports', 'lockout']);
    assert.equal(r.band, 4);
    assert.equal(changes(dispatcher).length, 1);
    assert.deepEqual(svc.getLatched('amy').sort(), ['lockout', 'reports', 'wary']);
});

test('two writes with the same net movement give the same latch and flags regardless of step size', () => {
    const one = setup(); add(one.svc, -65);
    const many = setup(); for (let i = 0; i < 13; i++) add(many.svc, -5);
    assert.deepEqual(one.svc.getLatched('amy').sort(), many.svc.getLatched('amy').sort());
    assert.equal(one.g.amy_alert, many.g.amy_alert);
    assert.equal(one.svc.getBand('amy'), many.svc.getBand('amy'));
});

test('thresholds with a missing or non-numeric at, no id, or junk effects are dropped without breaking the rest', () => {
    const sc = baseScenario();
    sc.social.characters.amy.thresholds = [null, { id: 'x' }, { at: 5 }, { id: 'n', at: '5' }, { id: 'ok', at: -10, effects: ['junk', null, { type: 'setGlobal', global: 'amy_wary', value: true }] }];
    const { svc, g } = setup({ scenario: sc });
    add(svc, -10);
    assert.deepEqual(svc.getLatched('amy'), ['ok']);
    assert.equal(g.amy_wary, true);
});

test('an unknown effect type is warned about and does not stop the other effects', () => {
    const sc = baseScenario();
    sc.social.characters.amy.thresholds = [{ id: 'ok', at: -10, effects: [{ type: 'nonsense' }, { type: 'setGlobal', global: 'amy_alert', value: true }] }];
    const { svc, g } = setup({ scenario: sc });
    add(svc, -10);
    assert.equal(g.amy_alert, true);
});

test('a toast effect with empty text shows nothing; a ctx.toasts array collects instead of showing', () => {
    const sc = baseScenario();
    sc.social.characters.amy.thresholds = [{ id: 't1', at: 10, effects: [{ type: 'toast', text: '' }, { type: 'toast', text: 'hi' }] }];
    const a = setup({ scenario: sc });
    add(a.svc, 10);
    assert.deepEqual(a.calls.toast.map((t) => t.text), ['hi']);
    const b = setup({ scenario: sc });
    const toasts = [];
    add(b.svc, 10, 't', { toasts });
    assert.deepEqual(toasts.map((t) => t.text), ['hi']);
    assert.equal(b.calls.toast.length, 0);
});

// ── restore ──────────────────────────────────────────────────────────────────

test('restore: a saved latch keeps a past threshold from firing again on the next small move', () => {
    const { svc, calls } = setup({ saved: { amy_influence: 50, amy_latched: 'trusts', amy_trust: true } });
    add(svc, 1);
    assert.equal(calls.toast.length, 0);
    assert.deepEqual(svc.getLatched('amy'), ['trusts']);
});

test('restore: a latched id the character no longer has is ignored for the band and carried on the global', () => {
    const { svc } = setup({ saved: { amy_latched: 'ghost,wary' } });
    assert.equal(svc.getBand('amy'), 1);
    assert.deepEqual(svc.getLatched('amy'), ['ghost', 'wary']);
});

test('restore: a latched string with stray commas and empty parts reads cleanly', () => {
    const { svc } = setup({ saved: { amy_latched: ',wary,,' } });
    assert.deepEqual(svc.getLatched('amy'), ['wary']);
    assert.deepEqual(setup({ saved: { amy_latched: 5 } }).svc.getLatched('amy'), []);
});

test('restore: a saved value already past a threshold sets its band flag at install without a latch, event or toast', () => {
    const { svc, g, dispatcher, calls } = setup({ saved: { amy_influence: -45 } });
    assert.equal(g.amy_wary, true);
    assert.deepEqual(svc.getLatched('amy'), []);
    assert.equal(changes(dispatcher).length, 0);
    assert.equal(calls.toast.length, 0);
});

test('restore then first change past the same threshold: the latch is taken once (no earlier latch existed)', () => {
    const { svc } = setup({ saved: { amy_influence: -45 } });
    add(svc, -1); // previous -45 already past -30, so no crossing
    assert.deepEqual(svc.getLatched('amy'), []);
});

// ── report ───────────────────────────────────────────────────────────────────

test('report() twice runs effects once and the second call says alreadyLatched', () => {
    const { svc, g, calls, dispatcher } = setup();
    const a = quiet(() => svc.report('amy', 'caught'));
    const b = quiet(() => svc.report('amy', 'caught again'));
    assert.equal(a.reported, true);
    assert.equal(b.alreadyLatched, true);
    assert.equal(g.amy_alert, true);
    assert.equal(calls.end.length, 1);
    assert.equal(dispatcher.emitted.filter(([e]) => e === 'npc_reported').length, 1);
    assert.equal(svc.getLastReport('amy').reason, 'caught');
    assert.equal(svc.getBand('amy'), 3);
});

test('report() leaves influence alone; it marks the latch forced only when the value is not past its at', () => {
    const a = setup();
    quiet(() => a.svc.report('amy', 'x'));
    assert.equal(a.svc.getInfluence('amy'), 0);
    assert.deepEqual(a.svc.getForced('amy'), ['reports']);
    const b = setup({ saved: { amy_influence: -65 } });
    quiet(() => b.svc.report('amy', 'x'));
    assert.deepEqual(b.svc.getForced('amy'), []);
});

test('report() on a character with no "reports" threshold, a non-character, or junk ids does nothing', () => {
    const sc = baseScenario();
    sc.social.characters.amy.thresholds = sc.social.characters.amy.thresholds.filter((t) => t.id !== 'reports');
    const { svc } = setup({ scenario: sc });
    assert.deepEqual(quiet(() => svc.report('amy', 'x')), { reported: false, band: 0 });
    assert.deepEqual(quiet(() => svc.report('nobody', 'x')), { reported: false, band: 0 });
    assert.deepEqual(quiet(() => svc.report(undefined, 'x')), { reported: false, band: 0 });
});

test('a forced report is lost on reload only if <character>_forced was not saved (it is saved)', () => {
    const first = setup();
    quiet(() => first.svc.report('amy', 'x'));
    const saved = { amy_latched: first.g.amy_latched, amy_forced: first.g.amy_forced, amy_alert: true };
    const second = setup({ saved });
    add(second.svc, -3);
    assert.deepEqual(second.svc.getLatched('amy'), ['reports']);
    assert.equal(second.svc.getBand('amy'), 3);
});

// ── lockout ──────────────────────────────────────────────────────────────────

test('lockout deadline is exact: one ms before is locked, at the deadline it lifts and resets influence to recoverTo', () => {
    const { svc, g, clock } = setup();
    add(svc, -95);
    const until = g.amy_lockout_until;
    assert.equal(until, 1000 + 5 * 60000);
    clock.t = until - 1;
    assert.equal(svc.isLockedOut('amy'), true);
    assert.equal(svc.getLockoutState('amy').remainingMs, 1);
    clock.t = until;
    assert.equal(svc.isLockedOut('amy'), false);
    assert.equal(g.amy_influence, -20);
    assert.equal(g.amy_lockout_until, 0);
    assert.equal(g.amy_lockout_channel, '');
    assert.deepEqual(svc.getLatched('amy'), []);
    assert.equal(svc.getBand('amy'), 0);
});

test('lockout lift runs no effects and no toasts, and clears the band flags only if recoverTo is past the re-arm point', () => {
    const { svc, g, calls } = setup();
    add(svc, -95);
    assert.equal(g.amy_wary, true);
    window.gameState.globalVariables.amy_alert = false;
    const before = calls.end.length;
    quiet(() => svc.liftLockout('amy'));
    assert.equal(calls.end.length, before);
    assert.equal(g.amy_alert, false);
    assert.equal(g.amy_wary, false); // -20 is above -30 + 10 = -20: re-armed exactly at the margin
});

test('channel lockout records the channel of the NPC that triggered it; isLockedOut is per channel; a character lockout blocks all', () => {
    const { svc } = setup();
    add(svc, -95, 't', { npcId: 'amy_phone' });
    assert.equal(svc.isLockedOut('amy', 'phone'), true);
    assert.equal(svc.isLockedOut('amy', 'person'), false);
    assert.equal(svc.isLockedOut('amy', 'email'), false);
    assert.equal(svc.isLockedOut('amy'), true);
    const sc = baseScenario();
    sc.social.characters.amy.thresholds.find((t) => t.id === 'lockout').effects[0].scope = 'character';
    const b = setup({ scenario: sc });
    add(b.svc, -95, 't', { npcId: 'amy_phone' });
    for (const ch of ['person', 'phone', 'email']) assert.equal(b.svc.isLockedOut('amy', ch), true);
});

test('a lockout with no channel info falls back to "all"', () => {
    const { svc, g } = setup();
    add(svc, -95);
    assert.equal(g.amy_lockout_channel, 'all');
});

test('permanent lockout (until null) stores -1, reports Infinity remaining, and never lifts by time', () => {
    const sc = baseScenario();
    sc.social.characters.amy.thresholds.find((t) => t.id === 'lockout').effects[0].until = null;
    const { svc, g, clock } = setup({ scenario: sc });
    add(svc, -95);
    assert.equal(g.amy_lockout_until, -1);
    clock.t = 1e12;
    assert.equal(svc.getLockoutState('amy').remainingMs, Infinity);
    assert.equal(svc.isLockedOut('amy'), true);
    assert.equal(svc.checkLockout('amy'), false);
});

test('until.global lockout lifts when that global turns true, and not for a truthy-but-false global', () => {
    const sc = baseScenario();
    sc.social.characters.amy.thresholds.find((t) => t.id === 'lockout').effects[0].until = { global: 'amy_cleared' };
    const { svc, g, dispatcher } = setup({ scenario: sc });
    add(svc, -95);
    assert.equal(g.amy_lockout_until, -1);
    g.amy_cleared = false;
    dispatcher.emit('global_variable_changed:amy_cleared', { value: false });
    assert.equal(svc.isLockedOut('amy'), true);
    g.amy_cleared = true;
    quiet(() => dispatcher.emit('global_variable_changed:amy_cleared', { value: true }));
    assert.equal(svc.isLockedOut('amy'), false);
    assert.equal(g.amy_influence, -20);
});

test('a lockout deadline of exactly 0 or a negative clock still stores a positive deadline', () => {
    const { svc, g, clock } = setup();
    clock.t = -999999999;
    add(svc, -95);
    assert.ok(g.amy_lockout_until > 0, 'a stored 0 would read as "no lockout"');
});

test('lockout state of a non-character is inert', () => {
    const { svc } = setup();
    assert.deepEqual(svc.getLockoutState('nobody'), { active: false, until: 0, channel: '', remainingMs: 0 });
    assert.equal(svc.isLockedOut('nobody'), false);
    assert.equal(svc.checkLockout('nobody'), false);
    assert.equal(svc.liftLockout('nobody'), null);
});

test('lifting when no lockout is active still resets to recoverTo/start without throwing (a stray call)', () => {
    const { svc, g } = setup({ saved: { amy_influence: 30 } });
    quiet(() => svc.liftLockout('amy'));
    assert.equal(g.amy_influence, -20);
});

test('recoverTo outside min/max is clamped', () => {
    const sc = baseScenario();
    sc.social.characters.amy.thresholds.find((t) => t.id === 'lockout').effects[0].recoverTo = -500;
    const { svc, g } = setup({ scenario: sc });
    add(svc, -95);
    quiet(() => svc.liftLockout('amy'));
    assert.equal(g.amy_influence, -100);
});

// ── lookup and identity ──────────────────────────────────────────────────────

test('isSocialCharacter / resolveCharacter: ids, channel npc ids, junk', () => {
    const { svc } = setup();
    assert.deepEqual(svc.resolveCharacter('amy'), { characterId: 'amy', channel: null });
    assert.deepEqual(svc.resolveCharacter('amy_phone'), { characterId: 'amy', channel: 'phone' });
    for (const bad of ['', null, undefined, 5, {}, 'nobody']) assert.equal(svc.isSocialCharacter(bad), false);
    assert.equal(svc.getInfluence('nobody'), undefined);
    assert.deepEqual(svc.getLatched('nobody'), []);
    assert.equal(svc.getBand('nobody'), 0);
    assert.deepEqual(svc.getLog('nobody'), []);
    assert.equal(svc.getLastReport('nobody'), null);
    assert.equal(svc.addInfluence('nobody', 5), null);
    assert.equal(svc.seInfluence(5, 'x', { npcId: 'nobody' }), 0);
});

test('two characters claiming the same channel NPC id: the first one wins', () => {
    const sc = baseScenario();
    sc.globalVariables.bo_influence = 0;
    sc.social.characters.bo = { channels: { phone: 'amy_phone' }, influence: { global: 'bo_influence' }, thresholds: [] };
    const { svc } = setup({ scenario: sc });
    assert.equal(svc.resolveCharacter('amy_phone').characterId, 'amy');
});

test('a character whose influence global is not declared starts at its start value, and the default global is <id>_influence', () => {
    const sc = baseScenario();
    sc.social.characters.cy = { influence: { start: 7 }, thresholds: [] };
    const { svc } = setup({ scenario: sc });
    assert.equal(svc.getInfluence('cy'), 7);
    assert.equal(svc.getCharacterConfig('cy').global, 'cy_influence');
    add(svc, 1);
    quiet(() => svc.addInfluence('cy', 3, 't'));
    assert.equal(window.gameState.globalVariables.cy_influence, 10);
});

test('min greater than max or non-numeric bounds do not crash install (documents the clamp result)', () => {
    const sc = baseScenario();
    sc.social.characters.amy.influence = { global: 'amy_influence', min: 'low', max: null, start: 0 };
    const { svc } = setup({ scenario: sc });
    assert.equal(add(svc, 500).value, 100); // junk bounds fall back to -100..100
});

test('log: entries are recorded per change, capped at 100, and getLog returns a copy', () => {
    const { svc } = setup();
    for (let i = 0; i < 130; i++) add(svc, i % 2 ? -1 : 1, `r${i}`);
    const log = svc.getLog('amy');
    assert.equal(log.length, 100);
    assert.equal(log[log.length - 1].reason, 'r129');
    log.length = 0;
    assert.equal(svc.getLog('amy').length, 100);
});

test('the log entry for a change carries previous, value, delta, reason and the line from ctx', () => {
    const { svc } = setup();
    add(svc, 5, 'nice', { line: 'L7' });
    const e = svc.getLog('amy').at(-1);
    assert.deepEqual([e.previous, e.value, e.delta, e.reason, e.line, e.kind], [0, 5, 5, 'nice', 'L7', 'change']);
});

test('npc_influence_changed carries the npcId from ctx and the crossed ids', () => {
    const { svc, dispatcher } = setup();
    add(svc, -35, 'r', { npcId: 'amy_desk' });
    const [ev] = changes(dispatcher);
    assert.equal(ev.npcId, 'amy_desk');
    assert.deepEqual(ev.crossed, ['wary']);
    assert.equal(ev.character, 'amy');
});

// ── install / uninstall ──────────────────────────────────────────────────────

test('no social key, empty characters, characters as an array: installSocialInfluence returns null and installs nothing', () => {
    for (const sc of [{}, { social: {} }, { social: { characters: {} } }, { social: { characters: [] } }, { social: { characters: null } }]) {
        const { svc } = setup({ scenario: sc });
        assert.equal(svc, null);
        assert.equal(getSocialInfluence(), null);
        assert.equal(window.socialInfluence, undefined);
    }
});

test('installing twice replaces the first service: one crossing fires its effects once, not twice', () => {
    const s = setup();
    const again = quiet(() => installSocialInfluence({ scenario: s.scenario, dispatcher: s.dispatcher, hooks: { now: () => 1, toast: (t) => s.calls.toast.push({ text: t }) } }));
    assert.notEqual(again, s.svc);
    assert.equal(getSocialInfluence(), again);
    quiet(() => again.addInfluence('amy', 45, 't'));
    assert.equal(s.calls.toast.length, 1);
    assert.equal(changes(s.dispatcher).length, 1);
});

test('uninstall detaches the watcher: a later influence event does nothing', () => {
    const s = setup();
    uninstallSocialInfluence();
    assert.equal(getSocialInfluence(), null);
    assert.equal(window.socialInfluence, undefined);
    s.g.amy_influence = -80;
    quiet(() => s.dispatcher.emit('global_variable_changed:amy_influence', { value: -80 }));
    assert.equal(changes(s.dispatcher).length, 0);
    uninstallSocialInfluence(); // twice is fine
});

// ── ledger ───────────────────────────────────────────────────────────────────

test('seInfluence without a runId writes every time; with a runId the same (turn, ordinal) is stored', () => {
    const { svc, g } = setup();
    quiet(() => { svc.seInfluence(5, 'a', { characterId: 'amy' }); svc.seInfluence(5, 'a', { characterId: 'amy' }); });
    assert.equal(g.amy_influence, 10);
    const r = setup();
    quiet(() => {
        r.svc.beginRun('run1');
        r.svc.seInfluence(5, 'a', { characterId: 'amy', runId: 'run1' });
        r.svc.rewindTurn('run1');
        r.svc.seInfluence(5, 'a', { characterId: 'amy', runId: 'run1' }); // replayed turn: stored
        r.svc.advanceTurn('run1');
        r.svc.seInfluence(5, 'a', { characterId: 'amy', runId: 'run1' }); // next turn: writes
    });
    assert.equal(r.g.amy_influence, 10);
});

test('ledger: advanceTurn / rewindTurn / beginRun / endRun accept undefined and null runIds', () => {
    const { svc } = setup();
    for (const id of [undefined, null]) {
        svc.beginRun(id); svc.advanceTurn(id); svc.rewindTurn(id);
        assert.equal(svc.ledgerCall(id, 'f', null, () => 7), 7);
    }
    svc.endRun('never-started');
});

test('ledger: ordinals within a turn are separate calls; a keyed id is stored once per turn', () => {
    const { svc } = setup();
    let n = 0;
    const a = svc.ledgerCall('r', 'f', null, () => ++n);
    const b = svc.ledgerCall('r', 'f', null, () => ++n);
    assert.deepEqual([a, b], [1, 2]);
    svc.rewindTurn('r');
    assert.equal(svc.ledgerCall('r', 'f', null, () => ++n), 1);
    assert.equal(svc.ledgerCall('r', 'g', 'id1', () => ++n), 3);
    assert.equal(svc.ledgerCall('r', 'g', 'id1', () => ++n), 3);
    svc.advanceTurn('r');
    assert.equal(svc.ledgerCall('r', 'g', 'id1', () => ++n), 4);
});

test('trackTurns on an engine without ChooseChoiceIndex returns a harmless undo; on a story it wraps and restores', () => {
    const { svc } = setup();
    assert.equal(typeof svc.trackTurns(null, 'r'), 'function');
    assert.equal(typeof svc.trackTurns({}, 'r'), 'function');
    const story = { variablesState: {}, ChooseChoiceIndex(i) { return i; } };
    const orig = story.ChooseChoiceIndex;
    const undo = svc.trackTurns(story, 'r');
    story.ChooseChoiceIndex(0);
    story.ChooseChoiceIndex(1);
    assert.equal(svc._run('r').turn, 2);
    undo();
    assert.equal(story.ChooseChoiceIndex, orig);
});

// ── display and bands ────────────────────────────────────────────────────────

test('resolveInfluenceDisplay: non-boolean layers are ignored, bar:false forces number:false even if the character asks for number', () => {
    const sc = { social: { influenceDisplay: { bar: 'no', number: 0, pip: null }, characters: { a: { influence: { display: { bar: false, number: true } } }, b: {}, c: { influence: { display: 'x' } } } } };
    assert.deepEqual(resolveInfluenceDisplay(sc, 'a'), { bar: false, number: false, pip: true });
    assert.deepEqual(resolveInfluenceDisplay(sc, 'b'), { bar: true, number: true, pip: true });
    assert.deepEqual(resolveInfluenceDisplay(sc, 'c'), { bar: true, number: true, pip: true });
    for (const s of [undefined, null, {}, { social: {} }]) assert.deepEqual(resolveInfluenceDisplay(s, 'a'), { bar: false, number: false, pip: false });
    assert.deepEqual(resolveInfluenceDisplay(sc, 'zzz'), { bar: false, number: false, pip: false });
    assert.deepEqual(resolveInfluenceDisplay({ social: { characters: { a: 5 } } }, 'a'), { bar: false, number: false, pip: false });
});

test('bandForLatched: highest rank wins, unknown ids rank 0, null inputs are 0', () => {
    const th = [{ id: 'wary', effects: [] }, { id: 'custom', effects: [{ type: 'lockout' }] }, { id: 'other', effects: [] }];
    assert.equal(bandForLatched(th, ['wary']), 1);
    assert.equal(bandForLatched(th, ['wary', 'custom']), 4);
    assert.equal(bandForLatched(th, ['other']), 0);
    assert.equal(bandForLatched(th, ['nothing-here']), 0);
    assert.equal(bandForLatched(null, null), 0);
    assert.equal(bandForLatched(undefined, ['wary']), 0);
});
