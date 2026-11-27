// m06 server_room -> data_center crossing proof (headless, throttled to 20 fps).
// usage: node tools/playtest/m06-server-door-proof.mjs <gameId> <port> <outDir>
import { open, ev } from './m01-ol-lib.mjs';
const [gid, port, out] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
await ev(h, () => window.__test.throttleFps(20));
await h.t(1500);
const shot = n => h.page.screenshot({ path: `${out}/${n}.png` });
const feet = () => ev(h, () => ({ x: Math.round(window.player.x), y: Math.round(window.player.y + window.player.body.height / 2 ), room: window.currentPlayerRoom }));
await shot('fixed_before');
console.log('start', JSON.stringify(await feet()));
const D = 'door:server_room->data_center';
await ev(h, d => window.__test.moveToNear(d), D);
await ev(h, d => window.__test.interact(d), D);
await h.t(1200);
await ev(h, () => { for (const k of '3110') { const b = [...document.querySelectorAll('.pin-minigame-keypad button, .pin-key, button')].find(x => x.textContent.trim() === k); b && b.click(); } });
await h.t(300);
await ev(h, () => { const b = [...document.querySelectorAll('button')].find(x => /^(ok|enter|submit|unlock|✓)/i.test(x.textContent.trim())); b && b.click(); });
await h.t(2500);
let ok = 0;
for (let i = 1; i <= 5; i++) {
  const r = await ev(h, () => window.__test.enterRoom('data_center'));
  await h.t(800);
  const f = await feet();
  const crossed = f.room === 'data_center';
  console.log(`try ${i}`, crossed ? 'CROSSED' : 'FAIL', JSON.stringify(f), JSON.stringify(r).slice(0, 200));
  await shot(`fixed_try${i}_after`);
  if (crossed) ok++;
  if (i < 5) { await ev(h, () => window.__test.enterRoom('server_room')); await h.t(800); const b = await feet(); console.log('  back', JSON.stringify(b)); }
}
console.log(`CROSSINGS ${ok}/5`);
await h.browser.close();
