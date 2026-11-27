// The social influence service, systems/social-influence.js (00 S5, §8; plan 0.3, packet P0-F):
//  - back-compat 3: a scenario with no social key gets no watcher; a non-social NPC gets
//    no threshold effect;
//  - threshold crossings in both directions, equality counting, firing order;
//  - the latch, and that it survives a reload (restored from <character>_latched);
//  - band flags recomputed on every change and cleared at at + rearmMargin;
//  - the lockout's storage globals and the recoverTo lift (silent: no effects);
//  - forced report(); the per-run idempotency ledger; npc_influence_changed once per change;
//  - resolveInfluenceDisplay (README AA);
//  - an ink write that overshoots max/min is clamped and written back; se_influence then an
//    ink += in one knot gives the sum.
// Run with: bundle exec node --test test/js/social-influence.test.mjs
//
// Browser modules are copied to a temp dir as .mjs, as in social-global-writer.test.mjs.
// Fixtures: test/js/fixtures/social/influence/ (scenario.json, priya_probe.ink compiled to .json).

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixtures = join(here, 'fixtures/social/influence');
const dir = mkdtempSync(join(tmpdir(), 'social-influence-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/npc-conversation-state.js', 'npc-conversation-state.mjs');
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('systems/social-influence.js', 'social-influence.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
const inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
globalThis.inkjs = inkjs;
const { default: stateSingleton } = await import(pathToFileURL(join(dir, 'npc-conversation-state.mjs')).href);
const StateManager = stateSingleton.constructor;
const { writeGlobal } = await import(pathToFileURL(join(dir, 'global-writer.mjs')).href);
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const {
    installSocialInfluence, uninstallSocialInfluence, getSocialInfluence, resolveInfluenceDisplay, bandForLatched
} = await import(pathToFileURL(join(dir, 'social-influence.mjs')).href);

const scenarioText = readFileSync(join(fixtures, 'scenario.json'), 'utf8');
const probeText = readFileSync(join(fixtures, 'priya_probe.json'), 'utf8').replace(/^﻿/, '');

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
        emit(name, data) { emitted.push([name, data]); (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

/**
 * A fresh game: the fixture scenario (or the one given), gameState from its declared
 * globals plus `saved`, a manual clock, recording hooks, and the service installed.
 */
function setup({ scenario = JSON.parse(scenarioText), saved = {}, install = true } = {}) {
    const manager = new StateManager();
    const dispatcher = makeDispatcher();
    const declared = scenario.globalVariables || {};
    const clock = { t: 1000 };
    const calls = { toast: [], end: [], hostile: [] };
    globalThis.window = {
        gameScenario: scenario,
        gameState: { globalVariables: { ...declared, ...saved } },
        eventDispatcher: dispatcher,
        npcConversationStateManager: manager,
        npcManager: { inkEngineCache: new Map() }
    };
    manager.setDeclaredGlobals(Object.keys(declared));
    const hooks = {
        now: () => clock.t,
        toast: (text, info) => calls.toast.push({ text, ...info }),
        endConversation: (info) => calls.end.push(info),
        setHostile: (npcId, info) => calls.hostile.push({ npcId, ...info })
    };
    const service = install ? quiet(() => installSocialInfluence({ scenario, dispatcher, hooks })) : null;
    return { manager, dispatcher, clock, calls, service, g: window.gameState.globalVariables };
}

const changed = (dispatcher, name) => dispatcher.emitted.filter(([e]) => e === `global_variable_changed:${name}`);
const influenceEvents = (dispatcher) => dispatcher.emitted.filter(([e]) => e === 'npc_influence_changed').map(([, d]) => d);
// An ink write as the observer makes one: gameState first, then the event
function inkWrite(name, value) {
    window.gameState.globalVariables[name] = value;
    window.eventDispatcher.emit(`global_variable_changed:${name}`, { name, value });
}
const engineFor = () => { const e = new InkEngine('probe'); quiet(() => e.loadStory(probeText)); return e; };
const line = (story) => quiet(() => story.Continue()).trim();
function openChat(manager, npcId) {
    const engine = engineFor();
    quiet(() => {
        manager.syncGlobalVariablesToStory(engine.story);
        manager.observeGlobalVariableChanges(engine.story, npcId);
    });
    window.MinigameFramework = { currentMinigame: { npcId, inkEngine: engine } };
    return engine;
}

test.afterEach(() => uninstallSocialInfluence());

// ------------------------------------------------------------------ back-compat 3

test('non-social NPC: no watcher, no threshold effect (back-compat 3)', () => {
    // A scenario with no social key: install does nothing at all
    const scenario = { globalVariables: { gary_influence: 0, influence: 0 } };
    const { dispatcher, g } = setup({ scenario });
    assert.equal(getSocialInfluence(), null);
    assert.equal(window.socialInfluence, undefined);
    assert.equal(dispatcher.listeners.size, 0, 'no listener registered');
    inkWrite('gary_influence', -100);
    writeGlobal('gary_influence', -200);
    assert.equal(g.gary_influence, -200, 'not clamped');
    assert.equal(influenceEvents(dispatcher).length, 0);

    // A social scenario: an NPC with no social.characters entry is left alone
    const { dispatcher: d2, service, g: g2, calls } = setup();
    assert.equal(service.isSocialCharacter('guard'), false);
    assert.equal(service.isSocialCharacter('priya_helpdesk'), true);
    assert.equal(service.isSocialCharacter('priya'), true);
    assert.equal([...d2.listeners.keys()].some(k => k.includes('gary_influence')), false);
    inkWrite('gary_influence', -100);
    assert.equal(g2.gary_influence, -100);
    assert.equal(service.seInfluence(-50, 'x', { npcId: 'guard' }), 0);
    assert.equal(service.addInfluence('guard', -50), null);
    assert.equal(service.report('guard', 'maxRefusals').reported, false);
    assert.equal(influenceEvents(d2).length, 0);
    assert.deepEqual(calls, { toast: [], end: [], hostile: [] });
    assert.equal(g2.priya_influence, -20, 'social characters untouched');
});

test('installing on a scenario with an empty characters map does nothing', () => {
    const { dispatcher } = setup({ scenario: { globalVariables: {}, social: { characters: {} } } });
    assert.equal(getSocialInfluence(), null);
    assert.equal(dispatcher.listeners.size, 0);
});

// ------------------------------------------------------------------ crossings

test('downward crossing fires once; equality counts; band flag set', () => {
    const { service, dispatcher, g } = setup();
    const r = service.addInfluence('priya', -20, 'urgency', { npcId: 'priya_helpdesk_phone' });
    assert.equal(r.value, -40);
    assert.deepEqual(r.crossed, ['wary'], 'at -40 exactly: equality counts');
    assert.equal(g.priya_wary, true);
    assert.equal(g.priya_latched, 'wary');
    assert.equal(service.getBand('priya'), 1);
    const ev = influenceEvents(dispatcher);
    assert.equal(ev.length, 1);
    assert.deepEqual({ ...ev[0], entries: undefined }, {
        character: 'priya', npcId: 'priya_helpdesk_phone', global: 'priya_influence', value: -40, previous: -20,
        delta: -20, reason: 'urgency', line: null, entries: undefined, band: 1, crossed: ['wary'], rearmed: [], silent: false
    });
    // further down, still wary: no re-fire
    const r2 = service.addInfluence('priya', -5, 'deflect');
    assert.deepEqual(r2.crossed, []);
    assert.equal(changed(dispatcher, 'priya_wary').length, 1, 'the flag is written once');
});

test('one move across several thresholds fires them in order, with their effects', () => {
    const { service, g, calls } = setup();
    const r = service.setInfluence('priya', -75, 'claim', { npcId: 'priya_helpdesk' });
    assert.deepEqual(r.crossed, ['wary', 'refuses', 'reports']);
    assert.equal(g.priya_wary, true);
    assert.equal(g.priya_refusing, true);
    assert.equal(g.helpdesk_alerted, true);
    assert.deepEqual(calls.end, [{ character: 'priya', npcId: 'priya_helpdesk', line: "I'll ring you back on the number we hold for you." }]);
    assert.equal(service.getBand('priya'), 3);
    assert.equal(g.priya_lockout_until, 0, 'lockout at -90 not reached');
});

test('upward crossing of an "above" threshold, and its re-arm below at - margin', () => {
    const { service, g, calls } = setup({ saved: { priya_influence: 30 } });
    let r = service.addInfluence('priya', 10, 'shared_detail');
    assert.deepEqual(r.crossed, ['trusts'], 'at 40, when above: equality counts');
    assert.equal(g.priya_trusting, true);
    assert.deepEqual(calls.toast.map(t => t.text), ['Priya trusts you.']);
    assert.equal(service.getBand('priya'), 0, 'trusts never changes the band');
    r = service.addInfluence('priya', -5);  // 35: between, flag left alone, still latched
    assert.deepEqual(r.rearmed, []);
    assert.equal(g.priya_trusting, true);
    r = service.addInfluence('priya', -5);  // 30 = at - margin: re-armed, flag cleared
    assert.deepEqual(r.rearmed, ['trusts']);
    assert.equal(g.priya_trusting, false);
    r = service.addInfluence('priya', 10);  // 40 again: fires again
    assert.deepEqual(r.crossed, ['trusts']);
    assert.equal(calls.toast.length, 2);
});

test('band flags: set at at, left alone between, cleared at at + rearmMargin; re-armed threshold fires again', () => {
    const { service, g, dispatcher } = setup();
    service.setInfluence('priya', -55);
    assert.equal(g.priya_wary, true);
    assert.equal(g.priya_refusing, true);
    assert.equal(service.getBand('priya'), 2);
    service.setInfluence('priya', -45);     // between -50 and -40: refusing stays
    assert.equal(g.priya_refusing, true);
    service.setInfluence('priya', -40);     // = -50 + 10: refuses re-arms, its flag clears
    assert.equal(g.priya_refusing, false);
    assert.equal(g.priya_wary, true);
    assert.deepEqual(service.getLatched('priya'), ['wary']);
    service.setInfluence('priya', -31);     // between: wary stays
    assert.equal(g.priya_wary, true);
    service.setInfluence('priya', -30);     // re-armed
    assert.equal(g.priya_wary, false);
    assert.deepEqual(service.getLatched('priya'), []);
    assert.equal(service.getBand('priya'), 0);
    const r = service.setInfluence('priya', -41);
    assert.deepEqual(r.crossed, ['wary']);
    // band flags clear to their declared default, as change-only events
    assert.deepEqual(changed(dispatcher, 'priya_wary').map(([, d]) => d.value), [true, false, true]);
});

test('band flags are recomputed for a change by any writer (the ink observer, the shared writer)', () => {
    const { service, g, dispatcher } = setup();
    inkWrite('priya_influence', -52);
    assert.equal(g.priya_wary, true);
    assert.equal(g.priya_refusing, true);
    assert.equal(service.getLog('priya').at(-1).reason, 'ink');
    writeGlobal('priya_influence', -25);
    assert.equal(g.priya_wary, false);
    assert.equal(g.priya_refusing, false);
    assert.equal(influenceEvents(dispatcher).length, 2);
});

test('npc_influence_changed fires once per change and not for a same-value write', () => {
    const { service, dispatcher } = setup();
    service.addInfluence('priya', 5, 'a');
    writeGlobal('priya_influence', -15, { emitAlways: true });   // same value, emitted again
    inkWrite('priya_influence', -15);
    service.addInfluence('priya', 0, 'nothing');
    assert.equal(influenceEvents(dispatcher).length, 1);
    service.addInfluence('priya', -5, 'b');
    assert.equal(influenceEvents(dispatcher).length, 2);
    assert.equal(changed(dispatcher, 'priya_influence').length, 4, 'the service\'s own writes emit change-only');
});

// ------------------------------------------------------------------ latch across a reload

test('latch survives a reload: restored from <character>_latched, no re-fire', () => {
    const first = setup();
    first.service.setInfluence('priya', -55);
    assert.equal(first.g.priya_latched, 'wary,refuses');
    const saved = { ...first.g };
    uninstallSocialInfluence();

    // reload: gameState comes back from the save, a fresh service is installed
    const { service, g, dispatcher, calls } = setup({ saved });
    assert.deepEqual(service.getLatched('priya'), ['wary', 'refuses']);
    assert.equal(service.getBand('priya'), 2);
    let r = service.setInfluence('priya', -60);
    assert.deepEqual(r.crossed, [], 'nothing re-fires after the reload');
    assert.equal(changed(dispatcher, 'priya_wary').length, 0);
    assert.equal(changed(dispatcher, 'priya_refusing').length, 0);
    r = service.setInfluence('priya', -30);
    assert.deepEqual(r.rearmed.sort(), ['refuses', 'wary']);
    assert.equal(g.priya_wary, false);
    assert.equal(g.priya_refusing, false);
    assert.equal(calls.end.length, 0);
});

// ------------------------------------------------------------------ lockout and recoverTo

test('lockout storage, and the recoverTo lift: silent, latch and band flags cleared, report global kept', () => {
    const { service, g, clock, calls, dispatcher } = setup();
    const r = service.setInfluence('dev', -75, 'claim', { npcId: 'dev_service_desk' });
    assert.deepEqual(r.crossed, ['wary', 'refuses', 'reports']);
    assert.equal(g.dev_reported, true);
    assert.equal(g.dev_lockout_until, 1000 + 2 * 60000, 'absolute elapsed ms');
    assert.equal(g.dev_lockout_channel, 'phone', 'scope channel: the channel the write came from');
    assert.equal(calls.end.length, 1);
    assert.equal(service.getBand('dev'), 3, 'a lockout effect on reports gives 3');

    let state = service.getLockoutState('dev');
    assert.equal(state.active, true);
    assert.equal(state.remainingMs, 120000);
    clock.t += 119999;
    assert.equal(service.checkLockout('dev'), false);
    clock.t += 1;
    const before = influenceEvents(dispatcher).length;
    state = service.getLockoutState('dev');   // lifts on the way
    assert.deepEqual(state, { active: false, until: 0, channel: '', remainingMs: 0 });
    assert.equal(g.dev_influence, -30, 'recoverTo');
    assert.equal(g.dev_latched, '');
    assert.equal(g.dev_wary, false);
    assert.equal(g.dev_refusing, false);
    assert.equal(g.dev_reported, true, 'a report global is an event, not a band');
    assert.equal(calls.end.length, 1, 'no effect ran on the lift');
    const lift = influenceEvents(dispatcher).slice(before);
    assert.equal(lift.length, 1);
    assert.equal(lift[0].silent, true);
    assert.equal(lift[0].reason, 'lockout_lift');
    assert.deepEqual(lift[0].crossed, []);

    // recoverTo rule (-30 >= -40 + 10) means the character is re-armed, not returning wary
    const again = service.addInfluence('dev', -10, 'urgency');
    assert.deepEqual(again.crossed, ['wary']);
});

test('recoverTo rule: a lift to exactly A + rearmMargin clears every band flag (validator rule holds in the fixture)', () => {
    const scenario = JSON.parse(scenarioText);
    for (const [id, c] of Object.entries(scenario.social.characters)) {
        const margin = c.influence.rearmMargin ?? 10;
        const below = c.thresholds.filter(t => (t.when ?? (t.at < 0 ? 'below' : 'above')) === 'below' && t.effects?.length);
        const A = Math.max(...below.map(t => t.at));
        for (const t of c.thresholds) for (const e of t.effects) {
            if (e.type === 'lockout') assert.ok(e.recoverTo >= A + margin, `${id}: recoverTo ${e.recoverTo} >= ${A} + ${margin}`);
        }
    }
    const { service, g } = setup({ saved: { priya_influence: -85 } });
    service.setInfluence('priya', -95);
    assert.equal(g.priya_lockout_until, 1000 + 10 * 60000);
    assert.equal(g.priya_lockout_channel, 'all', 'no channel known: locks every channel');
    service.liftLockout('priya');
    assert.equal(g.priya_influence, -30);
    assert.equal(g.priya_wary, false);
    assert.equal(g.priya_refusing, false);
    assert.equal(g.helpdesk_alerted, false, 'reports never fired: it was crossed before the save');
    assert.equal(service.getBand('priya'), 0);
});

test('lockout until a global: scope character, lifted when the global turns true; combatHostile opt-in', () => {
    const { service, g, calls } = setup();
    service.addInfluence('lou', -60, 'x', { npcId: 'lou_phone' });
    assert.equal(g.lou_lockout_until, -1);
    assert.equal(g.lou_lockout_channel, 'all');
    assert.deepEqual(calls.hostile, [{ npcId: 'lou_desk', character: 'lou', threshold: 'reports' }]);
    assert.equal(service.checkLockout('lou'), false);
    writeGlobal('lou_cleared', true);
    assert.equal(g.lou_lockout_until, 0);
    assert.equal(g.lou_influence, -20);
    assert.equal(g.lou_latched, '');
    assert.equal(calls.hostile.length, 1, 'not re-run on the lift');
});

test('isLockedOut: the S10 channel check used by the entry points', () => {
    const { service, clock } = setup();
    // dev: a channel-scoped (phone) lockout
    service.setInfluence('dev', -75, 'claim', { npcId: 'dev_service_desk' });
    assert.equal(service.isLockedOut('dev', 'phone'), true, 'the locked channel refuses');
    assert.equal(service.isLockedOut('dev', 'person'), false, 'another channel is open');
    assert.equal(service.isLockedOut('dev'), true, 'no channel given: any lockout is active');
    assert.equal(service.isLockedOut('dev_service_desk', 'phone'), true, 'resolves a channel npc id');
    // the deadline passing lifts it on the next check, so the channel opens
    clock.t += 2 * 60000;
    assert.equal(service.isLockedOut('dev', 'phone'), false, 'a due lockout lifts and the channel opens');
    // lou: a character-scoped lockout closes every channel until lou_cleared
    service.addInfluence('lou', -60, 'x', { npcId: 'lou_phone' });
    assert.equal(service.isLockedOut('lou', 'person'), true);
    assert.equal(service.isLockedOut('lou', 'phone'), true);
    assert.equal(service.isLockedOut('lou', 'email'), true, "scope 'character' stores 'all'");
    writeGlobal('lou_cleared', true);
    assert.equal(service.isLockedOut('lou', 'person'), false, 'the until-global lift opens every channel');
    // a non-social id, or a character with no active lockout, is never blocked
    assert.equal(service.isLockedOut('someone_else', 'person'), false);
    assert.equal(service.isLockedOut('priya', 'email'), false);
});

test('mirrorToBehavior copies the value without the auto-hostile check', () => {
    const { service } = setup();
    let hostileCalls = 0;
    const behavior = { influence: 0, setInfluence() { hostileCalls++; } };
    window.npcBehaviorManager = { getBehavior: (id) => (id === 'lou_desk' ? behavior : null) };
    service.addInfluence('lou', -15);
    assert.equal(behavior.influence, -15);
    assert.equal(hostileCalls, 0);
    // priya has no mirrorToBehavior: nothing copied
    const priyaBehavior = { influence: 0 };
    window.npcBehaviorManager = { getBehavior: () => priyaBehavior };
    service.addInfluence('priya', -15);
    assert.equal(priyaBehavior.influence, 0);
});

// ------------------------------------------------------------------ forced report

test('report(): runs the reports effects, latches, records the reason, leaves influence alone', () => {
    const { service, g, calls, dispatcher } = setup();
    const r = service.report('dev_service_desk', 'maxRefusals', { npcId: 'dev_service_desk' });
    assert.deepEqual(r, { reported: true, band: 3 });
    assert.equal(g.dev_influence, -10, 'influence unchanged');
    assert.equal(g.dev_reported, true);
    assert.equal(g.dev_lockout_until, 1000 + 120000);
    assert.equal(g.dev_lockout_channel, 'phone');
    assert.deepEqual(service.getLatched('dev'), ['reports']);
    assert.equal(service.getLastReport('dev').reason, 'maxRefusals');
    assert.equal(calls.end.length, 1);
    assert.deepEqual(dispatcher.emitted.filter(([e]) => e === 'npc_reported').map(([, d]) => d),
        [{ character: 'dev', npcId: 'dev_service_desk', reason: 'maxRefusals', band: 3 }]);
    assert.equal(influenceEvents(dispatcher).length, 0);
    // again while latched: no second run
    assert.equal(service.report('dev', 'verificationFailed').alreadyLatched, true);
    assert.equal(calls.end.length, 1);
    // no reports threshold: refused
    assert.equal(quiet(() => service.report('pierce', 'x')).reported, false);
});

test('report() then a small change: the forced latch holds, band stays 3, effects do not run again (R-02)', () => {
    const { service, g, calls } = setup();
    service.report('dev', 'maxRefusals', { npcId: 'dev_service_desk' });
    const until = g.dev_lockout_until;
    const r = service.addInfluence('dev', -1, 'urgency');
    assert.deepEqual(r.rearmed, [], 'a forced latch is not re-armed by a value that never crossed');
    assert.equal(r.band, 3);
    assert.deepEqual(service.getLatched('dev'), ['reports']);
    service.addInfluence('dev', +20);
    assert.equal(service.getBand('dev'), 3);
    assert.equal(service.report('dev', 'verificationFailed').alreadyLatched, true);
    assert.equal(calls.end.length, 1, 'endConversation ran once');
    assert.equal(g.dev_lockout_until, until, 'the lockout deadline did not move');
});

test('a forced latch with no lockout re-arms only after the value has crossed it once (R-02)', () => {
    const { service, g, calls } = setup();
    service.report('priya', 'maxRefusals', { npcId: 'priya_helpdesk' });
    assert.equal(g.helpdesk_alerted, true);
    assert.deepEqual(service.addInfluence('priya', 5).rearmed, []);
    assert.equal(service.getBand('priya'), 3);
    // the value now crosses reports: still latched, so its effects do not run again
    const down = service.setInfluence('priya', -75);
    assert.deepEqual(down.crossed, ['wary', 'refuses']);
    assert.equal(calls.end.length, 1);
    // and from here it re-arms like a crossed latch, at at + rearmMargin
    const up = service.setInfluence('priya', -60);
    assert.ok(up.rearmed.includes('reports'));
    assert.ok(!service.getLatched('priya').includes('reports'));
});

test('a forced latch survives a reload and is cleared by the lockout lift (R-02, N-01)', () => {
    // reload: reports latched and marked forced in <character>_forced, value never past -70
    let { service } = setup({ saved: { priya_latched: 'reports', priya_forced: 'reports' } });
    assert.deepEqual(service.getForced('priya'), ['reports']);
    assert.deepEqual(service.addInfluence('priya', 3).rearmed, []);
    assert.equal(service.getBand('priya'), 3, 'still band 3: the forced mark holds the latch');
    uninstallSocialInfluence();
    // lift: the latch and the forced mark are cleared and a later report runs the effects again
    let clock, calls, g;
    ({ service, clock, calls, g } = setup());
    service.report('dev', 'maxRefusals', { npcId: 'dev_service_desk' });
    assert.deepEqual(service.getForced('dev'), ['reports'], 'report() at -10 marks the latch forced');
    clock.t += 120000;
    assert.equal(service.checkLockout('dev'), true);
    assert.equal(g.dev_latched, '');
    assert.equal(g.dev_forced, '', 'the lift clears the forced mark too');
    assert.equal(service.report('dev', 'again', { npcId: 'dev_service_desk' }).reported, true);
    assert.equal(calls.end.length, 2);
});

test('N-01: a reload with reports latched by a real crossing (value climbed part way back, not forced) re-arms', () => {
    // dev reports at -70, rearmMargin 10. A real crossing latched it; the value
    // then climbed to -65 (between at and at + margin, so not yet re-armed) and the
    // game was saved. No <character>_forced, so the reload must treat it as a normal
    // crossed latch, not a forced one: the next climb past at + margin re-arms it.
    const { service, g } = setup({ saved: { dev_influence: -65, dev_latched: 'reports' } });
    assert.deepEqual(service.getForced('dev'), [], 'not forced: nothing wrote dev_forced');
    assert.equal(service.getBand('dev'), 3, 'still reported at -65');
    // a change that is still below at + margin keeps it latched
    assert.deepEqual(service.addInfluence('dev', -2).rearmed, []);
    assert.equal(service.getBand('dev'), 3);
    // climbing to at + margin (-60) re-arms, as it would have before the reload
    const up = service.setInfluence('dev', -60);
    assert.ok(up.rearmed.includes('reports'), 'a real crossing re-arms at at + rearmMargin');
    assert.equal(service.getBand('dev'), 0);
    assert.equal(g.dev_latched, '');
});

test('a start value already past a threshold gets its band flags at install, silently (R-03)', () => {
    const { service, g, calls, dispatcher } = setup({ saved: { priya_influence: -55, dev_influence: -45 } });
    assert.equal(g.priya_wary, true);
    assert.equal(g.priya_refusing, true);
    assert.equal(g.dev_wary, true);
    assert.equal(g.dev_refusing, false);
    assert.equal(g.helpdesk_alerted, false, 'not a band flag');
    assert.equal(g.priya_latched, '', 'no latch: nothing fired');
    assert.equal(service.getBand('priya'), 0);
    assert.equal(calls.end.length + calls.toast.length, 0, 'no effects');
    assert.equal(dispatcher.emitted.length, 0, 'no events at install');
    // the next change keeps them, and a climb past at + margin clears them as usual
    service.addInfluence('priya', 30);
    assert.equal(g.priya_wary, false);
    assert.equal(g.priya_refusing, false);
});

test('bandForLatched ranks by id: wary 1, refuses 2, reports 3, lockout (or a lockout effect) 4', () => {
    const t = (id, effects = []) => ({ id, effects });
    const all = [t('trusts'), t('wary'), t('refuses'), t('reports', [{ type: 'lockout' }]), t('lockout'), t('burned', [{ type: 'lockout' }])];
    assert.equal(bandForLatched(all, []), 0);
    assert.equal(bandForLatched(all, ['trusts']), 0);
    assert.equal(bandForLatched(all, ['wary']), 1);
    assert.equal(bandForLatched(all, ['wary', 'refuses']), 2);
    assert.equal(bandForLatched(all, ['reports']), 3);
    assert.equal(bandForLatched(all, ['lockout']), 4);
    assert.equal(bandForLatched(all, ['burned']), 4);
});

// ------------------------------------------------------------------ idempotency

test('ledger: a repeated (runId, turn, se_influence, ordinal) returns the stored result without writing', () => {
    const { service, g } = setup();
    const ctx = { npcId: 'priya_helpdesk_phone', runId: 'call-1' };
    service.beginRun('call-1');
    service.seInfluence(-10, 'urgency', ctx);       // ordinal 0
    service.seInfluence(-10, 'authority', ctx);     // ordinal 1: a different call
    assert.equal(g.priya_influence, -40);
    service.rewindTurn('call-1');                   // ink re-runs the same turn
    assert.equal(service.seInfluence(-10, 'urgency', ctx), 0, 'stored band from the first run (-30, calm)');
    assert.equal(service.seInfluence(-10, 'authority', ctx), 1, 'stored band (-40, wary)');
    assert.equal(g.priya_influence, -40, 'nothing written again');
    service.advanceTurn('call-1');                  // a new choice: the same line runs again
    service.seInfluence(5, 'ring_back', ctx);
    assert.equal(g.priya_influence, -35);
    // a mail run is its own run (runId = msgId), turn 0, fresh ledger
    service.seInfluence(5, 'senderTrust', { npcId: 'priya_helpdesk', runId: 'msg-7' });
    assert.equal(g.priya_influence, -30);
    service.endRun('call-1');
    // id-keyed calls (pretext_say / pretext_ask)
    let n = 0;
    service.beginRun('call-2');
    assert.equal(service.ledgerCall('call-2', 'pretext_say', 'give_manager', () => ++n), 1);
    assert.equal(service.ledgerCall('call-2', 'pretext_say', 'give_manager', () => ++n), 1);
    service.advanceTurn('call-2');
    assert.equal(service.ledgerCall('call-2', 'pretext_say', 'give_manager', () => ++n), 2);
    // no runId: no ledger
    service.seInfluence(-1, 'x', { npcId: 'priya_helpdesk' });
    service.seInfluence(-1, 'x', { npcId: 'priya_helpdesk' });
    assert.equal(g.priya_influence, -32);
});

test('trackTurns advances the turn on each ChooseChoiceIndex', () => {
    const { manager, service, g } = setup();
    const engine = openChat(manager, 'priya_helpdesk');
    service.bindInfluenceExternals(engine, { npcId: 'priya_helpdesk', runId: 'call-3' });
    service.beginRun('call-3');
    const undo = service.trackTurns(engine, 'call-3');
    engine.goToKnot('hub');
    assert.equal(line(engine.story), 'Hub -20');
    quiet(() => engine.story.ChooseChoiceIndex(0));
    assert.equal(line(engine.story), 'Pushed -30');
    line(engine.story);
    quiet(() => engine.story.ChooseChoiceIndex(0));
    assert.equal(line(engine.story), 'Pushed -40', 'a second turn writes again');
    assert.equal(g.priya_influence, -40);
    assert.equal(g.priya_wary, true);
    undo();
});

// ------------------------------------------------------------------ ink writes

test('an ink write that overshoots max (or min) is clamped and written back into the story', () => {
    const { manager, service, g, dispatcher } = setup();
    const engine = openChat(manager, 'priya_helpdesk');
    engine.goToKnot('overshoot_up');
    assert.equal(line(engine.story), 'Up: 130');
    assert.equal(line(engine.story), 'After: 100');
    assert.equal(g.priya_influence, 100);
    assert.equal(engine.story.variablesState.$('priya_influence'), 100);
    assert.deepEqual(changed(dispatcher, 'priya_influence').map(([, d]) => d.value), [130, 100]);
    const ev = influenceEvents(dispatcher);
    assert.equal(ev.length, 1);
    assert.equal(ev[0].value, 100);
    assert.equal(ev[0].reason, 'ink');
    assert.deepEqual(ev[0].crossed, ['trusts']);

    uninstallSocialInfluence();
    const second = setup();
    const d2 = openChat(second.manager, 'priya_helpdesk');
    d2.goToKnot('overshoot_down');
    assert.equal(line(d2.story), 'Down: -140');
    assert.equal(line(d2.story), 'After: -100');
    assert.equal(second.g.priya_influence, -100);
    assert.equal(d2.story.variablesState.$('priya_influence'), -100);
    assert.equal(second.g.priya_lockout_until, 1000 + 600000);
    assert.equal(second.g.priya_lockout_channel, 'person', 'the open chat\'s channel');
});

test('se_influence then an ink += in one knot gives the sum; the ink part is recorded with reason ink', () => {
    const { manager, service, g, dispatcher } = setup();
    const engine = openChat(manager, 'priya_helpdesk');
    service.bindInfluenceExternals(engine, { npcId: 'priya_helpdesk' });
    engine.goToKnot('se_then_ink');
    assert.equal(line(engine.story), 'Sum: -28 band 0');
    assert.equal(line(engine.story), 'After: -28');
    assert.equal(g.priya_influence, -28);
    assert.deepEqual(influenceEvents(dispatcher).map(e => [e.delta, e.reason]), [[-10, 'x'], [2, 'ink']]);
});

test('unbound, the ink fallback runs and nothing is written', () => {
    const { manager, g, dispatcher } = setup();
    const engine = openChat(manager, 'priya_helpdesk');
    engine.goToKnot('se_then_ink');
    assert.equal(line(engine.story), 'Sum: -18 band 0');
    assert.equal(g.priya_influence, -18);
    assert.deepEqual(influenceEvents(dispatcher).map(e => [e.delta, e.reason]), [[2, 'ink']]);
});

// ------------------------------------------------------------------ display (README AA)

test('resolveInfluenceDisplay: defaults true, scenario default, per-character override, bar false hides number', () => {
    const scenario = JSON.parse(scenarioText);
    // social.influenceDisplay sets number: false for everyone
    assert.deepEqual(resolveInfluenceDisplay(scenario, 'priya'), { bar: true, number: false, pip: true });
    // pierce overrides number back on and hides the pip
    assert.deepEqual(resolveInfluenceDisplay(scenario, 'pierce'), { bar: true, number: true, pip: false });
    // no scenario default: all true
    delete scenario.social.influenceDisplay;
    assert.deepEqual(resolveInfluenceDisplay(scenario, 'dev'), { bar: true, number: true, pip: true });
    // bar false forces number false, whatever number says
    scenario.social.characters.dev.influence.display = { bar: false, number: true };
    assert.deepEqual(resolveInfluenceDisplay(scenario, 'dev'), { bar: false, number: false, pip: true });
    // non-boolean values are ignored
    scenario.social.characters.dev.influence.display = { bar: 'no', pip: 0 };
    assert.deepEqual(resolveInfluenceDisplay(scenario, 'dev'), { bar: true, number: true, pip: true });
    // no entry: nothing shown
    assert.deepEqual(resolveInfluenceDisplay(scenario, 'ruth'), { bar: false, number: false, pip: false });
    assert.deepEqual(resolveInfluenceDisplay({}, 'priya'), { bar: false, number: false, pip: false });
});
