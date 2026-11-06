// Gap tests for minigames/person-chat/person-chat-pretext.js (the call driver): session
// store round-trip on junk, repeated and out-of-order events through the externals, sticky
// outcomes and running minimum across calls, grants, and the VAR filler on thin data.
// Uses a stub influence service and stub judge so each rule is tested on its own.
// Run with: bin/test-js test/js/social-gap-pretext-session.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-pretext-session-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/social-influence.js', 'social-influence.mjs', (s) => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('systems/social-intel.js', 'social-intel.mjs', (s) => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('minigames/person-chat/person-chat-pretext.js', 'person-chat-pretext.mjs', (s) => s
    .replace("'../../systems/global-writer.js'", "'./global-writer.mjs'")
    .replace("'../../systems/social-influence.js'", "'./social-influence.mjs'")
    .replace("'../../systems/social-intel.js'", "'./social-intel.mjs'"));
const imp = (n) => import(pathToFileURL(join(dir, n)).href);
const P = await imp('person-chat-pretext.mjs');

const realWarn = console.warn;
console.warn = () => {};

globalThis.window = { gameState: { globalVariables: {} } };
const G = () => window.gameState.globalVariables;

function fakeService({ influence = 0, bandOf = () => 0 } = {}) {
    const calls = { add: [], report: [] };
    const ledger = new Map();
    const svc = {
        calls,
        influence,
        addInfluence(id, delta, reason, ctx) { calls.add.push({ id, delta, reason, line: ctx?.line }); svc.influence += delta; return { value: svc.influence }; },
        getInfluence() { return svc.influence; },
        getBand() { return bandOf(svc.influence); },
        report(id, reason) { calls.report.push({ id, reason }); return { reported: true }; },
        ledgerCall(runId, fn, id, compute) {
            if (runId === undefined || runId === null) return compute();
            const key = `${runId}|${fn}|${id}`;
            if (ledger.has(key)) return ledger.get(key);
            const r = compute();
            ledger.set(key, r);
            return r;
        },
        getCharacterConfig() { return null; },
    };
    return svc;
}
const stubJudge = (say = {}, ask = {}) => ({
    judgeUtterance: (spec, session, id) => (typeof say === 'function' ? say(id, session) : say[id]),
    judgeAsk: (spec, session, id) => (typeof ask === 'function' ? ask(id, session) : ask[id]),
});
const newSession = (over = {}) => new P.PretextSession({ callId: 'c1', character: 'dev', npcId: 'dev_phone', channel: 'phone', ...over });
function build({ say = {}, ask = {}, spec = {}, service = fakeService(), session = newSession(), runId = 'r1', writes = [], grants = [] } = {}) {
    const writeGlobal = (n, v) => { writes.push([n, v]); G()[n] = v; };
    const grantFact = (id) => { grants.push(id); };
    const ext = P.makePretextExternals({
        service, spec: { character: 'dev', asks: {}, ...spec }, session, ctx: { runId, npcId: 'dev_phone' },
        judge: stubJudge(say, ask), writeGlobal, grantFact,
    });
    return { ...ext, service, session, writes, grants };
}

// ── PretextSession ───────────────────────────────────────────────────────────

test('fromJSON of junk gives null; of an object with junk fields gives a clean session', () => {
    for (const raw of [null, undefined, 'x', 5, []]) assert.equal(P.PretextSession.fromJSON(raw), null);
    const s = P.PretextSession.fromJSON({ callId: 'c', turn: 'x', refusals: NaN, lowestInfluence: '5', openMismatches: 'a', provenFacts: {}, verified: [], blanks: 3, log: 'x', open: 0 });
    assert.equal(s.turn, 0);
    assert.equal(s.refusals, 0);
    assert.equal(s.lowestInfluence, null);
    assert.deepEqual(s.openMismatches, []);
    assert.deepEqual(s.provenFacts, []);
    assert.deepEqual(s.verified, {});
    assert.deepEqual(s.blanks, {});
    assert.deepEqual(s.log, []);
    assert.equal(s.open, true, 'only an explicit false closes a session');
    assert.equal(P.PretextSession.fromJSON({ open: false }).open, false);
});

