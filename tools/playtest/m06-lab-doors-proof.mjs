// m06 proof, headless, throttled to 20 fps, real movement only (interact / click-walk / key walk; no enterRoom, no teleport).
//   lab:   node tools/playtest/m06-lab-doors-proof.mjs lab   <port> <outDir> <gameId> ...        (one fresh game per try; started in blockchain_lab)
//   doors: node tools/playtest/m06-lab-doors-proof.mjs doors <port> <outDir> <10 gameIds>         (5 started in trading_floor, then 5 in server_room; server_room and data_center unlocked)
// Interacting with a door opens it (the player stays put); the crossing is a walk, as for a player.
import { open, ev } from './m01-ol-lib.mjs';
const [mode, port, out, ...gids] = process.argv.slice(2);
const st = h => ev(h, () => ({ room: window.currentPlayerRoom, x: Math.round(window.player.x), y: Math.round(window.player.y) }));
let pass = 0, total = 0;
const retry = async fn => { for (let a = 1; ; a++) { try { return await fn(); } catch (e) { if (a >= 3 || !/closed|crash/i.test(String(e))) throw e; console.log('  browser died, retrying', a); } } };
if (mode === 'lab') {
  for (const [i, gid] of gids.entries()) {
    const h = await open(gid, port, { skipResume: true });
    await ev(h, () => window.__test.throttleFps(20));
    await h.t(1200);
    if (i === 0) await h.page.screenshot({ path: `${out}/lab_fixed_layout.png` });
    const r = await ev(h, () => window.__test.interact('pizza'));
    await h.t(800);
    const has = await ev(h, () => (window.inventory?.items || []).some(it => (it.scenarioData?.id || it.id) === 'pizza' || it.scenarioData?.type === 'pizza_boxes'));
    const ok = r.ok && has; total++; if (ok) pass++;
    console.log(`lab try ${i + 1}`, ok ? 'PIZZA TAKEN' : 'FAIL', r.mode || r.reason, JSON.stringify(await st(h)));
    if (i === 0) await h.page.screenshot({ path: `${out}/lab_fixed_pizza_taken.png` });
    await h.browser.close();
  }
} else {
  // one fresh game per try: games 1-5 start in trading_floor, games 6-10 in server_room (the way back is a key door)
  const legs = [['door:trading_floor->server_room', 'trading_floor', 'server_room'], ['door:server_room->data_center', 'server_room', 'data_center']];
  for (const [li, [door, room0, room1]] of legs.entries()) {
    if (process.env.LEG && +process.env.LEG !== li + 1) continue;
    for (let i = 1; i <= 5; i++) {
      await retry(async () => {
        const h = await open(gids[li * 5 + i - 1], port, { skipResume: true });
        try {
          await ev(h, () => window.__test.throttleFps(20));
          await h.t(1200);
          let s = await st(h);
          if (s.room !== room0) { console.log(`  game did not start in ${room0}`, JSON.stringify(s)); total++; return; }
          if (i === 1) await h.page.screenshot({ path: `${out}/${room0}_before_door.png` });
          await ev(h, d => window.__test.interact(d), door); await h.t(1000);
          for (let k = 0; k < 10 && s.room !== room1; k++) { await ev(h, () => window.__test.walk('up', 500)); s = await st(h); }
          const crossed = s.room === room1; total++; if (crossed) pass++;
          console.log(`${door} try ${i}`, crossed ? 'CROSSED' : 'FAIL', JSON.stringify(s));
          if (i === 1) await h.page.screenshot({ path: `${out}/${room1}_crossed.png` });
        } finally { await h.browser.close().catch(() => {}); }
      });
    }
  }
}
console.log(`PROOF ${mode} ${pass}/${total}`);
