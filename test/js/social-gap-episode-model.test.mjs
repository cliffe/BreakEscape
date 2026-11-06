// Gap tests for minigames/episode-runner/episode-model.js: stage lists, resume from saved state,
// out-of-order completion, defendOnly variants, check missions, sent-record selection and the
// flip builders on thin or malformed data.
// Run with: bin/test-js test/js/social-gap-episode-model.test.mjs
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-episode-model-'));
// episode-model imports the landing-page model for the form-field labels, so copy the tree shape.
mkdirSync(join(dir, 'minigames/episode-runner'), { recursive: true });
mkdirSync(join(dir, 'minigames/landing-page-builder'), { recursive: true });
for (const f of ['minigames/episode-runner/episode-model.js', 'minigames/landing-page-builder/landing-page-model.js']) {
    writeFileSync(join(dir, f), readFileSync(join(js, f), 'utf8'));
}
const M = await import(pathToFileURL(join(dir, 'minigames/episode-runner/episode-model.js')).href);

const full = (over = {}) => ({ id: 'e1', stages: ['brief', 'osint', 'write', 'flip', 'defend', 'debrief'], attack: { target: 't1', accountIds: ['a'], siteIds: ['s'] }, defend: { setId: 'set1' }, ...over });

test('stagesFor with nothing usable falls back to the variant default; defaults are copies', () => {
    for (const ep of [undefined, null, {}, { stages: [] }, { stages: 'x' }, { stages: ['nope', 7, null] }]) {
        assert.deepEqual(M.stagesFor(ep), M.DEFAULT_STAGES.full);
    }
    assert.deepEqual(M.stagesFor({ variant: 'defendOnly' }), ['brief', 'defend', 'debrief']);
    const a = M.stagesFor({});
    a.push('hacked');
    assert.deepEqual(M.stagesFor({}), M.DEFAULT_STAGES.full);
});

test('stagesFor keeps authored order, drops duplicates and unknown ids, and ignores "check" unless it is the check mission', () => {
    assert.deepEqual(M.stagesFor({ stages: ['brief', 'flip', 'osint', 'osint', 'bogus', 'defend'] }), ['brief', 'flip', 'osint', 'defend']);
    assert.deepEqual(M.stagesFor({ stages: ['check', 'defend'] }), ['check']);
});

test('defendOnly strips every attack stage, and an all-attack list falls back to the defendOnly default', () => {
    assert.deepEqual(M.stagesFor({ variant: 'defendOnly', stages: ['brief', 'osint', 'build', 'write', 'mfa', 'flip', 'defend', 'debrief'] }), ['brief', 'defend', 'debrief']);
    assert.deepEqual(M.stagesFor({ variant: 'defendOnly', stages: ['osint', 'write'] }), ['brief', 'defend', 'debrief']);
});

test('an unknown variant reads as full', () => {
    assert.equal(M.variantOf({ variant: 'DEFENDONLY' }), 'full');
    assert.equal(M.variantOf(null), 'full');
});

test('nextStage: empty or garbage state starts at the first stage; all done gives null; done ids not in the list are ignored', () => {
    const ep = full();
    assert.equal(M.nextStage(ep, undefined), 'brief');
    assert.equal(M.nextStage(ep, { done: 'brief' }), 'brief');
    assert.equal(M.nextStage(ep, { done: ['brief', 'osint', 'write', 'flip', 'defend', 'debrief'] }), null);
    assert.equal(M.nextStage(ep, { done: ['mfa', 'check'] }), 'brief');
});

test('nextStage is the first NOT-done stage, even when a later one is done (out-of-order save)', () => {
    assert.equal(M.nextStage(full(), { done: ['brief', 'write'] }), 'osint');
});

test('readState: fresh from null, strings, arrays', () => {
    for (const raw of [null, undefined, 'x', 7, []]) {
        const s = M.readState(full(), raw);
        assert.equal(s.stage, 'brief');
        assert.deepEqual(s.done, []);
        assert.equal(s.sent, null);
        assert.equal(s.defend, null);
        assert.equal(s.v, 1);
    }
});

