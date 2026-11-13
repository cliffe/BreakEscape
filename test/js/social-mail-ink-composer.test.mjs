// Ink-driven plain email in the composer: suggested-reply chips, the filled message, Send,
// and a contact that is both an ink correspondent and a phishing target. The real composer
// runs in jsdom with a stub host (the runner side is covered by social-mail-ink-runner.test.mjs).
// Run with: bundle exec node --test test/js/social-mail-ink-composer.test.mjs
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

const dir = mkdtempSync(join(tmpdir(), 'social-mail-ink-composer-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['systems/phish-rules.js', 'systems/mail-ink.js', 'minigames/mail-client/mail-composer.js',
    'minigames/mail-client/mail-bridge.js', 'minigames/mail-client/mail-data.js', 'systems/global-writer.js',
    'minigames/landing-page-builder/landing-page-model.js', 'utils/display-dashes.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.error = () => {};

const { MailComposer } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-composer.js')));
const ink = await import(pathToFileURL(join(dir, 'systems/mail-ink.js')));

const host = () => { const h = document.getElementById('host'); h.textContent = ''; return h; };
const tick = () => new Promise((r) => setTimeout(r, 0));
const ACCOUNT = { id: 'agent', address: 'agent@safetynet.example', displayName: 'Agent 0x00', spoofsFrom: false, person: null, mailbox: 'agent' };
const HAX = { id: 'hax', name: 'Agent HaX', addresses: ['hax@safetynet.example'], npc: 'hax_mail' };
const PIERCE = { id: 'pierce', name: 'Melanie Pierce', addresses: ['m.pierce@corp.example'], targetId: 'pierce' };
const BOTH = { id: 'ines', name: 'Dr Ines Varga', addresses: ['i.varga@inst.example'], npc: 'ines_mail', targetId: 'ines', judgedWhen: 'phish_open' };

function makeHost({ options = ['Nothing yet, still looking.', 'Log attached.'], state = 'choices' } = {}) {
    const calls = { prepare: [], plan: [], send: [] };
    const api = {
        labels: ink.plainLabels({}),
        prepare: async (c) => { calls.prepare.push(c.id); return { state, options }; },
        plan: async (c, i) => { calls.plan.push([c.id, i]); return { ok: true, chip: options[i], body: `${options[i]}\n\nMore of my message.`, subject: 'Re: Jump server', attachments: [{ kitId: 'k', kind: 'document', label: 'jump-auth.log' }] }; },
        send: async (c, i, inReplyTo) => { calls.send.push([c.id, i, inReplyTo]); return { ok: true, sentId: 'sent_1' }; }
    };
    return { calls, api };
}

function composer({ contacts, h, globals = {}, extra = {} }) {
    const sent = [];
    const c = new MailComposer(host(), {
        templates: {}, phishTargets: [], people: [], intelFacts: {}, payloadKit: [],
        account: ACCOUNT, accounts: [ACCOUNT], contacts, globals,
        inkMode: (contact) => ink.contactMode(contact, globals), ink: h.api,
        onInkSent: (res, contact) => sent.push([res.sentId, contact.id]),
        onSend: () => {}, onChange: () => {}, onClose: () => {}, ...extra
    });
    return { c, sent };
}

test('an ink contact shows suggested replies, no judged chrome', async () => {
    const h = makeHost();
    const { c } = composer({ contacts: [HAX], h });
    await tick();
    const chips = [...c.root.querySelectorAll('.mail-suggest-chip')];
    assert.deepEqual(chips.map((x) => x.textContent), ['Nothing yet, still looking.', 'Log attached.']);
    assert.equal(c.root.querySelector('.mail-redflag-meter'), null);
    assert.ok(!/judged|red flag/i.test(c.root.textContent), 'no judged or red-flag wording in plain mode');
    assert.equal(c.root.querySelector('.mail-compose-sendas'), null, 'no Send-as switch: the thread is on one account');
    assert.deepEqual(h.calls.prepare, ['hax']);
    c.destroy();
});

test('picking a chip fills the whole message; Send hands it to the host', async () => {
    const h = makeHost();
    const { c, sent } = composer({ contacts: [HAX], h, extra: { inReplyTo: 'reply_9' } });
    await tick();
    c.root.querySelector('.mail-suggest-chip[data-choice="1"]').click();
    await tick();
    assert.equal(c.root.querySelector('.mail-ink-subject').textContent, 'Re: Jump server');
    assert.match(c.root.querySelector('.mail-ink-body').textContent, /^Log attached\.\n\nMore of my message\./);
    assert.equal(c.root.querySelector('.mail-ink-attachment').textContent, 'jump-auth.log');
    assert.deepEqual(h.calls.plan, [['hax', 1]]);
    c.root.querySelector('.mail-ink-send').click();
    await tick();
    assert.deepEqual(h.calls.send, [['hax', 1, 'reply_9']]);
    assert.deepEqual(sent, [['sent_1', 'hax']]);
    c.destroy();
});

test('inkChoice opens with a chip already picked (a chip clicked under an open message)', async () => {
    const h = makeHost();
    const { c } = composer({ contacts: [HAX], h, extra: { presetContactId: 'hax', inkChoice: 0 } });
    await tick(); await tick();
    assert.ok(c.root.querySelector('.mail-ink-body'));
    assert.equal(c.root.querySelector('.mail-suggest-chip'), null);
    c.root.querySelector('.mail-ink-another').click();
    assert.ok(c.root.querySelector('.mail-suggest-chip'), 'Choose another reply returns to the list');
    c.destroy();
});

test('waiting and nothing-to-say states', async () => {
    const w = composer({ contacts: [HAX], h: makeHost({ state: 'waiting', options: [] }) });
    await tick();
    assert.match(w.c.root.textContent, /Waiting for a reply/);
    w.c.destroy();
    const n = composer({ contacts: [HAX], h: makeHost({ state: 'none', options: [] }) });
    await tick();
    assert.match(n.c.root.textContent, /Nothing to write to them about yet/);
    n.c.destroy();
});

test('a scenario can relabel the plain composer words', async () => {
    const h = makeHost();
    h.api.labels = ink.plainLabels({ labels: { suggestedReplies: 'Quick replies', nothing: 'Nothing to say.' } });
    const { c } = composer({ contacts: [HAX], h });
    await tick();
    assert.equal(c.root.querySelector('.mail-followup-label').textContent, 'Quick replies');
    c.destroy();
});

test('a failed plan shows a line and keeps the list', async () => {
    const h = makeHost();
    h.api.plan = async () => ({ ok: false, reason: 'forward-missing' });
    const { c } = composer({ contacts: [HAX], h });
    await tick();
    c.root.querySelector('.mail-suggest-chip').click();
    await tick();
    assert.match(c.root.querySelector('.mail-ink-error').textContent, /not in this inbox/);
    assert.ok(c.root.querySelector('.mail-suggest-chip'));
    c.destroy();
});

test('a judged-only contact is untouched: the judged form, no suggestions, the host is never asked', async () => {
    const h = makeHost();
    const { c } = composer({ contacts: [PIERCE], h });
    await tick();
    assert.equal(c.root.querySelector('.mail-suggest-chip'), null);
    assert.deepEqual(h.calls.prepare, []);
    assert.ok(c.root.querySelector('.mail-compose-sendas'), 'Send-as is still there');
    assert.ok(c.target === null, 'no phishTargets registered in this stub, but the judged path ran');
    c.destroy();
});

test('a contact that is both: suggestions first, "Write your own" opens the judged form, and back', async () => {
    const h = makeHost();
    const globals = { phish_open: true };
    const { c } = composer({ contacts: [BOTH], h, globals, extra: { phishTargets: [{ id: 'ines', character: 'ines', address: 'i.varga@inst.example', templateSets: {}, subjects: [] }] } });
    await tick();
    assert.ok(c.root.querySelector('.mail-suggest-chip'));
    const own = c.root.querySelector('.mail-ink-own');
    assert.ok(own, 'the judged door is open (judgedWhen is true)');
    own.click();
    assert.equal(c.root.querySelector('.mail-suggest-chip'), null);
    assert.ok(c.root.querySelector('.mail-ink-suggestions'), 'a way back to the suggestions');
    c.root.querySelector('.mail-ink-suggestions').click();
    await tick();
    assert.ok(c.root.querySelector('.mail-suggest-chip'));
    c.destroy();
});

test('a contact that is both with the judged door still closed has no "Write your own"', async () => {
    const h = makeHost();
    const { c } = composer({ contacts: [BOTH], h, globals: { phish_open: false } });
    await tick();
    assert.ok(c.root.querySelector('.mail-suggest-chip'));
    assert.equal(c.root.querySelector('.mail-ink-own'), null);
    c.destroy();
});

test('changing the To contact re-asks the host', async () => {
    const h = makeHost();
    const { c } = composer({ contacts: [PIERCE, HAX], h });
    await tick();
    assert.deepEqual(h.calls.prepare, []);
    c.selectContact('hax');
    await tick();
    assert.deepEqual(h.calls.prepare, ['hax']);
    assert.ok(c.root.querySelector('.mail-suggest-chip'));
    c.selectContact('pierce');
    assert.equal(c.root.querySelector('.mail-suggest-chip'), null);
    c.destroy();
});
