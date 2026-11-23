// Cyber Aware loading screen (D350, mission.json "title_style": "ca"): branch selection, the DOM it
// builds, hostile company text, the stepped bar, and the pixel-art rules for its stylesheet.
// Run with: bin/test-js test/js/title-screen-ca.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const dir = mkdtempSync(join(tmpdir(), 'title-screen-ca-'));
writeFileSync(join(dir, 'input.mjs'), readFileSync(join(root, 'public/break_escape/js/minigames/title-screen/title-screen-input.js'), 'utf8'));
const m = await import(pathToFileURL(join(dir, 'input.mjs')).href);

const cfg = { missionTitleStyle: 'ca', missionDisplayName: 'Invoice fraud: a long name', missionTitleName: 'Invoice fraud',
    missionCompany: 'Merrin & Sallow Architects', missionAccent: '#2f6f5e', missionTitleArt: '/break_escape/assets/title_art/ca01_invoice_fraud.jpg' };

test('only the exact style "ca" selects the CA screen', () => {
    assert.equal(m.titleScreenStyle(cfg), 'ca');
    for (const c of [undefined, null, {}, { missionTitleStyle: '' }, { missionTitleStyle: 'CA' }, { missionTitleStyle: 'safetynet' },
        { missionTitleStyle: ['ca'] }, { missionDisplayName: 'm01' }]) {
        assert.equal(m.titleScreenStyle(c), 'default', JSON.stringify(c));
    }
});

test('company and accent are cleaned; a bad accent is dropped', () => {
    assert.equal(m.titleScreenCompany({ missionCompany: '  A\u0000B\nC  ' }), 'A B C');
    assert.equal(m.titleScreenCompany({ missionCompany: 'x'.repeat(200) }).length, 80);
    assert.equal(m.titleScreenCompany({}), '');
    assert.equal(m.titleScreenCompany({ missionCompany: 5 }), '');
    assert.equal(m.titleScreenAccent({ missionAccent: '#2f6f5e' }), '#2f6f5e');
    for (const bad of ['red', '#fff', 'url(x)', '#2f6f5e;background:url(//x)', 5, undefined]) {
        assert.equal(m.titleScreenAccent({ missionAccent: bad }), '', String(bad));
    }
});

function build(config, art) {
    const dom = new JSDOM('<!doctype html><body><div class="title-screen-container"></div></body>');
    const d = dom.window.document;
    const container = d.querySelector('.title-screen-container');
    const parts = m.buildCaTitleDom(d, container, config, art);
    return { d, container, parts };
}

test('the CA DOM has bands, seam, tabs, mark, title, company, tagline, bar and status', () => {
    const { container, parts } = build(cfg, m.titleScreenArt(cfg));
    const q = (s) => container.querySelectorAll(s);
    assert.equal(q('.ca-ts').length, 1);
    assert.equal(q('.ca-ts-band-a').length, 3);
    assert.equal(q('.ca-ts-band-d').length, 3);
    assert.equal(q('.ca-ts-seam').length, 3);
    assert.equal(q('.ca-ts-tab-a')[0].textContent, 'ATTACKER');
    assert.equal(q('.ca-ts-tab-d')[0].textContent, 'DEFENDER');
    assert.equal(q('.ca-ts-mark-text')[0].textContent, 'CYBER AWARE');
    assert.equal(q('.ca-ts-title')[0].textContent, 'Invoice fraud'); // titleScreenName: own name wins
    assert.equal(q('.ca-ts-company')[0].textContent, 'Merrin & Sallow Architects');
    assert.equal(q('.ca-ts-company')[0].style.getPropertyValue('--ca-accent'), '#2f6f5e');
    assert.equal(q('.ca-ts-tag')[0].textContent, 'Play the attack · Learn to stop it');
    assert.equal(q('.ca-ts-sbar-l s').length, m.CA_BAR_SEGMENTS);
    assert.equal(q('.ca-ts-sbar-r s').length, m.CA_BAR_SEGMENTS);
    assert.equal(parts.status.textContent, 'LOADING');
    assert.match(q('.ca-ts-art')[0].style.backgroundImage, /ca01_invoice_fraud\.jpg/);
    // none of the SAFETYNET screen's parts
    assert.equal(q('.title-screen-logo, .title-screen-typed-text, .title-screen-cursor, .title-screen-prompt').length, 0);
});

test('no art url, no art layer; no company, no company line', () => {
    const { container } = build({ missionDisplayName: 'Starting check', missionTitleStyle: 'ca' }, '');
    assert.equal(container.querySelectorAll('.ca-ts-art').length, 0);
    assert.equal(container.querySelectorAll('.ca-ts-company').length, 0);
    assert.equal(container.querySelector('.ca-ts-title').textContent, 'Starting check');
});

