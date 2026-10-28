// Reusability options on the intel board (labels, groups, the neutral ready line) and the shared
// ready-toast title. Every option defaults to the shipped wording. Real files in a jsdom document.
// Run with: bundle exec node --test test/js/social-reuse-intel-board.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/social/intel-board-social.json'), 'utf8'));
const clone = (o) => JSON.parse(JSON.stringify(o));

const dir = mkdtempSync(join(tmpdir(), 'social-reuse-board-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/intel-board/intel-board-minigame.js', 'minigames/intel-board/board-model.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/global-writer.js', 'systems/social-influence.js',
    'ui/influence-bar.js', 'systems/social-intel.js']) {
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
const { buildBoardModel, boardLabels, boardGroups, READY_TEXT } = await import(pathToFileURL(join(dir, 'minigames/intel-board/board-model.js')));
const { readyToastTitle, subjectLabel } = await import(pathToFileURL(join(dir, 'systems/social-intel.js')));

const READY = { se_intel_pierce_role: true, se_intel_pierce_trusts_jed: true, se_intel_email_pattern: true,
    se_intel_pierce_expects_balance_sheet: true, target_ready_pierce: true };

let current = null;
function open(social, globals) {
    current?.cleanup();
    document.body.innerHTML = '';
    window.gameState = { globalVariables: { ...globals } };
    window.gameScenario = { social };
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new IntelBoardMinigame(container, {});
    scene._sceneType = 'intel-board';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const text = (s) => s.container.textContent.replace(/\s+/g, ' ');

test('the ready line is neutral by default and no longer says "she"', () => {
    assert.equal(READY_TEXT, "Ready to approach — you have enough to craft something they'll believe.");
    const s = open(clone(fixture), READY);
    assert.match(text(s), /Ready to approach — you have enough to craft something they'll believe\./);
    assert.doesNotMatch(text(s), /she'll/);
});

test('labels: defaults are today\'s text', () => {
    const l = boardLabels(clone(fixture).intelBoard);
    assert.deepEqual(l, { ready: 'Ready to approach', notReady: 'Not ready', readyLine: READY_TEXT,
        progress: '{n} of {total} targets ready to approach', reconDone: 'Recon complete.',
        toastTitle: 'Ready to approach', caseButton: 'Case file' });
    const s = open(clone(fixture), { ...READY });
    assert.match(s.container.querySelector('.ib-progress').textContent, /^1 of 2 targets ready to approach\.$/);
    assert.equal(readyToastTitle({ social: clone(fixture) }), 'Ready to approach');
});

test('labels: overrides reach the status badge, ready line, progress and recon-complete text', () => {
    const social = clone(fixture);
    social.intelBoard.labels = { ready: 'Cleared', notReady: 'Still digging', readyLine: 'Enough on her.',
        progress: '{n}/{total} cleared', reconDone: 'Sweep done.', toastTitle: 'Cleared to go', caseButton: 'Dossier' };
    const s = open(social, { ...READY, osint_done: true, se_intel_hampshire_careers: true });
    assert.match(text(s), /Cleared/);
    assert.match(text(s), /Still digging/);
    assert.doesNotMatch(text(s), /Not ready/);
    assert.match(text(s), /Enough on her\./);
    assert.equal(s.container.querySelector('.ib-progress').textContent, 'Sweep done. 1/2 cleared.');
    assert.equal(readyToastTitle({ social }), 'Cleared to go');
    assert.equal(buildBoardModel(social, {}).labels.caseButton, 'Dossier');
});

test('labels: a blank entry keeps the default', () => {
    const l = boardLabels({ labels: { ready: '  ', progress: 7 } });
    assert.equal(l.ready, 'Ready to approach');
    assert.equal(l.progress, '{n} of {total} targets ready to approach');
});

test('groups: default is one Company panel; a declared group gets its own panel', () => {
    assert.deepEqual(boardGroups(clone(fixture).intelBoard), [{ subject: 'company', title: 'Company' }]);
    const base = open(clone(fixture), { se_intel_email_pattern: true });
    assert.equal(base.container.querySelectorAll('.ib-company').length, 1);
    assert.match(base.container.querySelector('.ib-company h3').textContent, /^Company$/);
    assert.match(text(base), /Nothing found about the company yet|Staff addresses/);

    const social = clone(fixture);
    social.intelFacts.cabal_lodge = { text: 'The Cabal meets at the old lodge.', subject: 'cabal', provides: [] };
    social.intelBoard.groups = [{ subject: 'company', title: 'Company' }, { subject: 'cabal', title: 'The Cabal' }];
    const s = open(social, { se_intel_email_pattern: true, se_intel_cabal_lodge: true });
    const panels = [...s.container.querySelectorAll('.ib-company')];
    assert.deepEqual(panels.map((p) => p.dataset.subject), ['company', 'cabal']);
    assert.equal(panels[1].querySelector('h3').textContent, 'The Cabal');
    assert.match(panels[1].textContent, /meets at the old lodge/);
    assert.doesNotMatch(panels[0].textContent, /old lodge/);
    assert.deepEqual(s.getTestState().board.groups.map((g) => g.subject), ['company', 'cabal']);

    const empty = open(social, {});
    assert.match(empty.container.querySelector('[data-subject="cabal"]').textContent, /Nothing found about The Cabal yet\./);
});

test('a fact for an undeclared subject still does not show (the validator flags it)', () => {
    const social = clone(fixture);
    social.intelFacts.cabal_lodge = { text: 'Hidden.', subject: 'cabal', provides: [] };
    const s = open(social, { se_intel_cabal_lodge: true });
    assert.doesNotMatch(text(s), /Hidden/);
});

test('subjectLabel names a declared group by its title; company stays "the company"', () => {
    const social = clone(fixture);
    social.intelBoard.groups = [{ subject: 'cabal', title: 'the Cabal' }];
    assert.equal(subjectLabel(social, { subject: 'cabal' }, 'x', {}), 'the Cabal');
    assert.equal(subjectLabel(social, { subject: 'company' }, 'x', {}), 'the company');
    assert.equal(subjectLabel(clone(fixture), { subject: 'cabal' }, 'x', {}), 'a colleague');
});
