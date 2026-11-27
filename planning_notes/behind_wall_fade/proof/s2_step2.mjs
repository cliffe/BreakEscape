import { open, loadRooms, dbg, shot } from './lib.mjs';
const gid = process.argv[2];
const { browser, page } = await open(gid);
await loadRooms(page, ['reception', 'server', 'office_n']);
const r = await page.evaluate(() => {
  const R = window.rooms, out = { pos: {}, doors: {}, objs: {} };
  for (const id of Object.keys(R)) out.pos[id] = R[id].position;
  for (const id of Object.keys(R)) for (const [k, d] of Object.entries(R[id].doorSprites || {})) out.doors[id + ':' + k] = { active: d.active, open: d.doorProperties?.open, to: d.doorProperties?.connectedRoom, x: d.doorProperties?.worldX, y: d.doorProperties?.worldY };
  const rec = R.reception;
  for (const [k, s] of Object.entries(rec.objects)) out.objs[k] = [Math.round(s.x - s.displayWidth * s.originX), Math.round(s.y - s.displayHeight * s.originY - rec.position.y), Math.round(s.displayWidth), Math.round(s.displayHeight), s.elevation, !!s._tableItems && [...s._tableItems].map(m => m.objectId || m.name)];
  out.light = window.lightingSystem ? { serverOn: window.lightingSystem.rooms.get('server')?.on } : 'no lighting';
  out.fadeState = window.behindWallFade.debugState();
  const npc = rec.npcSprites?.[0]; out.npc = npc && [npc.x, npc.y - rec.position.y, npc.displayHeight];
  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
