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
const { pcWallpaperUrl, mountPcMonitor } = await import(pathToFileURL(join(dir, 'pc-monitor.js')));

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
