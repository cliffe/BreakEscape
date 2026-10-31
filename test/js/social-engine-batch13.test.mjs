// Engine batch 13 (awareness build):
//   item 1  the concern form holds back its praise line while a required fact is missing
//   item 2  the debrief recaps the concern form report (facts, required ones left out, conclusion)
//   item 3  a genuine item's Delete feedback: no repeated right-call sentence; the debrief card
//           uses the item's own deleteLine / trustLine
//   item 4  a send-off line under the "Episode finished" panel, straight after Finish only
//   item 5  resumeSpawn: an opt-in respawn point after a reload (default off)
//   item 6  the no-ticks confirm prompt is on by default; confirmPrompt: false turns it off
//   item 7  the top result band reads "Well done:" by default
// Inline fixtures only (no live scenarios, except the m01-m10 "never authors resumeSpawn" guard).
// Run with: node --test test/js/social-engine-batch13.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '../..');
const js = join(repo, 'public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-engine-batch13-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/concern-form/concern-form-minigame.js', 'minigames/concern-form/concern-form-model.js',
    'minigames/sort-drill/sort-drill-minigame.js', 'minigames/sort-drill/sort-drill-model.js',
    'minigames/episode-runner/episode-runner-minigame.js', 'minigames/episode-runner/episode-model.js',
    'minigames/episode-runner/step-strip.js', 'minigames/episode-runner/flip-view.js',
    'minigames/episode-runner/debrief-view.js', 'minigames/episode-runner/role-swap.js', 'systems/episode-starter.js',
    'systems/awareness-measure.js', 'systems/global-writer.js',
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/header-panel.js',
    'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-kinds.js',
    'minigames/landing-page-builder/landing-page-render.js', 'minigames/landing-page-builder/landing-page-model.js',
    'minigames/inbox-triage/triage-flags.js', 'minigames/inbox-triage/triage-scoring.js', 'systems/phish-rules.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'ui/influence-bar.js', 'systems/social-influence.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'ui/modal-stack.js',
    'core/resume-spawn.js'
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
console.error = () => {};
window.eventDispatcher = { emit() {} };
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { SocialOverlayScene } = await load('minigames/framework/social-overlay.js');
const Model = await load('minigames/concern-form/concern-form-model.js');
const { ConcernFormMinigame } = await load('minigames/concern-form/concern-form-minigame.js');
const { SortDrillMinigame } = await load('minigames/sort-drill/sort-drill-minigame.js');
const { EpisodeRunnerMinigame } = await load('minigames/episode-runner/episode-runner-minigame.js');
const { startEpisodeRunner } = await load('systems/episode-starter.js');
const EM = await load('minigames/episode-runner/episode-model.js');
const { renderDebrief } = await load('minigames/episode-runner/debrief-view.js');
const { InboxTriageMinigame } = await load('minigames/inbox-triage/inbox-triage-minigame.js');
const { DEFAULT_BANDS, bandFor } = await load('minigames/inbox-triage/triage-scoring.js');
const { resumeSpawnFor, globalIsSet } = await load('core/resume-spawn.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });

const $ = (s, q) => s.container.querySelector(q);
const $$ = (s, q) => [...s.container.querySelectorAll(q)];
const click = (n) => n.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

// ── fixtures: made-up chips and messages, deliberately not any episode's ─────────
const cfConfig = (over = {}) => ({
    factChips: [
        { id: 'f_offer', kind: 'what', label: 'An outside offer for a copy of the plans', required: true },
        { id: 'f_when', kind: 'when', label: 'Tuesday lunchtime' },
        { id: 'f_where', kind: 'where', label: 'The east stairwell' }
    ],
    conclusionChips: [{ id: 'c_spy', label: 'He is selling us out' }],
    minFacts: 2,
    ...over
});

let currentForm = null;
function openForm(cfg) {
    currentForm?.cleanup();
    FW.currentMinigame = null;
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new ConcernFormMinigame(container, { config: cfg });
    scene._sceneType = 'concern-form';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    currentForm = scene;
    return scene;
}
const chip = (s, id) => $(s, `.cf-chip[data-chip="${id}"]`);
const pick = (s, ...ids) => ids.forEach((id) => click(chip(s, id)));
const begin = (s) => click($(s, '.cf-start'));
const check = (s) => click($(s, '.cf-check'));

// ── item 1 ───────────────────────────────────────────────────────────────────────
test('item 1: no praise line while a required fact is missing; it returns once the fact is in', () => {
    const s = openForm(cfConfig());
    begin(s);
    pick(s, 'f_when', 'f_where'); // enough facts for the praise, but not the required one
    check(s);
    const fb = $(s, '.cf-feedback');
    assert.equal(fb.dataset.tone, 'facts_missing');
    assert.ok(!fb.classList.contains('cf-facts'), 'not painted as the affirmed tone');
    const line = $(s, '.cf-feedback-line').textContent;
    assert.equal(line, Model.DEFAULT_TEXT.feedbackFactsMissing);
    assert.doesNotMatch(line, /^Good\b/, 'the praise is held back');
    assert.equal(s.getTestState().concernForm.live, Model.DEFAULT_TEXT.feedbackFactsMissing, 'the announcement agrees');
    assert.equal($(s, '.cf-finish'), null, 'Done is still held back');
    assert.ok($(s, '.cf-must-add'), 'the missing fact is still named');
    pick(s, 'f_offer');
    check(s);
    assert.equal($(s, '.cf-feedback').dataset.tone, 'facts');
    assert.equal($(s, '.cf-feedback-line').textContent, Model.DEFAULT_TEXT.feedbackFacts);
    assert.ok($(s, '.cf-finish'));
});

test('item 1: the line is overridable, and a form with no required chips praises as before', () => {
    let s = openForm(cfConfig({ strings: { feedbackFactsMissing: 'Not yet: one fact is missing.' } }));
    begin(s);
    pick(s, 'f_when', 'f_where');
    check(s);
    assert.equal($(s, '.cf-feedback-line').textContent, 'Not yet: one fact is missing.');
    s = openForm(cfConfig({ factChips: cfConfig().factChips.map(({ required, ...c }) => c) }));
    begin(s);
    pick(s, 'f_when', 'f_where');
    check(s);
    assert.equal($(s, '.cf-feedback').dataset.tone, 'facts');
    assert.equal($(s, '.cf-feedback-line').textContent, Model.DEFAULT_TEXT.feedbackFacts);
    // shownTone only ever swaps the 'facts' tone
    assert.equal(Model.shownTone({ tone: 'facts_verdict', missingRequired: [{ id: 'x' }] }), 'facts_verdict');
    assert.equal(Model.shownTone({ tone: 'facts', missingRequired: [] }), 'facts');
});

// ── item 2: model ────────────────────────────────────────────────────────────────
test('item 2: concernRecap resolves the kept ids to the episode\'s labels', () => {
    const ep = { concernForm: cfConfig() };
    const cfg = Model.normaliseConfig(cfConfig());
    const record = EM.concernRecord(Model.concernRecord(cfg, ['f_where', 'f_when', 'c_spy']));
    assert.deepEqual(record.factIds, ['f_when', 'f_where'], 'in the config\'s order');
    assert.deepEqual(record.missingRequired, ['f_offer']);
    assert.deepEqual(EM.concernRecap(ep, record), {
        facts: ['Tuesday lunchtime', 'The east stairwell'],
        missing: ['An outside offer for a copy of the plans'],
        conclusion: 'He is selling us out'
    });
    // a record saved before batch 13 (counts only) has no recap; nor does an episode with no form
    assert.equal(EM.concernRecap(ep, { done: true, facts: 2, conclusions: 0, tone: 'facts' }), null);
    assert.equal(EM.concernRecap({}, record), null);
    assert.equal(EM.concernRecap(ep, null), null);
    // readState keeps the ids through a reload
    const state = EM.readState({ id: 'x', stages: ['defend', 'debrief'], concernForm: cfConfig() }, { concern: record });
    assert.deepEqual(state.concern.factIds, ['f_when', 'f_where']);
});

// ── item 2: the debrief section ──────────────────────────────────────────────────
const debriefSet = () => ({ id: 'set', scoringProfile: 'awareness', messages: [] });
function debrief(opts) {
    document.body.innerHTML = '';
    const host = document.createElement('div');
    document.body.appendChild(host);
    const view = renderDebrief(host, { result: { percent: 100, answers: [] }, set: debriefSet(), strings: {}, ...opts });
    return { host, view };
}

test('item 2: the debrief recaps the report: facts, a required one left out, the conclusion left in', () => {
    const { host, view } = debrief({ concernRecap: { facts: ['Tuesday lunchtime', 'The east stairwell'],
        missing: ['An outside offer for a copy of the plans'], conclusion: 'He is selling us out' } });
    const box = host.querySelector('.aw-concern-recap');
    assert.ok(box, 'the section shows');
    assert.equal(box.querySelector('.aw-concern-recap-title').textContent, 'Your report');
    assert.deepEqual([...box.querySelectorAll('.aw-concern-recap-fact')].map((n) => n.textContent),
        ['Tuesday lunchtime', 'The east stairwell']);
    assert.match(box.querySelector('.aw-concern-recap-missing').textContent, /An outside offer for a copy of the plans/);
    assert.match(box.querySelector('.aw-concern-recap-conclusion').textContent, /‘He is selling us out’/);
    assert.equal(box.querySelector('.aw-concern-recap-no-conclusion'), null);
    assert.deepEqual(view.getState().concernRecap, { facts: 2, missing: 1, conclusion: true });
});

test('item 2: no conclusion gets the positive line; strings override every line; absent draws nothing', () => {
    let { host } = debrief({ concernRecap: { facts: ['Tuesday lunchtime'], missing: [], conclusion: '' } });
    assert.ok(host.querySelector('.aw-concern-recap-no-conclusion'));
    assert.equal(host.querySelector('.aw-concern-recap-missing'), null);
    ({ host } = debrief({ concernRecap: { facts: ['Tuesday lunchtime'], missing: ['Offer'], conclusion: 'Guilty' },
        strings: { concernRecapHeading: 'What you filed', concernRecapMissing: 'Missing: {missing}',
            concernRecapConclusion: 'Verdict left in: {conclusion}' } }));
    assert.equal(host.querySelector('.aw-concern-recap-title').textContent, 'What you filed');
    assert.equal(host.querySelector('.aw-concern-recap-missing').textContent, 'Missing: Offer');
    assert.equal(host.querySelector('.aw-concern-recap-conclusion').textContent, 'Verdict left in: Guilty');
    ({ host } = debrief({ concernRecap: { facts: ['A'], missing: [], conclusion: '' }, strings: { concernRecapNoConclusion: '' } }));
    assert.equal(host.querySelector('.aw-concern-recap-no-conclusion'), null, "'' drops the line");
    const plain = debrief({});
    assert.equal(plain.host.querySelector('.aw-concern-recap'), null, 'no recap, no section');
    assert.equal('concernRecap' in plain.view.getState(), false, 'getState unchanged without it');
});

// ── items 2 and 4 in the runner ──────────────────────────────────────────────────
class StubOverlay extends SocialOverlayScene {
    init() { super.init(); this.mountCloseControl(this.gameContainer, 'Close'); }
}
FW.registerScene('episode-runner', EpisodeRunnerMinigame);
FW.registerScene('concern-form', ConcernFormMinigame);
FW.registerScene('sort-drill', SortDrillMinigame);
FW.registerScene('inbox-triage', StubOverlay);

const episode = (extra = {}) => ({
    id: 'b13_fixture_defend', variant: 'defendOnly', stages: ['brief', 'defend', 'debrief'],
    brand: { name: 'Fixture', logoText: 'FIX', accent: '#2f6f5e' },
    defend: { setId: 'fixture_inbox', stage: null }, strings: {}, ...extra
});
const fixtureSet = () => ({
    id: 'fixture_inbox', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'episode_b13_fixture_defend_defend_', passPercent: 0 },
    messages: [{ id: 'm1', from: 'A', subject: 'x', body: 'y' }]
});
const debriefCalls = [];
const deps = {
    renderStepStrip(container) {
        const node = document.createElement('nav');
        container.appendChild(node);
        return { update() {}, destroy() { node.remove(); } };
    },
    renderFlipView() { return { destroy() {} }; },
    renderDebrief(container, opts) {
        debriefCalls.push(opts);
        const b = document.createElement('button');
        b.className = 'stub-finish';
        b.addEventListener('click', () => opts.onFinish());
        container.appendChild(b);
        return { destroy() {} };
    },
    measure() { return { written: true }; },
    startTriage(lockable, options) {
        const params = { requiresKeyboardInput: true, disableClose: true, onComplete: options.onComplete };
        return FW.startMinigame('inbox-triage', null, params) ? params : null;
    },
    now: () => 1
};
function setup(ep) {
    currentForm?.cleanup();
    currentForm = null;
    FW.currentMinigame = null;
    while (FW.currentMinigame) FW.forceCloseMinigame();
    document.body.innerHTML = '';
    debriefCalls.length = 0;
    window.gameState = { globalVariables: { [EM.stateKey(ep.id)]: {}, se_awareness_records: {} } };
    window.gameScenario = { social: { awarenessEpisode: ep, triageSets: [fixtureSet()] } };
    window.mailState = { mailboxes: {}, threads: {}, metrics: {} };
}
const cur = () => FW.currentMinigame;
const rclick = (sel) => { const n = cur().container.querySelector(sel); assert.ok(n, `no ${sel} in ${cur()?._sceneType}`); n.click(); };
const kiosk = (id) => ({ scenarioData: { name: 'Kiosk', minigameData: { episodeId: id } } });

/** brief, the concern form (facts + conclusion), the inbox stub, to the debrief. */
function runToDebrief(ep) {
    setup(ep);
    startEpisodeRunner(kiosk(ep.id), { deps });
    rclick('.epr-start');
    rclick('.epr-launch');
    rclick('.cf-start');
    rclick('.cf-chip[data-chip="f_offer"]');
    rclick('.cf-chip[data-chip="f_when"]');
    rclick('.cf-chip[data-chip="c_spy"]');
    rclick('.cf-check');
    rclick('.cf-finish');
    rclick('.epr-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 90, reportRate: 1, answers: [] };
    cur().complete(true);
    assert.equal(cur().getTestState().episode.stage, 'debrief');
}

test('item 2: the runner hands the debrief the concern recap from the kept record', () => {
    runToDebrief(episode({ concernForm: cfConfig() }));
    assert.deepEqual(debriefCalls.at(-1).concernRecap, {
        facts: ['An outside offer for a copy of the plans', 'Tuesday lunchtime'], missing: [], conclusion: 'He is selling us out'
    });
});

test('item 4: a send-off shows under "Episode finished" straight after Finish, not on a reopen', () => {
    const ep = episode({ concernForm: cfConfig() });
    runToDebrief(ep);
    rclick('.stub-finish');
    const panel = cur().container.querySelector('.epr-finished');
    assert.ok(panel);
    const sendOff = panel.querySelector('.epr-send-off');
    assert.ok(sendOff, 'the send-off shows');
    assert.match(sendOff.textContent, /^Thanks for working through this one\./);
    assert.doesNotMatch(sendOff.textContent, /—/, 'no em dash in learner text');
    // close and reopen the finished episode: the panel again, without the send-off
    FW.forceCloseMinigame();
    startEpisodeRunner(kiosk(ep.id), { deps });
    assert.ok(cur().container.querySelector('.epr-finished'));
    assert.equal(cur().container.querySelector('.epr-send-off'), null, 'a reopen shows no send-off');
});

test('item 4: strings.sendOff replaces the line and an empty string drops it', () => {
    runToDebrief(episode({ concernForm: cfConfig(), strings: { sendOff: 'Nilesh waves you off. Ask first, any time.' } }));
    rclick('.stub-finish');
    assert.equal(cur().container.querySelector('.epr-send-off').textContent, 'Nilesh waves you off. Ask first, any time.');
    runToDebrief(episode({ concernForm: cfConfig(), strings: { sendOff: '' } }));
    rclick('.stub-finish');
    assert.ok(cur().container.querySelector('.epr-finished'));
    assert.equal(cur().container.querySelector('.epr-send-off'), null);
});

// ── item 3 and item 6: the inbox ─────────────────────────────────────────────────
let currentTriage = null;
function openTriage(set) {
    currentTriage?.cleanup?.();
    FW.currentMinigame = null;
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new InboxTriageMinigame(container, { set, social: { triageSets: [set] } });
    scene._sceneType = 'inbox-triage';
    window.MinigameFramework.currentMinigame = scene;
    window.gameState = { globalVariables: {} };
    scene.init();
    scene.start();
    currentTriage = scene;
    return scene;
}
const phish = (id, over = {}) => ({ id, from: { name: 'IT Desk', address: 'it@tarrowbey.example' }, to: 'you@brightwell.example',
    subject: 'Sign in now', time: '09:10', body: 'Sign in.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: true, flags: ['lookalike_domain'] }, ...over });
const real = (id, over = {}) => ({ id, from: { name: 'Marsh End', address: 'orders@marshend.example' }, to: 'you@brightwell.example',
    subject: 'Order', time: '09:00', body: 'Thanks.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: false, flags: [], whyFine: { default: 'A real supplier.' } }, ...over });
const awareSet = (messages, over = {}) => ({
    id: 'b13', title: 'B13', stage: 'training', scoringProfile: 'awareness', verifyVerdict: true, feedbackMode: 'immediate',
    headerPanel: 'off', glossary: 'closed', outcome: { setGlobalPrefix: 'b13_', passPercent: 0 }, messages, ...over
});
const startRound = (s) => { const b = $(s, '.tri-start'); if (b) click(b); };
function answer(s, id, action, { flags = [], none = false } = {}) {
    click($(s, `.mail-row[data-id="${id}"]`));
    click($(s, `.tri-verdict[data-action="${action}"]`));
    for (const f of flags) {
        // a named chip, or '*' for the first chip on the sheet that is not "Nothing looks wrong"
        const i = f === '*' ? $$(s, '.tri-sheet input[data-chip]').find((n) => n.dataset.chip !== 'none') : $(s, `input[data-chip="${f}"]`);
        assert.ok(i, `no chip ${f}`);
        if (!i.checked) click(i);
    }
    if (none) { const i = $(s, 'input[data-chip="none"]'); if (i && !i.checked) click(i); }
    click($(s, '.tri-confirm'));
}
const cardText = (s, id) => $(s, `.tri-review-card[data-message-id="${id}"] .tri-card-verdict`)?.textContent ?? '';

test('item 3: a genuine Delete whose set line already names the right call is not followed by a second one', () => {
    const line = 'That one was a genuine notice, and deleting it left it unread. Trusting it, or checking it first, was the right call here.';
    const s = openTriage(awareSet([real('r1'), phish('p1')], { confirmPrompt: false,
        labels: { verdictFeedback: { delete: { real: line } } } }));
    startRound(s);
    answer(s, 'r1', 'delete');
    const text = cardText(s, 'r1');
    assert.ok(text.includes(line), 'the set line shows');
    assert.equal((text.match(/right call/gi) || []).length, 1, 'the right call is named once');
});

test('item 3: an item deleteLine shows on the card and in the debrief; the default keeps its right-call sentence', () => {
    const own = 'This was a genuine policy notice. Deleting it meant the reminder went unread.';
    const s = openTriage(awareSet([real('r1', { truth: { isPhish: false, flags: [], deleteLine: own, whyFine: { default: 'Fine.' } } }),
        real('r2'), phish('p1')], { confirmPrompt: false }));
    startRound(s);
    answer(s, 'r1', 'delete');
    assert.ok(cardText(s, 'r1').includes(own));
    assert.match(cardText(s, 'r1'), /The right call was Trust or Verify\./, 'an item line without it still gets the sentence');
    click($(s, '.tri-next'));
    answer(s, 'r2', 'delete');
    assert.match(cardText(s, 'r2'), /That one was real\. .*The right call was Trust or Verify\./, 'default line, sentence kept');
    // the debrief card uses the item's own line (it used to show the set-wide or built line)
    const set = awareSet([real('r1', { truth: { isPhish: false, flags: [], deleteLine: own } }),
        real('r3', { truth: { isPhish: false, flags: [], trustLine: 'Right: it was a real order.' } })],
    { labels: { verdictFeedback: { delete: { real: 'Set-wide delete line.' } } } });
    const { host } = debrief({ set, result: { percent: 50, answers: [{ id: 'r1', verdict: 'delete', score: 70 },
        { id: 'r3', verdict: 'trust', score: 90 }] } });
    const r1 = host.querySelector('.aw-card[data-message-id="r1"] .aw-card-verdict').textContent;
    assert.ok(r1.includes(own), r1);
    assert.ok(!r1.includes('Set-wide delete line.'));
    assert.ok(host.querySelector('.aw-card[data-message-id="r3"] .aw-card-verdict').textContent.includes('Right: it was a real order.'));
});

test('item 3: a genuine call\'s deleteLine is used on the debrief card too', () => {
    const set = awareSet([{ id: 'c1', kind: 'call', callerId: 'Reception', transcript: 'Hello.',
        truth: { isPhish: false, flags: [], deleteLine: 'That was a real visitor, now waiting at the desk.' } }]);
    const { host } = debrief({ set, result: { percent: 30, answers: [{ id: 'c1', verdict: 'delete', action: 'refuse', score: 30 }] } });
    assert.match(host.querySelector('.aw-card[data-message-id="c1"] .aw-card-verdict').textContent, /That was a real visitor, now waiting at the desk\./);
});

test('item 6: the no-ticks confirm prompt is on by default; a second Confirm locks', () => {
    const s = openTriage(awareSet([phish('p1'), real('r1')])); // no confirmPrompt key
    startRound(s);
    click($(s, '.mail-row[data-id="p1"]'));
    click($(s, '.tri-verdict[data-action="report"]'));
    click($(s, '.tri-confirm'));
    assert.ok($(s, '.tri-sheet-prompt'), 'the prompt shows by default');
    assert.ok($(s, '.tri-sheet'), 'not locked yet');
    assert.match($(s, '.tri-sheet-prompt').textContent, /press Confirm again to lock your answer as it is/);
    click($(s, '.tri-confirm'));
    assert.ok(!$(s, '.tri-sheet'), 'the second Confirm locks');
    assert.ok(s.answers.has('p1'));
});

test('item 6: confirmPrompt false locks on the first Confirm; a tick or "Nothing looks wrong" never prompts', () => {
    let s = openTriage(awareSet([phish('p1'), real('r1')], { confirmPrompt: false }));
    startRound(s);
    answer(s, 'p1', 'report');
    assert.ok(s.answers.has('p1'), 'locked at once with the prompt turned off');
    s = openTriage(awareSet([phish('p1'), real('r1')]));
    startRound(s);
    answer(s, 'p1', 'report', { flags: ['*'] });
    assert.ok(s.answers.has('p1'), 'a tick locks at once');
    click($(s, '.tri-next'));
    answer(s, 'r1', 'trust', { none: true });
    assert.ok(s.answers.has('r1'), '"Nothing looks wrong" locks at once');
    s = openTriage(awareSet([phish('p1')], { confirmPrompt: 'Tick something, or Confirm again.' }));
    startRound(s);
    answer(s, 'p1', 'report');
    assert.equal($(s, '.tri-sheet-prompt').textContent, 'Tick something, or Confirm again.', 'a string still words it');
});

// ── item 7 ───────────────────────────────────────────────────────────────────────
test('item 7: the top band reads "Well done:" by default, and never "Sharp"', () => {
    assert.equal(DEFAULT_BANDS[0].headline, 'Well done: you caught the phish and knew why');
    assert.match(bandFor(100).headline, /^Well done:/);
    assert.match(bandFor(85).headline, /^Well done:/);
    assert.ok(DEFAULT_BANDS.every((b) => !/Sharp/.test(b.headline)));
    // an authored band still wins
    assert.equal(bandFor(90, [{ min: 85, headline: 'Spot on' }, { min: 0, headline: 'Keep going' }]).headline, 'Spot on');
});

// ── item 5: resumeSpawn ──────────────────────────────────────────────────────────
test('item 5: resumeSpawnFor is null without the key, on a fresh game, or before whenGlobal is set', () => {
    const saved = { savedGlobalVariables: { briefing_played: true } };
    assert.equal(resumeSpawnFor({ startPosition: { x: 6, y: 6 }, ...saved }, {}), null, 'no key: the usual spawn');
    assert.equal(resumeSpawnFor({ resumeSpawn: { x: 6, y: 3 } }, {}), null, 'a fresh game (no saved globals)');
    assert.equal(resumeSpawnFor({ resumeSpawn: { x: 6, y: 3 }, savedGlobalVariables: {} }, {}), null);
    assert.equal(resumeSpawnFor({ resumeSpawn: { x: 'a', y: 3 }, ...saved }, {}), null, 'bad coordinates are ignored');
    assert.deepEqual(resumeSpawnFor({ resumeSpawn: { x: 6, y: 3 }, ...saved }, {}), { x: 6, y: 3 }, 'any resume without whenGlobal');
    const gated = { resumeSpawn: { x: 6, y: 3, whenGlobal: 'episode_x_state' }, ...saved };
    assert.equal(resumeSpawnFor(gated, { episode_x_state: {} }), null, 'an empty state object is not set');
    assert.deepEqual(resumeSpawnFor(gated, { episode_x_state: { done: ['brief'] } }), { x: 6, y: 3 });
    assert.deepEqual(resumeSpawnFor({ ...gated, savedGlobalVariables: { episode_x_state: { v: 1 } } }, null), { x: 6, y: 3 },
        'falls back to the saved value when the live globals are not to hand');
    for (const v of [true, 1, 'x', [1], { a: 1 }]) assert.equal(globalIsSet(v), true);
    for (const v of [false, 0, '', [], {}, null, undefined]) assert.equal(globalIsSet(v), false);
});

test('item 5: game.js takes resumeSpawn first and otherwise keeps the startPosition / centre spawn', () => {
    const src = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.match(src, /import \{ resumeSpawnFor \} from '\.\/resume-spawn\.js';/);
    const at = src.indexOf('const resumeAt = resumeSpawnFor(gameScenario');
    assert.ok(at > 0, 'the spawn path asks resumeSpawnFor');
    const block = src.slice(at, at + 900);
    assert.match(block, /if \(resumeAt\) \{[\s\S]*?resumeAt\.x \* TILE_SIZE[\s\S]*?\} else if \(gameScenario\.startPosition\) \{[\s\S]*?startPosition\.x \* TILE_SIZE[\s\S]*?\} else \{/,
        'resumeSpawn, then startPosition, then the room centre');
    // The live game merges the saved globals into gameState before the spawn, so whenGlobal sees them.
    assert.ok(src.indexOf('Object.assign(window.gameState.globalVariables, gameScenario.savedGlobalVariables)') < at);
});

test('item 5: no SAFETYNET mission (m01-m10) authors resumeSpawn, so their spawn is unchanged', () => {
    const scenarios = join(repo, 'scenarios');
    const missions = readdirSync(scenarios).filter((d) => /^m(0[1-9]|10)_/.test(d));
    assert.ok(missions.length >= 10, 'the missions are there to check');
    for (const m of missions) {
        const f = join(scenarios, m, 'scenario.json.erb');
        if (!existsSync(f)) continue;
        assert.doesNotMatch(readFileSync(f, 'utf8'), /"resumeSpawn"/, `${m} must not opt in`);
    }
});
