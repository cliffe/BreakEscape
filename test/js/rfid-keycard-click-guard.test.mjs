// Same bug class as E-H: clicking a keycard in the inventory while an RFID minigame is open
// must not restart it in clone mode (which ended the open one and lost a read in progress).
// Run with: node --test test/js/rfid-keycard-click-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = (p) => join(here, '../../public/break_escape/js', p);
const dir = mkdtempSync(join(tmpdir(), 'rfid-keycard-guard-'));
writeFileSync(join(dir, 'base-minigame.mjs'), 'export class MinigameScene {}\n');
writeFileSync(join(dir, 'manager.mjs'),
    readFileSync(js('minigames/framework/minigame-manager.js'), 'utf8').split("'./base-minigame.js'").join("'./base-minigame.mjs'"));
globalThis.window = {};
const { MinigameFramework } = await import(pathToFileURL(join(dir, 'manager.mjs')).href);

function withCurrent(m) { return Object.assign(Object.create(MinigameFramework), { currentMinigame: m }); }

// The inventory-keycard branch of handleObjectInteraction, run against a stubbed window.
function keycardBranch() {
    const src = readFileSync(js('systems/interactions.js'), 'utf8');
    const start = src.indexOf("if (sprite.scenarioData.type === 'keycard' && sprite.scenarioData.takeable === false)");
    assert.ok(start > 0, 'keycard branch found');
    let depth = 0, i = src.indexOf('{', start);
    const open = i;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) break;
    }
    return new Function('sprite', 'window', `${src.slice(open, i + 1)}\nreturn 'fallthrough';`);
}

function run(current, { hasCloner = true } = {}) {
    const started = [];
    const alerts = [];
    const win = {
        MinigameFramework: withCurrent(current),
        startRFIDMinigame: (...a) => started.push(a),
        gameAlert: (...a) => alerts.push(a),
        inventory: { items: hasCloner ? [{ scenarioData: { type: 'rfid_cloner' } }] : [] },
    };
    const card = { type: 'keycard', takeable: false, name: 'Staff badge' };
    const out = keycardBranch()({ objectId: 'inventory_keycard', scenarioData: card }, win);
    return { out, started, alerts, card };
}

test('keycard click with no minigame open starts the RFID minigame in clone mode', () => {
    const { out, started, card } = run(null);
    assert.equal(out, undefined);
    assert.equal(started.length, 1);
    assert.equal(started[0][2].mode, 'clone');
    assert.equal(started[0][2].cardToClone, card);
});

test('keycard click while an RFID read is open is ignored, keeping the read', () => {
    const { out, started, alerts } = run({ _sceneType: 'rfid', mode: 'clone' });
    assert.equal(out, undefined);
    assert.equal(started.length, 0);
    assert.equal(alerts.length, 0);
});

test('keycard click while an RFID minigame is closing opens a fresh one', () => {
    const { started } = run({ _sceneType: 'rfid', _ending: true });
    assert.equal(started.length, 1);
});

test('keycard click while another minigame is open still starts the clone', () => {
    const { started } = run({ _sceneType: 'container' });
    assert.equal(started.length, 1);
});

test('keycard click without a cloner shows the no-cloner alert', () => {
    const { started, alerts } = run(null, { hasCloner: false });
    assert.equal(started.length, 0);
    assert.equal(alerts.length, 1);
});
