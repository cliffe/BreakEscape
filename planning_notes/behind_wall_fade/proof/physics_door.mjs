// Doorway crossing hall -> server under each recipe. Usage: node physics_door.mjs <gid> <recipe> [probe]
import { open } from './lib.mjs';
const [gid, recipe = 'fps20', mode = 'walk'] = process.argv.slice(2);
process.env.NOFIX = '1';
const { browser, page } = await open(gid, { query: process.env.FADE_OFF ? '&behindWallFade=off' : '' });
const E = (fn, arg) => page.evaluate(fn, arg);
await E(() => window.loadRoom('server'));
await E((recipe) => {
  const g = window.game.sys.game, w = window.game.physics.world;
  if (recipe === 'fixedoff') { g.loop.smoothStep = false; g.loop.minFps = 1; w.fixedStep = false; }
  if (recipe === 'fps20') { g.loop.smoothStep = false; g.loop.minFps = 1; w.setFPS(20); }
}, recipe);
const info = await E(() => {
  const out = { doors: [], hallPos: window.rooms.hall.position, serverPos: window.rooms.server.position };
  for (const [id, r] of Object.entries(window.rooms)) for (const d of Object.values(r.doorSprites || r.doors || {})) { if (d && d.x !== undefined) out.doors.push([id, d.doorProperties?.connectedRoom || d.name || '', Math.round(d.x), Math.round(d.y), d.doorProperties?.locked, d.doorProperties?.open]); }
  return out;
});
console.log('INFO', JSON.stringify(info));
if (mode === 'probe') {
  // wall collision bodies in the hall near the server door
  const b = await E(() => {
    const r = window.rooms.hall, res = [];
    for (const o of (r.wallCollisionBoxes || r.wallBodies || [])) res.push([Math.round(o.x), Math.round(o.y), o.width || o.displayWidth, o.height || o.displayHeight]);
    return { keys: Object.keys(r), n: res.length, res: res.filter(a => a[1] > 280 && a[1] < 340) };
  });
  console.log('WALLS', JSON.stringify(b));
}
if (mode === 'walk' || mode === 'probe') {
  const near = await E(() => {
    const f = (r, id) => (r.wallCollisionBoxes || []).concat(r.collisionBodies || []).map(o => [id, Math.round(o.x), Math.round(o.y), Math.round(o.width || o.displayWidth), Math.round(o.height || o.displayHeight), o.name||''])
      .filter(a => a[1] > 540 && a[1] < 650 && a[2] > 230 && a[2] < 380);
    const pb = window.player.body;
    return { server: f(window.rooms.server, 'server'), hall: f(window.rooms.hall, 'hall'), playerBody: [pb.width, pb.height, pb.offset.x, pb.offset.y] };
  });
  console.log('NEAR', JSON.stringify(near));
  const dd = await E(() => { const d = window.rooms.hall.doorSprites; const k = Object.keys(d); return k.map(i => { const s = d[i]; return [i, Math.round(s.x), Math.round(s.y), s.displayWidth, s.displayHeight, !!s.body, s.body && s.body.enable, s.doorProperties && s.doorProperties.open]; }); });
  console.log('DOORS', JSON.stringify(dd));
  const who = await E(() => Object.entries(window.rooms.server.objects).filter(([k, o]) => o.y > 300 && o.y < 400 && o.x > 540 && o.x < 650).map(([k, o]) => [k, o.texture && o.texture.key, Math.round(o.x), Math.round(o.y), o.displayWidth, o.displayHeight, o.body && [o.body.x, o.body.y, o.body.width, o.body.height]]));
  console.log('SERVER_OBJS_NEAR_DOOR', JSON.stringify(who));
  if (process.env.REMOVE_BLOCKERS) await E(() => { for (const o of Object.values(window.rooms.server.objects)) if (o.y > 300 && o.y < 400 && o.x > 540 && o.x < 650 && o.body) o.body.enable = false; (window.rooms.server.collisionBodies||[]).forEach(b => { if (b.x>540&&b.x<650&&b.y>320&&b.y<400) { b.body ? b.body.enable=false : null; } }); });
  // open the door from a spot above it, then hold Down
  await E(() => window.player.setPosition(592, 250));
  await page.waitForTimeout(600);
  const o = await E(() => window.__test.interact('door:hall->server'));
  console.log('interact', JSON.stringify(o).slice(0, 200));
  await page.waitForTimeout(1200);
  await E(() => { window.__trace = []; window.game.events.on('postupdate', () => window.__trace.push([Math.round(window.player.body.center.x), Math.round(window.player.body.bottom)])); });
  await E(() => window.__test.walk('down', 4500));
  await page.waitForTimeout(300);
  const t = await E(() => ({ end: window.__trace[window.__trace.length - 1], room: window.currentPlayerRoom, n: window.__trace.length, ys: window.__trace.filter((_, i) => i % 6 === 0).map(a => a.join(',')) }));
  console.log('RESULT', recipe, JSON.stringify(t));
}
await browser.close();
