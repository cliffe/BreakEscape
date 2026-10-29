// Engine UX batch 3 (part A): triage and inbox changes.
//   - page.fields tick box (E10 MI2): { label, type: "tick", checked? } draws a tick control, not a
//     text box; a string field is unchanged.
//   - page URL soft-wrap (F-E20-3): the address bar carries <wbr> break points after dots/slashes;
//     its text and aria-label are the full URL.
//   - kindLabelFor / wifiList (E20 F-E20-4): a wifiList page reads "Wi-Fi networks", not "Web page".
//   - truth.verifyLine (E19 D1): overrides the Verify feedback line; absent keeps the preamble.
//   - labels.phishCaughtLabel (E17-M2) and labels.scoreLine (E8 weak-line #5): overridable, default
//     unchanged.
//   - header noun (E20 F-E20-1): the overlay title follows the kinds present, overridable by
//     set.title; an email set stays "Inbox check".
// Real triage-kinds and inbox-triage-minigame in a jsdom document. Fixtures only.
// Run with: node --test test/js/social-triage-engine-batch3.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-triage-batch3-'));
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
const { renderKindSurface, kindLabelFor, defaultSubject } = kinds;

const h = { showNote() {}, showLink() {}, bodyNode: () => document.createElement('div') };
const surface = (page, rec = {}) => renderKindSurface({ id: 'm', kind: 'page', ...rec, page }, h);

// ── page.fields tick box (E10 MI2) ──────────────────────────────────────────────
test('a tick field draws a tick box, not a text box; a string field is unchanged', () => {
    const node = surface({ url: 'https://check.example/verify', heading: 'Verify you are human',
        fields: [{ label: 'I am not a robot', type: 'tick' }] });
    const row = node.querySelector('.tri-page-field');
    assert.ok(row.classList.contains('tri-page-field-tick'));
    assert.ok(row.querySelector('.tri-page-tick'), 'tick control present');
    assert.ok(!row.querySelector('.tri-page-field-box'), 'no text box on a tick row');
    assert.equal(row.querySelector('.tri-page-tick-label').textContent, 'I am not a robot');
    // Unticked by default.
    assert.ok(!row.querySelector('.tri-page-tick-on'));
    // A plain string field keeps the text box.
    const textOnly = surface({ url: 'https://x.example', fields: ['Email'] });
    const r2 = textOnly.querySelector('.tri-page-field');
    assert.ok(r2.querySelector('.tri-page-field-box'));
    assert.ok(!r2.querySelector('.tri-page-tick'));
});

test('a ticked tick field shows the ticked state', () => {
    const node = surface({ url: 'https://x.example', fields: [{ label: 'I agree', type: 'tick', checked: true }] });
    assert.ok(node.querySelector('.tri-page-tick.tri-page-tick-on'));
});

// ── page URL soft wrap (F-E20-3) ────────────────────────────────────────────────
test('the address bar carries <wbr> break points but its text and aria-label are the full URL', () => {
    const url = 'https://thebeanandbarrow.example/wifi/login';
    const node = surface({ url, padlock: true });
    const addr = node.querySelector('.tri-address');
    assert.ok(addr.querySelectorAll('wbr').length >= 3, 'wbr after each dot and slash');
    assert.equal(addr.textContent, url, 'visible text is the whole URL');
    assert.equal(addr.getAttribute('aria-label'), `Address bar: ${url}`);
});

// ── kindLabelFor / wifiList (E20 F-E20-4) ────────────────────────────────────────
test('a wifiList page reads "Wi-Fi networks", a plain page reads "Web page", override honoured', () => {
    const wifi = { kind: 'page', page: { state: 'wifiList', networks: [{ ssid: 'Cafe', signal: 'good' }] } };
    assert.equal(kindLabelFor(wifi, null), 'Wi-Fi networks');
    assert.equal(kindLabelFor({ kind: 'page', page: { url: 'https://x.example' } }, null), 'Web page');
    assert.equal(kindLabelFor(wifi, { kind: { wifiList: 'Networks nearby' } }), 'Networks nearby');
});

test('defaultSubject for a wifiList page with no heading falls back to the Wi-Fi label, not "Web page"', () => {
    const subj = defaultSubject({ kind: 'page', page: { state: 'wifiList', networks: [] } }, null);
    assert.equal(subj, 'Wi-Fi networks');
    const withHeading = defaultSubject({ kind: 'page', page: { state: 'wifiList', heading: 'Networks at the cafe' } }, null);
    assert.equal(withHeading, 'Networks at the cafe');
});

test('an item-level kindTag overrides both the state label and a labels.kind override', () => {
    const genuine = { kind: 'page', page: { state: 'wifiList' }, kindTag: 'Sign-in page' };
    assert.equal(kindLabelFor(genuine, { kind: { wifiList: 'Networks' } }), 'Sign-in page');
    // A plain page with a kindTag uses it too.
    assert.equal(kindLabelFor({ kind: 'page', page: {}, kindTag: 'Checkout' }, null), 'Checkout');
});

// ── page.autofillNote (F-E20-8) ──────────────────────────────────────────────────
test('page.autofillNote overrides the password-manager cue; absent keeps the default', () => {
    const def = surface({ url: 'https://x.example', fields: ['Email', 'Password'], autofill: 'none' });
    def.querySelector('.tri-autofill-btn').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(def.querySelector('.tri-autofill').textContent, 'Your password manager did not fill this in.');

    const over = surface({ url: 'https://x.example', fields: ['Email', 'Password'], autofill: 'none',
        autofillNote: { none: 'It did not fill in - a page it already knows would have.' } });
    over.querySelector('.tri-autofill-btn').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(over.querySelector('.tri-autofill').textContent, 'It did not fill in - a page it already knows would have.');
});