test('toJSON then fromJSON is lossless and the snapshot shares no arrays with the live session', () => {
    const s = newSession();
    s.openMismatches.push('a'); s.grantedAsks.push('ask'); s.noteInfluence(-5); s.addLog({ turn: 1, kind: 'say', id: 'x' });
    s.verified.ask = true; s.pendingVerification = ['b']; s.pendingVerificationAsk = 'ask2'; s.provenFacts = ['c']; s.reportedThisCall = true; s.reportReason = 'threshold';
    const snap = s.toJSON();
    assert.deepEqual(P.PretextSession.fromJSON(JSON.parse(JSON.stringify(snap))).toJSON(), snap);
    snap.openMismatches.push('zzz');
    assert.deepEqual(s.openMismatches, ['a']);
});

test('log is capped at 40 entries keeping the newest, in the live store and in a snapshot', () => {
    const s = newSession();
    for (let i = 1; i <= 55; i++) s.addLog({ turn: i });
    assert.equal(s.log.length, 40);
    assert.equal(s.log[0].turn, 16);
    assert.equal(s.toJSON().log.length, 40);
    const big = P.PretextSession.fromJSON({ log: Array.from({ length: 90 }, (_, i) => ({ turn: i })) });
    assert.equal(big.log.length, 40);
    assert.equal(big.log[0].turn, 50);
});

test('noteInfluence keeps the lowest ever seen; NaN, strings and undefined are ignored; the first value sets it even if positive', () => {
    const s = newSession();
    s.noteInfluence(NaN); s.noteInfluence('5'); s.noteInfluence(undefined); s.noteInfluence(null);
    assert.equal(s.lowestInfluence, null);
    s.noteInfluence(30); assert.equal(s.lowestInfluence, 30);
    s.noteInfluence(-10); s.noteInfluence(20); s.noteInfluence(-5);
    assert.equal(s.lowestInfluence, -10);
    s.noteInfluence(Infinity); s.noteInfluence(-Infinity);
    assert.equal(s.lowestInfluence, -10);
});

test('applyUtteranceChanges: no argument is a no-op; duplicates are not re-added; repairs remove; verification completes the ask', () => {
    const s = newSession();
    s.applyUtteranceChanges();
    s.applyUtteranceChanges({ opens: ['a', 'a'], proven: ['b', 'b'] });
    assert.deepEqual(s.openMismatches, ['a']);
    assert.deepEqual(s.provenFacts, ['b']);
    s.applyUtteranceChanges({ repairs: ['a'] });
    assert.deepEqual(s.openMismatches, []);
    s.pendingVerification = ['x', 'y']; s.pendingVerificationAsk = 'ask1';
    s.applyUtteranceChanges({ verificationCleared: ['x'] });
    assert.deepEqual(s.pendingVerification, ['y']);
    assert.equal(s.verified.ask1, undefined);
    s.applyUtteranceChanges({ verificationCleared: ['y'] });
    assert.equal(s.verified.ask1, true);
    assert.equal(s.pendingVerificationAsk, null);
});

test('an ask with an empty pending list is marked verified by any line (a pending ask with no facts completes at once)', () => {
    const s = newSession();
    s.pendingVerification = []; s.pendingVerificationAsk = 'ask9';
    s.applyUtteranceChanges({});
    assert.equal(s.verified.ask9, true);
});

test('hasOpenMismatch', () => {
    const s = newSession(); s.openMismatches = ['a'];
    assert.equal(s.hasOpenMismatch('a'), true);
    assert.equal(s.hasOpenMismatch('b'), false);
});

test('persistSession / loadSession: no globals, no callId, a missing key, a junk value', () => {
    const saved = window.gameState;
    window.gameState = undefined;
    assert.doesNotThrow(() => P.persistSession(newSession()));
    assert.equal(P.loadSession('c1'), null);
    window.gameState = { globalVariables: {} };
    P.persistSession(newSession({ callId: undefined }));
    assert.deepEqual(G(), {});
    assert.equal(P.loadSession('nope'), null);
    G().pretext_bad_state = 'junk';
    assert.equal(P.loadSession('bad'), null);
    P.persistSession(newSession());
    assert.equal(P.loadSession('c1').callId, 'c1');
    window.gameState = saved;
});

test('persistSession survives a throwing stateSync', () => {
    window.gameState = { globalVariables: {} };
    window.stateSync = { sync() { throw new Error('offline'); } };
    assert.doesNotThrow(() => P.persistSession(newSession()));
    delete window.stateSync;
});

// ── spec and call lookup ─────────────────────────────────────────────────────

