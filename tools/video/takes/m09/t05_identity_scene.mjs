// t05_identity_scene (m09), ONE-SHOT, the name: in the reading room the player reads the training notebook scan in HaX's
// case file (the teacher's looped g and crossed sevens), calls Agent HaX on the phone and picks "The hand on Nightshade's
// file." -> "Same hand." HaX hangs up, and 1.5 s later the identity scene rings (voiced, forced): Tomb Beta's owner is a
// SAFETYNET staff credential, Director Netherton (co-speaker) names Dr Adrian Tesseract, and HaX confesses she had his
// name and put it in a drawer. Answer: "You should have told me." (the first offered), then her closing lines.
// Voiced: Agent HaX and Director Netherton (phone chat, keyed dev server).
// One-shot: sets hand_matched, identity_scene_started/done, hax_confession_answer. hour_read rings 3 s after the scene
// closes; it is t06's beat (if it starts here, its game_loaded re-ring brings it back on t06's load).
// Entry state: LIVE game 87 (playtest04, m09, set 918): flag3 and flag4 in, nightshade_file_held true (t04),
// identity_scene_started false.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/87 STORAGE_STATE=<playtest04 login.mjs state> \
//   tools/video/takes/run-take.sh m09 t05_identity_scene "" ""      (HUD kept: the phone opens from the inventory tray)
// Marks: notebook-open, notebook-closed, phone-open, contact-picked, line, choices-shown, choice:*, chat-closed,
// identity-open, tts-response, identity-done {identity_scene_done, hax_confession_answer}, synced, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { walkTo, watchTts, globals, endgameGlobals, playChat, closeAll, syncNow, openHax } from './_live.mjs';

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const g = await endgameGlobals(page);
  console.error('GLOBALS', JSON.stringify(g));
  if (g.nightshade_file_held !== true || g.hand_matched === true || g.flag3_submitted !== true || g.identity_scene_started === true) throw new Error('wrong entry state: ' + JSON.stringify(g));
  await walkTo(page, bridge, 'reading_room', (l, d) => console.error('SETUP', l, JSON.stringify(d || null).slice(0, 200)));
  await clearScreen(page, bridge, () => {});
  // Off camera: HaX's thread was saved on an old call's last menu ("Understood."). Close that call so the take opens on the hub.
  const mk = (l, d) => console.error('SETUP', l, JSON.stringify(d || null).slice(0, 200));
  await openHax(bridge);
  const r0 = await playChat(page, bridge, mk, { prefer: [/^Understood/i, /^Right\.?$/i], avoid: [/.*/], stopAt: /^The hand on Nightshade's file/i, donePicks: 1, dwellMs: 200, settleMs: 300, timeoutMs: 60000 })
    .catch(e => ({ error: String(e).slice(0, 200) }));
  console.error('SETUP phone', JSON.stringify(r0).slice(0, 300));
  await closeAll(bridge);
  await syncNow(page);
  await sleep(1000);
  const m = await bridge.moveToNear('notebook_scan', { timeoutMs: 20000 });
  if (!m || !m.ok) throw new Error('moveToNear notebook ' + JSON.stringify(m).slice(0, 300));
  await sleep(800);
}

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  await sleep(1500);
  await bridge.interact('notebook_scan', { approach: false, timeoutMs: 20000 }).catch(e => mark('interact-err', { e: String(e).slice(0, 160) }));
  mark('notebook-open', { mg: (await bridge.getState()).activeMinigame });
  await sleep(6500);
  await closeAll(bridge);
  // The scan reads in a game-display dialog (blocking UI, not a minigame).
  for (let i = 0; i < 4 && await page.$('.game-display-dialog .game-confirm-ok'); i++) { await page.click('.game-display-dialog .game-confirm-ok').catch(() => {}); await sleep(700); }
  mark('notebook-closed', await globals(page, ['notebook_read']));
  await sleep(1500);

  const c = await openHax(bridge);
  mark('contact-picked', { ok: c && c.ok });
  const r = await playChat(page, bridge, mark, {
    prefer: [/^The hand on Nightshade's file/i, /^Same hand/i], avoid: [/.*/], donePicks: 2, dwellMs: 1500, timeoutMs: 90000
  }).catch(e => ({ error: String(e).slice(0, 200) }));
  mark('hand-chat', r);

  // The identity scene rings (a new, forced phone chat).
  let open = false;
  for (let i = 0; i < 40; i++) {
    const g = await globals(page, ['identity_scene_started']);
    const s = await bridge.getState();
    if (g.identity_scene_started === true || (s.dialogue && /Tomb Beta|staff credential|Same hand/i.test(s.dialogue.text || ''))) { open = true; break; }
    await sleep(500);
  }
  mark('identity-open', { open, mg: (await bridge.getState()).activeMinigame });
  if (!open) throw new Error('identity scene did not ring');
  const d = await playChat(page, bridge, mark, {
    prefer: [/^You should have told me/i, /^You should have taken it to Netherton/i], avoid: [], donePicks: 1, dwellMs: 1800, timeoutMs: 300000
  }).catch(e => ({ error: String(e).slice(0, 200) }));
  mark('identity-chat', d);
  const g = await globals(page, ['identity_scene_done', 'hax_confession_answer', 'hand_matched']);
  mark('identity-done', { ...g, voiced: tts.filter(t => t.status === 200 && /audio/.test(t.type)).length, ttsAll: tts.length });
  mark('synced', { ok: await syncNow(page) });
  await sleep(1500);
  mark('linger-end');
  if (g.identity_scene_done !== true) throw new Error('identity scene not done');
};
