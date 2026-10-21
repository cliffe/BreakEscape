// The intel board, recon mode (SE design 03 N1 to N3, N5; packet P1-G): cards built
// from the persisted globals, readiness shown (not computed), rebuild on every open,
// Close as a normal exit. Uses the real overlay base classes in a jsdom document.
// Run with: bundle exec node --test test/js/social-intel-board.test.mjs
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

// The real files, copied with their relative layout into an ESM folder
const dir = mkdtempSync(join(tmpdir(), 'social-intel-board-'));
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
const ended = [];
let syncs = 0;
window.stateSync = { sync: () => { syncs++; } };
window.MinigameFramework = {
    currentMinigame: null,
    endMinigame(success, result) { ended.push({ success, result }); }
};

const { IntelBoardMinigame, stringSvg } = await import(pathToFileURL(join(dir, 'minigames/intel-board/intel-board-minigame.js')));
const { buildBoardModel } = await import(pathToFileURL(join(dir, 'minigames/intel-board/board-model.js')));

function setGlobals(g) {
    window.gameState = { globalVariables: { ...g } };
    window.gameScenario = { social: fixture };
}

let current = null;
function open(params = {}) {
    current?.cleanup(); // a left-open scene would keep its capture-phase Esc handler on document
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new IntelBoardMinigame(container, params);
    scene._sceneType = 'intel-board';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}

const text = (scene) => scene.container.textContent.replace(/\s+/g, ' ');
const card = (scene, id) => scene.container.querySelector(`[data-person="${id}"]`);