test('findCallSpec: array only, junk entries skipped, unknown id null', () => {
    const sc = { social: { pretextNpcs: [null, 'x', { callId: 'a' }, { callId: 'b', n: 1 }] } };
    assert.equal(P.findCallSpec(sc, 'b').n, 1);
    assert.equal(P.findCallSpec(sc, 'zzz'), null);
    assert.equal(P.findCallSpec({ social: { pretextNpcs: {} } }, 'a'), null);
    assert.equal(P.findCallSpec(null, 'a'), null);
    assert.equal(P.findCallSpec({}, undefined), null);
});

test('mergeSpec: null entry and null config; a config without thresholds gives an empty list; the entry is not mutated', () => {
    assert.deepEqual(P.mergeSpec(null, null), {});
    assert.deepEqual(P.mergeSpec(undefined, { min: -1, max: 1, start: 0, rearmMargin: 5 }), { thresholds: [], influence: { min: -1, max: 1, start: 0, rearmMargin: 5 } });
    const e = { callId: 'x' };
    P.mergeSpec(e, { thresholds: [1] });
    assert.deepEqual(e, { callId: 'x' });
});

// ── grants ───────────────────────────────────────────────────────────────────

test('applyGrants: junk grants do nothing; setGlobal and intel apply; an empty intel list never calls the granter', () => {
    const w = []; const g = [];
    const opts = { writeGlobal: (n, v) => w.push([n, v]), grantFact: (id, o) => g.push([id, o.source]) };
    for (const grants of [undefined, null, 'x', [], 5]) P.applyGrants(grants, {}, opts);
    assert.equal(w.length + g.length, 0);
    P.applyGrants({ setGlobal: { a: true, b: 2 }, intel: ['f1', 'f2'] }, { npcId: 'n' }, opts);
    assert.deepEqual(w, [['a', true], ['b', 2]]);
    assert.deepEqual(g, [['f1', 'pretext'], ['f2', 'pretext']]);
    P.applyGrants({ intel: [] }, {}, opts);
    P.applyGrants({ intel: 'f1', setGlobal: 'x' }, {}, opts);
    assert.equal(g.length, 2);
});

// ── externals ────────────────────────────────────────────────────────────────

test('pretext_say: a judge returning nothing is treated as an empty judgement; band falls back to the service band', () => {
    const { pretext_say, session, service } = build({ say: () => undefined, service: fakeService({ bandOf: () => 2 }) });
    assert.equal(pretext_say('l1'), 2);
    assert.equal(session.turn, 1);
    assert.equal(service.calls.add.length, 0);
});

test('pretext_say: zero, non-numeric and non-object entries are not written to the service', () => {
    const { pretext_say, service } = build({ say: () => ({ entries: [{ delta: 0 }, { delta: '5' }, null, 'x', { delta: NaN }, { delta: 4, reason: 'r' }], band: 1 }) });
    pretext_say('l1');
    assert.equal(service.calls.add.length, 2); // NaN is typeof number and non-zero; documents it
    assert.equal(service.calls.add[1].delta, 4);
});

test('pretext_say: the same line id on the same turn is applied once (ledger); a different id applies', () => {
    const { pretext_say, service, session } = build({ say: () => ({ entries: [{ delta: -5, reason: 'x' }], band: 0 }) });
    pretext_say('l1'); pretext_say('l1'); pretext_say('l1');
    assert.equal(service.calls.add.length, 1);
    assert.equal(session.turn, 1);
    pretext_say('l2');
    assert.equal(service.calls.add.length, 2);
});

test('pretext_say with no runId has no ledger: a repeated id applies each time', () => {
    const { pretext_say, service } = build({ say: () => ({ entries: [{ delta: -5 }], band: 0 }), runId: null });
    pretext_say('l1'); pretext_say('l1');
    assert.equal(service.calls.add.length, 2);
});

test('pretext_say records lowest influence, log entry, and a report with the judge\'s reason (default "threshold")', () => {
    const a = build({ say: () => ({ entries: [{ delta: -30 }], band: 3, reported: true }) });
    a.pretext_say('l1');
    assert.equal(a.session.reportedThisCall, true);
    assert.equal(a.session.reportReason, 'threshold');
    assert.equal(a.session.lowestInfluence, -30);
    assert.deepEqual(a.service.calls.report, [{ id: 'dev', reason: 'threshold' }]);
    assert.equal(a.session.log[0].kind, 'say');
    const b = build({ say: () => ({ entries: [], band: 3, reported: true, reportReason: 'verificationFailed' }) });
    b.pretext_say('l1');
    assert.equal(b.session.reportReason, 'verificationFailed');
});

