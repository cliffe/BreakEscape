// A scenario's own PC wallpaper (top-level `pcWallpaper`, utils/pc-monitor.js pcWallpaperUrl):
// the path rules, the monitor screen showing it, the shared wallpaper when it is absent, and
// m02's wallpaper file being where its scenario says.
// Run with: node test/js/pc-wallpaper.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const dir = mkdtempSync(join(tmpdir(), 'pc-wallpaper-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(dir, 'pc-monitor.js'), readFileSync(join(root, 'public/break_escape/js/utils/pc-monitor.js'), 'utf8'));

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { pcWallpaperUrl, mountPcMonitor, wallpaperScale, wallpaperLayout, pcWallpaperFocus, applyPcMonitorMetrics, pcMonitorMetrics } = await import(pathToFileURL(join(dir, 'pc-monitor.js')));

test('pcWallpaperUrl: a PNG under assets/ resolves; anything else falls back to the shared wallpaper', () => {
    assert.equal(pcWallpaperUrl({ pcWallpaper: 'assets/mini-games/desktop-wallpaper-m02.png' }),
        '/break_escape/assets/mini-games/desktop-wallpaper-m02.png');
    for (const bad of [undefined, null, 7, '', 'mini-games/x.png', 'assets/../secret.png', 'assets/x.jpg',
        'https://example.com/x.png', 'assets//x.png', 'assets/x.png") ; background:red', 'assets/a b.png']) {
        assert.equal(pcWallpaperUrl({ pcWallpaper: bad }), null, `rejects ${JSON.stringify(bad)}`);
    }
    assert.equal(pcWallpaperUrl(null), null);
    assert.equal(pcWallpaperUrl(undefined), null);
});

function mount(gameScenario) {
    document.body.innerHTML = '<div id="c"><div class="minigame-game-container"></div></div>';
    const container = document.getElementById('c');
    const scene = { container, gameContainer: container.querySelector('.minigame-game-container') };
    const view = new window.EventTarget();
    Object.assign(view, { innerWidth: 1400, innerHeight: 1000, gameScenario });
    return mountPcMonitor(scene, { name: 'PC', view });
}

test('the monitor screen shows the scenario wallpaper, and no inline image without one', () => {
    const own = mount({ pcWallpaper: 'assets/mini-games/desktop-wallpaper-m02.png' });
    assert.equal(own.screen.style.backgroundImage, 'url("/break_escape/assets/mini-games/desktop-wallpaper-m02.png")');
    own.destroy();
    const shared = mount({});
    assert.equal(shared.screen.style.backgroundImage, '', 'css/pc-monitor.css shared wallpaper stays');
    shared.destroy();
    const bad = mount({ pcWallpaper: 'assets/../x.png' });
    assert.equal(bad.screen.style.backgroundImage, '');
    bad.destroy();
});

test('m02 names its wallpaper, the file exists, and the schema pattern accepts it', () => {
    const erb = readFileSync(join(root, 'scenarios/m02_ransomed_trust/scenario.json.erb'), 'utf8');
    const m = erb.match(/^\s*"pcWallpaper":\s*"([^"]+)"/m);
    assert.ok(m, 'm02 sets pcWallpaper');
    assert.ok(pcWallpaperUrl({ pcWallpaper: m[1] }), 'the engine accepts the path');
    assert.ok(existsSync(join(root, 'public/break_escape', m[1])), `${m[1]} exists`);
    const schema = JSON.parse(readFileSync(join(root, 'scripts/scenario-schema.json'), 'utf8'));
    assert.match(m[1], new RegExp(schema.properties.pcWallpaper.pattern));
});

test('wallpaperScale: the smallest whole number that covers the screen box (R2 M2)', () => {
    assert.equal(wallpaperScale(1120, 700, 280, 176), 4, 'the largest screen is x4');
    assert.equal(wallpaperScale(342, 546, 280, 176), 4, 'the 390x844 screen was x3.10 under cover (868 wide)');
    assert.equal(wallpaperScale(952, 594, 280, 176), 4, '1024x768 was x3.40');
    assert.equal(wallpaperScale(280, 176, 280, 176), 1);
    assert.equal(wallpaperScale(281, 176, 280, 176), 2);
    assert.equal(wallpaperScale(100, 100, 280, 176), 1, 'never below 1');
    assert.equal(wallpaperScale(900, 560, 320, 320), 3, 'the shared 320x320 picture too');
    assert.equal(wallpaperScale(10, 10, 0, 0), 1, 'unknown size');
    // whole for every screen size the monitor can have
    for (const [w, h] of [[1400, 1000], [1024, 768], [390, 844], [360, 640], [820, 1180], [1920, 1080]]) {
        const m = pcMonitorMetrics(w, h);
        const k = wallpaperScale(m.screen.width, m.screen.height, 280, 176);
        assert.ok(Number.isInteger(k) && k >= 1);
        assert.ok(280 * k >= m.screen.width && 176 * k >= m.screen.height, `covers at ${w}x${h}`);
        assert.ok(k === 1 || 280 * (k - 1) < m.screen.width || 176 * (k - 1) < m.screen.height, `smallest at ${w}x${h}`);
    }
});

