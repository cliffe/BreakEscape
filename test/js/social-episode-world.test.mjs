// ENG-05a: the `world` modifier on a call attack (E12). The real runner, starter, model and
// framework in a jsdom document, as in social-episode-runner.test.mjs; the world moves are spies
// passed as params.deps (enterWorld / leaveWorld), and utils/world-play.js is tested on its own
// below with stub rooms and a stub player.
//   with `world`: the lobby entry (and costume) comes before the prep card; the hand-back runs
//   before the runner reopens for the flip, for every outcome; closing the prep card hands back too
//   without `world`: the call is launched exactly as the E3 path (no world or costume calls)
// Run with: node --test test/js/social-episode-world.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-episode-world-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/episode-runner/episode-runner-minigame.js', 'minigames/episode-runner/episode-model.js',
    'minigames/episode-runner/step-strip.js', 'minigames/episode-runner/flip-view.js',
    'minigames/episode-runner/debrief-view.js', 'minigames/episode-runner/role-swap.js', 'systems/episode-starter.js',
    'systems/awareness-measure.js', 'systems/global-writer.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-kinds.js', 'minigames/landing-page-builder/landing-page-render.js', 'minigames/landing-page-builder/landing-page-model.js',
    'minigames/inbox-triage/triage-flags.js', 'minigames/inbox-triage/triage-scoring.js', 'systems/phish-rules.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'ui/influence-bar.js', 'systems/social-influence.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'ui/modal-stack.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
console.log = () => {};
console.warn = () => {};
const errors = [];
console.error = (...a) => errors.push(a.map(String).join(' '));

const events = [];
window.eventDispatcher = { emit(name, data) { events.push({ name, data }); } };
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};
window.gameAlert = () => {};

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { SocialOverlayScene } = await load('minigames/framework/social-overlay.js');
const { EpisodeRunnerMinigame } = await load('minigames/episode-runner/episode-runner-minigame.js');
const { startEpisodeRunner } = await load('systems/episode-starter.js');
const M = await load('minigames/episode-runner/episode-model.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });

class StubOverlay extends SocialOverlayScene {
    init() { super.init(); this.mountCloseControl(this.gameContainer, 'Close'); }
}
FW.registerScene('episode-runner', EpisodeRunnerMinigame);
FW.registerScene('pretext-prep', StubOverlay);
FW.registerScene('phone-chat', StubOverlay);

const e3 = JSON.parse(readFileSync(join(here, 'fixtures/social_role_swap/e3_fragment.json'), 'utf8'));
const timers = [];
const runTimers = () => { const due = timers.splice(0); due.forEach((fn) => fn()); };
const listeners = new Map();
window.eventDispatcher.on = (name, fn) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); };
window.eventDispatcher.off = (name, fn) => { listeners.get(name)?.delete(fn); };
const fire = (name, data) => { for (const fn of [...(listeners.get(name) || [])]) fn(data); };
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

const log = [];
const WORLD = { room: 'lobby', startRoom: 'training_room', costume: { sprite: 'male_spy_v2', talk: 'assets/characters/male_spy_talk.png' } };
const baseDeps = {
    renderStepStrip(container) {
        const node = document.createElement('nav');
        container.appendChild(node);
        return { update() {}, destroy() { node.remove(); } };
    },
    renderFlipView(container, opts) {
        log.push('flip');
        const btn = document.createElement('button');
        btn.className = 'stub-continue';
        btn.addEventListener('click', () => opts.onContinue());
        container.appendChild(btn);
        return { destroy() {}, getState() { return {}; } };
    },
    renderDebrief(container) { return { destroy() {}, getState() { return {}; } }; },
    measure() { return { written: true }; },
    startTriage() { return null; },
    now: () => 1234,
    schedule: (fn) => { timers.push(fn); return fn; },
    clearScheduled: (h) => { const i = timers.indexOf(h); if (i >= 0) timers.splice(i, 1); }
};
let enterResult = true;
const worldDeps = {
    enterWorld: async (w) => { log.push(`enter:${w.room}:${w.costume?.sprite}`); return enterResult; },
    leaveWorld: async (w) => { log.push(`leave:${w.startRoom}`); return true; }
};

