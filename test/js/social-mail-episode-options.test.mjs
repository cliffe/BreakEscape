// Mail client episode options (SE phase 7, packet P7-G; 11 N6): the maxSends cap, sentIds in the close result,
// and layout: 'phone'. Run with: bundle exec node --test test/js/social-mail-episode-options.test.mjs
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

const dir = mkdtempSync(join(tmpdir(), 'social-mail-episode-'));
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



import { readFileSync as readCss } from 'node:fs';
const css = readCss(join(root, 'public/break_escape/css/mail-client-minigame.css'), 'utf8');

function open(extra = {}, timing = 'onSend') {
    return openClient({ se_intel_hampshire_careers: true, se_intel_hampshire_cv_backlog: true }, timing, extra);
}

test('with no maxSends the client has no cap: Compose stays enabled after two sends', () => {
    const { scene, host } = open();
    scene.openCompose();
    scene._handleComposeSend(message());
    scene._handleComposeSend(message());
    assert.equal(scene.sentThisSession, 2);
    assert.equal(host.querySelector('.mail-compose-btn').disabled, false);
    assert.equal(host.querySelector('.mail-cap-note').textContent, '');
    assert.equal(scene._sendCapReached(), false);
    scene.cleanup();
});

test('maxSends 1: a second Compose is refused after one send, with a line saying it has gone', () => {
    const { scene, host, scheduler } = open({ maxSends: 1 });
    scene.openCompose();
    assert.equal(scene.composeOpen, true);
    scene._handleComposeSend(message());
    assert.equal(scene.sentThisSession, 1);
    assert.equal(host.querySelector('.mail-compose-btn').disabled, true);
    assert.match(host.querySelector('.mail-cap-note').textContent, /has gone/);
    // The checklist is still up; Done closes the composer and nothing reopens it.
    host.querySelector('.mail-checklist-edit, .mail-checklist-done').click();
    assert.equal(scene.composeOpen, false);
    scene.openCompose();
    assert.equal(scene.composeOpen, false, 'openCompose is refused at the cap');
    const before = scheduler.state.mailboxes.guest.messages.filter((m) => m.folder === 'sent').length;
    scene._handleComposeSend(message());
    const after = scheduler.state.mailboxes.guest.messages.filter((m) => m.folder === 'sent').length;
    assert.equal(after, before, 'a direct send is refused too');
    assert.equal(scene.getTestState().mail.sendCapReached, true);
    scene.cleanup();
});

test('maxSends 1 with withReply timing closes the composer at once', () => {
    const { scene } = open({ maxSends: 1 }, 'withReply');
    scene.openCompose();
    scene._handleComposeSend(message());
    assert.equal(scene.composeOpen, false);
    scene.cleanup();
});

test('maxSends 2 allows a second send and refuses a third', () => {
    const { scene } = open({ maxSends: 2 });
    scene._handleComposeSend(message());
    assert.equal(scene._sendCapReached(), false);
    scene._handleComposeSend(message());
    assert.equal(scene._sendCapReached(), true);
    scene.cleanup();
});

test('Close carries on at the cap and the result has sentIds matching mailState', () => {
    const { scene, scheduler } = open({ maxSends: 1 });
    scene._handleComposeSend(message());
    const sent = scheduler.state.mailboxes.guest.messages.filter((m) => m.folder === 'sent').map((m) => m.id);
    assert.equal(sent.length, 1);
    assert.deepEqual(scene.closeResult().sentIds, sent);
    assert.deepEqual(scene.getTestState().mail.sentIds, sent);
    assert.equal(scene.closeMode, 'close');
    scene.requestClose();
    assert.deepEqual(scene.gameResult.sentIds, sent);
});

