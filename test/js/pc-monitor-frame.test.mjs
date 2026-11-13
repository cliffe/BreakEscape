// UX slice 2c: the one PC monitor frame (utils/pc-monitor.js, css/pc-monitor.css) and NPC
// headshots (utils/npc-headshot.js). Frame sizing at 1400x1000, 800x600, 915x412 and
// 390x844; the post-it's place on the frame; the headshot path and its fallback; and the
// same frame for a PC's sign-in screen and its desktop. The real password-minigame.js,
// container-minigame.js and base-minigame.js run against jsdom.
// Run with: node test/js/pc-monitor-frame.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const css = (name) => readFileSync(join(here, '../../public/break_escape/css', name), 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'pc-monitor-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('config.js', 'export const ASSETS_PATH = "/break_escape/assets";\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
put('utils/conditional-text.js', 'export function resolveObjectField(o, f, d) { return (o && o[f] != null) ? o[f] : d; }\n');
put('systems/inventory.js', 'export async function addToInventory() { return { ok: true }; }\nexport function removeFromInventory() {}\nexport function inventoryImageKey(d) { return d?.type; }\n');
for (const rel of ['utils/escape-html.js', 'utils/computer-keywords.js', 'utils/author-html.js', 'utils/lock-scope-refusal.js',
    'utils/pc-monitor.js', 'utils/more-below.js', 'utils/npc-headshot.js', 'minigames/framework/base-minigame.js',
    'minigames/container/container-item-image.js', 'minigames/container/container-minigame.js',
    'minigames/password/password-minigame.js', 'systems/pc-sessions.js', 'minigames/text-file/text-file-minigame.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { pcMonitorMetrics, pcViewSpace, mountPcMonitor, resetPostitHeights, keptPostitHeight, keepPostitHeight, keptPostitCount, cssZoomOf, PC_BEZEL, PC_SCREEN_ASPECT, PC_PORTRAIT_ASPECT, PC_SCREEN_MIN,
    PC_POSTIT_GAP, PC_POSTIT_CLEAR, PC_FRAME_EDGE } = await imp('utils/pc-monitor.js');
const { headshotKeys, headshotCandidates, headshotUrl, characterKey, noteMissingHeadshot, resetMissingHeadshots, npcRecordFor, applyHeadshotBox } = await imp('utils/npc-headshot.js');
const { PasswordMinigame, applyTilePortrait } = await imp('minigames/password/password-minigame.js');
const { ContainerMinigame } = await imp('minigames/container/container-minigame.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
const { TextFileMinigame, pcScreenOf } = await imp('minigames/text-file/text-file-minigame.js');

const SIZES = [[1400, 1000], [800, 600], [915, 412], [390, 844]];
const settle = (ms = 0) => new Promise(r => setTimeout(r, ms));

// ── Sizing ───────────────────────────────────────────────────────────────────

test('the frame fits inside the window at every listed size, with the room for the hanging post-it', () => {
    for (const [w, h] of SIZES) {
        const m = pcMonitorMetrics(w, h);
        assert.ok(m.left >= 0 && m.top >= 0, `${w}x${h}: on screen`);
        assert.ok(m.left + m.width <= w, `${w}x${h}: no overflow to the right (${m.left}+${m.width})`);
        assert.ok(m.top + m.height + m.bezel.hang <= h, `${w}x${h}: no overflow below (${m.top}+${m.height}+${m.bezel.hang})`);
        for (const v of [m.left, m.top, m.width, m.height, m.screen.width, m.screen.height]) {
            assert.equal(Number.isInteger(v), true, `${w}x${h}: whole pixels (${v})`);
        }
        // The monitor is the screen plus the bezel strips and the 2px edges
        assert.equal(m.width, m.screen.width + 2 * m.bezel.side + 4 * PC_FRAME_EDGE);
        assert.equal(m.height, m.screen.height + m.bezel.top + m.bezel.chin + 4 * PC_FRAME_EDGE);
        // The X (30px) fits in the top strip, inside the frame
        assert.ok(m.bezel.top >= 30 + 4, `${w}x${h}: the X fits in the top strip`);
    }
});

test('the frame grows to fill the space: large at 1400x1000, near full width at 800x600', () => {
    const big = pcMonitorMetrics(1400, 1000);
    assert.deepEqual(big.screen, { width: 1120, height: 700 }, 'capped at 1120x700');
    assert.equal(big.compact, false);
    const mid = pcMonitorMetrics(800, 600);
    assert.equal(mid.compact, false);
    assert.ok(mid.width >= 800 - 2 * PC_BEZEL.full.gutter - 2, `800x600: as wide as the gutters allow (${mid.width})`);
});

test('a landscape window keeps the 16:10 screen; a portrait phone gets a portrait monitor', () => {
    for (const [w, h] of [[1400, 1000], [800, 600], [915, 412]]) {
        const m = pcMonitorMetrics(w, h);
        assert.ok(Math.abs(m.screen.width / m.screen.height - PC_SCREEN_ASPECT) < 0.02, `${w}x${h}: 16:10 (${m.screen.width}x${m.screen.height})`);
    }
    const phone = pcMonitorMetrics(390, 844);
    assert.ok(phone.screen.height > phone.screen.width, 'portrait');
    assert.ok(phone.screen.width / phone.screen.height >= PC_PORTRAIT_ASPECT - 0.01, 'no taller than 10:16');
    // R1 m10: the 10:16 cap uses the phone's height (about 342x546, was 342x456)
    assert.ok(phone.screen.height >= 540, `the phone's height is used (${phone.screen.width}x${phone.screen.height})`);
});

test('short and narrow windows use the compact bezel, with sensible minimums', () => {
    assert.equal(pcMonitorMetrics(915, 412).compact, true);
    assert.equal(pcMonitorMetrics(390, 844).compact, true);
    // R1 m1: a portrait phone is narrow, not short; a phone on its side is short
    assert.deepEqual([pcMonitorMetrics(390, 844).narrow, pcMonitorMetrics(390, 844).short], [true, false]);
    assert.deepEqual([pcMonitorMetrics(915, 412).narrow, pcMonitorMetrics(915, 412).short], [false, true]);
    assert.deepEqual([pcMonitorMetrics(800, 600).narrow, pcMonitorMetrics(800, 600).short], [false, false]);
    for (const [w, h] of [[915, 412], [390, 844]]) {
        const m = pcMonitorMetrics(w, h);
        assert.ok(m.screen.width >= PC_SCREEN_MIN.width, `${w}x${h}: at least ${PC_SCREEN_MIN.width} wide`);
        assert.ok(m.screen.height >= PC_SCREEN_MIN.height, `${w}x${h}: at least ${PC_SCREEN_MIN.height} tall`);
    }
    // A window too small for the minimum still never overflows
    const tiny = pcMonitorMetrics(300, 260);
    assert.ok(tiny.left + tiny.width <= 300 && tiny.top + tiny.height + tiny.bezel.hang <= 260, 'tiny window: still inside');
});

// ── The post-it ──────────────────────────────────────────────────────────────

test('the post-it sits on the chin: its top just under the screen, in from the left, at every size', () => {
    for (const [w, h] of SIZES) {
        const m = pcMonitorMetrics(w, h);
        const screenBottom = 3 * PC_FRAME_EDGE + m.bezel.top + m.screen.height;
        assert.equal(m.postit.top, screenBottom + PC_POSTIT_GAP, `${w}x${h}: just under the screen's bottom edge`);
        assert.ok(m.postit.top < m.height, `${w}x${h}: its top is on the bezel, not below the monitor`);
        assert.ok(m.postit.left > m.bezel.side, `${w}x${h}: in past the side bezel (${m.postit.left})`);
        assert.ok(m.postit.left + m.postit.maxWidth <= m.width, `${w}x${h}: never past the right edge`);
    }
});

test('R1 M1: the chin holds the note: its bottom edge is on the bezel at every size, for one and two lines', () => {
    // A fixed note height per line count: full 44 (one line) and 64 (two); compact 36 and 54
    for (const [w, h] of SIZES) {
        const compact = pcMonitorMetrics(w, h).compact;
        for (const noteH of compact ? [36, 54] : [44, 64]) {
            const m = pcMonitorMetrics(w, h, { postitHeight: noteH });
            const bottom = m.postit.top + noteH;
            assert.ok(bottom <= m.height - PC_FRAME_EDGE, `${w}x${h} ${noteH}px: the bottom (${bottom}) is inside the outline (${m.height})`);
            assert.ok(bottom >= m.height - 4, `${w}x${h} ${noteH}px: and on the chin, within 4px of the frame's bottom (${bottom} of ${m.height})`);
            assert.equal(m.bezel.chin, Math.max(m.bezel.chin, PC_POSTIT_GAP + noteH + PC_POSTIT_CLEAR));
            assert.ok(m.top + m.height + m.bezel.hang <= h, `${w}x${h} ${noteH}px: still inside the window`);
        }
    }
    // A short note in a tall chin keeps the chin's own height
    const plain = pcMonitorMetrics(1400, 1000, { postitHeight: 20 });
    assert.equal(plain.bezel.chin, PC_BEZEL.full.chin);
});

test('R1 M2: the screen content scales in whole steps: x2 at 1400x1000, x1 at the smaller sizes', () => {
    const want = { '1400x1000': 2, '800x600': 1, '915x412': 1, '390x844': 1 };
    for (const [w, h] of SIZES) {
        const m = pcMonitorMetrics(w, h);
        assert.equal(Number.isInteger(m.uiScale), true);
        assert.equal(m.uiScale, want[`${w}x${h}`], `${w}x${h}`);
    }
    assert.equal(pcMonitorMetrics(1920, 1080).uiScale, 2, 'capped by the 1120x700 screen');
});

test('R2 M3: the space is the container\'s 100dvh box; a pinch zoom or the keyboard\'s pan does not change it', () => {
    const container = { getBoundingClientRect: () => ({ width: 390, height: 844 }) };
    const base = pcViewSpace(container, { innerWidth: 390, innerHeight: 844 });
    assert.deepEqual(base, { width: 390, height: 844 });
    // A pinch at x2: the visual viewport is half the size, the frame is not rebuilt smaller
    const pinched = { innerWidth: 390, innerHeight: 844, visualViewport: { width: 195, height: 422, scale: 2, offsetTop: 0, offsetLeft: 0 } };
    assert.deepEqual(pcViewSpace(container, pinched), base, 'scale 2 gives the same space as scale 1');
    assert.equal(JSON.stringify(pcMonitorMetrics(pcViewSpace(container, pinched).width, pcViewSpace(container, pinched).height)),
        JSON.stringify(pcMonitorMetrics(base.width, base.height)), 'and the same metrics');
    // The iOS keyboard pans the visual viewport: the frame neither moves nor shrinks
    const keyboard = { innerWidth: 390, innerHeight: 844, visualViewport: { width: 390, height: 500, scale: 1, offsetTop: 120, offsetLeft: 0 } };
    assert.deepEqual(pcViewSpace(container, keyboard), base, 'offsetTop 120 leaves it unchanged');
    // With no box yet, the window's size
    assert.deepEqual(pcViewSpace(null, { innerWidth: 800, innerHeight: 600 }), { width: 800, height: 600 });
    const frame = css('pc-monitor.css');
    const rule = frame.slice(frame.indexOf('.minigame-container.pc-view {'), frame.indexOf('}', frame.indexOf('.minigame-container.pc-view {')));
    assert.match(rule, /height: 100vh;\s*height: 100dvh;/, '100dvh with the 100vh fallback first');
});

test('R2 M3: a visual viewport resize or scroll (a pinch, the keyboard) does not rebuild or move a mounted frame', () => {
    document.body.innerHTML = '<div id="vv"><div class="minigame-game-container"></div></div>';
    const container = document.getElementById('vv');
    const scene = { container, gameContainer: container.querySelector('.minigame-game-container') };
    // A view whose visual viewport is a real event target, so a listener on it would run
    const view = new window.EventTarget();
    Object.assign(view, { innerWidth: 800, innerHeight: 600, visualViewport: new window.EventTarget() });
    const parts = mountPcMonitor(scene, { name: 'PC', view });
    const first = parts.metrics;
    const style = parts.root.getAttribute('style');
    view.visualViewport.width = 400;
    view.visualViewport.dispatchEvent(new window.Event('resize'));
    view.visualViewport.dispatchEvent(new window.Event('scroll'));
    assert.equal(parts.metrics, first, 'update did not run again');
    assert.equal(parts.root.getAttribute('style'), style, 'the frame kept its size and place');
    // The window's own resize still updates it (the listener this test relies on is live)
    view.innerWidth = 1400; view.innerHeight = 1000;
    view.dispatchEvent(new window.Event('resize'));
    assert.notEqual(parts.metrics, first, 'a window resize does update');
    parts.destroy();
});

test('R2 m2: cssZoomOf reads currentCSSZoom, else the screen area\'s drawn-to-layout ratio', () => {
    assert.equal(cssZoomOf({ currentCSSZoom: 2 }), 2);
    const area = { offsetWidth: 560, getBoundingClientRect: () => ({ width: 1120 }) };
    const inside = { closest: (sel) => (sel === '.pc-monitor-area' ? area : null) };
    assert.equal(cssZoomOf(inside), 2, 'no currentCSSZoom, a 2:1 rect-to-offset ratio');
    assert.equal(cssZoomOf({ closest: () => null }), 1, 'outside the monitor');
    assert.equal(cssZoomOf(null), 1);
});

// ── Headshots ────────────────────────────────────────────────────────────────

test('headshot keys: an avatar headshot, the world sprite, then the talk stem (v2 first)', () => {
    assert.equal(characterKey('assets/characters/female_blowse_talk.png'), 'female_blowse');
    assert.equal(characterKey('hacker-talk.png'), 'hacker');
    assert.equal(characterKey('assets/characters/agent_hax_v2_headshot.png'), 'agent_hax_v2');
    assert.deepEqual(headshotKeys({ portrait: 'assets/characters/female_blowse_talk.png' }), ['female_blowse_v2', 'female_blowse']);
    assert.deepEqual(headshotKeys({ portrait: 'assets/characters/female_blowse_talk.png', spriteSheet: 'female_blowse_v2' }), ['female_blowse_v2', 'female_blowse']);
    assert.deepEqual(headshotKeys({ avatar: 'assets/characters/david_torres_ko_headshot.png', portrait: 'assets/characters/david_torres_talk.png' }),
        ['david_torres_ko', 'david_torres_v2', 'david_torres']);
    assert.deepEqual(headshotKeys({ avatar: 'assets/npc/avatars/x.png' }), [], 'a non-headshot avatar is not a key');
    assert.equal(headshotUrl('agent_hax_v2'), '/break_escape/assets/characters/agent_hax_v2_headshot.png');
    assert.deepEqual(headshotCandidates({ spriteSheet: 'agent_hax_v2' }), ['/break_escape/assets/characters/agent_hax_v2_headshot.png']);
});

test('the test scenarios\' sign-in NPCs all have a headshot file', () => {
    const chars = join(here, '../../public/break_escape/assets/characters');
    for (const key of ['male_office_worker_v2', 'male_nerd_v2', 'female_blowse_v2', 'agent_hax_v2']) {
        assert.ok(existsSync(join(chars, `${key}_headshot.png`)), key);
    }
});

test('a missing headshot is logged once per key', () => {
    resetMissingHeadshots();
    const logs = [];
    assert.equal(noteMissingHeadshot('ms_okafor', (m) => logs.push(m)), true);
    assert.equal(noteMissingHeadshot('ms_okafor', (m) => logs.push(m)), false);
    assert.equal(noteMissingHeadshot('mr_pryce', (m) => logs.push(m)), true);
    assert.equal(logs.length, 2);
    assert.match(logs[0], /ms_okafor_headshot\.png/);
    // R1 m8: the log names every key tried, the world sprite's first
    assert.equal(noteMissingHeadshot(['mr_pryce_sprite', 'mr_pryce_v2', 'mr_pryce'], (m) => logs.push(m)), true);
    assert.match(logs[2], /none of mr_pryce_sprite_headshot\.png, mr_pryce_v2_headshot\.png, mr_pryce_headshot\.png/);
});

function fakeImage(sizes) {
    return class {
        set src(v) {
            this._src = v;
            const size = sizes[v];
            setTimeout(() => {
                if (size) { this.naturalWidth = size[0]; this.naturalHeight = size[1]; this.onload?.(); }
                else this.onerror?.();
            }, 0);
        }
        get src() { return this._src; }
    };
}

test('a tile shows the headshot at x2, never the talk crop, when the file exists', async () => {
    const el = document.createElement('span');
    const missing = [];
    applyTilePortrait(el, { username: 'lfox', displayName: 'Lena Fox', portrait: 'assets/characters/female_blowse_talk.png' }, fakeImage({
        '/break_escape/assets/characters/female_blowse_v2_headshot.png': [32, 32],
        '/break_escape/assets/characters/female_blowse_talk.png': [256, 256]
    }), () => null, { record: null, onMissing: (k) => missing.push(k) });
    await settle(5); await settle(5);
    assert.equal(el.dataset.headshot, 'female_blowse_v2');
    assert.match(el.style.backgroundImage, /female_blowse_v2_headshot\.png/);
    assert.equal(el.style.backgroundSize, '64px 64px', 'the 32px headshot at x2');
    assert.equal(el.dataset.short, 'avatar', 'and at x1 in the short window');
    assert.deepEqual(missing, []);
});

test('the world sprite from the NPC record picks the headshot', async () => {
    const manager = { npcs: new Map([['ian', { id: 'ian', creds: { username: 'ishaw' }, spriteSheet: 'male_nerd_v2' }]]) };
    assert.equal(npcRecordFor({ username: 'ishaw' }, manager).spriteSheet, 'male_nerd_v2');
    assert.equal(npcRecordFor({ username: 'nobody' }, manager), null);
    const el = document.createElement('span');
    applyTilePortrait(el, { username: 'ishaw', portrait: 'assets/characters/someone_else_talk.png' }, fakeImage({
        '/break_escape/assets/characters/male_nerd_v2_headshot.png': [32, 32]
    }), () => null, { record: manager.npcs.get('ian') });
    await settle(5); await settle(5);
    assert.equal(el.dataset.headshot, 'male_nerd_v2');
});

test('no headshot file: the talk crop as before, and the key is logged once', async () => {
    const el = document.createElement('span');
    const missing = [];
    applyTilePortrait(el, { username: 'okafor', portrait: 'assets/characters/ms_okafor_talk.png' }, fakeImage({
        '/break_escape/assets/characters/ms_okafor_talk.png': [256, 256]
    }), () => null, { record: null, onMissing: (k) => missing.push(k) });
    for (let i = 0; i < 4; i++) await settle(5);
    assert.equal(el.dataset.frame, 'talk-sheet', 'the crop fallback');
    assert.equal(el.dataset.headshot, undefined);
    assert.deepEqual(missing, [['ms_okafor_v2', 'ms_okafor']], 'logged once, with every key tried');
    assert.equal(el.dataset.headshotMissing, 'ms_okafor_v2 ms_okafor');
});

test('R1 m8: the desktop bar falls back the same way as a tile: the talk sheet\'s 32x32 head crop', async () => {
    const box = document.createElement('span');
    const missing = [];
    applyHeadshotBox(box, { spriteSheet: 'ms_okafor_sprite', portrait: 'assets/characters/ms_okafor_talk.png' }, {
        talkUrl: '/break_escape/assets/characters/ms_okafor_talk.png',
        ImageCtor: fakeImage({ '/break_escape/assets/characters/ms_okafor_talk.png': [256, 256] }),
        readAlpha: () => null, onMissing: (k) => missing.push(k)
    });
    for (let i = 0; i < 6; i++) await settle(5);
    assert.deepEqual(missing, [['ms_okafor_sprite', 'ms_okafor_v2', 'ms_okafor']], 'every key, the sprite sheet first');
    assert.equal(box.dataset.frame, 'head-crop');
    assert.equal(box.hidden, false);
    assert.equal(box.style.backgroundSize, '256px 256px', 'at scale 1');
    // the bedside override (the same crop as the short tile)
    assert.equal(box.style.backgroundPosition, '-36px -30px');
    // a headshot file wins, at x1
    const shot = document.createElement('span');
    applyHeadshotBox(shot, { spriteSheet: 'male_nerd_v2' }, {
        ImageCtor: fakeImage({ '/break_escape/assets/characters/male_nerd_v2_headshot.png': [32, 32] }), onMissing: () => assert.fail('not missing')
    });
    await settle(5); await settle(5);
    assert.equal(shot.dataset.headshot, 'male_nerd_v2');
    assert.equal(shot.style.backgroundSize, '32px 32px');
});

// ── One frame for sign-in and desktop ────────────────────────────────────────

function sizeWindow(w, h) {
    window.innerWidth = w; window.innerHeight = h;
    // The minigame container fills the window (minigames-framework.css)
    const had = window.HTMLElement.prototype.getBoundingClientRect;
    window.HTMLElement.prototype.getBoundingClientRect = function () {
        if (this.id === 'mg') return { left: 0, top: 0, right: w, bottom: h, width: w, height: h };
        return had.call(this);
    };
    return () => { window.HTMLElement.prototype.getBoundingClientRect = had; };
}

function frameBox() {
    const root = document.querySelector('.pc-monitor');
    const screen = document.querySelector('.pc-monitor-screen');
    const note = document.querySelector('.pc-monitor-postit');
    return JSON.stringify({
        root: [root.style.left, root.style.top, root.style.width, root.style.height],
        screen: [screen.style.left, screen.style.top, screen.style.width, screen.style.height],
        note: note ? [note.style.left, note.style.top] : null,
        compact: root.hasAttribute('data-compact')
    });
}

async function signInScreen() {
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.playUISound = () => {};
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: 'Sign in', postitNote: 'Sam: sokafor / x', showPostit: true,
        signIn: { pcId: 'hot_desk', pcName: 'Hot desk PC', picker: 'accounts', tiles: [{ username: 'sokafor', displayName: 'Sam Okafor', portrait: null, avatar: null }] }
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    return mg;
}

async function desktop({ showPostit = true, observations = 'A hot desk.', contents = null } = {}) {
    document.body.innerHTML = '<div id="mg"></div>';
    window.inventory = { items: [] };
    window.breakEscapeConfig = { gameId: 7 };
    window.eventDispatcher = { emit: () => {} };
    window.ApiClient = { login: async () => ({ success: true, npcId: 'sam', username: 'sokafor', displayName: 'Sam Okafor', via: 'password' }) };
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ contents: contents || [] }) });
    window.pcSessions = new PcSessions();
    await window.pcSessions.signIn('hot_desk', 'sokafor', 'x');
    window.npcManager = { npcs: new Map([['sam', { id: 'sam', spriteSheet: 'male_office_worker_v2' }]]), getNPC(id) { return this.npcs.get(id); } };
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    const containerItem = { scenarioData: { id: 'hot_desk', type: 'pc', name: 'Hot desk PC', locked: true, lockType: 'login', observations, postitNote: 'Sam: sokafor / x', showPostit } };
    const mg = new ContainerMinigame(document.getElementById('mg'), { title: 'Hot desk PC', containerItem, contents, desktopMode: true, showCancel: true, cancelText: 'Close' });
    window.MinigameFramework.currentMinigame = mg;
    await mg.init();
    return mg;
}

