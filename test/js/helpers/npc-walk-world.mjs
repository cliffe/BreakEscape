// Shared stub world for the npc-walk node tests: two rooms side by side (hall and dock)
// with one door, an injected environment and stub behaviours. Not a test file itself.
const { installNpcWalk } = await import('../../../public/break_escape/js/systems/npc-walk.js');

export const flush = () => new Promise(r => setImmediate(r));

// Two rooms side by side: hall (0-320) and dock (320-640), 320 px tall. The door between them is
// at (320, 160). The camera shows the hall only.
export function world({ locked = false, dockLoaded = true, doorGates = null, view = { x: 0, y: 0, width: 300, height: 320 } } = {}) {
    const emits = [];
    let clock = 1000;
    const fades = [];
    const doorSprite = { active: true, doorProperties: { roomId: 'hall', connectedRoom: 'dock', worldX: 320, worldY: 160, locked } };
    const rooms = {
        hall: { position: { x: 0, y: 0 }, doorSprites: [doorSprite] },
    };
    const roomBounds = new Map([['hall', { worldX: 0, worldY: 0, mapWidth: 10, mapHeight: 10 }]]);
    const dockRoom = { position: { x: 320, y: 0 }, doorSprites: [] };
    const dockBounds = { worldX: 320, worldY: 0, mapWidth: 10, mapHeight: 10 };
    const loadDock = () => { rooms.dock = dockRoom; roomBounds.set('dock', dockBounds); };
    if (dockLoaded) loadDock();
    const loads = [];
    const pfm = {
        roomBounds,
        worldGrid: Array.from({ length: 40 }, () => new Array(80).fill(0)),
        worldGridBounds: { minX: 0, minY: 0, cols: 80, rows: 40, step: 8 }
    };
    const visibility = new Map();
    const npcs = new Map();
    const npcManager = {
        getNPC: (id) => npcs.get(id),
        npcs,
        recordNpcVisibility(id, v, { persistOnly = false } = {}) {
            visibility.set(id, v);
            if (!persistOnly && npcs.get(id)) npcs.get(id).isVisible = v;
        },
        isHiddenByMapping: (id) => visibility.get(id) === false
    };
    let syncs = 0;
    let hostile = null;
    const opened = [];
    const env = {
        rooms: () => rooms,
        pfm: () => pfm,
        view: () => w.view,
        player: () => w.player,
        npcManager: () => npcManager,
        dispatcher: () => ({ emit: (n, d) => emits.push({ name: n, data: d }) }),
        doorGates: () => doorGates,
        hostile: () => hostile,
        loadRoom: (id) => { loads.push(id); if (id === 'dock' && w.dockLoadsOnRequest) loadDock(); return Promise.resolve(); },
        openDoorForNpc: (s, id, o) => { opened.push(id); w.openedOpts.push(o || null); },
        requestSync: () => { syncs++; },
        now: () => clock,
        wait: (ms) => { clock += ms; return Promise.resolve(); },
        fade: (sprite, to) => { fades.push(to); sprite.alpha = to; return Promise.resolve(); }
    };
    const manager = {
        behaviors: new Map(),
        setNPCVisible(id, v) {
            npcManager.recordNpcVisibility(id, v);
            const b = this.behaviors.get(id);
            if (b) { b.sprite.visible = v; b.sprite.alpha = v ? 1 : 0; if (b.sprite.body) b.sprite.body.enable = v; }
        }
    };
    const w = {
        emits, fades, rooms, pfm, npcs, npcManager, visibility, manager, loads, opened, view, player: null,
        dockLoadsOnRequest: true, openedOpts: [], doorSprite,
        get syncs() { return syncs; },
        setHostile(h) { hostile = h; },
        advance(ms) { clock += ms; },
        addNpc(id, { visible = false, at = { x: 160, y: 160 } } = {}) {
            npcs.set(id, { id, roomId: 'hall', position: { x: 5, y: 5 }, isVisible: visible });
            const sprite = { x: at.x, y: at.y - 16, visible, alpha: visible ? 1 : 0, displayWidth: 32, displayHeight: 64, setAlpha(a) { this.alpha = a; } };
            sprite.body = { enable: visible, center: { x: at.x, y: at.y }, reset(x, y) { sprite.x = x; sprite.y = y; this.center = { x, y: y + 16 }; } };
            const b = {
                npcId: id, sprite, roomId: 'hall', homeRoomId: 'hall', homePosition: { x: at.x, y: at.y },
                moves: [], cancels: 0,
                npcBodyPos() { return { x: sprite.body.center.x, y: sprite.body.center.y }; },
                goToAndStay(x, y, speed, opts) { this.moves.push({ x, y, speed, opts }); },
                cancelMove() { this.cancels++; },
                arrive(at2) { const m = this.moves.at(-1); if (at2) sprite.body.reset(at2.x, at2.y - 16); m.opts.onArrive?.(this.npcBodyPos()); if (!m.opts.silentArrival) emits.push({ name: `npc_arrived:${id}`, data: { owner: m.opts.owner, ...(m.opts.arrivalData || {}) } }); }
            };
            manager.behaviors.set(id, b);
            return b;
        }
    };
    installNpcWalk(manager, env);
    return w;
}