test('readState drops done ids outside this episode and de-duplicates the rest', () => {
    const s = M.readState({ variant: 'defendOnly' }, { done: ['brief', 'osint', 'brief', 'defend', 42] });
    assert.deepEqual(s.done, ['brief', 'defend']);
    assert.equal(s.stage, 'debrief');
});

test('readState sanitises sent: mail shape, call shape, junk', () => {
    const mail = M.readState(full(), { sent: { recordId: 'r', targetId: 't', templateId: 'x', blankIds: ['a', 5, '', 'b'], body: 'secret text' } }).sent;
    assert.deepEqual(mail, { recordId: 'r', targetId: 't', templateId: 'x', blankIds: ['a', 'b'] });
    assert.equal(JSON.stringify(mail).includes('secret'), false);
    assert.deepEqual(M.readState(full(), { sent: { kind: 'call', callId: 'c', outcome: 'got_it', transcript: 'say hi' } }).sent, { kind: 'call', callId: 'c', outcome: 'got_it' });
    assert.deepEqual(M.readState(full(), { sent: { kind: 'call', callId: 5, outcome: '' } }).sent, { kind: 'call', callId: null, outcome: null });
    assert.equal(M.readState(full(), { sent: 'x' }).sent, null);
    assert.equal(M.readState(full(), { sent: [] }).sent, null);
    assert.deepEqual(M.readState(full(), { sent: {} }).sent, { recordId: null, targetId: null, templateId: null, blankIds: [] });
});

test('readState sanitises defend: non-numbers and non-finite numbers become 0', () => {
    const d = M.readState(full(), { defend: { percent: '80', reportRate: NaN, verifyCount: Infinity, free: 'text' } }).defend;
    assert.deepEqual(d, { percent: 0, reportRate: 0, verifyCount: 0 });
    assert.deepEqual(M.readState(full(), { defend: { percent: 80, reportRate: 0.5, verifyCount: 2 } }).defend, { percent: 80, reportRate: 0.5, verifyCount: 2 });
    assert.equal(M.readState(full(), { defend: 5 }).defend, null);
});

test('completeStage walks the episode in order and ends at null', () => {
    const ep = full();
    let s = M.readState(ep, null);
    const seen = [];
    while (s.stage) { seen.push(s.stage); s = M.completeStage(ep, s, s.stage); }
    assert.deepEqual(seen, ['brief', 'osint', 'write', 'flip', 'defend', 'debrief']);
    assert.equal(s.stage, null);
    assert.equal(s.done.length, 6);
});

test('completeStage twice for the same stage does not duplicate it (repeated event)', () => {
    const ep = full();
    let s = M.completeStage(ep, null, 'brief');
    s = M.completeStage(ep, s, 'brief');
    assert.deepEqual(s.done, ['brief']);
    assert.equal(s.stage, 'osint');
});

test('completeStage for a stage the episode does not run changes nothing', () => {
    const s = M.completeStage(full(), null, 'mfa');
    assert.deepEqual(s.done, []);
    assert.equal(s.stage, 'brief');
    const d = M.completeStage({ variant: 'defendOnly' }, null, 'osint');
    assert.deepEqual(d.done, []);
});

test('completeStage out of order: finishing "write" first leaves the earlier stages next', () => {
    const s = M.completeStage(full(), null, 'write');
    assert.deepEqual(s.done, ['write']);
    assert.equal(s.stage, 'brief');
});

test('completeStage merges sent and defend patches through the sanitisers, and leaves them alone with no patch key', () => {
    const ep = full();
    let s = M.completeStage(ep, null, 'write', { sent: { recordId: 'r', targetId: 't1', junk: 1 } });
    assert.deepEqual(s.sent, { recordId: 'r', targetId: 't1', templateId: null, blankIds: [] });
    s = M.completeStage(ep, s, 'osint');
    assert.equal(s.sent.recordId, 'r');
    s = M.completeStage(ep, s, 'defend', { defend: { percent: 'bad' } });
    assert.deepEqual(s.defend, { percent: 0, reportRate: 0, verifyCount: 0 });
    s = M.completeStage(ep, s, 'brief', { sent: 'garbage' });
    assert.equal(s.sent, null);
});

