// lab3 (fun-and-learning): on the review flip, the player's own sends are marked ("You sent this
// one…"), so the attack-to-defence mirror lands in the mandatory triage, not only in an NPC's
// optional topic. Opt-in via the triage set's `flagPlayerSent` (a string, or true for a default);
// off when the field is absent, and never shown on a message the player did not send.
// Run with: node --test test/js/social-lab-triage-flag.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'social-lab-triage-flag-'));
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
const ended = [];
window.MinigameFramework = { currentMinigame: null, endMinigame(success, result) { ended.push({ success, result }); } };
window.gameState = { globalVariables: {} };

const { InboxTriageMinigame } = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/inbox-triage-minigame.js')));

const messages = () => [
    { id: 'own_pierce', kind: 'email', playerSent: true,
      from: { name: 'Jed Baker', address: 'j.baker@ledgerwell.example' }, to: 'm.pierce@ledgerwell.example',
      subject: 'For your review', time: '09:00', body: 'Here is the sheet.',
      auth: { spf: 'fail', dkim: 'none', dmarc: 'fail' },
      truth: { isPhish: true, flags: ['senderTrust'], perFlagNote: { senderTrust: 'Sent from the workstation, not Jed.' } } },
    { id: 'supplier', kind: 'email',
      from: { name: 'Office Supplies', address: 'accounts@office-suppiies.example' }, to: 'accounts@ledgerwell.example',
      subject: 'Updated bank details', time: '10:00', body: 'Pay the new account.',
      auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
      truth: { isPhish: true, flags: ['senderTrust'], perFlagNote: { senderTrust: 'A look-alike domain.' } } }
];
const makeSet = (over = {}) => ({
    id: 'lab', title: 'Lab', stage: 'mission', scoringProfile: 'analyst', feedbackMode: 'immediate',
    headerPanel: 'collapsed', glossary: 'closed', outcome: { setGlobalPrefix: 'triage_', passPercent: 60 },
    messages: messages(), ...over
});

let current = null;
function open(set) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    set = withOneConfirm(set);
    const scene = new InboxTriageMinigame(container, { set, social: { triageSets: [set] } });
    scene._sceneType = 'inbox-triage';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    scene.container.querySelector('.tri-start')?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    return scene;
}
const $ = (s, q) => s.container.querySelector(q);
const click = (node) => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
function verdict(s, id, v) {
    click($(s, `.mail-row[data-id="${id}"]`));
    click($(s, `.tri-verdict[data-verdict="${v}"]`));
    click($(s, '.tri-confirm'));
}

test('the player\'s own send is marked on the flip when flagPlayerSent is set', () => {
    const s = open(makeSet({ flagPlayerSent: 'You sent this one. From the blue-team side, the header gives it away.' }));
    verdict(s, 'own_pierce', 'report');
    const card = $(s, '.tri-review-card');
    const mark = card.querySelector('.tri-player-sent');
    assert.ok(mark, 'the own-send marker is shown on the review card');
    assert.match(mark.textContent, /You sent this one/);
});

test('a message the player did not send carries no marker', () => {
    const s = open(makeSet({ flagPlayerSent: 'You sent this one.' }));
    verdict(s, 'supplier', 'report');
    assert.equal($(s, '.tri-review-card').querySelector('.tri-player-sent'), null);
});

test('without flagPlayerSent, no marker is shown (other missions unaffected)', () => {
    const s = open(makeSet());
    verdict(s, 'own_pierce', 'report');
    assert.equal($(s, '.tri-review-card').querySelector('.tri-player-sent'), null);
});

test('flagPlayerSent: true uses the default line', () => {
    const s = open(makeSet({ flagPlayerSent: true }));
    verdict(s, 'own_pierce', 'report');
    const mark = $(s, '.tri-review-card').querySelector('.tri-player-sent');
    assert.ok(mark, 'the default marker is shown');
    assert.match(mark.textContent, /You sent this one\./);
});
