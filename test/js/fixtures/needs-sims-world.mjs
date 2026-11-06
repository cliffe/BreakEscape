// A node stub shaped like scenarios/test_needs_sims (the needs showcase), for tests that need
// its cast and office rather than the small office() fixture. It extends makeWorld
// (needs-stub-world.mjs): same moves, emits and calls, plus the showcase's NPCs and objects,
// lazy room loading and an approachCell that honours `useFrom` as the live adapter does.
//
// NPC needs, needsHome, interests, speeds, onUse and usePayload are copied from
// scenarios/test_needs_sims/scenario.json.erb. Seed: "test_needs_sims" (its npcNeedsSeed).
//
// Object centres and approach cells were read off a live run: game 541 on :3001, commit
// b8dbed380, 2026-11-05, through window.npcNeedsSystem.world.getObject / approachCell. Room
// origins: office (0,0), kitchen (-320,0), lounge (320,0). The pathfinding grid is 8 px, so a
// live approach cell is a point snapped to the centre of its 8 px cell. office_mugs had been
// carried off before the dump; its centre is its declared tile (4,7) plus half its 15x14 sprite.
// NPC start points are their scenario tiles (x 32 + 16, plus the room origin); the live sprites
// stand within a few pixels of these.
//
// Slice 2a (2026-11-06, game 585 on :3001): the PCs are private, the lounge is private to Rosa
// and Grace (needsPrivateTo), Rosa's kettle (lounge_kettle) stands by the lounge door, and the
// kitchen coffee station moved from tile (6,8) to (3,8), so the kettle is nearer to Tom's and
// Amara's desks than the kitchen station. Both centres and approach cells were read live.
//
// Lazy loading: the kitchen and lounge (and Rosa, who lives in the lounge) do not exist until
// loadRoom() is called, as in the game, where a room loads when its door first opens.
import { makeWorld } from './needs-stub-world.mjs';

const TILE = 32;
export const SIMS_SEED = 'test_needs_sims';

/** Centre of the 8 px pathfinding cell holding (x, y), as findNearestWalkableWorldCell returns it. */
export const snap = v => Math.floor(v / 8) * 8 + 4;

/** Approach cells recorded live for objects without `useFrom` (game 541). */
export const RECORDED_CELLS = {
    amara_pc: { x: 228, y: 124 },
    tom_pc: { x: 92, y: 164 },
    sanjay_pc: { x: 92, y: 124 },
    grace_laptop: { x: 44, y: 172 },
    activity_board: { x: 228, y: 36 },
    microwave: { x: -148, y: 108 },
    water_cooler: { x: -276, y: 244 },
    washing_up_tray: { x: -212, y: 100 },
    rosa_laptop: { x: 492, y: 132 }
};

function objects() {
    return [
        // office (start room)
        { id: 'amara_pc', roomId: 'office', x: 229, y: 122, affordance: { satisfies: 'work', restores: 60, useSeconds: 10, accepts: ['post'], private: true } },
        { id: 'tom_pc', roomId: 'office', x: 88, y: 166, affordance: { satisfies: 'work', restores: 60, useSeconds: 10, private: true } },
        { id: 'sanjay_pc', roomId: 'office', x: 92.5, y: 122.5, affordance: { satisfies: 'work', restores: 60, useSeconds: 10, private: true } },
        { id: 'grace_laptop', roomId: 'office', x: 45.5, y: 175 },
        { id: 'office_coffee', roomId: 'office', x: 269, y: 276.5, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 12, useFrom: { dx: -1, dy: 0 } } },
        { id: 'office_mugs', roomId: 'office', x: 135.5, y: 231, needsTag: 'dirty_mugs' },
        { id: 'activity_board', roomId: 'office', x: 230, y: 39 },
        // kitchen (loads when the west door opens)
        { id: 'fridge', room: 'kitchen', x: -270, y: 94.5, affordance: { satisfies: 'hunger', restores: 80, useSeconds: 15, useFrom: { dx: 0, dy: 1 } } },
        { id: 'microwave', room: 'kitchen', x: -149, y: 105, affordance: { satisfies: 'hunger', restores: 60, useSeconds: 10 } },
        { id: 'kitchen_coffee', room: 'kitchen', x: -211, y: 276.5, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 12, useFrom: { dx: 0, dy: -1 } } },
        { id: 'water_cooler', room: 'kitchen', x: -276, y: 247.5, affordance: { satisfies: ['thirst', 'social'], restores: 70, useSeconds: 15, capacity: 2 } },
        { id: 'washing_up_tray', room: 'kitchen', x: -214, y: 103.5, affordance: { accepts: ['dirty_mugs'], useSeconds: 5 } },
        // lounge (loads when the east door opens)
        { id: 'rosa_laptop', room: 'lounge', x: 494, y: 133.5 },
        { id: 'lounge_sofa', room: 'lounge', x: 543, y: 275, affordance: { satisfies: 'rest', restores: 80, useSeconds: 20, capacity: 2, useFrom: { dx: 0, dy: -1 } } },
        { id: 'lounge_kettle', room: 'lounge', x: 359.5, y: 105, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 12, useFrom: { dx: 1, dy: 0 } } }
    ].map(o => (o.room ? { ...o, roomId: null } : o));
}

const START = (room, tx, ty) => ({ x: tx * TILE + 16 + (room === 'kitchen' ? -320 : room === 'lounge' ? 320 : 0), y: ty * TILE + 16 });

