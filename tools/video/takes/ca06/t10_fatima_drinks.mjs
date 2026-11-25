// t10_fatima_drinks: Fatima's thirst trip, followed by the camera. Automatic: she leaves her post (60,186) about 27.5 s after load for the drinks machine (about (240,197)),
// uses it, then walks back. The take waits for the natural trip (no triggerNeed), so the camera is on Fatima from before her departure until she is back at her post.
// Fatima is kit_fatima_begum (ca02's fatima_begum is a different id). Never clicks in the room.
// Entry state: fresh game, no flags. kit_ca06_out NOT set (Look up never pressed).
//   tools/video/takes/run-take.sh ca06_texts_and_qr t10_fatima_drinks "" "--hide-hud --zoom-step 1"
// Marks: player-sprite, npc-start, follow-on, walk-start (left-post), arrive (at-machine), return-start, back, follow-off, cam-summary, npc-end, end.
import { sleep, prepare, checkSprite } from './_ca06.mjs';
import { followNpc, followPlayer, camState, waitNpcMoved, npcPos } from '../lib/camlib.mjs';

const NPC = 'kit_fatima_begum';
const POST = { x: 60, y: 186 };

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
  await prepare(page, bridge); await sleep(300);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_ca06_out === true) throw new Error('entry state wrong: kit_ca06_out is set (Look up was pressed); retake on a fresh game');
}

export default async (page, bridge, mark) => {
  await checkSprite(page, mark);
  const p0 = await npcPos(page, NPC);
  mark('npc-start', p0);
  if (!p0 || !near(p0, POST)) throw new Error(`Fatima is not on her post at take start: ${JSON.stringify(p0)} (she may have left already: retake)`);
  const smp = startSampler(page);
  try {
    mark('follow-on'); await followNpc(page, NPC, { lerp: 0.08 });
    if (!(await waitNpcMoved(page, NPC, 24, 60000))) throw new Error(`Fatima did not leave her post (${POST.x},${POST.y}) within 60 s (natural thirst trip, expected about 27.5 s after load)`);
    mark('walk-start', await npcPos(page, NPC));
    const arr = await settle(page, NPC, 30000);
    if (!arr) throw new Error('Fatima did not stop at the drinks machine within 30 s');
    mark('arrive', arr);
    if (!(await waitNpcMoved(page, NPC, 24, 60000))) throw new Error('Fatima did not walk back from the machine within 60 s of arriving');
    mark('return-start', await npcPos(page, NPC));
    const back = await settle(page, NPC, 30000);
    if (!back || !near(back, POST)) throw new Error(`Fatima did not get back to her post: ${JSON.stringify(back)}`);
    mark('back', back);
    await finish(page, mark, smp);
  } finally {
    await smp.stop();
  }
};
