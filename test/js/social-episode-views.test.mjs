// Awareness episodes, packet P7-B: the step strip, flip view, debrief view and the neutral skin.
// Real modules run in jsdom on fixtures. Run with: bundle exec node --test test/js/social-episode-views.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const css = readFileSync(join(here, '../../public/break_escape/css/awareness-skin.css'), 'utf8');

const dir = mkdtempSync(join(tmpdir(), 'social-episode-views-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/episode-runner/step-strip.js', 'minigames/episode-runner/flip-view.js',
    'minigames/episode-runner/debrief-view.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/landing-page-builder/landing-page-render.js', 'minigames/landing-page-builder/landing-page-model.js', 'minigames/inbox-triage/triage-scoring.js',
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
console.warn = () => {};
window.gameState = { globalVariables: {} };

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const { renderStepStrip, renderWordmark } = await mod('minigames/episode-runner/step-strip.js');
const { renderFlipView, tellSentence, defenderLine } = await mod('minigames/episode-runner/flip-view.js');
const { renderDebrief } = await mod('minigames/episode-runner/debrief-view.js');
const { redFlagString } = await mod('minigames/inbox-triage/triage-flags.js');

const host = () => { document.body.textContent = ''; const d = document.createElement('div'); document.body.appendChild(d); return d; };

const sent = () => ({
    id: 'sent_1', kind: 'email', playerSent: true,
    from: { name: 'Harlow Packaging', address: 'accounts@brightwel1foods.example' },
    to: 'tom.reilly@brightwellfoods.example', subject: 'Updated bank details', time: '09:10',
    body: 'Please update the payee account on INV-2217 today.\nDo not mention this to anyone.',
    links: [], attachments: [],
    truth: { isPhish: true, flags: ['senderTrust', 'changed_bank_details', 'secrecy_or_bypass'] }
});

test('step strip: marks the current stage and done stages', () => {
    const h = host();
    const strip = renderStepStrip(h, { stages: ['brief', 'osint', 'flip'], current: 'osint', done: ['brief'] });
    const items = [...h.querySelectorAll('.aw-step')];
    assert.equal(items.length, 3);
    assert.equal(items[1].getAttribute('aria-current'), 'step');
    assert.ok(items[0].classList.contains('aw-step-done'));
    strip.update({ current: 'flip', done: ['brief', 'osint'] });
    assert.equal(h.querySelectorAll('[aria-current="step"]').length, 1);
    assert.equal(h.querySelector('[data-stage="flip"]').getAttribute('aria-current'), 'step');
    strip.destroy();
    assert.equal(h.querySelector('.aw-strip'), null);
});

test('step strip: a skipped stage is shown as skipped, not done (E3-6)', () => {
    const h = host();
    // mfa is in `done` (so the runner can advance past it) but also skipped: a refused call passes
    // the MFA demo over without running it, so it must read as skipped, not ticked done.
    const strip = renderStepStrip(h, { stages: ['write', 'mfa', 'flip'], current: 'flip', done: ['write', 'mfa'], skipped: ['mfa'], labels: { flip: 'The call' } });
    const mfa = h.querySelector('[data-stage="mfa"]');
    assert.ok(mfa.classList.contains('aw-step-skipped'), 'mfa marked skipped');
    assert.ok(!mfa.classList.contains('aw-step-done'), 'mfa is not also marked done');
    assert.match(mfa.querySelector('.aw-step-sr').textContent, /skipped/);
    // the write step, done and not skipped, still reads done
    const write = h.querySelector('[data-stage="write"]');
    assert.ok(write.classList.contains('aw-step-done'));
    assert.match(write.querySelector('.aw-step-sr').textContent, /done/);
    // a call episode relabels the flip step
    assert.equal(h.querySelector('[data-stage="flip"] .aw-step-label').textContent, 'The call');
    strip.update({ current: 'flip', done: ['write', 'mfa'], skipped: [] });
    assert.ok(!h.querySelector('[data-stage="mfa"]').classList.contains('aw-step-skipped'), 'clearing skipped lets it read done again');
    assert.ok(h.querySelector('[data-stage="mfa"]').classList.contains('aw-step-done'));
    strip.destroy();
});

test('wordmark is text from brand.logoText; a bad accent is ignored, a hex accent applied', () => {
    const h = host();
    renderStepStrip(h, { stages: ['brief'], current: 'brief', brand: { name: 'Brightwell Foods', logoText: 'BRIGHTWELL', accent: '#2f6f5e' } });
    assert.equal(h.querySelector('.aw-wordmark').textContent, 'BRIGHTWELL');
    assert.equal(h.querySelector('.aw-wordmark img'), null);
    assert.equal(h.querySelector('.aw-strip').style.getPropertyValue('--aw-accent'), '#2f6f5e');
    const h2 = host();
    renderStepStrip(h2, { stages: ['brief'], current: 'brief', brand: { logoText: 'X', accent: 'red; background:url(x)' } });
    assert.equal(h2.querySelector('.aw-strip').style.getPropertyValue('--aw-accent'), '');
    assert.equal(renderWordmark({}), null);
});

test('flip lists exactly the stored tells with their canonical strings', () => {
    const h = host();
    const message = sent();
    let continued = 0;
    const flip = renderFlipView(h, { message, strings: {}, onContinue: () => { continued += 1; } });
    const shown = [...h.querySelectorAll('.aw-tell')].map((n) => n.textContent);
    const expected = message.truth.flags.map((id) => redFlagString(id, message));
    assert.deepEqual(shown, expected);
    assert.deepEqual(flip.getState(), { shown: 'message', parts: ['message'], tells: expected });
    assert.ok(h.querySelector('.mail-reader'), 'the shared reader draws the message');
    assert.ok(h.textContent.includes('INV-2217'));
    h.querySelector('.aw-continue').click();
    assert.equal(continued, 1);
    flip.destroy();
    assert.equal(h.querySelector('.aw-flip'), null);
});

test('a tell id with no sentence renders a neutral phrase, not the raw id', () => {
    const phrase = tellSentence('notARealTell', sent());
    assert.notEqual(phrase, 'notARealTell');
    assert.ok(phrase.length > 0);
    assert.equal(tellSentence('formOrigin', sent()).includes('different site'), true);
});

test('flip with message null shows flipNoSend and no tells', () => {
    const h = host();
    const flip = renderFlipView(h, { message: null, strings: { flipNoSend: 'Nothing was sent.' }, onContinue() {} });
    assert.equal(h.querySelector('.aw-no-send').textContent, 'Nothing was sent.');
    assert.equal(h.querySelectorAll('.aw-tell').length, 0);
    assert.equal(h.querySelector('.mail-reader'), null);
    assert.deepEqual(flip.getState(), { shown: 'noSend', parts: ['noSend'], tells: [] });
});

// aw2: the flip's defender line is choice-aware. The learner's chosen pretext (templateId) picks a
// per-branch line from strings.flipDefenderLineByChoice; anything unmatched falls back to the single
// flipDefenderLine, then to the engine default.
test('aw2 defenderLine(): chosen pretext wins, else flipDefenderLine, else the default', () => {
    const strings = {
        flipDefenderLine: 'A fallback line.',
        flipDefenderLineByChoice: { pretext_bank_change: 'The urgent branch line.', pretext_bank_change_calm: 'The calm branch line.' }
    };
    assert.equal(defenderLine(strings, 'pretext_bank_change'), 'The urgent branch line.');
    assert.equal(defenderLine(strings, 'pretext_bank_change_calm'), 'The calm branch line.');
    // a pretext with no entry, and a null templateId, both fall back to flipDefenderLine
    assert.equal(defenderLine(strings, 'pretext_statement'), 'A fallback line.');
    assert.equal(defenderLine(strings, null), 'A fallback line.');
    // no by-choice map at all: flipDefenderLine
    assert.equal(defenderLine({ flipDefenderLine: 'Only one line.' }, 'pretext_bank_change'), 'Only one line.');
    // nothing authored: the engine default (non-empty)
    assert.ok(defenderLine({}, 'pretext_bank_change').length > 0);
    // a blank by-choice value is ignored, not shown
    assert.equal(defenderLine({ flipDefenderLine: 'Fallback.', flipDefenderLineByChoice: { pretext_x: '' } }, 'pretext_x'), 'Fallback.');
});

test('aw2 flip: renders the chosen pretext branch line, and falls back when it is unmatched', () => {
    const strings = {
        flipDefenderLine: 'A fallback line.',
        flipDefenderLineByChoice: { pretext_bank_change: 'The urgent branch line.' }
    };
    const h1 = host();
    renderFlipView(h1, { message: sent(), templateId: 'pretext_bank_change', strings, onContinue() {} });
    assert.equal(h1.querySelector('.aw-defender-line').textContent, 'The urgent branch line.');
    const h2 = host();
    renderFlipView(h2, { message: sent(), templateId: 'pretext_statement', strings, onContinue() {} });
    assert.equal(h2.querySelector('.aw-defender-line').textContent, 'A fallback line.');
    const h3 = host();
    renderFlipView(h3, { message: sent(), strings, onContinue() {} });
    assert.equal(h3.querySelector('.aw-defender-line').textContent, 'A fallback line.');
});

const set = () => ({
    id: 'e1_payments_inbox',
    messages: [
        { id: 'm1', kind: 'email', subject: 'Updated bank details', from: { name: 'Accounts', address: 'a@brightwel1foods.example' },
          truth: { isPhish: true, flags: ['lookalike_domain', 'changed_bank_details'], ifTrusted: 'The payment would go to the sender.' } },
        { id: 'm2', kind: 'email', subject: 'Purchase order 88', from: { name: 'Procurement', address: 'po@brightwellfoods.example' },
          truth: { isPhish: false, flags: [], whyFine: { default: 'It came from the known address and matches an open order.' } } },
        { id: 'm3', kind: 'email', subject: 'Invoice 5', from: { name: 'Harlow', address: 'a@harlowpackaging.example' },
          truth: { isPhish: false, flags: [] } }
    ]
});
const result = () => ({
    percent: 72, headline: 'Getting there', reportRate: 0.5, verifyCount: 1,
    answers: [
        { id: 'm1', verdict: 'trust', flags: [], score: 0, ms: 4000 },
        { id: 'm2', verdict: 'report', flags: [], score: 100, ms: 3000 },
        { id: 'm3', verdict: 'trust', flags: [], score: 100, ms: 2000 }
    ]
});

test('debrief (Cut A): a card only for items got wrong, plus the Monday card and the no-blame line', () => {
    const h = host();
    let finished = 0;
    const d = renderDebrief(h, { result: result(), set: set(), strings: { mondayCard: 'On Monday, use the Report button.', noBlameLine: 'No blame here.' }, variant: 'full', onFinish: () => { finished += 1; } });
    // m1 (trusted a phish, score 0) is reviewed; m2 (reported, 100) and m3 (trusted real, 100) are not.
    assert.equal(h.querySelectorAll('.aw-card').length, 1);
    assert.deepEqual(d.getState(), { items: 1, mondayCard: true, noBlame: true, conceptPanel: false, voicePanel: false, reportRoute: null, ruleOfThumb: false, teamProtected: null, genuine: { trusted: 1, checked: 0, flagged: 1 } });
    assert.equal(h.querySelector('.aw-monday').textContent, 'On Monday, use the Report button.');
    assert.equal(h.querySelector('.aw-no-blame').textContent, 'No blame here.');
    const first = h.querySelector('[data-message-id="m1"]');
    assert.ok(first.textContent.includes(redFlagString('changed_bank_details', set().messages[0])));
    assert.ok(first.textContent.includes('The payment would go to the sender.'));
    assert.equal(h.querySelector('[data-message-id="m2"]'), null, 'a fully-correct item gets no card');
    assert.equal(h.querySelector('[data-message-id="m3"]'), null);
    assert.ok(!/fell for|your fault|stupid/i.test(h.textContent));
    h.querySelector('.aw-finish').click();
    assert.equal(finished, 1);
});

test('debrief (Cut A): everything right shows one short line and no cards', () => {
    const h = host();
    const allRight = {
        percent: 100, headline: 'Sharp', reportRate: 1, verifyCount: 0,
        answers: [
            { id: 'm1', verdict: 'report', flags: ['lookalike_domain', 'changed_bank_details'], score: 100 },
            { id: 'm2', verdict: 'trust', flags: [], score: 100 },
            { id: 'm3', verdict: 'trust', flags: [], score: 100 }
        ]
    };
    const d = renderDebrief(h, { result: allRight, set: set(), strings: {}, variant: 'full', onFinish() {} });
    assert.equal(h.querySelectorAll('.aw-card').length, 0);
    assert.equal(d.getState().items, 0);
    assert.ok(h.querySelector('.aw-all-right'), 'a short all-right line stands in for the cards');
    assert.equal(h.querySelector('.aw-weakest'), null, 'no weakest line when nothing was missed');
    assert.ok(h.querySelector('.aw-monday'), 'the Monday card stays');
    // N-17: "a miss is no reflection on you" answers a miss; with nothing missed it is not shown.
    assert.equal(h.querySelector('.aw-no-blame'), null, 'no no-blame line when nothing was missed');
    assert.equal(d.getState().noBlame, false);
});

test('debrief summary (N7): phish caught, and how, instead of a bare report percentage', () => {
    const h = host();
    renderDebrief(h, { result: { percent: 97, headline: 'Sharp', reportRate: 2 / 3, reportCount: 2, phishCaught: 3, phishTotal: 3,
        phishVerified: 1, verifyCount: 1, answers: [] }, set: set(), strings: {}, onFinish() {} });
    const t = h.querySelector('.aw-summary').textContent;
    assert.match(t, /Phish caught: 3 of 3 \(2 reported, 1 checked by another route\)/);
    assert.doesNotMatch(t, /Reported 67%/);
});

test('debrief (Cut A): a weakest-skill line appears when a tell was missed and perFactor is present', () => {
    const h = host();
    const r = {
        percent: 60, headline: 'Getting there',
        perFactor: { senderTrust: { caught: 0, missed: 2 }, pretextRelevant: { caught: 1, missed: 0 } },
        answers: [{ id: 'm1', verdict: 'trust', flags: [], score: 0 }]
    };
    renderDebrief(h, { result: r, set: set(), strings: {}, variant: 'full', onFinish() {} });
    assert.equal(h.querySelectorAll('.aw-card').length, 1);
    const weak = h.querySelector('.aw-weakest');
    assert.ok(weak, 'the weakest-skill line is shown');
    assert.match(weak.textContent, /caught 0 of 2/);
});

test('debrief: call and prompt cards use their own action words and lines (D3), never a raw id heading (D2)', () => {
    const h = host();
    const callSet = { id: 'e3', messages: [
        { id: 'e3_call_gordon_impostor', kind: 'call', callerId: 'Gordon McLeish, Claims (calling from a mobile)',
          truth: { isPhish: true, flags: ['vish_callback_pressure'] } },
        { id: 'e3_push_early', kind: 'push', push: { app: 'Authenticator' },
          truth: { isPhish: true, flags: ['unrequested_mfa_push'] } }
    ] };
    const r = { percent: 50, headline: 'x', answers: [
        { id: 'e3_call_gordon_impostor', verdict: 'verify', action: 'verify_callback', flags: [], score: 60 },
        { id: 'e3_push_early', verdict: 'trust', action: 'approve', flags: [], score: 0 }
    ] };
    renderDebrief(h, { result: r, set: callSet, strings: {}, variant: 'full', onFinish() {} });
    const call = h.querySelector('[data-message-id="e3_call_gordon_impostor"]');
    assert.ok(call, 'the call item is reviewed');
    assert.match(call.querySelector('.aw-card-title').textContent, /Gordon McLeish/, 'heading is the caller, not the id');
    assert.ok(!/e3_call_gordon_impostor/.test(call.querySelector('.aw-card-title').textContent));
    assert.match(call.querySelector('.aw-card-verdict').textContent, /^You chose Ring back\./, 'the call action label');
    const push = h.querySelector('[data-message-id="e3_push_early"]');
    assert.match(push.querySelector('.aw-card-verdict').textContent, /^You chose Approve\./, 'the prompt action label');
});

test('debrief defendOnly shows its string and no flip wording', () => {
    const h = host();
    renderDebrief(h, { result: result(), set: set(), strings: { defendOnly: 'You skipped the writing step.' }, variant: 'defendOnly', onFinish() {} });
    assert.equal(h.querySelector('.aw-defend-only').textContent, 'You skipped the writing step.');
    assert.ok(h.querySelector('.aw-no-blame'));
    assert.ok(!/your message|you wrote|flip/i.test(h.textContent));
    const h2 = host();
    renderDebrief(h2, { result: result(), set: set(), strings: {}, variant: 'full', onFinish() {} });
    assert.equal(h2.querySelector('.aw-defend-only'), null);
});

test('every string goes through textContent: HTML-like text renders as text', () => {
    const evil = '<img src=x onerror="window.pwned=1"><b>bold</b>';
    const h = host();
    renderFlipView(h, {
        message: { ...sent(), subject: evil, body: evil, factorStrings: { senderTrust: { redFlag: evil } } },
        strings: { flipHeading: evil, flipIntro: evil, flipDefenderLine: evil }, onContinue() {}
    });
    assert.equal(h.querySelector('.aw-flip').querySelectorAll('img[src="x"], b').length, 0);
    assert.ok(h.querySelector('.aw-heading').textContent === evil);
    assert.ok([...h.querySelectorAll('.aw-tell')].some((n) => n.textContent === evil));

    const h2 = host();
    renderDebrief(h2, {
        result: { percent: 50, headline: evil, answers: [{ id: 'x', verdict: 'report', flags: [], score: 60 }] },
        set: { messages: [{ id: 'x', subject: evil, from: { name: evil, address: '' }, truth: { isPhish: true, flags: ['senderTrust'], perFlagNote: { senderTrust: evil }, ifTrusted: evil } }] },
        strings: { mondayCard: evil, noBlameLine: evil, defendOnly: evil }, variant: 'defendOnly', onFinish() {}
    });
    assert.equal(h2.querySelectorAll('img, b').length, 0);
    assert.equal(h2.querySelector('.aw-monday').textContent, evil);
    assert.equal(window.pwned, undefined);

    const h3 = host();
    renderStepStrip(h3, { stages: ['brief'], current: 'brief', labels: { brief: evil }, brand: { logoText: evil } });
    assert.equal(h3.querySelectorAll('img, b').length, 0);
});

test('skin: tokens defined and reduced motion turns the report animation off', () => {
    for (const t of ['--aw-accent', '--aw-ink', '--aw-surface']) assert.ok(css.includes(`${t}:`), t);
    assert.match(css, /\.aw-report-win\s*\{[^}]*animation:\s*aw-report-pop/);
    const m = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/.exec(css);
    assert.ok(m, 'reduced-motion block present');
    assert.match(m[1], /\.aw-report-win[^{]*\{\s*animation:\s*none/);
    assert.ok(!/url\(/i.test(css), 'no image assets');
});

// ── P7-P: the page, call and missed flips ──────────────────────────────────────

test('flip with a built page draws the page card and its tells; with the email too, the page tells move under the page', () => {
    const h = host();
    const page = { url: 'https://quayho1t-sso.example/', padlock: true, heading: 'Sign in again', fields: ['Email address', 'Password'],
        button: 'Sign in again', tells: ['domain'] };
    const flip = renderFlipView(h, { page, strings: {}, onContinue() {} });
    assert.ok(h.querySelector('.aw-flip-page .tri-kind-page'));
    assert.equal(h.querySelector('.tri-address').textContent, 'https://quayho1t-sso.example/');
    assert.deepEqual(flip.getState(), { shown: 'page', parts: ['page'], tells: ['The address bar shows a look-alike of the real address.'] });
    flip.destroy();

    const h2 = host();
    const message = { ...sent(), truth: { isPhish: true, flags: ['senderTrust', 'formOrigin', 'hoverMismatch'] } };
    const both = renderFlipView(h2, { message, page, strings: {}, onContinue() {} });
    const st = both.getState();
    assert.deepEqual(st.parts, ['message', 'page']);
    assert.equal(h2.querySelectorAll('.aw-flip-section').length, 2);
    const lists = [...h2.querySelectorAll('.aw-tells')].map((ul) => [...ul.children].map((li) => li.dataset.flag));
    assert.deepEqual(lists, [['senderTrust', 'hoverMismatch'], ['domain', 'formOrigin']]);
    assert.equal(h2.querySelectorAll('.aw-defender-line').length, 1);
});

test('flip with a built page and its choices draws it with the builder renderer: same button face and logo (P4-1)', () => {
    const h = host();
    const pageDef = { id: 'sso', brands: [{ id: 'quayholt', name: 'Quayholt', domains: [{ id: 'd1', domain: 'quayholt-sso.example' }] }],
        purposes: [{ id: 'expired', label: 'Session expired', button: 'Sign in again' }], wordings: [] };
    const choices = { brand: 'quayholt', domainId: 'd1', purpose: 'expired', logo: 'crisp', fields: ['email', 'password'], padlock: true };
    const page = { url: 'https://quayholt-sso.example/', padlock: true, heading: 'Session expired', fields: ['Email address', 'Password'],
        button: 'Sign in again', tells: ['domain'], pageDef, choices };
    renderFlipView(h, { page, strings: {}, onContinue() {} });
    assert.ok(h.querySelector('.aw-flip-page .lpb-preview.aw-flip-built'), 'builder renderer used');
    assert.ok(!h.querySelector('.aw-flip-page .tri-kind-page'));
    assert.equal(h.querySelector('.lpb-submit').textContent, 'Sign in again');
    assert.equal(h.querySelector('.lpb-purpose').textContent, 'Session expired');
    assert.match(h.querySelector('.lpb-logo-img').getAttribute('src'), /logo-quayholt\.png$/);
    assert.equal(h.querySelector('.lpb-address-text').textContent, 'quayholt-sso.example');
});

test('flip with a call draws the call card with its claims and the notes', () => {
    const h = host();
    const call = { callerId: 'Says they are Gordon McLeish', claims: [{ fact: 'staffId', value: 'QH-20719' }],
        transcript: [{ who: 'Caller', text: 'My staff reference is QH-20719.' }], notes: ['A callback to the number on file defeats every line here.'] };
    const flip = renderFlipView(h, { call, strings: { flipCallIntro: 'From the desk.' }, onContinue() {} });
    assert.ok(h.querySelector('.aw-flip-call .tri-kind-call'));
    assert.equal(h.querySelector('.tri-claim-value').textContent, 'QH-20719');
    assert.ok(h.textContent.includes('From the desk.'));
    assert.deepEqual(flip.getState(), { shown: 'call', parts: ['call'], tells: call.notes });
});

test('flip with missed: true shows flipMissed, not flipNoSend', () => {
    const h = host();
    const flip = renderFlipView(h, { message: null, missed: true, strings: { flipMissed: 'It did not land.', flipNoSend: 'Nothing sent.' }, onContinue() {} });
    assert.equal(h.querySelector('.aw-missed').textContent, 'It did not land.');
    assert.equal(h.querySelector('.aw-no-send'), null);
    assert.deepEqual(flip.getState(), { shown: 'missed', parts: ['missed'], tells: [] });
    const h2 = host();
    renderFlipView(h2, { missed: true, onContinue() {} });
    assert.ok(h2.querySelector('.aw-missed').textContent.startsWith('Your attempt did not land'));
});

test('debrief: the optional concept and voice panels render as plain text, between the cards and the Monday card', () => {
    const evil = '<img src=x onerror="window.pwned=1"><b>macro</b>';
    const h = host();
    const d = renderDebrief(h, { result: result(), set: set(), variant: 'full', onFinish() {},
        strings: { conceptPanel: `Why enable content matters. ${evil}\n\nA real CV never needs it.`,
                   voicePanel: { heading: 'Voices can be copied', text: 'Ring back on a number you hold.' } } });
    assert.deepEqual(d.getState(), { items: 1, mondayCard: true, noBlame: true, conceptPanel: true, voicePanel: true, reportRoute: null, ruleOfThumb: false, teamProtected: null, genuine: { trusted: 1, checked: 0, flagged: 1 } });
    const concept = h.querySelector('.aw-concept-panel');
    assert.equal(concept.querySelector('.aw-panel-heading').textContent, 'How it works');
    assert.deepEqual([...concept.querySelectorAll('.aw-panel-text')].map((p) => p.textContent),
        [`Why enable content matters. ${evil}`, 'A real CV never needs it.']);
    assert.equal(concept.querySelector('img, b'), null, 'never parsed as HTML');
    assert.equal(window.pwned, undefined);
    const voice = h.querySelector('.aw-voice-panel');
    assert.equal(voice.querySelector('.aw-panel-heading').textContent, 'Voices can be copied');
    assert.equal(voice.querySelector('.aw-panel-text').textContent, 'Ring back on a number you hold.');
    const order = [...h.querySelector('.aw-debrief').children].map((n) => n.className.split(' ').find((c) => c.startsWith('aw-')));
    assert.ok(order.indexOf('aw-cards') < order.indexOf('aw-panel'));
    assert.ok(order.lastIndexOf('aw-panel') < order.indexOf('aw-monday'));
    // a string panel alone gets the default voice heading; blank or missing panels are left out
    const h2 = host();
    const d2 = renderDebrief(h2, { result: result(), set: set(), variant: 'defendOnly', onFinish() {},
        strings: { voicePanel: 'A voice is not proof of who is speaking.', conceptPanel: '   ' } });
    assert.equal(h2.querySelector('.aw-voice-panel .aw-panel-heading').textContent, 'A voice is not proof');
    assert.equal(h2.querySelector('.aw-concept-panel'), null);
    assert.equal(d2.getState().conceptPanel, false);
    assert.ok(/\.aw-panel\s*\{/.test(css), 'the skin styles the panels');
});

test('debrief (ENG-09b): a conceptPanel array renders one panel per entry, in order; a one-panel form is unchanged', () => {
    const evil = '<b>x</b>';
    const h = host();
    const d = renderDebrief(h, { result: result(), set: set(), variant: 'full', onFinish() {},
        strings: { conceptPanel: [
            { heading: 'What happened', text: `Para one. ${evil}\n\nPara two.` },
            { text: 'No heading here.' },
            { heading: 'Blank', text: '  ' },
            { heading: 'What to do', text: 'Report it.' }
        ], voicePanel: 'A voice is not proof.' } });
    const panels = [...h.querySelectorAll('.aw-concept-panel')];
    assert.deepEqual(panels.map((p) => p.querySelector('.aw-panel-heading').textContent), ['What happened', 'How it works', 'What to do']);
    assert.deepEqual([...panels[0].querySelectorAll('.aw-panel-text')].map((p) => p.textContent), [`Para one. ${evil}`, 'Para two.']);
    assert.equal(panels[0].querySelector('b'), null, 'never parsed as HTML');
    assert.deepEqual(d.getState(), { items: 1, mondayCard: true, noBlame: true, conceptPanel: true, voicePanel: true, conceptPanels: 3, reportRoute: null, ruleOfThumb: false, teamProtected: null, genuine: { trusted: 1, checked: 0, flagged: 1 } });
    // every concept panel sits before the voice panel and the Monday card
    const order = [...h.querySelector('.aw-debrief').children].map((n) => n.className);
    const lastConcept = order.map((c, i) => (c.includes('aw-concept-panel') ? i : -1)).reduce((a, b) => Math.max(a, b));
    assert.ok(lastConcept < order.findIndex((c) => c.includes('aw-voice-panel')));
    assert.ok(lastConcept < order.findIndex((c) => c.includes('aw-monday')));
    // an array with no usable text draws none; a single object still draws one and reports no count
    const h2 = host();
    const d2 = renderDebrief(h2, { result: result(), set: set(), variant: 'full', onFinish() {}, strings: { conceptPanel: [{ text: ' ' }] } });
    assert.equal(h2.querySelector('.aw-concept-panel'), null);
    assert.equal(d2.getState().conceptPanel, false);
    const h3 = host();
    const d3 = renderDebrief(h3, { result: result(), set: set(), variant: 'full', onFinish() {}, strings: { conceptPanel: { heading: 'One', text: 'Only.' } } });
    assert.equal(h3.querySelectorAll('.aw-concept-panel').length, 1);
    assert.equal('conceptPanels' in d3.getState(), false);
});

test('P3 N-6 / flip split: nothing to replay gets the miss heading; a landing with no tells has its own line', () => {
    const h = host();
    renderFlipView(h, { missed: true, strings: { flipHeading: 'Now it lands on you' }, onContinue() {} });
    assert.equal(h.querySelector('.aw-heading').textContent, 'Nothing to replay this time');
    const h2 = host();
    const f2 = renderFlipView(h2, { landedNoTells: true, strings: { flipHeading: 'Now it lands on you', flipMissed: 'Missed.',
        flipLandedNoTells: 'It landed, and nothing in it gave you away.', flipMissedHeading: 'Nothing to show' }, onContinue() {} });
    assert.equal(h2.querySelector('.aw-heading').textContent, 'Nothing to show');
    assert.equal(h2.querySelector('.aw-landed-no-tells').textContent, 'It landed, and nothing in it gave you away.');
    assert.equal(f2.getState().shown, 'landedNoTells');
    const h3 = host();
    renderFlipView(h3, { landedNoTells: true, strings: { flipMissed: 'Fallback line.' }, onContinue() {} });
    assert.equal(h3.querySelector('.aw-missed').textContent, 'Fallback line.', 'falls back to flipMissed');
    const h4 = host();
    renderFlipView(h4, { message: null, page: { url: 'https://x.example/', fields: [] }, strings: { flipHeading: 'Now it lands on you' }, onContinue() {} });
    assert.equal(h4.querySelector('.aw-heading').textContent, 'Now it lands on you', 'a replay keeps the episode heading');
});