test('a PC\'s sign-in screen and its desktop use the same frame, at the same size and place', async () => {
    for (const [w, h] of SIZES) {
        const restore = sizeWindow(w, h);
        try {
            const a = await signInScreen();
            const signIn = frameBox();
            a.cleanup?.();
            const b = await desktop();
            const desk = frameBox();
            assert.equal(desk, signIn, `${w}x${h}: same frame`);
            const m = pcMonitorMetrics(w, h);
            assert.equal(document.querySelector('.pc-monitor').style.width, `${m.width}px`, `${w}x${h}: sized by the metrics`);
            // The desktop's X is in the bezel; its Close button is gone; Add to Notepad is in the chin
            assert.ok(document.querySelector('.pc-monitor-bezel > #minigame-close'), 'the X in the bezel');
            assert.equal(document.getElementById('minigame-cancel'), null, 'no Close beside the X');
            assert.ok(document.querySelector('.pc-monitor-controls #minigame-notebook-postit'), 'Add to Notepad in the chin');
            assert.equal(document.querySelector('.pc-monitor-name').textContent, 'Hot desk PC');
            b.cleanup?.();
        } finally {
            restore();
        }
    }
});

test('the desktop\'s account bar shows the signed-in NPC\'s headshot', async () => {
    const restore = sizeWindow(1400, 1000);
    globalThis.Image = fakeImage({ '/break_escape/assets/characters/male_office_worker_v2_headshot.png': [32, 32] });
    try {
        await desktop();
        await settle(5); await settle(5);
        const box = document.querySelector('.pc-desktop-topbar .desktop-account-headshot');
        assert.ok(box, 'a headshot in the top bar');
        assert.equal(box.dataset.headshot, 'male_office_worker_v2');
        assert.match(box.style.backgroundImage, /male_office_worker_v2_headshot\.png/);
        assert.equal(box.hidden, false);
    } finally {
        delete globalThis.Image;
        restore();
    }
});

