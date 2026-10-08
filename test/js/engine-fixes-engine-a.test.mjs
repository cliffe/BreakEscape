// Engine fixes approved 2026-10-06 (lab_tesseract_trials deferred items E2, E7, E8, E10).
// These read the browser sources as text (the modules need Phaser and the DOM), so they
// pin the specific wiring; the behaviour is checked in the browser playtest.
// Run with: node --test test/js/engine-fixes-engine-a.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => readFileSync(join(root, 'public/break_escape', rel), 'utf8');

test('E7: createRoom declares `room` before the Object Layer 1 collision block uses it', () => {
    const src = read('js/core/rooms.js');
    const layer = src.indexOf("map.getObjectLayer('Object Layer 1')");
    const use = src.indexOf('room.collisionBodies', layer);
    const decl = src.indexOf('const room = rooms[roomId];', src.indexOf('export function createRoom'));
    assert.ok(layer > 0 && use > layer && decl > 0);
    assert.ok(decl < use, 'const room must precede room.collisionBodies');
    // only one declaration in that scope (a second would be a redeclaration error)
    const between = src.slice(decl + 10, src.indexOf('pendingWallCollisionBoxes', use));
    assert.equal(between.includes('const room = rooms[roomId];'), false);
});

test('E7: the declaration compiles ahead of the use (TDZ gone)', () => {
    // Mirror of the fixed shape: declaration first, then the forEach that uses it
    const f = new Function('rooms', 'roomId', `
        const room = rooms[roomId];
        [1].forEach(() => { if (!room.collisionBodies) room.collisionBodies = []; room.collisionBodies.push(1); });
        return room.collisionBodies.length;`);
    assert.equal(f({ a: {} }, 'a'), 1);
});

test('E10: door properties carry the pad options from the door or connected room', () => {
    const src = read('js/systems/doors.js');
    for (const f of ['maxAttempts', 'passwordHint', 'showHint', 'postitNote', 'showPostit', 'showKeyboard']) {
        assert.match(src, new RegExp(`${f}: lockProps\\.${f} \\?\\? connectedRoomData\\?\\.${f} \\?\\? null`), f);
    }
});

test('E10: unlock-system reads door options for password and PIN pads', () => {
    const u = read('js/systems/unlock-system.js');
    for (const f of ['passwordHint', 'showHint', 'showKeyboard', 'maxAttempts', 'postitNote', 'showPostit']) {
        assert.match(u, new RegExp(`pwDoor\\.${f}`), f);
    }
    const m = read('js/systems/minigame-starters.js');
    assert.match(m, /maxAttempts: lockable\?\.maxAttempts \|\| lockable\?\.scenarioData\?\.maxAttempts \|\| lockable\?\.doorProperties\?\.maxAttempts \|\| 3/);
});

test('E8: the player registry uses the configured spriteTalk when it matches the played sprite', () => {
    const src = read('js/core/game.js');
    const start = src.indexOf('spriteTalk: (() => {');
    const body = src.slice(start, src.indexOf('})(),', start) + 5);
    // run the real IIFE with a stand-in window
    const run = (cfg, scenarioPlayer) => {
        const w = { breakEscapeConfig: cfg, gameScenario: { player: scenarioPlayer } };
        return new Function('window', `return ({ ${body} }).spriteTalk;`)(w);
    };
    assert.equal(run({ playerSprite: 'female_hacker_hood_v2' },
        { spriteSheet: 'female_hacker_hood_v2', spriteTalk: 'assets/characters/female_hacker_hood_talk.png' }),
        'assets/characters/female_hacker_hood_talk.png');
    // stale default for a different character is ignored: derived path as before
    assert.equal(run({ playerSprite: 'female_hacker_hood_v2' },
        { spriteSheet: 'female_hacker_hood_v2', spriteTalk: 'assets/characters/hacker-talk.png' }),
        'assets/characters/female_hacker_hood_v2_talk.png');
    assert.equal(run({}, { spriteSheet: 'hacker', spriteTalk: 'assets/characters/hacker-talk.png' }),
        'assets/characters/hacker-talk.png');
    assert.equal(run({ playerSprite: 'male_hacker_hood_v2' }, {}), 'assets/characters/male_hacker_hood_v2_talk.png');
});

test('E2: terminal theme drops its own prompt for lines that already start with ">"', () => {
    const ui = read('js/minigames/phone-chat/phone-chat-ui.js');
    assert.equal((ui.match(/has-own-prompt/g) || []).length, 2, 'static and typewriter paths');
    const css = read('css/phone-chat-minigame.css');
    assert.match(css, /\.phone-terminal-theme \.message-bubble\.npc \.message-text\.has-own-prompt::before\s*\{\s*content: none;/);
    const re = /^\s*>/;
    assert.ok(re.test('> DEVICE ACTIVE') && !re.test('DEVICE ACTIVE') && !re.test('a > b'));
});