test('completing the flip clears sent even if the same call passes a new sent patch', () => {
    const ep = full();
    const s0 = M.completeStage(ep, null, 'write', { sent: { recordId: 'r' } });
    assert.ok(s0.sent);
    assert.equal(M.completeStage(ep, s0, 'flip').sent, null);
    assert.equal(M.completeStage(ep, s0, 'flip', { sent: { recordId: 'again' } }).sent, null);
});

test('completeStage does not mutate the state passed in', () => {
    const ep = full();
    const s0 = M.readState(ep, null);
    const snap = JSON.stringify(s0);
    M.completeStage(ep, s0, 'brief', { sent: { recordId: 'r' } });
    assert.equal(JSON.stringify(s0), snap);
});

test('a check mission: stages, state and launch are the triage only', () => {
    const ep = { id: 'c1', stages: ['check'], defend: { setId: 'pre_a', stage: 'pre' }, conclusionTaskId: 'task' };
    assert.equal(M.isCheck(ep), true);
    assert.deepEqual(M.stagesFor(ep), ['check']);
    const s = M.readState(ep, null);
    assert.equal(s.stage, 'check');
    assert.equal(M.completeStage(ep, s, 'check').stage, null);
    assert.deepEqual(M.childLaunch(ep, 'check'), { kind: 'triage', options: { triageSetId: 'pre_a', conclusionTaskId: 'task', stage: 'pre' } });
    assert.equal(M.isCheck({ stages: 'check' }), false);
});

test('stateKey and defendPrefix build the global names', () => {
    assert.equal(M.stateKey('abc'), 'episode_abc_state');
    assert.equal(M.defendPrefix('abc'), 'episode_abc_defend_');
});

test('childLaunch: stages with no child give null; unknown stage gives null', () => {
    for (const st of ['brief', 'flip', 'debrief', 'nonsense', undefined]) assert.equal(M.childLaunch(full(), st), null);
});

test('childLaunch tolerates a missing attack and defend block', () => {
    assert.deepEqual(M.childLaunch({}, 'osint').params, { siteIds: [] });
    assert.deepEqual(M.childLaunch({}, 'build').params, { landingPageId: null, targetId: null });
    assert.deepEqual(M.childLaunch({}, 'write'), { kind: 'mail', sceneType: 'mail-client', params: { accountIds: [], defaultAccount: null, maxSends: 1 } });
    assert.deepEqual(M.childLaunch({}, 'defend').options, { triageSetId: null, conclusionTaskId: null });
    assert.deepEqual(M.childLaunch(null, 'mfa').params, { pushes: [], approvesAt: null, mode: 'attacker' });
});

test('childLaunch copies arrays so a launch cannot mutate the episode', () => {
    const ep = full();
    const l = M.childLaunch(ep, 'osint');
    l.params.siteIds.push('x');
    assert.deepEqual(ep.attack.siteIds, ['s']);
    const w = M.childLaunch(ep, 'write');
    w.params.accountIds.push('y');
    assert.deepEqual(ep.attack.accountIds, ['a']);
});

test('childLaunch write: callId switches to a pretext-prep call; an empty callId does not; layout only when a non-empty string', () => {
    assert.equal(M.writeKind({ attack: { callId: 'c' } }), 'call');
    assert.equal(M.writeKind({ attack: { callId: '' } }), 'mail');
    assert.equal(M.writeKind({ attack: { callId: 5 } }), 'mail');
    assert.deepEqual(M.childLaunch({ attack: { callId: 'c' } }, 'write'), { kind: 'call', sceneType: 'pretext-prep', params: { callId: 'c' } });
    assert.equal('layout' in M.childLaunch({ attack: { layout: '' } }, 'write').params, false);
    assert.equal(M.childLaunch({ attack: { layout: 'narrow' } }, 'write').params.layout, 'narrow');
});

