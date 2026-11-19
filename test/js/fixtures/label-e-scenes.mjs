// Scenes for the E pick fixtures: hand-built ones for the cases that went wrong, and seeded random ones.
// Each scene sets the rooms (and window.seating, npcManager, npcBehaviorManager) and lists stances to press E from.
import { obj, npc, door, seatingFor, seatNpc } from './label-e-harness.mjs';

const STANCES_DIRS = ['up', 'down', 'left', 'right', 'up-left', 'down-right'];

function reset() {
    delete window.seating;
    delete window.npcBehaviorManager;
    delete window.workstationState;
    window.npcManager = { getNPC: (id) => ({ observations: 'npc ' + id }) };
}

/** A scene: { name, build(): rooms, stances: [[fx, fy, dir]] }. build() sets the globals it needs. */
export const handScenes = [
    {
        name: 'standing between a chair and a mug',
        build() { reset(); seatingFor(null);
            return { r: { objects: { chair: obj('chair', 130, 100, 24, 27, { seat: true }), mug: obj('mug', 170, 100, 12, 12) } } }; },
        stances: [[140, 140, 'up'], [160, 120, 'right'], [150, 128, 'left']],
    },
    {
        name: 'seated, another empty chair next to the seat and a mug beyond',
        build() { reset(); const mine = obj('mine', 130, 150, 24, 27, { seat: true });
            seatingFor(mine);
            return { r: { objects: { mine, chair2: obj('chair2', 160, 150, 24, 27, { seat: true }), mug: obj('mug', 136, 146, 12, 12) } } }; },
        stances: [[142, 170, 'right'], [142, 170, 'up'], [142, 170, 'left'], [150, 170, 'right']],
    },
    {
        name: 'seated, the next chair is occupied by an NPC',
        build() { reset(); const mine = obj('mine', 130, 150, 24, 27, { seat: true });
            const c2 = obj('chair2', 160, 150, 24, 27, { seat: true });
            const sitter = npc('sitter', 172, 160);
            seatingFor(mine); seatNpc(sitter, c2);
            return { r: { objects: { mine, chair2: c2, mug: obj('mug', 136, 146, 12, 12) }, npcSprites: [sitter] } }; },
        stances: [[142, 170, 'right'], [142, 170, 'up'], [150, 170, 'right']],
    },
    {
        name: 'standing, an NPC and a PC at about the same angle',
        build() { reset(); seatingFor(null);
            return { r: { objects: { pc: obj('pc', 120, 100, 24, 27, { scenarioData: { id: 'pc', type: 'pc' } }) }, npcSprites: [npc('bob', 168, 114)] } }; },
        stances: [[144, 150, 'up'], [144, 140, 'up'], [144, 130, 'up']],
    },
    {
        name: 'standing, an NPC whose reach comes from a body edge (far centre) and a PC',
        build() { reset(); seatingFor(null);
            return { r: { objects: { pc: obj('pc', 120, 100, 24, 27, { scenarioData: { id: 'pc', type: 'pc' } }) }, npcSprites: [npc('bob', 150, 70, { __reachSq: 100 })] } }; },
        stances: [[144, 140, 'up'], [144, 120, 'up']],
    },
    {
        name: 'standing at a north door with an NPC beside',
        build() { reset(); seatingFor(null);
            return { r: { objects: {}, doorSprites: { d: door('d1', 150, 100) }, npcSprites: [npc('bob', 166, 112)] } }; },
        stances: [[150, 125, 'up'], [158, 125, 'up'], [166, 130, 'up'], [150, 125, 'right']],
    },
    {
        name: 'standing at a side door',
        build() { reset(); seatingFor(null);
            return { r: { objects: { crate: obj('crate', 100, 100, 24, 24) }, doorSprites: { d: door('d2', 150, 100, 'east') }, npcSprites: [] } }; },
        stances: [[130, 110, 'right'], [130, 130, 'right'], [118, 120, 'up']],
    },
    {
        name: 'a sofa with one sitter and a free place',
        build() { reset(); seatingFor(null);
            const sofa = obj('sofa', 100, 100, 64, 30, { seat: true, _places: { 0: 'sitter' } });
            const sitter = npc('sitter', 112, 112);
            seatNpc(sitter, sofa, [[12, -2], [48, -2]]);
            return { r: { objects: { sofa }, npcSprites: [sitter] } }; },
        stances: [[112, 132, 'up'], [150, 132, 'up'], [130, 132, 'up'], [112, 126, 'up'], [150, 126, 'up']],
    },
    {
        name: 'a walking-away NPC beside a crate',
        build() { reset(); seatingFor(null);
            return { r: { objects: { crate: obj('crate', 120, 100, 24, 24) }, npcSprites: [npc('bob', 140, 112, { body: { velocity: { x: 50, y: 0 } } })] } }; },
        stances: [[132, 140, 'up'], [132, 140, 'right']],
    },
];

function lcg(seed) { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }

export function randomScenes(count = 60) {
    const scenes = [];
    for (let i = 0; i < count; i++) {
        const seat = i % 3 === 0;      // a third of them seated
        scenes.push({
            name: 'random ' + i,
            build() {
                const rnd = lcg(1000 + i);
                reset();
                const objects = {};
                const n = 3 + Math.floor(rnd() * 4);
                for (let k = 0; k < n; k++) {
                    const isSeat = rnd() < 0.3;
                    const type = rnd() < 0.2 ? 'pc' : 'box';
                    objects['o' + k] = obj('o' + k, 90 + Math.floor(rnd() * 90), 80 + Math.floor(rnd() * 70), 16 + Math.floor(rnd() * 30), 12 + Math.floor(rnd() * 40),
                        { seat: isSeat, scenarioData: { id: 'o' + k, type } });
                }
                const npcSprites = [];
                const nn = Math.floor(rnd() * 3);
                for (let k = 0; k < nn; k++) npcSprites.push(npc('n' + k, 100 + Math.floor(rnd() * 80), 90 + Math.floor(rnd() * 60), rnd() < 0.3 ? { __reachSq: Math.floor(rnd() * 900) } : {}));
                const doorSprites = rnd() < 0.5 ? { d: door('dr', 110 + Math.floor(rnd() * 60), 100 + Math.floor(rnd() * 40), rnd() < 0.5 ? 'north' : 'west') } : {};
                const sitting = seat ? Object.values(objects).find(o => o.seat) : null;
                seatingFor(sitting || null);
                // an NPC on a different seat, now and then
                const other = Object.values(objects).find(o => o.seat && o !== sitting);
                if (other && npcSprites.length && rnd() < 0.5) seatNpc(npcSprites[0], other);
                return { r: { objects, doorSprites, npcSprites } };
            },
            stances: Array.from({ length: 5 }, (_, k) => {
                const rnd = lcg(5000 + i * 7 + k);
                return [100 + Math.floor(rnd() * 80), 120 + Math.floor(rnd() * 60), STANCES_DIRS[Math.floor(rnd() * STANCES_DIRS.length)]];
            }),
        });
    }
    return scenes;
}
