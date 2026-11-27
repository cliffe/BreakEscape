// t06_room_end: the end beat, SILENT. Fresh game, kit_quiet left unset (false), so the office chatter runs: Chidi's thirst turns urgent first (about 15 s), he walks from his desk to the drinks
// machine (kit_vending, standing about 237,225) and uses it for about 20 s; Fatima follows (about 30 s) and pairs with him.
// FINDING (23 Nov): Chidi never barks. The machine's chatter is a PAIR chat (capacity 2): it starts when the second user arrives, and the first speaker is a seeded roll that does not depend on the
// game id (chat:kit_vending:0:first for "kit_chidi_okeke+kit_fatima_begum"), which always gives FATIMA. She speaks one line (her own first draw from the game's bag), and Chidi's use ends before his turn,
// so the pair ends. The earlier "no bark" runs also read the wrong audio path: chatter voice is on window.npcChatterVoice.tts, not barkSystem.ttsManagers (watchChatterAudio below reads it).
// So the take is the silent walk-and-drink: no line is voiced (npcChatterVoice.deps.muted, the world bubble hidden by HIDE_BUBBLES). T06_VOICE=1 leaves Fatima's bark on (proof of the path only).
// Any game works for the silent take (no seed needed). Entry state:
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca17 t06_room_end "" "--hide-hud --zoom-step 1"
// Player: moved in setup() to (236,126) under the kiosk, clear of Chidi's spot and walk. Never interacts, never opens the kiosk.
// Marks: player-sprite, chatter-muted, bag-first, start-hold, chidi_walk (his position first leaves his desk), chidi_at_machine / fatima_at_machine (job phase using), *_left_machine,
//   bark_start {npc,text} (first time an NPC's world line shows, voiced or not), voice-log:<npc> (chatter voice's own log: spoken/reason), audio-start/end:<npc> (T06_VOICE only), tts, frame:t+N, end.
// Cut: in = chidi_walk - 0.3 s, out = chidi_at_machine + 4 s (or longer; the machine use runs about 20 s).
import { sleep, prepare, checkSprite, watchBubbles, watchTts, HIDE_BUBBLES } from './_ca17.mjs';

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

// Chatter audio lives on window.npcChatterVoice.tts (one TTSManager per NPC), NOT barkSystem.ttsManagers, so the ca08 watchBarkAudio never saw it. This reads that map.
const watchChatterAudio = async (page, mark) => {
  await page.evaluate(() => {
    if (window.__chAudio) return; const ev = window.__chEvents = []; const st = new Map(); let li = 0;
    window.__chAudio = setInterval(() => {
      try {
        const v = window.npcChatterVoice; if (!v) return;
        for (const e of v.log.slice(li)) ev.push({ type: 'log', npc: e.npcId, text: e.text, spoken: e.spoken, reason: e.reason || null, t: performance.timeOrigin + performance.now() });
        li = v.log.length;
        for (const [id, mgr] of v.tts) {
          const a = mgr.audio; if (!a) continue;
          const playing = !a.paused && !a.ended && a.currentTime > 0; const was = st.get(id); const t = performance.timeOrigin + performance.now();
          if (playing && !(was && was.playing && was.src === a.src)) { st.set(id, { playing: true, src: a.src, dur: a.duration }); ev.push({ type: 'start', npc: id, t, dur: a.duration }); }
          else if (!playing && was && was.playing) { st.set(id, { playing: false }); ev.push({ type: 'end', npc: id, t, dur: was.dur, cur: a.currentTime }); }
        }
      } catch (_) {}
    }, 30);
  });
  let n = 0;
  const drain = async () => { const evs = await page.evaluate(() => window.__chEvents ? window.__chEvents.slice() : []).catch(() => []);
    for (; n < evs.length; n++) { const e = evs[n]; mark(e.type === 'log' ? 'voice-log:' + e.npc : 'audio-' + e.type + ':' + e.npc, e.type === 'log' ? { text: e.text, spoken: e.spoken, reason: e.reason } : { dur: e.dur, cur: e.cur }, e.t); } };
  return { drain, events: () => page.evaluate(() => window.__chEvents ? window.__chEvents.slice() : []).catch(() => []) };
};

