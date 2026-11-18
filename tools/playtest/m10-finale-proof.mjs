// m10 finale live proof (keyless server, headless, fixed steps ON, 20 fps).
//   M10_PORT=3207 node tools/playtest/m10-finale-proof.mjs <gameId> <outDir> <choice regex>...
// Seed a game at the core with new-game.rb (--start-room core --carry-npc six_oclock, the router
// globals set, the end_it tasks before decide_his_end completed), then this talks to Tesseract
// and takes each choice in order (a regex per argument), answering the ending check with
// "End the mission now", and waits for the closing scene and the credits.
import { start } from './m10-ol-lib.mjs';
const [gid, out, ...picks] = process.argv.slice(2);
const g = await start(gid, { reload: true });
const logs = [];
g.page.on('console', (m) => { const x = m.text(); if (/ending-check|ending|credits|Choice|conclu|night_closed|closing/i.test(x)) logs.push(x.slice(0, 200)); });
// Resume overlay, then the title card and any popup (as m10-hold-proof.mjs boot()).
for (let i = 0; i < 12; i++) {
  const bl = await g.ev(() => { try { const st = window.__test.getState(); const b = st.blockingUi; return { b: b && b.blocking ? { text: b.text } : null, mg: st.activeMinigame && st.activeMinigame.type }; } catch (e) { return {}; } });
  if (!bl.b && !bl.mg) break;
  if (bl.b && /RESUME SESSION/i.test(bl.b.text || '')) await g.ev(() => window.__test.dismissBlockingUi('Resume')).catch(() => {});
  else if (bl.b) await g.ev(() => window.__test.dismissBlockingUi()).catch(() => {});
  else await g.ev(() => window.__test.minigame && window.__test.minigame.close && window.__test.minigame.close()).catch(() => {});
  await g.t(1200);
}
await g.page.waitForFunction(() => window.gameScenario && window.player && window.player.body, null, { timeout: 60000 }).catch(() => {});
await g.ev(() => window.__test.throttleFps(20));
const st = () => g.ev(() => {
  const s = window.__test.getState();
  const gv = window.gameState.globalVariables;
  return { mg: s.activeMinigame && s.activeMinigame.type, npc: window.currentConversationNPCId || null,
    blocking: s.blockingUi && s.blockingUi.blocking ? (s.blockingUi.text || '').slice(0, 80) : null,
    modal: !!document.getElementById('ending-check-overlay'),
    modalVis: (() => { const o = document.getElementById('ending-check-overlay'); if (!o) return null; const r = o.getBoundingClientRect(); const cs = getComputedStyle(o); return { w: r.width, h: r.height, z: cs.zIndex, disp: cs.display, vis: cs.visibility, top: document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('#ending-check-overlay') ? 'on-top' : 'covered' }; })(),
    asking: window.endingCheck?.isAsking?.(), needs: window.endingCheck?.needsAnswer?.(), open: (window.endingCheck?.openOptional?.() || []).map((o) => o.taskId),
    mgAsking: !!(window.MinigameFramework?.currentMinigame?._endingAsking),
    choices: ((s.dialogue && s.dialogue.choices) || []).map((c) => c.text), line: s.dialogue && s.dialogue.text ? String(s.dialogue.text).slice(0, 90) : null,
    ending: gv.ending, six_done: gv.six_done, closing_done: gv.closing_done, night_closed: gv.night_closed,
    credits: !!document.querySelector('.credits-overlay, #credits-overlay, .mission-credits, .closing-card') };
});
const shot = (n) => g.shot(`${out}/${n}.png`);
console.log('boot', JSON.stringify(await st()));
await g.ev(() => window.__test.interact('tesseract')).catch((e) => console.log('interact err', String(e)));
await g.t(2500);
for (const [i, p] of picks.entries()) {
  // Advance lines until choices show
  for (let k = 0; k < 30; k++) {
    const s = await st();
    if (s.choices.length || s.modal) break;
    await g.ev(() => window.__test.minigame.continue_()).catch(() => {});
    await g.t(700);
  }
  console.log(`before pick ${i} ${p}`, JSON.stringify(await st()));
  await shot(`pick${i}-before`);
  const r = await g.ev((re) => window.__test.minigame.choose(re), p).catch((e) => 'ERR ' + String(e));
  console.log(`choose ${p} ->`, JSON.stringify(r).slice(0, 300));
  await g.t(1500);
  let s = await st();
  console.log(`after pick ${i}`, JSON.stringify(s));
  if (s.modal) {
    await shot(`pick${i}-modal`);
    await g.ev(() => document.getElementById('ending-check-end').click());
    await g.t(2000);
    console.log(`after End now`, JSON.stringify(await st()));
  }
}
// Let the conversation run out and the closing scene open; advance through it.
for (let k = 0; k < 120; k++) {
  const s = await st();
  if (s.credits || s.night_closed) { console.log('end state', JSON.stringify(s)); break; }
  if (s.modal) { await g.ev(() => document.getElementById('ending-check-end').click()); await g.t(1000); continue; }
  if (s.choices.length) { console.log('choices at', k, JSON.stringify(s.choices)); await g.ev(() => window.__test.minigame.chooseIndex(1)).catch(() => {}); }
  else await g.ev(() => window.__test.minigame.continue_()).catch(() => {});
  await g.t(900);
  if (k % 10 === 0) console.log('tick', k, JSON.stringify(s));
}
await g.t(4000);
console.log('final', JSON.stringify(await st()));
await shot('final');
console.log('logs', JSON.stringify(logs.slice(-40), null, 1));
console.log('errs', JSON.stringify(g.errs.slice(-10)));
await g.close();