test('childLaunch mfa: non-object pushes are dropped and the rest copied; approvesAt 0 is kept (not null)', () => {
    const ep = { mfa: { pushes: [{ n: 1 }, null, 'x', { n: 2 }], approvesAt: 0, mode: '' } };
    const l = M.childLaunch(ep, 'mfa');
    assert.deepEqual(l.params.pushes, [{ n: 1 }, { n: 2 }]);
    assert.notEqual(l.params.pushes[0], ep.mfa.pushes[0]);
    assert.equal(l.params.approvesAt, 0);
    assert.equal(l.params.mode, 'attacker');
});

test('sentFromRecord: not an object gives null; templateId prefers "pretext", else the first string template', () => {
    for (const r of [null, undefined, 'x', []]) assert.equal(M.sentFromRecord(r), null);
    assert.equal(M.sentFromRecord({ id: 'r', templates: { greeting: 'g1', pretext: 'p1' } }).templateId, 'p1');
    assert.equal(M.sentFromRecord({ id: 'r', templates: { greeting: 'g1', ask: 'a1' } }).templateId, 'g1');
    assert.equal(M.sentFromRecord({ id: 'r', templates: { pretext: '' } }).templateId, null);
    assert.equal(M.sentFromRecord({ id: 'r' }).templateId, null);
});

test('sentFromRecord: targetId from the record, else the argument, else null; blankIds are slot keys only', () => {
    assert.equal(M.sentFromRecord({ targetId: 'rt' }, 'arg').targetId, 'rt');
    assert.equal(M.sentFromRecord({}, 'arg').targetId, 'arg');
    assert.equal(M.sentFromRecord({}, 5).targetId, null);
    assert.deepEqual(M.sentFromRecord({ slots: { s1: 'typed text', s2: 'more' } }).blankIds, ['s1', 's2']);
    assert.deepEqual(M.sentFromRecord({ slots: [1, 2] }).blankIds, []); // an array is not a slot map
});

test('sentFromCall keeps ids and outcome only', () => {
    assert.deepEqual(M.sentFromCall('c', 'got_it'), { kind: 'call', callId: 'c', outcome: 'got_it' });
    assert.deepEqual(M.sentFromCall(undefined, undefined), { kind: 'call', callId: null, outcome: null });
    assert.equal(M.callOutcomeKey('c'), 'pretext_c_outcome');
});

// ── findSentRecord ───────────────────────────────────────────────────────────

const rec = (id, over = {}) => ({ id, folder: 'sent', targetId: 't1', gameTime: 10, ...over });
const ms = (...messages) => ({ mailboxes: { a: { messages } } });

test('findSentRecord: no mailState, no boxes, no sent messages -> null', () => {
    for (const m of [undefined, null, {}, { mailboxes: [] }, { mailboxes: { a: null } }, { mailboxes: { a: { messages: 'x' } } }, ms()]) {
        assert.equal(M.findSentRecord(m, 't1'), null);
    }
});

test('findSentRecord skips seeded, quickReply, inbox and other-target messages', () => {
    const m = ms(rec('seeded', { seeded: true }), rec('qr', { kind: 'quickReply' }), rec('inbox', { folder: 'inbox' }), rec('other', { targetId: 't2' }), null, 'x');
    assert.equal(M.findSentRecord(m, 't1'), null);
    assert.equal(M.findSentRecord(ms(rec('ok')), 't1').id, 'ok');
});

