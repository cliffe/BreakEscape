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
    'minigames/helpers/step-stepper.js',
    'minigames/episode-runner/step-strip.js', 'minigames/episode-runner/flip-view.js',
    'utils/global-condition.js', 'minigames/episode-runner/debrief-view.js', 'minigames/inbox-triage/triage-flags.js',
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
const { renderFlipView, tellSentence, defenderLine, globalLine } = await mod('minigames/episode-runner/flip-view.js');
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
    assert.ok(h.querySelector('.aw-strip') === null);
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
    assert.ok(h.querySelector('.aw-wordmark img') === null);
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
    assert.ok(h.querySelector('.aw-flip') === null);
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
    assert.ok(h.querySelector('.mail-reader') === null);
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
    assert.ok(h.querySelector('[data-message-id="m2"]') === null, 'a fully-correct item gets no card');
    assert.ok(h.querySelector('[data-message-id="m3"]') === null);
    assert.ok(!/fell for|your fault|stupid/i.test(h.textContent));
    h.querySelector('.aw-finish').click();
    assert.equal(finished, 1);
});

test('debrief: strings.habitLine draws a per-episode habit line under the shared rule of thumb (launch pick 2026-11-01)', () => {
    const h = host();
    const rule = { heading: 'The habit to keep', text: 'Stop and check it yourself through a route you already trust.' };
    const habit = 'When the official way is too slow, tell IT rather than build your own way round it.';
    const d = renderDebrief(h, { result: result(), set: set(), strings: { mondayCard: 'On Monday.', habitLine: habit }, ruleOfThumb: rule, variant: 'full', onFinish() {} });
    const line = h.querySelector('.aw-habit-line');
    assert.ok(line, 'the habit line is drawn');
    assert.equal(line.textContent, habit);
    // it sits below the shared rule box, not above it
    const ruleBox = h.querySelector('.aw-rule');
    assert.ok(ruleBox && (ruleBox.compareDocumentPosition(line) & 0x04), 'the habit line follows the rule box');
    assert.equal(d.getState().habitLine, true);
});

