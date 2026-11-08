// Slice 2 (and 4): one walk along a back wall in a shipped mission. node s2_missions.mjs <gid> m01|m04 [tag]
import { open, loadRooms, shot, sleep } from './lib.mjs';
const [gid, which, tag = 's2'] = process.argv.slice(2);
const cfg = { m01: { S: 'reception_area', N: 'main_office_area', xs: [90, 130, 230, 270, 200] }, m04: { S: 'engineering_workshop', N: 'battery_hall_1', xs: [60, 100, 140, 180, 220, 340, 380, 420, 460, 500, 540, 580] } }[which];
const { browser, page } = await open(gid);
await page.evaluate(async ([a, b]) => { await window.loadRoom(a); await window.loadRoom(b); }, [cfg.S, cfg.N]);
const E = (f, a) => page.evaluate(f, a);
if (which === 'm01') await E(() => window.__test.enterRoom('main_office_area'));
else await E(([N]) => { const p = window.rooms[N].position, m = window.rooms[N].map; window.player.setPosition(p.x + m.widthInPixels / 2, p.y + 120); }, [cfg.N]);
await sleep(page, 800);
const Spos = await E(([S]) => window.rooms[S].position, [cfg.S]);
const Nspos = await E(([N]) => window.rooms[N].position, [cfg.N]);
console.log('S', JSON.stringify(Spos), 'N', JSON.stringify(Nspos), 'room', await E(() => window.currentPlayerRoom));
let ok = false;
for (const dx of cfg.xs) {
  const x = Spos.x + dx;
  await E(([x, y]) => window.__test.moveTo(x, y), [x, Spos.y - 80]);
  await E(() => window.__test.walk('down', 4000));
  const st = await E(() => ({ s: window.behindWallFade.debugState().rooms, f: [Math.round(window.player.body.center.x), Math.round(window.player.body.bottom)], room: window.currentPlayerRoom }));
  console.log('dx', dx, JSON.stringify(st));
  if (st.s[cfg.S]?.k === 0.5) { ok = true; break; }
}
console.log(ok ? 'PASS k=0.5 behind ' + cfg.S : 'FAIL no fade');
await sleep(page, 500);
await shot(page, `${tag}_${which}_${cfg.S}`);
const lights = await E(() => (window.lightingSystem ? 'lighting on' : 'lighting off'));
console.log(lights);
await browser.close();
