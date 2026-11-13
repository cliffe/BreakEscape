// m10 dressing R3 G2: two initiallyHidden hostile guards in the gallery showed their
// health bars over the room while they were hidden. The bar now follows the NPC
// sprite's visibility, on creation and every update.
// Run with: node --test test/js/npc-health-bar-visibility.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const read = (rel) => readFileSync(join(js, rel), 'utf8');
globalThis.window = {};
const src = read('ui/npc-health-bars.js')
    .split("'../config/combat-config.js'").join(`'${dataUrl('export const COMBAT_CONFIG = { ui: { healthBarOffsetY: -40, healthBarWidth: 20, healthBarHeight: 3 } };')}'`)
    .split("'../utils/constants.js'").join(`'${dataUrl('export const overlayDepth = (d) => d;')}'`)
    .split("'../events/combat-events.js'").join(`'${dataUrl('export const CombatEvents = {};')}'`)
    .split("'./theme-colours.js'").join(`'${dataUrl('export const healthBarColours = () => ({});')}'`);
const { NPCHealthBars } = await import(dataUrl(src));

function fakeGraphics() {
    return {
        visible: true,
        setDepth() { return this; },
        setPosition() { return this; },
        setVisible(v) { this.visible = v; return this; },
        clear() {}, fillStyle() {}, fillRect() {}, destroy() {}
    };
}

function bars(sprite) {
    const hb = Object.create(NPCHealthBars.prototype);
    hb.scene = { time: { now: 0 }, add: { graphics: fakeGraphics } };
    hb.healthBars = new Map();
    hb.colours = {};
    window.rooms = { gallery: { npcSprites: [sprite] } };
    window.npcHostileSystem = { getState: () => ({ currentHP: 10, maxHP: 10 }) };
    return hb;
}

test('a bar made for a hidden NPC starts hidden', () => {
    const sprite = { npcId: 'reinforcement_a', x: 0, y: 0, active: true, visible: false };
    const hb = bars(sprite);
    hb.createHealthBar('reinforcement_a');
    assert.equal(hb.healthBars.get('reinforcement_a').graphics.visible, false);
});

test('the bar follows the sprite as it is revealed and hidden again', () => {
    const sprite = { npcId: 'reinforcement_a', x: 0, y: 0, active: true, visible: false };
    const hb = bars(sprite);
    hb.createHealthBar('reinforcement_a');
    const g = hb.healthBars.get('reinforcement_a').graphics;
    sprite.visible = true;
    hb.update();
    assert.equal(g.visible, true);
    sprite.visible = false;
    hb.update();
    assert.equal(g.visible, false);
});
