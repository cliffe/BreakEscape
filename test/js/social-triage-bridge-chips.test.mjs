// Test bridge: the inbox triage flag chips are mg controls (DOCS_GAPS run 3, 2026-10-22).
// A chip is a <label class="tri-chip"> round a checkbox, so neither the bridge's clickControl
// nor BaseMinigame#getTestState's controls list matched it, and a playtest had to click the
// chips through the DOM. Both selectors now add .tri-chip (a class only that overlay uses);
// they must stay identical, or numeric indices from getState().controls point at the wrong
// element. Run with: bundle exec node --test test/js/social-triage-bridge-chips.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const bridgeSrc = readFileSync(join(js, 'systems/test-bridge/minigames.js'), 'utf8');
const baseSrc = readFileSync(join(js, 'minigames/framework/base-minigame.js'), 'utf8');

const dir = mkdtempSync(join(tmpdir(), 'social-triage-bridge-chips-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'systems/test-bridge'), { recursive: true });
mkdirSync(join(dir, 'utils'), { recursive: true });
writeFileSync(join(dir, 'systems/test-bridge/minigames.js'), bridgeSrc);
writeFileSync(join(dir, 'systems/test-bridge/input.js'), readFileSync(join(js, 'systems/test-bridge/input.js'), 'utf8'));
writeFileSync(join(dir, 'utils/display-dashes.js'), readFileSync(join(js, 'utils/display-dashes.js'), 'utf8'));
// state.js pulls in the room and door modules; log.js the wait helpers. Neither matters here.
writeFileSync(join(dir, 'systems/test-bridge/state.js'), 'export const activeMinigameSummary = () => null;\n');
writeFileSync(join(dir, 'systems/test-bridge/log.js'), 'export const logAction = () => {};\n');

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.PointerEvent = dom.window.PointerEvent || dom.window.MouseEvent;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
window.requestAnimationFrame = globalThis.requestAnimationFrame;
// jsdom does no layout: count every attached element as visible
Object.defineProperty(window.HTMLElement.prototype, 'offsetParent', { get() { return this.parentNode; } });
// nor innerText: use textContent, trimmed and with runs of whitespace collapsed
if (!('innerText' in window.HTMLElement.prototype)) {
    Object.defineProperty(window.HTMLElement.prototype, 'innerText', { get() { return this.textContent.replace(/\s+/g, ' ').trim(); } });
}

const { minigameBridge } = await import(pathToFileURL(join(dir, 'systems/test-bridge/minigames.js')));

const selectorIn = (src, anchor) => {
    const at = src.indexOf(anchor);
    assert.ok(at >= 0, `anchor ${anchor} not found`);
    return src.slice(at).match(/querySelectorAll\(\s*'([^']+)'/)[1];
};

test('clickControl and getTestState controls use the same selector, with .tri-chip', () => {
    const bridge = selectorIn(bridgeSrc, 'async clickControl(');
    const base = selectorIn(baseSrc, 'const controls = Array.from(');
    assert.equal(bridge, base);
    assert.ok(bridge.split(',').map(s => s.trim()).includes('.tri-chip'));
});

test('tri-chip is only used by the inbox triage overlay', () => {
    const hits = [];
    const walk = (d) => {
        for (const ent of readdirSync(d, { withFileTypes: true })) {
            const p = join(d, ent.name);
            if (ent.isDirectory()) walk(p);
            else if (p.endsWith('.js') && readFileSync(p, 'utf8').includes('tri-chip')) hits.push(p.slice(js.length + 1));
        }
    };
    walk(js);
    assert.deepEqual(hits.sort(), [
        'minigames/framework/base-minigame.js',
        'minigames/inbox-triage/inbox-triage-minigame.js',
        'systems/test-bridge/minigames.js',
    ]);
});

test('a chip can be clicked by its label through clickControl, which ticks its checkbox', async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <fieldset class="tri-chips">
        <label class="tri-chip"><input type="checkbox" value="senderTrust" data-chip="senderTrust"><span class="tri-chip-label">Sender address</span></label>
        <label class="tri-chip tri-chip-none"><input type="checkbox" value="none" data-chip="none"><span class="tri-chip-label">Nothing, it looked fine</span></label>
      </fieldset>
      <button class="tri-next">Next</button>`;
    document.body.appendChild(container);
    window.MinigameFramework = { currentMinigame: { container, gameState: { isActive: true } } };

    const r = await minigameBridge.clickControl('Sender address');
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal(container.querySelector('[data-chip="senderTrust"]').checked, true);
    assert.equal(container.querySelector('[data-chip="none"]').checked, false);

    const miss = await minigameBridge.clickControl('No such chip');
    assert.equal(miss.ok, false);
    assert.deepEqual(miss.available.map(a => a.label), ['Sender address', 'Nothing, it looked fine', 'Next']);
});
