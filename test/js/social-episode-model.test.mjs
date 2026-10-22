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
