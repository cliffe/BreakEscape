// Stub world for the NPC needs tests (systems/npc-needs.js): the shape of createEngineWorld,
// with moves that complete at once (arrival queued) and no walls. Shared by npc-needs.test.mjs
// (the office() fixture) and fixtures/needs-sims-world.mjs, which extends it.
const TILE = 32;

/** A flat world: moves complete at once (arrival queued), no walls. */
export function makeWorld({ npcs, objects, arrive = true }) {
    const pos = {};
    for (const [id, n] of Object.entries(npcs)) pos[id] = { ...n.pos, roomId: n.room || 'office' };
    const objs = objects.map(o => ({ roomId: 'office', pickable: true, ...o }));
    const calls = { moves: [], emits: [], globals: {}, consumed: [], dropped: [], cancels: [] };
    let sys = null;
    let chatWith = null;
    let nudgeTo = null;        // (id, pos) => landing point, or null: a refused nudge
    let playerNear = false;
    const world = {
        elapsedMs: () => 0,
        isVmActive: () => false,
        npcIds: () => Object.keys(npcs),
        getNpc: id => npcs[id]?.rec || null,
        npcPos: id => (pos[id] ? { ...pos[id] } : null),
        npcStatus: () => ({}),
        inChatWith: id => chatWith === id,
        listObjects: () => objs.filter(o => o.roomId),
        getObject: id => objs.find(o => o.id === id && o.roomId) || null,
        approachCell: o => ({ x: o.x, y: o.y + TILE }),
        tileToWorld: (r, x, y) => ({ x: x * TILE, y: y * TILE }),
        speedFor: () => 80,
        moveTo(id, x, y, speed, opts) {
            calls.moves.push({ id, x, y, yieldToPlayer: opts.yieldToPlayer, moveId: opts.moveId, ...(opts.reroute ? { reroute: true } : {}), ...(opts.nudge ? { nudge: true } : {}) });
            // SIMS-2: place the NPC on its destination and echo the move id, so the arrival counts.
            const nudged = opts.nudge && nudgeTo ? nudgeTo(id, { ...pos[id] }) : null;
            if (nudged) { pos[id].x = nudged.x; pos[id].y = nudged.y; }
            if (arrive) { pos[id].x = x; pos[id].y = y; sys.onArrived(id, 'needs', { x, y, moveId: opts.moveId }); }
            return { nudged };
        },
        playerBlocks: () => playerNear,
        cancelMove: id => calls.cancels.push(id),
        faceTo() {},
        pickUp(npcId, itemId) {
            const o = objs.find(x => x.id === itemId);
            if (!o || !o.roomId) return false;
            o.roomId = null; // gone from the world
            return true;
        },
        consumeHeld: (npcId, itemId) => calls.consumed.push({ npcId, itemId }),
        dropHeld: (npcId, itemId) => calls.dropped.push({ npcId, itemId }),
        emit: (name, data) => calls.emits.push({ name, data }),
        setGlobal: (name, v) => { calls.globals[name] = v; }
    };
    return {
        world, calls, objs, pos,
        attach(s) { sys = s; },
        setChat(id) { chatWith = id; },
        /** fn(id, pos) returns where a requested nudge lands, or null (refused); unset: no nudge runs */
        setNudge(fn) { nudgeTo = fn; },
        setPlayerNear(v) { playerNear = !!v; }
    };
}