test('R1 live check: a share\'s file names get an even width, so centring them lands on whole pixels', async () => {
    const { evenShareLabels } = await imp('minigames/container/container-minigame.js');
    const grid = document.createElement('div');
    const widths = [37, 40, 41.3];
    for (const w of widths) {
        const label = document.createElement('div');
        label.className = 'container-content-label';
        label.getBoundingClientRect = () => ({ width: label.style.width ? parseFloat(label.style.width) : w });
        grid.appendChild(label);
    }
    evenShareLabels(grid);
    assert.deepEqual([...grid.children].map(l => l.style.width), ['38px', '', '42px']);
});

// ── R1: the note's height, the content scale, listeners, drag, the description ──

function stubNoteHeight(px) {
    const proto = window.HTMLElement.prototype;
    const had = Object.getOwnPropertyDescriptor(proto, 'offsetHeight');
    Object.defineProperty(proto, 'offsetHeight', {
        configurable: true,
        get() { return this.classList?.contains('pc-monitor-postit') ? px : (had?.get ? had.get.call(this) : 0); }
    });
    return () => Object.defineProperty(proto, 'offsetHeight', had);
}

test('R1 M1: the mounted frame grows its chin to the note, and keeps that height for the PC\'s views without it', async () => {
    for (const [w, h] of SIZES) {
        resetPostitHeights();
        const restore = sizeWindow(w, h);
        const unstub = stubNoteHeight(52);
        try {
            const a = await signInScreen();
            const signIn = frameBox();
            const root = document.querySelector('.pc-monitor');
            const note = document.querySelector('.pc-monitor-postit');
            const bottom = parseInt(note.style.top, 10) + 52;
            assert.ok(bottom <= parseInt(root.style.height, 10) - PC_FRAME_EDGE, `${w}x${h}: the two-line note ends on the bezel`);
            assert.equal(keptPostitHeight('hot_desk', `${w}x${h}`), 52, 'kept for the PC');
            a.cleanup?.();
            // The same PC's desktop with no note on it: the same frame
            const b = await desktop({ showPostit: false });
            assert.equal(document.querySelector('.pc-monitor-postit'), null);
            const desk = JSON.parse(frameBox());
            const was = JSON.parse(signIn);
            assert.deepEqual(desk.root, was.root, `${w}x${h}: same size and place without the note`);
            assert.deepEqual(desk.screen, was.screen);
            b.cleanup?.();
        } finally {
            unstub();
            restore();
        }
    }
    resetPostitHeights();
});

