// Ink launch route: `# trigger_minigame:<type> [key=value ...]` opens a registry minigame
// (systems/ink-minigame-launch.js, called from chat-helpers.js processGameActionTags).
//  - the tag syntax: bare type, key=value pairs (spaces or "|"), a JSON object;
//  - an unknown type warns and opens nothing;
//  - in a person-chat the minigame waits for the line to be read (flush) and the chat is
//    paused with a returnTo that reopens the same conversation; a chat that closed first
//    means nothing opens;
//  - a phone-chat opens it after a short delay, with the same return;
//  - with no chat open it opens at once, with nothing to return to;
//  - another minigame already open: refused.
// Run with: node --test test/js/minigame-launch-ink.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

for (const k of ['log', 'info', 'warn', 'debug']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'minigame-launch-ink-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));

// The registry is stubbed: it knows two types and records what it is asked to start.
const started = [];
globalThis.__started = started;
globalThis.window = { NPCGameBridge: {}, MinigameFramework: null };
writeFileSync(join(dir, 'registry-stub.mjs'), `
export const hasMinigameStarter = (t) => ['exercise-station', 'mail_terminal'].includes(t);
export function startRegisteredMinigame(type, obj, options) {
  globalThis.__started.push({ type, obj, options });
  const fw = globalThis.window.MinigameFramework;
  if (fw && !globalThis.__noOpen) fw.currentMinigame = { _sceneType: type, params: {}, _ending: false };
  return true;
}
`);
copy('systems/ink-minigame-launch.js', 'ink-minigame-launch.mjs', (s) => s.replace("'./minigame-registry.js'", "'./registry-stub.mjs'"));
const launch = await import(pathToFileURL(join(dir, 'ink-minigame-launch.mjs')).href);

// chat-helpers, with its light imports copied (as social-tag-processor.test.mjs does)
copy('utils/room-display-name.js', 'room-display-name.mjs');
copy('utils/global-condition.js', 'global-condition.mjs');
copy('utils/portrait-variants.js', 'portrait-variants.mjs', (s) => s.replace("'./global-condition.js'", "'./global-condition.mjs'"));
copy('systems/combat-input.js', 'combat-input.mjs');
copy('minigames/helpers/chat-helpers.js', 'chat-helpers.mjs',
    (s) => s.replace("'../../utils/room-display-name.js'", "'./room-display-name.mjs'")
        .replace("'../../utils/portrait-variants.js'", "'./portrait-variants.mjs'")
        .replace("'../../systems/combat-input.js'", "'./combat-input.mjs'"));
const { processGameActionTags } = await import(pathToFileURL(join(dir, 'chat-helpers.mjs')).href);

function reset({ chat = null } = {}) {
    started.length = 0;
    launch.dropPendingInkMinigame();
    globalThis.__noOpen = false;
    window.MinigameFramework = { currentMinigame: chat };
}
const personChat = () => ({ _sceneType: 'person-chat', _ending: false,
    params: { npcId: 'reed', title: 'Reed', disableClose: false, startKnot: 'start', onComplete: () => {} } });

test('parse: a bare type, spaced pairs, bar-separated pairs and a JSON object', () => {
    assert.deepEqual(launch.parseMinigameTag('mail_terminal'), { type: 'mail_terminal', minigameData: {} });
    assert.deepEqual(launch.parseMinigameTag('exercise-station exerciseId=assistant_demo setGlobalPrefix=ex_a_'),
        { type: 'exercise-station', minigameData: { exerciseId: 'assistant_demo', setGlobalPrefix: 'ex_a_' } });
    assert.deepEqual(launch.parseMinigameTag('exercise-station|exerciseId=a|maxSends=3|readOnly=true'),
        { type: 'exercise-station', minigameData: { exerciseId: 'a', maxSends: 3, readOnly: true } });
    assert.deepEqual(launch.parseMinigameTag('mail_terminal {"accountIds":["a","b"],"readOnly":true}'),
        { type: 'mail_terminal', minigameData: { accountIds: ['a', 'b'], readOnly: true } });
    assert.ok(launch.parseMinigameTag('').error);
    assert.ok(launch.parseMinigameTag('mail_terminal {not json').error);
    assert.ok(launch.parseMinigameTag('mail_terminal lonely').error);
});

test('the tag in processGameActionTags: success is reported, an unknown type opens nothing', async () => {
    reset();
    const ok = await processGameActionTags(['trigger_minigame:exercise-station exerciseId=x'], null);
    assert.equal(ok[0].action, 'trigger_minigame');
    assert.equal(ok[0].success, true);
    assert.equal(started.length, 1);
    assert.deepEqual(started[0].obj.minigameData, { exerciseId: 'x' });

    reset();
    const bad = await processGameActionTags(['trigger_minigame:no-such-thing a=1'], null);
    assert.equal(bad[0].success, false);
    assert.equal(started.length, 0);
    const none = await processGameActionTags(['trigger_minigame'], null);
    assert.equal(none[0].success, false);
});

test('no chat open: it opens at once, with nothing to return to', () => {
    reset();
    assert.equal(launch.requestInkMinigame('mail_terminal accountIds=["a"]').success, true);
    assert.equal(started.length, 1);
    assert.equal(started[0].type, 'mail_terminal');
    assert.deepEqual(started[0].obj.minigameData, { accountIds: ['a'] });
    assert.equal(window.MinigameFramework.currentMinigame.params.returnTo, undefined);
    assert.equal(launch.hasPendingInkMinigame(), false);
});

test('person-chat: waits for the line, then opens with a returnTo that reopens the conversation', () => {
    const chat = personChat();
    reset({ chat });
    assert.equal(launch.requestInkMinigame('exercise-station exerciseId=assistant_demo').success, true);
    assert.equal(started.length, 0, 'not before the line has been read');
    assert.equal(launch.hasPendingInkMinigame(), true);
    assert.equal(launch.flushInkMinigame(), true);
    assert.equal(started.length, 1);
    const opened = window.MinigameFramework.currentMinigame;
    assert.equal(opened._sceneType, 'exercise-station');
    assert.equal(opened.params.returnTo.sceneType, 'person-chat');
    assert.deepEqual(opened.params.returnTo.params, { npcId: 'reed', title: 'Reed', disableClose: false, fromTag: true },
        'the same NPC and options; no knot jump and no old callback');
    assert.equal(launch.hasPendingInkMinigame(), false);
    assert.equal(launch.flushInkMinigame(), false, 'a second flush does nothing');
});

test('person-chat: if the chat closes before the line is read, nothing opens', () => {
    const chat = personChat();
    reset({ chat });
    launch.requestInkMinigame('exercise-station exerciseId=a');
    window.MinigameFramework.currentMinigame = null; // the player closed the chat
    assert.equal(launch.flushInkMinigame(), false);
    assert.equal(started.length, 0);
    // and the person-chat's own cleanup drops a request it was holding
    reset({ chat: personChat() });
    launch.requestInkMinigame('exercise-station exerciseId=a');
    launch.dropPendingInkMinigame();
    assert.equal(launch.flushInkMinigame(), false);
});

test('phone-chat: opens after a short delay and returns to the phone thread', () => {
    const timers = [];
    const realSet = globalThis.setTimeout;
    globalThis.setTimeout = (cb, ms) => { timers.push({ cb, ms }); return timers.length; };
    try {
        const phone = { _sceneType: 'phone-chat', _ending: false, params: { npcId: 'agent', phoneId: 'player_phone', title: 'Phone', startKnot: 'k' } };
        reset({ chat: phone });
        launch.requestInkMinigame('exercise-station exerciseId=a');
        assert.equal(started.length, 0);
        assert.equal(timers.length, 1);
        assert.equal(timers[0].ms, launch.PHONE_LAUNCH_DELAY_MS);
        timers[0].cb();
        assert.equal(started.length, 1);
        assert.deepEqual(window.MinigameFramework.currentMinigame.params.returnTo,
            { sceneType: 'phone-chat', params: { npcId: 'agent', phoneId: 'player_phone', title: 'Phone', fromTag: true } });
    } finally {
        globalThis.setTimeout = realSet;
    }
});

test('another minigame is open: refused, nothing queued', () => {
    reset({ chat: { _sceneType: 'mail-client', _ending: false, params: {} } });
    const r = launch.requestInkMinigame('exercise-station exerciseId=a');
    assert.equal(r.success, false);
    assert.equal(launch.hasPendingInkMinigame(), false);
    assert.equal(started.length, 0);
});

test('window.inkMinigameLaunch is what the chat minigames call', () => {
    assert.equal(typeof window.inkMinigameLaunch.request, 'function');
    assert.equal(window.inkMinigameLaunch.isTriggerTag('trigger_minigame:mail_terminal'), true);
    assert.equal(window.inkMinigameLaunch.isTriggerTag(' Trigger_Minigame'), true);
    assert.equal(window.inkMinigameLaunch.isTriggerTag('give_item:key'), false);
});
