// t06_room_end: the end beat. Fresh game, kit_quiet left unset (false), so the office chatter runs: Chidi's thirst is the first to turn urgent, he walks from his desk to the drinks machine
// (kit_vending, 222,239) and barks one of his five chatter lines there. The wanted draw is his first one, "Parched after that yard run." (cached 69042c8a, 2.54 s, speech 0.33 to 2.18 s).
// SEED: the chatter bag is seeded per game, "Acceptable use: can I?#<gameId>" (npc-needs.js resolveBagSeed), and the key is `<seed>:kit_chidi_okeke|kit_tarrowby:bag:0` over his five lines
// (the scenario's three, then his own two). The game id is the seed: make fresh games until `node scratchpad/ca17_own/bag17.mjs <repo> <id>` shows Chidi's first draw as "Parched after that yard
// run." (about 1 game in 5), and record on that game. No game global is set. Check `bag-first` in the marks agrees with the plan.
// The world bubble is hidden for the whole take (HIDE_BUBBLES, as ca13 t06): the edit burns the caption. Bubble events are still marked (the says state is untouched).
// Player: moved in setup() to (236,126) under the kiosk, clear of Chidi's spot at the machine (about 222,199) and of his walk. Never interacts, never opens the kiosk.
// Entry state:
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca17 t06_room_end "" "--hide-hud --zoom-step 1"     (on a game whose id gives the wanted first draw)
// Cut (script): in = bark audio start - 3.31 s, out = bark audio start + 2.18 s + 0.2 s. So the walk (chidi_walk) must start at least 3.3 s before bark_start; the take logs the gap.
// Marks: player-sprite, start-hold, bag-first (bagSeed, Chidi's and Fatima's first draws as the engine computes them), chidi_walk (his position first leaves his desk), chidi_at_machine,
//   bubble-start/end:<npc> (text), audio-start/end:<npc> (clip length and how far it got), bark_start (= Chidi's bark audio start), bark_end, tts (POST /tts status, bytes),
//   overlap (only if Fatima's audio or bubble is up inside Chidi's bark), no-bark-60s (only if none: the take then runs the full 60 s as the fallback record), frame:t+N, end.
// If the bark never comes in 60 s on a game, discard that game and use another; if no game gives one, use the fallback script (chosen by the orchestrator).
import { sleep, prepare, checkSprite, watchBubbles, watchTts, watchBarkAudio, HIDE_BUBBLES } from './_ca17.mjs';

const MUTE_FATIMA = false;   // set true if the dry run's `overlap` mark shows her bark under Chidi's (ca03 t05's Darren mute, below)
const MAX_S = Number(process.env.T06_MAX_S || 60);
const FATIMA = 'kit_fatima_begum', CHIDI = 'kit_chidi_okeke';

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_quiet === true) throw new Error('entry state wrong: kit_quiet is true (no chatter); do not seed it for this take');
  await bridge.moveTo(236, 126, { timeoutMs: 15000 }).catch(() => {});
  await sleep(800);
}

// Silence one NPC's bark voice and hide her bubble (page-level; nothing sets a game global). Same as ca03 t05's muteDarren.
async function muteNpc(page, id) {
  await page.evaluate((id) => {
    if (window.__muteNpc) return;
    window.__muteNpc = setInterval(() => {
      try {
        const mgr = window.barkSystem && window.barkSystem.ttsManagers && window.barkSystem.ttsManagers.get(id);
        if (mgr && mgr.audio) { mgr.audio.muted = true; mgr.audio.volume = 0; }
      } catch (_) {}
    }, 5);
  }, id);
}

export default async (page, bridge, mark) => {
  const tw = await watchTts(page, mark);
  const bw = await watchBubbles(page, mark);
  const aw = await watchBarkAudio(page, mark);
  await checkSprite(page, mark, { strict: false });
  if (!(await page.evaluate(HIDE_BUBBLES))) throw new Error('npcWorldBubbles not ready: cannot hide the bubble');
  if (MUTE_FATIMA) { await muteNpc(page, FATIMA); mark('fatima-muted-on'); }
  mark('bag-first', await page.evaluate(() => {
    const s = window.npcNeedsSystem; const out = { bagSeed: s.bagSeed };
    try { const sc = s._scenarioChatter(); for (const [id, st] of s.states) { const rec = s._rec(st); const lines = [...((sc.kit_tarrowby && sc.kit_tarrowby.lines) || []), ...((rec.chatter && rec.chatter.kit_tarrowby && rec.chatter.kit_tarrowby.lines) || [])]; out[id] = lines[s._bagOrderLeft(id, 'kit_tarrowby', lines)[0]]; } } catch (e) { out.err = String(e).slice(0, 100); }
    return out; }));
  const pos = (id) => page.evaluate((id) => { try { const p = window.npcNeedsSystem.world.npcPos(id); return p ? { x: p.x, y: p.y, room: p.roomId } : null; } catch (_) { return null; } }, id);
  const home = await pos(CHIDI);
  mark('start-hold', { chidi: home, fatima: await pos(FATIMA) });
  const t0 = Date.now(); let walked = false, atMachine = false, bark = null, barkEnd = null, next = 2, overlap = false, tEnd = null;
  while (Date.now() - t0 < MAX_S * 1000) {
    const el = (Date.now() - t0) / 1000;
    await bw.drain(); await aw.drain();
    const p = await pos(CHIDI);
    if (!walked && p && home && Math.hypot(p.x - home.x, p.y - home.y) > 4) { walked = true; mark('chidi_walk', { from: home, now: p }); }
    if (walked && !atMachine && p && Math.hypot(p.x - 222, p.y - 199) < 14) { atMachine = true; mark('chidi_at_machine', p); }
    const evs = await page.evaluate(() => (window.__audioEvents || []).slice()).catch(() => []);
    const cs = evs.find(e => e.type === 'start' && e.npc === CHIDI);
    if (cs && !bark) { bark = cs; mark('bark_start', { dur: cs.dur }, cs.t); }
    const ce = bark && evs.find(e => e.type === 'end' && e.npc === CHIDI && e.t >= bark.t);
    if (ce && !barkEnd) { barkEnd = ce; mark('bark_end', { dur: ce.dur, cur: ce.cur, ended: ce.ended }, ce.t); tEnd = Date.now(); }
    // overlap: any Fatima audio start between Chidi's bark start and end (+0.3 s), or her bubble up at the same time
    if (bark && !overlap) {
      const fs = evs.filter(e => e.type === 'start' && e.npc === FATIMA);
      const hi = barkEnd ? barkEnd.t + 300 : Date.now();
      if (fs.some(e => e.t >= bark.t - 300 && e.t <= hi)) { overlap = true; mark('overlap', { fatima_audio_starts: fs.map(e => e.t - bark.t) }); }
    }
    if (el >= next) { mark('frame:t+' + next); next += (el < 20 ? 4 : 10); }
    if (tEnd && Date.now() - tEnd > 6000) break;   // six seconds past his bark: enough to see whether she barks over it
    await sleep(100);
  }
  if (!bark) mark('no-bark-60s', { walked, atMachine, chidi: await pos(CHIDI) });
  await bw.drain(); await aw.drain();
  await bw.stop(); await aw.stop(); await tw.stop();
  mark('frame:final');
  mark('end');
};
