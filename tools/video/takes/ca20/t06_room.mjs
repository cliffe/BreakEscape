// t06_room: the ambient room wide after the sort (silent). Fresh game seeded with kit_defend_done, kit_attack_done, kit_quiet (SEEDS.room; --set fires no events, so kit_quiet is set by hand),
// Brief popup closed, nothing pressed, no kiosk. Holds the room up to 40 s and marks the FIRST walk of Chidi (kit_chidi_okeke) or Fatima (kit_fatima_begum) away from their desks (thirst needs:
// Chidi 60 at 30/min, urgent at 50; Fatima 65, urgent at 50); the edit's in = walk_start - 0.5 s, out = in + 3.8 s. Stops 6 s after the first walk start (so the window is covered), or at 40 s.
// Fallback (no walk by 40 s): a static wide with Chidi at his desk (3, 6); the take notes it. All NPC world bubbles hidden (HIDE_BUBBLES); every bark audio element muted (any bark would be
// chatter; kit_quiet should suppress it, the mute is a belt for the silent shot).
// Entry state: tools/video/takes/run-take.sh ca20 t06_room "--set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true" "--hide-hud --zoom-step 1"
// Marks: player-start, player-sprite, bubbles-hidden-on, cam-lock, player-parked, proof (every 0.5 s across the window: talk icons visible, machine on-screen, Chidi-player distance), npc-home (positions at t0), pos-track (every 0.5 s: id, x, y), walk_start (who, px; the first sample whose position moved >= 8 px from home), frame:walk-in,
//   frame:walk-mid, frame:walk-out, vending-box, room-sprites, mute-log, end.
import { sleep, prepare, sprite, HIDE_BUBBLES } from './_ca20.mjs';

const IDS = ['kit_chidi_okeke', 'kit_fatima_begum'];

export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_quiet !== true || g.kit_caught === true || g.kit_key_caught === true) throw new Error('entry state wrong: ' + JSON.stringify({ d: g.kit_defend_done, q: g.kit_quiet, c: g.kit_caught, k: g.kit_key_caught }));
}

export default async (page, bridge, mark) => {
  // Camera lock + park (take-local, no engine edit). The camera follows the player, so parking the player used to shift the room and cut the vending machine out of frame. Here the camera is
  // frozen at the start-position scroll (stopFollow + setScroll, window.game is the Phaser scene), then the player walks (pathfinder, pointer:false) to the top-right of the room (about (242,100)),
  // more than 64 px from Chidi's whole route and from Zainab (67 px), so no talk icon is triggered and he does not walk through the player. As a belt, every NPC's interactionIndicator (the "..."
  // talk icon from systems/interactions.js; NPCTalkIconSystem is not instantiated) is held invisible. See takes_ca20.md.
  const p0 = (await bridge.getState()).player; mark('player-start', { x: Math.round(p0.x), y: Math.round(p0.y) });
  await page.evaluate(HIDE_BUBBLES); mark('bubbles-hidden-on');
  mark('cam-lock', await page.evaluate(() => { const c = window.game.cameras.main; const o = { sx: c.scrollX, sy: c.scrollY, zoom: c.zoom }; c.stopFollow(); c.setScroll(o.sx, o.sy); return o; }));
  await page.evaluate(() => { window.__hideTalk = setInterval(() => { try { for (const r of Object.values(window.rooms || {})) for (const s of (r.npcSprites || [])) { const i = s.interactionIndicator; if (i && !i.__hid) { i.__hid = true; const o = i.setVisible.bind(i); i.setVisible = () => o(false); i.setVisible(false); } } } catch (_) {} }, 5); });
  const park = await bridge.moveTo(244, 128, { pointer: false }).catch(e => String(e));
  await sleep(2500);
  const pp = (await bridge.getState()).player; mark('player-parked', { x: Math.round(pp.x), y: Math.round(pp.y), cam: await page.evaluate(() => ({ sx: window.game.cameras.main.scrollX, sy: window.game.cameras.main.scrollY })), r: JSON.stringify(park).slice(0, 120) });
  await page.evaluate(() => { window.__muteLog = { elems: 0, played: 0 }; window.__muteT = setInterval(() => { try { const ms = window.barkSystem && window.barkSystem.ttsManagers; if (!ms) return; for (const [, m] of ms) { const a = m && m.audio; if (a) { a.muted = true; a.volume = 0; window.__muteLog.elems++; if (!a.paused && a.currentTime > 0) window.__muteLog.played++; } } } catch (_) {} }, 50); });
  await sprite(page, mark);
  const t0 = Date.now(); const home = {}; const tr = []; let ws = null, nextF = 0, nextP = 0, f = {};
  while ((Date.now() - t0) / 1000 < 40) {
    const el = (Date.now() - t0) / 1000;
    const st = await bridge.getState({ radius: 20 * 32, limit: 60 });
    const seen = {};
    for (const n of (st.nearby || [])) if (n.kind === 'npc' && IDS.includes(n.id)) { seen[n.id] = [Math.round(n.x), Math.round(n.y)]; }
    for (const id of IDS) if (seen[id] && !home[id]) { home[id] = seen[id]; if (Object.keys(home).length === IDS.length) mark('npc-home', home); }
    if (el >= nextF) { tr.push([+el.toFixed(1), seen]); nextF += 0.5; }
    if (!ws) for (const id of IDS) { const h = home[id], p = seen[id]; if (h && p && Math.hypot(p[0] - h[0], p[1] - h[1]) >= 8) { ws = el; mark('walk_start', { who: id, at: +el.toFixed(2), from: h, to: p }); break; } }
    if (ws && el >= nextP && el <= ws + 3.4) {   // proof samples across the window: visible talk icons (any NPC), Chidi-player distance, machine on-screen
      nextP = el + 0.5;
      const pr = await page.evaluate(() => { const cam = window.game.cameras.main; let icons = 0; for (const r of Object.values(window.rooms || {})) for (const s of (r.npcSprites || [])) if (s.interactionIndicator && s.interactionIndicator.visible) icons++;
        let m = null; for (const r of Object.values(window.rooms || {})) for (const o of Object.values(r.objects || {})) if (o.scenarioData && o.scenarioData.id === 'kit_vending') m = o.getBounds();
        const onScr = m ? (m.left >= cam.scrollX && m.right <= cam.scrollX + cam.width / cam.zoom && m.top >= cam.scrollY && m.bottom <= cam.scrollY + cam.height / cam.zoom) : null; return { icons, onScr, sx: cam.scrollX, sy: cam.scrollY }; });
      const cp = seen.kit_chidi_okeke; mark('proof', { t: +(el - ws).toFixed(2), ...pr, chidi: cp, player: [Math.round(st.player.x), Math.round(st.player.y)], dist: cp ? Math.round(Math.hypot(cp[0] - st.player.x, cp[1] - st.player.y)) : null });
    }
    if (ws && !f.in && el >= ws + 0.1) { f.in = 1; mark('frame:walk-in'); }
    if (ws && !f.q1 && el >= ws + 1.0) { f.q1 = 1; mark('frame:walk-1s'); }
    if (ws && !f.q3 && el >= ws + 3.0) { f.q3 = 1; mark('frame:walk-3s'); }
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
