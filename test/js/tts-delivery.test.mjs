// Per-line delivery notes (#delivery: quietly, almost to herself) for voiced lines.
// - tts-delivery.js reads the tag the way the server does (TtsService.delivery_from_tags):
//   the last non-empty delivery tag wins, whitespace collapsed;
// - ApiClient.getTTS sends `delivery` only when there is a note, so an untagged line's
//   request body is exactly what it was;
// - person-chat passes the line's note to TTSManager.play (and none to the next line's preload),
//   the manager keeps tagged and untagged preloads apart (both run on stubs, not read as text),
//   and the tag is never processed as a game action.
// Run with: node test/js/tts-delivery.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = rel => readFileSync(join(js, rel), 'utf8');

const { deliveryFromTags } = await import(pathToFileURL(join(js, 'systems/tts-delivery.js')).href);

const dir = mkdtempSync(join(tmpdir(), 'tts-delivery-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(dir, 'config-stub.mjs'), "export function getApiBase() { return '/break_escape/games/9'; } export function getCsrfToken() { return 'csrf'; }");
writeFileSync(join(dir, 'api-client.mjs'), read('api-client.js').split("'./config.js'").join("'./config-stub.mjs'"));
globalThis.window = {};
const { ApiClient } = await import(pathToFileURL(join(dir, 'api-client.mjs')).href);

test('deliveryFromTags matches the server (TtsService.delivery_from_tags)', () => {
    assert.equal(deliveryFromTags(undefined), null);
    assert.equal(deliveryFromTags(['speaker:npc:kevin', 'exit_conversation']), null);
    assert.equal(deliveryFromTags(['delivery: quietly']), 'quietly');
    assert.equal(deliveryFromTags([' Delivery:quietly,   almost to herself ']), 'quietly, almost to herself');
    assert.equal(deliveryFromTags(['delivery: warm', 'delivery: dry']), 'dry');
    assert.equal(deliveryFromTags(['delivery: warm', 'delivery:   ']), 'warm');
    // review R1 m3: nothing left after normalising, or over 200 characters, is no note
    assert.equal(deliveryFromTags(['delivery: ...']), null);
    assert.equal(deliveryFromTags(['delivery: \u2026']), null);
    assert.equal(deliveryFromTags(['delivery: \u0442\u0438\u0445\u043e']), null);
    assert.equal(deliveryFromTags(['delivery: ' + 'x'.repeat(201)]), null);
    assert.equal(deliveryFromTags(['delivery: ' + 'x'.repeat(200)]), 'x'.repeat(200));
    // review R1 m4: Unicode spaces collapse as on the server
    assert.equal(deliveryFromTags(['delivery: quietly,\u00A0almost\u2009to herself']), 'quietly, almost to herself');
});

test('getTTS sends delivery only when the line has a note', async () => {
    const bodies = [];
    globalThis.fetch = async (url, init) => {
        bodies.push({ url, body: JSON.parse(init.body) });
        return { ok: true, status: 200, blob: async () => 'blob' };
    };
    await ApiClient.getTTS('kevin_park', 'Fine.');
    await ApiClient.getTTS('kevin_park', 'Fine.', null);
    await ApiClient.getTTS('kevin_park', 'Fine.', 'after a long pause');
    assert.deepEqual(bodies.map(b => b.body), [
        { npc_id: 'kevin_park', text: 'Fine.' },
        { npc_id: 'kevin_park', text: 'Fine.' },
        { npc_id: 'kevin_park', text: 'Fine.', delivery: 'after a long pause' }
    ]);
    assert.equal(bodies[0].url, '/break_escape/games/9/tts');
});

// Lift a class method out of its source and bind its free names to stubs.
function method(src, name, deps) {
    const m = src.match(new RegExp(`\\n    (async )?${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`));
    assert.ok(m, `${name} found`);
    const head = m[1] ? 'async function' : 'function';
    return new Function(...Object.keys(deps), `return ${head} (${m[2]}) {\n${m[3]}\n};`)(...Object.values(deps));
}

// person-chat's displayDialogueBlocksSequentially, run on stubs with a recording TTS manager.
function chatHarness() {
    const calls = [];
    const scheduled = [];
    const deps = {
        deliveryFromTags, window: globalThis.window,
        whenSessionOverlayClosed: async () => {}, rememberNpcLine: () => {},
        readingTimeMs: () => 1000, advanceDelayMs: () => 1000,
        processGameActionTags: async () => {}, npcConversationStateManager: { saveNPCState() {} }
    };
    const kevin = { displayName: 'Kevin Park', voice: { name: 'Kore' } };
    const sam = { displayName: 'Sam Reid', voice: { name: 'Puck' } };
    const o = {
        npcId: 'kevin_park', npc: kevin, characters: { kevin_park: kevin, sam_reid: sam },
        ui: { showDialogue() {}, showChoices() {} },
        ttsManager: {
            play: async (id, text, opts) => { calls.push(['play', id, text, opts]); return 900; },
            preload: (id, text, opts) => { calls.push(['preload', id, text, opts]); }
        },
        parseDialogueLine: (line) => line.startsWith('Sam Reid:') ? { speaker: 'sam_reid' } : { speaker: 'kevin_park' },
        scheduleDialogueAdvance: (fn) => scheduled.push(fn),
        conversation: { continue: () => ({ text: '', tags: [], choices: [], hasEnded: true }) },
        showConversationOverMessage() {}, _inkLaunchWaiting: () => false
    };
    o.displayDialogueBlocksSequentially = method(read('minigames/person-chat/person-chat-minigame.js'),
        'displayDialogueBlocksSequentially', deps);
    return { o, calls, scheduled };
}

test('person-chat plays a tagged line with its note and preloads the next line with none', async () => {
    const h = chatHarness();
    const result = { text: 'x', tags: ['speaker:kevin_park', 'delivery: quietly, almost to herself'], choices: [] };
    const blocks = [{ speaker: 'kevin_park', text: 'Kevin Park: I suppose it does not matter now.\nSam Reid: It does.' }];
    await h.o.displayDialogueBlocksSequentially(blocks, result, 0);
    assert.deepEqual(h.calls, [
        ['play', 'kevin_park', 'I suppose it does not matter now.', { delivery: 'quietly, almost to herself' }],
        // review R1 m2: the next line's tags are not known here, so it goes without a note
        ['preload', 'sam_reid', 'It does.', { delivery: null }]
    ]);
    assert.equal(h.scheduled.length, 1, 'the next line waits for this one');
});

test('person-chat sends no note for an untagged line, and voices nothing for the player', async () => {
    const h = chatHarness();
    await h.o.displayDialogueBlocksSequentially(
        [{ speaker: 'kevin_park', text: 'Kevin Park: Morning.' }], { text: 'x', tags: ['speaker:kevin_park'], choices: [] }, 0);
    assert.deepEqual(h.calls, [['play', 'kevin_park', 'Morning.', { delivery: null }]]);

    const p = chatHarness();
    await p.o.displayDialogueBlocksSequentially(
        [{ speaker: 'player', text: 'Hello.' }], { text: 'x', tags: ['delivery: loud'], choices: [] }, 0);
    assert.deepEqual(p.calls, []);
});

test('the TTS manager asks for a tagged line with its note and keeps tagged and untagged preloads apart', async () => {
    const asked = [];
    const mgrSrc = read('systems/tts-manager.js');
    const deps = { ApiClient: { getTTS: async (id, text, delivery) => { asked.push([id, text, delivery]); return { size: 1 }; } },
        URL: { createObjectURL: () => `blob:${asked.length}` } };
    const mgr = { enabled: true, preloadCache: new Map() };
    mgr._cacheKey = method(mgrSrc, '_cacheKey', {});
    mgr.preload = method(mgrSrc, 'preload', deps);
    await mgr.preload('kevin_park', 'Fine.', { delivery: 'flat' });
    await mgr.preload('kevin_park', 'Fine.');
    await mgr.preload('kevin_park', 'Fine.', { delivery: 'flat' });   // already preloaded: not asked again
    assert.deepEqual(asked, [['kevin_park', 'Fine.', 'flat'], ['kevin_park', 'Fine.', null]]);
    assert.deepEqual([...mgr.preloadCache.keys()], ['kevin_park|Fine.|flat', 'kevin_park|Fine.']);
});

test('a #delivery: tag is never run as a game action', () => {
    const helpers = read('minigames/helpers/chat-helpers.js');
    // both filters (processGameActionTags and getActionTags) drop it
    assert.equal(helpers.match(/action !== 'delivery'/g)?.length, 2);
});