function npcs() {
    return {
        amara: {
            pos: START('office', 7, 3),
            rec: {
                id: 'amara', needsHome: 'amara_pc', needsSpeed: 90,
                needs: { caffeine: { decayPerMin: 20, urgentAt: 40, initial: 58 }, work: { decayPerMin: 10, urgentAt: 50, initial: 72 } },
                interests: { post: { weight: 3, noticeRooms: ['office'] } },
                usePayload: { who: 'amara' },
                onUse: { amara_pc: { setGlobal: 'amara_opened_parcel' } }
            }
        },
        tom: {
            pos: START('office', 3, 6),
            rec: {
                id: 'tom', needsHome: 'tom_pc', needsSpeed: 80,
                needs: {
                    caffeine: { decayPerMin: 20, urgentAt: 40, initial: 60 },
                    hunger: { decayPerMin: 10, urgentAt: 40, initial: 65 },
                    work: { decayPerMin: 8, urgentAt: 50, initial: 80 }
                },
                onUse: { fridge: { setGlobal: 'tom_had_lunch' } }
            }
        },
        grace: {
            pos: START('office', 1, 5),
            rec: {
                id: 'grace', needsHome: 'grace_laptop', needsSpeed: 70,
                needs: { rest: { decayPerMin: 12, urgentAt: 40, initial: 64 }, thirst: { decayPerMin: 15, urgentAt: 40, initial: 79 } },
                interests: { dirty_mugs: { weight: 3, noticeRooms: ['office', 'kitchen'] } }
            }
        },
        sanjay: {
            pos: START('office', 3, 4),
            rec: {
                id: 'sanjay', needsHome: 'sanjay_pc', needsSpeed: 85,
                needs: {
                    work: { decayPerMin: 15, urgentAt: 50, initial: 65 },
                    hunger: { decayPerMin: 8, urgentAt: 40, initial: 64 },
                    social: { decayPerMin: 12, urgentAt: 40, initial: 76 }
                }
            }
        }
    };
}

/** Rosa lives in the lounge and exists only once it loads. */
const ROSA = () => ({
    pos: START('lounge', 4, 6), room: 'lounge',
    rec: {
        id: 'rosa', needsHome: 'rosa_laptop', needsSpeed: 85,
        needs: {
            social: { decayPerMin: 15, urgentAt: 40, initial: 70 },
            caffeine: { decayPerMin: 15, urgentAt: 40, initial: 85 },
            rest: { decayPerMin: 10, urgentAt: 40, initial: 75 }
        }
    }
});

/**
 * The live adapter's approach rule on a wall-less stub: `useFrom` given, the cell at that tile
 * offset from the object; otherwise the recorded live cell; otherwise (a dropped item, standing on
 * it) the cell under the object.
 */
export function simsApproachCell(o) {
    const uf = o.affordance?.useFrom;
    if (uf && Number.isFinite(uf.dx) && Number.isFinite(uf.dy)) return { x: snap(o.x + uf.dx * TILE), y: snap(o.y + uf.dy * TILE) };
    if (RECORDED_CELLS[o.id]) return { ...RECORDED_CELLS[o.id] };
    return { x: snap(o.x), y: snap(o.y) };
}

/**
 * Build the showcase world. Returns makeWorld's handle plus:
 *   loadRoom(sys, roomId)  open a door: the room's objects appear (and Rosa, for the lounge)
 *   drop(id, tag, x, y)    the player drops a tagged item in the office
 *   searches               count of world.reachable calls (path searches)
 * With `{ reachable }` the world answers reachability through that function (default: all
 * reachable, but counted, so select back-off engages as it does live).
 */
export function makeSimsWorld({ reachable = () => true } = {}) {
    const cfg = { npcs: npcs(), objects: objects() };
    const w = makeWorld(cfg);
    const loaded = new Set(['office']);
    w.world.approachCell = simsApproachCell;
    w.world.roomIds = () => [...loaded];
    w.world.roomPrivateTo = r => (r === 'lounge' && loaded.has('lounge') ? ['rosa', 'grace'] : null);
    w.searches = 0;
    w.world.reachable = (id, o) => { w.searches++; return reachable(id, o); };
    w.loadRoom = (sys, roomId) => {
        if (loaded.has(roomId)) return;
        loaded.add(roomId);
        for (const o of w.objs) if (o.room === roomId) o.roomId = roomId;
        if (roomId === 'lounge') {
            cfg.npcs.rosa = ROSA();
            w.pos.rosa = { ...cfg.npcs.rosa.pos, roomId: 'lounge' };
            sys.register('rosa');
        }
    };
    w.drop = (id, tag, x, y) => w.objs.push({ id, roomId: 'office', pickable: true, needsTag: tag, x, y });
    return w;
}

/**
 * The README's "How to watch it" as a fixed script: watch the office, open both doors at 1:30,
 * drop the parcel and the mugs, then let the day run. Returns the system and world.
 */
export function runSimsDay(NPCNeedsSystem, { minutes = 6, opts = {}, reachable } = {}) {
    const w = makeSimsWorld({ reachable });
    const sys = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true, ...opts });
    w.attach(sys);
    sys.registerAll();
    const at = (tick, fn) => { while (sys.tickCount < tick) sys.tick(); fn(); };
    at(360, () => { w.loadRoom(sys, 'kitchen'); w.loadRoom(sys, 'lounge'); });
    at(450, () => w.drop('parcel', 'post', 200, 200));
    at(470, () => w.drop('player_mugs', 'dirty_mugs', 150, 230));
    while (sys.tickCount < minutes * 240) sys.tick();
    return { sys, w };
}