test('pretext_say stores the session through persistSession each time (a reload mid-call restores it)', () => {
    window.gameState = { globalVariables: {} };
    const { pretext_say } = build({ say: () => ({ entries: [{ delta: -5 }], band: 0 }) });
    pretext_say('l1');
    assert.equal(P.loadSession('c1').turn, 1);
    pretext_say('l2');
    assert.equal(P.loadSession('c1').turn, 2);
});

test('pretext_say: a non-finite judged band falls back to the service band', () => {
    const { pretext_say } = build({ say: () => ({ entries: [], band: NaN }), service: fakeService({ bandOf: () => 1 }) });
    assert.equal(pretext_say('l1'), 1);
});

test('onChange is called after each line with the id and band, and a non-function is ignored', () => {
    const seen = [];
    const writeGlobal = () => {};
    const ext = P.makePretextExternals({ service: fakeService(), spec: { character: 'dev', asks: {} }, session: newSession(), ctx: { runId: 'r' }, judge: stubJudge(() => ({ entries: [], band: 2 }), {}), writeGlobal, onChange: (e) => seen.push(e) });
    ext.pretext_say('l1');
    assert.deepEqual(seen.map((e) => [e.kind, e.id, e.band]), [['say', 'l1', 2]]);
    const ext2 = P.makePretextExternals({ service: fakeService(), spec: { character: 'dev', asks: {} }, session: newSession(), ctx: { runId: 'r' }, judge: stubJudge(() => ({ entries: [], band: 2 }), {}), writeGlobal, onChange: 'nope' });
    assert.doesNotThrow(() => ext2.pretext_say('l1'));
});

test('pretext_ask granted: grants applied once, ask recorded once even when asked twice in different turns', () => {
    const grants = []; const writes = [];
    const ask = { g: { inkResult: 1, entries: [], band: 0 } };
    const { pretext_ask, session } = build({ ask: (id) => ask[id], spec: { asks: { g: { grants: { setGlobal: { pretext_call_done: true }, intel: ['f1'] } } } }, grants, writes, runId: null });
    assert.equal(pretext_ask('g'), 1);
    assert.equal(pretext_ask('g'), 1);
    assert.deepEqual(session.grantedAsks, ['g']);
    assert.equal(session.turn, 2);
    assert.equal(grants.length, 2, 'without a ledger the grant runs per call; only the recorded ask is de-duplicated');
});

test('pretext_ask granted with the ledger: a replay of the same id on the same turn does not grant again', () => {
    const grants = [];
    const { pretext_ask } = build({ ask: () => ({ inkResult: 1, entries: [], band: 0 }), spec: { asks: { g: { grants: { intel: ['f1'] } } } }, grants });
    pretext_ask('g'); pretext_ask('g');
    assert.deepEqual(grants, ['f1']);
});

test('pretext_ask: an ink result outside 0/1/2 (or missing) is treated as a refusal and counts toward refusals', () => {
    for (const bad of [undefined, 3, -1, '1', null]) {
        const { pretext_ask, session } = build({ ask: () => ({ inkResult: bad, entries: [], band: 0 }) });
        assert.equal(pretext_ask('x'), 0, String(bad));
        assert.equal(session.refusals, 1);
        assert.deepEqual(session.grantedAsks, []);
    }
    const { pretext_ask } = build({ ask: () => undefined });
    assert.equal(pretext_ask('x'), 0);
});

test('pretext_ask pending: sets the pending facts and ask; a later grant of the same ask is not blocked', () => {
    let n = 0;
    const { pretext_ask, session } = build({ ask: () => (n++ === 0 ? { inkResult: 2, verificationNeeded: ['a', 'b'], entries: [], band: 0 } : { inkResult: 1, entries: [], band: 0 }), runId: null });
    assert.equal(pretext_ask('p'), 2);
    assert.deepEqual(session.pendingVerification, ['a', 'b']);
    assert.equal(session.pendingVerificationAsk, 'p');
    assert.equal(session.refusals, 0, 'pending is not a refusal');
    assert.equal(pretext_ask('p'), 1);
    assert.deepEqual(session.grantedAsks, ['p']);
});

