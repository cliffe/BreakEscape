// Slice 5 live proof: the opaque cap band. node s5_live.mjs <gid> test|m01 before|after
// "before" serves the module from the commit before the cap band (git show f8545bffb^:...) so both shots are the same spot.
import fs from 'node:fs';
import { open, loadRooms, shot, sleep } from './lib.mjs';
const [gid, which, phase] = process.argv.slice(2);
const OLD = process.env.OLD_BWF;
const route = phase === 'before' ? async (page) => {
  await page.route('**/systems/behind-wall-fade.js*', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(OLD, 'utf8') }));
} : null;
const { browser, page } = await open(gid, { route });
const E = (f, a) => page.evaluate(f, a);
const cfg = { test: { S: 'reception', N: 'hall', xs: [96, 280, 300], enter: 'office_n' }, m01: { S: 'reception_area', N: 'main_office_area', xs: [90, 130, 230, 270, 200], enter: 'main_office_area' } }[which];
await loadRooms(page, which === 'test' ? ['reception', 'server', 'office_n', 'hall'] : [cfg.S, cfg.N]);
await E((r) => window.__test.enterRoom(r), cfg.enter);
await sleep(page, 800);
const Spos = await E((S) => window.rooms[S].position, cfg.S);
let ok = false;
for (const dx of cfg.xs) {
  await E(([x, y]) => window.__test.moveTo(x, y), [Spos.x + dx, Spos.y - 80]);
  await E(() => window.__test.walk('down', 4500));
  const st = await E(() => ({ s: window.behindWallFade.debugState().rooms, f: [Math.round(window.player.body.center.x), Math.round(window.player.body.bottom)] }));
  console.log('dx', dx, JSON.stringify(st));
  if (Object.values(st.s).some(r => r.k === 0.5)) { ok = true; break; }
}
await E((S) => window.__test.lookAt?.(S), cfg.S).catch(() => {});
await E(([x, y]) => window.game.cameras.main.centerOn(x, y), [Spos.x + 160, Spos.y + 20]);
await sleep(page, 700);
const info = await E((S) => {
  const room = window.rooms[S];
  const imgs = window.game.children.list.filter(o => typeof o.frame?.name === 'string' && o.frame.name.startsWith('bwf_cap_'));
  const tiles = Object.values(room.layers).map(l => [l.name, l.getTileAt(0, 1)?.alpha]);
  const p = window.player;
  return { caps: imgs.length, capAlpha: imgs.map(i => i.alpha).slice(0, 3), depth: imgs[0]?.depth, playerDepth: p.depth, tiles, frame: imgs[0] && [imgs[0].frame.cutX, imgs[0].frame.cutY, imgs[0].frame.cutWidth, imgs[0].frame.cutHeight], pos: imgs[0] && [imgs[0].x, imgs[0].y] };
}, cfg.S);
console.log(ok ? 'faded' : 'NOT FADED', JSON.stringify(info));
await shot(page, `s5_${which}_${phase}`);
await browser.close();
