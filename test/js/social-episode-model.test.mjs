// Awareness episode model (SE design 11 N1; PHASE7_PACKETS §2.1 to §2.3, packet P7-A).
// Pure functions: stage lists per variant, the state global, resume, child launches.
// Run with: bundle exec node --test test/js/social-episode-model.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const M = await import(pathToFileURL(join(here, '../../public/break_escape/js/minigames/episode-runner/episode-model.js')).href);

const full = () => ({
    id: 'e1_fixture', variant: 'full', conclusionTaskId: 'finish_episode',
    stages: ['brief', 'osint', 'write', 'flip', 'defend', 'debrief'],
    attack: { target: 'supplier_contact', siteIds: ['site_a', 'site_b'], accountIds: ['analyst'],
              defaultAccount: 'analyst', maxMessages: 1, scored: false },
    defend: { setId: 'fixture_inbox', stage: null }
});
const defendOnly = () => ({ ...full(), id: 'e1_fixture_defend', variant: 'defendOnly' });
const check = () => ({ id: 'pre_fixture', variant: 'full', stages: ['check'], conclusionTaskId: 'finish_check',
    defend: { setId: 'form_a', stage: 'pre' } });

test('derived names', () => {
    assert.equal(M.stateKey('e1_fixture'), 'episode_e1_fixture_state');
    assert.equal(M.defendPrefix('e1_fixture'), 'episode_e1_fixture_defend_');
    assert.equal(M.defendPrefix('e1_fixture_defend'), 'episode_e1_fixture_defend_defend_');
});

test('stage order for the three variants', () => {
    assert.deepEqual(M.stagesFor(full()), ['brief', 'osint', 'write', 'flip', 'defend', 'debrief']);
    assert.deepEqual(M.stagesFor(defendOnly()), ['brief', 'defend', 'debrief']);
    assert.deepEqual(M.stagesFor(check()), ['check']);
    // defendOnly drops attack stages even when authored; unknown and repeated ids are dropped
    assert.deepEqual(M.stagesFor({ variant: 'defendOnly', stages: ['brief', 'osint', 'write', 'flip', 'defend', 'debrief'] }),
        ['brief', 'defend', 'debrief']);
    assert.deepEqual(M.stagesFor({ variant: 'full', stages: ['brief', 'nope', 'brief', 'defend'] }), ['brief', 'defend']);
    // no list: the variant's default
    assert.deepEqual(M.stagesFor({ variant: 'full' }), [...M.DEFAULT_STAGES.full]);
    assert.deepEqual(M.stagesFor({ variant: 'defendOnly' }), [...M.DEFAULT_STAGES.defendOnly]);
});

test('walking every stage in order, then finished', () => {
    for (const ep of [full(), defendOnly(), check()]) {
        let s = M.readState(ep, {});
        const seen = [];
        while (s.stage) {
            seen.push(s.stage);
            s = M.completeStage(ep, s, s.stage);
        }
        assert.deepEqual(seen, M.stagesFor(ep));
        assert.equal(M.nextStage(ep, s), null);
        assert.deepEqual(s.done, M.stagesFor(ep));
    }
});

test('readState resumes at the stored stage and drops what this episode does not run', () => {
    const ep = full();
    const s = M.readState(ep, { v: 1, done: ['brief', 'osint', 'bogus'], stage: 'osint' });
    assert.equal(s.stage, 'write');
    assert.deepEqual(s.done, ['brief', 'osint']);
    // a full episode's progress read under its defendOnly twin keeps only the shared stages
    const d = M.readState(defendOnly(), { done: ['brief', 'osint', 'write'] });
    assert.deepEqual(d.done, ['brief']);
    assert.equal(d.stage, 'defend');
    assert.equal(d.variant, 'defendOnly');
    // missing, null or an array: a fresh state
    for (const raw of [undefined, null, [], 'x']) assert.equal(M.readState(ep, raw).stage, 'brief');
});

test('sent is held by write and cleared by the flip', () => {
    const ep = full();
    let s = M.readState(ep, { done: ['brief', 'osint'] });
    const sent = M.sentFromRecord({ id: 'sent_1', targetId: 'supplier_contact', templates: { opening: 'tpl_invoice' },
        slots: { blank_supplier: 'Harlow', blank_ref: 'INV-1' }, body: 'free text never kept' });
    assert.deepEqual(sent, { recordId: 'sent_1', targetId: 'supplier_contact', templateId: 'tpl_invoice',
        blankIds: ['blank_supplier', 'blank_ref'] });
    // the pretext is the template held when the record has one (P7-I)
    assert.equal(M.sentFromRecord({ id: 'sent_2', templates: { from: 'from_own', pretext: 'pretext_invoice' } }).templateId,
        'pretext_invoice');
    s = M.completeStage(ep, s, 'write', { sent });
    assert.equal(s.stage, 'flip');
    assert.equal(s.sent.recordId, 'sent_1');
    assert.ok(!JSON.stringify(s).includes('free text'), 'no message text in the state');
    s = M.completeStage(ep, s, 'flip');
    assert.equal(s.sent, null);
    assert.equal(s.stage, 'defend');
});