test('R1 M2: the frame carries its whole-number content scale for the CSS zoom', async () => {
    for (const [w, h] of SIZES) {
        const restore = sizeWindow(w, h);
        try {
            const a = await signInScreen();
            const root = document.querySelector('.pc-monitor');
            assert.equal(root.dataset.uiScale, String(pcMonitorMetrics(w, h).uiScale), `${w}x${h}`);
            assert.equal(root.style.getPropertyValue('--pc-ui-scale'), root.dataset.uiScale);
            a.cleanup?.();
        } finally {
            restore();
        }
    }
    const frame = css('pc-monitor.css');
    assert.match(frame, /\.pc-monitor-screen > \.minigame-game-container \{[^}]*zoom: var\(--pc-ui-scale, 1\);/);
});

test('R1 m4: the resize listeners go with the scene\'s cleanup, even when complete() never runs', async () => {
    const restore = sizeWindow(800, 600);
    const added = [], removed = [];
    const add = window.addEventListener, remove = window.removeEventListener;
    window.addEventListener = function (type, fn, o) { if (type === 'resize') added.push(fn); return add.call(this, type, fn, o); };
    window.removeEventListener = function (type, fn, o) { if (type === 'resize') removed.push(fn); return remove.call(this, type, fn, o); };
    try {
        const mg = await signInScreen();
        const update = mg.pcMonitor.update;
        assert.ok(added.includes(update), 'listening');
        mg.cleanup();
        assert.ok(removed.includes(update), 'removed by cleanup alone');
    } finally {
        window.addEventListener = add;
        window.removeEventListener = remove;
        restore();
    }
});

