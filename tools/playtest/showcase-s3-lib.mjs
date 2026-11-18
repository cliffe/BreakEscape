// S3 live proof helpers for office_life_showcase (port 3092 default; override with PORT env).
import { open, ev, waitAtPost, dlg, converse } from './m01-ol-lib.mjs';
import fs from 'node:fs';
export { ev, waitAtPost, dlg, converse };
export const PORT = process.env.PORT || '3092';
export const OUT = 'scenarios/office_life_showcase/planning/screens';
export const NPCS = ['chidi_okeke', 'jun_watanabe', 'graham_whitfield', 'agnieszka_duda', 'zainab_hussain'];
export const TASKS = ['use_open_screen', 'see_caught', 'see_cake_eaten'];
export const GLOBALS = ['chidi_pc_owner_away', 'jun_pc_owner_away', 'act_midday', 'kitchen_seen', 'jun_badge_left', 'chidi_pc_screen_locked', 'cake_servings'];
export async function start(gid) {
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync('tmp/s3', { recursive: true });
  const h = await open(gid, PORT);
  // Abort only POST /tts (the keyless synth call). A URL-predicate route, never the '**/tts**' glob,
  // which would also block tts-manager.js (MEMORY: BC1 probe; worktree live proof rules).
  await h.page.route(u => /\/tts$/.test(u.pathname), r => (r.request().method() === 'POST' ? r.abort() : r.continue()));
  return h;
}
export const shot = (h, n) => h.page.screenshot({ path: `${OUT}/s3-${n}.png` });
export async function install(h) {
  await ev(h, ({ ids, tasks, globals }) => {
    const sys = window.npcNeedsSystem, w = sys.world, L = window.__rec = [];
    const clk = () => +(sys.clockMs / 1000).toFixed(1);
    const add = (k, o) => L.push({ c: clk(), k, ...o });
    const oe = w.emit; w.emit = function (n, d) { if (!/^(npc_need_urgent|npc_used|npc_arrived)/.test(n)) { let dd; try { dd = JSON.stringify(d).slice(0, 220); } catch (e) { dd = '?'; } add('emit', { n, d: dd }); } return oe.call(this, n, d); };
    const ed = window.eventDispatcher, oed = ed.emit; ed.emit = function (n, d) { if (/^(workstation_|door_|room_entered|npc_left_item|npc_caught|npc_left_post|magnet|global_variable)/.test(n)) { let dd; try { dd = JSON.stringify(d).slice(0, 220); } catch (e) { dd = '?'; } add('emit', { n, d: dd }); } return oed.apply(this, arguments); };
    const os = w.speak; if (typeof os === 'function') w.speak = function (id, line, info) { add('speak', { id, line: String(line).slice(0, 80) }); return os.apply(this, arguments); };
    const bs = window.barkSystem, ob = bs.showBark; bs.showBark = function (p) { add('bark', { npc: p?.npcId, text: String(p?.text || p?.message || '').slice(0, 100), sndOn: bs.soundEnabled }); return ob.apply(this, arguments); };
    const prev = { g: {}, t: {}, j: {}, room: null, bub: '' };
    setInterval(() => {
      const gv = window.gameState?.globalVariables || {};
      for (const g of globals) if (gv[g] !== prev.g[g]) { prev.g[g] = gv[g]; add('global', { g, v: gv[g] }); }
      for (const t of tasks) { const s = window.objectivesManager?.getTask?.(t)?.status; if (s !== prev.t[t]) { prev.t[t] = s; add('task', { t, s }); } }
      for (const id of ids) { const st = sys.getState(id); const j = st?.job ? `${st.job.need || st.job.kind}:${st.job.targetId || ''}:${st.job.phase || ''}` : (st?.atPost ? 'post' : st?.mode); if (j !== prev.j[id]) { prev.j[id] = j; add('job', { id, j, room: window.npcManager.npcs.get(id)?.roomId }); } }
      const rm = window.currentPlayerRoom; if (rm !== prev.room) { prev.room = rm; add('room', { rm }); }
      const bub = [...(window.npcWorldBubbles?.bubbles?.keys() || [])].filter(i => window.npcWorldBubbles.showsBubble(i)).sort().join(','); if (bub !== prev.bub) { prev.bub = bub; add('bubbles', { who: bub }); }
    }, 200);
  }, { ids: NPCS, tasks: TASKS, globals: GLOBALS });
}
export const rec = h => ev(h, () => window.__rec);
export const clock = h => ev(h, () => +(window.npcNeedsSystem.clockMs / 1000).toFixed(1));
export const gv = (h, k) => ev(h, k => window.gameState.globalVariables[k], k);
export const dump = async (h, name) => { const d = { rec: await rec(h) }; fs.writeFileSync(`tmp/s3/${name}.json`, JSON.stringify(d)); return d; };
export const log = (c, ...a) => console.log(`[${c}]`, ...a);
export const needsOf = (h, id) => ev(h, id => { const s = window.__test.needs.state(id); return s ? { needs: s.levels || s.needs || s.values, atPost: s.atPost, mode: s.mode, job: s.job ? `${s.job.need || s.job.kind}:${s.job.targetId || ''}:${s.job.phase || ''}` : null, room: window.npcManager.npcs.get(id)?.roomId } : null; }, id);
export async function waitFor(h, fn, arg, maxS, poll = 400) { const t0 = Date.now(); for (;;) { if (await ev(h, fn, arg)) return true; if ((Date.now() - t0) / 1000 > maxS) return false; await h.t(poll); } }
export const near = (h, id) => ev(h, id => window.__test.moveToNear(id, { timeoutMs: 30000 }), id).catch(e => String(e));
export async function talkAma(h, pick) {
  await near(h, 'ama_owusu'); const r = await ev(h, () => window.__test.interact('ama_owusu')); await h.t(1500);
  return { r, c: await converse(h, pick, 30) };
}
// Open Ama's conversation, advance to the hub, pick the lunch choice once, then advance until the hub returns or the chat closes.
export async function lunchTry(h) {
  await near(h, 'ama_owusu'); const r = await ev(h, () => window.__test.interact('ama_owusu')); await h.t(1500);
  const lines = []; let picked = false, closed = false, hubAgain = false;
  const body = d => (d.text || '').split('\n').filter(x => x.trim() && !/^(×|Skip)/.test(x.trim()));
  for (let i = 0; i < 40; i++) {
    const d = await dlg(h);
    if (!d.active) { closed = true; break; }
    const last = body(d).slice(-1)[0] || ''; if (last && !lines.includes(last)) lines.push(last);
    const hasChoice = d.controls.some(c => /^\d\./.test(c));
    if (hasChoice) {
      if (!picked) {
        const p = await ev(h, () => window.__test.minigame.chooseMatching("Let's do lunch")); if (!p?.ok) { lines.push('NO LUNCH CHOICE: ' + d.controls.join(' | ')); break; }
        picked = true; await h.t(900); continue;
      }
      hubAgain = true; break;
    }
    await h.page.keyboard.press('Space'); await h.t(900);
  }
  return { r: r?.ok, picked, closed, hubAgain, lines };
}
export async function closeChat(h) { for (let i = 0; i < 4; i++) { const d = await dlg(h); if (!d.active) return true; await h.page.keyboard.press('Escape'); await h.t(700); } return !(await dlg(h)).active; }
