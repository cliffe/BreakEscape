// Closing the crypto workstation keeps the CyberChef iframe loaded, and reopening
// doesn't reload it, so the player's recipe and input survive.
// Run with: node --test test/js/crypto-workstation-persist.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
// Copy the source to a temp .mjs so it loads as an ES module in isolation.
const dir = mkdtempSync(join(tmpdir(), 'cryptows-'));
writeFileSync(join(dir, 'crypto-workstation.mjs'), readFileSync(join(here, '../../public/break_escape/js/utils/crypto-workstation.js'), 'utf8'));
const mod = await import(pathToFileURL(join(dir, 'crypto-workstation.mjs')).href);

function setup() {
    const state = { srcSets: 0, attr: '', opened: [], liveHref: null };
    const frame = {
        getAttribute: (n) => (n === 'src' ? state.attr : null),
        set src(v) { state.srcSets++; state.attr = v; },
        get src() { return state.attr; },
        contentWindow: { location: { get href() { if (state.liveHref === 'throw') throw new Error('x'); return state.liveHref; } } },
    };
    const popup = { style: { display: 'none' } };
    globalThis.document = { getElementById: (id) => ({ 'cyberchef-frame': frame, 'laptop-popup': popup })[id] };
    globalThis.window = { open: (u, t) => state.opened.push([u, t]) };
    return { state, frame, popup };
}

test('close hides the popup and keeps the iframe src', () => {
    const { state, popup } = setup();
    mod.openCryptoWorkstation();
    const loaded = state.attr;
    assert.match(loaded, /CyberChef_v10\.19\.4\.html$/);
    assert.equal(popup.style.display, 'block');
    mod.closeLaptop();
    assert.equal(popup.style.display, 'none');
    assert.equal(state.attr, loaded);
});

test('reopen does not reload the frame; first open loads it once', () => {
    const { state, popup } = setup();
    mod.openCryptoWorkstation();
    mod.closeLaptop();
    mod.openCryptoWorkstation();
    mod.closeLaptop();
    mod.openCryptoWorkstation();
    assert.equal(state.srcSets, 1);
    assert.equal(popup.style.display, 'block');
});

test('new tab opens the live frame location (recipe hash), else the base URL', () => {
    const { state } = setup();
    mod.openCryptoWorkstation();
    state.liveHref = 'http://h/break_escape/assets/cyberchef/CyberChef_v10.19.4.html#recipe=To_Hex()&input=YWJj';
    mod.openCryptoWorkstationInNewTab();
    assert.equal(state.opened[0][0], state.liveHref);
    state.liveHref = 'throw';
    mod.openCryptoWorkstationInNewTab();
    assert.equal(state.opened[1][0], '/break_escape/assets/cyberchef/CyberChef_v10.19.4.html');
});
