// `# clone_keycard:<card_id>` waits for its line, as `# trigger_minigame` does (review R1 M2).
// A tag on its own line in ink belongs to the next line of text, and displayAccumulatedDialogue
// runs a result's tags before showing its text. clone_keycard used to open the card reader at
// once, which replaced the chat; the story had already moved past the line, so the line
// carrying the tag was never shown (Len's "Had it years...", m08 Netherton, m09 Hatch and Noor).
// Now the tag queues the read (systems/ink-minigame-launch.js requestChatLaunch) and the
// person-chat opens it once its blocks have been shown; closing the reader reopens the chat.
//  - the tagged line is shown before the reader opens;
//  - closing the reader returns to the same conversation (pendingConversationReturn);
//  - no cloner: nothing is queued and the conversation carries on;
//  - a chat closed before the line finished opens nothing;
//  - a tag written after a knot's last line opens the reader instead of showing the choices;
//  - phone-chat: after the short delay; no chat open: at once.
// The person-chat methods are lifted out of the source and run on stubs.
// Run with: node test/js/clone-keycard-after-line.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

for (const k of ['log', 'info', 'warn', 'debug']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'clone-keycard-after-line-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));

const rfidOpened = [];
globalThis.window = { NPCGameBridge: {}, MinigameFramework: null };

writeFileSync(join(dir, 'registry-stub.mjs'), `
export const hasMinigameStarter = () => false;
export function startRegisteredMinigame() { return false; }
`);
copy('systems/ink-minigame-launch.js', 'ink-minigame-launch.mjs', (s) => s.replace("'./minigame-registry.js'", "'./registry-stub.mjs'"));
const launch = await import(pathToFileURL(join(dir, 'ink-minigame-launch.mjs')).href);

copy('utils/room-display-name.js', 'room-display-name.mjs');
copy('utils/global-condition.js', 'global-condition.mjs');
copy('utils/portrait-variants.js', 'portrait-variants.mjs', (s) => s.replace("'./global-condition.js'", "'./global-condition.mjs'"));
copy('systems/combat-input.js', 'combat-input.mjs');
copy('minigames/helpers/chat-helpers.js', 'chat-helpers.mjs',
    (s) => s.replace("'../../utils/room-display-name.js'", "'./room-display-name.mjs'")
        .replace("'../../utils/portrait-variants.js'", "'./portrait-variants.mjs'")
        .replace("'../../systems/combat-input.js'", "'./combat-input.mjs'"));
const { processGameActionTags } = await import(pathToFileURL(join(dir, 'chat-helpers.mjs')).href);
copy('minigames/person-chat/person-chat-pending-reply.js', 'pending-reply.mjs');
const { splitReplyTags, partitionSlowTags } = await import(pathToFileURL(join(dir, 'pending-reply.mjs')).href);

const pcSrc = readFileSync(join(js, 'minigames/person-chat/person-chat-minigame.js'), 'utf8');
function method(name, deps) {
    const m = pcSrc.match(new RegExp(`\\n    (async )?${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`));
    assert.ok(m, `${name} found`);
    const head = m[1] ? 'async function' : 'function';
    return new Function(...Object.keys(deps), `return ${head} (${m[2]}) {\n${m[3]}\n};`)(...Object.values(deps));
}
const rfidSrc = readFileSync(join(js, 'minigames/rfid/rfid-minigame.js'), 'utf8');
const returnSrc = rfidSrc.slice(rfidSrc.indexOf('export function returnToConversationAfterRFID('))
    .replace('export function', 'function');
const returnToConversationAfterRFID = new Function('window', `${returnSrc}\nreturn returnToConversationAfterRFID;`);

const READ_MS = 2000;
function harness({ cloner = true, scene = 'person-chat' } = {}) {
    rfidOpened.length = 0;
    launch.dropPendingInkMinigame();
    const shown = [];
    const choicesShown = [];
    const saved = [];
    const reopened = [];
    const fw = { currentMinigame: null, startMinigame: (type, _a, params) => reopened.push({ type, params }) };
    Object.assign(window, {
        MinigameFramework: fw,
        currentConversationNPCId: 'len',
        currentConversationMinigameType: scene,
        pendingConversationReturn: null,
        inventory: { items: cloner ? [{ scenarioData: { type: 'rfid_cloner' } }] : [] },
        npcManager: { getNPC: () => ({ rfidCard: { card_id: 'cm_records_badge', name: 'Records badge', rfid_protocol: 'EM4100' } }) },
        startRFIDMinigame: (_l, _t, params) => {
            rfidOpened.push({ params, shownBefore: shown.length });
            fw.currentMinigame = { _sceneType: 'rfid', _ending: false, params };
        }
    });
    const deps = {
        processGameActionTags, splitReplyTags, partitionSlowTags, window,
        npcConversationStateManager: { saveNPCState: () => saved.push(shown.length) },
        isSessionOverlayShowing: () => false, onSessionOverlayClosed: () => () => {},
        whenSessionOverlayClosed: async () => {},
        rememberNpcLine: () => {}, readingTimeMs: () => READ_MS, advanceDelayMs: () => READ_MS,
        DIALOGUE_AUTO_ADVANCE_DELAY: 1500
    };
    const next = [];
    const o = {
        _sceneType: scene, _ending: false, params: { npcId: 'len' },
        npcId: 'len', isClickThroughMode: false, autoAdvanceTimer: null, pendingContinueCallback: null,
        isProcessingDialogue: false, inkEngine: { story: {} }, ttsManager: null, characters: {},
        ui: { showDialogue: (text) => shown.push(text), showChoices: (c) => choicesShown.push(c), showNotification() {} },
        conversation: { continue: () => next.shift() },
        _tagOptions() { return {}; },
        createDialogueBlocks: (lines) => lines.map(text => ({ speaker: 'len', text })),
        showConversationOverMessage() {}
    };
    for (const name of ['scheduleDialogueAdvance', '_inkLaunchWaiting', 'displayAccumulatedDialogue', 'displayDialogueBlocksSequentially']) {
        o[name] = method(name, deps);
    }
    fw.currentMinigame = o;
    return { o, fw, shown, choicesShown, saved, reopened, next };
}

const HAD_IT = 'Len Okafor: Had it years. Keep meaning to swap it for the new sort, never do.';
const tagged = () => ({ text: HAD_IT, tags: ['clone_keycard:cm_records_badge'], canContinue: true, choices: [] });
const settle = async (t, ms) => { for (let i = 0; i < 20; i++) { t.mock.timers.tick(ms / 20); await Promise.resolve(); } };

test('the line carrying #clone_keycard is shown before the card reader opens', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const h = harness();
    h.o.displayAccumulatedDialogue(tagged());
    await Promise.resolve();
    assert.deepEqual(h.shown, [HAD_IT], 'the line is on screen');
    assert.equal(rfidOpened.length, 0, 'the reader waits for the line to be read');
    assert.equal(launch.hasPendingInkMinigame(), true);
    await settle(t, READ_MS + 1500);
    assert.equal(rfidOpened.length, 1, 'opened once the line has been read');
    assert.equal(rfidOpened[0].shownBefore, 1, 'after the line was shown');
    assert.equal(rfidOpened[0].params.mode, 'clone');
    assert.equal(rfidOpened[0].params.cardToClone.card_id, 'cm_records_badge');
    assert.deepEqual(rfidOpened[0].params.cloneSource, { npc_id: 'len' });
    assert.deepEqual(h.saved, [1], 'the story is saved past the line before the reader opens');
});

