// Camera helpers for the movement shots: follow an NPC (or anything with x/y), stop, and hand the camera back to the player.
// Everything runs in the page through Phaser's main camera (core/game.js calls cameras.main.startFollow(player) at start-up, lerp 1).
// Nothing here moves a sprite or sets a game global: it only changes what the camera looks at, so a take can start on a walking NPC
// before the player's action and cut back to the player afterwards. `page` is the Playwright page the take gets.
//
// followNpc(page, npcId, { lerp, offsetX, offsetY, roundPixels })  camera tracks the NPC's sprite. lerp 1 = locked on, 0.05 to 0.12 = a soft chase
//   (the usual look for a walk shot); offsetX/offsetY = where the NPC sits relative to the screen centre in world px (positive = right / below)
// followPoint(page, x, y, { lerp })                                  camera glides to a world point (a door, the vending machine)
// stopFollow(page)                                                   the camera stays where it is
// followPlayer(page, { lerp, glideMs })                              back to the player; glides at `lerp` for glideMs, then locks (lerp 1) as the game does
// camState(page)                                                     { scrollX, scrollY, zoom, w, h, following, target: {id, x, y} | null, player: {x, y} }
// sampleCam(page, ms, everyMs)                                       samples camState while something moves; returns the array (for marks and proofs)
// npcPos(page, npcId)                                                { x, y, room, visible } of the NPC's sprite, or null (not loaded or not found)
// triggerNeed(page, npcId, need, level)                              sets a need level through the bridge (the same path as an eventMapping needs.set), so a
//                                                                    thirsty NPC walks to the machine now, not in minutes. `level` below urgentAt starts the trip
// waitNpcMoved(page, npcId, minPx, timeoutMs)                        resolves true once the sprite is minPx away from where it was when called
import { sleep } from './lib.mjs';

/** Evaluated in the page. Resolves the scene (window.game is a Scene after create(), a Phaser.Game before) and an NPC sprite by id. */
const PAGE_HELPERS = `
  const scene = (() => { const g = window.game; if (!g) return null; if (g.cameras && g.cameras.main) return g; const l = g.scene && g.scene.scenes; return l && l.length ? l[0] : null; })();
  const findNpc = (id) => {
    const rooms = window.rooms || {};
    for (const rid of Object.keys(rooms)) {
      const list = rooms[rid] && rooms[rid].npcSprites;
      if (!list) continue;
      for (const s of list) if (s && s.active && s.npcId === id) return { sprite: s, room: rid };
    }
    const n = window.npcManager && window.npcManager.npcs && window.npcManager.npcs.get(id);
    const s = n && (n._sprite || n.sprite);
    return s ? { sprite: s, room: n.roomId || null } : null;
  };
`;

const run = (page, body, arg) => page.evaluate(new Function('arg', PAGE_HELPERS + body), arg);

export async function followNpc(page, npcId, { lerp = 0.08, offsetX = 0, offsetY = 0, roundPixels = true } = {}) {
  return run(page, `
    if (!scene) return { ok: false, reason: 'no-scene' };
    const f = findNpc(arg.npcId);
    if (!f) return { ok: false, reason: 'npc-not-found:' + arg.npcId };
    scene.cameras.main.startFollow(f.sprite, arg.roundPixels, arg.lerp, arg.lerp, arg.offsetX, arg.offsetY);
    window.__camFollowId = arg.npcId;
    return { ok: true, npcId: arg.npcId, room: f.room, x: Math.round(f.sprite.x), y: Math.round(f.sprite.y) };
  `, { npcId, lerp, offsetX, offsetY, roundPixels });
}

export async function followPoint(page, x, y, { lerp = 0.08 } = {}) {
  return run(page, `
    if (!scene) return { ok: false, reason: 'no-scene' };
    const cam = scene.cameras.main;
    // a one-off invisible anchor the camera can follow; moved by tween-free lerp so the glide is the camera's own
    let a = window.__camAnchor;
    if (!a) { a = scene.add.zone(arg.x, arg.y, 1, 1); window.__camAnchor = a; }
    a.setPosition(arg.x, arg.y);
    cam.startFollow(a, true, arg.lerp, arg.lerp);
    window.__camFollowId = '(point)';
    return { ok: true, x: arg.x, y: arg.y };
  `, { x, y, lerp });
}

export async function stopFollow(page) {
  return run(page, `
    if (!scene) return { ok: false, reason: 'no-scene' };
    const cam = scene.cameras.main; cam.stopFollow(); window.__camFollowId = null;
    return { ok: true, scrollX: Math.round(cam.scrollX), scrollY: Math.round(cam.scrollY) };
  `);
}

export async function followPlayer(page, { lerp = 0.08, glideMs = 900 } = {}) {
  const r = await run(page, `
    if (!scene || !window.player) return { ok: false, reason: 'no-scene-or-player' };
    scene.cameras.main.startFollow(window.player, true, arg.lerp, arg.lerp);
    window.__camFollowId = 'player';
    return { ok: true };
  `, { lerp });
  if (!r.ok) return r;
  await sleep(glideMs);
  // game.js follows the player with lerp 1 (locked on): restore that once the glide is done
  return run(page, `
    const cam = scene.cameras.main; cam.setLerp(1, 1);
    return { ok: true, scrollX: Math.round(cam.scrollX), scrollY: Math.round(cam.scrollY) };
  `);
}

export async function camState(page) {
  return run(page, `
    if (!scene) return null;
    const cam = scene.cameras.main, p = window.player, id = window.__camFollowId || null;
    const f = id && id !== 'player' && id !== '(point)' ? findNpc(id) : null;
    return {
      scrollX: Math.round(cam.scrollX * 10) / 10, scrollY: Math.round(cam.scrollY * 10) / 10, zoom: cam.zoom, w: cam.width, h: cam.height,
      following: id, target: f ? { id, x: Math.round(f.sprite.x), y: Math.round(f.sprite.y) } : null,
      player: p ? { x: Math.round(p.x), y: Math.round(p.y) } : null, t: Date.now(),
    };
  `);
}

export async function sampleCam(page, ms = 4000, everyMs = 250) {
  const out = []; const t0 = Date.now();
  while (Date.now() - t0 < ms) { out.push(await camState(page)); await sleep(everyMs); }
  return out;
}

export async function npcPos(page, npcId) {
  return run(page, `
    const f = findNpc(arg);
    return f ? { x: Math.round(f.sprite.x), y: Math.round(f.sprite.y), room: f.room, visible: !!f.sprite.visible } : null;
  `, npcId);
}

export async function triggerNeed(page, npcId, need, level = 10) {
  return page.evaluate(({ npcId, need, level }) => window.__test.needs.set(npcId, need, level), { npcId, need, level });
}

export async function waitNpcMoved(page, npcId, minPx = 24, timeoutMs = 30000) {
  const p0 = await npcPos(page, npcId); if (!p0) return false;
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const p = await npcPos(page, npcId);
    if (p && Math.hypot(p.x - p0.x, p.y - p0.y) >= minPx) return true;
    await sleep(150);
  }
  return false;
}
