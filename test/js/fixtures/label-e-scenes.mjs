// Scenes for the E pick fixtures: hand-built ones for the cases that went wrong, and seeded random ones.
// Each scene sets the rooms (and window.seating, npcManager, npcBehaviorManager) and lists stances to press E from.
import { obj, npc, door, seatingFor, seatNpc } from './label-e-harness.mjs';

const STANCES_DIRS = ['up', 'down', 'left', 'right', 'up-left', 'down-right'];

function reset() {
    delete window.seating;
    delete window.npcBehaviorManager;
    delete window.workstationState;
    delete window.npcHostileSystem;
    window.npcManager = { getNPC: (id) => ({ observations: 'npc ' + id }) };
}

/** window.npcHostileSystem with these NPCs knocked out (E's talk path also asks isNPCHostile, so both answer). */
const koSystem = (...ids) => ({ isNPCKO: (id) => ids.includes(id), isNPCHostile: () => false });

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
        // bob is on the move from the crate (workstationState.leftBy, the needs system's npc_left_post record) and keeps his velocity:
        // npcGivesWay is true for him, so he takes the give-way penalty and the crate wins from the stance that leans his way
        name: 'a walking-away NPC beside a crate',
        build() { reset(); seatingFor(null);
            window.workstationState = { leftBy: (id, npcId) => id === 'crate' && npcId === 'bob' };
            return { r: { objects: { crate: obj('crate', 120, 100, 24, 24) }, npcSprites: [npc('bob', 140, 112, { body: { velocity: { x: 50, y: 0 } } })] } }; },
        stances: [[132, 140, 'up'], [132, 140, 'right'], [150, 140, 'right'], [118, 140, 'right'], [130, 124, 'right'], [138, 128, 'right']],   // the last three: the penalty moves the pick from bob to the crate
    },
    {
        name: 'the same NPC and crate with no give-way record (bob keeps his place in the pick)',
        build() { reset(); seatingFor(null);
            return { r: { objects: { crate: obj('crate', 120, 100, 24, 24) }, npcSprites: [npc('bob', 140, 112, { body: { velocity: { x: 50, y: 0 } } })] } }; },
        stances: [[132, 140, 'up'], [132, 140, 'right'], [150, 140, 'right'], [118, 140, 'right'], [130, 124, 'right'], [138, 128, 'right']],   // control: with no record, bob keeps the pick at the last three stances
    },
    {
        name: 'a walking-away NPC with a give-way record for a different object (no penalty)',
        build() { reset(); seatingFor(null);
            window.workstationState = { leftBy: (id, npcId) => id === 'elsewhere' && npcId === 'bob' };
            return { r: { objects: { crate: obj('crate', 120, 100, 24, 24) }, npcSprites: [npc('bob', 140, 112, { body: { velocity: { x: 50, y: 0 } } })] } }; },
        stances: [[132, 140, 'right'], [150, 140, 'right'], [118, 140, 'right'], [130, 124, 'right'], [138, 128, 'right']],
    },
    {
        name: 'a blocked prop in front of an open one',
        build() { reset(); seatingFor(null);
            return { r: { objects: { wall: obj('wall', 130, 100, 24, 24, { __blocked: true }), open: obj('open', 170, 100, 24, 24) } } }; },
        stances: [[142, 140, 'up'], [160, 140, 'up'], [160, 140, 'up-left'], [175, 140, 'up']],
    },
    {
        name: 'a blocked NPC beside an open prop',
        build() { reset(); seatingFor(null);
            return { r: { objects: { crate: obj('crate', 170, 100, 24, 24) }, npcSprites: [npc('bob', 148, 112, { __blocked: true })] } }; },
        stances: [[148, 151, 'up'], [152, 151, 'up'], [160, 151, 'up-left'], [176, 151, 'up'], [160, 140, 'up-right']],   // bob stands 8 px ahead of the first three, so only his block keeps him from the pick
    },
    {
        name: 'a knocked-out NPC beside a mug, and a knocked-out sitter on a chair',
        build() { reset(); seatingFor(null);
            window.npcHostileSystem = koSystem('ko', 'kosit');
            const chair = obj('chair', 190, 100, 24, 27, { seat: true });
            const kosit = npc('kosit', 200, 112);
            seatNpc(kosit, chair);
            return { r: { objects: { mug: obj('mug', 160, 100, 12, 12), chair }, npcSprites: [npc('ko', 148, 112), kosit, npc('alive', 176, 126)] } }; },
        stances: [[148, 151, 'up'], [166, 140, 'up'], [200, 151, 'up'], [196, 151, 'up'], [176, 165, 'up'], [190, 140, 'up']],   // each NPC is level with a stance that faces it; the mug is the control
    },
    {
        name: 'seated with a mug and a crate out of reach (E stands up)',
        build() { reset(); const mine = obj('mine', 130, 150, 24, 27, { seat: true });
            seatingFor(mine);
            return { r: { objects: { mine, mug: obj('mug', 140, 100, 12, 12), crate: obj('crate', 220, 150, 24, 24) } } }; },
        stances: [[142, 172, 'down'], [142, 172, 'left'], [142, 172, 'right'], [142, 172, 'up']],
    },
    {
        name: 'standing with everything out of reach',
        build() { reset(); seatingFor(null);
            return { r: { objects: { crate: obj('crate', 220, 100, 24, 24), far: obj('far', 60, 60, 16, 16) }, npcSprites: [npc('bob', 230, 60)] } }; },
        stances: [[140, 150, 'up'], [140, 150, 'right'], [140, 120, 'left'], [140, 170, 'down']],
    },
    {
        name: 'hidden, inactive and non-interactable objects near a visible one',
        build() { reset(); seatingFor(null);
            return { r: { objects: {
                hidden: obj('hidden', 140, 100, 24, 24, { visible: false }),
                inactive: obj('inactive', 152, 100, 24, 24, { active: false }),
                inert: obj('inert', 164, 100, 24, 24, { interactable: false }),
                shown: obj('shown', 190, 100, 24, 24) } } }; },
        stances: [[152, 140, 'up'], [170, 140, 'up'], [190, 140, 'up'], [175, 140, 'right']],
    },
    {
        name: 'a sofa with two sitters (full)',
        build() { reset(); seatingFor(null);
            const sofa = obj('sofa', 100, 100, 64, 30, { seat: true, _places: { 0: 's1', 1: 's2' }, seatedBy: 'full' });
            const s1 = npc('s1', 112, 112), s2 = npc('s2', 148, 112);
            const places = [[12, -2], [48, -2]];
            seatNpc(s1, sofa, places, 0); seatNpc(s2, sofa, places, 1);
            return { r: { objects: { sofa, mug: obj('mug', 170, 112, 12, 12) }, npcSprites: [s1, s2] } }; },
        stances: [[112, 132, 'up'], [148, 132, 'up'], [130, 132, 'up'], [130, 140, 'up'], [168, 135, 'right']],
    },
    {
        name: 'a sofa with two sitters, one of them knocked out, and a free place between them',
        build() { reset(); seatingFor(null);
            window.npcHostileSystem = koSystem('s2');
            const sofa = obj('sofa', 100, 100, 64, 30, { seat: true, _places: { 0: 's1', 2: 's2' } });   // not 'full': place 1 is free
            const s1 = npc('s1', 112, 112), s2 = npc('s2', 148, 112);
            const places = [[12, -2], [30, -2], [48, -2]];
            seatNpc(s1, sofa, places, 0); seatNpc(s2, sofa, places, 2);
            return { r: { objects: { sofa }, npcSprites: [s1, s2] } }; },
        stances: [[112, 132, 'up'], [148, 132, 'up'], [130, 132, 'up'], [131, 126, 'up'], [118, 140, 'up-right']],
    },
    {
        name: 'wall-mounted and tall props against the back wall',
        build() { reset(); seatingFor(null);
            return { r: { objects: {
                cabinet: obj('cabinet', 120, 70, 30, 47),
                poster: obj('poster', 170, 76, 20, 20, { scenarioData: { id: 'poster', wallMounted: true } }),
                stool: obj('stool', 150, 130, 16, 16) } } }; },
        stances: [[130, 120, 'up'], [135, 112, 'up'], [180, 112, 'up'], [180, 100, 'up'], [150, 150, 'up'], [150, 140, 'up-left'],
            [135, 140, 'up'], [135, 148, 'up'], [128, 145, 'up'], [180, 150, 'up'], [180, 140, 'up'], [175, 145, 'up-right']],
    },
    {
        name: 'seated at a desk PC with an NPC beside it',
        build() { reset(); const mine = obj('mine', 130, 150, 24, 27, { seat: true });
            seatingFor(mine);
            return { r: { objects: { mine, desk: obj('desk', 120, 80, 40, 16), pc: obj('pc', 130, 96, 24, 27, { scenarioData: { id: 'pc', type: 'pc' } }), mug: obj('mug', 150, 130, 12, 12) },
                npcSprites: [npc('bob', 160, 138)] } }; },
        stances: [[142, 172, 'up'], [142, 172, 'up-right'], [142, 172, 'right'], [150, 172, 'up']],
    },
    {
        name: 'seated at a desk PC with an NPC nearer the line of facing',
        build() { reset(); const mine = obj('mine', 130, 150, 24, 27, { seat: true });
            seatingFor(mine);
            return { r: { objects: { mine, pc: obj('pc3', 120, 96, 24, 27, { scenarioData: { id: 'pc3', type: 'pc3' } }) },
                npcSprites: [npc('bob', 142, 128)] } }; },
        stances: [[142, 172, 'up'], [142, 172, 'up-left'], [142, 172, 'up-right']],
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
                const rnd = lcg(Math.imul(1000 + i, 2654435761));
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
                const rnd = lcg(Math.imul(5000 + i * 7 + k, 2654435761));
                return [100 + Math.floor(rnd() * 80), 120 + Math.floor(rnd() * 60), STANCES_DIRS[Math.floor(rnd() * STANCES_DIRS.length)]];
            }),
        });
    }
    return scenes;
}