test('R1 m6: a tap on the note does not mark it dragged; a move does', async () => {
    const restore = sizeWindow(800, 600);
    try {
        await signInScreen();
        const note = document.querySelector('.pc-monitor-postit');
        // makeDraggable (stubbed here) pins the note where it is drawn on the press: the same place
        note.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
        document.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true }));
        assert.equal(note.dataset.dragged, undefined, 'a tap leaves it following the frame');
        note.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
        note.style.left = `${parseInt(note.style.left, 10) + 30}px`;
        document.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true }));
        assert.equal(note.dataset.dragged, 'true', 'a move pins it');
    } finally {
        restore();
    }
});

test('R1 M3: a long description is all in the taskbar, wrapped and scrolled, never cut with an ellipsis', async () => {
    const restore = sizeWindow(390, 844);
    const long = 'A shared hot desk PC. Anyone with an account can sign in here, and the last user left a sticky note about the payroll share on the second floor.';
    try {
        await desktop({ observations: long });
        const note = document.querySelector('.desktop-taskbar-note');
        assert.equal(note.textContent, long, 'every word is in the DOM');
        assert.ok(note.classList.contains('pixel-scroll'), 'the pixel scrollbar when it scrolls');
    } finally {
        restore();
    }
    const box = css('container-minigame.css');
    for (const sel of ['.desktop-taskbar-note {', '.share-folder-status {']) {
        const rule = box.slice(box.indexOf(sel), box.indexOf('}', box.indexOf(sel)));
        assert.match(rule, /white-space: normal/, sel);
        assert.doesNotMatch(rule, /text-overflow: ellipsis|nowrap/, sel);
        assert.match(rule, /max-height: \d+px/, sel);
        assert.match(rule, /overflow-y: auto/, sel);
    }
});

