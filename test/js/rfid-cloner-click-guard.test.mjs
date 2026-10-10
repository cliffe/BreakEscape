// E-H: clicking the RFID cloner in the inventory while an RFID minigame is open must not
// restart it in unlock mode (which ended the open one and lost a read in progress).
// Run with: node --test test/js/rfid-cloner-click-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = (p) => join(here, '../../public/break_escape/js', p);
const dir = mkdtempSync(join(tmpdir(), 'rfid-cloner-guard-'));
writeFileSync(join(dir, 'base-minigame.mjs'), 'export class MinigameScene {}\n');
writeFileSync(join(dir, 'manager.mjs'),
    readFileSync(js('minigames/framework/minigame-manager.js'), 'utf8').split("'./base-minigame.js'").join("'./base-minigame.mjs'"));
globalThis.window = {};
const { MinigameFramework } = await import(pathToFileURL(join(dir, 'manager.mjs')).href);

function withCurrent(m) { return Object.assign(Object.create(MinigameFramework), { currentMinigame: m }); }

test('isOpen: true only for an open, not-ending minigame of that type', () => {
    assert.equal(withCurrent(null).isOpen('rfid'), false);
    assert.equal(withCurrent({ _sceneType: 'rfid' }).isOpen('rfid'), true);
    assert.equal(withCurrent({ _sceneType: 'rfid', _ending: true }).isOpen('rfid'), false);
    assert.equal(withCurrent({ _sceneType: 'person-chat' }).isOpen('rfid'), false);
});

// The cloner branch of handleObjectInteraction, run against a stubbed window.
function clonerBranch() {
    const src = readFileSync(js('systems/interactions.js'), 'utf8');
    const start = src.indexOf('if (sprite.scenarioData.type === "rfid_cloner")');
    assert.ok(start > 0, 'cloner branch found');
    let depth = 0, i = src.indexOf('{', start);
    const open = i;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) break;
    }
    // returns 'handled' when the branch returned, 'fallthrough' otherwise
    return new Function('sprite', 'window', `${src.slice(open, i + 1)}\nreturn 'fallthrough';`);
}

function run(current) {
    const started = [];
    const fw = withCurrent(current);
    const win = { MinigameFramework: fw, startRFIDMinigame: (...a) => started.push(a) };
    const sprite = { objectId: 'inventory_rfid_cloner', scenarioData: { type: 'rfid_cloner' } };
    const out = clonerBranch()(sprite, win);
    return { out, started };
}

test('cloner click with no minigame open starts the RFID minigame in unlock mode', () => {
    const { out, started } = run(null);
    assert.equal(out, undefined);
    assert.equal(started.length, 1);
    assert.equal(started[0][2].mode, 'unlock');
});

test('cloner click while an RFID read is open is ignored, keeping the read', () => {
    const { out, started } = run({ _sceneType: 'rfid', mode: 'clone' });
    assert.equal(out, undefined);
    assert.equal(started.length, 0);
});

test('cloner click while an RFID minigame is closing opens a fresh one', () => {
    const { started } = run({ _sceneType: 'rfid', _ending: true });
    assert.equal(started.length, 1);
});
