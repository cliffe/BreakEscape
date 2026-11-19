// Dusting D183 item 2: re-interacting with a surface that already has a lift opens the lift result as the main view
// (the lift result is the main view, X keeps it, "Dust again" secondary); a surface with no lift keeps "Dust for prints".
// Run with: node --max-old-space-size=2048 test/js/dusting-reopen.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = mkdtempSync(join(tmpdir(), 'dusting-reopen-'));
cpSync(join(here, '../../public/break_escape/js'), join(root, 'js'), { recursive: true });
writeFileSync(join(root, 'package.json'), '{"type":"module"}');

const el = () => ({ setAttribute() {}, appendChild() {}, style: {} });
globalThis.window = { gameState: { globalVariables: {}, biometricSamples: [] } };
globalThis.document = { getElementById: () => null, createElement: el, head: { appendChild() {} }, body: { appendChild() {} } };
globalThis.Image = class {};
const { DustingMinigame } = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-game.js')).href);

function examineGame(objectId, resume = null) {
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, { data: { id: objectId, name: 'Round panel' }, objectId, surface: { description: 'Painted metal.' }, resume });
    return g;
}
const buttons = html => [...html.matchAll(/<button class="dusting-btn( dusting-primary)?" data-action="([a-z-]+)">([^<]+)<\/button>/g)]
    .map(m => ({ primary: !!m[1], action: m[2], label: m[3] }));

test('no lift on file: Dust for prints is the primary path', () => {
    const b = buttons(examineGame('panel_a')._htmlExamine());
    assert.ok(b[0].primary && b[0].action === 'start' && b[0].label === 'Dust for prints', 'primary is Dust for prints');
});

test('a Good lift on file: the lift result is the main view and Dust again is secondary', () => {
    window.gameState.biometricSamples.push({ sourceObjectId: 'panel_b', quality: 0.78, rating: 'Good', owner: 'Margaret Sorensen', identified: false });
    const html = examineGame('panel_b')._htmlExamine();
    const b = buttons(html);
    assert.ok(!b.some(x => x.primary), 'no primary button: the lift result is the main view, X closes and keeps it');
    assert.ok(!html.includes('data-action="close"'), 'no Close beside the X (A16)');
    assert.ok(html.includes('The lift is kept.'), 'says the lift is kept');
    const again = b.find(x => x.action === 'start');
    assert.ok(again && !again.primary && again.label === 'Dust again', 'Dust again is not primary');
    assert.ok(html.includes('Lifted: 78%, Good.'), 'result line shows percent and rating');
    assert.ok(!html.includes('Identified as'), 'no owner while unidentified');
});

test('an identified lift names its owner', () => {
    window.gameState.biometricSamples.push({ sourceObjectId: 'panel_c', quality: 0.8, rating: 'Good', owner: 'Margaret Sorensen', ownerName: 'Margaret Sorensen', identified: true });
    assert.ok(examineGame('panel_c')._htmlExamine().includes('Identified as Margaret Sorensen.'), 'owner shown');
});

test('a saved mid-run entry comes before the lift view: Resume dusting is primary', () => {
    window.gameState.biometricSamples.push({ sourceObjectId: 'panel_d', quality: 0.7, rating: 'Fair', owner: 'X', identified: false });
    const b = buttons(examineGame('panel_d', { step: 'dust' })._htmlExamine());
    assert.ok(b[0].primary && b[0].action === 'resume', 'primary is Resume dusting');
    assert.ok(b.some(x => x.action === 'start' && x.label === 'Start again'), 'Start again offered');
});

test('the object name stays escaped in the examine view', () => {
    const g = examineGame('panel_e'); g.data.name = '<b>x</b>';
    assert.ok(!g._htmlExamine().includes('<b>x</b>'), 'name escaped');
});
