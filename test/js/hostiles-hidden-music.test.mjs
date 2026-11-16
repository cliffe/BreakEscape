// A hostile hidden by a setVisible:false mapping cannot attack, so it must not keep the
// fight music going (anyHostilesAlive in music/scenario-music-events.js). A hostile that
// merely starts hidden has no recorded visibility and still counts, as before.
// Real sources in jsdom. Run with: node --max-old-space-size=2048 --test test/js/hostiles-hidden-music.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
['log', 'info', 'warn', 'debug'].forEach((k) => { console[k] = () => {}; });
window.gameState = { globalVariables: {} };

// MusicController returns window.MusicController when set, so no AudioContext is needed
const switches = [];
window.MusicController = { switchPlaylist: (name) => { switches.push(name); }, startDefault() {}, getState: () => ({}), isLeader: () => true };

const imp = (rel) => import(pathToFileURL(join(js, rel)));
const NPCManager = (await imp('systems/npc-manager.js')).default;
const { initScenarioMusicEvents } = await imp('music/scenario-music-events.js');

function bus() {
    const h = {};
    return {
        on: (e, f) => { (h[e] ||= []).push(f); },
        off: (e, f) => { h[e] = (h[e] || []).filter((x) => x !== f); },
        emit: (e, d) => (h[e] || []).slice().forEach((f) => f(d))
    };
}

// A manager with the real visibility methods and a fixed NPC list
function setup(ids, { hostile = ids, ko = [] } = {}) {
    const m = Object.create(NPCManager.prototype);
    m._npcVisibility = new Map();
    m.npcs = new Map(ids.map((id) => [id, { id, isVisible: true }]));
    m.getAllNPCs = () => [...m.npcs.values()];
    window.npcManager = m;
    window.npcHostileSystem = {
        isNPCHostile: (id) => hostile.includes(id),
        isNPCKO: (id) => ko.includes(id)
    };
    window.eventDispatcher = bus();
    switches.length = 0;
    initScenarioMusicEvents({ music: { events: [
        { trigger: 'all_hostiles_ko', playlist: 'calm', fade: true }
    ] } });
    return m;
}
const koEvent = (id) => window.eventDispatcher.emit('npc_ko', { npcId: id });

test('a hostile hidden by setVisible false no longer holds the fight music', () => {
    const m = setup(['a', 'b'], { ko: ['a'] });
    koEvent('a');
    assert.deepEqual(switches, [], 'b is hostile and visible: still fighting');
    m.recordNpcVisibility('b', false);
    koEvent('a');
    assert.deepEqual(switches, ['calm']);
});

test('a hostile revealed again counts again', () => {
    const m = setup(['a', 'b'], { ko: ['a'] });
    m.recordNpcVisibility('b', false);
    m.recordNpcVisibility('b', true);
    koEvent('a');
    assert.deepEqual(switches, []);
});

test('a hostile that starts hidden and was never touched by a mapping still counts', () => {
    const m = setup(['a', 'b'], { ko: ['a'] });
    m.npcs.get('b').isVisible = false;   // initiallyHidden, no record
    assert.equal(m.isHiddenByMapping('b'), false);
    koEvent('a');
    assert.deepEqual(switches, []);
});

test('hidden state survives a reload (export, restore, register)', () => {
    const first = setup(['a', 'b'], { ko: ['a'] });
    first.recordNpcVisibility('b', false);
    const saved = JSON.parse(JSON.stringify(first.exportNpcVisibility()));
    const after = setup(['a', 'b'], { ko: ['a'] });
    assert.equal(after.isHiddenByMapping('b'), false, 'fresh session has no record');
    after.restoreNpcVisibility(saved);
    assert.equal(after.isHiddenByMapping('b'), true);
    koEvent('a');
    assert.deepEqual(switches, ['calm']);
});
