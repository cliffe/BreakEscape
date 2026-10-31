// Fun-and-learning engine changes for the awareness episodes (FUN_DECISIONS.md, 2026-10-22):
//   aw1  the debrief's "How to report here" box (debrief.mondayCard "slot:customer_report_route",
//        social.awareness.reportRoute, the host page's breakEscapeConfig.awareness);
//   aw3  the discrimination figure in each measurement block (organisers only);
//   aw4  the hook for one shared rule of thumb (social.awareness.ruleOfThumb);
//   aw6  the report sting (sound and animation) and the "team kept safe" tally;
//   aw9  the chosen avatar wins and the portrait follows it (utils/player-avatar.js).
// Real modules in jsdom, fixture data only. Run with: node --test test/js/social-fun-engine.test.mjs
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
const fixture = () => JSON.parse(readFileSync(join(here, 'fixtures/social_role_swap/e3_fragment.json'), 'utf8'));

const dir = mkdtempSync(join(tmpdir(), 'social-fun-engine-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/episode-runner/episode-model.js', 'minigames/episode-runner/debrief-view.js',
    'minigames/episode-runner/role-swap.js',
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js', 'minigames/landing-page-builder/landing-page-render.js',
    'minigames/landing-page-builder/landing-page-model.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'utils/player-avatar.js', 'ui/modal-stack.js', 'systems/phish-rules.js',
    'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js',
    'systems/awareness-measure.js'
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
window.gameState = { globalVariables: {} };

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const M = await load('minigames/episode-runner/episode-model.js');
const { renderDebrief, teamLine } = await load('minigames/episode-runner/debrief-view.js');
const RS = await load('minigames/episode-runner/role-swap.js');
const { InboxTriageMinigame } = await load('minigames/inbox-triage/inbox-triage-minigame.js');
const AM = await load('systems/awareness-measure.js');
const A = await load('utils/player-avatar.js');

const host = () => { document.body.textContent = ''; const d = document.createElement('div'); document.body.appendChild(d); return d; };
const set = () => ({
    id: 'fixture_inbox',
    messages: [
        { id: 'p1', kind: 'email', subject: 'Bank change', truth: { isPhish: true, flags: ['changed_bank_details'] } },
        { id: 'p2', kind: 'email', subject: 'Wire today', truth: { isPhish: true, flags: ['secrecy_or_bypass'] } },
        { id: 'g1', kind: 'email', subject: 'PO 88', truth: { isPhish: false, flags: [] } }
    ]
});
const slotEpisode = { id: 'e_fixture', debrief: { mondayCard: 'slot:customer_report_route' } };

// ── aw1: the report route ────────────────────────────────────────────────────

test('aw1: the generic route shows when the episode asks for the slot and nothing is configured', () => {
    const r = M.reportRouteFor(slotEpisode, {}, undefined);
    assert.equal(r.configured, false);
    assert.equal(r.heading, 'How to report here');
    assert.equal(r.text, M.GENERIC_REPORT_ROUTE.text);
    // generic text names no organisation's real route: it tells the learner to find out theirs
    assert.match(r.text, /Find out today how your organisation wants/);
    assert.equal(M.reportRouteFor({ id: 'x' }, {}, undefined), null, 'no slot and no route: nothing');
});

test('aw1: a scenario route wins over the generic line; the host page wins over the scenario', () => {
    const social = { awareness: { reportRoute: 'Use the Report button in Outlook, or ring the service desk on 4000.' } };
    const r = M.reportRouteFor(slotEpisode, social, undefined);
    assert.deepEqual(r, { heading: 'How to report here', text: 'Use the Report button in Outlook, or ring the service desk on 4000.', configured: true });
    // a configured route shows even when the episode did not ask for the slot
    assert.equal(M.reportRouteFor({ id: 'x' }, social, undefined).configured, true);
    const hostCfg = { awareness: { reportRoute: { heading: 'Reporting at Acme', text: 'Forward it to the security team.' } } };
    assert.deepEqual(M.reportRouteFor(slotEpisode, social, hostCfg),
        { heading: 'Reporting at Acme', text: 'Forward it to the security team.', configured: true });
    // junk, blanks and over-long text
    assert.equal(M.reportRouteFor(slotEpisode, { awareness: { reportRoute: '   ' } }).configured, false);
    assert.equal(M.reportRouteFor(slotEpisode, { awareness: { reportRoute: 42 } }).configured, false);
    assert.equal(M.reportRouteFor(slotEpisode, { awareness: { reportRoute: 'x'.repeat(2000) } }).text.length, 600);
});

test('aw1: the debrief draws the route box under the Monday card, as plain text', () => {
    const h = host();
    const evil = '<img src=x onerror="window.pwned=1">';
    const d = renderDebrief(h, { result: { percent: 100, answers: [] }, set: set(), strings: { mondayCard: 'On Monday: report it.' },
        reportRoute: { heading: 'How to report here', text: `Press Report. ${evil}`, configured: true }, onFinish() {} });
    const box = h.querySelector('.aw-report-route');
    assert.ok(box, 'route box drawn');
    assert.equal(box.dataset.configured, 'true');
    assert.equal(box.querySelector('.aw-report-route-heading').textContent, 'How to report here');
    assert.equal(box.querySelector('.aw-report-route-text').textContent, `Press Report. ${evil}`);
    assert.equal(box.querySelector('img'), null);
    assert.equal(h.querySelector('.aw-monday').nextElementSibling, box, 'directly under the Monday card');
    assert.equal(d.getState().reportRoute, 'configured');
    const h2 = host();
    const d2 = renderDebrief(h2, { result: { answers: [] }, set: set(), reportRoute: M.reportRouteFor(slotEpisode, {}), onFinish() {} });
    assert.equal(d2.getState().reportRoute, 'generic');
    const h3 = host();
    assert.equal(renderDebrief(h3, { result: { answers: [] }, set: set(), onFinish() {} }).getState().reportRoute, null);
    assert.equal(h3.querySelector('.aw-report-route'), null);
});

test('aw1: a host route of several lines draws one paragraph per line, in order', () => {
    // A host (Hacktivity) composes the route from its pre-canned options; the engine sees only the
    // two strings and splits the text on blank lines into one paragraph each (WP-02).
    const text = 'Use the Report button in your mail app to report it.\n\nCall the service desk on 4000.\n\nDo not reply.';
    const route = M.reportRouteFor(slotEpisode, {}, { awareness: { reportRoute: { heading: '', text } } });
    const h = host();
    renderDebrief(h, { result: { percent: 100, answers: [] }, set: set(), strings: { mondayCard: 'On Monday: report it.' }, reportRoute: route, onFinish() {} });
    const box = h.querySelector('.aw-report-route');
    assert.equal(box.dataset.configured, 'true');
    assert.equal(box.querySelector('.aw-report-route-heading').textContent, 'How to report here');
    const paras = [...box.querySelectorAll('.aw-report-route-text')].map((p) => p.textContent);
    assert.deepEqual(paras, [
        'Use the Report button in your mail app to report it.',
        'Call the service desk on 4000.',
        'Do not reply.'
    ]);
});

test('aw1: a Report verdict names the configured route under the verdict line, as plain text', () => {
    // A phish Reported but with a tell missed is a review card, so the Report verdict shows.
    const reported = () => ({ result: { answers: [{ id: 'p1', verdict: 'report', flags: [], isPhish: true }] }, set: set() });

    // configured route with an organiser heading, carrying braces and a script tag
    const evil = 'Report it {here} <script>bad()</script>';
    const h = host();
    renderDebrief(h, { ...reported(), reportRoute: { heading: evil, text: 'Forward it to security.', configured: true }, onFinish() {} });
    const card = h.querySelector('.aw-card[data-message-id="p1"]');
    const route = card.querySelector('.aw-card-route');
    assert.ok(route, 'route line drawn after a Report verdict with a configured route');
    assert.equal(route.textContent, `At work, that means: ${evil}.`);
    assert.equal(card.querySelector('script'), null, 'organiser text is plain, never HTML');
    // order: the route line sits directly after the verdict line
    assert.equal(card.querySelector('.aw-card-verdict').nextElementSibling, route, 'route line directly after the verdict line');

    // no route configured: nothing extra
    const h2 = host();
    renderDebrief(h2, { ...reported(), onFinish() {} });
    assert.equal(h2.querySelector('.aw-card-route'), null, 'no route configured: no extra line');

    // the generic (unconfigured) fallback never names a route in the verdict
    const h3 = host();
    renderDebrief(h3, { ...reported(), reportRoute: M.reportRouteFor(slotEpisode, {}), onFinish() {} });
    assert.equal(h3.querySelector('.aw-card-route'), null, 'generic fallback never names a route in the verdict');

    // configured but with no organiser heading (the generic heading is not a name): nothing extra
    const h4 = host();
    renderDebrief(h4, { ...reported(), reportRoute: { heading: 'How to report here', text: 'Forward it to security.', configured: true }, onFinish() {} });
    assert.equal(h4.querySelector('.aw-card-route'), null, 'the generic box heading is not shown as a route name');
});

// ── aw4: the shared rule of thumb (hook) ─────────────────────────────────────

test('aw4: social.awareness.ruleOfThumb renders above the Monday card; absent, nothing', () => {
    const s = M.awarenessSettings({ awareness: { ruleOfThumb: 'Stop. Check on a route you already hold. Report.' } });
    assert.deepEqual(s.ruleOfThumb, { heading: '', text: 'Stop. Check on a route you already hold. Report.' });
    const h = host();
    const d = renderDebrief(h, { result: { answers: [] }, set: set(), ruleOfThumb: s.ruleOfThumb, onFinish() {} });
    const rule = h.querySelector('.aw-rule');
    assert.ok(rule);
    assert.equal(rule.nextElementSibling, h.querySelector('.aw-monday'));
    assert.equal(rule.getAttribute('aria-label'), 'The habit to keep');
    assert.equal(d.getState().ruleOfThumb, true);
    assert.equal(M.awarenessSettings({}).ruleOfThumb, null);
});

// ── aw6: the team tally ──────────────────────────────────────────────────────

test('aw6: teamProtectedOf counts reports and checks, not deletes; the summary keeps it for a reopen', () => {
    assert.equal(M.teamProtectedOf({ reportCount: 2, phishVerified: 1 }), 3);
    assert.equal(M.teamProtectedOf({ reportCount: 0 }), 0);
    assert.equal(M.teamProtectedOf({ percent: 80 }), null, 'an old result without counts');
    assert.equal(M.teamProtectedOf({ teamProtected: 4, reportCount: 1 }), 4, 'a stored count wins');
    assert.deepEqual(M.defendSummary({ percent: 80, reportRate: 0.5, verifyCount: 1, reportCount: 1, phishVerified: 1 }),
        { percent: 80, reportRate: 0.5, verifyCount: 1, teamProtected: 2 });
    assert.equal(M.readState({ id: 'e', variant: 'full' }, { defend: { percent: 1, reportRate: 0, verifyCount: 0, teamProtected: 3 } }).defend.teamProtected, 3);
    assert.equal(M.awarenessSettings({ awareness: { teamSize: 12 } }).teamSize, 12);
    assert.equal(M.awarenessSettings({ awareness: { teamSize: 1 } }).teamSize, null);
    assert.equal(M.awarenessSettings({ awareness: { teamSize: 2.5 } }).teamSize, null);
});

test('aw7: the host config, as the server writes it, overrides the scenario for reportRoute, ruleOfThumb and teamSize', () => {
    const social = { awareness: { reportRoute: 'Scenario route.', ruleOfThumb: 'Scenario rule.', teamSize: 8 } };
    assert.deepEqual(M.awarenessSettings(social, undefined),
        { reportRoute: { heading: '', text: 'Scenario route.' }, ruleOfThumb: { heading: '', text: 'Scenario rule.' }, teamSize: 8 });
    const host = { awareness: { reportRoute: { heading: 'Report it', text: 'Host route.' }, ruleOfThumb: 'Host rule.', teamSize: 250 } };
    assert.deepEqual(M.awarenessSettings(social, host),
        { reportRoute: { heading: 'Report it', text: 'Host route.' }, ruleOfThumb: { heading: '', text: 'Host rule.' }, teamSize: 250 });
    // a key the host leaves out falls back to the scenario, key by key
    assert.deepEqual(M.awarenessSettings(social, { awareness: { teamSize: 40 } }),
        { reportRoute: { heading: '', text: 'Scenario route.' }, ruleOfThumb: { heading: '', text: 'Scenario rule.' }, teamSize: 40 });
});

test('aw6: the debrief thanks the learner for phish kept from the team, with no denominator', () => {
    assert.equal(teamLine(0, 12), '');
    assert.equal(teamLine(1, null), 'Your reports and checks this round kept one phish away from the rest of your team.');
    assert.equal(teamLine(3, 12), 'Your reports and checks this round kept 3 phish away from the 12 people on your team.');
    const h = host();
    const d = renderDebrief(h, { result: { percent: 60, reportCount: 1, phishVerified: 1, phishCaught: 2, phishTotal: 3,
        answers: [{ id: 'p1', verdict: 'report', flags: [], score: 60 }] }, set: set(), teamSize: 8, onFinish() {} });
    assert.equal(h.querySelector('.aw-team').textContent, 'Your reports and checks this round kept 2 phish away from the 8 people on your team.');
    assert.equal(d.getState().teamProtected, 2);
    assert.ok(!/missed|of 3|fell/i.test(h.querySelector('.aw-team').textContent));
    // aw-ux2: strings.teamLine overrides the wording; {n} and {team} are filled, defaults otherwise.
    assert.equal(teamLine(2, null, 'Your reports kept {n} items from the team.'), 'Your reports kept 2 items from the team.');
    assert.equal(teamLine(2, 12, '{n} items, {team} people.'), '2 items, 12 people.');
    assert.equal(teamLine(2, null, '{n} items, {team} people.'), 'Your reports and checks this round kept 2 phish away from the rest of your team.',
        '{team} with no team size falls back to the default');
    assert.equal(teamLine(0, 12, '{n} items'), '');
    assert.equal(teamLine(3, 12, '  '), 'Your reports and checks this round kept 3 phish away from the 12 people on your team.');
    const hT = host();
    renderDebrief(hT, { result: { reportCount: 1, phishVerified: 0, answers: [] }, set: set(), strings: { teamLine: 'You stopped {n} for the team.' }, onFinish() {} });
    assert.equal(hT.querySelector('.aw-team').textContent, 'You stopped 1 for the team.');
    const h2 = host();
    const d2 = renderDebrief(h2, { result: { reportCount: 0, phishVerified: 0, answers: [] }, set: set(), onFinish() {} });
    assert.equal(h2.querySelector('.aw-team'), null, 'nothing reported or checked: no line at all');
    assert.equal(d2.getState().teamProtected, null);
});

// The triage overlay with the awareness skin, on the E3 role-swap fixture.
let current = null;
function openTriage(triageSet, params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    window.MinigameFramework = { currentMinigame: null, endMinigame() {} };
    triageSet = withOneConfirm(triageSet);
    const scene = new InboxTriageMinigame(container, { set: triageSet, social: { triageSets: [triageSet] }, ...params });
    scene._sceneType = 'inbox-triage';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const q = (sel) => current.container.querySelector(sel);
function answer(scene, id, action) {
    scene.reader.select(id);
    const btn = [...scene.container.querySelectorAll('.tri-verdict')].find((b) => b.dataset.action === action);
    assert.ok(btn, `no ${action} button`);
    btn.click();
    q('.tri-confirm').click();
}
const merged = (over = {}) => {
    const f = fixture();
    const s = { triageSets: f.triageSets, intelFacts: f.intelFacts, pretextNpcs: f.pretextNpcs, awarenessEpisode: f.awarenessEpisode };
    return { ...RS.episodeDefendSet(s.awarenessEpisode, s), feedbackMode: 'immediate', ...over };
};

test('aw6: the report sting plays a sound and the pop; the tally counts phish reported or rung back', () => {
    const played = [];
    window.soundManager = { play: (name) => played.push(name) };
    const m = merged();
    const scene = openTriage(m, { skin: 'awareness' });
    q('.tri-start')?.click();
    const tally = () => q('.aw-team-tally');
    assert.ok(tally(), 'tally shown with the skin and immediate feedback');
    assert.equal(tally().textContent, 'Phish stopped for the team: 0');
    // calls: impostor (phish), real (genuine), on behalf (phish), new starter (genuine); push (phish)
    answer(scene, 'e3_call_gordon_impostor', 'escalate');
    assert.deepEqual(played, ['ui_confirm'], 'the report sting sound');
    // F-E19-3: immediate mode carries the report pop on the review card's verdict line, not a
    // separate .tri-locked line.
    assert.ok(q('.tri-card-verdict.aw-report-win'), 'the report pop');
    assert.equal(scene.getTestState().triage.teamTally, 1);
    assert.ok(tally().classList.contains('aw-team-pop'), 'the tally pops when it goes up');
    answer(scene, 'e3_call_gordon_real', 'escalate'); // a genuine caller escalated: thanked, but no tally
    assert.equal(played.length, 2);
    assert.equal(scene.getTestState().triage.teamTally, 1);
    assert.equal(tally().classList.contains('aw-team-pop'), false);
    answer(scene, 'e3_call_on_behalf', 'verify_callback'); // rang back: caught, counted, no report sound
    assert.equal(played.length, 2);
    assert.equal(scene.getTestState().triage.teamTally, 2);
    answer(scene, 'e3_push_early', 'deny'); // deny: safe but not reported, so not counted
    assert.equal(scene.getTestState().triage.teamTally, 2);
    assert.equal(tally().textContent, 'Phish stopped for the team: 2');
    delete window.soundManager;
});

test('aw-ux2: set.labels.teamBadge and teamBadgeTitle reword the tally; unset keeps the phish wording', () => {
    const m = merged({ labels: { teamBadge: 'Reports made for the team: {n}', teamBadgeTitle: 'Items you reported this round' } });
    const scene = openTriage(m, { skin: 'awareness' });
    q('.tri-start')?.click();
    assert.equal(q('.aw-team-tally').textContent, 'Reports made for the team: 0');
    assert.equal(q('.aw-team-tally').title, 'Items you reported this round');
    answer(scene, 'e3_call_gordon_impostor', 'escalate');
    assert.equal(q('.aw-team-tally').textContent, 'Reports made for the team: 1');
    openTriage(merged({ labels: { smsHeading: 'Text' } }), { skin: 'awareness' });
    q('.tri-start')?.click();
    assert.equal(q('.aw-team-tally').textContent, 'Phish stopped for the team: 0');
});

test('aw6: no tally without the skin, or with end-of-round feedback (it would give the answers away)', () => {
    openTriage(merged());
    q('.tri-start')?.click();
    assert.equal(q('.aw-team-tally'), null);
    const scene = openTriage(merged({ feedbackMode: 'end' }), { skin: 'awareness' });
    q('.tri-start')?.click();
    assert.equal(q('.aw-team-tally'), null);
    assert.equal(scene.getTestState().triage.teamTally, null);
    // and no sound manager is fine
    answer(scene, 'e3_call_gordon_impostor', 'escalate');
});

// ── aw3: the discrimination figure ───────────────────────────────────────────

test('aw3: the triage result marks each answer phish or not, and the block stores the figure', () => {
    const scene = openTriage(merged(), { skin: 'awareness' });
    q('.tri-start')?.click();
    answer(scene, 'e3_call_gordon_impostor', 'escalate');   // hit
    answer(scene, 'e3_call_gordon_real', 'refuse');          // false alarm (Refuse is the delete row)
    answer(scene, 'e3_call_on_behalf', 'comply');            // miss
    answer(scene, 'e3_call_new_starter', 'verify_callback'); // genuine, checked: not a false alarm
    answer(scene, 'e3_push_early', 'deny_report');           // hit
    const r = scene._buildResult();
    assert.deepEqual(r.answers.map((a) => a.isPhish), [true, false, true, false, true]);
    const b = AM.buildBlock(r, { setId: r.setId, stage: 'episode', now: 0 });
    assert.deepEqual(b.items.map((i) => i.phish), [true, false, true, false, true]);
    assert.deepEqual(b.disc, { phish: 3, genuine: 2, hits: 2, falseAlarms: 1, hitRate: 0.667, falseAlarmRate: 0.5, index: 0.167 });
    // the figure goes to xAPI with the round statement
    const st = AM.toXapi(b, { mbox: 'mailto:x@y' });
    assert.deepEqual(st.at(-1).result.extensions['https://breakescape.example/xapi/awareness/discrimination'], b.disc);
});

test('aw3: reporting everything scores no discrimination; careful sorting scores 1', () => {
    const items = (verdicts) => verdicts.map(([phish, verdict]) => ({ phish, verdict }));
    const all = AM.discrimination(items([[true, 'report'], [true, 'report'], [false, 'report'], [false, 'report']]));
    assert.equal(all.hitRate, 1);
    assert.equal(all.falseAlarmRate, 1);
    assert.equal(all.index, 0);
    const careful = AM.discrimination(items([[true, 'report'], [true, 'verify'], [false, 'trust'], [false, 'verify']]));
    assert.equal(careful.index, 1);
    assert.equal(AM.discrimination(items([[true, 'report']])).index, null, 'no genuine item: no false-alarm rate');
    assert.equal(AM.discrimination([{ verdict: 'report' }]), null, 'an older result without phish marks');
    assert.equal(AM.buildBlock({ answers: [{ id: 'a', verdict: 'trust' }] }, {}).disc, null);
    // never free text: the block still holds only ids, enums, numbers and booleans
    const b = AM.buildBlock({ answers: [{ id: 'a', verdict: 'report', isPhish: 'yes' }] }, {});
    assert.equal('phish' in b.items[0], false, 'a non-boolean isPhish is dropped');
});

// ── aw9: the chosen avatar wins, the portrait follows ────────────────────────

test('aw9: the chosen avatar wins over the scenario sprite, and the scenario talk image is dropped when it is someone else', () => {
    const scenario = { player: { spriteSheet: 'female_office_worker_v2', spriteTalk: 'assets/characters/female_office_worker_talk.png', spriteConfig: { idleFrameRate: 6 } } };
    assert.equal(A.chosenPlayerSprite({ playerSprite: 'male_spy_v2' }, scenario), 'male_spy_v2');
    assert.equal(A.chosenPlayerSprite({}, scenario), 'female_office_worker_v2', 'no chosen avatar: the scenario sprite');
    assert.equal(A.chosenPlayerSprite(undefined, {}), A.FALLBACK_PLAYER_SPRITE);
    const p = A.syncScenarioPlayer(scenario, 'male_spy_v2');
    assert.equal(p.spriteSheet, 'male_spy_v2');
    assert.equal(p.spriteTalk, 'assets/characters/male_spy_v2_talk.png', 'derived; the renderer falls back to male_spy_talk.png');
    assert.deepEqual(p.spriteConfig, { idleFrameRate: 6 }, 'other fields kept');
    // the scenario's own character keeps its authored portrait
    const same = A.syncScenarioPlayer({ player: { spriteTalk: 'assets/characters/female_office_worker_talk.png' } }, 'female_office_worker_v2');
    assert.equal(same.spriteTalk, 'assets/characters/female_office_worker_talk.png');
    // a change of avatar mid-game moves the portrait too
    assert.equal(A.syncScenarioPlayer(scenario, 'hacker').spriteTalk, 'assets/characters/hacker-talk.png');
    assert.equal(A.syncScenarioPlayer(null, 'x'), null);
});

test('aw9: player.js, game.js and person-chat all take the avatar from one place', () => {
    const src = (rel) => readFileSync(join(js, rel), 'utf8');
    assert.match(src('core/player.js'), /syncScenarioPlayer\(window\.gameScenario, window\.breakEscapeConfig\.playerSprite\)/);
    assert.match(src('core/player.js'), /syncScenarioPlayer\(window\.gameScenario, newSpriteKey\)/);
    assert.match(src('core/game.js'), /spriteTalk: playerTalkPath\(chosenPlayerSprite\(\), window\.gameScenario\?\.player\?\.spriteTalk\)/);
    // the video-call self-view reads the registry's player (the chosen avatar) over the scenario block
    assert.match(src('minigames/person-chat/person-chat-minigame.js'), /\{ \.\.\.\(this\.scenario\.player \|\| \{\}\), \.\.\.\(registryPlayer \|\| \{\}\) \}/);
});