test('R2 m1: one kept note height per PC, replaced on a resize; a smaller measurement lowers the chin', async () => {
    resetPostitHeights();
    keepPostitHeight('pc', '800x600', 60);
    keepPostitHeight('pc', '1400x1000', 40);
    keepPostitHeight('pc', '800x600', 52);
    assert.equal(keptPostitCount(), 1, 'one entry for the PC');
    assert.equal(keptPostitHeight('pc', '800x600'), 52, 'the last measurement, not the larger');
    assert.equal(keptPostitHeight('pc', '1400x1000'), 0, 'the other size is gone');
    resetPostitHeights();
    // Mounted: a height kept before the font arrived (72) is lowered by the note's own 52
    const restore = sizeWindow(800, 600);
    const unstub = stubNoteHeight(52);
    try {
        keepPostitHeight('hot_desk', '800x600', 72);
        const a = await signInScreen();
        assert.equal(keptPostitHeight('hot_desk', '800x600'), 52, 'lowered to the measured height');
        const want = pcMonitorMetrics(800, 600, { postitHeight: 52 });
        assert.equal(document.querySelector('.pc-monitor').style.height, `${want.height}px`, 'the chin follows it down');
        a.cleanup?.();
    } finally {
        unstub();
        restore();
        resetPostitHeights();
    }
});

const manyIcons = (n) => Array.from({ length: n }, (_, i) => ({ id: `f${i}`, type: 'text_file', name: `File ${i + 1}.txt`, takeable: true }));

function stubScroll(sel, { scrollHeight, clientHeight }) {
    const el = document.querySelector(sel);
    Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => scrollHeight });
    Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => clientHeight });
    return el;
}

test('R2 M2: the desktop\'s icon area has the pixel scrollbar and "More below" while icons run past it', async () => {
    const restore = sizeWindow(1400, 1000);
    try {
        const mg = await desktop({ contents: manyIcons(8) });
        const area = document.querySelector('.pc-desktop > .desktop-background');
        assert.ok(area.classList.contains('pixel-scroll'), 'the scroller has pixel-scroll');
        assert.equal(document.querySelectorAll('#desktop-icons .desktop-icon').length, 8);
        const more = document.querySelector('.pc-desktop > .desktop-more');
        assert.ok(more, 'the cue is there');
        assert.equal(more.textContent.trim(), 'More below');
        stubScroll('.pc-desktop > .desktop-background', { scrollHeight: 400, clientHeight: 250 });
        area.scrollTop = 0;
        area.dispatchEvent(new window.Event('scroll'));
        assert.equal(more.hidden, false, 'shown while there is more below');
        area.scrollTop = 150;
        area.dispatchEvent(new window.Event('scroll'));
        assert.equal(more.hidden, true, 'hidden at the end');
        mg.cleanup?.();
    } finally {
        restore();
    }
    const box = css('container-minigame.css');
    const cue = box.slice(box.indexOf('.pc-monitor .pc-desktop > .desktop-more {'));
    assert.match(cue, /border-top: 2px solid/);
});

test('R2 m4: no taskbar strip under a desktop with no description and nothing to take', async () => {
    const restore = sizeWindow(390, 844);
    try {
        const a = await desktop({ observations: '' });
        assert.equal(document.querySelector('.desktop-taskbar'), null, 'no empty strip');
        a.cleanup?.();
        const b = await desktop({ observations: 'A hot desk.' });
        assert.ok(document.querySelector('.desktop-taskbar .desktop-taskbar-note'), 'a description keeps it');
        b.cleanup?.();
    } finally {
        restore();
    }
});

