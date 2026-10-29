// The role swap (SE design 11 N15, packet P7-P): defend.calls[] become `call` triage messages,
// merged in front of the episode's defend set; the call card lists the caller's claims; the
// triage starter takes a ready-made set (options.set); the four call actions score through the
// existing verdict rows. Also the awareness skin's Report beat in the triage overlay.
// Data: a fixture copy of the E3 fragments (P7-Q attack, P7-S defend).
// Run with: bundle exec node --test test/js/social-role-swap.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixture = () => JSON.parse(readFileSync(join(here, 'fixtures/social_role_swap/e3_fragment.json'), 'utf8'));

const dir = mkdtempSync(join(tmpdir(), 'social-role-swap-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/episode-runner/role-swap.js',
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/phish-rules.js',
    'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js',
    'systems/triage-starter.js'
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
const ended = [];
window.gameState = { globalVariables: {} };

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const RS = await load('minigames/episode-runner/role-swap.js');
const { scoreTriage } = await load('minigames/inbox-triage/triage-scoring.js');
const { verdictForAction, renderKindSurface, claimLabel, CALL_ACTIONS } = await load('minigames/inbox-triage/triage-kinds.js');
const { buildTriageMessages } = await load('minigames/inbox-triage/triage-messages.js');
const { InboxTriageMinigame } = await load('minigames/inbox-triage/inbox-triage-minigame.js');
const { startInboxTriageMinigame } = await load('systems/triage-starter.js');

const social = () => {
    const f = fixture();
    return { triageSets: f.triageSets, intelFacts: f.intelFacts, pretextNpcs: f.pretextNpcs, awarenessEpisode: f.awarenessEpisode };
};

test('a call becomes a call message: truth is the notes plus isPhish and flags; claims keep labels', () => {
    const f = fixture();
    const labels = RS.valueLabels(f);
    assert.equal(labels.gordon_full, 'Gordon McLeish');
    assert.equal(labels.gordon_staffid, 'QH-20719');
    const call = f.awarenessEpisode.defend.calls[0];
    const m = RS.callToMessage(call, labels);
    assert.equal(m.id, call.id);
    assert.equal(m.kind, 'call');
    assert.equal(m.callerId, call.callerId);
    assert.deepEqual(m.transcript, call.transcript);
    assert.deepEqual(m.truth, { ...call.notes, isPhish: true, flags: call.tells });
    assert.deepEqual(m.claims.map((c) => [c.fact, c.value, c.valueId]), [
        ['who', 'Gordon McLeish', 'gordon_full'], ['team', 'Claims', 'claims'],
        ['manager', 'Ngozi Okonkwo', 'okonkwo_full'], ['staffId', 'QH-20719', 'gordon_staffid']
    ]);
    // a genuine call: isPhish false, no flags, whyFine carried
    const real = RS.callToMessage(f.awarenessEpisode.defend.calls[1], labels);
    assert.equal(real.truth.isPhish, false);
    assert.deepEqual(real.truth.flags, []);
    assert.ok(real.truth.whyFine, 'whyFine copied from notes');
    // unknown value ids stay as written; bad entries give null
    assert.equal(RS.callToMessage({ id: 'x', genuine: true, claims: [{ fact: 'who', value: 'A Person' }] }, labels).claims[0].value, 'A Person');
    assert.equal(RS.callToMessage({ id: 'x' }), null);
    assert.equal(RS.callToMessage({ genuine: true }), null);
});

test('the merged set: the four calls first, then the push; the stored set is not changed; merging is idempotent', () => {
    const s = social();
    const ep = s.awarenessEpisode;
    const before = JSON.stringify(s.triageSets);
    const merged = RS.episodeDefendSet(ep, s);
    assert.deepEqual(merged.messages.map((m) => m.id), [...ep.defend.calls.map((c) => c.id), 'e3_push_early']);
    assert.deepEqual(merged.messages.map((m) => m.kind), ['call', 'call', 'call', 'call', 'push']);
    assert.equal(merged.id, 'e3_service_desk_queue');
    assert.equal(JSON.stringify(s.triageSets), before, 'social.triageSets untouched');
    const again = RS.mergeCalls(merged, ep.defend.calls, RS.valueLabels(s));
    assert.equal(again.messages.length, 5);
    // no calls: the set itself
    assert.equal(RS.mergeCalls(s.triageSets[0], undefined), s.triageSets[0]);
    assert.equal(RS.episodeDefendSet({ defend: { setId: 'nope' } }, s), null);
    // the triage message builder takes the merged set as is
    const built = buildTriageMessages(merged, { mailState: {}, social: s, globals: {} });
    assert.equal(built.messages.length, 5);
    assert.equal(built.messages[0].from.name, ep.defend.calls[0].callerId);
});

test('the call card lists the claims by label, as text', () => {
    const s = social();
    const merged = RS.episodeDefendSet(s.awarenessEpisode, s);
    const node = renderKindSurface(merged.messages[0], { showNote() {}, showLink() {}, bodyNode: () => document.createElement('div') });
    const rows = [...node.querySelectorAll('.tri-call-claim')];
    assert.deepEqual(rows.map((r) => r.dataset.fact), ['who', 'team', 'manager', 'staffId']);
    assert.deepEqual(rows.map((r) => r.querySelector('dt').textContent), ['Name', 'Team', 'Manager', 'Staff reference']);
    assert.deepEqual(rows.map((r) => r.querySelector('dd').textContent), ['Gordon McLeish', 'Claims', 'Ngozi Okonkwo', 'QH-20719']);
    assert.ok(node.querySelector('.tri-call-transcript'));
    // a value that looks like markup goes in as text
    const evil = renderKindSurface({ id: 'e', kind: 'call', claims: [{ fact: 'who', value: '<img src=x>' }], transcript: [] },
        { showNote() {}, showLink() {}, bodyNode: () => document.createElement('div') });
    assert.equal(evil.querySelector('img'), null);
    assert.equal(evil.querySelector('.tri-claim-value').textContent, '<img src=x>');
    // no claims: no claims block
    const none = renderKindSurface({ id: 'n', kind: 'call', transcript: [] }, { showNote() {}, showLink() {}, bodyNode: () => null });
    assert.equal(none.querySelector('.tri-call-claims'), null);
    assert.equal(claimLabel('cost_centre'), 'Cost centre');
    assert.equal(claimLabel('employeeRef'), 'Employee ref');
});

test('the four call actions score through the verdict rows on an impostor and a genuine call', () => {
    const s = social();
    const merged = RS.episodeDefendSet(s.awarenessEpisode, s);
    const impostor = merged.messages[0];
    const genuine = merged.messages[1];
    const score = (msg, action, flags = []) => scoreTriage({
        messages: [msg], profile: 'awareness',
        answers: [{ id: msg.id, verdict: verdictForAction('call', action), action, flags }]
    }).perMessage[0].score;
    const verdictScore = (msg, verdict) => scoreTriage({ messages: [msg], profile: 'awareness',
        answers: [{ id: msg.id, verdict, flags: [] }] }).perMessage[0].score;
    assert.deepEqual(CALL_ACTIONS.map((a) => a.id), ['comply', 'escalate', 'refuse', 'verify_callback']);
    // each action scores exactly as its verdict row
    for (const [action, verdict] of [['comply', 'trust'], ['escalate', 'report'], ['refuse', 'delete'], ['verify_callback', 'verify']]) {
        assert.equal(score(impostor, action), verdictScore(impostor, verdict), `impostor ${action}`);
        assert.equal(score(genuine, action), verdictScore(genuine, verdict), `genuine ${action}`);
    }
    const imp = Object.fromEntries(CALL_ACTIONS.map((a) => [a.id, score(impostor, a.id)]));
    const gen = Object.fromEntries(CALL_ACTIONS.map((a) => [a.id, score(genuine, a.id)]));
    // impostor: complying is the worst, refusing is safe but warns nobody, ringing back or escalating is right
    assert.ok(imp.comply < imp.refuse && imp.refuse < imp.escalate, JSON.stringify(imp));
    assert.equal(imp.escalate, imp.verify_callback);
    // with every tell ticked, escalating an impostor scores full marks
    assert.equal(score(impostor, 'escalate', impostor.truth.flags), 100);
    // genuine: refusing without the safe route loses points (scores as Delete); complying without
    // checking is not full marks either (P3 N16: the callback is the lesson); the rest score full
    assert.equal(gen.comply, 70);
    assert.equal(gen.comply, gen.refuse);
    assert.equal(gen.verify_callback, 100);
    assert.equal(gen.escalate, 100);
    assert.ok(gen.refuse < 100, JSON.stringify(gen));
    assert.equal(gen.refuse, verdictScore(genuine, 'delete'));
});

test('the starter opens a ready-made set (options.set) and passes the skin', () => {
    const s = social();
    const merged = RS.episodeDefendSet(s.awarenessEpisode, s);
    const started = [];
    window.gameScenario = { social: s };
    window.MinigameFramework = { mainGameScene: {}, startMinigame(type, c, params) { started.push({ type, params }); return {}; } };
    const params = startInboxTriageMinigame(null, { set: merged, triageSetId: 'ignored_when_set_given', skin: 'awareness', conclusionTaskId: 't' });
    assert.equal(started[0].type, 'inbox-triage');
    assert.equal(params.set, merged, 'the given set object, not the stored one');
    assert.equal(params.triageSetId, 'e3_service_desk_queue');
    assert.equal(params.set.messages.length, 5);
    assert.equal(params.skin, 'awareness');
    assert.equal(params.prefix, merged.outcome?.setGlobalPrefix ?? null);
    // without options.set the lookup is as before, and there is no skin
    const plain = startInboxTriageMinigame(null, { triageSetId: 'e3_service_desk_queue' });
    assert.equal(plain.set, s.triageSets[0]);
    assert.equal(plain.skin, null);
});

// ── the awareness skin's Report beat in the triage overlay ───────────────────────

let current = null;
function openTriage(set, params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    window.MinigameFramework = { currentMinigame: null, endMinigame(success, result) { ended.push({ success, result }); } };
    const scene = new InboxTriageMinigame(container, { set, social: { triageSets: [set] }, ...params });
    scene._sceneType = 'inbox-triage';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const q = (sel) => current.container.querySelector(sel);
const startSort = () => q('.tri-start')?.click();
function answer(scene, id, action) {
    scene.reader.select(id);
    const btn = [...scene.container.querySelectorAll('.tri-verdict')].find((b) => b.dataset.action === action);
    assert.ok(btn, `no ${action} button`);
    btn.click();
    q('.tri-confirm').click();
}

test('with the awareness skin a report plays the win once and thanks the learner; other actions do not', () => {
    const s = social();
    const merged = { ...RS.episodeDefendSet(s.awarenessEpisode, s), feedbackMode: 'immediate' };
    const scene = openTriage(merged, { skin: 'awareness' });
    startSort();
    assert.ok(q('.triage-client').classList.contains('aw-skin'));
    scene.reader.select(merged.messages[0].id);
    const escalate = [...scene.container.querySelectorAll('.tri-verdict')].find((b) => b.dataset.action === 'escalate');
    assert.ok(escalate.classList.contains('aw-report-btn'), 'the report-row action wears the skin');
    // claims on the open call card, via the bridge
    assert.deepEqual(scene.getTestState().triage.callClaims.map((c) => c.value), ['Gordon McLeish', 'Claims', 'Ngozi Okonkwo', 'QH-20719']);
    answer(scene, merged.messages[0].id, 'escalate');
    let t = scene.getTestState().triage;
    assert.equal(t.skin, 'awareness');
    assert.equal(t.reportThanks, true);
    assert.equal(t.reportWin, true);
    // F-E19-3: immediate mode carries the pop and the thanks beat on the review card's verdict
    // line (the single confirmation), not a separate .tri-locked / .aw-report-thanks paragraph.
    assert.ok(q('.tri-card-verdict.aw-report-win'));
    assert.match(q('.tri-card-verdict.aw-report-thanks').textContent, /warn everyone/);
    // a re-render keeps the thanks but does not replay the animation
    scene.reader.render();
    t = scene.getTestState().triage;
    assert.equal(t.reportThanks, true);
    assert.equal(t.reportWin, false);
    // a refuse (delete row) gets no thanks
    answer(scene, merged.messages[1].id, 'refuse');
    t = scene.getTestState().triage;
    assert.equal(t.reportThanks, false);
    assert.equal(t.reportWin, false);
});

test('without the skin the triage overlay has no report beat (lab sets unchanged)', () => {
    const s = social();
    const merged = { ...RS.episodeDefendSet(s.awarenessEpisode, s), feedbackMode: 'immediate' };
    const scene = openTriage(merged);
    startSort();
    assert.equal(q('.triage-client').classList.contains('aw-skin'), false);
    scene.reader.select(merged.messages[0].id);
    assert.equal(q('.aw-report-btn'), null);
    answer(scene, merged.messages[0].id, 'escalate');
    assert.equal(q('.aw-report-thanks'), null);
    assert.equal(scene.getTestState().triage.skin, null);
});

test('the skin CSS: tokens on .aw-skin, the win animation, and reduced motion turns it off', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/awareness-skin.css'), 'utf8');
    assert.match(css, /\.aw-skin\s*\{[^}]*--aw-accent/);
    assert.match(css, /\.aw-report-win\s*\{\s*animation:/);
    assert.match(css, /prefers-reduced-motion: reduce\)\s*\{[^}]*\.aw-report-win[^}]*animation: none/);
});

test('a claim\'s own label wins over the intelFacts label, which wins over the raw value', () => {
    const labels = RS.valueLabels(fixture());
    const call = { id: 'c', genuine: false, claims: [
        { fact: 'staffId', value: 'gordon_staffid', label: 'QH-99999' },   // own label wins
        { fact: 'who', value: 'gordon_full' },                              // intelFacts label
        { fact: 'team', value: 'no_such_value' },                           // raw value
        { fact: 'manager', value: 'okonkwo_full', label: '' }               // blank label is ignored
    ] };
    const m = RS.callToMessage(call, labels);
    assert.deepEqual(m.claims.map((c) => [c.fact, c.value, c.valueId]), [
        ['staffId', 'QH-99999', 'gordon_staffid'], ['who', 'Gordon McLeish', 'gordon_full'],
        ['team', 'no_such_value', 'no_such_value'], ['manager', 'Ngozi Okonkwo', 'okonkwo_full']
    ]);
    // a defendOnly shell with no intelFacts: the labels carry the card
    const s = { triageSets: [{ id: 'q', messages: [] }] };
    const ep = { defend: { setId: 'q', calls: [{ id: 'c1', genuine: true, claims: [{ fact: 'who', value: 'gordon_full', label: 'Gordon McLeish' }] }] } };
    assert.equal(RS.episodeDefendSet(ep, s).messages[0].claims[0].value, 'Gordon McLeish');
});
