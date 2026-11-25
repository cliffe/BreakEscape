// t06_delphine_sofa: Delphine Arvanitis's forced rest trip, followed by the camera. triggerNeed(rest, 5) at take start: she leaves her post (needsHome tile (4.5,4.5) = about (144,144)) for the sofa (kit_sofa, unplaced in the scenario, so its position is only known at run time), sits 8 s, walks back.
// The trip must be at least 120 px from her post. The camera follows out and back, then glides to the player. Never clicks in the room, never opens the kiosk.
// Post: the settled start point (read at take start). Her needsHome is tile (4.5,4.5), the same spot kit_ca18_out sends her back to; she should settle there again. Natural trip: rest decays 20/min from 60, so about 30 s after load.
// NOT YET DRY-RUN (written 25 Nov, B4 survey; nothing run). The trip length is an estimate from scenario tiles: trip-distance is marked and the take throws under the minimum.
// Entry state: fresh game, --set kit_quiet=true; kit_ca18_out must NOT be set (Look up never pressed: it suspends her needs).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca18 t06_delphine_sofa "--set kit_quiet=true" "--hide-hud --zoom-step 1"
// Marks: player-sprite, npc-start, post-set, follow-on, need-set, walk-start, arrive, trip-distance, return-start, back, follow-off, cam-summary, npc-end, end.
import { sleep, prepare, checkSprite } from './_ca18.mjs';
import { followNpc, followPlayer, camState, triggerNeed, waitNpcMoved, npcPos } from '../lib/camlib.mjs';

const NPC = 'kit_delphine_arvanitis';
const NEED = 'rest';
const MIN_TRIP_PX = 120;
const HOME_GUESS = { x: 144, y: 144 }; // the scenario's needsHome tile in px (tile * 32); the settled start must be near it, or she is already mid-trip
let POST = { x: 0, y: 0 }; // set from her settled start point in the default export

const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
const near = (p, q, r = 24) => dist(p, q) <= r;

/** Resolves the NPC's position once it has stood still for stableMs, or null after timeoutMs. */
async function settle(page, npcId, timeoutMs, stableMs = 1000) {
  let last = await npcPos(page, npcId); let since = Date.now(); const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    await sleep(150);
    const p = await npcPos(page, npcId);
    if (!p || !last) return null;
    if (Math.hypot(p.x - last.x, p.y - last.y) >= 2) { last = p; since = Date.now(); }
    else if (Date.now() - since >= stableMs) return p;
  }
  return null;
}

/** Samples the camera every 250 ms in the background (the same loop as camlib's sampleCam) until stop(). */
function startSampler(page) {
  const cams = []; let live = true;
  const done = (async () => { while (live) { const c = await camState(page).catch(() => null); if (c) cams.push(c); await sleep(250); } })();
  return { cams, stop: async () => { live = false; await done; } };
}

/** Scroll while the camera followed this NPC: first, last and the range it covered. */
function camSummary(cams, npcId) {
  const f = cams.filter(c => c.following === npcId);
  if (!f.length) return { followed: 0 };
  const xs = f.map(c => c.scrollX), ys = f.map(c => c.scrollY);
  return { followed: f.length, startX: f[0].scrollX, startY: f[0].scrollY, endX: f[f.length - 1].scrollX, endY: f[f.length - 1].scrollY, rangeX: Math.round(Math.max(...xs) - Math.min(...xs)), rangeY: Math.round(Math.max(...ys) - Math.min(...ys)) };
}

/** Camera back on the player, then the sampler closes. */
async function finish(page, mark, smp) {
  await sleep(800);
  mark('follow-off', { cam: await camState(page) });
  await followPlayer(page, { lerp: 0.08, glideMs: 900 });
  const c = await camState(page);
  await sleep(300);
  await smp.stop();
  mark('cam-summary', { ...camSummary(smp.cams, NPC), endX: c.scrollX, endY: c.scrollY, following: c.following });
  mark('npc-end', await npcPos(page, NPC));
  if (c.following !== 'player' || c.target) throw new Error('camera is not back on the player: ' + JSON.stringify(c));
  mark('end');
}

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_quiet !== true) throw new Error('entry state wrong: kit_quiet is not true; seed it with --set kit_quiet=true (keeps the take free of chatter)');
  if (g.kit_ca18_out === true) throw new Error('entry state wrong: kit_ca18_out is set (Look up was pressed); retake on a fresh game');
}

export default async (page, bridge, mark) => {
  await checkSprite(page, mark);
  const p0 = await npcPos(page, NPC);
  mark('npc-start', p0);
  const settled = await settle(page, NPC, 8000);
  if (!settled) throw new Error(`Delphine Arvanitis did not settle at take start: ${JSON.stringify(p0)} (already on a trip? retake on a fresh game)`);
  if (dist(settled, HOME_GUESS) > 48) throw new Error(`Delphine Arvanitis settled at ${JSON.stringify(settled)}, not near her home ${JSON.stringify(HOME_GUESS)}: probably mid-trip; retake on a fresh game`);
  POST = { x: settled.x, y: settled.y };
  mark('post-set', POST);
  const smp = startSampler(page);
  try {
    mark('follow-on'); await followNpc(page, NPC, { lerp: 0.08 });
    await triggerNeed(page, NPC, NEED, 5); mark('need-set', { need: NEED, level: 5 });
    if (!(await waitNpcMoved(page, NPC, 24, 30000))) throw new Error(`Delphine Arvanitis never left her post (${POST.x},${POST.y}) within 30 s of the ${NEED} trigger`);
    mark('walk-start', await npcPos(page, NPC));
    const arr = await settle(page, NPC, 30000);
    if (!arr) throw new Error('Delphine Arvanitis did not stop at the sofa within 30 s');
    mark('arrive', arr);
    const trip = Math.round(dist(arr, POST));
    mark('trip-distance', { px: trip, min: MIN_TRIP_PX });
    if (trip < MIN_TRIP_PX) throw new Error(`Delphine Arvanitis's trip is only ${trip} px from her post; the take needs at least ${MIN_TRIP_PX} px`);
    if (!(await waitNpcMoved(page, NPC, 24, 45000))) throw new Error('Delphine Arvanitis did not walk back from the sofa within 45 s of arriving');
    mark('return-start', await npcPos(page, NPC));
    // settle() also resolves on a pause partway back (dry run: a 1 s stop at (165,134), 30 px short of her post), so wait until she is at the post, then settle there.
    let back = null; const backAt = Date.now() + 30000;
    while (Date.now() < backAt) {
      const p = await npcPos(page, NPC);
      if (p && near(p, POST)) { back = (await settle(page, NPC, 5000)) || p; break; }
      await sleep(150);
    }
    if (!back || !near(back, POST)) throw new Error(`Delphine Arvanitis did not get back to her post: ${JSON.stringify(await npcPos(page, NPC))}`);
    mark('back', back);
    await finish(page, mark, smp);
  } finally {
    await smp.stop();
  }
};
