// Fixture world for the world-grid builder tests (seat box plan, slice 0).
// A 320 x 256 px world at (0, 0): a top wall strip and an east wall strip (dynamic, immovable),
// a static desk, a disabled static body and a movable dynamic body (both ignored by the grid),
// one opened east side door and one opened north door. `excludable` is a static chair-like body
// whose game object the exclude tests leave out.
export function fixtureScene() {
  const go = name => ({ name });
  const body = (left, top, w, h, extra = {}) => ({
    left, top, right: left + w, bottom: top + h, enable: true, immovable: false, ...extra,
  });
  const desk = body(64, 100, 64, 16, { gameObject: go('desk') });
  const chair = body(170, 150, 18, 8, { gameObject: go('chair') });
  const sitter = body(171, 140, 18, 10, { immovable: true, gameObject: go('sitter') });
  const staticBodies = [
    desk,
    chair,
    body(200, 40, 30, 30, { enable: false, gameObject: go('disabled') }),
  ];
  const bodies = [
    body(0, 0, 320, 32, { immovable: true, gameObject: go('wallTop') }),
    body(288, 0, 32, 256, { immovable: true, gameObject: go('wallEast') }),
    body(150, 200, 20, 10, { immovable: false, gameObject: go('crate') }),
    sitter,
  ];
  const iter = list => ({ iterate(fn) { list.forEach(fn); } });
  const scene = {
    time: { delayedCall() {} },
    physics: { world: { bounds: { x: 0, y: 0, width: 320, height: 256 },
      staticBodies: iter(staticBodies), bodies: iter(bodies) } },
  };
  return { scene, objects: { desk: desk.gameObject, chair: chair.gameObject, sitter: sitter.gameObject } };
}

// Opened doors, as markSideDoorCorridor / markDoorWalkable record them.
export function openDoors(pm) {
  pm.openSideDoorCorridors.push({ worldX: 304, worldY: 128, direction: 'east' });
  pm.openNSDoors.push({ worldX: 128, worldY: 8 });
}

// Minimal EasyStar stand-in: records the grid it was given.
export function installEasyStar() {
  globalThis.EasyStar = { js: class {
    setGrid(g) { this.grid = g; }
    setAcceptableTiles() {}
    enableDiagonals() {}
    disableCornerCutting() {}
  } };
}

export const rowsOf = grid => grid.map(r => r.join(''));
