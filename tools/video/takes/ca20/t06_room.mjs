// t06_room: the ambient room wide after the sort (silent). Fresh game seeded with kit_defend_done, kit_attack_done, kit_quiet (SEEDS.room; --set fires no events, so kit_quiet is set by hand),
// Brief popup closed, nothing pressed, no kiosk. Holds the room up to 40 s and marks the FIRST walk of Chidi (kit_chidi_okeke) or Fatima (kit_fatima_begum) away from their desks (thirst needs:
// Chidi 60 at 30/min, urgent at 50; Fatima 65, urgent at 50); the edit's in = walk_start - 0.5 s, out = in + 3.8 s. Stops 6 s after the first walk start (so the window is covered), or at 40 s.
// Fallback (no walk by 40 s): a static wide with Chidi at his desk (3, 6); the take notes it. All NPC world bubbles hidden (HIDE_BUBBLES); every bark audio element muted (any bark would be
// chatter; kit_quiet should suppress it, the mute is a belt for the silent shot).
// Entry state: tools/video/takes/run-take.sh ca20 t06_room "--set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true" "--hide-hud --zoom-step 1"
// Marks: player-start, player-sprite, bubbles-hidden-on, npc-home (positions at t0), pos-track (every 0.5 s: id, x, y), walk_start (who, px; the first sample whose position moved >= 8 px from home), frame:walk-in,
//   frame:walk-mid, frame:walk-out, vending-box, room-sprites, mute-log, end.
import { sleep, prepare, sprite, HIDE_BUBBLES } from './_ca20.mjs';

const IDS = ['kit_chidi_okeke', 'kit_fatima_begum'];

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_quiet !== true || g.kit_caught === true || g.kit_key_caught === true) throw new Error('entry state wrong: ' + JSON.stringify({ d: g.kit_defend_done, q: g.kit_quiet, c: g.kit_caught, k: g.kit_key_caught }));
}

export default async (page, bridge, mark) => {
  // Parking the player in a corner (bridge.moveTo) moves the camera and cuts the room (vending machine out of frame), so the player stays at its start (192,198). Hazard: while Chidi is within 64 px
  // of the player, the engine's talk icon ("...", NPCTalkIconSystem, not an npcWorldBubbles box) shows over him, and he squeezes past the player on the way to the machine. See takes_ca20.md.
  const p0 = (await bridge.getState()).player; mark('player-start', { x: Math.round(p0.x), y: Math.round(p0.y) });
  await page.evaluate(HIDE_BUBBLES); mark('bubbles-hidden-on');
  await page.evaluate(() => { window.__muteLog = { elems: 0, played: 0 }; window.__muteT = setInterval(() => { try { const ms = window.barkSystem && window.barkSystem.ttsManagers; if (!ms) return; for (const [, m] of ms) { const a = m && m.audio; if (a) { a.muted = true; a.volume = 0; window.__muteLog.elems++; if (!a.paused && a.currentTime > 0) window.__muteLog.played++; } } } catch (_) {} }, 50); });
  await sprite(page, mark);
  const t0 = Date.now(); const home = {}; const tr = []; let ws = null, nextF = 0, f = {};
  while ((Date.now() - t0) / 1000 < 40) {
    const el = (Date.now() - t0) / 1000;
    const st = await bridge.getState({ radius: 20 * 32, limit: 60 });
    const seen = {};
    for (const n of (st.nearby || [])) if (n.kind === 'npc' && IDS.includes(n.id)) { seen[n.id] = [Math.round(n.x), Math.round(n.y)]; }
    for (const id of IDS) if (seen[id] && !home[id]) { home[id] = seen[id]; if (Object.keys(home).length === IDS.length) mark('npc-home', home); }
    if (el >= nextF) { tr.push([+el.toFixed(1), seen]); nextF += 0.5; }
    if (!ws) for (const id of IDS) { const h = home[id], p = seen[id]; if (h && p && Math.hypot(p[0] - h[0], p[1] - h[1]) >= 8) { ws = el; mark('walk_start', { who: id, at: +el.toFixed(2), from: h, to: p }); break; } }
    if (ws && !f.in && el >= ws + 0.1) { f.in = 1; mark('frame:walk-in'); }
    if (ws && !f.mid && el >= ws + 2.0) { f.mid = 1; mark('frame:walk-mid'); }
    if (ws && !f.out && el >= ws + 3.8) { f.out = 1; mark('frame:walk-out'); }
    if (ws && el >= ws + 6) break;
    await sleep(120);
  }
  mark('pos-track', { samples: tr });
  if (!ws) { mark('no-walk', { held: 40 }); mark('frame:static-wide'); }
  const vend = await page.evaluate(() => { const rs = window.rooms ? Object.values(window.rooms) : []; for (const r of rs) for (const o of Object.values(r.objects || {})) if (o.scenarioData && o.scenarioData.id === 'kit_vending') return { x: Math.round(o.x), y: Math.round(o.y), w: Math.round(o.displayWidth || 0), h: Math.round(o.displayHeight || 0) }; return null; });
  mark('vending-box', vend);
  mark('mute-log', await page.evaluate(() => window.__muteLog));
  mark('end');
  console.error('WALK', JSON.stringify({ ws, home }));
};
