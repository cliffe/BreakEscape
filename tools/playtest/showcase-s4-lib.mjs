// S4 live proof helpers for office_life_showcase (port 3092 default; override with PORT env).
// Evening turn, lighting variants, B10, Zainab's delayed caffeine. Copies the S3 lib patterns.
import { open, ev, waitAtPost, dlg, converse } from './m01-ol-lib.mjs';
import fs from 'node:fs';
export { ev, waitAtPost, dlg, converse };
export const PORT = process.env.PORT || '3092';
export const OUT = 'scenarios/office_life_showcase/planning/screens';
export const NPCS = ['chidi_okeke', 'jun_watanabe', 'graham_whitfield', 'agnieszka_duda', 'zainab_hussain'];
export const HIDDEN = ['chidi_okeke', 'jun_watanabe', 'graham_whitfield', 'agnieszka_duda'];
export const TASKS = ['see_who_stays'];
export const GLOBALS = ['act_midday', 'act_evening', 'kitchen_seen', 'office_coffee_off', 'chidi_pc_owner_away', 'jun_pc_owner_away'];
export async function start(gid) {
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync('tmp/s4', { recursive: true });
  const h = await open(gid, PORT);
  // Abort only POST /tts (the keyless synth call). URL-predicate route, never the '**/tts**' glob,
  // which would also block tts-manager.js and break reloads (MEMORY: worktree live proof rules).
  await h.page.route(u => /\/tts$/.test(u.pathname), r => (r.request().method() === 'POST' ? r.abort() : r.continue()));
  return h;
}
export const shot = (h, n) => h.page.screenshot({ path: `${OUT}/s4-${n}.png` });
export async function install(h) {
  await ev(h, ({ ids, tasks, globals }) => {
    const sys = window.npcNeedsSystem, w = sys.world, L = window.__rec = [];
    const clk = () => +(sys.clockMs / 1000).toFixed(1);
    const add = (k, o) => L.push({ c: clk(), k, ...o });
    const oe = w.emit; w.emit = function (n, d) { if (!/^(npc_need_urgent|npc_used|npc_arrived)/.test(n)) { let dd; try { dd = JSON.stringify(d).slice(0, 220); } catch (e) { dd = '?'; } add('emit', { n, d: dd }); } return oe.call(this, n, d); };
    const ed = window.eventDispatcher, oed = ed.emit; ed.emit = function (n, d) { if (/^(workstation_|door_|room_entered|npc_left_item|npc_caught|npc_left_post|magnet|global_variable)/.test(n)) { let dd; try { dd = JSON.stringify(d).slice(0, 220); } catch (e) { dd = '?'; } add('emit', { n, d: dd }); } return oed.apply(this, arguments); };
    const bs = window.barkSystem, ob = bs.showBark; bs.showBark = function (p) { add('bark', { npc: p?.npcId, text: String(p?.text || p?.message || '').slice(0, 100), sndOn: bs.soundEnabled }); return ob.apply(this, arguments); };
    const prev = { g: {}, t: {}, j: {}, room: null, vis: {} };
    setInterval(() => {
      const gv = window.gameState?.globalVariables || {};
      for (const g of globals) if (gv[g] !== prev.g[g]) { prev.g[g] = gv[g]; add('global', { g, v: gv[g] }); }
      for (const t of tasks) { const s = window.objectivesManager?.getTask?.(t)?.status; if (s !== prev.t[t]) { prev.t[t] = s; add('task', { t, s }); } }
      for (const id of ids) { const st = sys.getState(id); const j = st?.job ? `${st.job.need || st.job.kind}:${st.job.targetId || ''}:${st.job.phase || ''}` : (st?.atPost ? 'post' : st?.mode); if (j !== prev.j[id]) { prev.j[id] = j; add('job', { id, j, room: window.npcManager.npcs.get(id)?.roomId }); }
        const vis = window.npcManager.npcs.get(id)?.isVisible; if (vis !== prev.vis[id]) { prev.vis[id] = vis; add('vis', { id, vis }); } }
      const rm = window.currentPlayerRoom; if (rm !== prev.room) { prev.room = rm; add('room', { rm }); }
    }, 200);
  }, { ids: NPCS, tasks: TASKS, globals: GLOBALS });
}
export const rec = h => ev(h, () => window.__rec);
export const clock = h => ev(h, () => +(window.npcNeedsSystem.clockMs / 1000).toFixed(1));
export const gv = (h, k) => ev(h, k => window.gameState.globalVariables[k], k);
export const dump = async (h, name) => { const d = { rec: await rec(h) }; fs.writeFileSync(`tmp/s4/${name}.json`, JSON.stringify(d)); return d; };
export const log = (c, ...a) => console.log(`[${c}]`, ...a);
export const nearNpc = (h, id) => ev(h, id => window.__test.moveToNear(id, { timeoutMs: 30000 }), id).catch(e => String(e));
export async function waitFor(h, fn, arg, maxS, poll = 400) { const t0 = Date.now(); for (;;) { if (await ev(h, fn, arg)) return true; if ((Date.now() - t0) / 1000 > maxS) return false; await h.t(poll); } }
// Sprite presence for a hidden NPC: is there any visible drawn container/sprite for it?
export const spriteState = (h, id) => ev(h, id => {
  const npc = window.npcManager.npcs.get(id);
  const spr = npc?._sprite;
  const key = spr?.texture?.key || null;
  const drawn = key ? window.player.scene.children.list.filter(o => o !== spr && o.texture?.key === key && o.visible && o.active && !o.isMask).length : null;
  return { isVisible: npc?.isVisible, drawnOthers: drawn, texKey: key, exists: !!spr, spriteVisible: spr ? !!spr.visible : null, active: spr ? !!spr.active : null, alpha: spr ? spr.alpha : null };
}, id);
// Room lighting state: current mode, on/off, ambient colours, light count, variant index.
export const lightState = (h, room) => ev(h, room => {
  const ls = window.lightingSystem; const st = ls?.rooms?.get(room);
  const hex = n => '#' + ((n >>> 0) & 0xffffff).toString(16).padStart(6, '0');
  return st ? { mode: st.mode, on: st.on, ambient: hex(st.litAmbient), darkAmbient: hex(st.darkAmbient), lights: (st.extraLights || []).length, offTimer: !!st.offTimer, variantIdx: st.variantIdx } : null;
}, room);
// Drive Ama: open, advance hub, pick a choice matching `pick`, advance until hub returns or chat closes.
export async function amaPick(h, pick) {
  await nearNpc(h, 'ama_owusu'); const r = await ev(h, () => window.__test.interact('ama_owusu')); await h.t(1500);
  const lines = []; let picked = false, closed = false, hubAgain = false;
  const body = d => (d.text || '').split('\n').filter(x => x.trim() && !/^(×|Skip)/.test(x.trim()));
  for (let i = 0; i < 40; i++) {
    const d = await dlg(h);
    if (!d.active) { closed = true; break; }
    const last = body(d).slice(-1)[0] || ''; if (last && !lines.includes(last)) lines.push(last);
    const hasChoice = d.controls.some(c => /^\d\./.test(c));
    if (hasChoice) {
      if (!picked) { const p = await ev(h, p => window.__test.minigame.chooseMatching(p), pick); if (!p?.ok) { lines.push('NO CHOICE(' + pick + '): ' + d.controls.join(' | ')); break; } picked = true; await h.t(900); continue; }
      hubAgain = true; break;
    }
    await h.page.keyboard.press('Space'); await h.t(900);
  }
  return { r: r?.ok, picked, closed, hubAgain, lines };
}
export async function closeChat(h) { for (let i = 0; i < 5; i++) { const d = await dlg(h); if (!d.active) return true; await h.page.keyboard.press('Escape'); await h.t(700); } return !(await dlg(h)).active; }
// Movement helpers (world pixel coords; kitchen is west of office, so negative x).
export async function near(h) { await ev(h, () => window.__test.moveTo(300, 296, { timeoutMs: 20000 })).catch(() => {}); }
export async function toKitchen(h) { await ev(h, () => window.__test.enterRoom('kitchen')); await h.t(800); await ev(h, () => window.__test.moveTo(-250, 262, { timeoutMs: 20000 })).catch(() => {}); await h.t(600); }
export async function toOffice(h) { await ev(h, () => window.__test.enterRoom('office')); await h.t(800); await near(h); }