test('findSentRecord picks the newest by gameTime; ties go to the later one; a missing gameTime counts as 0', () => {
    assert.equal(M.findSentRecord(ms(rec('a', { gameTime: 5 }), rec('b', { gameTime: 9 }), rec('c', { gameTime: 7 })), 't1').id, 'b');
    assert.equal(M.findSentRecord(ms(rec('a', { gameTime: 5 }), rec('b', { gameTime: 5 })), 't1').id, 'b');
    assert.equal(M.findSentRecord(ms(rec('a', { gameTime: 'x' }), rec('b', { gameTime: undefined })), 't1').id, 'b');
});

test('findSentRecord with a null target takes any sent record', () => {
    assert.equal(M.findSentRecord(ms(rec('a', { targetId: 'zz' })), null).id, 'a');
});

test('findSentRecord: sentIds win (newest listed first), stale ids fall through to the newest record', () => {
    const m = ms(rec('a', { gameTime: 1 }), rec('b', { gameTime: 99 }));
    assert.equal(M.findSentRecord(m, 't1', ['a']).id, 'a');
    assert.equal(M.findSentRecord(m, 't1', ['a', 'b']).id, 'b');
    assert.equal(M.findSentRecord(m, 't1', ['ghost']).id, 'b');
    assert.equal(M.findSentRecord(m, 't1', []).id, 'b');
    assert.equal(M.findSentRecord(m, 't1', 'a').id, 'b'); // a string is not an id list
});

test('findSentRecord: a sentId for another target or a seeded record is not accepted', () => {
    const m = ms(rec('mine', { gameTime: 1 }), rec('theirs', { targetId: 't2', gameTime: 50 }), rec('seed', { seeded: true, gameTime: 60 }));
    assert.equal(M.findSentRecord(m, 't1', ['theirs', 'seed']).id, 'mine');
});

// ── flipEntry / measurementCtx / defendSummary ────────────────────────────────

test('flipEntry: the set\'s own playerSent for the target, else a bare one; no set or episode is safe', () => {
    const ep = full();
    const set = { messages: [{ id: 'x', kind: 'playerSent', targetId: 'other' }, { id: 'mine', kind: 'playerSent', targetId: 't1' }, null] };
    assert.equal(M.flipEntry(ep, set).id, 'mine');
    assert.deepEqual(M.flipEntry(ep, { messages: [] }), { id: 'episode_flip', kind: 'playerSent', targetId: 't1' });
    assert.deepEqual(M.flipEntry(null, null), { id: 'episode_flip', kind: 'playerSent', targetId: null });
    assert.equal(M.flipEntry({ attack: {} }, { messages: [{ id: 'm', kind: 'playerSent', targetId: undefined }] }).id, 'episode_flip'); // null target does not match undefined
});

test('measurementCtx: pre/post kept, anything else is "episode"; ids fall back to the defend set id', () => {
    const ep = full();
    assert.equal(M.measurementCtx(ep, { id: 's', stage: 'pre' }, null, 1).stage, 'pre');
    assert.equal(M.measurementCtx(ep, { id: 's' }, 'post', 1).stage, 'post');
    assert.equal(M.measurementCtx(ep, { id: 's', stage: 'pre' }, 'mission', 1).stage, 'episode');
    assert.equal(M.measurementCtx(ep, {}, null, 1).setId, 'set1');
    assert.equal(M.measurementCtx({}, null, null, 1).setId, null);
    assert.equal(M.measurementCtx(ep, { id: 's' }, null, 123).now, 123);
    assert.equal(M.measurementCtx({ variant: 'defendOnly' }, null).variant, 'defendOnly');
});

test('launchStage wins over the set\'s own stage', () => {
    assert.equal(M.measurementCtx(full(), { id: 's', stage: 'pre' }, 'post', 1).stage, 'post');
});

test('defendSummary of junk is all zeros; of a good result keeps the three numbers only', () => {
    assert.deepEqual(M.defendSummary(null), { percent: 0, reportRate: 0, verifyCount: 0 });
    assert.deepEqual(M.defendSummary('x'), { percent: 0, reportRate: 0, verifyCount: 0 });
    assert.deepEqual(M.defendSummary({ percent: 90, reportRate: 1, verifyCount: 3, answers: [1, 2] }), { percent: 90, reportRate: 1, verifyCount: 3 });
});

