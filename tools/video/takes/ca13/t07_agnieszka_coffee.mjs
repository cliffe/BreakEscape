// t07_agnieszka_coffee: Agnieszka's forced coffee trip, followed by the camera. triggerNeed(caffeine, 5) at take start: she leaves her post (192,97) for the station (244,209)
// (proved headless in ca13 game 13362: she walks within about 1.5 s, the trip took about 2 s of game time), stays a while, then walks back. The camera follows her out and back,
// then glides to the player. No kiosk is opened and nothing is clicked.
// Entry state: the step-away seed with kit_quiet=true (kit_ca13_out must NOT be set, Look up never pressed).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca13_ai_assistant t07_agnieszka_coffee \
//     "--set episode_e13_ai_assistant_state={\"done\":[\"brief\",\"write\",\"flip\",\"defend\"]} --set episode_e13_ai_assistant_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e13_ai_assistant_defend_percent=60 --set kit_quiet=true" \
//     "--hide-hud --zoom-step 1"
// Marks: player-sprite, npc-start, follow-on, need-set, walk-start (left-post), arrive (at-station), return-start, back, follow-off, cam-summary, npc-end, end.
import { sleep, prepare, checkSprite } from './_ca13.mjs';
import { followNpc, followPlayer, camState, triggerNeed, waitNpcMoved, npcPos } from '../lib/camlib.mjs';

const NPC = 'kit_agnieszka_duda';
const POST = { x: 192, y: 97 };

const near = (p, q, r = 24) => Math.hypot(p.x - q.x, p.y - q.y) <= r;

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
  if (!p0 || !near(p0, POST)) throw new Error(`Agnieszka is not on her post at take start: ${JSON.stringify(p0)}`);
  const smp = startSampler(page);
  try {
    mark('follow-on'); await followNpc(page, NPC, { lerp: 0.08 });
    await triggerNeed(page, NPC, 'caffeine', 5); mark('need-set', { need: 'caffeine', level: 5 });
    if (!(await waitNpcMoved(page, NPC, 24, 30000))) throw new Error(`Agnieszka never left her post (${POST.x},${POST.y}) within 30 s of the caffeine trigger`);
    mark('walk-start', await npcPos(page, NPC));
    const arr = await settle(page, NPC, 30000);
    if (!arr) throw new Error('Agnieszka did not stop at the coffee station within 30 s');
    mark('arrive', arr);
    if (!(await waitNpcMoved(page, NPC, 24, 45000))) throw new Error('Agnieszka did not walk back from the station within 45 s of arriving');
    mark('return-start', await npcPos(page, NPC));
    const back = await settle(page, NPC, 30000);
    if (!back || !near(back, POST)) throw new Error(`Agnieszka did not get back to her post: ${JSON.stringify(back)}`);
    mark('back', back);
    await finish(page, mark, smp);
  } finally {
    await smp.stop();
  }
};
