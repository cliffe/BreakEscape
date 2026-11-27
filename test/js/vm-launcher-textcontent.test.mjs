// vm-launcher text rule: game and scenario text (VM title, IP, flag note) is set with
// textContent, never innerHTML. Run with: node test/js/vm-launcher-textcontent.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const srcPath = join(js, 'minigames/vm-launcher/vm-launcher-minigame.js');

const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://game.example/break_escape/games/7' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const root = mkdtempSync(join(tmpdir(), 'vm-launcher-text-'));
const mg = join(root, 'minigames');
mkdirSync(join(mg, 'vm-launcher'), { recursive: true });
mkdirSync(join(mg, 'framework'));
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(mg, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor() {} }\n');
writeFileSync(join(root, 'utils', 'helpers.js'), 'export function makeDraggable() {}\n');
writeFileSync(join(root, 'utils', 'escape-html.js'), readFileSync(join(js, 'utils/escape-html.js'), 'utf8'));
writeFileSync(join(mg, 'vm-launcher', 'vm-launcher-minigame.js'), readFileSync(srcPath, 'utf8'));
const { VmLauncherMinigame } = await import(pathToFileURL(join(mg, 'vm-launcher', 'vm-launcher-minigame.js')).href);

const HOSTILE = '<img src=x onerror=alert(1)> & < > " \'';

function launcher(extra = {}) {
    const s = Object.create(VmLauncherMinigame.prototype);
    Object.assign(s, { hacktivityMode: true, vmPanelRefused: false, flagNote: '', ...extra });
    return s;
}

test('no innerHTML assignment in the module interpolates a variable or concatenates', () => {
    const code = readFileSync(srcPath, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
    const assigns = [...code.matchAll(/\.innerHTML\s*\+?=\s*([^;]*);/g)].map(m => m[1]);
    for (const rhs of assigns) {
        assert.doesNotMatch(rhs, /\$\{/, `innerHTML assignment interpolates: ${rhs}`);
        assert.doesNotMatch(rhs, /\+/, `innerHTML assignment concatenates: ${rhs}`);
        assert.doesNotMatch(rhs, /build\w+\(/, `innerHTML assigned from a builder: ${rhs}`);
    }
    assert.equal(assigns.length, 0, 'the module needs no innerHTML at all');
});

function render(s) {
    const box = document.createElement('div');
    box.className = 'vm-launcher';
    box.appendChild(s.buildVmDisplay());
    return box;
}

test('hostile VM title, IP and flag note render as literal text (Hacktivity link)', () => {
    window.breakEscapeConfig = { vmPanelUrl: '/break_escape/games/7/vm_panel' };
    const s = launcher({ vm: { title: HOSTILE, ip: HOSTILE }, vmPanelUrl: 'https://game.example/break_escape/games/7/vm_panel', flagNote: HOSTILE });
    const box = render(s);
    assert.ok(box.querySelector('img') === null, 'no element created from the text');
    assert.equal(box.querySelector('.vm-title').textContent, HOSTILE);
    assert.equal(box.querySelector('.vm-ip-value').textContent, HOSTILE);
    assert.equal(box.querySelector('.vm-flag-note p').textContent, HOSTILE);
    const a = box.querySelector('a.vm-action-btn');
    assert.equal(a.textContent, 'Open VM Console: ' + HOSTILE);
    assert.equal(a.getAttribute('target'), '_blank');
    assert.equal(a.getAttribute('rel'), 'noopener noreferrer');
    assert.equal(a.hasAttribute('onerror'), false);
    assert.ok(a.getAttribute('href').includes('vm_title='));
    delete window.breakEscapeConfig;
});

test('hostile title and IP are literal text in the standalone instructions', () => {
    const box = render(launcher({ hacktivityMode: false, vm: { title: HOSTILE, ip: HOSTILE } }));
    assert.ok(box.querySelector('img') === null);
    const codes = [...box.querySelectorAll('.standalone-instructions code')].map(c => c.textContent);
    assert.deepEqual(codes, [HOSTILE, HOSTILE]);
    assert.equal(box.querySelector('.vm-status').textContent, 'Console');
});

test('a VM with no title gives a console link with no "undefined" (R1 m1)', () => {
    window.breakEscapeConfig = { vmPanelUrl: '/break_escape/games/7/vm_panel' };
    const s = launcher({ vm: { ip: '10.0.0.5' }, vmPanelUrl: 'https://game.example/break_escape/games/7/vm_panel' });
    const a = render(s).querySelector('a.vm-action-btn');
    assert.equal(a.textContent, 'Open VM Console: ');
    delete window.breakEscapeConfig;
});

test('the no-VM messages keep their classes and text', () => {
    const hack = launcher({ vm: null }).buildNoVmMessage();
    assert.equal(hack.className, 'no-vms-message');
    assert.equal(hack.querySelector('h4').textContent, 'No VM Available');
    const solo = launcher({ hacktivityMode: false, vm: null }).buildNoVmMessage();
    assert.equal(solo.className, 'no-vms-message standalone-mode');
    assert.equal(solo.querySelector('h2').textContent, 'VM Terminal');
});
