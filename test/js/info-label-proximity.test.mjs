// Playtest E3 (lab_physical_pentest): "the info line at the bottom goes stale". It did
// not reproduce: in the screenshots the player was still standing in reach of the object
// the line described. The line is a proximity label, recomputed from the player's
// position every 100 ms. These tests pin that down: it shows the nearest thing in reach,
// follows the object's current observations, and clears once the player walks away.
// Run with: node test/js/info-label-proximity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'info-label-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(dir, 'constants.js'), 'export const INTERACTION_RANGE = 64; export const INTERACTION_RANGE_SQ = 64 * 64;');
writeFileSync(join(dir, 'conditional-text.js'),
    'export function resolveObjectField(data, field, fallback) { const v = data && data[field]; return typeof v === "function" ? v() : (v || fallback); }');
writeFileSync(join(dir, 'display-dashes.js'), 'export const displayDashes = t => t;');
writeFileSync(join(dir, 'computer-keywords.js'), readFileSync(join(js, 'utils/computer-keywords.js'), 'utf8'));
writeFileSync(join(dir, 'pc-observations.js'), readFileSync(join(js, 'utils/pc-observations.js'), 'utf8'));
writeFileSync(join(dir, 'walls.js'), 'export const interactionLineClear = () => true;');
writeFileSync(join(dir, 'reach-real.js'), readFileSync(new URL('../../public/break_escape/js/systems/interaction-reach.js', import.meta.url), 'utf8'));
writeFileSync(join(dir, 'reach.js'), "export * from './reach-real.js'; export const reachX = o => o.x; export const reachY = o => o.y; export const reachYSeated = o => o.y; export const aimX = o => o.x; export const aimY = o => o.y; export const aimDiff = () => ({ diff: 0 });");
const code = readFileSync(join(js, 'ui/info-label.js'), 'utf8')
    .replace("'../utils/constants.js'", "'./constants.js'")
    .replace("'../utils/conditional-text.js'", "'./conditional-text.js'")
    .replace("'../utils/display-dashes.js'", "'./display-dashes.js'")
    .replace("'../utils/pc-observations.js'", "'./pc-observations.js'")
    .replace("'../systems/interaction-walls.js'", "'./walls.js'")
    .replace("'../systems/interaction-reach.js'", "'./reach.js'")
    .replace("'../systems/npc-reach.js'", "'./npc-reach.js'");
writeFileSync(join(dir, 'npc-reach.js'), 'export function npcReachDistSq(p, s, d){return s.__reachSq ?? d;}');
writeFileSync(join(dir, 'info-label.js'), code);

const classes = new Set();
const label = { id: 'hud-info-label', textContent: '', setAttribute() {},
    classList: { add: c => classes.add(c), remove: c => classes.delete(c) } };
let created = null;
globalThis.document = {
    getElementById: () => created,
    createElement: () => label,
    body: { appendChild: el => { created = el; } },
};
let clock = 0;
globalThis.performance = { now: () => clock };
globalThis.window = {};
const { createInfoLabel, updateInfoLabel, setHudLabel, clearHudLabel } = await import(pathToFileURL(join(dir, 'info-label.js')));
createInfoLabel();

let pcText = "Chris's PC. Your keylogger is clipped inline on the cable behind it.";
const pc = { x: 300, y: 300, active: true, interactable: true, visible: true, scenarioData: { observations: () => pcText } };
const reader = { x: 600, y: 100, active: true, interactable: true, visible: true, scenarioData: { observations: 'The badge reader on the records door.' } };
window.rooms = { open_plan: { objects: { pc, reader } } };
const tick = (x, y) => { window.player = { x, y, direction: 'up' }; clock += 150; updateInfoLabel(); };
const shown = () => (classes.has('visible') ? label.textContent : null);

test('the line shows the thing in reach and clears when the player walks away', () => {
    tick(300, 330);
    assert.equal(shown(), pcText);
    tick(300, 420);                       // 120 px away: out of reach
    assert.equal(shown(), null);
    tick(600, 130);
    assert.equal(shown(), 'The badge reader on the records door.');
    tick(450, 250);                       // between the two, in reach of neither
    assert.equal(shown(), null);
});

test('the line follows the object as its observations change', () => {
    tick(300, 330);
    assert.equal(shown(), pcText);
    pcText = "Chris's PC. Your keylogger behind it has recorded his password.";
    tick(300, 330);
    assert.equal(shown(), pcText);
});

test('a HUD hover overrides the line only until the hover ends', () => {
    tick(300, 330);
    setHudLabel('Lockpick set');
    tick(300, 420);
    assert.equal(shown(), 'Lockpick set');
    clearHudLabel();
    assert.equal(shown(), null, 'back to the proximity text, which is nothing out of reach');
});

test('on a screen that cannot hover a tap shows the label briefly (UX slice 16 R2 m1)', async () => {
    const { TOUCH_LABEL_MS } = await import(pathToFileURL(join(dir, 'info-label.js')));
    const listeners = [];
    document.addEventListener = (type, fn) => listeners.push({ type, fn });
    document.removeEventListener = (type, fn) => {
        const i = listeners.findIndex((l) => l.type === type && l.fn === fn);
        if (i >= 0) listeners.splice(i, 1);
    };
    window.matchMedia = (q) => ({ matches: q === '(hover: none)' });
    try {
        tick(300, 420);                       // nothing in reach
        setHudLabel('Music Controls');
        assert.equal(shown(), 'Music Controls', 'the tap shows the name');
        assert.equal(listeners.filter((l) => l.type === 'pointerdown').length, 1);
        await new Promise((r) => setTimeout(r, TOUCH_LABEL_MS + 50));
        assert.equal(shown(), null, 'gone after the delay');
        assert.equal(listeners.length, 0, 'the tap listener is removed');

        tick(300, 330);                       // the PC in reach
        setHudLabel('Lockpick set');
        assert.equal(shown(), 'Lockpick set');
        listeners.find((l) => l.type === 'pointerdown').fn({});
        assert.equal(shown(), pcText, 'the next tap anywhere brings the proximity line back');
        assert.equal(listeners.length, 0);
    } finally {
        delete window.matchMedia;
        delete document.addEventListener;
        delete document.removeEventListener;
        clearHudLabel();
    }
});

test('an object that is taken or hidden stops being described', () => {
    tick(300, 330);
    pc.active = false;
    tick(300, 330);
    assert.equal(shown(), null);
    pc.active = true;
});

test('the world line goes quiet under a confirm dialog, an action menu or a minigame (UX R1)', async () => {
    const { worldCaptionCovered } = await import(pathToFileURL(join(dir, 'info-label.js')));
    tick(300, 330);
    assert.equal(shown(), pcText);
    let overlay = null;
    document.querySelector = (sel) => (sel === '.game-confirm-overlay' ? overlay : null);
    overlay = {};
    tick(300, 330);
    assert.equal(shown(), null, 'confirm open');
    overlay = null;
    tick(300, 330);
    assert.equal(shown(), pcText, 'back once it closes');
    window.isInteractionMenuOpen = () => true;
    tick(300, 330);
    assert.equal(shown(), null, 'menu open');
    window.isInteractionMenuOpen = () => false;
    window.MinigameFramework = { currentMinigame: {} };
    assert.equal(worldCaptionCovered(), true);
    tick(300, 330);
    assert.equal(shown(), null, 'minigame open');
    window.MinigameFramework = { currentMinigame: null };
    delete document.querySelector;
    tick(300, 330);
    assert.equal(shown(), pcText);
});
