// t08_yusuf_cooler: Yusuf Demir's forced water trip, followed by the camera. triggerNeed(thirst, 5) at take start: he leaves his post (needsHome tile (3,7) = about (96,224)) for the water cooler (kit_cooler tile (8.2,5.6) = about (262,179); use point about 1.25 tiles below it), uses it 20 s, walks back.
// The trip must be at least 120 px from his post. The camera follows out and back, then glides to the player. Never clicks in the room, never opens the kiosk.
// Post: the settled start point (read at take start). His needsHome is tile (3,7). Natural trip: thirst decays 30/min from 65, so about 30 s after load (t01 notes it); forced here so the timing is fixed.
// NOT YET DRY-RUN (written 25 Nov, B4 survey; nothing run). The trip length is an estimate from scenario tiles: trip-distance is marked and the take throws under the minimum.
// Entry state: fresh game, no flags needed (--set kit_defend_done=true is harmless and matches t01); kit_ca11_out must NOT be set (Look up sets it, then his mapping suspends needs and walks him to the copier tray).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca11 t08_yusuf_cooler "--set kit_defend_done=true" "--hide-hud --zoom-step 1"
// Marks: player-sprite, npc-start, post-set, follow-on, need-set, walk-start, arrive, trip-distance, return-start, back, follow-off, cam-summary, npc-end, end.
import { sleep, prepare, spriteCheck } from './_ca11.mjs';
import { followNpc, followPlayer, camState, triggerNeed, waitNpcMoved, npcPos } from '../lib/camlib.mjs';

const NPC = 'kit_yusuf_demir';
const NEED = 'thirst';
const MIN_TRIP_PX = 120;
const HOME_GUESS = { x: 96, y: 224 }; // the scenario's needsHome tile in px (tile * 32); the settled start must be near it, or he is already mid-trip
let POST = { x: 0, y: 0 }; // set from his settled start point in the default export

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
  if (g.kit_ca11_out === true) throw new Error('entry state wrong: kit_ca11_out is set (Look up was pressed); retake on a fresh game');
}

export default async (page, bridge, mark) => {
  await spriteCheck(page, mark);
  const p0 = await npcPos(page, NPC);
  mark('npc-start', p0);
  const settled = await settle(page, NPC, 8000);
  if (!settled) throw new Error(`Yusuf Demir did not settle at take start: ${JSON.stringify(p0)} (already on a trip? retake on a fresh game)`);
  if (dist(settled, HOME_GUESS) > 48) throw new Error(`Yusuf Demir settled at ${JSON.stringify(settled)}, not near his home ${JSON.stringify(HOME_GUESS)}: probably mid-trip; retake on a fresh game`);
  POST = { x: settled.x, y: settled.y };
  mark('post-set', POST);
  const smp = startSampler(page);
  try {
    mark('follow-on'); await followNpc(page, NPC, { lerp: 0.08 });
    await triggerNeed(page, NPC, NEED, 5); mark('need-set', { need: NEED, level: 5 });
    if (!(await waitNpcMoved(page, NPC, 24, 30000))) throw new Error(`Yusuf Demir never left his post (${POST.x},${POST.y}) within 30 s of the ${NEED} trigger`);
    mark('walk-start', await npcPos(page, NPC));
    const arr = await settle(page, NPC, 30000);
    if (!arr) throw new Error('Yusuf Demir did not stop at the water cooler within 30 s');
    mark('arrive', arr);
    const trip = Math.round(dist(arr, POST));
    mark('trip-distance', { px: trip, min: MIN_TRIP_PX });
    if (trip < MIN_TRIP_PX) throw new Error(`Yusuf Demir's trip is only ${trip} px from his post; the take needs at least ${MIN_TRIP_PX} px`);
    if (!(await waitNpcMoved(page, NPC, 24, 45000))) throw new Error('Yusuf Demir did not walk back from the water cooler within 45 s of arriving');
    mark('return-start', await npcPos(page, NPC));
    const back = await settle(page, NPC, 30000);
    if (!back || !near(back, POST)) throw new Error(`Yusuf Demir did not get back to his post: ${JSON.stringify(back)}`);
    mark('back', back);
    await finish(page, mark, smp);
  } finally {
    await smp.stop();
  }
};
