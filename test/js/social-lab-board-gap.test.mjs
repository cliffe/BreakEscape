// lab6 (fun-and-learning): a readiness slot with an opt-in `gapString` names only the gap; the
// explicit where-to-look pointer (`goalString`) hides behind a "Stuck?" disclosure, so a capable
// student works recon out and a stuck one still has the net one click away. A slot with no
// gapString (every other mission) still shows its goalString directly.
// Run with: node --test test/js/social-lab-board-gap.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-lab-board-gap-'));
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
console.warn = () => {};
window.stateSync = { sync: () => {} };
window.MinigameFramework = { currentMinigame: null, endMinigame() {} };

const { IntelBoardMinigame } = await import(pathToFileURL(join(dir, 'minigames/intel-board/intel-board-minigame.js')));
const { buildBoardModel } = await import(pathToFileURL(join(dir, 'minigames/intel-board/board-model.js')));

const social = {
    intelFacts: {
        pierce_role: { text: 'Melanie Pierce works in Finance.', subject: 'pierce',
            provides: [{ type: 'name', about: 'recipient', value: 'pierce_full', label: 'Melanie Pierce' }] },
        pierce_trusts_jed: { text: 'Melanie trusts Jed.', subject: 'pierce',
            provides: [{ type: 'name', about: 'sender', value: 'baker_full', label: 'Jed Baker' }] }
    },
    people: [{ id: 'pierce', forms: { full: 'Melanie Pierce' } }, { id: 'baker', forms: { full: 'Jed Baker' } }],
    phishTargets: [{ id: 'pierce' }],
    intelBoard: {
        title: 'Engagement', people: ['pierce'],
        readinessSlots: {
            pierce: [
                { label: 'Who she is', needsIntel: ['pierce_role'],
                  gapString: "You still don't know what Melanie does here.",
                  goalString: "You still don't know what Melanie does here. The team page names the staff.",
                  doneString: 'She works in Finance.' },
                { label: 'Who she trusts', needsIntel: ['pierce_trusts_jed'],
                  goalString: "You still don't know who she trusts. Check her social profile.",
                  doneString: 'She trusts Jed Baker.' }
            ]
        }
    }
};

function setGlobals(g) {
    window.gameState = { globalVariables: { ...g } };
    window.gameScenario = { social };
}

let current = null;
function open() {
    current?.cleanup();
    document.body.innerHTML = '';
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

test('buildBoardModel carries gapString through on each slot', () => {
    setGlobals({});
    const model = buildBoardModel(social, {});
    const slots = model.targets.find((t) => t.id === 'pierce').slots;
    assert.equal(slots[0].gapString, "You still don't know what Melanie does here.");
    assert.equal(slots[1].gapString, '', 'a slot with no authored gapString reports an empty string');
});

test('a Missing slot with gapString shows only the gap, with the pointer behind a Stuck? disclosure', () => {
    setGlobals({});
    const s = open();
    const card = [...s.container.querySelectorAll('.ib-card')].find((c) => c.querySelector('.ib-check'));
    const slots = [...card.querySelectorAll('.ib-check .ib-slot')];
    const gapSlot = slots[0];
    assert.match(gapSlot.querySelector('.ib-slot-text').textContent, /don't know what Melanie does here\.$/,
        'the slot text is the short gap, not the full pointer');
    const stuck = gapSlot.querySelector('details.ib-slot-stuck');
    assert.ok(stuck, 'a Stuck? disclosure is present');
    assert.match(stuck.querySelector('summary').textContent, /Stuck\?/);
    assert.match(stuck.querySelector('.ib-slot-goal').textContent, /The team page names the staff\./,
        'the where-to-look pointer is inside the disclosure');
});

test('a Missing slot with no gapString shows its goalString directly (other missions unaffected)', () => {
    setGlobals({});
    const s = open();
    const card = [...s.container.querySelectorAll('.ib-card')].find((c) => c.querySelector('.ib-check'));
    const slots = [...card.querySelectorAll('.ib-check .ib-slot')];
    const plainSlot = slots[1];
    assert.match(plainSlot.querySelector('.ib-slot-text').textContent, /Check her social profile\./);
    assert.equal(plainSlot.querySelector('details.ib-slot-stuck'), null, 'no disclosure when no gapString');
});