test('pretext_ask: a throwing grant is swallowed, and the ask is still recorded as granted', () => {
    const service = fakeService();
    const session = newSession();
    const ext = P.makePretextExternals({
        service, spec: { character: 'dev', asks: { g: { grants: { setGlobal: { a: 1 } } } } }, session, ctx: { runId: 'r' },
        judge: stubJudge({}, { g: { inkResult: 1, entries: [], band: 0 } }),
        writeGlobal: () => { throw new Error('boom'); },
    });
    assert.equal(ext.pretext_ask('g'), 1);
    assert.deepEqual(session.grantedAsks, ['g']);
});

test('pretext_ask refused at the limit reports with the judge\'s reason (default maxRefusals)', () => {
    const { pretext_ask, session, service } = build({ ask: () => ({ inkResult: 0, reported: true, entries: [], band: 3 }) });
    pretext_ask('x');
    assert.equal(session.reportReason, 'maxRefusals');
    assert.equal(service.calls.report.length, 1);
});

test('pretext_ask: an ask unknown to the spec has no grants and does not throw', () => {
    const { pretext_ask, session } = build({ ask: () => ({ inkResult: 1, entries: [], band: 0 }), spec: { asks: undefined } });
    assert.equal(pretext_ask('ghost'), 1);
    assert.deepEqual(session.grantedAsks, ['ghost']);
});

// ── outcome and finalise ─────────────────────────────────────────────────────

test('outcomeFor: reported beats granted; granted beats nothing; empty is walked_away', () => {
    const s = newSession();
    assert.equal(P.outcomeFor(s), 'walked_away');
    s.grantedAsks.push('a');
    assert.equal(P.outcomeFor(s), 'got_it');
    s.reportedThisCall = true;
    assert.equal(P.outcomeFor(s), 'reported');
});

function finalise({ session = newSession(), spec = {}, service = fakeService(), globals = {} } = {}) {
    window.gameState = { globalVariables: { ...globals } };
    const writes = [];
    const writeGlobal = (n, v) => { writes.push([n, v]); G()[n] = v; };
    const payload = P.finalisePretext({ session, spec, service, ctx: { npcId: 'n' }, writeGlobal });
    return { payload, writes, session };
}

test('finalise: a walked-away call with no recorded influence uses the service value for lowest and bumps the ladder', () => {
    const { payload } = finalise({ service: fakeService({ influence: -15 }) });
    assert.equal(payload.outcome, 'walked_away');
    assert.equal(payload.lowestInfluence, -15);
    assert.equal(payload.influenceEnd, -15);
    assert.equal(G().pretext_c1_reports, 1);
    assert.equal(G().pretext_c1_lowest, -15);
});

test('finalise with no service: influenceEnd is null and lowest falls to 0 in the global', () => {
    const { payload } = finalise({ service: null });
    assert.equal(payload.influenceEnd, null);
    assert.equal(payload.lowestInfluence, null);
    assert.equal(G().pretext_c1_lowest, 0);
});

test('finalise: lowest is a running minimum across calls; a clean second call does not raise it', () => {
    const first = newSession(); first.noteInfluence(-60);
    finalise({ session: first });
    const second = newSession(); second.noteInfluence(-5);
    window.gameState = { globalVariables: { ...G() } };
    const writeGlobal = (n, v) => { G()[n] = v; };
    P.finalisePretext({ session: second, spec: {}, service: fakeService(), ctx: {}, writeGlobal });
    assert.equal(G().pretext_c1_lowest, -60);
});

test('finalise: a saved lowest that is not a number is replaced by this call\'s', () => {
    const s = newSession(); s.noteInfluence(-7);
    finalise({ session: s, globals: { pretext_c1_lowest: 'junk' } });
    assert.equal(G().pretext_c1_lowest, -7);
});

test('finalise: got_it is sticky; a later walked-away call keeps got_it and does not advance the ladder', () => {
    finalise({ globals: { pretext_c1_outcome: 'got_it', pretext_c1_reports: 1 } });
    assert.equal(G().pretext_c1_outcome, 'got_it');
    assert.equal(G().pretext_c1_reports, 1);
});

test('finalise: reported after an earlier walked_away overwrites the outcome (only got_it is sticky); the ladder counts both', () => {
    const s = newSession(); s.reportedThisCall = true;
    finalise({ session: s, globals: { pretext_c1_outcome: 'walked_away', pretext_c1_reports: 1 } });
    assert.equal(G().pretext_c1_outcome, 'reported');
    assert.equal(G().pretext_c1_reports, 2);
});

