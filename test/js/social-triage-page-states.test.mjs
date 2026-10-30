// ENG-03a: the triage `page` browser-screen states (fakeCheck, fakeUpdate, fullScreenAlarm,
// extensionPermission, downloadBar, browserWarning, relaunchBar) and the `verdictLabels` relabel.
// Runs the real triage-kinds and inbox-triage-minigame modules in a jsdom document. Fixtures only.
// Guard: a page with no `state` renders as the built E5 page; a set with no `verdictLabels` keeps
// the built Trust/Report/Delete labels.
// Run with: node --test test/js/social-triage-page-states.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-triage-page-states-'));
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
const { renderKindSurface, actionsFor } = kinds;

const h = { showNote() {}, showLink() {}, bodyNode: () => document.createElement('div') };
const surface = (page, rec = {}) => renderKindSurface({ id: 'm', kind: 'page', ...rec, page }, h);

// ── no state: the ordinary E5 page, unchanged ──────────────────────────────────
test('a page with no state renders the built E5 page (address bar, heading, form)', () => {
    const node = surface({ url: 'https://sso.quayholt.example/login', padlock: true, heading: 'Sign in',
        fields: ['Email', 'Password'], button: 'Sign in' }, { subject: 'Sign in' });
    assert.equal(node.dataset.kindSurface, 'page');
    assert.ok(!node.classList.contains('tri-page-state'), 'no state class on an ordinary page');
    assert.ok(node.querySelector('.tri-address'), 'address button present');
    assert.ok(node.querySelector('.tri-padlock'), 'padlock button present');
    assert.equal(node.querySelector('.tri-kind-title').textContent, 'Sign in');
    assert.equal(node.querySelectorAll('.tri-page-field').length, 2);
    // no state-specific blocks leaked in
    assert.ok(!node.querySelector('.tri-fakecheck, .tri-alarm, .tri-ext-permission'));
});

// ── each state draws its block ─────────────────────────────────────────────────
test('fakeCheck: a reveal shows clipboardReveal and never writes to the real clipboard', () => {
    // spy the clipboard; the code must never touch it
    let writes = 0;
    try { Object.defineProperty(dom.window.navigator, 'clipboard', { configurable: true, value: { writeText: () => { writes += 1; } } }); } catch (e) { /* ignore */ }
    const reveal = 'A hidden command that would run a program on your computer';
    const node = surface({ url: 'https://orders.fernside.example/verify', padlock: true, state: 'fakeCheck',
        heading: 'Verify you are human', clipboardReveal: reveal }, { body: 'Follow the on-screen steps to continue.' });
    assert.ok(node.classList.contains('tri-page-fakeCheck'));
    assert.ok(node.querySelector('.tri-address'), 'fakeCheck keeps the address bar');
    const line = node.querySelector('.tri-page-reveal-text');
    assert.ok(line.hidden, 'the reveal line is hidden until asked');
    assert.equal(line.textContent, reveal);
    node.querySelector('.tri-page-reveal-btn').dispatchEvent(new dom.window.Event('click'));
    assert.ok(!line.hidden, 'the reveal line shows after the button');
    assert.equal(writes, 0, 'nothing is written to the real clipboard');
});

test('fakeUpdate, downloadBar and browserWarning draw their blocks with the address bar', () => {
    const up = surface({ url: 'https://news.example/a', padlock: true, state: 'fakeUpdate', heading: 'Update required', button: 'Download update' });
    assert.ok(up.classList.contains('tri-page-fakeUpdate') && up.querySelector('.tri-address'));
    assert.equal(up.querySelector('.tri-page-button').textContent, 'Download update');

    const dl = surface({ url: 'https://downloads.example/x', padlock: true, state: 'downloadBar', download: { filename: 'Report.pdf.exe' } });
    assert.ok(dl.classList.contains('tri-page-downloadBar') && dl.querySelector('.tri-address'));
    assert.equal(dl.querySelector('.tri-download-name').textContent, 'Report.pdf.exe');

    const warn = surface({ url: 'https://bad.example/', padlock: false, state: 'browserWarning', heading: 'Deceptive site ahead' });
    assert.ok(warn.classList.contains('tri-page-browserWarning') && warn.querySelector('.tri-warning-back'));
});

test('relaunchBar and extensionPermission draw as chrome/overlay with no address bar', () => {
    const relaunch = surface({ state: 'relaunchBar', heading: 'An update is ready', button: 'Relaunch' });
    assert.ok(relaunch.classList.contains('tri-page-relaunchBar'));
    assert.ok(!relaunch.querySelector('.tri-address'), 'the browser bar is not a web page: no address');
    assert.ok(relaunch.querySelector('.tri-relaunch-bar'));

    const ext = surface({ state: 'extensionPermission', heading: "Add 'Free PDF Tools'?",
        permissions: ['Read and change all your data on all websites', 'Read your browsing history'] });
    assert.ok(ext.classList.contains('tri-page-extensionPermission'));
    assert.ok(!ext.querySelector('.tri-address'), 'the permission overlay has no address bar');
    assert.equal(ext.querySelectorAll('.tri-ext-perm').length, 2);
});

