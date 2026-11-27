/**
 * complete() on a stale instance (closed or replaced) is still ignored, but says so once per
 * instance, naming the minigame, so a stray call is visible in development without a repeating
 * timer flooding the log.
 * Run: node --max-old-space-size=2048 test/js/base-minigame-stale-complete.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'stale-complete-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
put('utils/escape-html.js', readFileSync(join(js, 'utils/escape-html.js'), 'utf8'));
put('minigames/framework/base-minigame.js', readFileSync(join(js, 'minigames/framework/base-minigame.js'), 'utf8'));

const dom = new JSDOM('<!doctype html><body><div id="mg"></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { MinigameScene } = await import(pathToFileURL(join(dir, 'minigames/framework/base-minigame.js')));

class PinPadMinigame extends MinigameScene {}
const warns = [];
const realWarn = console.warn;
const quiet = () => { for (const k of ['log', 'info', 'debug']) console[k] = () => {}; console.warn = (...a) => warns.push(a.join(' ')); };

function make() {
    const mg = new PinPadMinigame(document.getElementById('mg'), {});
    return mg;
}

test('a replaced instance is ignored and warns once, naming the minigame', () => {
    quiet(); warns.length = 0;
    const ended = [];
    const old = make(), current = make();
    window.eventDispatcher = null;
    window.MinigameFramework = { currentMinigame: current, endMinigame: (...a) => ended.push(a) };
    old.complete(false); old.complete(true); old.complete(false);
    console.warn = realWarn;
    assert.equal(ended.length, 0, 'still ignored');
    const mine = warns.filter(w => w.includes('PinPadMinigame'));
    assert.equal(mine.length, 1, 'one warning for three calls');
});

test('a closed instance (no current minigame) warns once, and a second instance warns for itself', () => {
    quiet(); warns.length = 0;
    const a = make(), b = make();
    window.MinigameFramework = { currentMinigame: null, endMinigame() { throw new Error('must not end'); } };
    a.complete(false); a.complete(false);
    b.complete(false); b.complete(false);
    console.warn = realWarn;
    assert.equal(warns.filter(w => w.includes('PinPadMinigame')).length, 2, 'once per instance');
});

test('the live instance completes normally with no stale warning', () => {
    quiet(); warns.length = 0;
    const ended = [];
    const cur = make();
    window.eventDispatcher = null;
    window.MinigameFramework = { currentMinigame: cur, endMinigame: (...a) => ended.push(a) };
    cur.complete(true);
    console.warn = realWarn;
    assert.equal(ended.length, 1);
    assert.equal(warns.filter(w => /closed or replaced|superseded/.test(w)).length, 0);
});
