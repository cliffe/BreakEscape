// A KO asks StateSync for a sync soon (requestSoon, debounced there), so the KO and its
// globalVarOnKO do not wait for the 30 s timer. A hit that does not knock out, a koImmune
// NPC and an NPC already down ask for nothing.
// Run with: node --test test/js/npc-ko-sync-soon.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const npcs = new Map();
let soon = [];
globalThis.window = {
    eventDispatcher: { emit: () => {} },
    gameState: { globalVariables: {} },
    npcManager: { getNPC: (id) => npcs.get(id) || null },
    npcBehaviorManager: { getBehavior: () => null },
    stateSync: { requestSoon: () => soon.push(window.gameState.globalVariables.derek_down === true) }
};

const configUrl = dataUrl(readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
const eventsUrl = dataUrl(readFileSync(join(js, 'events/combat-events.js'), 'utf8'));
const hostileSrc = readFileSync(join(js, 'systems/npc-hostile.js'), 'utf8')
    .split("'../config/combat-config.js'").join(`'${configUrl}'`)
    .split("'../events/combat-events.js'").join(`'${eventsUrl}'`)
    .split("'./npc-sprites.js'").join(`'${dataUrl('export const getNPCDirection = () => "down";')}'`)
    .split("'./interaction-walls.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/interaction-walls.js'), 'utf8'))}'`);
const { initNPCHostileSystem } = await import(dataUrl(hostileSrc));
const sys = initNPCHostileSystem();
window.npcHostileSystem = sys;

const quiet = (fn) => { const l = console.log; console.log = () => {}; try { return fn(); } finally { console.log = l; } };

test('a KO asks for one sync soon, after its globalVarOnKO is set', () => {
    soon = [];
    npcs.set('derek', { id: 'derek', globalVarOnKO: 'derek_down' });
    quiet(() => sys.damageNPC('derek', 1));
    assert.equal(soon.length, 0, 'a hit that does not knock out asks for nothing');
    quiet(() => sys.damageNPC('derek', 10000));
    assert.deepEqual(soon, [true], 'one request, made once the global is true');
    quiet(() => sys.damageNPC('derek', 10000));
    assert.equal(soon.length, 1, 'an NPC already down asks for nothing more');
});

test('a koImmune NPC asks for nothing', () => {
    soon = [];
    npcs.set('director', { id: 'director', koImmune: true });
    quiet(() => sys.damageNPC('director', 10000));
    assert.equal(soon.length, 0);
});

test('each NPC knocked out in a fight asks once (StateSync merges them)', () => {
    soon = [];
    for (const id of ['g1', 'g2', 'g3']) npcs.set(id, { id });
    for (const id of ['g1', 'g2', 'g3']) quiet(() => sys.damageNPC(id, 10000));
    assert.equal(soon.length, 3);
});