test('hostile company and title text stay text', () => {
    const evil = '<img src=x onerror=alert(1)><script>boom()</script>';
    const { container } = build({ missionTitleStyle: 'ca', missionDisplayName: evil, missionCompany: evil, missionAccent: '#000000;x' }, '');
    assert.equal(container.querySelectorAll('img, script').length, 0);
    assert.equal(container.querySelector('.ca-ts-company').textContent, evil);
    assert.equal(container.querySelector('.ca-ts-title').textContent, evil);
    assert.equal(container.querySelector('.ca-ts-company').style.getPropertyValue('--ca-accent'), '');
});

test('the stepped bar creeps to a cap while waiting and fills on load', () => {
    assert.equal(m.caBarSegments(0, false), 0);
    assert.equal(m.caBarSegments(m.CA_BAR_STEP_MS * 3, false), 3);
    assert.equal(m.caBarSegments(1e9, false), m.CA_BAR_WAIT_MAX);
    assert.ok(m.CA_BAR_WAIT_MAX < m.CA_BAR_SEGMENTS);
    assert.equal(m.caBarSegments(0, true), m.CA_BAR_SEGMENTS);
    assert.equal(m.caBarSegments(-5, false), 0);
    const { container, parts } = build(cfg, '');
    m.setCaBar(parts.bar, 5);
    assert.equal(container.querySelectorAll('.ca-ts-sbar-l s.on').length, 5);
    assert.equal(container.querySelectorAll('.ca-ts-sbar-r s.on').length, 5);
    m.setCaBar(parts.bar, 2);
    assert.equal(container.querySelectorAll('.ca-ts-sbar-r s.on').length, 2);
});

test('the builder never uses innerHTML, and the minigame links the CA sheet only on the CA branch', () => {
    const input = readFileSync(join(root, 'public/break_escape/js/minigames/title-screen/title-screen-input.js'), 'utf8');
    const ca = input.slice(input.indexOf('export function buildCaTitleDom'));
    assert.ok(!/innerHTML|insertAdjacentHTML/.test(ca));
    const mg = readFileSync(join(root, 'public/break_escape/js/minigames/title-screen/title-screen-minigame.js'), 'utf8');
    assert.match(mg, /if \(this\._caStyle\) \{\s*this\._initCa\(\);\s*return;/);
    const initCa = mg.slice(mg.indexOf('_initCa() {'), mg.indexOf('_caTick()'));
    assert.match(initCa, /ensureCaCss\(\)/);
    // the CA stylesheet is not linked at module load (SAFETYNET missions never fetch it)
    assert.ok(!/^document\.head\.appendChild\(link\)/m.test(mg));
    assert.equal((mg.match(/title-screen-ca\.css/g) || []).length, 1);
});

test('title-screen-ca.css follows the pixel-art UI rules', () => {
    const css = readFileSync(join(root, 'public/break_escape/css/title-screen-ca.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/border-radius/.test(css), 'no radius');
    assert.ok(!/(linear|radial|conic)-gradient/.test(css), 'no gradients');
    assert.ok(!/blur\(|box-shadow|drop-shadow/.test(css), 'no blur or glow');
    assert.ok(!/(?<![\w-])1px solid/.test(css), 'no hairlines');
    for (const [, fam] of css.matchAll(/font-family:\s*([^;]+);/g)) {
        const first = fam.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
        assert.ok(['gnf', 'press start 2p', 'vt323'].includes(first), `font ${fam}`);
    }
    // GNF text on the 8px grid
    for (const [, rule] of css.matchAll(/\{([^}]*font-family:\s*'GNF'[^}]*)\}/g)) {
        const sz = rule.match(/font-size:\s*(\d+)px/);
        if (sz) assert.equal(Number(sz[1]) % 8, 0, rule);
    }
    for (const [, sz] of css.matchAll(/font-size:\s*(\d+)px/g)) assert.ok(Number(sz) >= 8);
});

test('every ca* mission.json (including the pinned check and annual shells, D353) asks for the CA screen; no other mission does', () => {
    const sc = join(root, 'scenarios');
    let ca = 0;
    for (const name of readdirSync(sc)) {
        let meta;
        try { meta = JSON.parse(readFileSync(join(sc, name, 'mission.json'), 'utf8')); } catch { continue; }
        if (/^ca/.test(name)) { ca++; assert.equal(meta.title_style, 'ca', name); }
        else assert.equal(meta.title_style, undefined, name);
    }
    assert.ok(ca >= 64);
});