test('debrief: no strings.habitLine leaves the shared line alone and getState has no habitLine key', () => {
    const h = host();
    const rule = { heading: 'The habit to keep', text: 'Check it yourself.' };
    const d = renderDebrief(h, { result: result(), set: set(), strings: { mondayCard: 'On Monday.' }, ruleOfThumb: rule, variant: 'full', onFinish() {} });
    assert.ok(h.querySelector('.aw-habit-line') === null, 'no habit line when strings.habitLine is unset');
    assert.ok(!('habitLine' in d.getState()), 'getState omits habitLine when unset');
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
    assert.ok(h.querySelector('.aw-weakest') === null, 'no weakest line when nothing was missed');
    assert.ok(h.querySelector('.aw-monday'), 'the Monday card stays');
    // N-17: "a miss is no reflection on you" answers a miss; with nothing missed it is not shown.
    assert.ok(h.querySelector('.aw-no-blame') === null, 'no no-blame line when nothing was missed');
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

test('F-E10-2: the debrief summary keeps the score but does not repeat the band headline (the result card above shows it)', () => {
    const h = host();
    renderDebrief(h, { result: { percent: 72, headline: 'Getting there: a few tells slipped past',
        phishTotal: 1, phishCaught: 1, reportCount: 1, answers: [{ id: 'm1', verdict: 'report', flags: [], score: 100, isPhish: true }] },
        set: set(), strings: {}, onFinish() {} });
    const t = h.querySelector('.aw-summary').textContent;
    assert.match(t, /Round score: 72%/);
    assert.doesNotMatch(t, /Getting there/, 'the band headline is the result card title, not repeated in the summary');
});

test('round-1 fix E1: showScore false drops the score figures (round score, reported %, per-message score); counts stay', () => {
    const hidden = host();
    renderDebrief(hidden, { result: result(), set: set(), strings: {}, variant: 'full', onFinish() {}, showScore: false });
    const hs = hidden.querySelector('.aw-summary')?.textContent ?? '';
    assert.doesNotMatch(hs, /Round score/);
    assert.doesNotMatch(hs, /Reported/);
    assert.doesNotMatch(hs, /%/, 'no percentage left in the summary');
    assert.ok(hidden.querySelector('.aw-card-score') === null, 'no per-message score line');
    assert.ok(hidden.querySelector('[data-message-id="m1"]'), 'the missed item still gets a card');
    // a count stays (result() has verifyCount 1)
    assert.match(hs, /Checked by another route: 1/);

    const shown = host();
    renderDebrief(shown, { result: result(), set: set(), strings: {}, variant: 'full', onFinish() {} });
    const ss = shown.querySelector('.aw-summary').textContent;
    assert.match(ss, /Round score: 72%/);
    assert.match(ss, /Reported 50% of the phish/);
    assert.ok(shown.querySelector('.aw-card-score'), 'per-message score shows by default');
});

test('debrief (Cut A): a weakest-skill line appears when a tell was missed and perFactor is present', () => {
    const h = host();
    // batch-12 item 3: the weakest line shows once the learner named at least one flag (here a
    // correct pretextRelevant tick), so it never contradicts the "nothing to grade" lead.
    const r = {
        percent: 60, headline: 'Getting there',
        perFactor: { senderTrust: { caught: 0, missed: 2 }, pretextRelevant: { caught: 1, missed: 0 } },
        flagRecall: { caught: 1, total: 3 },
        answers: [{ id: 'm1', verdict: 'trust', flags: ['pretextRelevant'], score: 0 }]
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

test('debrief summary counter follows labels.phishCaughtLabel for a non-phishing set (E17)', () => {
    const h = host();
    const set2 = { id: 'e17', labels: { phishCaughtLabel: 'Requests handled' },
        messages: [{ id: 'm', kind: 'email', subject: 'S', truth: { isPhish: true, flags: ['x'] } }] };
    const r = { percent: 80, headline: 'ok', phishTotal: 1, phishCaught: 1, reportCount: 1,
        answers: [{ id: 'm', verdict: 'report', flags: ['x'], score: 100, isPhish: true }] };
    renderDebrief(h, { result: r, set: set2, strings: {}, variant: 'full', onFinish() {} });
    const summary = h.querySelector('.aw-summary').textContent;
    assert.match(summary, /Requests handled: 1 of 1/);
    assert.doesNotMatch(summary, /Phish caught/);
});

test('debrief: a relabelled email verdict uses the set label and an overridable feedback line (F-E10-2)', () => {
    const h = host();
    const relSet = {
        id: 'e10',
        labels: {
            verdict: { delete: { label: 'Go the trusted way' } },
            verdictFeedback: { delete: { phish: 'Skip it and use Quayholt Apps or the service desk number you hold.' } }
        },
        messages: [{ id: 'e10_lock', kind: 'email', subject: 'Your computer is locked', from: { name: 'Support' },
            truth: { isPhish: true, flags: ['urgencyCalibrated'] } }]
    };
    const r = { percent: 70, headline: 'x', answers: [
        { id: 'e10_lock', verdict: 'delete', action: 'delete', flags: [], score: 30, isPhish: true }
    ] };
    renderDebrief(h, { result: r, set: relSet, strings: {}, variant: 'full', onFinish() {} });
    const card = h.querySelector('[data-message-id="e10_lock"]');
    const verdict = card.querySelector('.aw-card-verdict').textContent;
    // The relabelled word, not "Delete"; the override line, not "Deleting protects you".
    assert.match(verdict, /^You chose Go the trusted way\./);
    assert.ok(!/Delete/.test(verdict), 'the engine word does not leak');
    assert.match(verdict, /Skip it and use Quayholt Apps/);
    assert.ok(!/Deleting protects you/.test(verdict));
});

test('debrief defendOnly shows its string and no flip wording', () => {
    const h = host();
    renderDebrief(h, { result: result(), set: set(), strings: { defendOnly: 'You skipped the writing step.' }, variant: 'defendOnly', onFinish() {} });
    assert.equal(h.querySelector('.aw-defend-only').textContent, 'You skipped the writing step.');
    assert.ok(h.querySelector('.aw-no-blame'));
    assert.ok(!/your message|you wrote|flip/i.test(h.textContent));
    const h2 = host();
    renderDebrief(h2, { result: result(), set: set(), strings: {}, variant: 'full', onFinish() {} });
    assert.ok(h2.querySelector('.aw-defend-only') === null);
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

test('the page section heading defaults to "The page it links to" and is overridable (E10 MA4)', () => {
    const message = { ...sent(), truth: { isPhish: true, flags: ['senderTrust'] } };
    const page = { url: 'https://fernside.example/verify', padlock: true, heading: 'Verify you are human',
        fields: ['Tick to continue'], button: 'Continue', tells: ['wording'] };

    // Default: unchanged for every built episode.
    const h = host();
    renderFlipView(h, { message, page, strings: {}, onContinue() {} });
    const headings = [...h.querySelectorAll('.aw-flip-section')].map((n) => n.textContent);
    assert.deepEqual(headings, ['The message', 'The page it links to']);

    // Override: a no-link fake-check design names the page without claiming a link.
    const h2 = host();
    renderFlipView(h2, { message, page, strings: { flipPageHeading: 'The page you built' }, onContinue() {} });
    const headings2 = [...h2.querySelectorAll('.aw-flip-section')].map((n) => n.textContent);
    assert.deepEqual(headings2, ['The message', 'The page you built']);
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
    assert.ok(h.querySelector('.aw-no-send') === null);
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
    assert.ok(concept.querySelector('img, b') === null, 'never parsed as HTML');
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
    assert.ok(h2.querySelector('.aw-concept-panel') === null);
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
    assert.ok(panels[0].querySelector('b') === null, 'never parsed as HTML');
    assert.deepEqual(d.getState(), { items: 1, mondayCard: true, noBlame: true, conceptPanel: true, voicePanel: true, conceptPanels: 3, reportRoute: null, ruleOfThumb: false, teamProtected: null, genuine: { trusted: 1, checked: 0, flagged: 1 } });
    // every concept panel sits before the voice panel and the Monday card
    const order = [...h.querySelector('.aw-debrief').children].map((n) => n.className);
    const lastConcept = order.map((c, i) => (c.includes('aw-concept-panel') ? i : -1)).reduce((a, b) => Math.max(a, b));
    assert.ok(lastConcept < order.findIndex((c) => c.includes('aw-voice-panel')));
    assert.ok(lastConcept < order.findIndex((c) => c.includes('aw-monday')));
    // an array with no usable text draws none; a single object still draws one and reports no count
    const h2 = host();
    const d2 = renderDebrief(h2, { result: result(), set: set(), variant: 'full', onFinish() {}, strings: { conceptPanel: [{ text: ' ' }] } });
    assert.ok(h2.querySelector('.aw-concept-panel') === null);
    assert.equal(d2.getState().conceptPanel, false);
    const h3 = host();
    const d3 = renderDebrief(h3, { result: result(), set: set(), variant: 'full', onFinish() {}, strings: { conceptPanel: { heading: 'One', text: 'Only.' } } });
    assert.equal(h3.querySelectorAll('.aw-concept-panel').length, 1);
    assert.equal('conceptPanels' in d3.getState(), false);
});

test('debrief: a conceptPanel entry with a condition draws only when it holds against the live globals', () => {
    const panels = [
        { heading: 'Always', text: 'Shown to everyone.' },
        { heading: 'Only after', text: 'Needs the global.', condition: 'globalVars.kit_x === true' },
        { heading: 'Tail', text: 'Also unconditional.' }
    ];
    const heads = (globals, cp = panels, extra = {}) => {
        const h = host();
        const d = renderDebrief(h, { result: result(), set: set(), variant: 'full', onFinish() {}, globals, strings: { conceptPanel: cp }, ...extra });
        return { heads: [...h.querySelectorAll('.aw-concept-panel .aw-panel-heading')].map((n) => n.textContent), state: d.getState(), h };
    };
    // holds: all three, order kept; the count reads what was drawn
    let r = heads({ kit_x: true });
    assert.deepEqual(r.heads, ['Always', 'Only after', 'Tail']);
    assert.equal(r.state.conceptPanels, 3);
    // does not hold, missing, or no globals at all: the entry is skipped, the rest keep their order
    for (const g of [{ kit_x: false }, {}, null, undefined]) {
        r = heads(g);
        assert.deepEqual(r.heads, ['Always', 'Tail'], JSON.stringify(g));
        assert.equal(r.state.conceptPanels, 2);
    }
    // a negated term on a missing global holds in the evaluator, but with no globals object it is hidden
    const neg = [{ heading: 'Plain', text: 'Plain.' }, { heading: 'Neg', text: 'Negated.', condition: '!globalVars.kit_y' }];
    assert.deepEqual(heads(null, neg).heads, ['Plain']);
    assert.deepEqual(heads({}, neg).heads, ['Plain', 'Neg']);
    // a malformed or non-string condition fails closed
    for (const bad of ['globalVars.a (', '', 7, null, {}]) {
        r = heads({ a: true }, [{ text: 'Plain.', heading: 'P' }, { heading: 'Bad', text: 'Bad.', condition: bad }]);
        assert.deepEqual(r.heads, ['P'], String(bad));
    }
    // every entry conditional and none holds: no panel at all
    r = heads({}, [{ text: 'A.', condition: 'globalVars.q' }]);
    assert.equal(r.state.conceptPanel, false);
    // the single-object and string forms ignore condition
    r = heads({}, { heading: 'One', text: 'Only.', condition: 'globalVars.q' });
    assert.deepEqual(r.heads, ['One']);
    // hostile text is drawn as text; the condition string is never drawn
    const evil = '<img src=x onerror=alert(1)>';
    r = heads({ kit_x: true }, [{ heading: evil, text: evil, condition: `globalVars.kit_x === true` }, { text: 'P.', condition: `globalVars.kit_x || '${evil}'` }]);
    assert.ok(r.h.querySelector('img') === null, 'never parsed as HTML');
    assert.ok(!r.h.innerHTML.includes('globalVars.kit_x'), 'the condition is not in the DOM');
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

// ── ca10: the flip's page intro and defender line follow the host the learner chose ──
test('flip page intro and defender line follow page.hostId when the strings carry per-host lines; otherwise the base lines', () => {
    const strings = {
        flipPageIntro: 'Base intro.', flipDefenderLine: 'Base defender.',
        flipPageIntroByHost: { genuine: 'Bookmark intro.', lookalike: 'Link intro.' },
        flipDefenderLineByHost: { genuine: 'Bookmark defender.', lookalike: 'Link defender.' }
    };
    const run = (hostId) => {
        const h = host();
        renderFlipView(h, { page: { url: 'https://x.example/', fields: [], hostId }, strings, onContinue() {} });
        return [h.querySelector('.aw-lead').textContent, h.querySelector('.aw-defender-line').textContent];
    };
    assert.deepEqual(run('genuine'), ['Bookmark intro.', 'Bookmark defender.']);
    assert.deepEqual(run('lookalike'), ['Link intro.', 'Link defender.']);
    assert.deepEqual(run('unrelated'), ['Base intro.', 'Base defender.']);
    assert.deepEqual(run(null), ['Base intro.', 'Base defender.']);
    assert.equal(defenderLine(strings, null, false, 'lookalike'), 'Link defender.');
});

test('D286 debrief: debriefHostLineByHost draws the line for the chosen host; no host or an unknown id draws none', () => {
    const t = readFileSync(join(here, '../../scenarios/ca10_downloads_and_fake_checks/scenario.json.erb'), 'utf8');
    const body = t.match(/"debriefHostLineByHost": \{([^}]*)\}/)[1];
    const byHost = JSON.parse('{' + body + '}');
    assert.deepEqual(Object.keys(byHost).sort(), ['genuine', 'lookalike', 'unrelated']);
    assert.match(byHost.lookalike, /look-alike address.*quick glance.*right-hand end/);
    assert.match(byHost.genuine, /broken into.*gave nothing away.*paste and run/);
    assert.match(byHost.unrelated, /nothing to do with Fernside.*easiest sign/);
    const strings = { mondayCard: 'On Monday.', debriefHostLineByHost: byHost };
    for (const id of ['genuine', 'lookalike', 'unrelated']) {
        const h = host();
        renderDebrief(h, { result: result(), set: set(), strings, hostId: id, variant: 'full', onFinish() {} });
        const lines = [...h.querySelectorAll('.aw-host-line')];
        assert.equal(lines.length, 1, id);
        assert.equal(lines[0].textContent, byHost[id]);
    }
    for (const id of [null, undefined, 'other']) {
        const h = host();
        renderDebrief(h, { result: result(), set: set(), strings, hostId: id, variant: 'full', onFinish() {} });
        assert.equal(h.querySelectorAll('.aw-host-line').length, 0, String(id));
    }
    const h = host();
    renderDebrief(h, { result: result(), set: set(), strings: { mondayCard: 'On Monday.' }, hostId: 'lookalike', variant: 'full', onFinish() {} });
    assert.equal(h.querySelectorAll('.aw-host-line').length, 0);
});

// ── CA pilots E5: a flip line chosen by global ──
test('E5 defenderLine(): flipDefenderLineByGlobal, first truthy global wins, after NoSpray and ByHost, before ByChoice', () => {
    const strings = {
        flipDefenderLine: 'Neutral.',
        flipDefenderLineByChoice: { t1: 'Choice.' },
        flipDefenderLineByHost: { h1: 'Host.' },
        flipDefenderLineNoSpray: 'NoSpray.',
        flipDefenderLineByGlobal: [
            { global: 'ca12_tailgated', line: 'Tailgated.' },
            { global: 'ca12_desk_pass', line: 'Desk pass.' },
            { global: 'ca12_door_missed', line: 'Missed.' },
            { global: 'ca12_guard_alerted', line: 'Alerted.' },
            { global: 'ca12_challenged', line: 'Challenged.' }
        ]
    };
    // each ending picks its line
    for (const [g, line] of [['ca12_tailgated', 'Tailgated.'], ['ca12_desk_pass', 'Desk pass.'], ['ca12_door_missed', 'Missed.'], ['ca12_guard_alerted', 'Alerted.'], ['ca12_challenged', 'Challenged.']]) {
        assert.equal(defenderLine(strings, null, false, null, { [g]: true }), line, g);
    }
    // order: the list order decides, not the globals' key order (reported sets alerted and challenged)
    assert.equal(defenderLine(strings, null, false, null, { ca12_challenged: true, ca12_guard_alerted: true }), 'Alerted.');
    // falsy globals are skipped
    assert.equal(defenderLine(strings, null, false, null, { ca12_tailgated: false, ca12_desk_pass: 1 }), 'Desk pass.');
    // fallback: none truthy, no globals, or a missing map -> the neutral line
    assert.equal(defenderLine(strings, null, false, null, { other: true }), 'Neutral.');
    assert.equal(defenderLine(strings, null, false, null, null), 'Neutral.');
    assert.equal(defenderLine(strings, null), 'Neutral.');
    // precedence: after NoSpray and ByHost, before ByChoice
    const g = { ca12_tailgated: true };
    assert.equal(defenderLine(strings, 't1', true, 'h1', g), 'NoSpray.');
    assert.equal(defenderLine(strings, 't1', false, 'h1', g), 'Host.');
    assert.equal(defenderLine(strings, 't1', false, null, g), 'Tailgated.');
    assert.equal(defenderLine(strings, 't1', false, null, {}), 'Choice.');
    // malformed entries are skipped
    assert.equal(defenderLine({ flipDefenderLine: 'N.', flipDefenderLineByGlobal: [null, { global: 'a', line: '' }, { line: 'x' }, { global: 'a', line: 'Ok.' }] }, null, false, null, { a: true }), 'Ok.');
    // absent field: existing behaviour unchanged
    assert.equal(defenderLine({ flipDefenderLine: 'Base.', flipDefenderLineByChoice: { t1: 'Choice.' } }, 't1', false, null, { a: true }), 'Choice.');
    assert.equal(defenderLine({ flipDefenderLine: 'Base.' }, null, false, null, { a: true }), 'Base.');
});

test('E5 renderFlipView passes globals to the defender line', () => {
    const strings = { flipDefenderLine: 'Base.', flipDefenderLineByGlobal: [{ global: 'g1', line: 'By global.' }] };
    const run = (globals) => {
        const h = host();
        renderFlipView(h, { page: { url: 'https://x.example/', fields: [] }, strings, globals, onContinue() {} });
        return h.querySelector('.aw-defender-line').textContent;
    };
    assert.equal(run({ g1: true }), 'By global.');
    assert.equal(run({}), 'Base.');
    assert.equal(run(undefined), 'Base.');
});

test('E5 renderFlipView: a missed call flip (walked_away, reported) reads ByGlobal, with an optional heading; none matching keeps flipMissed', () => {
    const strings = {
        flipMissed: 'Generic miss.', flipMissedHeading: 'Nothing to replay this time', flipDefenderLine: 'Neutral.',
        flipDefenderLineByGlobal: [
            { global: 'ca12_tailgated', line: 'Tailgated.', heading: 'You walked in' },
            { global: 'ca12_guard_alerted', line: 'Alerted.' },
            { global: 'ca12_world_done', line: 'Never got past the lobby.' }
        ]
    };
    const run = (globals, over = {}) => {
        const h = host();
        renderFlipView(h, { call: null, missed: true, strings, globals, onContinue() {}, ...over });
        return { line: h.querySelector('.aw-defender-line')?.textContent, missed: h.querySelector('.aw-missed')?.textContent, heading: h.querySelector('h2, h3')?.textContent };
    };
    const tail = run({ ca12_tailgated: true });
    assert.equal(tail.line, 'Tailgated.');
    assert.equal(tail.missed, undefined, 'flipMissed is replaced, not added');
    assert.equal(tail.heading, 'You walked in');
    const alerted = run({ ca12_guard_alerted: true });
    assert.equal(alerted.line, 'Alerted.');
    assert.equal(alerted.heading, 'Nothing to replay this time', 'no heading on the entry: flipMissedHeading');
    assert.equal(run({ ca12_world_done: true }).line, 'Never got past the lobby.', 'the timeout comes from an explicit last entry');
    const none = run({});
    assert.equal(none.line, undefined);
    assert.equal(none.missed, 'Generic miss.');
    assert.equal(run(null).missed, 'Generic miss.');
    // landedNoTells reads it too
    const landed = run({ ca12_guard_alerted: true }, { missed: false, landedNoTells: true });
    assert.equal(landed.line, 'Alerted.');
});

test('E5 globalLine: only own keys of the globals map count', () => {
    const strings = { flipDefenderLineByGlobal: [{ global: 'constructor', line: 'Inherited.' }, { global: 'toString', line: 'Inherited.' }, { global: 'real', line: 'Real.' }] };
    assert.equal(globalLine(strings, {}), null);
    assert.equal(globalLine(strings, { real: true }), 'Real.');
    assert.equal(defenderLine({ flipDefenderLine: 'N.', ...strings }, null, false, null, {}), 'N.');
    assert.equal(globalLine({}, { a: true }), null);
});