test('with nothing found: unnamed cards, empty slots, every checklist line missing', () => {
    setGlobals({});
    const s = open();
    const cards = s.container.querySelectorAll('.ib-person');
    assert.equal(cards.length, 2);
    assert.match(card(s, 'pierce').querySelector('.ib-name').textContent, /^Not yet identified$/);
    assert.match(card(s, 'hampshire').querySelector('.ib-name').textContent, /^Not yet identified$/);
    const pierce = card(s, 'pierce');
    assert.equal(pierce.querySelectorAll('.ib-slot.missing').length, 3);
    assert.equal(pierce.querySelectorAll('.ib-slot.done').length, 0);
    assert.match(pierce.textContent, /Missing:\s*You still don't know what Melanie does here\./);
    assert.match(pierce.textContent, /Who she is: \?\?\?/);
    assert.match(pierce.textContent, /Not ready/);
    assert.doesNotMatch(pierce.textContent, /Ready to approach/);
    assert.match(text(s), /Stay inside the agreed scope/);          // scope note banner
    assert.match(text(s), /Nothing found about the company yet/);
    assert.match(text(s), /No one else has come up yet/);
    assert.equal(s.model.ready.length, 0);
});

test('cards come from the se_intel_ globals: names, role, address, contacts, company, stale', () => {
    setGlobals({ se_intel_pierce_role: true });
    let s = open();
    let pierce = card(s, 'pierce');
    assert.equal(pierce.querySelector('.ib-name').textContent, 'Melanie Pierce');
    assert.match(pierce.querySelector('.ib-meta').textContent, /Finance/);
    assert.doesNotMatch(pierce.textContent, /m\.pierce@/, 'address waits for the email pattern');
    assert.match(pierce.textContent, /Melanie Pierce works in Finance\./);
    assert.match(pierce.querySelector('.ib-slot.done').textContent, /Done:\s*She works in Finance\./);
    assert.equal(card(s, 'hampshire').querySelector('.ib-name').textContent, 'Not yet identified');

    setGlobals({ se_intel_pierce_role: true, se_intel_pierce_trusts_jed: true, se_intel_email_pattern: true,
        se_intel_baker_namesake: true, se_intel_hampshire_careers: true });
    s = open();
    pierce = card(s, 'pierce');
    assert.match(pierce.textContent, /m\.pierce@ledgerwell\.example/);
    // Hampshire: no fact names her, but one has her as subject, so the header resolves
    assert.equal(card(s, 'hampshire').querySelector('.ib-name').textContent, 'Chris Hampshire');
    // Jed Baker is not a target, so he is a contact; the stale namesake is not
    assert.deepEqual(s.model.contacts.map((c) => c.id), ['baker']);
    assert.match(s.container.querySelector('[data-contact="baker"]').textContent, /Jed Baker/);
    // company panel: the pattern is a fact, the namesake sits under Old or unverified
    const company = s.container.querySelector('.ib-company');
    assert.match(company.textContent, /Staff addresses are first-initial\.surname/);
    const stale = company.querySelector('.ib-stale');
    assert.match(stale.textContent, /Old or unverified:\s*There is a J\. Baker in Leeds/);
    assert.doesNotMatch(company.querySelector('.ib-facts:not(.ib-stale)').textContent, /Leeds/);
});

test('readiness is shown from target_ready_<id> and osint_done, never computed by the board', () => {
    // every slot's facts held, but evaluateReadiness has not set the global: the card stays Not ready
    setGlobals({ se_intel_pierce_role: true, se_intel_pierce_trusts_jed: true, se_intel_email_pattern: true,
        se_intel_pierce_expects_balance_sheet: true });
    let s = open();
    let pierce = card(s, 'pierce');
    assert.equal(pierce.querySelectorAll('.ib-slot.done').length, 3);
    assert.equal(pierce.dataset.status, 'not_ready');
    assert.match(pierce.textContent, /Not ready/);

    setGlobals({ se_intel_pierce_role: true, se_intel_pierce_trusts_jed: true, se_intel_email_pattern: true,
        se_intel_pierce_expects_balance_sheet: true, target_ready_pierce: true });
    s = open();
    pierce = card(s, 'pierce');
    assert.equal(pierce.dataset.status, 'ready');
    assert.match(pierce.textContent, /Ready to approach — you have enough to craft something she'll believe\./);
    assert.match(pierce.textContent, /Done:/);
    assert.doesNotMatch(pierce.textContent, /Missing:/);
    assert.equal(card(s, 'hampshire').dataset.status, 'not_ready');
    assert.match(s.container.querySelector('.ib-progress').textContent, /^1 of 2 targets ready to approach\.$/);

    setGlobals({ target_ready_pierce: true, target_ready_hampshire: true, osint_done: true });
    s = open();
    assert.match(s.container.querySelector('.ib-progress').textContent, /^Recon complete\. 2 of 2 targets ready/);
    assert.equal(s.getTestState().board.osintDone, true);
});

test('marks are paired with words and the pushpin and card art are wired', () => {
    setGlobals({ target_ready_pierce: true });
    const s = open();
    for (const li of s.container.querySelectorAll('.ib-slot')) {
        assert.match(li.querySelector('.ib-slot-word').textContent, /^(Done|Missing):$/);
        assert.equal(li.querySelector('img').getAttribute('aria-hidden'), 'true');
    }
    for (const st of s.container.querySelectorAll('.ib-status')) {
        assert.match(st.querySelector('.ib-status-word').textContent, /^(Ready to approach|Not ready)$/);
    }
    const pin = s.container.querySelector('.ib-pin');
    assert.equal(pin.getAttribute('src'), '/break_escape/assets/icons/board-pushpin.png');
    const srcs = [...s.container.querySelectorAll('.ib-icon')].map((i) => i.getAttribute('src'));
    assert.ok(srcs.includes('/break_escape/assets/icons/board-ready.png'));
    assert.ok(srcs.includes('/break_escape/assets/icons/board-not-ready.png'));
    assert.ok(srcs.includes('/break_escape/assets/icons/board-slot-empty.png'));
    const css = readFileSync(join(here, '../../public/break_escape/css/intel-board-minigame.css'), 'utf8');
    assert.match(css, /ui\/social\/board-cork\.png/);
    assert.match(css, /ui\/social\/board-card\.png/);
    assert.match(stringSvg(2), /^<svg[^>]*aria-hidden="true"/);
    assert.equal(stringSvg(1), '');
});

test('the board rebuilds from the globals on every open', () => {
    setGlobals({});
    let s = open();
    assert.equal(card(s, 'pierce').querySelector('.ib-name').textContent, 'Not yet identified');
    s.close();

    // facts found while the board was closed show on the next open
    window.gameState.globalVariables.se_intel_pierce_role = true;
    window.gameState.globalVariables.target_ready_pierce = true;
    s = open();
    assert.equal(card(s, 'pierce').querySelector('.ib-name').textContent, 'Melanie Pierce');
    assert.equal(card(s, 'pierce').dataset.status, 'ready');

    // and rebuild() on the same instance re-reads them too
    window.gameState.globalVariables.se_intel_hampshire_careers = true;
    s.rebuild();
    assert.equal(card(s, 'hampshire').querySelector('.ib-name').textContent, 'Chris Hampshire');
});

test('ready-since-last-look is remembered as ids in se_board_state', () => {
    setGlobals({ target_ready_pierce: true });
    let s = open();
    assert.deepEqual(s.getTestState().board.newlyReady, ['pierce']);
    assert.match(card(s, 'pierce').textContent, /New since you last looked/);
    assert.match(s.container.querySelector('.ib-live').textContent, /Melanie Pierce is now ready to approach\./);
    assert.deepEqual(window.gameState.globalVariables.se_board_state.recon.seenReady, ['pierce']);
    assert.ok(syncs > 0, 'state sync requested after the write');
    s.close();

    s = open();
    assert.deepEqual(s.getTestState().board.newlyReady, []);
    assert.doesNotMatch(card(s, 'pierce').textContent, /New since you last looked/);
    assert.equal(s.container.querySelector('.ib-live').textContent, '');

    window.gameState.globalVariables.target_ready_hampshire = true;
    s = open();
    assert.deepEqual(s.getTestState().board.newlyReady, ['hampshire']);
});

test('Close and Esc are normal exits with { mode, completed, ready }; the keyboard flags are set', () => {
    setGlobals({ target_ready_pierce: true });
    ended.length = 0;
    let s = open({ returnTo: { sceneType: 'osint-browser', params: {} } });
    assert.equal(s.params.requiresKeyboardInput, true);
    assert.equal(s.params.disableClose, true);
    assert.equal(s.container.querySelector('#minigame-close').style.display, 'none', 'framework close hidden');
    assert.equal(s.container.querySelector('.ib-close').textContent, 'Close');
    s.container.querySelector('.ib-close').click();
    assert.equal(ended.length, 1);
    assert.equal(ended[0].success, true, 'a close is never minigame_failed');
    assert.deepEqual(ended[0].result, { mode: 'recon', completed: false, ready: ['pierce'] });
    assert.equal(s.getTestState().overlay.returnsTo, 'osint-browser');
    s.cleanup();

    setGlobals({ target_ready_pierce: true, target_ready_hampshire: true, osint_done: true });
    s = open();
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(ended.length, 2);
    assert.equal(ended[1].success, true);
    assert.deepEqual(ended[1].result, { mode: 'recon', completed: true, ready: ['pierce', 'hampshire'] });
    s.cleanup();
});

test('getTestState reports the board', () => {
    setGlobals({ se_intel_pierce_role: true, se_intel_email_pattern: true, target_ready_hampshire: true });
    const s = open();
    const b = s.getTestState().board;
    assert.equal(b.mode, 'recon');
    assert.equal(b.title, 'Engagement: Ledgerwell');
    assert.deepEqual(b.ready, ['hampshire']);
    assert.equal(b.scopeNote, true);
    const p = b.targets.find((t) => t.id === 'pierce');
    assert.deepEqual(Object.keys(p).sort(), ['address', 'emptySlots', 'facts', 'id', 'identified', 'name',
        'role', 'slots', 'status'].sort());
    assert.equal(p.name, 'Melanie Pierce');
    assert.equal(p.status, 'not_ready');
    assert.deepEqual(p.facts, ['pierce_role']);
    assert.deepEqual(p.slots.map((x) => x.done), [true, false, false]);
    assert.deepEqual(b.company.facts, ['email_pattern']);
    assert.equal(s.getTestState().overlay.closeMode, 'close');
    JSON.stringify(s.getTestState()); // plain JSON
});

test('fact text is shown as text, never parsed as markup', () => {
    setGlobals({ se_intel_pierce_role: true });
    const evil = { ...fixture, intelFacts: { ...fixture.intelFacts,
        pierce_role: { ...fixture.intelFacts.pierce_role, text: '<img src=x onerror=alert(1)> Finance' } } };
    const s = open({ social: evil });
    assert.equal(s.container.querySelectorAll('img[onerror]').length, 0);
    assert.match(card(s, 'pierce').textContent, /<img src=x onerror=alert\(1\)> Finance/);
});

test('buildBoardModel is pure: the same inputs give the same model, nothing is written', () => {
    const g = { se_intel_pierce_role: true };
    const before = JSON.stringify(g);
    const a = buildBoardModel(fixture, g);
    const b = buildBoardModel(fixture, g);
    assert.deepEqual(a, b);
    assert.equal(JSON.stringify(g), before);
});
