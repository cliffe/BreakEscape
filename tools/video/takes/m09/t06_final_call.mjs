// t06_final_call (m09), ONE-SHOT, the final call: with the name said and both Tomb Beta flags in, Agent HaX reads the
// hour (a forced text call: what the mirror job is, who gets it first, how many people), the player answers, and 4 s
// after it closes Dr Adrian Tesseract himself rings (voiced, forced, music to silence): the mirror job, in his own voice.
// The player answers "Understood." Holds after the call.
// Voiced: the Tesseract call (phone chat, keyed dev server). hour_read is text.
// One-shot: sets hour_read_started/done and tesseract_call_started/done (hear_the_mirror_job; the "Bring me in." hub row).
// Entry state: LIVE game 87 (playtest04, m09, set 918): identity_scene_done true, tesseract_call_done false. hour_read
// rings on load (room_entered backstop, or the game_loaded re-ring if t05's tail started it), so it may already be open
// when the picture starts; setup() leaves it open and the take plays it from where it stands.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/87 STORAGE_STATE=<playtest04 login.mjs state> \
//   tools/video/takes/run-take.sh m09 t06_final_call "" ""
// Marks: hour-open, line, choices-shown, choice:*, hour-done, tesseract-open, tts-response, tesseract-done, synced, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts, globals, endgameGlobals, playChat, syncNow, walkTo, passTitle } from './_live.mjs';

const chatOpen = async (bridge) => { const s = await bridge.getState(); return !!(s.activeMinigame && /phone/.test(s.activeMinigame.id || '')); };

export async function setup(page, bridge) {
  await passTitle(page, bridge);
  const g = await endgameGlobals(page);
  console.error('GLOBALS', JSON.stringify(g));
  if (g.identity_scene_done !== true || g.tesseract_call_done === true) throw new Error('wrong entry state: ' + JSON.stringify(g));
  for (let i = 0; i < 16 && !(await chatOpen(bridge)); i++) await sleep(500);
  // The "Mission Brief" notes can open on load; close it (never a phone chat, which may be the call).
  if (!(await chatOpen(bridge))) await clearScreen(page, bridge, () => {});
  console.error('SETUP chat open', await chatOpen(bridge), JSON.stringify((await bridge.getState()).activeMinigame));
}

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  await sleep(1200);
  if (!(await chatOpen(bridge))) {
    // Not rung on load: walk a room (room_exited / room_entered backstops ring it).
    // Not rung on load: walk into a room (the room_entered backstop rings it). From the dock, the front desk avoids the
    // night clerk's challenge in the open stacks.
    const at = (await bridge.getState()).player.room;
    const to = at === 'loading_dock' ? 'front_desk' : at === 'front_desk' ? 'loading_dock' : null;
    let e = to ? await bridge.enterRoom(to, { timeoutMs: 45000 }).catch(x => ({ ok: false, e: String(x) })) : { ok: false };
    mark('enter', { to, ok: e && e.ok, reason: e && e.reason });
    if (!e || !e.ok) await walkTo(page, bridge, at === 'reading_room' ? 'restricted_stacks' : 'reading_room', mark).catch(x => mark('walk-err', { e: String(x).slice(0, 160) }));
    for (let i = 0; i < 20 && !(await chatOpen(bridge)); i++) await sleep(500);
  }
  mark('hour-open', { open: await chatOpen(bridge), g: await globals(page, ['hour_read_started']) });
  const h = await playChat(page, bridge, mark, { prefer: [/^Her schedule/i, /^Understood/i], avoid: [], dwellMs: 1700, timeoutMs: 240000 })
    .catch(e => ({ error: String(e).slice(0, 200) }));
  mark('hour-done', { ...h, ...(await globals(page, ['hour_read_done'])) });
  let open = false;
  for (let i = 0; i < 30; i++) {
    const g = await globals(page, ['tesseract_call_started']);
    if (g.tesseract_call_started === true && await chatOpen(bridge)) { open = true; break; }
    await sleep(500);
  }
  mark('tesseract-open', { open });
  if (!open) throw new Error('the Tesseract call did not ring');
  const t = await playChat(page, bridge, mark, { prefer: [/^Understood/i], avoid: [], dwellMs: 1800, timeoutMs: 300000 })
    .catch(e => ({ error: String(e).slice(0, 200) }));
  const g = await globals(page, ['tesseract_call_done', 'tesseract_call_closed']);
  mark('tesseract-done', { ...t, ...g, voiced: tts.filter(x => x.status === 200 && /audio/.test(x.type)).length, ttsAll: tts.length });
  mark('synced', { ok: await syncNow(page) });
  await sleep(3000);
  mark('linger-end');
  if (g.tesseract_call_done !== true) throw new Error('tesseract call not done');
};
