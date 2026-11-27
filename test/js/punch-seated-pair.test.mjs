// Punching one of two seated operators (m07 Gwen at (384,160) and Adaeze at (448,160), seats 64 px
// apart, seated collider 18 x 8, measured live) never reaches the other: from any standing spot
// in the gap, with any of the eight facings, the punch cone (range 32, half angle 40) holds at
// most one body. The player stands south of the seat row (feet y 164 to 210).
// Run with: node test/js/punch-seated-pair.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
globalThis.window = {};
const cfg = dataUrl(read('config/combat-config.js'));
const fight = dataUrl(read('systems/fight-styles.js'));
const swap = (src) => src
    .split("'../config/combat-config.js'").join(`'${cfg}'`)
    .split("'../utils/knockback.js'").join(`'${dataUrl('export function applyKnockback() {}')}'`)
    .split("'./fight-styles.js'").join(`'${fight}'`)
    .split("'./interaction-walls.js'").join(`'${dataUrl('export const wallClearFrom = () => true; export const playerFeet = () => null;')}'`)
    .split("'../events/combat-events.js'").join(`'${dataUrl('')}'`)
    .split("'./npc-sprites.js'").join(`'${dataUrl('export const getNPCDirection = () => "down";')}'`);
const { PlayerCombat } = await import(dataUrl(swap(read('systems/player-combat.js'))));
const pc = Object.create(PlayerCombat.prototype);
const box = (cx, cy, w = 18, h = 8) => ({ left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2, width: w, height: h });
const gwen = box(384, 160), adaeze = box(448, 160);
const dirs = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];

test('no standing spot in the gap and facing holds both seated operators in the cone', () => {
    let any = 0;
    for (let x = 392; x <= 440; x += 2) for (let y = 164; y <= 210; y += 2) for (const d of dirs) {
        const g = pc.bodyOverlapsCone(gwen, x, y, d, 32), a = pc.bodyOverlapsCone(adaeze, x, y, d, 32);
        if (g || a) any++;
        assert.ok(!(g && a), `both in cone from (${x},${y}) facing ${d}`);
    }
    assert.ok(any > 100, 'the sweep reaches the seats');
});

test('the logged clip spots hit only the struck seat', () => {
    assert.equal(pc.bodyOverlapsCone(gwen, 410, 173, 'up-left', 32), true);
    assert.equal(pc.bodyOverlapsCone(adaeze, 410, 173, 'up-left', 32), false);
    assert.equal(pc.bodyOverlapsCone(gwen, 416, 178, 'left', 32), true);
    assert.equal(pc.bodyOverlapsCone(adaeze, 416, 178, 'left', 32), false);
});

test('a body about 32 px wide would be caught by both (so the box size is what keeps them apart)', () => {
    const g = box(384, 160, 32, 16), a = box(448, 160, 32, 16);
    let both = 0;
    for (let x = 392; x <= 440; x += 2) for (let y = 164; y <= 210; y += 2) for (const d of dirs)
        if (pc.bodyOverlapsCone(g, x, y, d, 32) && pc.bodyOverlapsCone(a, x, y, d, 32)) both++;
    assert.ok(both > 0);
});
