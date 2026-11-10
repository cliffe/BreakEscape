// The walk record (SEAT_BOX_PLAN.md slice 0): per room, the bodies the world grid is built from
// (leaving out NPCs and swivel chairs), a walk grid built with the engine's own builder
// (pathfindingManager.buildWorldGrid({ exclude })), the key points and the swivel chairs' placed
// positions. `collectWalkRecord` runs in the page (page.evaluate serialises it, so it uses nothing
// from this module's scope); `env` lets the node tests run it on fakes.

export function collectWalkRecord(env = (typeof window !== 'undefined' ? window : globalThis)) {
  const W = env;
  const pm = W.pathfindingManager;
  const scene = pm.scene;
  const round = v => Math.round(v * 100) / 100;
  const roomRect = id => {
    const r = W.rooms[id]; const p = r.position || W.roomPositions?.[id] || { x: 0, y: 0 };
    return [p.x, p.y, p.x + (r.map?.widthInPixels || 0), p.y + (r.map?.heightInPixels || 0)];
  };
  const overlaps = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

  // What the walk grid and the body list leave out: NPC bodies (seated or immovable NPCs vary with
  // timing) and swivel chairs (moved by sitters), plus the player.
  const npcSprites = new Set();
  try { for (const n of W.npcManager?.npcs?.values?.() || []) if (n._sprite) npcSprites.add(n._sprite); } catch (e) {}
  for (const r of Object.values(W.rooms)) for (const s of Object.values(r.npcSprites || {})) if (s) npcSprites.add(s);
  const isNpc = go => !!go && (npcSprites.has(go) || !!go.npcId || !!go._isNPC);
  const isSwivel = go => !!go && !!go.isSwivelChair;
  const exclude = [];
  const allBodies = [];
  scene.physics.world.staticBodies.iterate(b => allBodies.push(b));
  scene.physics.world.bodies.iterate(b => allBodies.push(b));
  for (const b of allBodies) {
    const go = b.gameObject;
    if (go && (isNpc(go) || isSwivel(go) || go === W.player)) exclude.push(go);
  }
  const built = pm.buildWorldGrid({ exclude });
  const { grid, bounds } = built;

  // Owner room of a body: by the sprite's roomId or object map, else by position.
  const ownerOf = new Map();
  for (const [rid, r] of Object.entries(W.rooms)) for (const s of Object.values(r.objects || {})) if (s) ownerOf.set(s, rid);
  const idOf = (go, kind, rect, rid) => {
    if (go?.doorProperties) { const p = go.doorProperties; return `door:${p.roomId}->${p.connectedRoom}@${round(p.worldX)},${round(p.worldY)}`; }
    if (go?.objectId) return go.objectId;
    // Walls and other bodies with no object id: keyed by room and rectangle (R3 m5)
    return `${kind}:${rid}:${rect.map(Math.round).join(',')}`;
  };

  const ids = Object.keys(W.rooms);
  const out = {};
  for (const rid of ids) {
    const rr = roomRect(rid);
    const bodies = [];
    for (const b of allBodies) {
      if (!b.enable) continue;
      const isStatic = b.physicsType === 1; // Phaser.Physics.Arcade.STATIC_BODY
      if (!(isStatic || b.immovable)) continue;
      const go = b.gameObject;
      if (go && (isNpc(go) || isSwivel(go) || go === W.player)) continue;
      const rect = [b.left, b.top, b.right, b.bottom].map(round);
      const owner = (go && (go.roomId || ownerOf.get(go))) || null;
      if (owner ? owner !== rid : !overlaps(rect, rr)) continue;
      const kind = go?.doorProperties ? 'door' : (b.physicsType === 1 ? 'static' : 'immovable');
      const wall = !go || (!go.objectId && !go.doorProperties);
      // A desk: a static body of a room object (tables are the only room objects with static
      // bodies), the same rule as seating.js clearOfTables
      const desk = kind === 'static' && !!go && ownerOf.get(go) === rid;
      bodies.push({ id: idOf(go, wall ? 'wall' : kind, rect, rid), kind: wall ? 'wall' : kind, key: go?.texture?.key || null, rect, desk });
    }
    // Walk grid clipped to the room
    const cx0 = Math.max(0, Math.floor((rr[0] - bounds.minX) / bounds.step));
    const cy0 = Math.max(0, Math.floor((rr[1] - bounds.minY) / bounds.step));
    const cx1 = Math.min(bounds.cols, Math.ceil((rr[2] - bounds.minX) / bounds.step));
    const cy1 = Math.min(bounds.rows, Math.ceil((rr[3] - bounds.minY) / bounds.step));
    const rows = [];
    for (let cy = cy0; cy < cy1; cy++) rows.push(grid[cy].slice(cx0, cx1).join(''));

    // Key points
    const keys = [];
    const feetOf = s => { const b = s.body; if (!b) return { x: s.x, y: s.y };
      return { x: s.x + (b.offset.x - s.displayOriginX) * s.scaleX + b.width / 2, y: s.y + (b.offset.y - s.displayOriginY) * s.scaleY + b.height / 2 }; };
    const inRoom = p => p.x >= rr[0] && p.x < rr[2] && p.y >= rr[1] && p.y < rr[3];
    if (W.player && rid === (W.gameScenario?.startRoom)) { const f = feetOf(W.player); if (inRoom(f)) keys.push({ id: 'player_start', kind: 'player', x: round(f.x), y: round(f.y) }); }
    for (const s of scene.children.list) {
      const p = s.doorProperties;
      if (!p || p.roomId !== rid) continue;
      // The door's approach point: 24 px into the room from the door's position
      const d = { north: [0, 24], south: [0, -24], east: [-24, 0], west: [24, 0] }[p.direction] || [0, 0];
      const x = (p.worldX ?? s.x) + d[0], y = (p.worldY ?? s.y) + d[1];
      keys.push({ id: `door:${p.roomId}->${p.connectedRoom}`, kind: 'door', x: round(x), y: round(y), direction: p.direction });
    }
    const beh = W.npcBehaviorManager?.behaviors;
    for (const s of npcSprites) {
      const npcRoom = s.roomId || (s.npcId && W.npcManager?.getNPC?.(s.npcId)?.roomId);
      if (npcRoom !== rid) continue;
      const f = feetOf(s);
      keys.push({ id: `npc:${s.npcId}`, kind: 'npc', x: round(f.x), y: round(f.y) });
      const b = beh?.get?.(s.npcId);
      const pos = W.rooms[rid].position || { x: 0, y: 0 };
      const wps = b?.config?.patrol?.waypoints || [];
      wps.forEach((w, i) => {
        const x = w.worldX ?? (pos.x + w.x * 32), y = w.worldY ?? (pos.y + w.y * 32);
        keys.push({ id: `wp:${s.npcId}:${i}`, kind: 'waypoint', x: round(x), y: round(y) });
      });
      (b?.config?.patrol?.route || []).forEach((seg, si) => {
        const rp = W.rooms[seg.room]?.position; if (!rp || seg.room !== rid) return;
        (seg.waypoints || []).forEach((w, i) => keys.push({ id: `route:${s.npcId}:${si}:${i}`, kind: 'waypoint', x: round(rp.x + w.x * 32), y: round(rp.y + w.y * 32) }));
      });
    }
    const world = W.npcNeedsSystem?.world;
    if (world?.listObjects && world?.approachCell) {
      for (const o of world.listObjects()) {
        if (o.roomId !== rid) continue;
        const c = world.approachCell(o);
        if (c) keys.push({ id: `needs:${o.id}`, kind: 'needs', x: round(c.x), y: round(c.y) });
      }
    }
    // Interactables: the nearest walkable cell of the walk grid to each scenario object
    const near = (x, y, maxR) => {
      const gx = Math.floor((x - bounds.minX) / bounds.step), gy = Math.floor((y - bounds.minY) / bounds.step);
      for (let r = 0; r <= maxR; r++) {
        let best = null;
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const nx = gx + dx, ny = gy + dy;
          if (ny < 0 || nx < 0 || ny >= bounds.rows || nx >= bounds.cols || grid[ny][nx] !== 0) continue;
          const c = { x: bounds.minX + nx * bounds.step + bounds.step / 2, y: bounds.minY + ny * bounds.step + bounds.step / 2 };
          const d = Math.hypot(c.x - x, c.y - y);
          if (!best || d < best.d) best = { ...c, d };
        }
        if (best) return best;
      }
      return null;
    };
    for (const [k, s] of Object.entries(W.rooms[rid].objects || {})) {
      if (!s?.scenarioData || isSwivel(s) || isNpc(s)) continue;
      const cx = s.x + (s.displayWidth || 0) * (0.5 - (s.originX ?? 0)), cy = s.y + (s.displayHeight || 0) * (1 - (s.originY ?? 0));
      const c = near(cx, cy, 12);
      keys.push({ id: `obj:${s.objectId || k}`, kind: 'interactable', x: round(cx), y: round(cy), cell: c ? [c.x, c.y] : null, dist: c ? round(c.d) : null });
    }

    const swivels = Object.entries(W.__swivelHomes || {}).filter(([, h]) => h.roomId === rid)
      .map(([id, h]) => ({ id, texture: h.texture, x: h.x, y: h.y, rect: h.rect && h.rect.map(round) }));
    out[rid] = { rect: rr, mapProps: W.rooms[rid].deskBoxes || null, grid: { cx0, cy0, minX: bounds.minX, minY: bounds.minY, step: bounds.step, rows },
      bodies, keys, swivels };
  }
  const gates = [...(W.doorGates?.groups?.values?.() || [])].map(g => ({ key: g.key, roomId: g.roomId, connectedRoom: g.connectedRoom, open: !!g.open }));
  return { rooms: out, gates, excluded: exclude.length };
}
