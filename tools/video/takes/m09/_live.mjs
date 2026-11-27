// Shared by the m09 takes. They run in LIVE mode against the keyed dev Hacktivity server (game 87, playtest04),
// so a take drives the game as it stands and must never finish the mission (except the dedicated ending take,
// which is the last take recorded before --finish).
import { sleep, clearScreen } from '../lib/lib.mjs';

/** Logs every POST /break_escape/games/:id/tts answer as a mark (status, type, bytes), so a take proves its lines were voiced. */
export function watchTts(page, mark) {
  const seen = [];
  page.on('response', async (r) => {
    if (!/\/break_escape\/games\/\d+\/tts(\?|$)/.test(r.url()) || r.request().method() !== 'POST') return;
    let text = null;
    try { text = JSON.parse(r.request().postData() || '{}').text || null; } catch (_) {}
    const len = Number(r.headers()['content-length'] || 0) || (await r.body().catch(() => Buffer.alloc(0))).length;
    const e = { status: r.status(), type: r.headers()['content-type'] || '', bytes: len, text: text && text.slice(0, 120) };
    seen.push(e); mark('tts-response', e);
  });
  return seen;
}

/** Walk a route of rooms through unlocked doors (enterRoom, as the playtest session does), e.g. ['main_hallway', 'server_room']. */
export async function goRoom(page, bridge, route) {
  route = [].concat(route);
  for (const room of route) {
    for (let i = 0; i < 3; i++) {
      const s = await bridge.getState();
      if (s.player && s.player.room === room) break;
      if (route.indexOf(s.player && s.player.room) > route.indexOf(room)) break;
      const r = await bridge.enterRoom(room, { timeoutMs: 45000 });
      console.error('ENTER', room, JSON.stringify(r).slice(0, 300));
      await sleep(1200);
      await clearScreen(page, bridge, () => {});
    }
  }
  const want = route[route.length - 1];
  const p = (await bridge.getState()).player;
  if (!p || p.room !== want) throw new Error('could not reach ' + want + ' (at ' + (p && p.room) + ')');
  return p;
}

const ttsPlaying = (page) => page.evaluate(() => { const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame; return !!(mg && mg.ttsManager && mg.ttsManager.playing); }).catch(() => false);

/**
 * Plays a conversation through with EVERY voiced line heard in full (unlike lib/dlg.mjs runDialogue, which skips
 * non-target lines): never presses Continue while a line is playing, picks `steps` in order at each choice menu,
 * and stops at the first menu after the last step, or when the conversation closes. Returns the voiced lines.
 */
export async function playThrough(page, bridge, mark, vw, { steps = [], dwellMs = 1600, settleMs = 900, timeoutMs = 120000 } = {}) {
  let ci = 0, lastText = null, quietSince = Date.now();
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const s = await bridge.getState();
    const d = s.dialogue;
    if (!d) { if (!s.activeMinigame) break; await sleep(150); continue; }
    if (await ttsPlaying(page)) { quietSince = Date.now(); await sleep(100); continue; }
    if (d.awaitingChoice) {
      await vw.drain();
      if (ci >= steps.length) { mark('menu-reached', { choices: d.choices.map(c => c.text) }); break; }
      mark('choices-shown', { choices: d.choices.map(c => c.text) });
      await sleep(dwellMs);
      const ch = await bridge.minigame.choose(steps[ci]);
      if (!ch || !ch.ok) throw new Error('choose failed ' + steps[ci] + ' ' + JSON.stringify(ch).slice(0, 400));
      mark('choice:' + ch.chose, { number: ch.number });
      ci++; quietSince = Date.now(); await sleep(300); continue;
    }
    const txt = d.text || '';
    if (txt !== lastText) { lastText = txt; quietSince = Date.now(); }
    if (d.canContinue && Date.now() - quietSince > settleMs) { await bridge.minigame.continue_().catch(() => {}); quietSince = Date.now(); }
    await sleep(120);
  }
  await vw.drain();
  return vw.lines;
}

