// S4 live proof C: T21 / R6 reload in each act, plus the lamp over Zainab's tool roll. Usage: node showcase-s4-reload.mjs <gameId>
import { load } from './m01-ol-lib.mjs';
import { start, install, shot, clock, gv, log, ev, nearNpc, closeChat, spriteState, lightState, toKitchen, toOffice, waitFor, HIDDEN, NPCS, dlg, OUT } from './showcase-s4-lib.mjs';
const gid = process.argv[2];
const h = await start(gid); const R = {};
await install(h);
const snap = async label => {
  const o = { label };
  o.globals = await ev(h, () => Object.fromEntries(['act_midday', 'act_evening', 'kitchen_seen', 'office_coffee_off'].map(k => [k, window.gameState.globalVariables[k]])));
  o.task = await ev(h, () => window.objectivesManager.getTask('see_who_stays')?.status);
  o.office = await lightState(h, 'office'); o.kitchen = await lightState(h, 'kitchen');
  o.vis = await ev(h, ids => Object.fromEntries(ids.map(i => [i, window.npcManager.npcs.get(i)?.isVisible])), NPCS);
  o.sprites = {}; for (const i of HIDDEN) { const s = await spriteState(h, i); o.sprites[i] = [s.isVisible, s.spriteVisible, s.drawnOthers]; }
  o.levels = await ev(h, ids => Object.fromEntries(ids.map(i => [i, window.__test.needs.state(i)?.levels])), NPCS);
  o.initial = await ev(h, ids => Object.fromEntries(ids.map(i => { const n = window.npcNeedsSystem.getState(i); return [i, n?.needs ? Object.fromEntries(Object.entries(n.needs).map(([k, c]) => [k, c.initial])) : null]; })), NPCS);
  return o;
};
const reload = async label => {
  const t0 = await clock(h); await h.t(21000);
  const before = await snap(label + ' before reload');
  await h.page.reload({ waitUntil: 'domcontentloaded' });
  await load(h, undefined); await install(h); await h.t(2500);
  const after = await snap(label + ' after reload'); log(await clock(h), label, JSON.stringify({ g: after.globals, task: after.task, office: after.office, vis: after.vis, sprites: after.sprites }));
  R[label] = { before, after }; return after;
};
const pickAll = async re => { R['near' + re] = await nearNpc(h, 'ama_owusu'); R['int' + re] = JSON.stringify(await ev(h, () => window.__test.interact('ama_owusu'))); await h.t(1500);
  for (let i = 0; i < 40; i++) { const d = await dlg(h); if (!d.active) return 'closed'; if (d.controls.some(c => /^\d\./.test(c))) { const p = await ev(h, p => window.__test.minigame.chooseMatching(p), re); if (!p?.ok) return 'nochoice:' + d.controls.join('|'); await h.t(900); for (let k = 0; k < 20; k++) { const e = await dlg(h); if (!e.active || e.controls.some(c => /^\d\./.test(c))) break; await h.page.keyboard.press('Space'); await h.t(800); } return 'picked'; } await h.page.keyboard.press('Space'); await h.t(800); } return 'timeout:' + JSON.stringify(await dlg(h)).slice(0, 400); };
// morning
await toKitchen(h); await toOffice(h); log(await clock(h), 'kitchen_seen', await gv(h, 'kitchen_seen'));
await reload('morning');
// midday
await toKitchen(h); await toOffice(h); await h.t(1000);
R.lunch = await pickAll("Let's do lunch"); await closeChat(h); log(await clock(h), 'midday', await gv(h, 'act_midday'), R.lunch);
await reload('midday');
// evening
R.evening = await pickAll("Call it a day"); await closeChat(h); log(await clock(h), 'evening', await gv(h, 'act_evening'), R.evening);
await h.t(1000); await shot(h, 'C-evening-before-reload');
const after = await reload('evening');
await toOffice(h); await h.t(2500);
await shot(h, 'C-evening-after-reload');
// lamp over the tool roll: clip around it
const lampPx = await ev(h, () => { const r = window.rooms.office, cam = window.player.scene.cameras.main; const wx = r.position.x + 2.3 * 32, wy = r.position.y + 5.5 * 32; return { sx: (wx - cam.worldView.x) * cam.zoom, sy: (wy - cam.worldView.y) * cam.zoom, zoom: cam.zoom, wx, wy }; });
R.lampPx = lampPx; log(0, 'lamp', JSON.stringify(lampPx));
const cx = Math.max(0, Math.round(lampPx.sx - 150)), cy = Math.max(0, Math.round(lampPx.sy - 120));
await h.page.screenshot({ path: `${OUT}/s4-C-lamp-clip.png`, clip: { x: cx, y: cy, width: 300, height: 240 } });
await ev(h, () => { window.__test.moveTo(150, 120, { timeoutMs: 15000 }); }).catch(() => {}); await h.t(1500);
await ev(h, () => window.__test.enterRoom('kitchen')); await h.t(1500); R.kitchenReload = await lightState(h, 'kitchen'); await shot(h, 'C-kitchen-entered-after-reload');
console.log(JSON.stringify(R, null, 1)); console.log('errs', h.errs.filter(e => !/ERR_FAILED|503/.test(e))); await h.browser.close();
