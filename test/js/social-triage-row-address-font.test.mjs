// Triage list rows: sender text that is an address, domain or handle gets the address font
// (class mail-row-address); display-name senders do not. The real reader and message
// normaliser in jsdom. Run with: node --test test/js/social-triage-row-address-font.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'triage-row-address-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-kinds.js',
    'minigames/inbox-triage/triage-flags.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'utils/display-dashes.js', 'ui/influence-bar.js', 'systems/social-influence.js',
    'systems/phish-rules.js', 'systems/global-writer.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
console.log = () => {};
window.gameState = { globalVariables: {} };
const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const { MailReader } = await mod('minigames/mail-client/mail-reader.js');
const { normaliseTriageMessage } = await mod('minigames/inbox-triage/triage-messages.js');

function rows(msgs) {
    document.body.textContent = '';
    const host = document.createElement('div');
    document.body.appendChild(host);
    const r = new MailReader(host, { influence: false, noDetails: true, emptyText: '' });
    r.setMessages(msgs.map((m) => normaliseTriageMessage(m)), 'inbox');
    return [...host.querySelectorAll('.mail-row')].map((row) => row.querySelector('.mail-row-who'));
}

test('page card: the host is the sender and uses the address font class', () => {
    const [who] = rows([{ id: 'p1', kind: 'page', page: { url: 'https://quayho1t-check.example/login', fields: [], button: 'Go' } }]);
    assert.equal(who.textContent, 'quayho1t-check.example');
    assert.ok(who.classList.contains('mail-row-address'));
});

test('email with no display name: the address is the sender and uses the class', () => {
    const [who] = rows([{ id: 'e1', kind: 'email', from: { name: '', address: 'it@quayh0lt.example' }, subject: 's', body: 'b' }]);
    assert.equal(who.textContent, 'it@quayh0lt.example');
    assert.ok(who.classList.contains('mail-row-address'));
});

test('sms with a bare number and no name uses the class', () => {
    const [who] = rows([{ id: 's1', kind: 'sms', from: { name: '', address: '+44 7700 900123' }, body: 'Hi' }]);
    assert.ok(who.classList.contains('mail-row-address'));
});

test('display-name senders are unchanged (email, sms with a name, push app, call id, string from)', () => {
    const whos = rows([
        { id: 'e2', kind: 'email', from: { name: 'Service desk', address: 'sd@fixture.example' }, subject: 's', body: 'b' },
        { id: 's2', kind: 'sms', from: { name: 'Bank', address: '+44 7700 900123' }, body: 'Hi' },
        { id: 'u1', kind: 'push', push: { app: 'Authenticator', account: 'a@b.example' } },
        { id: 'c1', kind: 'call', callerId: 'Unknown caller', transcript: [{ who: 'Caller', text: 'Hi' }] },
        { id: 'e3', kind: 'email', from: 'Ayaan Khan', subject: 's', body: 'b' }
    ]);
    assert.equal(whos.length, 5);
    for (const w of whos) {
        assert.equal(w.className, 'mail-row-who', `${w.textContent} keeps the plain class`);
    }
});

test('stylesheet sets the address font on the class', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/mail-client-minigame.css'), 'utf8');
    assert.match(css, /\.mail-row-who\.mail-row-address\s*\{[^}]*--se-font-address/);
});
