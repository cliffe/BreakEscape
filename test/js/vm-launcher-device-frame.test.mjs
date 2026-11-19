// The VM launcher (Kali station) is a shared device frame (css/device-frame.css): title row with the
// device name, the X anchored to the frame, the launcher content and the footer row inside it.
// Run with: node --max-old-space-size=2048 test/js/vm-launcher-device-frame.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const js = join(pub, 'js');
const srcPath = join(js, 'minigames/vm-launcher/vm-launcher-minigame.js');
const css = readFileSync(join(pub, 'css/vm-launcher-minigame.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://be.example/break_escape/games/42' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

// Stubbed siblings; the base scene builds the same shell parts the real one does (header, game
// container, close button) and the real ensureControlsRow placement.
const root = mkdtempSync(join(tmpdir(), 'vm-frame-'));
const mg = join(root, 'minigames');
mkdirSync(join(mg, 'vm-launcher'), { recursive: true });
mkdirSync(join(mg, 'framework'));
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(mg, 'framework', 'base-minigame.js'), `
export class MinigameScene {
  constructor(container, params) { this.container = container; this.params = params; this._l = []; }
  init() {
    this.container.innerHTML = '<button id="minigame-close">x</button><div class="minigame-header"><h3></h3></div><div class="minigame-game-container"></div><div class="minigame-message-container"></div>';
    this.headerElement = this.container.querySelector('.minigame-header');
    this.gameContainer = this.container.querySelector('.minigame-game-container');
    this.messageContainer = this.container.querySelector('.minigame-message-container');
    this.controlsElement = null;
  }
  ensureControlsRow() {
    if (this.controlsElement) return this.controlsElement;
    const row = document.createElement('div');
    row.className = 'minigame-controls';
    const host = this.controlsHost();
    if (host) host.appendChild(row); else this.container.appendChild(row);
    this.controlsElement = row;
    return row;
  }
  controlsHost() { return null; }
  closeAnchor() { return this.gameContainer; }
  addEventListener(el, ev, fn) { el.addEventListener(ev, fn); this._l.push([el, ev, fn]); }
}
`);
writeFileSync(join(root, 'utils', 'helpers.js'), 'export function makeDraggable() {}\n');
writeFileSync(join(root, 'utils', 'escape-html.js'), readFileSync(join(js, 'utils/escape-html.js'), 'utf8'));
writeFileSync(join(mg, 'vm-launcher', 'vm-launcher-minigame.js'), readFileSync(srcPath, 'utf8'));
const { VmLauncherMinigame } = await import(pathToFileURL(join(mg, 'vm-launcher', 'vm-launcher-minigame.js')).href);

function open({ hacktivityMode = true, postit = '', params = {} } = {}) {
    dom.window.breakEscapeConfig = { hacktivityMode, vmPanelUrl: '/break_escape/games/42/vm_panel' };
    globalThis.fetch = async () => ({ ok: true });
    document.body.textContent = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const s = new VmLauncherMinigame(container, {
        vm: { title: 'Kali', ip: '10.0.0.5' }, hacktivityMode, gameId: 42,
        showPostit: !!postit, postitNote: postit, title: 'Kali Station', ...params
    });
    s.init();
    return { container, scene: s };
}

test('the content is inside a shared device frame with a title row holding the device name', () => {
    const { container, scene } = open({ hacktivityMode: false });
    const frame = container.querySelector('.minigame-game-container > .device-frame');
    assert.ok(frame, 'a .device-frame directly in the game container');
    assert.ok(frame.classList.contains('vm-launcher-frame'), 'vm-launcher-frame class');
    const row = frame.firstElementChild;
    assert.ok(row.classList.contains('device-frame-title'), 'title row first in the frame');
    assert.ok(row.querySelector('.vm-launcher-title').textContent === 'Kali Station', 'device name in the title row');
    assert.ok(frame.querySelector('.vm-launcher') !== null, 'launcher content inside the frame');
    assert.ok(scene.frame === frame, 'scene keeps the frame');
    assert.ok(container.querySelectorAll('.vm-launcher').length === 1, 'one launcher');
});

test('the title falls back to VM Console Access and is set as text', () => {
    const { container } = open({ params: { title: '<b>x</b>' } });
    const t = container.querySelector('.vm-launcher-title');
    assert.ok(t.textContent === '<b>x</b>', 'literal text');
    assert.ok(t.children.length === 0, 'no markup');
    const d = open({ params: { title: undefined } }).container.querySelector('.vm-launcher-title');
    // the real init defaults the title before drawing
    assert.ok(d.textContent === 'VM Console Access', 'default name');
});

test('the X is anchored to the frame and the built-in header is hidden', () => {
    const { container, scene } = open();
    assert.ok(scene.closeAnchor() === scene.frame, 'closeAnchor is the frame');
    assert.ok(container.querySelector('.minigame-header').style.display === 'none', 'header hidden');
    assert.ok(container.querySelector('#minigame-close') !== null, 'the X exists');
    assert.ok(container.classList.contains('vm-launcher-minigame'), 'scene class');
    assert.ok(/static closeInsideFrame = true;/.test(readFileSync(srcPath, 'utf8')), 'X placed inside the frame');
});

test('Hacktivity console path: the panel iframe sits in the frame and keeps its src', () => {
    const { container } = open({ hacktivityMode: true });
    const frame = container.querySelector('.device-frame');
    assert.ok(frame.classList.contains('vm-launcher-frame-iframe'), 'iframe frame class');
    const iframe = frame.querySelector('.vm-launcher-iframe > iframe');
    assert.ok(iframe !== null, 'iframe inside the frame');
    assert.ok(iframe.getAttribute('src').startsWith('https://be.example/break_escape/games/42/vm_panel'), 'panel url');
    assert.ok(iframe.getAttribute('src').includes('vm_title=Kali'), 'title carried');
});

test('standalone path: instructions inside the frame, no iframe', () => {
    const { container } = open({ hacktivityMode: false });
    const frame = container.querySelector('.device-frame');
    assert.ok(frame.querySelector('iframe') === null, 'no iframe');
    assert.ok(frame.querySelector('.standalone-instructions') !== null, 'connection steps in the frame');
    assert.ok(!frame.classList.contains('vm-launcher-frame-iframe'), 'no iframe class');
});

test('post-it and footer row are inside the frame, the footer row last, and the notepad button is wired', () => {
    for (const hacktivityMode of [false, true]) {
        const { container, scene } = open({ hacktivityMode, postit: 'pw: kali' });
        const frame = container.querySelector('.device-frame');
        const kids = [...frame.children].map((c) => c.className.split(' ')[0]);
        assert.ok(frame.querySelector('.postit-note').textContent === 'pw: kali', `postit in frame (${hacktivityMode})`);
        assert.ok(kids[kids.length - 1] === 'minigame-controls', `footer row last: ${kids.join(',')}`);
        assert.ok(frame.querySelector('#minigame-notebook-postit') !== null, 'Add to Notepad in the frame');
        assert.ok(scene._l.some(([el]) => el.id === 'minigame-notebook-postit'), `notebook button wired (${hacktivityMode})`);
        assert.ok(container.querySelector('.minigame-game-container > .postit-note') === null, 'none left outside the frame');
    }
});

test('the console iframe post-it has no inline style (square, hard shadow come from the stylesheet)', () => {
    const { container } = open({ hacktivityMode: true, postit: 'note' });
    const p = container.querySelector('.postit-note');
    assert.ok(p.classList.contains('vm-postit-overlay'), 'overlay class');
    assert.ok(!p.getAttribute('style'), 'no inline style');
    assert.ok(!/rotate\(|Pixelify|blur|8px rgba/.test(readFileSync(srcPath, 'utf8')), 'no tilt, soft font or blur left in the module');
});

test('stylesheet: clear window, frame width at 390 and 1280, pixel rules', () => {
    assert.ok(/data-minigame="vm-launcher"\] > \.minigame-header \{\s*display:\s*none/.test(css), 'built-in header hidden');
    const win = /data-minigame="vm-launcher"\] > \.minigame-game-container \{([^}]*)\}/.exec(css)[1];
    assert.ok(/background:\s*none/.test(win) && /overflow:\s*visible/.test(win), 'clear window, no themed band');
    assert.ok(/\.vm-launcher-frame \{[^}]*width:\s*min\(calc\(100vw - 32px\), 640px\)/.test(css), '358 wide at 390, 640 at 1280');
    assert.ok(/\.vm-launcher-title-row \{\s*padding-right:\s*40px/.test(css), 'name clear of the X');
    assert.ok(!/border-radius:\s*[1-9]|blur|gradient|Pixelify|Courier/.test(css), 'pixel rules');
    const themes = readFileSync(join(pub, 'css/ui-themes.css'), 'utf8');
    const fw = readFileSync(join(pub, 'css/minigames-framework.css'), 'utf8');
    assert.ok(!/data-minigame="vm-launcher"\] > \.minigame-game-container/.test(themes + fw), 'no themed frame or tool-window cap on the launcher window');
});
