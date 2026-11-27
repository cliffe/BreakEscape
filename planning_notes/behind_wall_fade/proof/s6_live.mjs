// Slice 6 live proof: cap band depth at S.y + 52 (feet show at 50%, stripe still gone).
// node s6_live.mjs <gameId> test|m01  -> s6_<which>_{faded,hidden,unfaded}.png + s6_<which>.json (geometry for the pixel analysis)
import fs from 'node:fs';
import { open, loadRooms, shot, sleep, here } from './lib.mjs';
const [gid, which] = process.argv.slice(2);
const OLD = process.env.OLD_BWF;   // serve the pre-s6 module to get the "old" shots (s6old_*)
const tag = OLD ? 's6old' : 's6';
const route = OLD ? async (page) => { await page.route('**/systems/behind-wall-fade.js*', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(OLD, 'utf8') })); } : null;
const { browser, page } = await open(gid, { route });
const E = (f, a) => page.evaluate(f, a);
const cfg = { test: { S: 'reception', N: 'hall', xs: [96, 280, 300], enter: 'office_n' }, m01: { S: 'reception_area', N: 'main_office_area', xs: [40, 170, 190, 290, 110, 60, 150], enter: 'main_office_area' } }[which];
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
await E(([x, y]) => window.game.cameras.main.centerOn(x, y), [Spos.x + 160, Spos.y + 20]);
await E(() => { window.player.body && 0; });
await sleep(page, 700);
const geo = await E((S) => {
  const cam = window.game.cameras.main, p = window.player, cv = (window.game.canvas || window.game.sys.game.canvas).getBoundingClientRect();
  const imgs = (window.game.children.list).filter(o => typeof o.frame?.name === 'string' && o.frame.name.startsWith('bwf_cap_'));
  const layerDepths = Object.entries(window.rooms[S].layers).map(([k, l]) => [k, l.depth]);
  const N = Object.values(window.rooms).filter(r => r !== window.rooms[S]).map(r => Object.values(r.layers || {}).map(l => l.depth)).flat().filter(d => d > window.rooms[S].position.y - 70 && d < window.rooms[S].position.y + 5);
  return { zoom: cam.zoom, scrollX: cam.scrollX, scrollY: cam.scrollY, cam: [cam.x, cam.y, cam.width, cam.height], canvas: [cv.left, cv.top, cv.width, cv.height],
    player: { x: p.x, y: p.y, depth: p.depth, bodyBottom: p.body.bottom, bodyCenterX: p.body.center.x, w: p.displayWidth, h: p.displayHeight, ox: p.originX, oy: p.originY },
    caps: imgs.length, capDepths: [...new Set(imgs.map(i => i.depth))], capAlpha: imgs.slice(0, 3).map(i => i.alpha), layerDepths, nLayerDepthsNearS: N,
    Spos: window.rooms[S].position };
}, cfg.S);
geo.faded = ok;
console.log(ok ? 'faded' : 'NOT FADED', JSON.stringify(geo));
await shot(page, `${tag}_${which}_faded`);
await E(() => window.player.setVisible(false)); await sleep(page, 300);
await shot(page, `${tag}_${which}_hidden`);
await E(() => window.player.setVisible(true));
await E(() => window.behindWallFade.setEnabled(false)); await sleep(page, 300);
await E(() => window.player.setVisible(false)); await sleep(page, 300);
await shot(page, `${tag}_${which}_unfaded`);
fs.writeFileSync(`${here}/${tag}_${which}.json`, JSON.stringify(geo, null, 1));
await browser.close();