// ── flipPage ─────────────────────────────────────────────────────────────────

const buildEp = () => ({ stages: ['brief', 'osint', 'build', 'write', 'flip', 'defend'], attack: { landingPageId: 'pg' } });
const social = { landingPages: [{ id: 'pg', title: 'Default heading', domainMenu: [{ id: 'd1', domain: 'login.example' }, { id: 'd2', browserDomain: 'https://x.example/path' }], purposes: [{ id: 'p1', label: 'Reset password' }] }] };

test('flipPage is null without a build stage, a landing page id, a record or a built flag', () => {
    const g = { se_landing_pages: { pg: { built: true, choices: { domainId: 'd1' } } } };
    assert.equal(M.flipPage({ stages: ['brief', 'write', 'flip', 'defend'], attack: { landingPageId: 'pg' } }, social, g), null);
    assert.equal(M.flipPage({ stages: ['build'], attack: {} }, social, g), null);
    assert.equal(M.flipPage(buildEp(), social, {}), null);
    assert.equal(M.flipPage(buildEp(), social, null), null);
    assert.equal(M.flipPage(buildEp(), social, { se_landing_pages: { pg: { built: false, choices: { domainId: 'd1' } } } }), null);
    assert.equal(M.flipPage(buildEp(), social, { se_landing_pages: { pg: 'junk' } }), null);
});

test('flipPage: the landing_<id>_built flag stands in for rec.built, and the domain global fills a missing menu entry', () => {
    const g = { landing_pg_built: true, landing_pg_domain: 'fallback.example', se_landing_pages: { pg: { choices: {} } } };
    assert.equal(M.flipPage(buildEp(), social, g).url, 'https://fallback.example/');
    assert.equal(M.flipPage(buildEp(), social, { landing_pg_built: 'true', se_landing_pages: { pg: {} } }), null);
});

test('flipPage: a built page with no host anywhere is null, not "https:///"', () => {
    assert.equal(M.flipPage(buildEp(), social, { se_landing_pages: { pg: { built: true, choices: { domainId: 'unknown' } } } }), null);
});

test('flipPage: host with a scheme is kept as is; a bare host gets https and a trailing slash', () => {
    const g = (id) => ({ se_landing_pages: { pg: { built: true, choices: { domainId: id } } } });
    assert.equal(M.flipPage(buildEp(), social, g('d1')).url, 'https://login.example/');
    assert.equal(M.flipPage(buildEp(), social, g('d2')).url, 'https://x.example/path');
});

test('flipPage: heading and button come from the chosen purpose, else the page title and "Sign in"; fields map to labels', () => {
    const base = { built: true, choices: { domainId: 'd1', purpose: 'p1', fields: ['email', 'password', 'custom_field', '', 5], padlock: true } };
    const p = M.flipPage(buildEp(), social, { se_landing_pages: { pg: base } });
    assert.equal(p.heading, 'Reset password');
    assert.equal(p.button, 'Sign in', 'the purpose label is the heading, never the button face (P4-1)');
    assert.deepEqual(p.fields, ['Email address', 'Password', 'custom_field']);
    assert.equal(p.padlock, true);
    const q = M.flipPage(buildEp(), social, { se_landing_pages: { pg: { built: true, choices: { domainId: 'd1', purpose: 'zzz', padlock: 'yes' } } } });
    assert.equal(q.heading, 'Default heading');
    assert.equal(q.button, 'Sign in');
    assert.equal(q.padlock, false);
    assert.deepEqual(q.fields, []);
});

