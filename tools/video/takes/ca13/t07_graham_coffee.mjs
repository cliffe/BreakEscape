// t07_graham_coffee: Graham Whitfield's forced coffee trip, followed by the camera. triggerNeed(caffeine, 5) at take start: he leaves his settled post
// for the coffee station (about (244,209) px, the station Agnieszka walked to). The trip must be at least 120 px from his post. The camera follows him out and back,
// then glides to the player. No kiosk is opened and nothing is clicked.
// Post: his settled start point (read at take start, as in ca10 t09). The scenario's needsHome is his PC, so he should settle back on the same spot.
// Entry state: the step-away seed with kit_quiet=true (kit_ca13_out must NOT be set, Look up never pressed).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca13_ai_assistant t07_graham_coffee \
//     "--set episode_e13_ai_assistant_state={\"done\":[\"brief\",\"write\",\"flip\",\"defend\"]} --set episode_e13_ai_assistant_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e13_ai_assistant_defend_percent=60 --set kit_quiet=true" \
//     "--hide-hud --zoom-step 1"
// Marks: player-sprite, aside-start, aside-end (player x/y, movedPx, durS; walk-start must stay near 2.87 s), frame:aside, npc-start, post-set, follow-on, need-set, walk-start (left-post), arrive (at-station), trip-distance, return-start, back, follow-off, cam-summary, npc-end, end.
import { sleep, prepare, checkSprite } from './_ca13.mjs';
import { keyLegs } from '../lib/walklib.mjs';
import { SPEED } from '../ca01/_ca01.mjs';
import { followNpc, followPlayer, camState, triggerNeed, waitNpcMoved, npcPos } from '../lib/camlib.mjs';

const NPC = 'kit_graham_whitfield';
const MIN_TRIP_PX = 120;
/** Retake 26 Nov (owner: "3 characters standing too close together, have the player stand aside"). The player spawns at (6.6, 3.6) tiles, right beside Gwen and Agnieszka, and the 9:16 crop
 *  (zoom 1.125) shows that corner at the edit's 2.95 s in-point. The camera is on Graham, so the player can walk without moving the frame. Straight down would cross Graham's route to the
 *  coffee station (his post (100,187) to (240,214) px), so the player goes down 44 px (clears the kiosk) then right 32 px: about (7.6, 5.0) tiles, about 2 tiles from the pair, 1.5+ tiles above
 *  his line. The walk (about 0.6 s) starts right after the caffeine trigger and overlaps Graham's 1.4 s start-up, so walk-start stays near 2.87 s and the edit's 2.95 in-point is unchanged. */
const ASIDE_DOWN_PX = 44, ASIDE_RIGHT_PX = 32;
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
  if (g.kit_defend_done !== true) throw new Error('entry state wrong: kit_defend_done is not true');
  if (g.kit_quiet !== true) throw new Error('entry state wrong: kit_quiet is not true; seed it with --set kit_quiet=true');
  if (g.kit_ca13_out === true) throw new Error('entry state wrong: kit_ca13_out is set (Look up was pressed); retake on a fresh game');
}

export default async (page, bridge, mark) => {
  await checkSprite(page, mark);
  const p0 = await npcPos(page, NPC);
  mark('npc-start', p0);
  const settled = await settle(page, NPC, 8000);
  if (!settled) throw new Error(`Graham did not settle at take start: ${JSON.stringify(p0)}`);
  POST = { x: settled.x, y: settled.y };
  mark('post-set', POST);
  const smp = startSampler(page);
  try {
    mark('follow-on'); await followNpc(page, NPC, { lerp: 0.08 });
    await triggerNeed(page, NPC, 'caffeine', 5); mark('need-set', { need: 'caffeine', level: 5 });
    const p0 = (await bridge.getState()).player; mark('aside-start', { x: Math.round(p0.x), y: Math.round(p0.y) });
    const tA = Date.now();
    await keyLegs(bridge, [['down', p0.y + ASIDE_DOWN_PX], ['right', p0.x + ASIDE_RIGHT_PX]], SPEED, mark);
    const p1 = (await bridge.getState()).player;
    mark('aside-end', { x: Math.round(p1.x), y: Math.round(p1.y), movedPx: Math.round(dist(p0, p1)), durS: (Date.now() - tA) / 1000, cam: await camState(page) });
    mark('frame:aside');
    if (dist(p0, p1) < 40) throw new Error('player did not walk aside (moved < 40 px)');
    if (!(await waitNpcMoved(page, NPC, 24, 30000))) throw new Error(`Graham never left his post (${POST.x},${POST.y}) within 30 s of the caffeine trigger`);
    mark('walk-start', await npcPos(page, NPC));
    const arr = await settle(page, NPC, 30000);
    if (!arr) throw new Error('Graham did not stop at the coffee station within 30 s');
    mark('arrive', arr);
    const trip = Math.round(dist(arr, POST));
    mark('trip-distance', { px: trip, min: MIN_TRIP_PX });
    if (trip < MIN_TRIP_PX) throw new Error(`Graham's trip is only ${trip} px from his post; the take needs at least ${MIN_TRIP_PX} px`);
    if (!(await waitNpcMoved(page, NPC, 24, 45000))) throw new Error('Graham did not walk back from the station within 45 s of arriving');
    mark('return-start', await npcPos(page, NPC));
    const back = await settle(page, NPC, 30000);
    if (!back || !near(back, POST)) throw new Error(`Graham did not get back to his post: ${JSON.stringify(back)}`);
    mark('back', back);
    await finish(page, mark, smp);
  } finally {
    await smp.stop();
  }
};
