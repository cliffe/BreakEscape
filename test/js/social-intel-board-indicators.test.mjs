// The intel board's optional defender indicators step (SE design 03 "Defender mode",
// engagement.defender.indicators). Real overlay and model in a jsdom document.
//  - off by default: no indicators authored, or none whose tell is in a sent record, draws nothing;
//  - an indicator shows only when a sent record (any mailbox, not seeded, not a quick reply) carries
//    its tell, and names the latest such record;
//  - Block / Let through: the right mark locks, a wrong one shows why and can be changed;
//  - marks are ids in se_board_state.defender.indicators and survive a reopen;
//  - indicators gate profile_done only through a declared step they name; a step bound only to
//    hidden indicators is done.
// Run with: bundle exec node --test test/js/social-intel-board-indicators.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/social/intel-board-defender.json'), 'utf8'));

const dir = mkdtempSync(join(tmpdir(), 'social-intel-board-indicators-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/intel-board/intel-board-minigame.js', 'minigames/intel-board/board-model.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
window.stateSync = { sync() {} };
window.MinigameFramework = { currentMinigame: null, endMinigame() {} };

const { IntelBoardMinigame } = await import(pathToFileURL(join(dir, 'minigames/intel-board/intel-board-minigame.js')));
const { buildDefenderModel, sentTells, readIndicatorMarks } = await import(pathToFileURL(join(dir, 'minigames/intel-board/board-model.js')));

const clone = (o) => JSON.parse(JSON.stringify(o));
const INDICATORS = [
    { id: 'ind_spoof', tell: 'senderAuth', block: true, text: 'The From domain fails DMARC alignment.',
        why: 'A message that fails alignment for your own domain is safe to quarantine.' },
    { id: 'ind_urgent', tell: 'urgencyCalibrated', block: false, text: 'The message pushes for action today.',
        why: 'Real mail is urgent too. Flag it for the reader; blocking on tone alone stops real work.' },
    { id: 'ind_link', tell: 'linkCredible', block: true, text: 'The link goes to a look-alike domain.',
        why: 'A look-alike of your own domain has no business reason to reach staff.' }
];
const sent = (over) => ({ id: over.id, folder: 'sent', fromAccount: 'guest', to: 'm.pierce@ledgerwell.example',
    targetId: 'pierce', subject: 'Quick one', tells: [], gameTime: 0, ...over });
const MAIL = { mailboxes: {
    guest: { messages: [
        sent({ id: 'm1', tells: ['senderTrust', 'senderAuth'], gameTime: 1000 }),
        sent({ id: 'm2', tells: ['senderAuth', 'urgencyCalibrated'], subject: 'Need this today', gameTime: 5000 }),
        { id: 'seed1', seeded: true, read: true, gameTime: 0 },
        sent({ id: 'q1', kind: 'quickReply', tells: ['linkCredible'], targetId: null })
    ] },
    other: { messages: [{ id: 'in1', folder: 'inbox', tells: ['linkCredible'] }] }
} };

function socialWith(indicators = INDICATORS, extra = {}) {
    const s = clone(fixture);
    if (indicators) s.engagement.defender.indicators = clone(indicators);
    Object.assign(s.engagement.defender, extra);
    return s;
}
function setup(globals = {}) { window.gameState = { globalVariables: { ...globals } }; }

let current = null;
function open(social, mailState = MAIL) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new IntelBoardMinigame(container, { mode: 'defender', social, mailState });
    scene._sceneType = 'intel-board';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const card = (s, id) => s.container.querySelector(`[data-indicator="${id}"]`);
const G = () => window.gameState.globalVariables;
const goodPicks = { email_pattern: 'role_inboxes', hampshire_careers: 'gateway' };

test('sentTells: Sent records only, latest record per tell, seeded stubs, quick replies and inbox mail skipped', () => {
    const t = sentTells(MAIL);
    assert.deepEqual([...t.keys()].sort(), ['senderAuth', 'senderTrust', 'urgencyCalibrated']);
    assert.equal(t.get('senderAuth').subject, 'Need this today', 'the later of two records');
    assert.equal(t.get('senderTrust').subject, 'Quick one');
    assert.equal(sentTells(null).size, 0);
    assert.equal(sentTells({ mailboxes: { a: { messages: 'junk' } } }).size, 0);
});

test('off by default: no indicators authored draws no section and the state lists none', () => {
    setup();
    const s = open(socialWith(null));
    assert.equal(s.container.querySelector('.ib-indicators'), null);
    assert.deepEqual(s.getTestState().board.defender.indicators, []);
});

test('no sent mail: authored indicators stay hidden and nothing is drawn', () => {
    setup();
    const s = open(socialWith(), { mailboxes: {} });
    assert.equal(s.container.querySelector('.ib-indicators'), null);
    assert.ok(s.getTestState().board.defender.indicators.every((i) => i.shown === false));
});

test('shows only indicators whose tell the player sent, naming the latest record', () => {
    setup();
    const s = open(socialWith());
    assert.ok(s.container.querySelector('.ib-indicators'));
    assert.ok(card(s, 'ind_spoof'));
    assert.ok(card(s, 'ind_urgent'));
    assert.equal(card(s, 'ind_link'), null, 'linkCredible is only on a quick reply and inbox mail');
    assert.match(card(s, 'ind_spoof').textContent, /Seen in your mail to m\.pierce@ledgerwell\.example, "Need this today"/);
    assert.match(s.container.textContent, /0 of 2 indicators marked/);
    assert.deepEqual([...card(s, 'ind_spoof').querySelectorAll('button')].map((b) => b.textContent), ['Block', 'Let through']);
});

test('a wrong mark shows why and can be changed; the right mark locks and is saved as an id', () => {
    setup();
    const s = open(socialWith());
    assert.equal(s.markIndicator('ind_urgent', 'block'), true);
    let c = card(s, 'ind_urgent');
    assert.equal(c.dataset.state, 'wrong');
    assert.match(c.querySelector('.ib-feedback').textContent, /Not quite:\s*Real mail is urgent too/);
    assert.equal(c.querySelector('[data-mark="allow"]').disabled, false);
    assert.equal(s.markIndicator('ind_urgent', 'allow'), true);
    c = card(s, 'ind_urgent');
    assert.equal(c.dataset.state, 'done');
    assert.match(c.querySelector('.ib-feedback').textContent, /^\s*Right:/);
    assert.equal(c.querySelector('[data-mark="block"]').disabled, true);
    assert.equal(s.markIndicator('ind_urgent', 'block'), false, 'locked');
    assert.deepEqual(G().se_board_state.defender.indicators, { ind_urgent: 'allow' });
    assert.equal(document.activeElement, card(s, 'ind_urgent').querySelector('[data-mark="allow"]'));
});

test('hidden or unknown indicators and bad marks are refused', () => {
    setup();
    const s = open(socialWith());
    assert.equal(s.markIndicator('ind_link', 'block'), false, 'hidden: no sent record has its tell');
    assert.equal(s.markIndicator('nope', 'block'), false);
    assert.equal(s.markIndicator('ind_spoof', 'delete'), false);
    assert.equal(G().se_board_state, undefined);
});

test('without a step, indicators do not gate profile_done', () => {
    setup({ se_board_state: { v: 1, defender: { picks: goodPicks } } });
    const s = open(socialWith());
    assert.equal(G().profile_done, true, 'mitigations alone complete the block');
    assert.equal(s.getTestState().board.defender.complete, true);
});

test('indicators bound to a declared step gate profile_done until each shown one is marked right', () => {
    const social = socialWith(INDICATORS.map((i) => ({ ...i, step: 'indicators' })), {
        steps: [{ id: 'mitigate', onCompleteGlobal: 'defender_mitigate_done' },
            { id: 'indicators', onCompleteGlobal: 'defender_indicators_done' }]
    });
    for (const fm of social.engagement.defender.factMitigations) fm.step = 'mitigate';
    setup({ se_board_state: { v: 1, defender: { picks: goodPicks } } });
    const s = open(social);
    assert.equal(G().defender_mitigate_done, true);
    assert.equal(G().profile_done, undefined, 'the indicators step is still open');
    s.markIndicator('ind_spoof', 'block');
    assert.equal(G().profile_done, undefined);
    s.markIndicator('ind_urgent', 'allow');
    assert.equal(G().defender_indicators_done, true);
    assert.equal(G().profile_done, true, 'ind_link is hidden, so it does not hold the step');
    assert.match(s.getTestState().board.defender.live, /Exposure review complete/);
});

test('a step bound only to hidden indicators does not hold up the block, and its own global waits', () => {
    const social = socialWith([{ ...INDICATORS[2], step: 'indicators' }], {
        steps: [{ id: 'mitigate', onCompleteGlobal: 'defender_mitigate_done' },
            { id: 'indicators', onCompleteGlobal: 'defender_indicators_done' }]
    });
    for (const fm of social.engagement.defender.factMitigations) fm.step = 'mitigate';
    const m = buildDefenderModel(social, { se_board_state: { defender: { picks: goodPicks } } }, MAIL);
    const st = m.steps.find((x) => x.id === 'indicators');
    assert.equal(st.done, false);
    assert.equal(st.vacuous, true);
    assert.equal(m.complete, true, 'a player who sent nothing matching is not stuck');
    assert.deepEqual(m.toSet, ['defender_mitigate_done', 'profile_done']);
});

test('opening before anything is sent does not latch the indicators step global', () => {
    const social = socialWith(INDICATORS.map((i) => ({ ...i, step: 'indicators' })), {
        steps: [{ id: 'mitigate', onCompleteGlobal: 'defender_mitigate_done' },
            { id: 'indicators', onCompleteGlobal: 'defender_indicators_done' }]
    });
    for (const fm of social.engagement.defender.factMitigations) fm.step = 'mitigate';
    setup();
    open(social, { mailboxes: {} });
    assert.equal(G().defender_indicators_done, undefined);
    const s = open(social);
    assert.equal(card(s, 'ind_spoof').dataset.state, 'open', 'shown once the sends exist');
    assert.equal(G().defender_indicators_done, undefined);
});

test('marks survive a reopen and junk marks are dropped', () => {
    setup();
    let s = open(socialWith());
    s.markIndicator('ind_spoof', 'block');
    s.markIndicator('ind_urgent', 'block');
    s = open(socialWith());
    assert.equal(card(s, 'ind_spoof').dataset.state, 'done');
    assert.equal(card(s, 'ind_urgent').dataset.state, 'wrong');
    assert.match(s.container.textContent, /1 of 2 indicators marked/);
    assert.deepEqual(readIndicatorMarks({ se_board_state: { defender: { indicators: { a: 'block', b: 3, c: 'maybe' } } } }), { a: 'block' });
});

test('indicator marks and mitigation picks share se_board_state.defender without overwriting each other', () => {
    setup({ se_board_state: { v: 1, recon: { seenReady: ['pierce'] } } });
    const s = open(socialWith());
    s.pickMitigation('email_pattern', 'hide_page');
    s.markIndicator('ind_spoof', 'block');
    const st = G().se_board_state;
    assert.deepEqual(st.recon.seenReady, ['pierce']);
    assert.equal(st.defender.picks.email_pattern, 'hide_page');
    assert.equal(st.defender.indicators.ind_spoof, 'block');
});

test('indicatorsIntro replaces the default line; text is set as text, not markup', () => {
    const ind = [{ ...INDICATORS[0], text: '<img src=x onerror=alert(1)>Spoofed' }];
    setup();
    const s = open(socialWith(ind, { indicatorsIntro: 'Your own sends, as the SOC saw them.' }));
    assert.match(s.container.querySelector('.ib-indicators').textContent, /Your own sends, as the SOC saw them\./);
    assert.equal(s.container.querySelectorAll('img[src="x"]').length, 0);
    assert.match(card(s, 'ind_spoof').querySelector('h4').textContent, /^<img src=x/);
});

test('the model without mailState behaves as before (the existing two-argument call)', () => {
    const m = buildDefenderModel(socialWith(), {});
    assert.equal(m.indicatorsShown, 0);
    assert.equal(m.items.length, 2);
    assert.deepEqual(m.toSet, []);
});
