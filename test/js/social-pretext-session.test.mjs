// The pretext call driver, minigames/person-chat/person-chat-pretext.js (06 N2,
// N3, N7-N9; 00 §8, S3, S5; packet P4-B). Tests the testable core against the real
// social-influence service and the real (pure) pretext judge:
//   - PretextSession: the reload-safe store, log cap 40, lowestInfluence, round-trip;
//   - makePretextExternals: pretext_say returns the band and moves influence through
//     the service; the per-run ledger makes a replay of the same turn a no-op;
//     pretext_ask grants (setGlobal + intel), pending-then-verified, soft refusals
//     and the maxRefusals forced report with its threshold effects;
//   - finalisePretext: the outcome, the per-call globals and the payload (N8);
//   - fillPretextVars: the card VARs named for the fact the blank feeds (06 §5);
//   - mergeSpec: the call data merged with the character's thresholds/influence.
// Run with: bundle exec node --test test/js/social-pretext-session.test.mjs
//
// Browser modules are copied to a temp dir as .mjs, as in social-influence.test.mjs.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-pretext-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));

copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/pretext-judge.js', 'pretext-judge.mjs');
copy('systems/social-influence.js', 'social-influence.mjs', (s) => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('systems/social-intel.js', 'social-intel.mjs', (s) => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('minigames/person-chat/person-chat-pretext.js', 'person-chat-pretext.mjs', (s) => s
    .replace("'../../systems/global-writer.js'", "'./global-writer.mjs'")
    .replace("'../../systems/social-influence.js'", "'./social-influence.mjs'")
    .replace("'../../systems/social-intel.js'", "'./social-intel.mjs'"));

const imp = (name) => import(pathToFileURL(join(dir, name)).href);
const { writeGlobal } = await imp('global-writer.mjs');
const judge = await imp('pretext-judge.mjs');
const { installSocialInfluence, uninstallSocialInfluence } = await imp('social-influence.mjs');
const P = await imp('person-chat-pretext.mjs');

const quiet = (fn) => {
    const { log, warn } = console;
    console.log = () => {}; console.warn = () => {};
    try { return fn(); } finally { console.log = log; console.warn = warn; }
};

function makeDispatcher() {
    const listeners = new Map();
    const emitted = [];
    return {
        emitted, listeners,
        on(n, cb) { listeners.set(n, [...(listeners.get(n) || []), cb]); },
        off(n, cb) { listeners.set(n, (listeners.get(n) || []).filter((f) => f !== cb)); },
        emit(n, d) { emitted.push([n, d]); (listeners.get(n) || []).slice().forEach((cb) => cb(d)); }
    };
}

// The lab's Dev call (06 §4.8, 00 §8 "Characters of the student lab"), trimmed to
// what the binding needs. Tell strings are short, non-empty placeholders.
function scenario() {
    const tell = (s) => ({ pass: `${s} ok`, fail: `${s}: {said} not {actual}`, failCategory: `${s} mismatch`, unknown: `${s} uncheckable` });
    return {
        globalVariables: {
            dev_influence: -10, dev_latched: '', dev_wary: false, dev_refusing: false, dev_reported: false,
            dev_lockout_until: 0, dev_lockout_channel: '',
            pretext_service_desk_call_state: null, pretext_service_desk_call_outcome: '', pretext_service_desk_call_lowest: 0,
            pretext_call_done: false, pretext_call_reported: false,
            se_intel_lord_portal_name: false, se_intel_lord_payslip_date: false
        },
        social: {
            characters: {
                dev: {
                    displayName: 'Dev',
                    channels: { phone: 'dev_service_desk' },
                    influence: { global: 'dev_influence', min: -100, max: 100, start: -10 },
                    syncedVars: ['dev_influence'],
                    thresholds: [
                        { id: 'wary', at: -40, icon: 'wary', effects: [{ type: 'setGlobal', global: 'dev_wary', value: true, clearOnRearm: true }] },
                        { id: 'refuses', at: -50, icon: 'refuses', effects: [{ type: 'setGlobal', global: 'dev_refusing', value: true, clearOnRearm: true }] },
                        { id: 'reports', at: -70, icon: 'reports', effects: [
                            { type: 'setGlobal', global: 'dev_reported', value: true },
                            { type: 'endConversation' },
                            { type: 'lockout', scope: 'channel', until: { afterMinutes: 2 }, recoverTo: -30 }
                        ] }
                    ]
                }
            },
            pretextNpcs: [{
                character: 'dev', callId: 'service_desk_call',
                susceptibility: { urgency: -10, authority_borrowed: -20, candour: 10 },
                unverifiableCost: -10,
                tuning: { maxRefusals: 2, matchCreditCapPerLine: 10, tellDetail: 'full' },
                knows: {
                    intern: { value: 'lord_full', accept: ['lord_first', 'lord_full'], grade: 'identity' },
                    team: { value: 'finance', grade: 'identity' }
                },
                lines: {
                    open_buddy: { blanks: { intern: 'intern', team: 'team' }, claims: [{ fact: 'intern', from: 'blank:intern' }, { fact: 'team', from: 'blank:team' }] },
                    verify_line: { claims: [{ fact: 'intern', from: 'blank:intern' }] },
                    urgent_payslip: { technique: 'urgency', claims: [] }
                },
                asks: {
                    portal_name: { pressure: 0, floor: -30, verification: [], grants: { intel: ['lord_portal_name'], setGlobal: { pretext_call_done: true } } },
                    payslip_date: { pressure: -10, floor: -20, verification: ['intern'], grants: { intel: ['lord_payslip_date'], setGlobal: { pretext_call_done: true } } }
                },
                outcomes: {
                    got_it: {},
                    reported: { line: 'I will check with my manager. Goodbye.', setGlobal: { pretext_call_reported: true } },
                    walked_away: {}
                },
                tells: {
                    intern: tell('Intern'), team: tell('Team'),
                    techniques: { urgency: 'Urgency pressure', authority_borrowed: 'Borrowed authority', candour: 'Candour helps' },
                    repair: 'Owning the slip costs less', ask: { accepted: 'He read it out', pending: 'He wants a check', refused: 'He will not' },
                    bands: { calm: 'relaxed', wary: 'slowed', refusing: 'stopped' }
                },
                defenderNotes: { intern: 'A service desk that checks the starter list catches a guessed name.' }
            }]
        }
    };
}

// Install the service in a fresh fake window and return the pieces the tests use.
function setup({ saved = {}, start } = {}) {
    const s = scenario();
    if (typeof start === 'number') s.globalVariables.dev_influence = start;
    const dispatcher = makeDispatcher();
    const clock = { t: 1000, elapsedMs() { return this.t; } };
    globalThis.window = {
        gameScenario: s,
        gameState: { globalVariables: { ...s.globalVariables, ...saved } },
        eventDispatcher: dispatcher,
        gameClock: clock
    };
    const service = quiet(() => installSocialInfluence({ scenario: s, dispatcher, hooks: { now: () => clock.t } }));
    window.socialInfluence = service;
    // A fake grantFact: sets se_intel_<id> directly, so the binding's intel grants
    // are observable without pulling in social-intel's note/board machinery.
    const granted = [];
    const grantFact = (id) => { window.gameState.globalVariables[`se_intel_${id}`] = true; granted.push(id); return { granted: true, id }; };
    return { s, service, dispatcher, clock, grantFact, granted };
}

const globals = () => window.gameState.globalVariables;
const CALL = 'service_desk_call';
const CARD = { intern: { value: 'lord_full', label: 'Sofia Lord' }, team: { value: 'finance', label: 'Finance' } };

// Build the externals for a run, with the merged spec and injected collaborators.
function externals({ service, session, grantFact, runId = 'run1', npcId = 'dev_service_desk' }) {
    const spec = P.mergeSpec(service.scenario.social.pretextNpcs[0], service.getCharacterConfig('dev'));
    const ctx = { engine: null, npcId, channel: 'phone', runId };
    service.beginRun(runId);
    return { ...P.makePretextExternals({ service, spec, session, ctx, judge, writeGlobal, grantFact }), spec, ctx };
}

// -------------------------------------------------------------- session store

test('PretextSession round-trips through its state key, ids only, log capped at 40', () => {
    setup();
    const session = new P.PretextSession({ callId: CALL, character: 'dev', npcId: 'dev_service_desk', channel: 'phone' });
    session.blanks = { ...CARD };
    session.openMismatches.push('team');
    for (let i = 0; i < 50; i++) session.addLog({ turn: i, kind: 'say', id: `u${i}`, entries: [{ delta: 1, reason: 'x' }], band: 0 });
    assert.equal(session.log.length, 40, 'log holds only the last 40 entries');
    assert.equal(session.log[0].id, 'u10');

    P.persistSession(session);
    const raw = globals()[`pretext_${CALL}_state`];
    assert.ok(raw && typeof raw === 'object', 'stored at pretext_<callId>_state');
    assert.deepEqual(raw.openMismatches, ['team']);
    assert.equal(JSON.stringify(raw).includes('[object'), false, 'the snapshot is plain JSON');

    const back = P.loadSession(CALL);
    assert.equal(back.callId, CALL);
    assert.deepEqual(back.openMismatches, ['team']);
    assert.equal(back.log.length, 40);
    assert.deepEqual(back.blanks, CARD);
});

// -------------------------------------------------------------- pretext_say + ledger

test('pretext_say moves influence through the service and returns the band', () => {
    const { service } = setup();
    const session = new P.PretextSession({ callId: CALL, character: 'dev' });
    session.blanks = { ...CARD };
    const { pretext_say } = externals({ service, session });

    // open_buddy: intern ✓ and team ✓, each +10, capped to +10 for the line.
    const band = quiet(() => pretext_say('open_buddy'));
    assert.equal(band, 0, 'calm');
    assert.equal(service.getInfluence('dev'), 0, '-10 + capped 10 = 0');
    assert.equal(session.lowestInfluence, -10, 'the starting value is the lowest seen');
    assert.equal(session.log.length, 1);
});

test('the per-run ledger makes a replay of the same turn a no-op', () => {
    const { service } = setup();
    const session = new P.PretextSession({ callId: CALL, character: 'dev' });
    session.blanks = { ...CARD };
    const { pretext_say } = externals({ service, session });

    quiet(() => pretext_say('open_buddy'));
    assert.equal(service.getInfluence('dev'), 0);
    // Same id, same turn (no advanceTurn): the stored band comes back, nothing re-applies.
    const again = quiet(() => pretext_say('open_buddy'));
    assert.equal(again, 0);
    assert.equal(service.getInfluence('dev'), 0, 'influence did not move a second time');

    // A new turn runs the line again, but its claimed facts (intern, team) are now
    // proven, so they earn no further credit: a one-line opener cannot be repeated to
    // farm influence (M3). The ledger still runs the call (the log grows); the judge
    // just gives proven facts 0.
    service.advanceTurn('run1');
    quiet(() => pretext_say('open_buddy'));
    assert.equal(service.getInfluence('dev'), 0, 'a repeat of an already-proven opener earns nothing');
    assert.ok(session.provenFacts.includes('intern') && session.provenFacts.includes('team'),
        'the opener marked its facts proven');
});

test('a checkable wrong claim costs by grade and opens the mismatch', () => {
    const { service } = setup();
    const session = new P.PretextSession({ callId: CALL, character: 'dev' });
    session.blanks = { intern: { value: 'lord_full', label: 'Sofia Lord' }, team: { value: 'accounts', label: 'Accounts' } };
    const { pretext_say } = externals({ service, session });

    const band = quiet(() => pretext_say('open_buddy'));
    // intern ✓ +10, team ✗ identity -30 => -10 + 10 - 30 = -30
    assert.equal(service.getInfluence('dev'), -30);
    assert.equal(band, 0, 'still above wary (-40)');
    assert.deepEqual(session.openMismatches, ['team'], 'the wrong fact is now open');
});

// -------------------------------------------------------------- pretext_ask grants

test('pretext_ask grants: setGlobal and intel applied once, outcome got_it', () => {
    const { service, grantFact } = setup({ start: 0 });
    const session = new P.PretextSession({ callId: CALL, character: 'dev' });
    session.blanks = { ...CARD };
    const { pretext_ask, spec, ctx } = externals({ service, session, grantFact });

    const r = quiet(() => pretext_ask('portal_name'));
    assert.equal(r, 1, 'granted');
    assert.equal(globals().se_intel_lord_portal_name, true, 'intel granted');
    assert.equal(globals().pretext_call_done, true, 'setGlobal grant applied');
    assert.deepEqual(session.grantedAsks, ['portal_name']);

    const payload = P.finalisePretext({ session, spec, service, ctx });
    assert.equal(payload.outcome, 'got_it');
    assert.deepEqual(payload.asks, ['portal_name']);
    assert.equal(globals()[`pretext_${CALL}_outcome`], 'got_it');
    assert.equal(typeof globals()[`pretext_${CALL}_lowest`], 'number');
    assert.equal(globals().pretext_call_reported, false, 'got_it does not set the reported flag');
    assert.equal(session.open, false, 'the session is closed after finalise');
});

test('R-5: a failed call advances the hint counter (walked away or reported); got_it does not', () => {
    const { service } = setup({ start: 0 });
    // Walked away: nothing granted, not reported -> the ladder advances.
    const s1 = new P.PretextSession({ callId: CALL, character: 'dev' });
    s1.blanks = { ...CARD };
    const e1 = externals({ service, session: s1, runId: 'r1' });
    const p1 = P.finalisePretext({ session: s1, spec: e1.spec, service, ctx: e1.ctx });
    assert.equal(p1.outcome, 'walked_away');
    assert.equal(globals()[`pretext_${CALL}_reports`], 1, 'a walked-away call advances the ladder');

    // got_it: a granting ask -> the ladder does not advance.
    const s2 = new P.PretextSession({ callId: CALL, character: 'dev' });
    s2.blanks = { ...CARD };
    const e2 = externals({ service, session: s2, runId: 'r2' });
    quiet(() => e2.pretext_ask('portal_name'));
    const p2 = P.finalisePretext({ session: s2, spec: e2.spec, service, ctx: e2.ctx });
    assert.equal(p2.outcome, 'got_it');
    assert.equal(globals()[`pretext_${CALL}_reports`], 1, 'a got_it call leaves the ladder where it was');
});

test('pretext_ask pending, then a verifying line, then granted', () => {
    const { service, grantFact } = setup({ start: 0 });
    const session = new P.PretextSession({ callId: CALL, character: 'dev' });
    session.blanks = { ...CARD };
    const api = externals({ service, session, grantFact });

    // payslip_date: pressure -10 -> -10 >= floor -20, but it needs the intern check.
    const pending = quiet(() => api.pretext_ask('payslip_date'));
    assert.equal(pending, 2, 'needs verification');
    assert.deepEqual(session.pendingVerification, ['intern']);
    assert.equal(service.getInfluence('dev'), -10, 'the pressure applied');

    // The player supplies the intern name: an ordinary matched claim clears it.
    service.advanceTurn('run1');
    quiet(() => api.pretext_say('verify_line'));
    assert.deepEqual(session.pendingVerification, []);
    assert.equal(session.verified.payslip_date, true, 'verification satisfied');

    // Re-ask: now granted.
    service.advanceTurn('run1');
    const granted = quiet(() => api.pretext_ask('payslip_date'));
    assert.equal(granted, 1);
    assert.equal(globals().se_intel_lord_payslip_date, true);
});

test('an ask whose verification fact was already proven as the opener grants without pending (M3)', () => {
    const { service, grantFact } = setup({ start: 0 });
    const session = new P.PretextSession({ callId: CALL, character: 'dev' });
    session.blanks = { ...CARD };
    const api = externals({ service, session, grantFact });

    // The intern name is given as the opener, before the date is asked.
    quiet(() => api.pretext_say('open_buddy'));
    assert.ok(session.provenFacts.includes('intern'), 'the opener proved the intern name');

    // The date ask needs the intern check. It is already proven, so it grants at once,
    // rather than coming back pending and sending the player round again.
    service.advanceTurn('run1');
    const r = quiet(() => api.pretext_ask('payslip_date'));
    assert.equal(r, 1, 'granted, not pending');
    assert.equal(globals().se_intel_lord_payslip_date, true);
});

test('influence does not carry between calls: a fresh call resets to the start (M3)', async () => {
    const { service } = setup({ start: -10 });
    // The first call leaves Dev low.
    service.setInfluence('dev', -40, 'first call', { channel: 'phone' });
    assert.equal(service.getInfluence('dev'), -40);

    // A fresh call: attachPretext resets to the configured start (-10) because the
    // saved session is not open. A minimal minigame stub is enough for the attach.
    globals()[`pretext_${CALL}_state`] = null;
    const engine = { story: { variablesState: { _defaultGlobalVariables: new Map(), $() {} }, BindExternalFunction() {}, bindExternalFunction() {} }, bindExternalFunction() {} };
    const minigame = { params: { pretextCallId: CALL, blanks: { ...CARD } }, inkEngine: engine, npcId: 'dev_service_desk',
        ui: {}, complete() {}, gameResult: {} };
    await quiet(() => P.attachPretext(minigame, { chat: 'phone', judge }));
    assert.equal(service.getInfluence('dev'), -10, 'a new call starts fresh at the character start');
});

test('finalise on a reported call hands the outcome line to the chat to speak (voiced call)', async () => {
    const { service } = setup({ start: -10 });
    globals()[`pretext_${CALL}_state`] = null;
    const engine = { story: { variablesState: { _defaultGlobalVariables: new Map(), $() {} }, BindExternalFunction() {}, bindExternalFunction() {} }, bindExternalFunction() {} };
    const spoken = [];
    const shown = [];
    const minigame = { params: { pretextCallId: CALL, blanks: { ...CARD } }, inkEngine: engine, npcId: 'dev_service_desk',
        ui: { addMessage: (who, text) => shown.push([who, text]) }, complete() {}, gameResult: {},
        speakOutcomeLine: (text) => spoken.push(text) };
    const handle = await quiet(() => P.attachPretext(minigame, { chat: 'phone', judge }));
    handle.session.reportedThisCall = true;
    quiet(() => { try { handle.finish(); } catch (e) { /* the debrief needs a DOM; the line was handed over first */ } });
    assert.deepEqual(shown, [['npc', 'I will check with my manager. Goodbye.']]);
    assert.deepEqual(spoken, ['I will check with my manager. Goodbye.'], 'the same line is spoken');
});

test('finalise without an authored outcome line speaks nothing (got_it)', async () => {
    const { service } = setup({ start: -10 });
    globals()[`pretext_${CALL}_state`] = null;
    const engine = { story: { variablesState: { _defaultGlobalVariables: new Map(), $() {} }, BindExternalFunction() {}, bindExternalFunction() {} }, bindExternalFunction() {} };
    const spoken = [];
    const minigame = { params: { pretextCallId: CALL, blanks: { ...CARD } }, inkEngine: engine, npcId: 'dev_service_desk',
        ui: { addMessage() {} }, complete() {}, gameResult: {}, speakOutcomeLine: (t) => spoken.push(t) };
    const handle = await quiet(() => P.attachPretext(minigame, { chat: 'phone', judge }));
    quiet(() => { try { handle.finish(); } catch (e) { /* no DOM */ } });
    assert.deepEqual(spoken, [], 'walked away has no line');
});

test('soft refusals reach maxRefusals and force a report with its threshold effects', () => {
    const { service, grantFact, clock } = setup({ start: -15 });
    const session = new P.PretextSession({ callId: CALL, character: 'dev' });
    session.blanks = { ...CARD };
    const api = externals({ service, session, grantFact });

    // payslip_date at -15: pressure -10 -> -25 < floor -20 => refused (1st).
    assert.equal(quiet(() => api.pretext_ask('payslip_date')), 0);
    assert.equal(session.refusals, 1);
    assert.equal(session.reportedThisCall, false, 'one refusal is not a report');

    // A new turn, refused again -> second refusal reaches maxRefusals (2) and reports.
    service.advanceTurn('run1');
    assert.equal(quiet(() => api.pretext_ask('payslip_date')), 0);
    assert.equal(session.refusals, 2);
    assert.equal(session.reportedThisCall, true);
    assert.equal(session.reportReason, 'maxRefusals');
    assert.equal(globals().dev_reported, true, 'the reports threshold effect ran');
    assert.ok(globals().dev_lockout_until > clock.t, 'the lockout effect armed the deadline');

    const payload = P.finalisePretext({ session, spec: api.spec, service, ctx: api.ctx });
    assert.equal(payload.outcome, 'reported');
    assert.equal(globals().pretext_call_reported, true, "the reported outcome's setGlobal ran");
});

test('a threshold-crossing line reports, and outcome reported beats an earlier grant', () => {
    const { service, grantFact } = setup({ start: 0 });
    const session = new P.PretextSession({ callId: CALL, character: 'dev' });
    session.blanks = { ...CARD };
    const api = externals({ service, session, grantFact });

    // Grant something first, then crash the call below -70.
    quiet(() => api.pretext_ask('portal_name'));
    assert.deepEqual(session.grantedAsks, ['portal_name']);

    // Drive influence down past reports (-70) with a run of wrong identity claims.
    session.blanks = { intern: { value: 'lord_full', label: 'Sofia Lord' }, team: { value: 'accounts', label: 'Accounts' } };
    for (let i = 0; i < 4 && !session.reportedThisCall; i++) {
        service.advanceTurn('run1');
        session.openMismatches = []; // a fresh wrong claim each turn
        quiet(() => api.pretext_say('open_buddy'));
    }
    assert.equal(session.reportedThisCall, true, 'crossing reports ended in a report');
    const payload = P.finalisePretext({ session, spec: api.spec, service, ctx: api.ctx });
    assert.equal(payload.outcome, 'reported', 'reported wins even though an ask was granted');
});

// -------------------------------------------------------------- the card VARs (06 §5)

test('fillPretextVars names the VARs for the fact the blank feeds and skips undeclared', () => {
    setup();
    const written = {};
    const declared = new Set(['pretext_intern_name', 'pretext_intern_value', 'pretext_team_name', 'pretext_team_value']);
    const story = { variablesState: { _defaultGlobalVariables: declared, $(name, value) { written[name] = value; } } };
    P.fillPretextVars(story, { intern: { value: 'lord_full', label: 'Sofia Lord' }, team: { value: 'finance', label: 'Finance' }, ghost: { value: 'x', label: 'y' } });
    assert.equal(written.pretext_intern_name, 'Sofia Lord');
    assert.equal(written.pretext_intern_value, 'lord_full');
    assert.equal(written.pretext_team_value, 'finance');
    assert.equal('pretext_ghost_name' in written, false, 'an undeclared VAR is not written');
});

// -------------------------------------------------------------- merge + outcome

test('mergeSpec folds the character thresholds and influence into the call spec', () => {
    const { service } = setup();
    const spec = P.mergeSpec(service.scenario.social.pretextNpcs[0], service.getCharacterConfig('dev'));
    assert.equal(spec.callId, CALL);
    assert.equal(spec.thresholds.length, 3);
    assert.equal(spec.influence.min, -100);
    assert.equal(spec.influence.start, -10);
});

test('outcomeFor: reported, else any grant, else walked away', () => {
    const base = () => new P.PretextSession({ callId: CALL, character: 'dev' });
    assert.equal(P.outcomeFor(base()), 'walked_away');
    const g = base(); g.grantedAsks.push('portal_name');
    assert.equal(P.outcomeFor(g), 'got_it');
    const r = base(); r.grantedAsks.push('portal_name'); r.reportedThisCall = true;
    assert.equal(P.outcomeFor(r), 'reported');
});

test('P6: got_it is sticky — a later check-in call does not downgrade the outcome or advance the ladder', () => {
    const { service, grantFact } = setup({ start: 0 });

    // Call 1: grants the portal name -> got_it. The outcome global is written got_it.
    const s1 = new P.PretextSession({ callId: CALL, character: 'dev' });
    s1.blanks = { ...CARD };
    const e1 = externals({ service, session: s1, grantFact, runId: 'c1' });
    quiet(() => e1.pretext_ask('portal_name'));
    const p1 = P.finalisePretext({ session: s1, spec: e1.spec, service, ctx: e1.ctx });
    assert.equal(p1.outcome, 'got_it');
    assert.equal(globals()[`pretext_${CALL}_outcome`], 'got_it');
    assert.equal(Number(globals()[`pretext_${CALL}_reports`]) || 0, 0, 'a clean got_it leaves the ladder at 0');

    // Call 2 on the same callId: a pointless check-in that ends with nothing granted.
    // outcomeFor is walked_away for this call, but the engagement already got what it
    // came for, so the recorded outcome must stay got_it and the ladder must not move.
    const s2 = new P.PretextSession({ callId: CALL, character: 'dev' });
    s2.blanks = { ...CARD };
    const e2 = externals({ service, session: s2, grantFact, runId: 'c2' });
    const p2 = P.finalisePretext({ session: s2, spec: e2.spec, service, ctx: e2.ctx });
    assert.equal(p2.outcome, 'walked_away', 'this call on its own walked away');
    assert.equal(globals()[`pretext_${CALL}_outcome`], 'got_it', 'the engagement outcome stays got_it');
    assert.equal(Number(globals()[`pretext_${CALL}_reports`]) || 0, 0, 'a check-in after success does not advance the ladder');
});

test('P6: a reported first call then a got_it still reads as two calls (ladder = 1, outcome got_it)', () => {
    const { service, grantFact } = setup({ start: -65 });

    // Call 1: pushed over the report threshold, nothing granted -> reported.
    const s1 = new P.PretextSession({ callId: CALL, character: 'dev' });
    s1.blanks = { ...CARD };
    const e1 = externals({ service, session: s1, runId: 'r1' });
    for (let i = 0; i < 4 && !s1.reportedThisCall; i++) {
        service.advanceTurn('r1');
        quiet(() => e1.pretext_say('urgent_payslip'));
    }
    assert.equal(s1.reportedThisCall, true, 'call 1 crossed the report threshold');
    const p1 = P.finalisePretext({ session: s1, spec: e1.spec, service, ctx: e1.ctx });
    assert.equal(p1.outcome, 'reported');
    assert.equal(Number(globals()[`pretext_${CALL}_reports`]), 1, 'the reported call advanced the ladder');

    // Call 2: grants the portal -> got_it. Outcome upgrades, ladder stays at 1 so the
    // report still reads the earlier reported call (twoCalls).
    const s2 = new P.PretextSession({ callId: CALL, character: 'dev' });
    s2.blanks = { ...CARD };
    const e2 = externals({ service, session: s2, grantFact, runId: 'r2' });
    // A fresh call resets influence to the character's start (attachPretext's new_call),
    // so the lean of the first call does not carry into the second.
    quiet(() => service.setInfluence('dev', service.getCharacterConfig('dev').start, 'new_call', e2.ctx));
    quiet(() => e2.pretext_ask('portal_name'));
    const p2 = P.finalisePretext({ session: s2, spec: e2.spec, service, ctx: e2.ctx });
    assert.equal(p2.outcome, 'got_it');
    assert.equal(globals()[`pretext_${CALL}_outcome`], 'got_it', 'the outcome upgrades to got_it');
    assert.equal(Number(globals()[`pretext_${CALL}_reports`]), 1, 'the earlier reported call is still counted');
});

test.after(() => { try { uninstallSocialInfluence(); } catch (e) { /* ignore */ } });
