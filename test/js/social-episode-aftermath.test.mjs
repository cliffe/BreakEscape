// ENG-01: the flip's victim's-seat aftermath (episode.flipAftermath) and the episode-level stepLabels.
// The real flip view and episode model in jsdom on fixtures. The runner wiring (what _flipProps
// hands the view, the strip labels) is covered at the end of social-episode-runner.test.mjs.
// Run with: bundle exec node --test test/js/social-episode-aftermath.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-episode-aftermath-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/episode-runner/flip-view.js', 'minigames/episode-runner/episode-model.js',
    'minigames/inbox-triage/triage-flags.js', 'minigames/inbox-triage/triage-kinds.js',
    'minigames/landing-page-builder/landing-page-render.js', 'minigames/landing-page-builder/landing-page-model.js',
    'minigames/inbox-triage/triage-scoring.js', 'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
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
console.warn = () => {};
window.gameState = { globalVariables: {} };

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const { renderFlipView } = await mod('minigames/episode-runner/flip-view.js');
const { flipAftermathFor } = await mod('minigames/episode-runner/episode-model.js');

const host = () => { document.body.textContent = ''; const d = document.createElement('div'); document.body.appendChild(d); return d; };

const sent = () => ({
    id: 'sent_1', kind: 'email', playerSent: true,
    from: { name: 'Service desk', address: 'servicedesk@fixture.example' },
    to: 'ayaan@fixture.example', subject: 'Re-confirm your sign-in', time: '09:10',
    body: 'Please sign in again.', links: [], attachments: [],
    truth: { isPhish: true, flags: ['senderTrust'] }
});
const aftermath = () => ({
    heading: 'Now you are Kieran', victimName: 'Kieran', intro: 'Here is his account a few minutes later.',
    items: [
        { id: 'fa_sent', kind: 'email', folder: 'sent', to: 'finance@fixture.example', subject: 'Invoice <b>attached</b>', time: '15:08',
          note: 'Kieran did not write this.', body: 'SHOULD NOT SHOW' },
        { id: 'fa_push', kind: 'push', push: { app: 'Authenticator', account: 'kieran@fixture.example', location: 'Elsewhere', device: 'Unknown' },
          note: 'He did not ask for this.' }
    ],
    line: 'Most of the damage happens between noticing and reporting.'
});

test('without aftermath the flip is the same as before (message, page, call, missed, noSend)', () => {
    const cases = [
        [{ message: sent() }, ['message']],
        [{ page: { url: 'https://signin.fixture.example/', tells: ['domain'] } }, ['page']],
        [{ call: { notes: ['Ask for a call back.'] } }, ['call']],
        [{ missed: true }, ['missed']],
        [{}, ['noSend']]
    ];
    for (const [props, parts] of cases) {
        const h = host();
        const v = renderFlipView(h, { ...props, strings: {}, onContinue() {} });
        assert.deepEqual(v.getState().parts, parts);
        assert.equal(h.querySelector('.aw-flip-aftermath'), null);
        const markup = h.innerHTML;
        const w = host();
        const v2 = renderFlipView(w, { ...props, aftermath: null, strings: {}, onContinue() {} });
        assert.deepEqual(v2.getState(), v.getState());
        assert.equal(w.innerHTML, markup, 'aftermath: null draws the same markup as no key');
    }
});

test('with aftermath and a message: parts are message, aftermath; one item each; the email row has no body', () => {
    const h = host();
    const v = renderFlipView(h, { message: sent(), aftermath: aftermath(), strings: {}, onContinue() {} });
    assert.deepEqual(v.getState().parts, ['message', 'aftermath']);
    const items = [...h.querySelectorAll('.aw-flip-aftermath .aw-aftermath-item')];
    assert.deepEqual(items.map((n) => n.dataset.id), ['fa_sent', 'fa_push']);
    assert.equal(h.querySelector('.aw-flip-aftermath h3').textContent, 'Now you are Kieran');
    assert.equal(h.querySelector('.aw-flip-aftermath .aw-lead').textContent, 'Here is his account a few minutes later.');
    assert.equal(h.querySelector('.aw-aftermath-line').textContent, 'Most of the damage happens between noticing and reporting.');
    const row = items[0];
    assert.ok(row.textContent.includes('finance@fixture.example'));
    assert.ok(row.textContent.includes('Invoice <b>attached</b>'), 'strings go in as text');
    assert.equal(row.querySelector('b'), null);
    assert.ok(!row.textContent.includes('SHOULD NOT SHOW'), 'no body');
    assert.equal(row.querySelector('a'), null, 'no link');
    assert.ok(row.textContent.includes('Kieran did not write this.'));
    assert.ok(items[1].querySelector('[data-kind-surface="push"]'));
    assert.ok(items[1].textContent.includes('Authenticator'));
    // after the replay, before the defender line
    const order = [...h.querySelector('.aw-flip').children].map((n) => n.className);
    const at = (c) => order.findIndex((x) => x.includes(c));
    assert.ok(at('aw-flip-reader') < at('aw-flip-aftermath'));
    assert.ok(at('aw-flip-aftermath') < at('aw-defender-line'));
});

test('no aftermath on missed, landedNoTells or noSend; invalid items are dropped', () => {
    for (const props of [{ missed: true }, { landedNoTells: true }, {}, { message: sent(), missed: true }]) {
        const h = host();
        renderFlipView(h, { ...props, aftermath: aftermath(), strings: {}, onContinue() {} });
        assert.equal(h.querySelector('.aw-flip-aftermath'), null, JSON.stringify(Object.keys(props)));
    }
    const h = host();
    const v = renderFlipView(h, { message: sent(), aftermath: { items: [{ kind: 'email' }, { id: 'x', kind: 'weird' }, 'no'] }, strings: {}, onContinue() {} });
    assert.deepEqual(v.getState().parts, ['message']);
    assert.equal(h.querySelector('.aw-flip-aftermath'), null);
});

test('flipAftermathFor: null for landed false and for an episode with no block', () => {
    const ep = { flipAftermath: aftermath() };
    assert.equal(flipAftermathFor(ep, { landed: false }), null);
    assert.equal(flipAftermathFor({}, { landed: true }), null);
    assert.equal(flipAftermathFor(null, {}), null);
    assert.equal(flipAftermathFor({ flipAftermath: 'x' }, { landed: true }), null);
    assert.equal(flipAftermathFor(ep, { landed: true }), ep.flipAftermath);
    assert.equal(flipAftermathFor(ep), ep.flipAftermath, 'landed defaults to true');
});
