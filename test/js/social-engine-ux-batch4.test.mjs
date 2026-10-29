// Engine UX batch 4: mail-reader body/link address fonts (E17-n3, E8 F15, E15), the triage row
// badge tone (F-E19-7), and the skin/meter CSS fixes (step-num >=13px, aw-heading contrast,
// compose-meter hint). The real mail reader in a jsdom document, on inline fixtures.
// Run with: node --test test/js/social-engine-ux-batch4.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const cssDir = join(here, '../../public/break_escape/css');
const dir = mkdtempSync(join(tmpdir(), 'ux-batch4-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
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

function reader(opts = {}) {
    document.body.textContent = '';
    const host = document.createElement('div');
    document.body.appendChild(host);
    return new MailReader(host, { influence: false, noDetails: true, emptyText: '', ...opts });
}
function openBody(rec) {
    const r = reader();
    r.setMessages([rec], 'inbox');
    r.select(rec.id);
    return r.root.querySelector('.mail-read-pane .mail-body');
}

// ── item 5 (E17-n3, E8 F15): a URL or email in the body is set in the address font ──
test('a URL in the body is wrapped in .mail-body-url, the rest stays plain text', () => {
    const body = openBody({ id: 'm1', from: { name: 'Projects', address: 'p@h.example' }, subject: 's',
        body: 'Install: https://get.meetly-app.example/win\nThanks' });
    const urls = body.querySelectorAll('.mail-body-url');
    assert.equal(urls.length, 1);
    assert.equal(urls[0].textContent, 'https://get.meetly-app.example/win');
    assert.equal(body.textContent, 'Install: https://get.meetly-app.example/win\nThanks', 'text is unchanged');
});

test('an email address in the body is wrapped too', () => {
    const body = openBody({ id: 'm2', from: { name: 'A', address: 'p@h.example' }, subject: 's',
        body: 'Write to a.warsame@quayholt.example today.' });
    const urls = body.querySelectorAll('.mail-body-url');
    assert.equal(urls.length, 1);
    assert.equal(urls[0].textContent, 'a.warsame@quayholt.example');
});

test('a trailing full stop stays outside the address span', () => {
    const body = openBody({ id: 'm2b', from: { name: 'A', address: 'p@h.example' }, subject: 's',
        body: 'See https://meetly-app.example/win.' });
    assert.equal(body.querySelector('.mail-body-url').textContent, 'https://meetly-app.example/win');
    assert.equal(body.textContent, 'See https://meetly-app.example/win.');
});

test('a body with no address renders as before (one text node, no span)', () => {
    const body = openBody({ id: 'm3', from: { name: 'A', address: 'p@h.example' }, subject: 's',
        body: 'Just an ordinary note from a colleague.' });
    assert.equal(body.querySelector('.mail-body-url'), null);
    assert.equal(body.childNodes.length, 1);
    assert.equal(body.textContent, 'Just an ordinary note from a colleague.');
});

// ── E15: an in-body link chip whose label is a URL uses the address font ──
test('an in-body link chip with a URL label carries mail-chip-address', () => {
    const body = openBody({ id: 'm4', from: { name: 'A', address: 'p@h.example' }, subject: 's',
        body: 'Upload here: {{link:send}}',
        links: [{ id: 'send', linkText: 'swiftdrop-free.example/upload', destination: 'https://swiftdrop-free.example/upload' }] });
    const label = body.querySelector('.mail-chip-link .mail-chip-label');
    assert.equal(label.textContent, 'swiftdrop-free.example/upload');
    assert.ok(label.classList.contains('mail-chip-address'), 'URL label reads in the address font');
});

test('an in-body link chip with a prose label stays in the readable face', () => {
    const body = openBody({ id: 'm5', from: { name: 'A', address: 'p@h.example' }, subject: 's',
        body: 'More {{link:go}}',
        links: [{ id: 'go', linkText: 'click here', destination: 'https://x.example/path' }] });
    const label = body.querySelector('.mail-chip-link .mail-chip-label');
    assert.equal(label.textContent, 'click here');
    assert.ok(!label.classList.contains('mail-chip-address'), 'prose label is not forced to the address font');
});

// ── item 4 (F-E19-7): the row badge carries a tone/mark; a wrong call never shows a success tick ──
function badgeOf(badge) {
    const r = reader({ rowBadge: () => badge });
    r.setMessages([{ id: 'b1', from: { name: 'A', address: 'a@b.example' }, subject: 's', body: 'x' }], 'inbox');
    return r.root.querySelector('.mail-row-badge');
}

test('a wrong-tone badge shows a cross and the wrong class, not a success tick', () => {
    const b = badgeOf({ word: 'Trusted', tone: 'wrong', mark: 'mark-cross' });
    assert.ok(b.classList.contains('mail-row-badge-wrong'));
    assert.equal(b.querySelector('.mail-row-badge-word').textContent, 'Trusted');
    assert.match(b.querySelector('img.mail-icon').getAttribute('src'), /mark-cross/);
    assert.doesNotMatch(b.querySelector('img.mail-icon').getAttribute('src'), /mark-tick/);
});

test('a right-tone badge keeps the success tick', () => {
    const b = badgeOf({ word: 'Reported', tone: 'right', mark: 'mark-tick' });
    assert.ok(b.classList.contains('mail-row-badge-right'));
    assert.match(b.querySelector('img.mail-icon').getAttribute('src'), /mark-tick/);
});

test('a plain string badge is unchanged: a mark-tick and the word, no tone class', () => {
    const b = badgeOf('Trusted');
    assert.equal(b.className, 'mail-row-badge');
    assert.equal(b.querySelector('.mail-row-badge-word').textContent, 'Trusted');
    assert.match(b.querySelector('img.mail-icon').getAttribute('src'), /mark-tick/);
});

// ── CSS fixes: step-num size, aw-heading contrast, meter hint, row-badge wrong tone, body-url font ──
test('CSS carries the batch-4 skin and meter fixes', () => {
    const skin = readFileSync(join(cssDir, 'awareness-skin.css'), 'utf8');
    assert.match(skin, /\.aw-step-num\s*\{[^}]*font-size:\s*13px/, 'step-number badge is at least 13px');
    assert.doesNotMatch(skin, /\.aw-step-num\s*\{[^}]*font-size:\s*12px/);
    assert.match(skin, /\.aw-heading\s*\{[^}]*color-mix\(in srgb, var\(--aw-accent\)/, 'heading darkened for AA');

    const mail = readFileSync(join(cssDir, 'mail-client-minigame.css'), 'utf8');
    assert.match(mail, /\.mail-body\s+\.mail-body-url\s*\{[^}]*font-family:\s*var\(--se-font-address/);
    assert.match(mail, /\.mail-redflag-sub\s*\{/, 'the compose-meter hint line is styled');

    const triage = readFileSync(join(cssDir, 'inbox-triage-minigame.css'), 'utf8');
    assert.match(triage, /\.mail-row-badge\.mail-row-badge-wrong\s*\{[^}]*color:\s*var\(--ui-danger/);
});