// ── the minigame harness ────────────────────────────────────────────────────────
let current = null;
function open(set, params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new InboxTriageMinigame(container, { set, social: { triageSets: [set] }, ...params });
    scene._sceneType = 'inbox-triage';
    window.MinigameFramework = window.MinigameFramework || {};
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const $ = (s, q) => s.container.querySelector(q);
const click = (node) => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

const awareSet = (over = {}) => ({
    id: 'b3', title: undefined, stage: 'mission', scoringProfile: 'awareness', feedbackMode: 'immediate',
    headerPanel: 'collapsed', glossary: 'closed', chipStyle: 'plain', verifyVerdict: true,
    outcome: { setGlobalPrefix: 'b3_', passPercent: 60 },
    messages: [
        { id: 'p1', from: { name: 'IT', address: 'it@quayholt.example' }, to: 'you@quayholt.example',
            subject: 'Password was changed', time: '15:05', body: 'Your password was changed.',
            auth: { spf: 'fail', dkim: 'fail', dmarc: 'fail' },
            truth: { isPhish: true, flags: ['senderTrust'], perFlagNote: { senderTrust: 'odd' },
                kindLine: 'This was a real notice you did not ask for.',
                verifyLine: 'Calling it in straight away is exactly right.', ifTrusted: 'An attacker is in.' } },
        { id: 'r1', from: { name: 'Reuben', address: 'reuben@quayholt.example' }, to: 'you@quayholt.example',
            subject: 'Lunch', time: '12:00', body: 'Coming to lunch?',
            auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
            truth: { isPhish: false, flags: [], whyFine: { default: 'Real colleague.' } } }
    ],
    ...over
});

// ── truth.verifyLine (E19 D1) ────────────────────────────────────────────────────
test('truth.verifyLine overrides the Verify feedback line; absent keeps the preamble', () => {
    const s = open(awareSet());
    click($(s, '.tri-start'));
    click($(s, '.mail-row[data-id="p1"]'));
    click($(s, '.tri-verdict[data-verdict="verify"]'));
    click($(s, '.tri-confirm'));
    const text = $(s, '.tri-card-verdict').textContent;
    assert.match(text, /Calling it in straight away is exactly right\./);
    assert.doesNotMatch(text, /Checking first is a sound habit/);

    // Without verifyLine the generic preamble returns.
    const noLine = awareSet();
    delete noLine.messages[0].truth.verifyLine;
    const s2 = open(noLine);
    click($(s2, '.tri-start'));
    click($(s2, '.mail-row[data-id="p1"]'));
    click($(s2, '.tri-verdict[data-verdict="verify"]'));
    click($(s2, '.tri-confirm'));
    assert.match($(s2, '.tri-card-verdict').textContent, /Checking first is a sound habit\./);
});

// ── labels.scoreLine (E8 weak-line #5) ───────────────────────────────────────────
test('labels.scoreLine overrides the scored-round brief line; absent keeps the default', () => {
    const s = open(awareSet());
    assert.match($(s, '.tri-brief').textContent, /Right call is most of the score; naming the flags is the rest\./);
    const s2 = open(awareSet({ labels: { scoreLine: 'Getting the call right is most of it.' } }));
    assert.match($(s2, '.tri-brief').textContent, /Getting the call right is most of it\./);
    assert.doesNotMatch($(s2, '.tri-brief').textContent, /naming the flags/);
});

// ── labels.phishCaughtLabel (E17-M2) ─────────────────────────────────────────────
test('labels.phishCaughtLabel overrides the result counter label; absent keeps "Phish caught"', () => {
    const play = (s) => {
        click($(s, '.tri-start'));
        click($(s, '.mail-row[data-id="p1"]'));
        click($(s, '.tri-verdict[data-verdict="report"]'));
        click($(s, '.tri-confirm'));
        click($(s, '.mail-row[data-id="r1"]'));
        click($(s, '.tri-verdict[data-verdict="trust"]'));
        click($(s, '.tri-confirm'));
        click($(s, '.tri-see-result') || $(s, '.tri-next'));
    };
    const s = open(awareSet());
    play(s);
    assert.match($(s, '.tri-numbers').textContent, /Phish caught/);
    const s2 = open(awareSet({ labels: { phishCaughtLabel: 'Requests handled' } }));
    play(s2);
    assert.match($(s2, '.tri-numbers').textContent, /Requests handled/);
    assert.doesNotMatch($(s2, '.tri-numbers').textContent, /Phish caught/);
});

// ── header noun (E20 F-E20-1) ────────────────────────────────────────────────────
test('the overlay title follows the kinds present; set.title overrides; an email set stays Inbox check', () => {
    const email = open(awareSet());
    assert.equal($(email, '.tri-title').textContent, 'Inbox check');

    const named = open(awareSet({ title: 'Your morning' }));
    assert.equal($(named, '.tri-title').textContent, 'Your morning');

    const pageSet = awareSet({ messages: [
        { id: 'w1', kind: 'page', page: { state: 'wifiList', networks: [{ ssid: 'Cafe', signal: 'good' }] },
            truth: { isPhish: false, flags: [] } },
        { id: 'w2', kind: 'page', page: { state: 'wifiList', networks: [{ ssid: 'Cafe-Free', signal: 'good' }] },
            truth: { isPhish: true, flags: ['lookalike_domain'] } }
    ], channelTells: ['lookalike_domain'] });
    const wifi = open(pageSet);
    assert.equal($(wifi, '.tri-title').textContent, 'Wi-Fi networks');
    assert.notEqual($(wifi, '.tri-title').textContent, 'Inbox check');
});
