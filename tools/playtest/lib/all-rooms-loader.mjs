// Shared loader for the seat box slice 0 tools (grid-hash.mjs, stand-audit.mjs, room-snapshot.mjs
// --walk). Opens one game on the keyless server with every room loaded, the way room-snapshot.mjs
// does (seeded Math.random, rooms loaded in scenario order with the loop asleep), plus:
//   - NPC behaviour updates stubbed from boot (window.npcBehaviorManager.update is a no-op), so no
//     NPC walks, sits, slides a chair or opens a gate while bodies settle (SEAT_BOX_PLAN R3 m4);
//   - the tutorial prompt declined and the resume overlay skipped (?skip_resume=1);
//   - optional test switches window.__deskBoxes and window.__seatBox (slices 1 and 2 read them).
// The game row must have every room unlocked (tools/playtest/unlock-all-rooms.rb), or loadRoom
// gets a 403 for a locked room.

export const POLL = { timeout: 60000 };

/** Add the init scripts. opts: { stubNpc = true, deskBoxes, seatBox } */
export async function prepare(page, opts = {}) {
  const { stubNpc = true, deskBoxes, seatBox } = opts;
  await page.addInitScript(({ stubNpc, deskBoxes, seatBox }) => {
    const seedOf = s => { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return h >>> 0; };
    let a = seedOf('boot');
    Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    window.__reseed = s => { a = seedOf(s); };
    try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) { /* storage blocked */ }
    if (deskBoxes !== undefined && deskBoxes !== null) window.__deskBoxes = deskBoxes;
    if (seatBox !== undefined && seatBox !== null) window.__seatBox = seatBox;
    if (stubNpc) {
      // Stub update on whatever object game.js assigns, from the first frame (game.js calls
      // window.npcBehaviorManager.update every frame).
      let held = null;
      window.__npcUpdateStubbed = 0;
      Object.defineProperty(window, 'npcBehaviorManager', {
        configurable: true,
        get() { return held; },
        set(v) {
          held = v;
          if (v && typeof v.update === 'function') { v.__realUpdate = v.update; v.update = () => { window.__npcUpdateStubbed++; }; }
        }
      });
    }
  }, { stubNpc, deskBoxes: deskBoxes ?? null, seatBox: seatBox ?? null });
}

/**
 * Open game `gid` and load every scenario room. Returns { loaded, failed, minigame }.
 * Every swivel chair's placed position is kept in window.__swivelHomes (objectId -> { roomId,
 * x, y, rect: [l, t, r, b] of its body from the sprite and offset }), taken while the loop is
 * asleep just after its room loads, before anyone can sit on it or push it (R3 m5).
 */
export async function loadAllRooms(page, { gid, port = '3001', scen = String(gid) }) {
  await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.gameScenario && window.rooms && window.loadRoom && window.roomPositions
    && window.pathfindingManager && Object.keys(window.rooms).length > 0, null, POLL);
  await page.waitForTimeout(1500);
  return page.evaluate(async (scen) => {
    const game = window.game;
    const ids = Object.keys(window.gameScenario.rooms);
    const loaded = [], failed = [];
    window.__swivelHomes = window.__swivelHomes || {};
    const keepSwivels = (roomId) => {
      const room = window.rooms[roomId];
      for (const [key, s] of Object.entries(room?.objects || {})) {
        if (!s?.isSwivelChair || window.__swivelHomes[s.objectId || key]) continue;
        const b = s.body;
        const l = b ? s.x + (b.offset.x - s.displayOriginX) * s.scaleX : s.x;
        const t = b ? s.y + (b.offset.y - s.displayOriginY) * s.scaleY : s.y;
        window.__swivelHomes[s.objectId || key] = { roomId, key, texture: s.texture?.key, x: s.x, y: s.y,
          rect: b ? [l, t, l + b.width, t + b.height] : null };
      }
    };
    // The start room loaded with the page, so the loop has been running; record it first.
    for (const id of Object.keys(window.rooms)) keepSwivels(id);
    for (const id of ids) {
      if (!window.rooms[id]) {
        try { game.loop.sleep(); } catch (e) {}
        window.__reseed(`${scen}|${id}`);
        const p = window.loadRoom(id).catch(() => {});
        const woke = setTimeout(() => { try { game.loop.wake(); } catch (e) {} }, 4000);
        await p; clearTimeout(woke);
        keepSwivels(id);
        try { game.loop.wake(); } catch (e) {}
      }
      (window.rooms[id] ? loaded : failed).push(id);
    }
    let minigame = null;
    try { minigame = window.__test?.getState?.()?.activeMinigame?.id || null; } catch (e) {}
    return { loaded, failed, minigame };
  }, scen);
}

/** Wake the loop and wait until the main scene's clock has run `ms` of game time past now. */
export async function settle(page, ms = 300) {
  await page.evaluate(async (ms) => {
    const game = window.game;
    try { game.loop.wake(); } catch (e) {}
    const scene = window.pathfindingManager?.scene || game.scene.scenes[0];
    const t0 = scene.time.now;
    const deadline = Date.now() + 20000;
    while (scene.time.now < t0 + ms && Date.now() < deadline) await new Promise(r => setTimeout(r, 50));
  }, ms);
}

/** Every gated door's state: [{ key, roomId, connectedRoom, open }]. */
export async function gateStates(page) {
  return page.evaluate(() => [...(window.doorGates?.groups?.values?.() || [])]
    .map(g => ({ key: g.key, roomId: g.roomId, connectedRoom: g.connectedRoom, open: !!g.open })));
}

/** Short commit hash of the working tree (for noting when a baseline was taken). */
export async function headCommit() {
  const { execSync } = await import('node:child_process');
  try { return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch (e) { return 'unknown'; }
}