const CALL_ID = 'quayholt_helpdesk_reset';
const episode = (world) => ({
    id: 'e12_fixture', role: 'general', variant: 'full', conclusionTaskId: 'finish_episode',
    brand: { name: 'Merrin & Sallow', logoText: 'M&S', accent: '#6b4c9a' },
    stages: ['brief', 'write', 'flip', 'defend', 'debrief'],
    attack: { callId: CALL_ID, siteIds: [], scored: false },
    defend: JSON.parse(JSON.stringify(e3.awarenessEpisode.defend)),
    strings: {},
    ...(world ? { world } : {})
});
function setup(ep) {
    while (FW.currentMinigame) FW.forceCloseMinigame();
    document.body.innerHTML = '';
    log.length = 0; errors.length = 0; timers.length = 0; listeners.clear();
    enterResult = true;
    window.gameState = { globalVariables: { [M.stateKey(ep.id)]: { v: 1, done: ['brief'] }, se_awareness_records: {} } };
    window.gameScenario = { social: {
        awarenessEpisode: ep, triageSets: JSON.parse(JSON.stringify(e3.triageSets)),
        intelFacts: e3.intelFacts, pretextNpcs: e3.pretextNpcs, characters: e3.characters
    } };
}
const open = (ep) => startEpisodeRunner({ scenarioData: { name: 'Kiosk', minigameData: { episodeId: ep.id } } }, { deps: { ...baseDeps, ...worldDeps } });
const cur = () => FW.currentMinigame;
const scene = () => cur()?._sceneType ?? null;
const click = (sel) => { const n = cur().container.querySelector(sel); assert.ok(n, `no ${sel} in ${scene()}`); n.click(); };
const stored = (id) => window.gameState.globalVariables[M.stateKey(id)];
const outcomeKey = `pretext_${CALL_ID}_outcome`;
// The learner begins the call: the prep card hands over to the chat, which has no way back.
const beginCall = () => { FW.startMinigame('phone-chat', null, { npcId: 'leila_servicedesk' }); };
const endCall = async (outcome) => {
    window.gameState.globalVariables[outcomeKey] = outcome;
    fire(`global_variable_changed:${outcomeKey}`, { name: outcomeKey, value: outcome });
    runTimers();
    cur().requestClose(); // the chat closes
    runTimers();
    await flush();
};

test('worldFor: only a call attack with both rooms named; the costume and spawn are cleaned', () => {
    assert.equal(M.worldFor(episode()), null, 'absent');
    assert.deepEqual(M.worldFor(episode(WORLD)), { room: 'lobby', startRoom: 'training_room', spawn: null,
        costume: { sprite: 'male_spy_v2', talk: 'assets/characters/male_spy_talk.png' } });
    assert.equal(M.worldFor(episode({ room: 'lobby' })), null, 'half authored');
    const mail = episode(WORLD);
    delete mail.attack.callId;
    assert.equal(M.worldFor(mail), null, 'a mail attack ignores world');
    assert.deepEqual(M.worldFor(episode({ room: 'lobby', startRoom: 'k', costume: { talk: 'x' }, spawn: { x: 3, y: 'no' } })),
        { room: 'lobby', startRoom: 'k', spawn: null, costume: null });
    assert.deepEqual(M.worldFor(episode({ room: 'lobby', startRoom: 'k', spawn: { x: 3, y: 5 } })).spawn, { x: 3, y: 5 });
});

test('with world: the lobby and costume come first, then the prep card; the hand-back runs before the flip', async () => {
    const ep = episode(WORLD);
    setup(ep);
    open(ep);
    click('.epr-launch');
    assert.equal(scene(), 'episode-runner', 'the move is under way, the card is not open yet');
    await flush();
    assert.equal(scene(), 'pretext-prep');
    assert.equal(cur().params.callId, CALL_ID);
    assert.deepEqual(log, ['enter:lobby:male_spy_v2']);

    beginCall();
    await flush();
    assert.deepEqual(log, ['enter:lobby:male_spy_v2'], 'no hand-back while the call runs');
    await endCall('got_it');
    assert.deepEqual(log, ['enter:lobby:male_spy_v2', 'leave:training_room', 'flip'], 'handed back before the flip is drawn');
    assert.equal(scene(), 'episode-runner');
    assert.deepEqual(stored(ep.id).sent, { kind: 'call', callId: CALL_ID, outcome: 'got_it' });
    assert.equal(errors.length, 0, errors.join('\n'));
});

test('the hand-back runs before the runner reopens, whatever the outcome', async () => {
    for (const outcome of ['got_it', 'reported', 'walked_away']) {
        const ep = episode(WORLD);
        setup(ep);
        open(ep);
        click('.epr-launch');
        await flush();
        beginCall();
        await flush();
        const origStart = FW.startMinigame.bind(FW);
        FW.startMinigame = (name, ...rest) => { log.push(`start:${name}`); return origStart(name, ...rest); };
        await endCall(outcome);
        FW.startMinigame = origStart;
        assert.deepEqual(log.slice(log.indexOf('leave:training_room'), log.indexOf('flip')), ['leave:training_room', 'start:episode-runner'], outcome);
        assert.equal(scene(), 'episode-runner', outcome);
        assert.equal(stored(ep.id).sent.outcome, outcome);
    }
});

