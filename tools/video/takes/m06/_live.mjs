// Shared by the m06 "Follow the Money" takes. They run in LIVE mode against the keyed dev Hacktivity server (game 89,
// playtest03, set 915, all four VM flags already submitted), so a take drives the game as it stands and must never
// finish the mission from a replayable take: do not confront Satoshi, do not take HaX's "Bring me in", do not open the
// conclusion (the ending is its own one-shot take, t04_ending).
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

/** Dismiss a title/intro overlay if one is up (returns true if it closed one). */
export async function passTitle(page, bridge) {
  for (let i = 0; i < 12; i++) {
    const s = await bridge.getState();
    if (!(s.activeMinigame && s.activeMinigame.id === 'title-screen')) return i > 0;
    if (i % 2 === 0) await page.keyboard.press('Enter'); else await page.mouse.click(960, 540);
    await sleep(1500);
  }
  throw new Error('title screen did not close');
}

/** Opens the phone on Agent HaX's thread (agent_0x99). */
export async function openHax(bridge) {
  const r = await bridge.openInventoryItem('phone');
  if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  await sleep(1500);
  return bridge.minigame.clickText('Agent HaX');
}

/** Read a set of global variables by name. */
export const globals = (page, names) => page.evaluate((ns) => {
  const g = (window.gameState && window.gameState.globalVariables) || {};
  return ns.reduce((a, k) => (a[k] = g[k], a), {});
}, names).catch(() => ({}));
