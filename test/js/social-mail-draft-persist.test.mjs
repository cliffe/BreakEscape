// An unsent draft survives closing and reopening the mail client within a session (awareness
// m6/N3: closing the client mid-draft returns to the kiosk and must keep the draft, so the
// learner does not start the email again). The draft lives in the scheduler's shared state
// (window.mailState aliases scheduler.state), is written on every composer change and is
// restored by openCompose on the next launch. Run with: node --test test/js/social-mail-draft-persist.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'social-mail-draft-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js',
    'systems/phish-rules.js', 'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js', 'systems/mail-scheduler.js',
    'systems/mail-ink.js', 'minigames/mail-client/mail-client-minigame.js', 'minigames/mail-client/mail-reader.js',
    'minigames/mail-client/mail-data.js', 'minigames/mail-client/mail-notification.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js',
    'minigames/landing-page-builder/landing-page-model.js'
]) { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8')); }

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.warn = () => {};
console.error = () => {};

const { MailClientMinigame } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-client-minigame.js')));
const { MailScheduler } = await import(pathToFileURL(join(dir, 'systems/mail-scheduler.js')));

function social() {
    return {
        people: [{ id: 'hampshire', kind: 'cast', address: 'careers@ledgerwell.example', forms: { full: 'Chris Hampshire' } }],
        intelFacts: {},
        templates: {
            from_own: { part: 'from', text: '{account_name}', slots: [] },
            greet_generic: { part: 'greeting', text: 'Hello,', slots: [] },
            pretext_apply: { part: 'pretext', text: "I'm applying for the open role.", slots: [], urgency: 'low' },
            pretext_enquiry: { part: 'pretext', text: 'I have an enquiry.', slots: [], urgency: 'low' },
            ask_review_cv: { part: 'ask', text: 'Could you review my CV?', slots: [] }
        },
        mailClient: {
            accounts: [{ id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', kind: 'given', person: null, mailbox: 'guest', spoofsFrom: true }],
            mailboxes: [{ id: 'guest' }],
            contacts: [{ id: 'hampshire', person: 'hampshire', name: 'Chris Hampshire', addresses: ['careers@ledgerwell.example'], role: 'Careers', targetId: 'hampshire' }],
            payloadKit: [], checklistTiming: 'onSend'
        },
        phishTargets: [{
            id: 'hampshire', address: 'careers@ledgerwell.example', character: null,
            subjects: [{ id: 's_application', text: 'Application', topic: 'recruitment' }],
            templateSets: { from: ['from_own'], greeting: ['greet_generic'], pretext: ['pretext_apply', 'pretext_enquiry'], ask: ['ask_review_cv'] },
            requiredFactors: ['senderTrust'], outcome: { setGlobal: { phish_hampshire_landed: true } }
        }]
    };
}

test('an unsent draft survives closing and reopening the mail client (m6/N3)', () => {
    const sc = social();
    window.gameScenario = { social: sc };
    window.gameState = { globalVariables: {} };
    const scheduler = new MailScheduler({ now: () => 0 });
    scheduler.init({ scenario: window.gameScenario, saved: null });

    const openScene = () => {
        const host = document.getElementById('host');
        host.textContent = '';
        const scene = new MailClientMinigame(host, {
            social: sc, mailClient: sc.mailClient, accountIds: ['guest'], scheduler,
            mailState: scheduler.state, globals: window.gameState.globalVariables,
            maxSends: 1, returnTo: { sceneType: 'episode-runner' }
        });
        window.MinigameFramework = { currentMinigame: scene, endMinigame() {} };
        scene.init();
        scene.start();
        return scene;
    };

    // Open, compose, make a deliberate choice (the second pretext), then close the whole client.
    const a = openScene();
    a.openCompose();
    a.composer.chooseTemplate('pretext', 'pretext_enquiry');
    assert.equal(scheduler.state.drafts.guest.templates.pretext, 'pretext_enquiry', 'the choice is saved to the shared draft');
    a.cleanup();

    // Reopen a fresh instance against the same scheduler and open Compose: the draft comes back.
    const b = openScene();
    b.openCompose();
    assert.equal(b.composer.choice.pretext, 'pretext_enquiry', 'the pretext choice is restored, not lost');
    assert.equal(b.composer.getState().templates.pretext, 'pretext_enquiry');
    b.cleanup();
});
