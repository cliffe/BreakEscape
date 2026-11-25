// t09_darren_cooler: Darren Price's forced water-cooler trip, followed by the camera. Replaces t09_anjali_cooler: Anjali's post settles at (245,233),
// about 30 px from the cooler's use point, so her drink trip is a step. Darren (needsHome kit_ca10_pc, thirst) starts about 170 px away.
// triggerNeed(thirst, 5) at take start: he leaves his post for the water cooler (tile 8.2,5.6, px (262,179); use point about (262,219), dy +1.25),
// drinks for about 20 s and walks back. The camera follows him out and back, then glides to the player. No kiosk is opened and nothing is clicked.
// Arrival is only accepted within 48 px of the use point (a mid-route pause of about 1 s once read as arrival in ca06 t10); the post is his settled start point.
// Entry state: the step-away flags; kit_ca10_out must NOT be set (Look up never pressed; after Look up Darren is in the D1 scene).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca10_downloads_and_fake_checks t09_darren_cooler \
//     "--set episode_e10_downloads_and_fake_checks_state={\"done\":[\"brief\",\"osint\",\"build\",\"write\",\"flip\",\"defend\"]} --set episode_e10_downloads_and_fake_checks_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e10_downloads_and_fake_checks_defend_percent=100" \
//     "--hide-hud --zoom-step 1"
// Marks: player-sprite, npc-start, post-set, follow-on, need-set, walk-start (left-post), arrive (at-cooler), trip-distance, return-start, back, follow-off, cam-summary, npc-end, end.
import { sleep, prepare, checkSprite } from './_ca10.mjs';
import { followNpc, followPlayer, camState, triggerNeed, waitNpcMoved, npcPos } from '../lib/camlib.mjs';

const NPC = 'kit_darren_price';
const USE = { x: 262, y: 219 };   // cooler (262,179) + useFrom dy 1.25 tiles
const ARRIVE_PX = 48;             // arrival must be this close to the use point
const MIN_TRIP_PX = 120;
let POST = { x: 0, y: 0 };        // set from his settled start point in the default export

const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
const near = (p, q, r = 24) => dist(p, q) <= r;

/** Keeps settling until the NPC stands still within r px of target, or null after timeoutMs (a pause mid-route does not count). */
async function settleNear(page, npcId, target, r, timeoutMs) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const p = await settle(page, npcId, Math.max(1500, end - Date.now()), 1000);
    if (!p) return null;
    if (near(p, target, r)) return p;
    await sleep(300);
  }
  return null;
}

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
  if (g.kit_ca10_out === true) throw new Error('entry state wrong: kit_ca10_out is set (Look up was pressed); retake on a fresh game');
}

export default async (page, bridge, mark) => {
  await checkSprite(page, mark);
  const p0 = await npcPos(page, NPC);
  mark('npc-start', p0);
  const settled = await settle(page, NPC, 8000);
  if (!settled) throw new Error(`Darren did not settle at take start: ${JSON.stringify(p0)}`);
  POST = { x: settled.x, y: settled.y };
  mark('post-set', POST);
  const smp = startSampler(page);
  try {
    mark('follow-on'); await followNpc(page, NPC, { lerp: 0.08 });
    await triggerNeed(page, NPC, 'thirst', 5); mark('need-set', { need: 'thirst', level: 5 });
    if (!(await waitNpcMoved(page, NPC, 24, 30000))) throw new Error(`Darren never left his post (${POST.x},${POST.y}) within 30 s of the thirst trigger`);
    mark('walk-start', await npcPos(page, NPC));
    const arr = await settleNear(page, NPC, USE, ARRIVE_PX, 40000);
    if (!arr) throw new Error(`Darren did not stop within ${ARRIVE_PX} px of the cooler use point (${USE.x},${USE.y}) within 40 s; last ${JSON.stringify(await npcPos(page, NPC))}`);
    mark('arrive', { ...arr, fromUse: Math.round(dist(arr, USE)) });
    const trip = Math.round(dist(arr, POST));
    mark('trip-distance', { px: trip, min: MIN_TRIP_PX });
    if (trip < MIN_TRIP_PX) throw new Error(`Darren's trip is only ${trip} px from his post; the take needs at least ${MIN_TRIP_PX} px`);
    if (!(await waitNpcMoved(page, NPC, 24, 45000))) throw new Error('Darren did not walk back from the cooler within 45 s of arriving');
    mark('return-start', await npcPos(page, NPC));
    const back = await settleNear(page, NPC, POST, 24, 40000);
    if (!back) throw new Error(`Darren did not get back to his post: ${JSON.stringify(back)}`);
    mark('back', back);
    await finish(page, mark, smp);
  } finally {
    await smp.stop();
  }
};
