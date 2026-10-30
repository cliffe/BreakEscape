// ENG-14: the triage `page` card state "wifiList" (a Wi-Fi network list, no address bar).
// Runs the real triage-kinds module in a jsdom document. Fixtures only.
// Guard: a page with no `state` renders as the built E5 page, with no Wi-Fi block.
// Run with: node --test test/js/social-triage-wifi-list.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-triage-wifi-list-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/phish-rules.js',
    'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
console.log = () => {};
console.warn = () => {};

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const kinds = await mod('minigames/inbox-triage/triage-kinds.js');
const { InboxTriageMinigame } = await mod('minigames/inbox-triage/inbox-triage-minigame.js');
const { renderKindSurface } = kinds;

const scoring = await mod('minigames/inbox-triage/triage-scoring.js');
const h = { showNote() {}, showLink() {}, bodyNode: () => document.createElement('div') };
const surface = (page, rec = {}) => renderKindSurface({ id: 'm', kind: 'page', ...rec, page }, h);

const NETWORKS = [
    { ssid: 'BeanBarrow Guest', signal: 'strong', secured: true, note: 'The name on the sign at the till' },
    { ssid: 'BeanBarrow Free', signal: 3, secured: false },
    { ssid: 'HomeHub-4F2A', signal: 20, secured: true }
];

test('a wifiList card draws the venue note and one static row per network, with no address bar', () => {
    const node = surface({ state: 'wifiList', venueNote: "The sign by the till says the network is 'BeanBarrow Guest'", networks: NETWORKS });
    assert.equal(node.dataset.kindSurface, 'page');
    assert.ok(node.classList.contains('tri-page-wifiList'));
    assert.ok(!node.querySelector('.tri-address, .tri-padlock, .tri-no-padlock, .tri-browser-bar'), 'no address bar');
    assert.match(node.querySelector('.tri-wifi-venue').textContent, /BeanBarrow Guest/);
    const rows = [...node.querySelectorAll('.tri-wifi-row')];
    assert.equal(rows.length, 3);
    assert.deepEqual(rows.map((r) => r.querySelector('.tri-wifi-ssid').textContent), NETWORKS.map((n) => n.ssid));
    assert.equal(rows[0].querySelector('.tri-wifi-note').textContent, 'The name on the sign at the till');
    assert.equal(rows[1].querySelector('.tri-wifi-note'), null);
});

test('nothing in a wifiList card can be typed or clicked', () => {
    const node = surface({ state: 'wifiList', networks: NETWORKS });
    assert.equal(node.querySelectorAll('input, textarea, select, button, a, [tabindex]').length, 0);
});

test('lock state is given in words as well as the icon, and signal as bars plus a word', () => {
    const node = surface({ state: 'wifiList', networks: NETWORKS });
    const rows = [...node.querySelectorAll('.tri-wifi-row')];
    assert.match(rows[0].querySelector('.tri-wifi-lock-word').textContent, /^Secured/);
    assert.match(rows[1].querySelector('.tri-wifi-lock-word').textContent, /^Open/);
    assert.equal(rows[0].querySelector('.tri-wifi-lock').getAttribute('aria-hidden'), 'true');
    assert.equal(rows[0].querySelector('.tri-wifi-signal-word').textContent, 'Strong signal');
    assert.equal(rows[0].querySelectorAll('.tri-wifi-bar.on').length, 4);
    assert.equal(rows[1].querySelector('.tri-wifi-signal-word').textContent, 'Good signal');
    assert.equal(rows[1].querySelectorAll('.tri-wifi-bar.on').length, 3);
    assert.equal(rows[2].querySelector('.tri-wifi-signal-word').textContent, 'Weak signal', '20 per cent is one bar');
    assert.equal(rows[2].querySelectorAll('.tri-wifi-bar.on').length, 1);
});

test('the lock words can be overridden by data, and a row with no secured flag shows no lock', () => {
    const node = surface({ state: 'wifiList', labels: { secured: 'Locked', open: 'Unlocked' },
        networks: [{ ssid: 'A', signal: 2, secured: true }, { ssid: 'B', signal: 2, secured: false }, { ssid: 'C', signal: 2 }] });
    const words = [...node.querySelectorAll('.tri-wifi-row')].map((r) => r.querySelector('.tri-wifi-lock-word')?.textContent ?? null);
    assert.deepEqual(words, ['Locked', 'Unlocked', null]);
});

test('every string goes in as text, not markup', () => {
    const node = surface({ state: 'wifiList', venueNote: '<b>x</b>', networks: [{ ssid: '<img src=x onerror=1>', signal: 'fair', secured: true, note: '<i>n</i>' }] });
    assert.equal(node.querySelector('img, b, i'), null);
    assert.equal(node.querySelector('.tri-wifi-ssid').textContent, '<img src=x onerror=1>');
});

test('a wifiList card scores through the shared page verdict points, with no bespoke value', () => {
    assert.equal(scoring.verdictPoints('awareness', true, 'report', 'page'), scoring.FULL_VERDICT_POINTS);
    assert.equal(scoring.verdictPoints('awareness', false, 'verify', 'page'), scoring.FULL_VERDICT_POINTS);
    assert.equal(scoring.verdictPoints('awareness', true, 'trust', 'page'), 0);
});

test('without a state the ordinary page renders with no Wi-Fi block, and networks alone change nothing', () => {
    const plain = { url: 'https://sso.quayholt.example/login', padlock: true, heading: 'Sign in', fields: ['Email'], button: 'Go' };
    const a = surface(plain, { subject: 'Sign in' });
    const b = surface({ ...plain, networks: NETWORKS, venueNote: 'x' }, { subject: 'Sign in' });
    assert.equal(a.outerHTML, b.outerHTML, 'networks/venueNote are read only under state wifiList');
    assert.ok(a.querySelector('.tri-address'));
    assert.ok(!a.querySelector('.tri-wifi, .tri-wifi-list'));
});