export default async (page, bridge, mark) => {
  const tw = await watchTts(page, mark);
  const bw = await watchBubbles(page, mark);
  const aw = await watchChatterAudio(page, mark);
  await checkSprite(page, mark, { strict: false });
  if (!(await page.evaluate(HIDE_BUBBLES))) throw new Error('npcWorldBubbles not ready: cannot hide the bubble');
  // Silent by default (see the header): the machine chatter is Fatima's, so no bark is voiced. T06_VOICE=1 leaves the voice on to prove Fatima's bark path.
  if (!process.env.T06_VOICE) { await page.evaluate(() => { window.npcChatterVoice.deps.muted = () => true; }); mark('chatter-muted'); }
  mark('bag-first', await page.evaluate(() => {
    const s = window.npcNeedsSystem; const out = { bagSeed: s.bagSeed };
    try { const sc = s._scenarioChatter(); for (const [id, st] of s.states) { const rec = s._rec(st); const lines = [...((sc.kit_tarrowby && sc.kit_tarrowby.lines) || []), ...((rec.chatter && rec.chatter.kit_tarrowby && rec.chatter.kit_tarrowby.lines) || [])]; out[id] = lines[s._bagOrderLeft(id, 'kit_tarrowby', lines)[0]]; } } catch (e) { out.err = String(e).slice(0, 100); }
    return out; }));
  const snap = (id) => page.evaluate((id) => { try { const s = window.npcNeedsSystem; const st = s.states.get(id), p = s.world.npcPos(id), tk = s._talking(id);
    return { x: Math.round(p.x), y: Math.round(p.y), mode: st.mode, ph: st.job && st.job.phase, tgt: st.job && st.job.targetId, say: tk && tk.line || null, clock: Math.round(s.clockMs / 100) / 10 }; } catch (_) { return null; } }, id);
  const home = await snap(CHIDI);
  mark('start-hold', { chidi: home, fatima: await snap(FATIMA) });
  const t0 = Date.now(); const seen = {}; let next = 2, tDone = null; const said = {};
  while (Date.now() - t0 < MAX_S * 1000) {
    const el = (Date.now() - t0) / 1000;
    await bw.drain(); await aw.drain();
    for (const [nm, id] of [['chidi', CHIDI], ['fatima', FATIMA]]) {
      const p = await snap(id); if (!p) continue;
      if (nm === 'chidi' && !seen.walk && home && Math.hypot(p.x - home.x, p.y - home.y) > 4) { seen.walk = 1; mark('chidi_walk', { from: home, now: p }); }
      if (p.ph === 'using' && p.tgt === 'kit_vending' && !seen[nm + 'use']) { seen[nm + 'use'] = 1; mark(nm === 'chidi' ? 'chidi_at_machine' : 'fatima_at_machine', p); }
      if (seen[nm + 'use'] && p.ph !== 'using' && !seen[nm + 'left']) { seen[nm + 'left'] = 1; mark(nm + '_left_machine', p); }
      if (p.say && !said[nm + p.say]) { said[nm + p.say] = 1; mark('bark_start', { npc: id, text: p.say, clock: p.clock }); }
    }
    if (seen.chidileft && seen.fatimaleft && !tDone) tDone = Date.now();
    if (el >= next) { mark('frame:t+' + next); next += (el < 20 ? 4 : 10); }
    if (tDone && Date.now() - tDone > 4000) break;
    await sleep(100);
  }
  if (!Object.keys(said).length) mark('no-bark-60s', { chidi: await snap(CHIDI), fatima: await snap(FATIMA) });
  await bw.drain(); await aw.drain(); await bw.stop(); await tw.stop();
  mark('frame:final');
  mark('end');
};
