import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

// batch 13 item 6: the no-ticks confirm prompt is on by default now. These tests predate it and
// press Confirm once expecting a lock, so their sets pin it off unless they name it themselves.
const withOneConfirm = (set) => (set && typeof set === 'object' && !('confirmPrompt' in set) ? { ...set, confirmPrompt: false } : set);

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-d227-trims-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/helpers/step-stepper.js',
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/landing-page-builder/landing-page-render.js', 'minigames/landing-page-builder/landing-page-model.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'utils/escape-html.js', 'utils/author-html.js', 'ui/modal-stack.js', 'systems/phish-rules.js',
    'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js',
    'utils/global-condition.js', 'minigames/episode-runner/debrief-view.js', 'minigames/episode-runner/flip-view.js'
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
const ended = [];
window.MinigameFramework = { currentMinigame: null, endMinigame(success, result) { ended.push({ success, result }); } };
window.gameState = { globalVariables: {} };

// D227 A (engine half): the episode runner's timing trims. Compact tell rows (A2), no tick sheet
// after Trust / Let in (A3) and the folded result card (A1), all gated on params.episodeTrims so a
// campaign mission, the lab, a workstation awareness skin, a check and a facilitated run are as before.
// Run with: node test/js/social-d227-trims.test.mjs

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const { InboxTriageMinigame } = await mod('minigames/inbox-triage/inbox-triage-minigame.js');
const { renderDebrief } = await mod('minigames/episode-runner/debrief-view.js');

