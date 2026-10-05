// Phone threads: each message shows the time it arrived (game time), not the time
// the thread was opened. Every bubble used to read the current time (all "12:29").
// Run with: node --test test/js/phone-message-times.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const read = (rel) => readFileSync(join(js, rel), 'utf8');

globalThis.window = { gameState: { globalVariables: {} } };

const { GameClock, messageClockText } = await import(dataUrl(read('systems/game-clock.js')));
const { default: NPCManager } = await import(dataUrl(read('systems/npc-manager.js')
    .split("'./npc-los.js'").join(`'${dataUrl(read('systems/npc-los.js'))}'`)
    .split("'../minigames/phone-chat/phone-chat-speaker.js'")
    .join(`'${dataUrl(read('minigames/phone-chat/phone-chat-speaker.js'))}'`)));

function phoneManager() {
    const m = new NPCManager({ on() {}, off() {}, emit() {} }, null);
    m.registerNPC('hax', { npcType: 'phone', phoneId: 'player_phone', displayName: 'Agent HaX' });
    return m;
}

test('in-game clock: each message keeps the game time it arrived at', (t) => {
    const T0 = 1_800_000_000_000;
    let now = T0;
    t.mock.method(Date, 'now', () => now);
    window.gameClock = new GameClock({ config: 'Tue 07:30', now: T0 });
    const m = phoneManager();
    m.addMessage('hax', 'npc', 'First text');
    now += 4 * 60000;
    m.addMessage('hax', 'npc', 'Second text');
    now += 11 * 60000;
    m.addMessage('hax', 'player', 'Reply');
    now += 30 * 60000;   // opened much later

    const times = m.getConversationHistory('hax').map(msg => messageClockText(msg));
    assert.deepEqual(times, ['07:30', '07:34', '07:45']);
    assert.equal(messageClockText(null), '08:15', 'a line arriving now shows now');
});

test('the times survive a save and reload (gameTime is saved with the thread)', (t) => {
    const T0 = 1_800_000_000_000;
    let now = T0;
    t.mock.method(Date, 'now', () => now);
    window.gameClock = new GameClock({ config: 'Tue 07:30', now: T0 });
    const m = phoneManager();
    m.addMessage('hax', 'npc', 'First text');
    now += 6 * 60000;
    m.addMessage('hax', 'npc', 'Second text');
    const saved = JSON.parse(JSON.stringify(m.exportPhoneState()));
    assert.ok(saved.hax.history.every(msg => Number.isFinite(msg.gameTime)));

    // The page is closed for an hour; the game clock resumes from the saved elapsed time
    const elapsed = window.gameClock.exportState(now);
    now += 60 * 60000;
    window.gameClock = new GameClock({ config: 'Tue 07:30', saved: elapsed, now });
    const m2 = new NPCManager({ on() {}, off() {}, emit() {} }, null);
    m2.restorePhoneState(saved);
    m2.registerNPC('hax', { npcType: 'phone', phoneId: 'player_phone' });
    const times = m2.getConversationHistory('hax').map(msg => messageClockText(msg));
    assert.deepEqual(times, ['07:30', '07:36']);
});

test('a preloaded thread backdated an hour shows an hour before the game started', (t) => {
    const T0 = 1_800_000_000_000;
    t.mock.method(Date, 'now', () => T0);
    window.gameClock = new GameClock({ config: 'Tue 00:30', now: T0 });
    const m = phoneManager();
    m.addMessage('hax', 'npc', 'Earlier', { preloaded: true, timestamp: T0 - 3600000 });
    assert.equal(messageClockText(m.getConversationHistory('hax')[0]), '23:30');
    assert.equal(window.gameClock.formatStamp(-3600000), 'Mon 23:30');
});

test('no in-game clock: the wall time each message arrived, in the phone\'s h:mm form', (t) => {
    const base = new Date(2026, 9, 5, 12, 29, 0).getTime();
    let now = base;
    t.mock.method(Date, 'now', () => now);
    window.gameClock = new GameClock({ config: null, now: base });
    const m = phoneManager();
    m.addMessage('hax', 'npc', 'One');
    now += 3 * 60000;
    m.addMessage('hax', 'npc', 'Two');
    now += 60 * 60000;
    const times = m.getConversationHistory('hax').map(msg => messageClockText(msg));
    assert.deepEqual(times, ['12:29', '12:32']);
    // A message saved before gameTime existed still has its own timestamp
    assert.equal(messageClockText({ timestamp: base + 10 * 60000 }), '12:39');
    assert.equal(messageClockText({}, null, base + 90 * 60000), '1:59');
});

test('phone-chat UI renders history bubbles with the message, not the current time', () => {
    const ui = read('minigames/phone-chat/phone-chat-ui.js');
    assert.match(ui, /this\.addMessage\(msg\.type, msg\.text, false, msg\)/);
    assert.match(ui, /messageTime\.textContent = message \? messageClockText\(message\) : this\.getCurrentTime\(\)/);
});