test('closing the card reader returns to the conversation', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const h = harness();
    h.o.displayAccumulatedDialogue(tagged());
    await settle(t, READ_MS + 1500);
    assert.deepEqual(window.pendingConversationReturn, { npcId: 'len', type: 'person-chat' });
    // RFIDMinigame.complete() calls this when the reader closes
    returnToConversationAfterRFID(window)();
    await settle(t, 100);
    assert.deepEqual(h.reopened, [{ type: 'person-chat', params: { npcId: 'len', fromTag: true } }]);
    assert.equal(window.pendingConversationReturn, null);
});

test('no cloner: nothing is queued and the conversation carries on', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const h = harness({ cloner: false });
    h.next.push({ text: '', tags: [], canContinue: false, choices: [{ text: 'Busy shift?' }] });
    h.o.displayAccumulatedDialogue(tagged());
    await settle(t, READ_MS + 1500);
    assert.deepEqual(h.shown, [HAD_IT]);
    assert.equal(rfidOpened.length, 0);
    assert.equal(launch.hasPendingInkMinigame(), false);
    assert.equal(h.choicesShown.length, 1, 'the hub choices come back');
});

test('the chat closes before the line is read: the reader does not open over the world', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const h = harness();
    h.o.displayAccumulatedDialogue(tagged());
    await Promise.resolve();
    h.fw.currentMinigame = null; // the player pressed Esc
    assert.equal(launch.flushInkMinigame(), false);
    assert.equal(rfidOpened.length, 0);
    assert.equal(window.pendingConversationReturn, null, 'no stale return is left behind');
});

test('a tag after the knot\'s last line opens the reader instead of showing the choices', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const h = harness();
    const choices = [{ text: 'Busy shift?' }];
    h.next.push({ text: '', tags: ['clone_keycard:cm_records_badge'], canContinue: false, choices });
    h.o.displayAccumulatedDialogue({ text: 'Len Okafor: Still about? I\'ll be round again in a minute.', tags: [], canContinue: true, choices: [] });
    await settle(t, READ_MS + 500);
    assert.equal(h.shown.length, 1);
    assert.equal(rfidOpened.length, 1, 'opened after the line');
    assert.equal(h.choicesShown.length, 0, 'the reopened chat shows the choices');
});

test('phone-chat: the reader opens after the short delay; no chat open: at once', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const h = harness({ scene: 'phone-chat' });
    await processGameActionTags(['clone_keycard:cm_records_badge'], null);
    assert.equal(rfidOpened.length, 0);
    t.mock.timers.tick(launch.PHONE_LAUNCH_DELAY_MS);
    assert.equal(rfidOpened.length, 1);
    assert.deepEqual(window.pendingConversationReturn, { npcId: 'len', type: 'phone-chat' });

    harness();
    window.MinigameFramework.currentMinigame = null;
    await processGameActionTags(['clone_keycard:cm_records_badge'], null);
    assert.equal(rfidOpened.length, 1, 'opened at once');
    assert.equal(launch.hasPendingInkMinigame(), false);
    void h;
});

test('isDeferredTag covers both tags', () => {
    assert.equal(window.inkMinigameLaunch.isDeferredTag('clone_keycard:x'), true);
    assert.equal(window.inkMinigameLaunch.isDeferredTag(' Trigger_Minigame:mail_terminal'), true);
    assert.equal(window.inkMinigameLaunch.isDeferredTag('give_item:key'), false);
    assert.equal(typeof window.inkMinigameLaunch.requestChatLaunch, 'function');
});
