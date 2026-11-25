// t08_zainab_to_notice: the camera is on Zainab before Look up, and follows her during her patrolOverride walk from home (128,192) to the parking notice (48,160), about 1 s after Look up.
// Z1 (the hook) plays about 1.5 s after Look up, Z2 about 4 s after she reaches the notice. The take holds on her there, then glides back to the player.
// The walk is one way (about 80 px), so the return marks are logged as not applicable. Never clicks in the room, never opens the chat, never examines the notice.
// Entry state (as t07_notice_beat): the step-away seed, with kit_quiet=true (Z1's mapping is gated on it).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca06_texts_and_qr t08_zainab_to_notice \
//     "--set episode_e6_texts_and_qr_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\",\"defend\"]} --set episode_e6_texts_and_qr_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true" \
//     "--hide-hud --zoom-step 1"
// Marks: player-sprite, npc-start, kiosk-open, look_up, follow-on, walk-start, arrive, return-start (n/a), back (n/a), bubble-start/end (Z1, Z2), follow-off, cam-summary, npc-end, end.
import { sleep, prepare, openKiosk, pressButton, waitButton, watchBubbles, checkSprite } from './_ca06.mjs';
import { followNpc, followPlayer, camState, waitNpcMoved, npcPos } from '../lib/camlib.mjs';

const NPC = 'kit_zainab_hussain';
const HOME = { x: 128, y: 192 };
const NOTICE = { x: 48, y: 160 };

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
  if (g.kit_quiet !== true) throw new Error('entry state wrong: kit_quiet is not true (Z1 will not play); seed it with --set kit_quiet=true');
}

export default async (page, bridge, mark) => {
  const bw = await watchBubbles(page, mark);
  await checkSprite(page, mark);
  const p0 = await npcPos(page, NPC);
  mark('npc-start', p0);
  if (!p0 || !near(p0, HOME)) throw new Error(`Zainab is not at home (${HOME.x},${HOME.y}) at take start: ${JSON.stringify(p0)}`);
  const smp = startSampler(page);
  try {
    await openKiosk(page, bridge, mark); mark('kiosk-open');
    if (!(await waitButton(page, /Look up/, 10000))) throw new Error('step-away panel never showed');
    await sleep(1000);
    mark('follow-on'); await followNpc(page, NPC, { lerp: 0.1 });
    await sleep(600);
    mark('look_up'); await pressButton(page, /Look up/);
    if (!(await waitNpcMoved(page, NPC, 24, 15000))) throw new Error('Zainab did not walk to the parking notice within 15 s of Look up');
    mark('walk-start', await npcPos(page, NPC));
    const arr = await settle(page, NPC, 15000);
    if (!arr) throw new Error('Zainab did not stop at the parking notice within 15 s');
    mark('arrive', { ...arr, distToNotice: Math.round(Math.hypot(arr.x - NOTICE.x, arr.y - NOTICE.y)) });
    mark('return-start', { na: true, why: 'one-way walk to the notice; Zainab stays there for the end line' });
    mark('back', { na: true, why: 'one-way walk' });
    await sleep(5500);
    await bw.stop();
    await finish(page, mark, smp);
  } finally {
    await smp.stop();
  }
};