test('the defend summary keeps numbers only', () => {
    const ep = full();
    const s = M.completeStage(ep, M.readState(ep, { done: ['brief', 'osint', 'write', 'flip'] }), 'defend',
        { defend: M.defendSummary({ percent: 80, reportRate: 0.5, verifyCount: 1, answers: [{ id: 'x' }] }) });
    assert.deepEqual(s.defend, { percent: 80, reportRate: 0.5, verifyCount: 1 });
    assert.equal(s.stage, 'debrief');
    assert.ok(JSON.stringify(s).length < 1024);
});

test('child launches carry the episode\'s own ids', () => {
    const ep = full();
    assert.deepEqual(M.childLaunch(ep, 'osint'), { kind: 'osint', sceneType: 'osint-browser', params: { siteIds: ['site_a', 'site_b'] } });
    assert.deepEqual(M.childLaunch(ep, 'write'), { kind: 'mail', sceneType: 'mail-client',
        params: { accountIds: ['analyst'], defaultAccount: 'analyst', maxSends: 1 } });
    assert.deepEqual(M.childLaunch({ ...ep, attack: { ...ep.attack, layout: 'phone' } }, 'write').params.layout, 'phone');
    assert.deepEqual(M.childLaunch(ep, 'defend'), { kind: 'triage', options: { triageSetId: 'fixture_inbox', conclusionTaskId: 'finish_episode' } });
    assert.deepEqual(M.childLaunch(check(), 'check'), { kind: 'triage',
        options: { triageSetId: 'form_a', conclusionTaskId: 'finish_check', stage: 'pre' } });
    for (const s of ['brief', 'flip', 'debrief']) assert.equal(M.childLaunch(ep, s), null);
});

test('findSentRecord prefers sentIds, else the newest sent record to the target', () => {
    const mailState = { mailboxes: { analyst: { messages: [
        { id: 'in_1', folder: 'inbox', targetId: 'supplier_contact' },
        { id: 's_old', folder: 'sent', targetId: 'supplier_contact', gameTime: 10 },
        { id: 's_new', folder: 'sent', targetId: 'supplier_contact', gameTime: 20 },
        { id: 's_other', folder: 'sent', targetId: 'someone_else', gameTime: 30 },
        { id: 's_seed', folder: 'sent', targetId: 'supplier_contact', gameTime: 40, seeded: true },
        { id: 's_qr', folder: 'sent', targetId: 'supplier_contact', gameTime: 50, kind: 'quickReply' }
    ] } } };
    assert.equal(M.findSentRecord(mailState, 'supplier_contact').id, 's_new');
    assert.equal(M.findSentRecord(mailState, 'supplier_contact', ['s_old']).id, 's_old');
    assert.equal(M.findSentRecord(mailState, 'supplier_contact', ['s_other']).id, 's_new');
    assert.equal(M.findSentRecord({}, 'supplier_contact'), null);
    assert.equal(M.sentFromRecord(null), null);
});

test('flipEntry and measurementCtx', () => {
    const ep = full();
    const own = { id: 'ps', kind: 'playerSent', targetId: 'supplier_contact', fromMailbox: 'analyst' };
    assert.equal(M.flipEntry(ep, { messages: [{ id: 'a' }, own] }), own);
    assert.deepEqual(M.flipEntry(ep, null), { id: 'episode_flip', kind: 'playerSent', targetId: 'supplier_contact' });
    assert.deepEqual(M.measurementCtx(ep, { id: 'fixture_inbox' }, null, 5),
        { setId: 'fixture_inbox', form: 'fixture_inbox', stage: 'episode', episodeId: 'e1_fixture', variant: 'full', now: 5 });
    assert.equal(M.measurementCtx(check(), { id: 'form_a' }, 'pre', 5).stage, 'pre');
    assert.equal(M.measurementCtx(defendOnly(), { id: 'fixture_inbox' }, null, 5).variant, 'defendOnly');
});

// ── P7-P: build, the pretext call, mfa ─────────────────────────────────────────

const e5 = () => ({ ...full(), id: 'e5_fixture', stages: ['brief', 'osint', 'build', 'write', 'flip', 'defend', 'debrief'],
    attack: { ...full().attack, target: 'sso_staff', landingPageId: 'sso_login' } });
const e3 = () => ({ ...full(), id: 'e3_fixture', stages: ['brief', 'osint', 'write', 'mfa', 'flip', 'defend', 'debrief'],
    attack: { callId: 'helpdesk_call', siteIds: ['site_a'], scored: false },
    mfa: { pushes: [{ at: '06:31', app: 'SSO' }, { at: '06:38', app: 'SSO' }], approvesAt: '06:50', mode: 'attacker' } });