test('closing the prep card hands the learner back when the runner reopens', async () => {
    const ep = episode(WORLD);
    setup(ep);
    open(ep);
    click('.epr-launch');
    await flush();
    assert.equal(scene(), 'pretext-prep');
    cur().requestClose();
    await flush();
    assert.equal(scene(), 'episode-runner');
    assert.equal(log.filter((l) => l.startsWith('leave')).length >= 1, true, 'left the lobby again');
    assert.equal(log.at(-1), 'leave:training_room');
});

test('a lobby that will not load launches nothing and puts the learner back', async () => {
    const ep = episode(WORLD);
    setup(ep);
    open(ep);
    enterResult = false;
    click('.epr-launch');
    await flush();
    assert.equal(scene(), 'episode-runner');
    assert.deepEqual(log, ['enter:lobby:male_spy_v2', 'leave:training_room']);
    assert.ok(cur().container.querySelector('.epr-notice').textContent.length > 0, 'the learner is told');
});

test('without world the call is the built E3 path: the card opens at once, nothing moves', async () => {
    const ep = episode();
    setup(ep);
    open(ep);
    click('.epr-launch');
    assert.equal(scene(), 'pretext-prep', 'synchronously, as before');
    beginCall();
    await endCall('got_it');
    await flush();
    assert.deepEqual(log.filter((l) => /^(enter|leave)/.test(l)), [], 'no world or costume call at all');
    assert.equal(scene(), 'episode-runner');
});

// ── utils/world-play.js on its own ─────────────────────────────────────────────

const wp = await import(pathToFileURL(join(js, 'utils/world-play.js')).href);
function stage() {
    const moves = [];
    const player = { x: 100, y: 200, setPosition(x, y) { this.x = x; this.y = y; moves.push(['set', x, y]); }, body: { reset(x, y) { moves.push(['reset', x, y]); } } };
    const rooms = { training_room: { position: { x: 0, y: 0 }, map: { widthInPixels: 320, heightInPixels: 288 } } };
    const loaded = [];
    const costume = [];
    let paths = 0;
    return {
        moves, loaded, costume, player, rooms, paths: () => paths,
        deps: {
            player, rooms,
            loadRoom: async (id) => { loaded.push(id); rooms[id] = { position: { x: 640, y: 96 }, map: { widthInPixels: 320, heightInPixels: 288 } }; },
            cancelPath: () => { paths++; },
            applyCostume: async (c) => { costume.push(['on', c.sprite]); return true; },
            removeCostume: async () => { costume.push(['off']); return true; }
        }
    };
}

test('enterWorld loads the room, lands the player at its centre (or the spawn tile) and applies the costume', async () => {
    const s = stage();
    assert.equal(wp.worldActive(), false);
    assert.equal(await wp.enterWorld(WORLD, s.deps), true);
    assert.deepEqual(s.loaded, ['lobby']);
    assert.deepEqual(s.moves, [['set', 800, 240], ['reset', 800, 240]]);
    assert.deepEqual(s.costume, [['on', 'male_spy_v2']]);
    assert.equal(s.paths(), 1, 'a walk in progress is cancelled');
    assert.equal(wp.worldActive(), true);
    await wp.leaveWorld(WORLD, s.deps);

    const t = stage();
    await wp.enterWorld({ ...WORLD, spawn: { x: 2, y: 5 } }, t.deps);
    assert.deepEqual(t.moves[0], ['set', 640 + 64, 96 + 160]);
    await wp.leaveWorld(WORLD, t.deps);
});

test('leaveWorld puts the player back where they stood and takes the costume off; twice is harmless', async () => {
    const s = stage();
    await wp.enterWorld(WORLD, s.deps);
    s.moves.length = 0;
    assert.equal(await wp.leaveWorld(WORLD, s.deps), true);
    assert.deepEqual(s.moves, [['set', 100, 200], ['reset', 100, 200]]);
    assert.deepEqual(s.costume, [['on', 'male_spy_v2'], ['off']]);
    assert.equal(wp.worldActive(), false);
    assert.equal(await wp.leaveWorld(WORLD, s.deps), false, 'nobody displaced: nothing moves');
    assert.equal(s.moves.length, 2);
    assert.deepEqual(s.costume, [['on', 'male_spy_v2'], ['off']]);
});

test('a room that will not load rolls everything back and reports false', async () => {
    const s = stage();
    s.deps.loadRoom = async () => {};
    assert.equal(await wp.enterWorld(WORLD, s.deps), false);
    assert.equal(wp.worldActive(), false);
    assert.deepEqual(s.costume.filter((c) => c[0] === 'on'), [], 'no costume for a room never entered');
    assert.equal(s.player.x, 100);
});