test('finalise: a non-numeric saved ladder counter starts again at 1', () => {
    finalise({ globals: { pretext_c1_reports: 'x' } });
    assert.equal(G().pretext_c1_reports, 1);
});

test('finalise: got_it first time writes no ladder entry; outcome spec setGlobal runs for the matching outcome only', () => {
    const s = newSession(); s.grantedAsks.push('a');
    const spec = { outcomes: { got_it: { setGlobal: { won: true } }, reported: { setGlobal: { burned: true } } } };
    const { writes } = finalise({ session: s, spec });
    assert.ok(writes.some(([n]) => n === 'won'));
    assert.ok(!writes.some(([n]) => n === 'burned'));
    assert.ok(!writes.some(([n]) => n === 'pretext_c1_reports'));
});

test('finalise: a reported call that also granted something reads reported, and the reported outcome flags are set', () => {
    const s = newSession(); s.grantedAsks.push('a'); s.reportedThisCall = true;
    const spec = { outcomes: { reported: { setGlobal: { burned: true } } } };
    const { payload } = finalise({ session: s, spec });
    assert.equal(payload.outcome, 'reported');
    assert.equal(G().burned, true);
});

test('finalise closes and persists the session; calling it twice is safe and bumps the ladder twice (no idempotence guard)', () => {
    const s = newSession();
    finalise({ session: s });
    assert.equal(s.open, false);
    assert.equal(P.loadSession('c1').open, false);
    const before = G().pretext_c1_reports;
    const writeGlobal = (n, v) => { G()[n] = v; };
    P.finalisePretext({ session: s, spec: {}, service: fakeService(), ctx: {}, writeGlobal });
    assert.equal(G().pretext_c1_reports, before + 1);
});

test('finalise payload: asks and log are copies; log is capped at 40', () => {
    const s = newSession();
    for (let i = 0; i < 45; i++) s.addLog({ turn: i });
    s.grantedAsks.push('a');
    const { payload } = finalise({ session: s });
    payload.asks.push('zzz');
    assert.deepEqual(s.grantedAsks, ['a']);
    assert.equal(payload.log.length, 40);
});

// ── fillPretextVars ──────────────────────────────────────────────────────────

test('fillPretextVars: null story, no variablesState, non-object blanks and non-object entries are ignored', () => {
    for (const story of [null, undefined, {}, { variablesState: null }]) assert.doesNotThrow(() => P.fillPretextVars(story, { a: { value: 'v' } }));
    const set = [];
    const story = { variablesState: { _defaultGlobalVariables: new Map([['pretext_a_name', 1], ['pretext_a_value', 1]]), $: (n, v) => set.push([n, v]) } };
    P.fillPretextVars(story, null);
    P.fillPretextVars(story, 'x');
    P.fillPretextVars(story, { a: null, b: 'str' });
    assert.deepEqual(set, []);
});

test('fillPretextVars: only declared VARs are written, missing label/value become empty strings, numbers are stringified', () => {
    const set = [];
    const story = { variablesState: { _defaultGlobalVariables: new Map([['pretext_a_name', 1], ['pretext_a_value', 1]]), $: (n, v) => set.push([n, v]) } };
    P.fillPretextVars(story, { a: { value: 12 }, b: { value: 'x', label: 'X' } });
    assert.deepEqual(set, [['pretext_a_name', ''], ['pretext_a_value', '12']]);
});

test('fillPretextVars: a throwing setter for one VAR does not stop the others; a story without a declared-set map writes nothing', () => {
    const set = [];
    const story = { variablesState: { _defaultGlobalVariables: new Map([['pretext_a_name', 1], ['pretext_b_name', 1]]), $: (n, v) => { if (n === 'pretext_a_name') throw new Error('x'); set.push(n); } } };
    P.fillPretextVars(story, { a: { value: 'v', label: 'L' }, b: { value: 'v', label: 'L' } });
    assert.deepEqual(set, ['pretext_b_name']);
    const bare = { variablesState: { $: () => set.push('never') } };
    P.fillPretextVars(bare, { a: { value: 'v' } });
    assert.ok(!set.includes('never'));
});

// ── judge injection ──────────────────────────────────────────────────────────

test('resolveJudge returns an injected module, and setJudge pins it', async () => {
    const mine = { judgeUtterance() {}, judgeAsk() {} };
    assert.equal(await P.resolveJudge(mine), mine);
    P.setJudge(mine);
    assert.equal(await P.resolveJudge(), mine);
    P.setJudge(null);
});

console.warn = realWarn;