// Added for the endgame takes (t04 to t08): the m04 helpers (globals, playChat, closeAll, syncNow, ttsBusy).
export { globals, playChat, closeAll, syncNow, ttsBusy } from '../m04/_live.mjs';
import { playChat as _playChat, globals as _globals } from '../m04/_live.mjs';

// Spine: loading_dock -> open_stacks -> reading_room (west) -> restricted_stacks (north) -> restricted_cage (east).
const SPINE = ['loading_dock', 'open_stacks', 'reading_room', 'restricted_stacks', 'restricted_cage'];
const SIDE = { server_closet: 'open_stacks', sorensen_office: 'restricted_stacks', tape_room: 'restricted_stacks', salvage_cage: 'tape_room' };

/**
 * Answers the night clerk's re-challenge in open_stacks ("Still auditing?") with the cover line, if one is up.
 * Returns true if a clerk chat was handled. Never picks "I'm not an auditor".
 */
export async function handleClerk(page, bridge, mark = () => {}) {
  const s = await bridge.getState();
  const d = s.dialogue;
  if (!d) return false;
  const txt = JSON.stringify(d).slice(0, 2000);
  if (!/Coyote|auditing|Same as before/i.test(txt)) return false;
  await _playChat(page, bridge, mark, { prefer: [/^Same as before\. Carry on/i, /Carry on/i], avoid: [/not an auditor/i, /.*/], donePicks: 1, dwellMs: 600, settleMs: 500, timeoutMs: 60000 }).catch(e => mark('clerk-chat', { e: String(e).slice(0, 160) }));
  return true;
}

/** Passes a lingering "Continue?" title card with a player gesture (Enter, then a click), as playtest-session does. */
export async function passTitle(page, bridge) {
  for (let i = 0; i < 12; i++) {
    const s = await bridge.getState();
    if (!(s.activeMinigame && s.activeMinigame.id === 'title-screen')) return i > 0;
    if (i % 2 === 0) await page.keyboard.press('Enter'); else await page.mouse.click(960, 540);
    await new Promise(res => setTimeout(res, 1500));
  }
  throw new Error('title screen did not close');
}

/** Walk from wherever the player is to `room` via the hub, room by room, answering the clerk on the way. */
export async function walkTo(page, bridge, room, mark = () => {}) {
  await passTitle(page, bridge);
  for (let hop = 0; hop < 8; hop++) {
    const at = (await bridge.getState()).player.room;
    if (at === room) return at;
    let next;
    if (SIDE[at]) next = SIDE[at];
    else if (!SPINE.includes(room)) next = room;
    else next = SPINE[SPINE.indexOf(at) + (SPINE.indexOf(room) > SPINE.indexOf(at) ? 1 : -1)];
    const r = await bridge.enterRoom(next, { timeoutMs: 45000 });
    mark('enter', { room: next, ok: r && r.ok });
    await new Promise(res => setTimeout(res, 1500));
    for (let i = 0; i < 3; i++) { if (!(await handleClerk(page, bridge, mark))) break; }
  }
  const p = (await bridge.getState()).player.room;
  if (p !== room) throw new Error('could not reach ' + room + ' (at ' + p + ')');
  return p;
}

/** Opens the phone on Agent HaX's thread. */
export async function openHax(bridge) {
  const r = await bridge.openInventoryItem('phone');
  if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  await new Promise(res => setTimeout(res, 1500));
  const c = await bridge.minigame.clickText('Agent HaX');
  return c;
}

export const endgameGlobals = (page) => _globals(page, ['flag3_submitted', 'flag4_submitted', 'cage_opened', 'nightshade_file_held', 'notebook_read', 'hand_before_name',
  'hand_matched', 'identity_scene_started', 'identity_scene_done', 'hour_read_started', 'hour_read_done', 'tesseract_call_started', 'tesseract_call_done',
  'albion_notified', 'start_debrief', 'report_done', 'legacy_clock_run']);