test('build and mfa are stage ids; defendOnly drops them with the other attack stages', () => {
    assert.ok(M.STAGE_IDS.includes('build') && M.STAGE_IDS.includes('mfa'));
    assert.deepEqual(M.stagesFor(e5()), ['brief', 'osint', 'build', 'write', 'flip', 'defend', 'debrief']);
    assert.deepEqual(M.stagesFor(e3()), ['brief', 'osint', 'write', 'mfa', 'flip', 'defend', 'debrief']);
    assert.deepEqual(M.stagesFor({ ...e3(), variant: 'defendOnly' }), ['brief', 'defend', 'debrief']);
});

test('childLaunch: build opens the builder, write opens a call when attack.callId is set, mfa the authenticator', () => {
    assert.deepEqual(M.childLaunch(e5(), 'build'), { kind: 'build', sceneType: 'landing-page-builder',
        params: { landingPageId: 'sso_login', targetId: 'sso_staff' } });
    assert.equal(M.writeKind(e5()), 'mail');
    assert.equal(M.childLaunch(e5(), 'write').kind, 'mail');
    assert.equal(M.writeKind(e3()), 'call');
    assert.deepEqual(M.childLaunch(e3(), 'write'), { kind: 'call', sceneType: 'pretext-prep', params: { callId: 'helpdesk_call' } });
    const mfa = M.childLaunch(e3(), 'mfa');
    assert.deepEqual(mfa, { kind: 'mfa', sceneType: 'authenticator', params: e3().mfa });
    // reads episode.mfa only: an attack.pushStream (P7-Q's draft name) is ignored
    const old = { ...e3(), mfa: undefined, attack: { ...e3().attack, pushStream: e3().mfa } };
    assert.deepEqual(M.childLaunch(old, 'mfa').params, { pushes: [], approvesAt: null, mode: 'attacker' });
});

test('a held call keeps its kind, id and outcome; the flip clears it', () => {
    const ep = e3();
    const s = M.completeStage(ep, { done: ['brief', 'osint'] }, 'write', { sent: M.sentFromCall('helpdesk_call', 'got_it') });
    assert.deepEqual(s.sent, { kind: 'call', callId: 'helpdesk_call', outcome: 'got_it' });
    assert.equal(s.stage, 'mfa');
    assert.deepEqual(M.readState(ep, s).sent, s.sent, 'survives a reread');
    const after = M.completeStage(ep, M.completeStage(ep, s, 'mfa'), 'flip');
    assert.equal(after.sent, null);
    assert.equal(M.callOutcomeKey('helpdesk_call'), 'pretext_helpdesk_call_outcome');
});

test('flipPage: only for an episode with a build stage and a built record', () => {
    const social = { landingPages: [{ id: 'sso_login', domainMenu: [{ id: 'd1', domain: 'look-alike.example', browserDomain: 'look-alike.example/sso' }],
        purposes: [{ id: 'p1', label: 'Confirm your account' }] }] };
    const rec = { built: true, tellsFound: ['domain', 'formOrigin', 'domain'], choices: { domainId: 'd1', purpose: 'p1', fields: ['email', 'one_time_code'], padlock: false } };
    assert.deepEqual(M.flipPage(e5(), social, { se_landing_pages: { sso_login: rec } }), {
        url: 'https://look-alike.example/sso/', padlock: false, heading: 'Confirm your account',
        fields: ['Email address', 'One-time code'], button: 'Confirm your account', tells: ['domain', 'formOrigin']
    });
    assert.equal(M.flipPage(e5(), social, { se_landing_pages: { sso_login: { ...rec, built: false } } }), null);
    assert.equal(M.flipPage(full(), social, { se_landing_pages: { sso_login: rec } }), null, 'no build stage');
    assert.equal(M.flipPage(e5(), social, {}), null);
});

test('flipPage: resolves a brand-nested domain by id, not the id-valued domain global (E5-3)', () => {
    // Domains sit under brands[], as the builder authors them; the chosen option id is "d_word".
    const social = { landingPages: [{ id: 'sso_login',
        brands: [{ id: 'quayholt', domains: [
            { id: 'd_letter', domain: 'quaybolt.example' },
            { id: 'd_word', domain: 'quayholt-sso.example' }
        ] }],
        purposes: [{ id: 'p1', label: 'Sign in again' }] }] };
    const rec = { built: true, tells: ['domain'], choices: { brand: 'quayholt', domainId: 'd_word', purpose: 'p1', fields: ['email'], padlock: true } };
    // landing_sso_login_domain holds the option id "d_word" (what the builder writes), which must
    // not reach the address bar.
    const page = M.flipPage(e5(), social, { se_landing_pages: { sso_login: rec }, landing_sso_login_domain: 'd_word' });
    assert.equal(page.url, 'https://quayholt-sso.example/', 'the real look-alike domain, not the id');
    assert.ok(!/d_word/.test(page.url));
});
