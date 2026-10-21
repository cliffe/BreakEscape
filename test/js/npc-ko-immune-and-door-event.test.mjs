// Finale engine trial (F14): NPC "koImmune", the door_unlocked event's payload,
// and object text chosen by a global (observationVariants / textVariants).
// Run with: node --test test/js/npc-ko-immune-and-door-event.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const emitted = [];
const npcs = new Map();
globalThis.window = {
    eventDispatcher: { emit: (type, data) => emitted.push({ type, data }) },
    gameState: { globalVariables: {}, unlockedRooms: [] },
    npcManager: { getNPC: (id) => npcs.get(id) || null },
    npcBehaviorManager: { getBehavior: () => null }
};

const configUrl = dataUrl(readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
const eventsUrl = dataUrl(readFileSync(join(js, 'events/combat-events.js'), 'utf8'));
const hostileSrc = readFileSync(join(js, 'systems/npc-hostile.js'), 'utf8')
    .split("'../config/combat-config.js'").join(`'${configUrl}'`)
    .split("'../events/combat-events.js'").join(`'${eventsUrl}'`)
    .split("'./npc-sprites.js'").join(`'${dataUrl('export const getNPCDirection = () => "down";')}'`);
const { initNPCHostileSystem, isNPCKOImmune } = await import(dataUrl(hostileSrc));
const sys = initNPCHostileSystem();
window.npcHostileSystem = sys;

const combatSrc = readFileSync(join(js, 'systems/player-combat.js'), 'utf8')
    .split("'../config/combat-config.js'").join(`'${configUrl}'`)
    .split("'../utils/knockback.js'").join(`'${dataUrl('export function applyKnockback() {}')}'`)
    .split("'./fight-styles.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/fight-styles.js'), 'utf8'))}'`);
const { PlayerCombat } = await import(dataUrl(combatSrc));

const actionsSrc = readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal() {}')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact() {}')}'`);
const { applyActions } = await import(dataUrl(actionsSrc));

const { resolveObjectField } = await import(dataUrl(readFileSync(join(js, 'utils/conditional-text.js'), 'utf8')));

const quiet = (fn) => { const l = console.log; console.log = () => {}; try { return fn(); } finally { console.log = l; } };

// One punch landing on every NPC sprite in the room (cone check stubbed to "hit")
function punchEveryone(ids) {
    window.player = { x: 0, y: 0, lastDirection: 'down', isAtlas: true };
    window.rooms = { office: { npcSprites: ids.map(npcId => ({ npcId, visible: true, body: {} })) } };
    const damaged = [];
    const fake = {
        getCurrentModeConfig: () => ({ damage: 10 }),
        bodyOverlapsCone: () => true,
        applyDamage: (id, dmg) => { damaged.push(id); sys.damageNPC(id, dmg); },
        hitboxGraphics: null
    };
    quiet(() => PlayerCombat.prototype.checkForHits.call(fake));
    return damaged;
}

test('isNPCKOImmune reads the scenario key, true only for koImmune: true', () => {
    npcs.set('director', { id: 'director', koImmune: true });
    npcs.set('guard', { id: 'guard' });
    npcs.set('odd', { id: 'odd', koImmune: 'yes' });
    assert.equal(isNPCKOImmune('director'), true);
    assert.equal(sys.isNPCKOImmune('director'), true);
    assert.equal(isNPCKOImmune('guard'), false);
    assert.equal(isNPCKOImmune('odd'), false);
    assert.equal(isNPCKOImmune('nobody'), false);
});

test('a punch passes over a koImmune NPC: no damage, no hostility, no events', () => {
    emitted.length = 0;
    const damaged = punchEveryone(['director']);
    assert.deepEqual(damaged, []);
    assert.equal(sys.isNPCHostile('director'), false);
    assert.equal(sys.isNPCKO('director'), false);
    assert.equal(emitted.length, 0, `no events, got ${emitted.map(e => e.type).join(', ')}`);
});

test('the same punch still turns and hurts an ordinary NPC beside it', () => {
    emitted.length = 0;
    const damaged = punchEveryone(['director', 'guard']);
    assert.deepEqual(damaged, ['guard']);
    assert.equal(sys.isNPCHostile('guard'), true);
    assert.ok(emitted.some(e => e.type === 'npc_attacked:guard'));
    assert.ok(!emitted.some(e => e.type.includes('director')));
});

test('damageNPC refuses a koImmune NPC, so no npc_ko, globalVarOnKO or taskOnKO', () => {
    npcs.set('director', { id: 'director', koImmune: true, globalVarOnKO: 'director_ko', taskOnKO: 't' });
    emitted.length = 0;
    const r = quiet(() => sys.damageNPC('director', 9999));
    assert.equal(r, false);
    assert.equal(sys.isNPCKO('director'), false);
    assert.equal(window.gameState.globalVariables.director_ko, undefined);
    assert.deepEqual(emitted, []);
});

test('the unlock_door action emits door_unlocked with connectedRoom, as a player unlock does', () => {
    emitted.length = 0;
    quiet(() => applyActions([{ type: 'unlock_door', room_id: 'vault' }], { source: 'flag' }));
    const e = emitted.find(x => x.type === 'door_unlocked');
    assert.ok(e, 'door_unlocked emitted');
    assert.equal(e.data.connectedRoom, 'vault');
    assert.equal(e.data.roomId, 'vault');
});

test('player door unlocks emit door_unlocked with roomId and connectedRoom (unlock-system.js)', () => {
    const src = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');
    assert.match(src, /emit\('door_unlocked', \{\s*roomId: doorProps\.roomId,\s*connectedRoom: doorProps\.connectedRoom/);
});

test('a countdown display: observationVariants pick the text from a global', () => {
    const obj = {
        observations: 'RELEASE IN 04:00',
        observationVariants: [
            { condition: "globalVars.release_clock === 'released'", value: 'RELEASED' },
            { condition: "globalVars.release_clock === 'short'", value: 'RELEASE IN 01:45' }
        ],
        text: 'Timer idle.',
        textVariants: [{ condition: "globalVars.release_clock === 'released'", value: 'Timer expired.' }]
    };
    assert.equal(resolveObjectField(obj, 'observations', null, { release_clock: 'long' }), 'RELEASE IN 04:00');
    assert.equal(resolveObjectField(obj, 'observations', null, { release_clock: 'short' }), 'RELEASE IN 01:45');
    assert.equal(resolveObjectField(obj, 'observations', null, { release_clock: 'released' }), 'RELEASED');
    assert.equal(resolveObjectField(obj, 'text', null, { release_clock: 'released' }), 'Timer expired.');
    assert.equal(resolveObjectField(obj, 'text', null, {}), 'Timer idle.');
});