test('wallpaperLayout: whole-pixel size and offset, focus point kept in view, never a gap (R2 m1)', () => {
    // a phone-sized portrait screen on m02's picture, focus on the hospital (x 0.28)
    const l = wallpaperLayout(342, 546, 280, 176, [0.28, 0.5]);
    assert.deepEqual([l.scale, l.width, l.height], [4, 1120, 704]);
    assert.ok(Number.isInteger(l.x) && Number.isInteger(l.y));
    const hospital = 0.28 * l.width + l.x; // where the focus lands on the screen
    assert.ok(hospital > 342 * 0.4 && hospital < 342 * 0.6, `hospital near the middle (${hospital})`);
    assert.ok(l.x <= 0 && l.x >= 342 - l.width && l.y <= 0 && l.y >= 546 - l.height, 'the picture covers the box');
    // centred by default
    const c = wallpaperLayout(342, 546, 280, 176);
    assert.equal(c.x, Math.round(342 / 2 - 0.5 * 1120));
    // a focus at the left edge clamps to 0, at the right edge to the far edge
    assert.equal(wallpaperLayout(342, 546, 280, 176, [0, 0.5]).x, 0);
    assert.equal(wallpaperLayout(342, 546, 280, 176, [1, 0.5]).x, 342 - 1120);
});

test('pcWallpaperFocus: two shares in 0..1, else the centre', () => {
    assert.deepEqual(pcWallpaperFocus({ pcWallpaperFocus: [0.28, 0.5] }), [0.28, 0.5]);
    for (const bad of [undefined, 3, [0.2], [0.2, 0.3, 0.4], [-0.1, 0.5], [0.5, 1.1], ['a', 'b']]) {
        assert.deepEqual(pcWallpaperFocus({ pcWallpaperFocus: bad }), [0.5, 0.5], JSON.stringify(bad));
    }
    assert.deepEqual(pcWallpaperFocus(null), [0.5, 0.5]);
});

test('the monitor draws the picture at the integer size, and re-lays it out on resize', () => {
    const mp = mount({ pcWallpaper: 'assets/mini-games/desktop-wallpaper-m02.png' });
    mp.wallpaper = { w: 280, h: 176, focus: [0.28, 0.5] };
    applyPcMonitorMetrics(mp, pcMonitorMetrics(1400, 1000));
    assert.equal(mp.screen.style.backgroundSize, '1120px 704px');
    applyPcMonitorMetrics(mp, pcMonitorMetrics(390, 844));
    assert.match(mp.screen.style.backgroundSize, /^\d+px \d+px$/);
    const [bw] = mp.screen.style.backgroundSize.split('px');
    assert.equal(Number(bw) % 280, 0, 'a whole multiple of the picture width');
    mp.destroy();
});

test('css: no cover scaling on the screen, pixelated', () => {
    const css = readFileSync(join(root, 'public/break_escape/css/pc-monitor.css'), 'utf8');
    const rule = css.match(/\.pc-monitor-screen \{[^}]*\}/)[0];
    assert.doesNotMatch(rule, /background-size:\s*cover/);
    assert.match(rule, /image-rendering:\s*pixelated/);
});

test('a missing scenario wallpaper file falls back to the shared one', () => {
    const saved = globalThis.Image;
    const made = [];
    globalThis.Image = class { constructor() { made.push(this); } set src(v) { this._src = v; } get src() { return this._src; } };
    try {
        const mp = mount({ pcWallpaper: 'assets/mini-games/no-such-file.png' });
        assert.equal(mp.screen.style.backgroundImage, 'url("/break_escape/assets/mini-games/no-such-file.png")');
        made[0].onerror();
        assert.equal(mp.screen.style.backgroundImage, '', 'the inline image is dropped, so the shared css wallpaper shows');
        assert.equal(made[1].src, '/break_escape/assets/mini-games/desktop-wallpaper.png', 'size read from the shared one');
        made[1].naturalWidth = 320; made[1].naturalHeight = 320; made[1].onload();
        assert.match(mp.screen.style.backgroundSize, /^\d+px \d+px$/);
        mp.destroy();
    } finally { globalThis.Image = saved; }
});
