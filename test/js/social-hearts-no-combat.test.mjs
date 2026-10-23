// P3 N21: the hearts HUD stays hidden in a no-combat scenario ("disableAttacks": true, the
// awareness training room and the SIS games) until the player is actually hurt or knocked out.
// Run with: node --test test/js/social-hearts-no-combat.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-hearts-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['ui/health-ui.js', 'config/combat-config.js', 'events/combat-events.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const dom = new JSDOM('<!doctype html><body></body>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.warn = () => {};
const { HealthUI } = await import(pathToFileURL(join(dir, 'ui/health-ui.js')));

test('no-combat scenario: hidden at full health, shown once hurt; a combat scenario always shows it', () => {
    window.gameScenario = { disableAttacks: true };
    const ui = new HealthUI();
    assert.equal(ui.container.style.display, 'none');
    ui.updateHP(60, 100);
    assert.equal(ui.container.style.display, 'flex', 'damage shows it');
    ui.updateHP(100, 100);
    assert.equal(ui.container.style.display, 'none');
    ui.show(true);
    assert.equal(ui.container.style.display, 'flex', 'a KO forces it');

    window.gameScenario = {};
    const combat = new HealthUI();
    assert.equal(combat.container.style.display, 'flex');
});
