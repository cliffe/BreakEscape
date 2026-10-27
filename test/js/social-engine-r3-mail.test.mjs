import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-engine-r3-mail-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js',
    'systems/phish-rules.js', 'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js', 'systems/mail-scheduler.js',
    'minigames/mail-client/mail-client-minigame.js', 'minigames/mail-client/mail-reader.js',
    'minigames/mail-client/mail-data.js', 'minigames/mail-client/mail-notification.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js',
    'minigames/landing-page-builder/landing-page-model.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.warn = () => {};

const bridge = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-bridge.js')));
const { MailClientMinigame } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-client-minigame.js')));
const { MailScheduler } = await import(pathToFileURL(join(dir, 'systems/mail-scheduler.js')));

function social() {
    return {
        people: [{ id: 'hampshire', kind: 'cast', address: 'careers@ledgerwell.example', forms: { full: 'Chris Hampshire' } }],
        intelFacts: {
            hampshire_cv_backlog: { provides: [{ type: 'date', value: 'friday', label: 'Friday', kind: 'generic' }] },
            careers_attachment: { provides: [{ type: 'document', value: 'cv', label: 'my CV', kind: 'distinctive' }] }
        },
        templates: {
            from_own: { part: 'from', text: '{account_name} <{account_address}>', slots: [] },
            greet_generic: { part: 'greeting', text: 'Hello,', slots: [] },
            pretext_apply: { part: 'pretext', text: "I'm applying for the open role.", slots: [], implies: [{ type: 'document', value: 'cv' }], urgency: 'low' },
            pretext_enquiry: { part: 'pretext', text: 'I have a general enquiry.', slots: [], urgency: 'low' },
            ask_review_cv: { part: 'ask', text: 'Could you review my CV?', slots: [] }
        },
        mailClient: {
            accounts: [{ id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', kind: 'given', person: null, mailbox: 'guest', spoofsFrom: true }],
            mailboxes: [{ id: 'guest' }],
            contacts: [{ id: 'hampshire', person: 'hampshire', name: 'Chris Hampshire', addresses: ['careers@ledgerwell.example'], role: 'Careers', revealedBy: 'se_intel_hampshire_careers', targetId: 'hampshire' }],
            payloadKit: [{ id: 'kit_cv', label: 'CV.docx', kind: 'document' }],
            checklistTiming: 'onSend'
        },
        phishTargets: [{
            id: 'hampshire', address: 'careers@ledgerwell.example', character: null,
            subjects: [{ id: 's_application', text: 'Application', topic: 'recruitment' }, { id: 's_hello', text: 'Hello', topic: 'general' }],
            interests: { topics: ['recruitment'] }, emailReplyDelay: 15,
            templateSets: { from: ['from_own'], greeting: ['greet_generic'], pretext: ['pretext_apply', 'pretext_enquiry'], ask: ['ask_review_cv'] },
            primedFor: { distinctiveValues: ['cv'], minDistinct: 1, expectedAttachment: 'document', trusts: ['*'] },
            requiredFactors: ['senderTrust', 'pretextRelevant', 'attachmentPlausible'],
            advisoryFactors: ['senderAuth', 'urgencyCalibrated'],
            replies: { landed: "Thanks, I'll get to this CV before Friday." },
            outcome: { setGlobal: { phish_hampshire_landed: true } }
        }]
    };
}

function message(overrides = {}) {
    return {
        fromAccount: 'guest', to: 'careers@ledgerwell.example', targetId: 'hampshire',
        subject: 's_application', headerFrom: { account: true },
        templates: { from: 'from_own', greeting: 'greet_generic', pretext: 'pretext_apply', ask: 'ask_review_cv' },
        slots: {}, attachment: 'kit_cv', attachmentKind: 'document', link: null, linkInfo: null,
        ...overrides
    };
}

let clock = 0;
function openClient(globals = {}, timing = 'onSend', extra = {}) {
    const sc = social();
    sc.mailClient.checklistTiming = timing;
    window.gameScenario = { social: sc };
    window.gameState = { globalVariables: { phish_hampshire_attempts: 0, phish_hampshire_landed: false, ...globals } };
    const scheduler = new MailScheduler({ now: () => clock });
    scheduler.init({ scenario: window.gameScenario, saved: null });
    const host = document.getElementById('host');
    host.textContent = '';
    const scene = new MailClientMinigame(host, {
        social: sc, mailClient: sc.mailClient, accountIds: ['guest'],
        scheduler, mailState: scheduler.state, globals: window.gameState.globalVariables, ...extra
    });
    window.MinigameFramework = { currentMinigame: scene, endMinigame() {} };
    scene.init();
    scene.start();
    return { scene, scheduler, host, social: sc };
}




// Engine fixer round 3 (P3 playtests): data-only replies on a miss, the advisory line on a miss,
// and Compose pressed twice. Run with: node --test test/js/social-engine-r3-mail.test.mjs

function open(extra = {}, timing = 'onSend') {
    return openClient({ se_intel_hampshire_careers: true, se_intel_hampshire_cv_backlog: true }, timing, extra);
}

const failResult = (factors) => ({ landed: false, open: { opened: true }, openLine: 'They opened it', factors, tells: [] });
const pretextFail = { id: 'pretextRelevant', mode: 'required', pass: false, reply: 'No open invoice she can match this to, so no reason to act on it.', line: 'No open invoice she can match this to, so no reason to act on it.' };

test('P3 N4: an awareness miss gets no reply made of meter text; replies.missed is used when authored', () => {
    const aw = { awarenessEpisode: { id: 'e1' } };
    assert.equal(bridge.dataOnlyText({ id: 't' }, failResult([pretextFail]), aw), '');
    assert.equal(bridge.dataOnlyText({ id: 't', replies: { missed: 'Which invoice is this about?' } }, failResult([pretextFail]), aw),
        'Which invoice is this about?');
    // a landing is unchanged
    assert.equal(bridge.dataOnlyText({ id: 't', replies: { landed: 'Thanks Derek' } }, { landed: true, factors: [] }, aw), 'Thanks Derek');
    // the lab (no awarenessEpisode) keeps the factor's own line as the reply
    assert.equal(bridge.dataOnlyText({ id: 't' }, failResult([pretextFail]), {}), pretextFail.reply);
});

test('P3 N4: an awareness send that misses schedules no reply text and promises none', () => {
    const { scene, scheduler, social: sc } = open();
    sc.awarenessEpisode = { id: 'e2' };
    scene.openCompose();
    // pretext_enquiry carries no CV, so the send does not land
    scene._handleComposeSend(message({ templates: { from: 'from_own', greeting: 'greet_generic', pretext: 'pretext_enquiry', ask: 'ask_review_cv' }, attachment: null }));
    const jobs = scheduler.state.jobs.filter((j) => j.kind === 'text');
    assert.equal(jobs.length, 1, 'the job still runs (it reveals the checklist under withReply)');
    assert.equal(jobs[0].text, '');
    assert.equal(scene.root.querySelector('.mail-checklist-banner').textContent, 'It did not land.');
    assert.equal(scene.root.querySelector('.mail-checklist-reply'), null);
    scene.cleanup();
});

test('P3 N-5: factorStrings[id].failMissed replaces an advisory line on a miss; "" hides it; a landing keeps fail', () => {
    const adv = { id: 'urgencyCalibrated', mode: 'advisory', pass: false, line: 'The pressure is the point of this call; the debrief shows why it works.' };
    const t = (failMissed) => ({ id: 'ceo', factorStrings: { urgencyCalibrated: { fail: adv.line, ...(failMissed === undefined ? {} : { failMissed }) } } });
    const text = (panel) => [...panel.querySelectorAll('.mail-checklist-advisory')].map((p) => p.textContent);
    assert.deepEqual(text(bridge.renderChecklist(failResult([adv]), t(), {})), [`Advisory: ${adv.line}`]);
    assert.deepEqual(text(bridge.renderChecklist(failResult([adv]), t(''), {})), []);
    assert.deepEqual(text(bridge.renderChecklist(failResult([adv]), t('The pressure is the point of this call.'), {})),
        ['Advisory: The pressure is the point of this call.']);
    const landed = { ...failResult([adv]), landed: true };
    assert.deepEqual(text(bridge.renderChecklist(landed, t(''), {})), [`Advisory: ${adv.line}`]);
});

test('P3 F12: pressing Compose while the composer is open keeps it open', () => {
    const { scene, host } = open();
    host.querySelector('.mail-compose-btn').click();
    assert.equal(scene.composeOpen, true);
    host.querySelector('.mail-compose-btn').click();
    assert.equal(scene.composeOpen, true, 'a second press no longer closes the pane');
    assert.ok(scene.composer, 'the same composer is still there');
    scene.cleanup();
});

test('P3 N15: a subject with `requires` is offered only once its intel facts are held', () => {
    const run = (globals) => {
        const sc = social();
        sc.phishTargets[0].subjects = [
            { id: 's_invoice', text: 'Invoice INV-2217', topic: 'recruitment', requires: ['hampshire_cv_backlog'] },
            { id: 's_hello', text: 'Hello', topic: 'general' }
        ];
        window.gameScenario = { social: sc };
        window.gameState = { globalVariables: { phish_hampshire_attempts: 0, phish_hampshire_landed: false, ...globals } };
        const scheduler = new MailScheduler({ now: () => 0 });
        scheduler.init({ scenario: window.gameScenario, saved: null });
        const host = document.getElementById('host');
        host.textContent = '';
        const scene = new MailClientMinigame(host, { social: sc, mailClient: sc.mailClient, accountIds: ['guest'],
            scheduler, mailState: scheduler.state, globals: window.gameState.globalVariables });
        window.MinigameFramework = { currentMinigame: scene, endMinigame() {} };
        scene.init(); scene.start();
        scene.openCompose();
        const opts = [...host.querySelectorAll('.mail-compose-subject option')].map((o) => o.value);
        scene.cleanup();
        return opts;
    };
    assert.deepEqual(run({ se_intel_hampshire_careers: true }), ['s_hello']);
    assert.deepEqual(run({ se_intel_hampshire_careers: true, se_intel_hampshire_cv_backlog: true }), ['s_invoice', 's_hello']);
});
