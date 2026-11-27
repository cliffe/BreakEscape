import { start, log, converse } from './m05-ol-lib.mjs';
const [gid, ko] = process.argv.slice(2);
const B = 'bernadette_lyons';
const g = await start(gid);
await g.page.route(u => /\/tts$/.test(new URL(u).pathname), r => r.abort());
// 1 briefing (a fresh game opens on the title screen: Space, then the briefing chat)
for (let i = 0; i < 40; i++) { const mg = await g.ev(() => { const a = window.__test.getState().activeMinigame; return a && a.id; }); log('pre-wait', i, mg); if (mg === 'person-chat') break; if (mg === 'title-screen') await g.page.keyboard.press('Space'); if (mg === 'notes') await g.page.evaluate(() => window.__test.minigame.close()).catch(() => {}); await g.t(1500); }
log('pre', JSON.stringify(await g.ev(() => ({ mg: window.__test.getState().activeMinigame && window.__test.getState().activeMinigame.id, pa: window.gameState.globalVariables.player_approach, bp: window.gameState.globalVariables.briefing_played }))));
await g.until(() => g.ev(() => { const m = window.MinigameFramework && window.MinigameFramework.currentMinigame; return !!(m && window.__test.getState().dialogue); }), 30000, 500);
const tr = await converse(g, ['read the room', 'Methodically', 'Fast'], 160);
log('briefing', JSON.stringify(tr).slice(0, 900));
await g.clear(); await g.t(1000);
log('approach', await g.gv('player_approach'), 'trust', await g.gv('handler_trust'), 'briefing_played', await g.gv('briefing_played'));
// 2 route to evening break room
await g.t(2000); await g.clear();
for (const r of ['main_corridor','server_hallway','server_room','server_hallway','main_corridor']) { let x = await g.enter(r); if (!x.ok) { log('retry', r, JSON.stringify(x).slice(0,200)); await g.clear(); await g.t(1500); x = await g.enter(r); } log(r, JSON.stringify(x.ok)); }
log('break', JSON.stringify((await g.enter('break_room')).ok)); await g.t(2500);
log('sre', await g.gv('server_room_entered'), 'B', JSON.stringify(await g.pos(B)), 'vis', await g.ev(`window.npcBehaviorManager.getBehavior('${B}').sprite.visible`));
const S = () => g.ev(() => { const v = window.gameState.globalVariables; const h = window.npcHostileSystem; return { upset: v.qdc_staff_upset, bko: v.bernadette_ko, B_ko: h.isNPCKO('bernadette_lyons'), B_host: h.isNPCHostile('bernadette_lyons'), esp: (window.rooms.break_room.objects||{}).break_espresso?.active, bins: (window.rooms.break_room.objects||{}).break_bins?.active, others: ['lisa_park','niamh_doherty','thandiwe_moyo'].map(i => i + ':' + (h.isNPCHostile(i) ? 'H' : '') + (h.isNPCKO(i) ? 'K' : '')).join(',') }; });
if (ko === '1') {
  log('pre-KO', JSON.stringify(await S()));
  await g.near(B); await g.t(800);
  let n = 0;
  for (; n < 60; n++) { if (n > 0 && n % 6 === 0) { await g.near(B); await g.t(600); } await g.page.evaluate(() => window.__test.pressKey('f')).catch(() => {}); await g.t(1100); const s = await S(); if (n === 0) log('punch1', JSON.stringify(s)); if (n % 5 === 4) log('punch-diag', n + 1, JSON.stringify(await g.ev(() => { const b = window.npcBehaviorManager.getBehavior('bernadette_lyons'); const h = window.npcHostileSystem; return { me: [Math.round(window.player.x), Math.round(window.player.y)], b: [Math.round(b.sprite.x), Math.round(b.sprite.y)], bhp: h.getNPCHP ? h.getNPCHP('bernadette_lyons') : null, php: window.playerHealth && window.playerHealth.current, st: (window.npcNeedsSystem.getState('bernadette_lyons') || {}).mode }; }))); if (s.B_ko) break; }
  await g.t(2500);
  log('KO after', n + 1, 'punches', JSON.stringify(await S()));
  await g.shot('s6-bernadette-ko');
  log('others', JSON.stringify(await g.ev(() => ['lisa_park','niamh_doherty','thandiwe_moyo'].map(i => { const b = window.npcBehaviorManager.getBehavior(i); return [i, b && [Math.round(b.sprite.x), Math.round(b.sprite.y), b.sprite.visible]]; }))));
  log('needs after', JSON.stringify(await g.st('niamh_doherty')), JSON.stringify(await g.st(B)));
}
// 3 debrief
await g.page.evaluate(() => { window.__trust0 = window.gameState.globalVariables.handler_trust; });
log('trust before complete', await g.gv('handler_trust'));
const r = await g.page.evaluate(async () => { const m = await import('/break_escape/js/systems/global-writer.js'); m.writeGlobal('mission_complete', true); return window.gameState.globalVariables.mission_complete; }).catch(e => String(e).slice(0, 200));
log('mission_complete', r);
await g.t(3000);
log('ending-check', JSON.stringify(await g.ev(() => { const o = document.querySelector('.ending-check-overlay'); if (!o) return null; const b = [...o.querySelectorAll('button')].find(b => /end/i.test(b.innerText)); if (b) b.click(); return { text: o.innerText.slice(-200) }; })));
await g.t(2500);
const lines = [];
for (let w = 0; w < 20 && !(await g.ev(() => !!(window.MinigameFramework && window.MinigameFramework.currentMinigame))); w++) await g.t(500);
for (let i = 0; i < 200; i++) {
  const st = await g.ev(() => { const m = window.MinigameFramework && window.MinigameFramework.currentMinigame; if (!m) return null; return window.__test.getState().dialogue || { none: true }; });
  if (!st) { lines.push('<closed>'); break; }
  if (st.text || st.lines) lines.push(JSON.stringify(st.text || st.lines).slice(0, 300));
  if (st.ended && !st.choices?.length && !st.canContinue) { lines.push('<ended>'); break; }
  if (st.choices && st.choices.length) { lines.push('CHOICES ' + JSON.stringify(st.choices.map(c => c.text || c))); await g.page.evaluate(() => window.__test.minigame.chooseIndex(1)).catch(() => {}); }
  else if (st.canContinue) await g.page.evaluate(() => window.__test.minigame.continue()).catch(() => {});
  await g.t(250);
}
console.log(lines.join('\n'));
log('trust', JSON.stringify(await g.ev(() => { const out = {}; try { const c = window.npcManager.inkEngineCache; for (const [k, e] of c) { const vs = (e.story || e).variablesState; try { out[k] = vs.$('handler_trust'); } catch (x) {} } } catch (x) { out.err = String(x); } out.gv = window.gameState.globalVariables.handler_trust; return out; })));
const seen = new Set(); let order = []; let idle = 0;
for (let i = 0; i < 700 && idle < 60; i++) {
  const tx = await g.ev(() => { const st = document.querySelector('#bv-cr-label'); return st ? st.innerText : null; });
  let fresh = false;
  if (tx) for (const l of tx.split('\n').map(x => x.trim()).filter(Boolean)) if (!seen.has(l)) { seen.add(l); order.push(l); fresh = true; }
  idle = fresh ? 0 : idle + 1;
  await g.t(500);
}
log('CREDITS seen', JSON.stringify(order));
log('gv', JSON.stringify(await g.ev(() => { const v = window.gameState.globalVariables; return { upset: v.qdc_staff_upset, bko: v.bernadette_ko, dp: v.debrief_played, mc: v.mission_complete, pa: v.player_approach }; })));
log('errs', JSON.stringify(g.errs)); await g.browser.close();