let current = null;
function open(set, params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    set = withOneConfirm(set);
    const scene = new InboxTriageMinigame(container, { set, social: { triageSets: [set] }, ...params });
    scene._sceneType = 'inbox-triage';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const $ = (s, q) => s.container.querySelector(q);
const $$ = (s, q) => [...s.container.querySelectorAll(q)];
const click = (node) => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const pick = (s, id) => click($(s, `.mail-row[data-id="${id}"]`));
function act(s, id, action, chips = []) {
    pick(s, id);
    click($(s, `.tri-verdict[data-action="${action}"]`));
    for (const c of chips) { const i = $(s, `input[data-chip="${c}"]`); i.checked = true; i.dispatchEvent(new window.Event('change', { bubbles: true })); }
    const confirm = $(s, '.tri-confirm');
    if (confirm) click(confirm);
}
const TRIMS = { episodeTrims: true, foldResult: true, debriefFollows: true };

const realMail = { id: 'real_mail', from: { name: 'Marsh End Eggs', address: 'orders@marshend.example' }, to: 'you@brightwell.example',
    subject: 'Order 4471 confirmed', time: '09:00', body: 'Thanks for the order.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: false, flags: [], whyFine: { default: 'The supplier you order from.' } } };
const phishMail = { id: 'phish_mail', from: { name: 'Tarrowby IT Service Desk', address: 'it-servicedesk@tarrowbey.example' }, to: 'you@brightwell.example',
    subject: 'Scan to keep your sign-in', time: '09:10', body: 'Scan the code before midnight.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: true, flags: ['lookalike_domain', 'urgencyCalibrated'],
        perFlagNote: { lookalike_domain: 'tarrowbey, with an extra e', urgencyCalibrated: 'midnight tonight' } } };
const awareSet = (messages, over = {}) => ({
    id: 'd227', title: 'D227', stage: 'training', scoringProfile: 'awareness', verifyVerdict: true, feedbackMode: 'immediate',
    headerPanel: 'off', glossary: 'closed',
    outcome: { setGlobalPrefix: 'd227_', passPercent: 0 }, messages, ...over
});
const flagRows = (s, id) => $$(s, `[data-message-id="${id}"] .tri-flag, .tri-flag`).map((li) => ({
    word: li.querySelector('.tri-flag-word')?.textContent, text: li.querySelector('.tri-flag-text')?.textContent, cls: li.className }));

// ── A3: no sheet after Trust / Let in ────────────────────────────────────────────

test('A3: Trust locks at once with no sheet; a risky let-in reads "What gave them away:" and earns 0 tell points', () => {
    const s = open(awareSet([phishMail, realMail]), TRIMS);
    click($(s, '.tri-start'));
    pick(s, 'phish_mail');
    click($(s, '.tri-verdict[data-verdict="trust"]'));
    assert.equal($(s, '.tri-sheet'), null, 'no sheet opens');
    const a = s.answers.get('phish_mail');
    assert.ok(a, 'locked straight away');
    assert.deepEqual(a.flags, []);
    assert.equal(a.sheetless, true);
    assert.notEqual(a.unflagged, true, 'no unflagged nudge');
    const rows = flagRows(s, 'phish_mail').filter((r) => r.word);
    assert.ok(rows.length >= 2, 'the tells are listed');
    for (const r of rows) assert.equal(r.word, 'What gave them away:');
    assert.ok(rows.every((r) => /tri-flag-gave/.test(r.cls)));
    assert.ok(!rows.some((r) => r.word === 'Missed:'));
    const per = s._scoreOne(s.messages.find((m) => m.id === 'phish_mail'));
    assert.equal(per.flagPoints, 0, 'no tell points for a let-in');
});

test('A3: a genuine Trust keeps its full 40 tell points and its why-fine line', () => {
    const s = open(awareSet([realMail, phishMail]), TRIMS);
    click($(s, '.tri-start'));
    pick(s, 'real_mail');
    click($(s, '.tri-verdict[data-verdict="trust"]'));
    assert.equal($(s, '.tri-sheet'), null);
    const per = s._scoreOne(s.messages.find((m) => m.id === 'real_mail'));
    assert.equal(per.flagPoints, 40);
    assert.match($(s, '.tri-why-fine')?.textContent || s.container.textContent, /The supplier you order from\./);
});

test('A3: a sheetless answer survives a restore', () => {
    const saved = [];
    const s = open(awareSet([phishMail, realMail]), { ...TRIMS, onProgress: (list) => saved.push(JSON.parse(JSON.stringify(list))) });
    click($(s, '.tri-start'));
    pick(s, 'phish_mail');
    click($(s, '.tri-verdict[data-verdict="trust"]'));
    const last = saved.at(-1);
    assert.ok(last.some((a) => a.id === 'phish_mail' && a.sheetless === true), 'saved with the flag');
    const s2 = open(awareSet([phishMail, realMail]), { ...TRIMS, restoreAnswers: last });
    assert.equal(s2.answers.get('phish_mail')?.sheetless, true);
});

test('A3 gating: with no episodeTrims (campaign, lab, workstation skin) Trust still opens the sheet and Missed stays Missed', () => {
    for (const params of [{}, { skin: 'awareness' }, { episodeTrims: false }]) {
        const s = open(awareSet([phishMail, realMail]), params);
        click($(s, '.tri-start'));
        pick(s, 'phish_mail');
        click($(s, '.tri-verdict[data-verdict="trust"]'));
        assert.ok($(s, '.tri-sheet') || $(s, '.tri-confirm'), 'the sheet opens');
        assert.equal(s.answers.has('phish_mail'), false, 'not locked yet');
    }
});

test('A3 gating: a pre/post check and an end-of-round set are not trimmed even with the flag', () => {
    for (const over of [{ stage: 'pre' }, { stage: 'post' }, { feedbackMode: 'end' }]) {
        const s = open(awareSet([phishMail, realMail], over), TRIMS);
        assert.equal(s.episodeTrims, false, JSON.stringify(over));
        assert.equal(s.foldResult, false);
    }
});

// ── A2: compact tell rows ────────────────────────────────────────────────────

test('A2: a tell row with a note prints the chip label then the note; without trims it is the sentence and the note in brackets', () => {
    const trimmed = open(awareSet([phishMail, realMail]), TRIMS);
    click($(trimmed, '.tri-start'));
    act(trimmed, 'phish_mail', 'report', ['urgencyCalibrated']);
    const rowsT = $$(trimmed, '.tri-flag').map((li) => li.querySelector('.tri-flag-text').textContent);
    const lookalike = rowsT.find((t) => /extra e/.test(t));
    assert.ok(lookalike, 'the note shows');
    assert.doesNotMatch(lookalike, /\(tarrowbey, with an extra e\)/, 'no bracketed note');
    assert.match(lookalike, /\. tarrowbey, with an extra e$/, 'chip label, full stop, then the note');
    const plain = open(awareSet([phishMail, realMail]), {});
    click($(plain, '.tri-start'));
    act(plain, 'phish_mail', 'report', ['urgencyCalibrated']);
    const rowsP = $$(plain, '.tri-flag').map((li) => li.querySelector('.tri-flag-text').textContent);
    assert.ok(rowsP.some((t) => /\(tarrowbey, with an extra e\)$/.test(t)), 'unchanged without trims');
    // a row with no note keeps the old text under the trims; a message's own factor sentence is replaced by the label like the canonical one
    const t3 = open(awareSet([phishMail, realMail]), TRIMS);
    const p3 = open(awareSet([phishMail, realMail]), {});
    assert.equal(t3._flagRowText(phishMail, 'lookalike_domain', ''), p3._flagRowText(phishMail, 'lookalike_domain', ''));
    const own = { ...phishMail, id: 'own', factorStrings: { lookalike_domain: { redFlag: 'Own sentence.' } } };
    assert.equal(p3._flagRowText(own, 'lookalike_domain', 'a note'), 'Own sentence. (a note)');
    assert.doesNotMatch(t3._flagRowText(own, 'lookalike_domain', 'a note'), /Own sentence/);
    assert.match(t3._flagRowText(own, 'lookalike_domain', 'a note'), /\. a note$/);
});

// ── A1: fold ───────────────────────────────────────────────────────────────────

function playAll(s) {
    click($(s, '.tri-start'));
    act(s, 'phish_mail', 'report', ['urgencyCalibrated']);
    click($(s, '.tri-next'));
    act(s, 'real_mail', 'trust');
}

test('A1: a folded round closes at the last "See result" with its result, saved once, and no result card', async () => {
    ended.length = 0;
    let saved = 0;
    const s = open(awareSet([phishMail, realMail]), { ...TRIMS, persistResult: () => { saved += 1; return Promise.resolve({ confirmed: true }); } });
    s.gameState = s.gameState || {};
    playAll(s);
    const next = $(s, '.tri-next');
    assert.ok(next && /See result/.test(next.textContent), 'the last review card offers See result');
    click(next);
    assert.equal($(s, '.tri-result-title'), null, 'no result card');
    assert.equal($(s, '.tri-finish'), null);
    assert.equal(saved, 1, 'the result is saved once');
    assert.equal(typeof s.gameResult.percent, 'number');
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(ended.length, 1, 'the overlay completed');
    assert.equal(ended[0].success, true);
});

test('A1 gating: without foldResult (campaign, lab, facilitated) the result card and Finish are as before', () => {
    for (const params of [{}, { episodeTrims: true, debriefFollows: true, foldResult: false }, { debriefFollows: true, foldResult: true }]) {
        ended.length = 0;
        const s = open(awareSet([phishMail, realMail]), params);
        playAll(s);
        click($(s, '.tri-next'));
        assert.ok($(s, '.tri-result-title'), JSON.stringify(params));
        assert.ok($(s, '.tri-finish'));
        assert.equal(ended.length, 0);
    }
});

test('A1: the debrief opens with the band headline and the score in large type; Round score drops; weakest line gets the nudge or the fallback', async () => {
    const set = awareSet([phishMail, realMail], { nudges: { lookalike_domain: 'Authored next step.' } });
    const s = open(set, TRIMS);
    playAll(s);
    click($(s, '.tri-next'));
    const result = s.gameResult;
    const render = (opts) => {
        const c = document.createElement('div');
        renderDebrief(c, { result, set: opts.set || set, ...opts });
        return c;
    };
    const folded = render({ folded: true, bandHeadline: 'Sharp work', weakestNudge: () => 'Generic next step.' });
    assert.equal(folded.querySelector('.aw-band-headline')?.textContent, 'Sharp work');
    assert.equal(folded.querySelector('.aw-band-score')?.textContent, `${result.percent}%`);
    assert.ok(!folded.textContent.includes('Round score'));
    // the band is the first child of the debrief, before the heading (reading order = visual order)
    assert.ok(folded.querySelector('.aw-debrief')?.firstElementChild?.className === 'aw-band', 'band is first in the DOM');
    assert.ok(folded.querySelector('.aw-debrief')?.children[1]?.className === 'aw-heading', 'heading follows the band');
    // CSL R2 m1: the runner's focus lands on the band, so a screen reader starts at the headline and score
    const bandEl = folded.querySelector('.aw-band');
    assert.ok(bandEl.getAttribute('tabindex') === '-1', 'the band is programmatically focusable');
    const runnerSrc = readFileSync(join(js, 'minigames/episode-runner/episode-runner-minigame.js'), 'utf8');
    const sel = /_focus\(\) \{\s*const target = this\.body\?\.querySelector\?\.\('([^']+)'\)/.exec(runnerSrc)?.[1] || '';
    assert.ok(sel.startsWith('.aw-band,'), `the runner's focus selector starts with the band (got ${sel})`);
    assert.ok(folded.querySelector(sel) === bandEl, 'that selector finds the band first in the folded debrief');
    const weak = folded.querySelector('.aw-weakest')?.textContent || '';
    assert.match(weak, /Authored next step\.$/);
    assert.ok(!weak.includes('Generic next step.'), 'the authored line wins');
    const noAuthored = render({ folded: true, bandHeadline: 'x', set: { ...set, nudges: {} }, weakestNudge: () => 'Generic next step.' });
    assert.match(noAuthored.querySelector('.aw-weakest')?.textContent || '', /Generic next step\.$/, 'the generic fallback carries');
    // not folded: as before
    const plain = render({});
    assert.equal(plain.querySelector('.aw-band'), null);
    assert.match(plain.textContent, /Round score: \d+%/);
    // folded with the score hidden: headline only
    const hidden = render({ folded: true, bandHeadline: 'Sharp work', showScore: false });
    assert.ok(hidden.querySelector('.aw-band-headline'));
    assert.equal(hidden.querySelector('.aw-band-score'), null);
});

test('A1: a folded round reloaded after its last answer lands on the last review card, and "See result" completes', async () => {
    ended.length = 0;
    const saved = [];
    const s = open(awareSet([phishMail, realMail]), { ...TRIMS, onProgress: (l) => saved.push(JSON.parse(JSON.stringify(l))) });
    playAll(s);
    const list = saved.at(-1);
    assert.equal(list.length, 2);
    const s2 = open(awareSet([phishMail, realMail]), { ...TRIMS, restoreAnswers: list });
    assert.equal(ended.length, 0, 'does not close from init');
    const next = $(s2, '.tri-next');
    assert.ok(next, 'a See result button is showing');
    click(next);
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(ended.length, 1);
});

test('A3: the folded debrief names the tells of a let-in risky item "What gave them away:"; other rows and hosts keep "Look for:"', async () => {
    const set = awareSet([phishMail, realMail]);
    const s = open(set, TRIMS);
    click($(s, '.tri-start'));
    pick(s, 'phish_mail');
    click($(s, '.tri-verdict[data-verdict="trust"]'));
    click($(s, '.tri-next'));
    act(s, 'real_mail', 'trust');
    click($(s, '.tri-next'));
    const result = s.gameResult;
    const trusted = result.answers.find((a) => a.id === 'phish_mail');
    assert.equal(trusted.sheetless, true, 'the result carries the flag');
    const words = (opts) => {
        const c = document.createElement('div');
        renderDebrief(c, { result, set, ...opts });
        return [...c.querySelectorAll('[data-message-id="phish_mail"] .aw-flag-word')].map((e) => e.textContent.trim());
    };
    const folded = words({ folded: true, bandHeadline: 'x' });
    assert.ok(folded.length >= 2);
    assert.ok(folded.every((w) => w === 'What gave them away:'), folded.join('|'));
    // a reported (ticked) round has no sheetless flag: stays "Look for:"
    const rep = open(set, TRIMS);
    click($(rep, '.tri-start'));
    act(rep, 'phish_mail', 'report', ['urgencyCalibrated']);
    click($(rep, '.tri-next'));
    act(rep, 'real_mail', 'trust');
    click($(rep, '.tri-next'));
    const c2 = document.createElement('div');
    renderDebrief(c2, { result: rep.gameResult, set, folded: true, bandHeadline: 'x' });
    const w2 = [...c2.querySelectorAll('.aw-flag-word')].map((e) => e.textContent.trim());
    assert.ok(!w2.includes('What gave them away:'));
    // the stored progress list keeps the flag too (reload mid-debrief)
    const { cleanAnswerList } = await import(pathToFileURL(join(js, 'minigames/episode-runner/episode-model.js')));
    assert.equal(cleanAnswerList([{ id: 'a', verdict: 'trust', flags: [], ms: 1, sheetless: true }])[0].sheetless, true);
});