test('sentIds are oldest first, empty when nothing was sent, and ride returnParams', () => {
    const { scene } = open();
    assert.equal(scene.closeResult().sentIds, undefined, 'a plain client adds no sentIds');
    assert.equal(scene.closeMode, 'abort');
    scene._handleComposeSend(message());
    scene._handleComposeSend(message());
    assert.equal(scene.returnParams().sentIds, undefined);
    scene.cleanup();
    const ep = open({ maxSends: 5 });
    assert.deepEqual(ep.scene.closeResult().sentIds, [], 'episode mode with nothing sent: empty list');
    ep.scene._handleComposeSend(message());
    ep.scene._handleComposeSend(message());
    const sent2 = ep.scheduler.state.mailboxes.guest.messages.filter((m) => m.folder === 'sent').map((m) => m.id);
    assert.deepEqual(ep.scene.closeResult().sentIds, sent2);
    assert.deepEqual(ep.scene.returnParams().sentIds, sent2);
    ep.scene.cleanup();
    const again = open({ maxSends: 2, sentIds: sent2 });
    assert.equal(again.scene.sentThisSession, 2);
    assert.equal(again.scene._sendCapReached(), true, 'the cap survives a reopen');
    again.scene.cleanup();
});

test('layout phone adds the frame class; no layout leaves the client unchanged', () => {
    const phone = open({ layout: 'phone' });
    assert.ok(phone.host.querySelector('.mail-client.mail-client--phone'));
    assert.equal(phone.scene.getTestState().mail.layout, 'phone');
    assert.equal(phone.scene.getTestState().mail.narrow, true);
    phone.scene.cleanup();
    const plain = open();
    assert.equal(plain.host.querySelector('.mail-client--phone'), null);
    assert.equal('layout' in plain.scene.getTestState().mail, false);
    plain.scene.cleanup();
});

test('the stylesheet mirrors every narrow rule under the phone class, with no desktop-only overflow', () => {
    const blocks = [...css.matchAll(/@media \(max-width: 767px\) \{([\s\S]*?)\n\}/g)].map((m) => m[1]);
    assert.ok(blocks.length >= 2);
    const selectors = new Set();
    for (const b of blocks) for (const m of b.matchAll(/^\s*([^{}\n]+?)\s*\{/gm)) selectors.add(m[1].trim());
    const phoneCss = css.slice(css.indexOf('Phone layout (layout'));
    for (const sel of selectors) {
        for (const part of sel.split(',').map((s) => s.trim())) {
            const mapped = part === '.mail-client' ? '.mail-client.mail-client--phone'
                : part.startsWith('.mail-client ') ? part.replace('.mail-client ', '.mail-client--phone ')
                : `.mail-client--phone ${part}`;
            assert.ok(phoneCss.includes(mapped), `phone rule for ${part}`);
        }
    }
    assert.match(phoneCss, /overflow-x:\s*hidden/);
    assert.match(phoneCss, /\.mail-client--phone \* \{ max-width: 100%; \}/);
});

test('phone layout: every control is a native, tabbable element, no positive tabindex', () => {
    const { scene, host } = open({ layout: 'phone' });
    scene.openCompose();
    const controls = [...host.querySelectorAll('button, select, input, textarea, a[href], [tabindex]')];
    assert.ok(controls.length > 5);
    for (const c of controls) {
        const t = c.getAttribute('tabindex');
        assert.ok(t === null || Number(t) <= 0, `${c.className} tabindex ${t}`);
    }
    const close = host.querySelector('.se-overlay-close');
    assert.ok(close && !close.disabled, 'Close is reachable');
    scene.cleanup();
});

test('an episode child closes to its runner even with nothing sent (P1 m6/E5-11)', () => {
    // A child launched by the episode runner (returnTo set) in episode mode (maxSends) is a
    // normal close with nothing sent, so returnTo reopens the runner's write step instead of
    // aborting out to the game world. closeResult still reports an empty sentIds.
    const child = open({ maxSends: 1, returnTo: { sceneType: 'episode-runner', params: {} } });
    assert.equal(child.scene.closeMode, 'close', 'nothing sent, but an episode child returns to the step');
    assert.deepEqual(child.scene.closeResult().sentIds, []);
    child.scene._handleComposeSend(message());
    assert.equal(child.scene.closeMode, 'close', 'still a normal close after a send');
    child.scene.cleanup();

    // A returnTo on a plain (non-episode) client does not change the abort-with-nothing-sent rule.
    const plain = open({ returnTo: { sceneType: 'episode-runner', params: {} } });
    assert.equal(plain.scene.closeMode, 'abort');
    plain.scene.cleanup();

    // Episode mode but no returnTo (opened standalone): unchanged, aborts with nothing sent.
    const solo = open({ maxSends: 1 });
    assert.equal(solo.scene.closeMode, 'abort');
    solo.scene.cleanup();
});