test('R2 m3 and m5: icon labels on the monitor have the dark backing, not the outline; the bezel name is 16px at x2', () => {
    const box = css('container-minigame.css');
    const start = box.indexOf('.pc-monitor .pc-desktop .desktop-icon-label {');
    const label = box.slice(start, box.indexOf('}', start));
    assert.match(label, /text-shadow: none;/);
    assert.match(label, /border: 2px solid/);
    assert.match(label, /background: #101820;/);
    const frame = css('pc-monitor.css');
    const s = frame.indexOf('.pc-monitor[data-ui-scale="2"] .pc-monitor-name {');
    assert.ok(s > 0, 'an x2 rule for the name');
    assert.match(frame.slice(s, frame.indexOf('}', s)), /font-size: 16px;\s*line-height: 16px;/);
});

// ── The one rule in CSS ──────────────────────────────────────────────────────

test('the bezel look is held in css/pc-monitor.css only, pixel art (2px edges, stepped corners, no radius)', () => {
    const frame = css('pc-monitor.css');
    const bezelRule = frame.slice(frame.indexOf('.pc-monitor-bezel {'), frame.indexOf('}', frame.indexOf('.pc-monitor-bezel {')));
    assert.match(bezelRule, /border: 2px solid/);
    assert.match(bezelRule, /clip-path: polygon\(/);
    assert.doesNotMatch(frame, /border-radius:\s*[1-9]/);
    assert.match(frame, /\.pc-monitor > \.postit-note\.pc-monitor-postit \{[^}]*position: absolute/);
    assert.doesNotMatch(css('password-minigame.css'), /\.pc-monitor-bezel\s*\{/, 'not copied into the password screen');
    assert.doesNotMatch(css('container-minigame.css'), /\.pc-monitor-bezel\s*\{/, 'not copied into the container');
    const show = readFileSync(join(here, '../../app/views/break_escape/games/show.html.erb'), 'utf8');
    assert.ok(show.indexOf('css/pc-monitor.css') > show.indexOf('css/password-minigame.css'), 'linked after the password screen css');
});

// ── Review round 3 ───────────────────────────────────────────────────────────

/** The real stylesheets in the page, so jsdom's computed style follows their rules. */
function withSheets(...names) {
    const style = document.createElement('style');
    style.textContent = names.map(css).join('\n');
    document.head.appendChild(style);
    return () => style.remove();
}

test('R3 m5: at x2 the tiles fold once an account is chosen, Change shows, and no on-screen title in the monitor', async () => {
    const restore = sizeWindow(1400, 1000);
    try {
        const mg = await signInScreen();
        const unsheet = withSheets('password-minigame.css', 'pc-monitor.css');
        try {
            assert.equal(document.querySelector('.pc-monitor').dataset.uiScale, '2');
            const tiles = document.querySelector('.signin-tiles');
            const title = document.querySelector('.signin-title');
            const change = document.querySelector('#signin-change');
            assert.equal(window.getComputedStyle(title).display, 'none', 'the bezel names the PC');
            assert.notEqual(window.getComputedStyle(tiles).display, 'none', 'tiles before a choice');
            mg.selectSignInTile(0);
            assert.equal(window.getComputedStyle(tiles).display, 'none', 'folded at x2 once chosen');
            assert.notEqual(window.getComputedStyle(change).display, 'none', 'Change brings them back');
            mg.clearSignInChoice();
            assert.notEqual(window.getComputedStyle(tiles).display, 'none', 'back after Change');
        } finally {
            unsheet();
            mg.cleanup?.();
        }
    } finally {
        restore();
    }
    // At x1 in a tall window the tiles stay
    const back = sizeWindow(800, 600);
    try {
        const mg = await signInScreen();
        const unsheet = withSheets('password-minigame.css', 'pc-monitor.css');
        try {
            mg.selectSignInTile(0);
            assert.notEqual(window.getComputedStyle(document.querySelector('.signin-tiles')).display, 'none', 'x1, not short: tiles stay');
        } finally {
            unsheet();
            mg.cleanup?.();
        }
    } finally {
        back();
    }
});

test('R3 m1: the chosen account line carries that NPC\'s headshot in the monitor', async () => {
    const restore = sizeWindow(1400, 1000);
    const HadImage = window.Image, hadGlobal = globalThis.Image;
    const Fake = fakeImage({ '/break_escape/assets/characters/male_office_worker_v2_headshot.png': [32, 32] });
    window.Image = Fake; globalThis.Image = Fake;
    window.npcManager = { npcs: new Map([['sam', { id: 'sam', username: 'sokafor', spriteSheet: 'male_office_worker_v2' }]]), getNPC(id) { return this.npcs.get(id); } };
    try {
        const mg = await signInScreen();
        const box = document.querySelector('.signin-selected-row > .signin-selected-headshot');
        assert.ok(box, 'a headshot box before the name');
        assert.equal(box.hidden, true, 'hidden before a choice');
        mg.selectSignInTile(0);
        await settle(5); await settle(5);
        assert.equal(box.hidden, false);
        assert.equal(box.dataset.headshot, 'male_office_worker_v2');
        assert.equal(box.dataset.headshotFor, 'sokafor');
        mg.selectSignInTile('other');
        assert.equal(box.hidden, true, 'Other user has no face');
        mg.cleanup?.();
    } finally {
        window.Image = HadImage; globalThis.Image = hadGlobal;
        delete window.npcManager;
        restore();
    }
});

test('R3 M1: a remote sign-in\'s Captured sign-ins is a solid note with the PC\'s buttons', async () => {
    const restore = sizeWindow(800, 600);
    try {
        document.body.innerHTML = '<div id="mg"></div>';
        window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
        const mg = new PasswordMinigame(document.getElementById('mg'), {
            title: 'Sign in',
            signIn: { pcId: 'hb_fin_02', pcName: 'HB-FIN-02', picker: 'accounts', remote: { footholdId: 'jack', linkName: 'Comms port' },
                      tiles: [{ username: 'lfox', displayName: 'Lena Fox' }],
                      captured: [{ label: 'Lena Fox', username: 'lfox', targetId: 'hb_fin_02' }] }
        });
        window.MinigameFramework.currentMinigame = mg;
        mg.init();
        assert.ok(document.querySelector('.pc-monitor .signin-captured'), 'in the monitor');
        const item = document.querySelector('.signin-captured-item');
        assert.ok(item.classList.contains('pc-os-btn'), 'the PC\'s button look');
        mg.setCapturedSignIns([{ label: 'Lena Fox', username: 'lfox', targetId: 'hb_fin_02' }]);
        assert.ok(document.querySelector('.signin-captured-item').classList.contains('pc-os-btn'), 'and after the list arrives');
        const unsheet = withSheets('network-view-minigame.css', 'password-minigame.css', 'pc-monitor.css');
        try {
            const cs = window.getComputedStyle(document.querySelector('.signin-captured'));
            assert.doesNotMatch(cs.backgroundColor, /rgba\(/, 'no see-through fill');
            assert.equal(cs.borderTopWidth, '2px');
            const label = window.getComputedStyle(document.querySelector('.signin-field-row label'));
            assert.equal(label.borderTopWidth, '2px', 'the labels are bordered as the other slabs');
        } finally {
            unsheet();
        }
        mg.cleanup?.();
    } finally {
        restore();
    }
});

test('R3 m2, m3, m4: field colours in the monitor, bordered Wi-Fi buttons, no plate behind desktop icons', () => {
    const pw = css('password-minigame.css');
    const rule = (text, sel) => { const i = text.indexOf(`${sel} {`); assert.ok(i >= 0, sel); return text.slice(i, text.indexOf('}', i)); };
    assert.match(rule(pw, '.pc-screen-area .password-field'), /border-color: #5a6a78;/);
    assert.match(rule(pw, '.pc-screen-area .password-field:focus'), /border-color: #9ee6ff;/);
    for (const sel of ['.submit-btn', '.hint-btn']) {
        const r = rule(pw, sel);
        assert.doesNotMatch(r, /border: none/, sel);
        assert.match(r, /border: 2px solid/, sel);
    }
    const box = css('container-minigame.css');
    assert.match(rule(box, '.pc-monitor .pc-desktop .desktop-icon-image'), /background: transparent;/);
    assert.doesNotMatch(box.slice(box.indexOf('/* On the monitor the icon has no see-through plate')), /rgba\(0, 255, 0/);
});

test('R3 M2: a file opened from a PC desktop opens in that PC\'s monitor frame; one from the world does not', async () => {
    assert.deepEqual(pcScreenOf({ lockable: { pcScreen: { name: 'Hot desk PC', pcId: 'hot_desk' } } }), { name: 'Hot desk PC', pcId: 'hot_desk' });
    assert.equal(pcScreenOf({}), null);
    for (const [w, h] of SIZES) {
        const restore = sizeWindow(w, h);
        try {
            const a = await desktop();
            const desk = frameBox().replace(/"note":\[[^\]]*\]/, '"note":null');
            assert.deepEqual(a.pcScreenExtras(), { pcScreen: { name: 'Hot desk PC', pcId: 'hot_desk' } }, 'the desktop hands its frame on');
            a.cleanup?.();
            document.body.innerHTML = '<div id="mg"></div>';
            const mg = new TextFileMinigame(document.getElementById('mg'), {
                title: 'Text File - Mail', fileName: 'Mail', fileContent: 'Line one\nLine two', observations: 'An inbox.',
                lockable: { scenarioData: { type: 'text_file' }, pcScreen: { name: 'Hot desk PC', pcId: 'hot_desk' } }
            });
            window.MinigameFramework.currentMinigame = mg;
            mg.init();
            assert.equal(frameBox(), desk, `${w}x${h}: the same frame as the desktop`);
            assert.equal(document.querySelector('.pc-monitor-name').textContent, 'Hot desk PC');
            assert.ok(document.querySelector('.pc-monitor-bezel > #minigame-close'), 'the X in the bezel');
            assert.equal(document.querySelector('.window-controls'), null, 'no window buttons');
            assert.equal(document.querySelector('.share-folder-path').textContent, 'Mail');
            for (const id of ['copy-btn', 'select-all-btn', 'minigame-notebook']) {
                assert.ok(document.getElementById(id).classList.contains('pc-os-btn'), id);
            }
            assert.equal(document.querySelector('.pc-file-status').textContent, 'An inbox.');
            assert.match(document.querySelector('.pc-file-body').textContent, /Line one/);
            mg.notify('Copied.');
            assert.equal(document.querySelector('.pc-file-message').textContent, 'Copied.', 'results on the toolbar, not a toast');
            assert.equal(document.querySelector('.minigame-success-message'), null);
            mg.cleanup();
            assert.equal(document.getElementById('mg').classList.contains('pc-view'), false, 'the frame goes with cleanup');
        } finally {
            restore();
        }
    }
    // From the world: the old viewer
    document.body.innerHTML = '<div id="mg"></div>';
    const world = new TextFileMinigame(document.getElementById('mg'), { title: 'x', fileName: 'Memo', fileContent: 'x', lockable: { scenarioData: {} } });
    world.init();
    assert.equal(document.querySelector('.pc-monitor'), null);
    assert.ok(document.querySelector('.text-file-container'));
    world.cleanup();
    const t = css('text-file-minigame.css');
    const mon = t.slice(t.indexOf('/* ── In the PC monitor'));
    assert.doesNotMatch(mon, /font-weight: (bold|[5-9]00)|translateY|rgba\(|border-radius/, 'pixel rules in the monitor look');
    assert.match(mon, /font-size: 16px;/);
});
