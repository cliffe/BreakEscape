// Slice 4 probe: does a cropped frame of a dynamic texture sample the right rows, and does a second batch
// without clear composite as w*L_N + (1-w)*L_S? node s4_probe.mjs <gid> [yOverride]
import { open, loadRooms } from './lib.mjs';
const { browser, page } = await open(process.argv[2]);
const out = await page.evaluate(() => {
  const ls = window.lightingSystem, rt = ls.lightMap, tm = ls.scene.textures;
  const BLOCK = 'be_light_block';
  const px = (t, x, y) => { let r; t.snapshotPixel(x, y, (c) => { r = [c.r, c.g, c.b, c.a]; }); return r; };
  const probe = tm.addDynamicTexture('be_light_probe', rt.width, rt.height);
  const fill = (t, x, y, w, h, tint) => t.stamp(BLOCK, null, x, y, { originX: 0, originY: 0, tint, scaleX: w / 8, scaleY: h / 8, skipBatch: true });
  const bsz = tm.get(BLOCK).getSourceImage().width;
  const fill2 = (t, x, y, w, h, tint) => t.stamp(BLOCK, null, x, y, { originX: 0, originY: 0, tint, scaleX: w / bsz, scaleY: h / bsz, skipBatch: true });
  probe.clear(); probe.beginDraw();
  fill2(probe, 0, 0, rt.width, rt.height, 0x000000);
  fill2(probe, 20, 10, 16, 4, 0xff0000);
  fill2(probe, 20, 14, 16, 4, 0x0000ff);
  fill2(probe, 20, 18, 16, 8, 0x00ff00);
  probe.stamp(BLOCK, null, 0, 0, { blendMode: Phaser.BlendModes.ADD, tint: 0, alpha: 1, scale: 1, skipBatch: true });
  probe.endDraw();
  const res = { w: rt.width, h: rt.height, bsz };
  res.probe = { red: px(probe, 24, 11), blue: px(probe, 24, 16), green: px(probe, 24, 20), black: px(probe, 60, 12) };
  const pts = { a: [24, 11], b: [24, 16], c: [60, 12], d: [24, 22] };
  const read = () => Object.fromEntries(Object.entries(pts).map(([k, [x, y]]) => [k, px(rt, x, y)]));
  res.before = read();
  const fy = (window.__probeY ?? 10);
  probe.add('crop', 0, 20, fy, 16, 8);
  rt.beginDraw();
  rt.stamp('be_light_probe', 'crop', 20, 10, { originX: 0, originY: 0, alpha: 0.5, tint: 0xffffff, blendMode: Phaser.BlendModes.NORMAL, skipBatch: true });
  rt.endDraw();
  res.after = read();
  // Second case: the destination is a mid grey (0x404040), not white; the mix must still be 0.5*src + 0.5*grey.
  const bsz2 = bsz;
  rt.beginDraw();
  rt.stamp(BLOCK, null, 20, 40, { originX: 0, originY: 0, tint: 0x404040, scaleX: 16 / bsz2, scaleY: 8 / bsz2, skipBatch: true });
  rt.endDraw();   // NORMAL last: an ADD last would copy back as ADD (white + grey = white)
  res.greyBefore = [px(rt, 24, 41), px(rt, 24, 46)];
  rt.beginDraw();
  rt.stamp('be_light_probe', 'crop', 20, 40, { originX: 0, originY: 0, alpha: 0.5, tint: 0xffffff, blendMode: Phaser.BlendModes.NORMAL, skipBatch: true });
  rt.endDraw();
  res.greyAfter = [px(rt, 24, 41), px(rt, 24, 46)];
  tm.remove('be_light_probe');
  return res;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
