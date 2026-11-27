import fs from 'node:fs';
import { ev, shot, clock, dump, near, log, needsOf, gv, waitFor, closeChat, dlg, rec, NPCS } from './showcase-s3-lib.mjs';
const has = (L, f) => L.filter(f);
export async function midday(h, R) {
  const t0 = await clock(h);
  // B4: Chidi locks on the lunch trip
  const b4 = await waitFor(h, () => window.__rec.some(r => r.k === 'bark' && /locked his screen/.test(r.text)), null, 90);
  let L = await rec(h);
  R.b4 = { barkSeen: b4, sndOn: has(L, r => r.k === 'bark' && /locked his screen/.test(r.text)).map(r => ({ c: r.c, sndOn: r.sndOn })), emit: has(L, r => r.k === 'emit' && /workstation_screen_changed:chidi_pc/.test(r.n || '') || (r.k === 'emit' && r.n === 'workstation_screen_changed')).slice(0, 4).map(r => ({ c: r.c, n: r.n, d: r.d })) };
  if (b4) { await h.t(600); R.b4.bubbles = await ev(h, () => [...window.npcWorldBubbles.bubbles.keys()].filter(i => window.npcWorldBubbles.showsBubble(i))); await shot(h, `${R.mode}-b4${R.soundOff ? '-soundoff' : ''}`); }
  console.log('B4', JSON.stringify(R.b4)); log(await clock(h), 'b4 done');
  // Jun leaves
  const jl = await waitFor(h, () => window.gameState.globalVariables.jun_pc_owner_away === true, null, 120);
  R.junLeft = { reached: jl, clock: await clock(h), badgeLeft: await gv(h, 'jun_badge_left'), job: (await needsOf(h, 'jun_watanabe'))?.job };
  console.log('junLeft', JSON.stringify(R.junLeft));
  L = await rec(h); R.b5 = has(L, r => r.k === 'bark' && /left his screen open/.test(r.text)).map(r => r.c);
  if (!R.junLeft.badgeLeft) { await h.t(2000); R.junLeft.badgeLeft = await gv(h, 'jun_badge_left'); }
  // badge
  R.badge = { left: R.junLeft.badgeLeft };
  if (R.badge.left) {
    await near(h, 'jun_badge'); const pos = await ev(h, () => { const o = Object.values(window.rooms.office.objects).find(o => (o.objectId || '').startsWith('jun_badge')); return o ? { vis: o.visible, x: Math.round(o.x), y: Math.round(o.y) } : null; });
    R.badge.obj = pos; await shot(h, `${R.mode}-badge-revealed`);
    const t = await ev(h, () => window.__test.interact('jun_badge')); await h.t(1200); await ev(h, () => window.__test.dismissBlockingUi?.());
    R.badge.take = t; R.badge.inInv = await ev(h, () => JSON.stringify((window.inventory?.items || []).map(i => i?.scenarioData?.id)));
  }
  console.log('badge', JSON.stringify(R.badge));
  // Jun's PC
  const before = (await needsOf(h, 'jun_watanabe')); R.pc = { workBefore: before.needs?.work, jobBefore: before.job, clock: await clock(h) };
  const closePc = async () => { await ev(h, () => window.__test.dismissBlockingUi?.()); await h.t(500); if (await ev(h, () => !!window.__test.getState().activeMinigame)) { await h.page.keyboard.press('Escape'); await h.t(700); } if (await ev(h, () => !!document.querySelector('#game-menu-overlay.visible'))) { await h.page.keyboard.press('Escape'); await h.t(700); } };
  let last = null; const openPc = async () => { for (let i = 0; i < 4; i++) { await near(h, 'jun_pc'); last = await ev(h, () => window.__test.interact('jun_pc')); await h.t(1500); const m = await ev(h, () => window.__test.getState().activeMinigame); if (m) return m; } return null; };
  const mini1 = await openPc(); R.pc.mini1 = mini1?.title || null;
  L = await rec(h); R.pc.accessEmits = has(L, r => r.k === 'emit' && r.n === 'workstation_accessed:jun_pc').map(r => ({ c: r.c, d: r.d }));
  R.pc.task1 = await ev(h, () => window.objectivesManager.getTask('use_open_screen')?.status);
  await shot(h, `${R.mode}-jun-pc`);
  const afterA = await needsOf(h, 'jun_watanabe'); R.pc.workAfter1 = afterA.needs?.work; R.pc.jobAfter1 = afterA.job;
  await closePc();
  // cooldown probe: set work 60, re-access within 60 s; expect work unchanged
  await ev(h, () => window.__test.needs.set('jun_watanabe', 'work', 60)); const c1 = await clock(h);
  const mini2 = await openPc(); const afterB = await needsOf(h, 'jun_watanabe'); L = await rec(h);
  R.pc.cooldown = { gapS: +((await clock(h)) - R.pc.clock).toFixed(1), workAfterSecond: afterB.needs?.work, mini2: mini2?.title || null, lastInteract: JSON.stringify(last).slice(0, 400), mgNow: await ev(h, () => window.__test.getState().activeMinigame?.title || null), job: afterB.job, accessEmitsNow: has(L, r => r.k === 'emit' && r.n === 'workstation_accessed:jun_pc').map(r => r.c), task: await ev(h, () => window.objectivesManager.getTask('use_open_screen')?.status) };
  await closePc();
  console.log('pc', JSON.stringify(R.pc));
  if (R.pcOnly) { fs.writeFileSync(`tmp/s3/R-${R.mode}-${R.gid}.json`, JSON.stringify(R)); await dump(h, `run-${R.mode}-${R.gid}`); return; }
  // catch on return: wait by desk
  await near(h, 'jun_pc');
  const caught = await waitFor(h, () => window.__rec.some(r => r.k === 'emit' && /npc_caught_at_post/.test(r.n || '')), null, 120);
  const caughtClock = await clock(h);
  await h.t(4200);
  L = await rec(h);
  R.caught = { reached: caught, clock: caughtClock, emits: has(L, r => r.k === 'emit' && /npc_caught_at_post|npc_left_item_gone/.test(r.n || '')).map(r => ({ c: r.c, n: r.n, d: r.d })), barks: has(L, r => r.k === 'bark' && /my desk|Caught!|badge gone/.test(r.text)).map(r => ({ c: r.c, npc: r.npc, text: r.text })), task: await ev(h, () => window.objectivesManager.getTask('see_caught')?.status), junHas: (await needsOf(h, 'jun_watanabe')) };
  await shot(h, `${R.mode}-caught`);
  console.log('caught', JSON.stringify(R.caught).slice(0, 900));
  // wait everyone back, then cake
  const all = await waitFor(h, () => ['chidi_okeke', 'jun_watanabe', 'graham_whitfield', 'agnieszka_duda'].every(i => { const s = window.__test.needs.state(i); return s.atPost && !s.job; }), null, 300);
  R.allBack = { reached: all, clock: await clock(h) }; log(await clock(h), 'all back', all);
  await h.t(3000);
  await ev(h, () => window.__test.moveTo(300, 296, { timeoutMs: 20000 })).catch(() => {});
  R.cake = { hungerBefore: {} };
  for (const id of ['chidi_okeke', 'jun_watanabe', 'graham_whitfield', 'agnieszka_duda']) R.cake.hungerBefore[id] = (await needsOf(h, id))?.needs?.hunger;
  if (R.mode === 'B') { await ev(h, () => { window.__test.needs.set('chidi_okeke', 'hunger', 20); window.__test.needs.set('jun_watanabe', 'hunger', 20); }); R.cake.nudged = 'chidi and jun hunger set to 20 before drop'; await ev(h, () => window.__test.moveTo(150, 150, { timeoutMs: 20000 })).catch(() => {}); await h.t(500); }
  const cd = await ev(h, () => window.__test.inventoryAct('cake', 'Drop here')); R.cake.drop = cd; const dc = await clock(h); R.cake.dropClock = dc; log(dc, 'cake dropped', JSON.stringify(cd));
  await h.t(1500); await shot(h, `${R.mode}-cake-dropped`);
  const done = await waitFor(h, () => window.__rec.some(r => r.k === 'emit' && /magnet_finished/.test(r.n || '')), null, 150);
  await h.t(5000); await shot(h, `${R.mode}-cake-finished`);
  L = await rec(h); const sinceDrop = L.filter(r => r.c >= dc);
  R.cake.finished = done;
  R.cake.events = sinceDrop.filter(r => r.k === 'emit' && /magnet|npc_turned_back|npc_chatted|npc_left_item|cake/.test(`${r.n}${r.d}`)).map(r => `${r.c} ${r.n} ${r.d}`);
  R.cake.jobs = sinceDrop.filter(r => r.k === 'job' && /cake|magnet/.test(r.j)).map(r => `${r.c} ${r.id} ${r.j}`);
  R.cake.speaks = sinceDrop.filter(r => r.k === 'speak').map(r => `${r.c} ${r.id}: ${r.line}`);
  R.cake.barks = sinceDrop.filter(r => r.k === 'bark').map(r => `${r.c} ${r.npc}: ${r.text}`);
  R.cake.task = await ev(h, () => window.objectivesManager.getTask('see_cake_eaten')?.status);
  R.cake.itemInRoom = await ev(h, () => Object.entries(window.rooms.office.objects).filter(([k, o]) => /cake/.test(o.objectId || k)).map(([k, o]) => ({ k, vis: o.visible, active: o.active })));
  R.cake.invHas = await ev(h, () => JSON.stringify((window.inventory?.items || []).map(i => i?.scenarioData?.id)));
  R.cake.servings = await gv(h, 'cake_servings');
  console.log('cake', JSON.stringify(R.cake, null, 1).slice(0, 3500));
  R.tasks = await ev(h, () => ['use_open_screen', 'see_caught', 'see_cake_eaten'].map(t => [t, window.objectivesManager.getTask(t)?.status]));
  console.log('tasks', JSON.stringify(R.tasks)); console.log('errs', h.errs.slice(0, 6));
  fs.writeFileSync(`tmp/s3/R-${R.mode}-${R.gid}.json`, JSON.stringify(R)); await dump(h, `run-${R.mode}-${R.gid}`);
}
