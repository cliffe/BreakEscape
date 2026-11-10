// Per-line delivery notes (#delivery: quietly, almost to herself) for voiced lines.
// - tts-delivery.js reads the tag the way the server does (TtsService.delivery_from_tags):
//   the last non-empty delivery tag wins, whitespace collapsed;
// - ApiClient.getTTS sends `delivery` only when there is a note, so an untagged line's
//   request body is exactly what it was;
// - person-chat passes the line's note to TTSManager.play/preload, the manager keeps tagged
//   and untagged preloads apart, and the tag is never processed as a game action.
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

test('person-chat sends the line\'s note; the manager keys tagged preloads apart', () => {
    const chat = read('minigames/person-chat/person-chat-minigame.js');
    assert.match(chat, /import \{ deliveryFromTags \} from '\.\.\/\.\.\/systems\/tts-delivery\.js';/);
    assert.match(chat, /const delivery = deliveryFromTags\(originalResult\?\.tags\);/);
    assert.match(chat, /this\.ttsManager\.play\(ttsSpeakerId, ttsText, \{ delivery \}\)/);
    // review R1 m2: the next line is preloaded without this line's note
    assert.match(chat, /this\.ttsManager\.preload\(nextSpeakerId, nextTtsText, \{ delivery: null \}\)/);

    const mgr = read('systems/tts-manager.js');
    assert.match(mgr, /async play\(npcId, text, \{ delivery = null \} = \{\}\)/);
    assert.match(mgr, /blob = await ApiClient\.getTTS\(npcId, text, delivery\);/);
    assert.match(mgr, /const blob = await ApiClient\.getTTS\(npcId, text, delivery\);/);
    assert.match(mgr, /return delivery \? `\$\{npcId\}\|\$\{text\}\|\$\{delivery\}` : `\$\{npcId\}\|\$\{text\}`;/);
});

test('a #delivery: tag is never run as a game action', () => {
    const helpers = read('minigames/helpers/chat-helpers.js');
    // both filters (processGameActionTags and getActionTags) drop it
    assert.equal(helpers.match(/action !== 'delivery'/g)?.length, 2);
});
