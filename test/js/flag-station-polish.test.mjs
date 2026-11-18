// Flag station polish (UI sweep C5, C6, C14, C15, C16): no emoji header, on-grid fonts,
// wrapping flag rows, result scrolled into view, compact short screens, tag gap.
// Run with: node --test test/js/flag-station-polish.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const jsPath = join(here, '../../public/break_escape/js/minigames/flag-station/flag-station-minigame.js');
const cssPath = join(here, '../../public/break_escape/css/flag-station-minigame.css');
const js = readFileSync(jsPath, 'utf8');
const css = readFileSync(cssPath, 'utf8');

// the standard-mode inline <style> block
const inline = js.slice(js.indexOf('buildUI() {'), js.indexOf('buildStationContent()'));
const stationContent = js.slice(js.indexOf('buildStationContent()'), js.indexOf('buildFlagHistory()'));
const sizesOf = (s) => [...s.matchAll(/font-size:\s*(\d+)px/g)].map(m => +m[1]);

test('C5: header and rewards box carry no emoji', () => {
    assert.doesNotMatch(stationContent, /🏁/);
    assert.match(stationContent, /class="flag-station-icon">FLAG</);
    assert.doesNotMatch(js, /🎁/);
    assert.match(js, /<h4>Rewards Unlocked!<\/h4>/);
    assert.match(css, /\.flag-station-icon \{[^}]*Press Start 2P/);
    assert.doesNotMatch(css, /\.flag-station-icon \{[^}]*font-size: 48px/);
});

test('C6: only on-grid font sizes in the CSS file and the standard inline styles', () => {
    for (const [name, text] of [['css', css], ['inline', inline]]) {
        for (const px of sizesOf(text)) {
            assert.ok([16, 20, 24].includes(px), `${name}: ${px}px is off the grid`);
        }
    }
});

test('m3: launch-abort and lock modes share the FLAG header look, on-grid sizes, no emoji', () => {
    const build = (name, next) => js.slice(js.indexOf(name + '() {'), js.indexOf(next));
    const launch = build('buildLaunchAbortUI', 'buildLockUI() {');
    const lock = build('buildLockUI', 'async submitFlag');
    const armed = js.slice(js.indexOf('showLaunchAbortChoice() {'), js.indexOf('handleAbort'));
    assert.match(launch, /class="flag-station-icon launch-abort-icon">LAUNCH</);
    assert.match(lock, /class="flag-station-icon">LOCKED</);
    for (const [name, text] of [['launch', launch], ['lock', lock], ['armed', armed]]) {
        assert.doesNotMatch(text, /[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/u, name + ' has emoji or symbol glyphs');
        for (const px of sizesOf(text)) assert.ok([16, 20, 24].includes(px), `${name}: ${px}px is off the grid`);
    }
    assert.doesNotMatch(lock, /—/);
});

test('m1: reward icons are text tags, not emoji', () => {
    assert.doesNotMatch(js, /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u);
    assert.match(js, /give_item: '\[ITEM\]'/);
});

test('n2: short screens trim the description margin', () => {
    for (const text of [css, inline]) assert.match(text, /@media \(max-height: 450px\)[\s\S]*\.flag-station-description \{ ?margin: 4px 0/);
});

test('C14: submitted flag rows wrap long flags, the input stays single-line', () => {
    for (const text of [css, inline]) {
        assert.match(text, /\.flag-value \{[^}]*overflow-wrap:\s*anywhere/);
        assert.match(text, /\.flag-value \{[^}]*min-width:\s*0/);
    }
    assert.match(stationContent, /<input type="text"/);
    assert.doesNotMatch(stationContent, /<textarea/);
});

test('C15: compact styles on short screens, in both the CSS file and the inline block', () => {
    for (const text of [css, inline]) {
        assert.match(text, /@media \(max-height: 450px\)/);
        assert.match(text, /@media \(max-height: 450px\)[\s\S]*\.flag-station-icon/);
    }
});

test('C15: showResult scrolls the result box into view (nearest)', async () => {
    const { FlagStationMinigame, restore } = await loadStation();
    const calls = [];
    const s = Object.create(FlagStationMinigame.prototype);
    const el = { style: {}, className: '', textContent: '', scrollIntoView: (o) => calls.push(o) };
    s.showResult(el, 'success', 'ok');
    assert.deepEqual(calls, [{ block: 'nearest' }]);
    assert.equal(el.style.display, 'block');
    // an element without scrollIntoView (test stubs) still works
    s.showResult({ style: {}, className: '', textContent: '' }, 'error', 'no');
    restore();
});

test('C16: the key tag has a gap and the info glyph is plain pixel-font text', () => {
    for (const text of [css, inline]) {
        assert.doesNotMatch(text, /\.flag-recognised-tag \{[^}]*margin-left/);
        assert.match(text, /\.flag-history-item \{[^}]*gap:\s*12px/);
    }
    assert.doesNotMatch(js, /ℹ/);
    assert.match(js, /`NOTE: \$\{note/);
});

function loadStation() {
    const root = mkdtempSync(join(tmpdir(), 'flag-polish-'));
    const dir = join(root, 'minigames');
    mkdirSync(join(dir, 'flag-station'), { recursive: true });
    mkdirSync(join(dir, 'framework'));
    mkdirSync(join(root, 'systems'));
    mkdirSync(join(root, 'utils'));
    writeFileSync(join(root, 'package.json'), '{"type":"module"}');
    writeFileSync(join(dir, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor() {} }\n');
    writeFileSync(join(root, 'systems', 'apply-actions.js'), 'export function applyActions() {}\n');
    writeFileSync(join(root, 'utils', 'display-dashes.js'), 'export function displayDashes(s) { return s; }\n');
    for (const f of ['escape-html', 'lock-scope-refusal', 'flag-wording']) {
        writeFileSync(join(root, 'utils', `${f}.js`), readFileSync(join(here, `../../public/break_escape/js/utils/${f}.js`), 'utf8'));
    }
    writeFileSync(join(dir, 'flag-station', 'flag-station-minigame.js'), js);
    globalThis.window = {};
    globalThis.document = { querySelector: () => null };
    return import(pathToFileURL(join(dir, 'flag-station', 'flag-station-minigame.js')).href)
        .then(m => ({ FlagStationMinigame: m.FlagStationMinigame, restore() {} }));
}
