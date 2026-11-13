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
    'utils/pc-monitor.js', 'utils/npc-headshot.js', 'minigames/framework/base-minigame.js',
    'minigames/container/container-item-image.js', 'minigames/container/container-minigame.js',
    'minigames/password/password-minigame.js', 'systems/pc-sessions.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { pcMonitorMetrics, PC_BEZEL, PC_SCREEN_ASPECT, PC_SCREEN_MIN, PC_POSTIT_GAP, PC_FRAME_EDGE } = await imp('utils/pc-monitor.js');
const { headshotKeys, headshotCandidates, headshotUrl, characterKey, noteMissingHeadshot, resetMissingHeadshots, npcRecordFor } = await imp('utils/npc-headshot.js');
const { PasswordMinigame, applyTilePortrait } = await imp('minigames/password/password-minigame.js');
const { ContainerMinigame } = await imp('minigames/container/container-minigame.js');
const { PcSessions } = await imp('systems/pc-sessions.js');

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
    assert.ok(phone.screen.width / phone.screen.height >= 0.75 - 0.01, 'no taller than 3:4');
});

test('short and narrow windows use the compact bezel, with sensible minimums', () => {
    assert.equal(pcMonitorMetrics(915, 412).compact, true);
    assert.equal(pcMonitorMetrics(390, 844).compact, true);
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
    assert.deepEqual(missing, ['ms_okafor'], 'logged once, by its key');
    assert.equal(el.dataset.headshotMissing, 'ms_okafor');
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

async function desktop() {
    document.body.innerHTML = '<div id="mg"></div>';
    window.inventory = { items: [] };
    window.breakEscapeConfig = { gameId: 7 };
    window.eventDispatcher = { emit: () => {} };
    window.ApiClient = { login: async () => ({ success: true, npcId: 'sam', username: 'sokafor', displayName: 'Sam Okafor', via: 'password' }) };
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ contents: [] }) });
    window.pcSessions = new PcSessions();
    await window.pcSessions.signIn('hot_desk', 'sokafor', 'x');
    window.npcManager = { npcs: new Map([['sam', { id: 'sam', spriteSheet: 'male_office_worker_v2' }]]), getNPC(id) { return this.npcs.get(id); } };
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    const containerItem = { scenarioData: { id: 'hot_desk', type: 'pc', name: 'Hot desk PC', locked: true, lockType: 'login', observations: 'A hot desk.', postitNote: 'Sam: sokafor / x', showPostit: true } };
    const mg = new ContainerMinigame(document.getElementById('mg'), { title: 'Hot desk PC', containerItem, contents: null, desktopMode: true, showCancel: true, cancelText: 'Close' });
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
    try {
        await desktop();
        const img = document.querySelector('.pc-desktop-topbar .desktop-account-headshot');
        assert.ok(img, 'a headshot in the top bar');
        assert.equal(img.getAttribute('src'), '/break_escape/assets/characters/male_office_worker_v2_headshot.png');
    } finally {
        restore();
    }
});

// ── The one rule in CSS ──────────────────────────────────────────────────────

test('the bezel look is held in css/pc-monitor.css only, pixel art (2px edges, stepped corners, no radius)', () => {
    const frame = css('pc-monitor.css');
    assert.match(frame, /\.pc-monitor-bezel \{[^}]*border: 2px solid[^}]*clip-path: polygon\(/);
    assert.doesNotMatch(frame, /border-radius:\s*[1-9]/);
    assert.match(frame, /\.pc-monitor > \.postit-note\.pc-monitor-postit \{[^}]*position: absolute/);
    assert.doesNotMatch(css('password-minigame.css'), /\.pc-monitor-bezel\s*\{/, 'not copied into the password screen');
    assert.doesNotMatch(css('container-minigame.css'), /\.pc-monitor-bezel\s*\{/, 'not copied into the container');
    const show = readFileSync(join(here, '../../app/views/break_escape/games/show.html.erb'), 'utf8');
    assert.ok(show.indexOf('css/pc-monitor.css') > show.indexOf('css/password-minigame.css'), 'linked after the password screen css');
});
