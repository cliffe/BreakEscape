// Code review R1 m5: VT323 is asked for at boot (canvas text does not make a browser fetch
// a web font), once, and window.canvasFontsReady never rejects; a needs-debug label and an
// action icon made before the font arrived redraw once it has.
// Run with: node test/js/canvas-fonts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
globalThis.window = {};
const F = await import(dataUrl(readFileSync(join(js, 'utils/canvas-fonts.js'), 'utf8')));

test('asks for VT323 once and publishes the promise', async () => {
    const asked = [];
    let loaded = null;
    const win = { addEventListener: (t, fn) => { if (t === 'load') loaded = fn; } };
    const doc = { readyState: 'interactive', fonts: { load: async (f) => { asked.push(f); return [{}]; } } };
    const p = F.loadCanvasFonts(doc, win);
    assert.equal(F.loadCanvasFonts(doc, win), p, 'one request');
    assert.equal(win.canvasFontsReady, p);
    await new Promise((r) => setTimeout(r, 10));
    assert.deepEqual(asked, [], 'not asked before the stylesheets (and their @font-face rules) have loaded');
    loaded();
    assert.equal(await p, true);
    assert.deepEqual(asked, ["16px 'VT323'"]);
});

test('a load that matches no face resolves false', async () => {
    const mod = await import(dataUrl(readFileSync(join(js, 'utils/canvas-fonts.js'), 'utf8') + '\n//2'));
    const doc = { readyState: 'complete', fonts: { load: async () => [] } };
    assert.equal(await mod.loadCanvasFonts(doc, {}), false);
});

test('main.js asks for the fonts before it creates the game', () => {
    const main = readFileSync(join(js, 'main.js'), 'utf8');
    const ask = main.indexOf('loadCanvasFonts();');
    assert.ok(ask > 0 && ask < main.indexOf('new Phaser.Game(config)'));
});

test('the two canvas text systems redraw on window.canvasFontsReady', () => {
    for (const rel of ['systems/npc-action-icons.js', 'systems/npc-needs-debug.js']) {
        const src = readFileSync(join(js, rel), 'utf8');
        assert.match(src, /canvasFontsReady/, rel);
        assert.match(src, /updateText\?\.\(\)/, rel);
    }
});
