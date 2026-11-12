// Unlock gaps R1 UX pass (2026-11-12): where a KO'd NPC's items land (npc-hostile.js
// koDropSpots), and which password locks get the case-lock look (password-minigame.js
// isCaseLockTarget).
// Run with: node --test test/js/unlock-r1-ux.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = { rooms: {} };
const swap = (src) => src
    .split("'../config/combat-config.js'").join(`'${dataUrl(read('config/combat-config.js'))}'`)
    .split("'./interaction-walls.js'").join(`'${dataUrl(read('systems/interaction-walls.js'))}'`)
    .split("'../events/combat-events.js'").join(`'${dataUrl(read('events/combat-events.js'))}'`)
    .split("'./npc-sprites.js'").join(`'${dataUrl('export const getNPCDirection = () => "down";')}'`);
const { koDropSpots, KO_DROP_MIN_GAP } = await import(dataUrl(swap(read('systems/npc-hostile.js'))));

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test('drops land at least 32 px from the body and from each other', () => {
    const feet = { x: 200, y: 200 };
    const spots = koDropSpots(feet, 3);
    assert.equal(spots.length, 3);
    for (const s of spots) assert.ok(dist(s, feet) >= KO_DROP_MIN_GAP * 0.75, JSON.stringify(s));
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(dist(spots[i], spots[j]) >= KO_DROP_MIN_GAP);
});

test('a drop avoids furniture that would hide it, and only walkable cells are used', () => {
    const feet = { x: 200, y: 200 };
    // A desk drawn right below the body, where the first choice would be
    const desk = { x: 150, y: 215, w: 100, h: 60 };
    const [spot] = koDropSpots(feet, 1, { obstacles: [desk] });
    const r = { x: spot.x - 16, y: spot.y - 16, w: 32, h: 32 };
    const overlaps = r.x < desk.x + desk.w && r.x + r.w > desk.x && r.y < desk.y + desk.h && r.y + r.h > desk.y;
    assert.equal(overlaps, false, JSON.stringify(spot));

    // Only the cells left of x=180 are walkable
    const walk = (x, y) => (x < 180 ? { x: Math.floor(x / 32) * 32 + 16, y: Math.floor(y / 32) * 32 + 16 } : null);
    for (const s of koDropSpots(feet, 2, { nearestWalkable: walk })) assert.ok(s.x < 180, JSON.stringify(s));
});

test('with nowhere clear, drops still spread round the body', () => {
    const spots = koDropSpots({ x: 0, y: 0 }, 2, { nearestWalkable: () => null });
    assert.equal(spots.length, 2);
    assert.ok(dist(spots[0], spots[1]) >= KO_DROP_MIN_GAP);
});

test('a bag or case gets the case-lock look; a PC or a safe keeps its own', async () => {
    const src = read('minigames/password/password-minigame.js');
    const m = src.match(/export const CASE_LOCK_TYPES = [^\n]+\nexport function isCaseLockTarget[\s\S]*?\n}\n/);
    assert.ok(m, 'isCaseLockTarget is exported');
    const { isCaseLockTarget } = await import(dataUrl(m[0]));
    for (const type of ['bag1', 'briefcase', 'suitcase']) assert.equal(isCaseLockTarget({ type }), true, type);
    for (const type of ['pc', 'laptop', 'safe', undefined]) assert.equal(isCaseLockTarget({ type }), false, String(type));
    assert.equal(isCaseLockTarget(undefined), false);
});
