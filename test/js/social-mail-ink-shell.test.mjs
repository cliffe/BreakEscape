// Ink-driven plain email in the mail client shell: suggested-reply chips under an open message,
// the composer a chip opens, composeTo, and the judged door on a contact that is also a target.
// The real shell and composer run in jsdom; the runner side is covered by social-mail-ink-runner.test.mjs.
// Run with: bundle exec node --test test/js/social-mail-ink-shell.test.mjs
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

const dir = mkdtempSync(join(tmpdir(), 'social-mail-ink-shell-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/phish-rules.js', 'systems/mail-ink.js',
    'minigames/mail-client/mail-client-minigame.js', 'minigames/mail-client/mail-reader.js',
    'minigames/mail-client/mail-data.js', 'minigames/mail-client/mail-notification.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js',
    'minigames/landing-page-builder/landing-page-model.js', 'systems/global-writer.js',
    'systems/social-influence.js', 'ui/influence-bar.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.warn = () => {};
console.error = () => {};

const { MailClientMinigame } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-client-minigame.js')));
const data = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-data.js')));

const config = () => ({
    accounts: [{ id: 'agent', address: 'agent@safetynet.example', displayName: 'Agent 0x00', kind: 'given', mailbox: 'agent', spoofsFrom: false }],
    mailboxes: [{ id: 'agent' }],
    contacts: [
        { id: 'hax', name: 'Agent HaX', addresses: ['hax@safetynet.example'], npc: 'hax_mail' },
        { id: 'ines', name: 'Dr Ines Varga', addresses: ['i.varga@institute.example'], npc: 'ines_mail', targetId: 'ines', judgedWhen: 'door' },
        { id: 'pierce', name: 'Pierce', addresses: ['p@corp.example'], targetId: 'pierce' }
    ],
    seededMessages: [],
    payloadKit: []
});
const social = () => ({ people: [], templates: {}, phishTargets: [
    { id: 'ines', address: 'i.varga@institute.example', templateSets: {}, subjects: [] },
    { id: 'pierce', address: 'p@corp.example', templateSets: {}, subjects: [] }
] });

function open(globals = {}, mailState = data.emptyMailState()) {
    const host = document.getElementById('host');
    host.textContent = '';
    window.gameState = { globalVariables: globals };
    const scene = new MailClientMinigame(host, { mailClient: config(), social: social(), mailState, accountIds: ['agent'], globals, scheduler: null });
    window.MinigameFramework = { currentMinigame: scene, endMinigame() { scene.cleanup(); } };
    scene.init();
    scene.start();
    return { scene, host, mailState };
}

function threadMail(mailState, npc, expects) {
    const box = data.ensureMailbox(mailState, 'agent');
    box.messages.push({ id: `m_${npc}`, thread: `npc:${npc}:agent`, folder: 'inbox', from: { name: npc, address: `${npc}@x.example` },
        to: 'agent@safetynet.example', subject: `Hello from ${npc}`, body: 'Text.', read: false, gameTime: 1, time: '09:00' });
    mailState.threads[`npc:${npc}:agent`] = { expects, position: '{}' };
    data.recountUnread(mailState, 'agent');
}

test('an ink thread shows its pending choices as suggested-reply chips under the newest email', () => {
    const state = data.emptyMailState();
    threadMail(state, 'hax_mail', { mode: 'choices', options: ['Nothing yet.', 'Log attached.'] });
    const { scene, host } = open({}, state);
    host.querySelector('.mail-row[data-id="m_hax_mail"]').click();
    const chips = [...host.querySelectorAll('.mail-suggest-chip')];
    assert.deepEqual(chips.map((c) => c.textContent), ['Nothing yet.', 'Log attached.']);
    assert.equal(host.querySelector('.mail-ink-own'), null, 'HaX is not a target: no judged door');
    assert.equal(host.querySelector('.mail-followup-option'), null, 'the old "Choose a reply" list is not used for ink threads');
    scene.cleanup();
});

test('a waiting thread shows the waiting line only while its reply job is queued', () => {
    const state = data.emptyMailState();
    threadMail(state, 'hax_mail', { mode: 'waiting' });
    const a = open({}, state);
    a.host.querySelector('.mail-row[data-id="m_hax_mail"]').click();
    assert.equal(a.host.querySelector('.mail-ink-waiting'), null, 'no job queued: the saved "waiting" is stale');
    a.scene.cleanup();
    state.jobs.push({ jobId: 'j1', kind: 'ink', plain: true, thread: 'npc:hax_mail:agent' });
    const b = open({}, state);
    b.host.querySelector('.mail-row[data-id="m_hax_mail"]').click();
    assert.ok(b.host.querySelector('.mail-ink-waiting'));
    b.scene.cleanup();
});

test('a contact that is also a target adds "Write your own message" only once judgedWhen is true', () => {
    const closed = data.emptyMailState();
    threadMail(closed, 'ines_mail', { mode: 'choices', options: ['Happy to.'] });
    const a = open({ door: false }, closed);
    a.host.querySelector('.mail-row[data-id="m_ines_mail"]').click();
    assert.ok(a.host.querySelector('.mail-suggest-chip'));
    assert.equal(a.host.querySelector('.mail-ink-own'), null);
    a.scene.cleanup();
    const opened = data.emptyMailState();
    threadMail(opened, 'ines_mail', { mode: 'choices', options: ['Happy to.'] });
    const b = open({ door: true }, opened);
    b.host.querySelector('.mail-row[data-id="m_ines_mail"]').click();
    const own = b.host.querySelector('.mail-ink-own');
    assert.ok(own);
    own.click();
    assert.equal(b.scene.composer.contactId, 'ines', 'the judged composer is addressed to the contact, not the first contact with no character');
    assert.equal(b.scene.composer.target.id, 'ines');
    b.scene.cleanup();
});

test('a chip opens the composer on its own contact even when an unsent draft names another', () => {
    const state = data.emptyMailState();
    threadMail(state, 'ines_mail', { mode: 'choices', options: ['Happy to.'] });
    state.drafts.agent = { contactId: 'pierce', to: 'p@corp.example', targetId: 'pierce' };
    const { scene, host } = open({ door: false }, state);
    host.querySelector('.mail-row[data-id="m_ines_mail"]').click();
    host.querySelector('.mail-suggest-chip').click();
    assert.ok(scene.composeOpen);
    assert.equal(scene.composer.contactId, 'ines');
    assert.equal(state.drafts.agent.contactId, 'pierce', 'opening the plain form leaves the saved judged draft alone');
    scene.cleanup();
});

test('composeTo opens Compose on that contact (by id or by npc)', () => {
    const host = document.getElementById('host');
    host.textContent = '';
    const globals = {};
    window.gameState = { globalVariables: globals };
    const scene = new MailClientMinigame(host, { mailClient: config(), social: social(), mailState: data.emptyMailState(), accountIds: ['agent'], globals, composeTo: 'ines_mail' });
    window.MinigameFramework = { currentMinigame: scene, endMinigame() { scene.cleanup(); } };
    scene.init();
    scene.start();
    assert.ok(scene.composeOpen);
    assert.equal(scene.composer.contactId, 'ines');
    scene.cleanup();
});