test('fullScreenAlarm has a way out, and under prefers-reduced-motion adds no shake/flash class', () => {
    const base = dom.window.matchMedia;
    // reduced motion on
    dom.window.matchMedia = () => ({ matches: true });
    const reduced = surface({ state: 'fullScreenAlarm', heading: 'Your computer has been locked',
        alarm: { hintAfterMs: 30000 } }, { body: 'Call support now on 0800 000 0000.' });
    assert.ok(reduced.querySelector('.tri-alarm-close'), 'a visible way out is always present');
    assert.ok(reduced.querySelector('.tri-alarm-hint').hidden, 'the hint is hidden until the delay');
    assert.ok(!reduced.querySelector('.tri-alarm').classList.contains('tri-alarm-pulse'), 'no shake/flash under reduced motion');
    // reduced motion off: the (calm) pulse class is allowed
    dom.window.matchMedia = () => ({ matches: false });
    const moving = surface({ state: 'fullScreenAlarm', heading: 'Locked' });
    assert.ok(moving.querySelector('.tri-alarm').classList.contains('tri-alarm-pulse'));
    dom.window.matchMedia = base;
});

test('the alarm hint timer is cleared by clearKindTimers, the next surface and the minigame cleanup', async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const alarm = () => surface({ state: 'fullScreenAlarm', heading: 'Locked', alarm: { hintAfterMs: 25 } });
    // left alone, the hint appears after its delay
    let node = alarm();
    await wait(70);
    assert.equal(node.querySelector('.tri-alarm-hint').hidden, false, 'the hint shows when nothing cancels it');
    // cancelled directly
    node = alarm();
    kinds.clearKindTimers();
    await wait(70);
    assert.equal(node.querySelector('.tri-alarm-hint').hidden, true, 'clearKindTimers stops the hint timer');
    // cancelled by drawing the next surface
    node = alarm();
    surface({ state: 'fullScreenAlarm', heading: 'Next', alarm: { hintAfterMs: 5000 } });
    await wait(70);
    assert.equal(node.querySelector('.tri-alarm-hint').hidden, true, 'a new surface clears the old pane timer');
    kinds.clearKindTimers();
    // cancelled by the minigame's own cleanup
    node = alarm();
    try { InboxTriageMinigame.prototype.cleanup.call({ _closeSheet() {}, reader: null }); } catch (e) { /* base cleanup needs a real scene */ }
    await wait(70);
    assert.equal(node.querySelector('.tri-alarm-hint').hidden, true, 'cleanup() clears the hint timer');
});

// ── verdictLabels ──────────────────────────────────────────────────────────────
const labelsGetter = Object.getOwnPropertyDescriptor(InboxTriageMinigame.prototype, 'labels').get;

test('verdictLabels relabels the three verdict buttons; ids and scoring are unchanged', () => {
    const folded = labelsGetter.call({ set: { verdictLabels: {
        trust: 'Carry on', report: 'Close and report', delete: 'Go the trusted way' } } });
    assert.equal(folded.verdict.trust.label, 'Carry on');
    const acts = actionsFor('page', false, folded);
    assert.deepEqual(acts.map((a) => a.label), ['Carry on', 'Close and report', 'Go the trusted way']);
    // the verdict ids (what the scorer reads) are untouched
    assert.deepEqual(acts.map((a) => a.verdict), ['trust', 'report', 'delete']);
});

test('without verdictLabels the built labels stand (E5 unchanged)', () => {
    const base = labelsGetter.call({ set: {} });
    assert.equal(base, null);
    const acts = actionsFor('page', false, base);
    assert.deepEqual(acts.map((a) => a.label), ['Trust', 'Report', 'Delete']);
    assert.deepEqual(acts.map((a) => a.verdict), ['trust', 'report', 'delete']);
});

test('verdictLabels folds over an existing labels.verdict without dropping its other fields', () => {
    const folded = labelsGetter.call({ set: {
        labels: { verdict: { trust: { hint: 'keep me' } }, smsHeading: 'Txt' },
        verdictLabels: { trust: 'Carry on' } } });
    assert.equal(folded.verdict.trust.label, 'Carry on');
    assert.equal(folded.verdict.trust.hint, 'keep me');
    assert.equal(folded.smsHeading, 'Txt');
});