test('flipPage tells: rec.tells wins over tellsFound, duplicates and non-strings are removed', () => {
    const g = (rec) => ({ se_landing_pages: { pg: { built: true, choices: { domainId: 'd1' }, ...rec } } });
    assert.deepEqual(M.flipPage(buildEp(), social, g({ tells: ['domain', 'domain', 5, 'formOrigin'], tellsFound: ['x'] })).tells, ['domain', 'formOrigin']);
    assert.deepEqual(M.flipPage(buildEp(), social, g({ tellsFound: ['x'] })).tells, ['x']);
    assert.deepEqual(M.flipPage(buildEp(), social, g({})).tells, []);
});

test('flipPage with no social block at all still returns a page when the domain global exists', () => {
    const g = { landing_pg_domain: 'only.example', se_landing_pages: { pg: { built: true } } };
    const p = M.flipPage(buildEp(), undefined, g);
    assert.equal(p.url, 'https://only.example/');
    assert.equal(p.heading, '');
});

// ── flipCall ─────────────────────────────────────────────────────────────────

const callSocial = {
    pretextNpcs: [{
        callId: 'c', defenderNotes: { a: 'Check the callback number', b: '', c: 5 },
        lines: { l1: { text: 'Hi, I am {who} from {team}.', blanks: { team: 'dept' } }, l2: { text: 'Nothing to fill' } },
    }],
};

test('flipCall is null unless the held call landed', () => {
    for (const sent of [null, undefined, 'x', { kind: 'mail' }, { kind: 'call', callId: 'c', outcome: 'reported' }, { kind: 'call', callId: 'c', outcome: null }]) {
        assert.equal(M.flipCall({}, callSocial, sent, {}), null);
    }
});

test('flipCall: a landed call with no session log still shows the notes and a plain caller', () => {
    const r = M.flipCall({}, callSocial, { kind: 'call', callId: 'c', outcome: 'got_it' }, {});
    assert.equal(r.callerId, 'Caller');
    assert.deepEqual(r.claims, []);
    assert.deepEqual(r.transcript, []);
    assert.deepEqual(r.notes, ['Check the callback number']);
});

test('flipCall: unknown callId has no notes; no social block does not throw', () => {
    const r = M.flipCall({}, undefined, { kind: 'call', callId: 'zz', outcome: 'got_it' });
    assert.deepEqual(r.notes, []);
    assert.equal(r.outcome, 'got_it');
});

test('flipCall fills blanks from the learner\'s labels, falls back to value, then leaves the {placeholder}', () => {
    const globals = {
        pretext_c_state: {
            blanks: { who: { label: 'Dana from IT' }, dept: { value: 'Payroll' } },
            log: [{ id: 'l1', kind: 'say' }, { id: 'l2', kind: 'say' }, { id: 'ask_for_PASSWORD', kind: 'ask' }, { id: 'missing', kind: 'say' }, null, { kind: 'say' }, { id: 5, kind: 'say' }],
        },
    };
    const r = M.flipCall({}, callSocial, { kind: 'call', callId: 'c', outcome: 'got_it' }, globals);
    assert.equal(r.transcript[0].text, 'Hi, I am Dana from IT from Payroll.');
    assert.equal(r.transcript[1].text, 'Nothing to fill');
    assert.match(r.transcript[2].text, /^Asks for: .*\.$/);
    assert.equal(r.transcript.length, 3);
    assert.equal(r.callerId, 'Says they are Dana from IT');
    const missing = M.flipCall({}, callSocial, { kind: 'call', callId: 'c', outcome: 'got_it' }, { pretext_c_state: { blanks: {}, log: [{ id: 'l1', kind: 'say' }] } });
    assert.equal(missing.transcript[0].text, 'Hi, I am {who} from {team}.');
});

test('flipCall: a blank that is neither label nor value is not a claim; a blank object with a non-string label uses value', () => {
    const globals = { pretext_c_state: { blanks: { who: { label: 5, value: 'Sam' }, x: { label: '' }, y: 'str', z: null } } };
    const r = M.flipCall({}, callSocial, { kind: 'call', callId: 'c', outcome: 'got_it' }, globals);
    assert.deepEqual(r.claims, [{ fact: 'who', value: 'Sam' }]);
});
