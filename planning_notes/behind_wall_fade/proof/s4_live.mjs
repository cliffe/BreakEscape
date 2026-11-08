// Slice 4 live proof (lighting): DESIGN.md section 12 steps 3, 4, 7, 8, 9, 10, 12, 13.
// node s4_live.mjs <gid> main|off|rm
import fs from 'node:fs';
import { open, loadRooms, shot, sleep, here } from './lib.mjs';
import path from 'node:path';
const [gid, phase = 'main'] = process.argv.slice(2);
const stateFile = path.join(here, 's4_state.json');
const saved = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const { browser, page } = await open(gid, { query: phase === 'off' ? '&behindWallFade=off' : '', reducedMotion: phase === 'rm' ? 'reduce' : null });
await loadRooms(page, ['reception', 'server', 'office_n']);
const E = (fn, arg) => page.evaluate(fn, arg);
const wait = (src, ms = 8000) => E(([s, ms]) => window.__test.waitUntil(s, { timeoutMs: ms }), [src, ms]);
const moveTo = (x, y) => E(([x, y]) => window.__test.moveTo(x, y), [x, y]);
const walk = (d, ms = 4500) => E(([d, ms]) => window.__test.walk(d, ms), [d, ms]);
await E(() => {
  window.lightAt = (wx, wy) => { const m = window.lightingSystem.lightMap; let r = null;
    if (wx < m.x || wy < m.y || wx >= m.x + m.width * 2 || wy >= m.y + m.height * 2) throw new Error('lightAt outside the light map: ' + wx + ',' + wy + ' map ' + m.x + ',' + m.y);
    m.texture.snapshotPixel(Math.floor((wx - m.x) * 0.5), Math.floor((wy - m.y) * 0.5), (c) => { r = [c.r, c.g, c.b]; }); return r; };
  window.luma = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  // distance of a point beyond every emitter's reach: min over emitters of (dist to centre - (radius + 8))
  window.margin = (ids, x, y) => { let best = Infinity, who = null; for (const id of ids) for (const e of window.lightingSystem.rooms.get(id).emitters) {
    if (!e.def || !e.obj?.getCenter) continue; const c = e.obj.getCenter(); const d = Math.hypot(c.x + (e.def.offsetX || 0) - x, c.y + (e.def.offsetY || 0) - y) - (e.def.radius + 8);
    if (d < best) { best = d; who = e.key; } } return [best, who]; };
  window.pickX = (ids, y, lo, hi, avoid, minFrom) => { let bx = null, bm = -Infinity; for (let x = lo; x <= hi; x += 2) { if (Math.abs(x - avoid) < minFrom) continue; const [m] = window.margin(ids, x, y); if (m > bm) { bm = m; bx = x; } } return [bx, bm]; };
});
const lightAt = (x, y) => E(([x, y]) => window.lightAt(x, y), [x, y]);
const luma = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
const maxDiff = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
const segs = () => E(() => window.lightingSystem.stripBlendDebug().segments);
const fadeState = () => E(() => window.behindWallFade.debugState());
const feet = () => E(() => ({ x: Math.round(window.player.body.center.x), y: Math.round(window.player.body.bottom), room: window.currentPlayerRoom }));
const lightsOn = (id) => E((id) => window.lightingSystem.rooms.get(id).on, id);
// the camera can lag the player after a teleport or a room change: centre it, then let lighting redraw
const focus = async () => { await E(() => { const c = window.lightingSystem.scene.cameras.main; c.centerOn(window.player.x, window.player.y); }); await sleep(page, 400); };
// enterRoom walks through the door; when it cannot cross (the server doorway), place the player instead
const goRoom = async (room, x, y) => {
  await E((r) => window.__test.enterRoom(r), room).catch(() => {});
  await sleep(page, 500);
  if ((await E(() => window.currentPlayerRoom)) !== room) { await E(([x, y]) => window.player.setPosition(x, y), [x, y]); await sleep(page, 800); }
  console.log('goRoom', room, JSON.stringify(await feet()));
};
const set = (k, v) => { saved[k] = v; fs.writeFileSync(stateFile, JSON.stringify(saved, null, 1)); };

if (phase === 'main') {
  // ---- step 3: calibration ----
  await moveTo(440, 200); await sleep(page, 600);
  const [xs, marg] = await E(() => window.pickX(['server'], 300, 330, 550, 440, 60));
  const B0 = await lightAt(xs, 240), C0 = await lightAt(xs, 400), A0 = await lightAt(xs, 300);
  console.log('3 x_s', xs, 'margin', marg.toFixed(1), 'A0', A0, 'B0', B0, 'C0', C0);
  check('3 B bright (luma > 0.6) and C dark (< 0.2)', luma(B0) > 0.6 && luma(C0) < 0.2, `B ${luma(B0).toFixed(2)} C ${luma(C0).toFixed(2)}`);
  check('3 server lights off', (await lightsOn('server')) === false);
  await shot(page, 's4_7_1_unfaded');

  // ---- step 7: server strip in the hall's light ----
  await E(() => { window.__rm0 = window.lightingSystem.reducedMotion; window.lightingSystem.reducedMotion = true; });
  await sleep(page, 300);
  const A1 = await lightAt(xs, 300), B1 = await lightAt(xs, 240), C1 = await lightAt(xs, 400);
  // sample A every 30 ms through the walk
  await E(([x]) => { window.__samples = []; window.__sid = setInterval(() => window.__samples.push([performance.now(), window.luma(window.lightAt(x, 300)), window.behindWallFade.debugState().rooms.server?.k ?? 1]), 30); }, [xs]);
  await walk('down', 4500);
  await wait('() => window.behindWallFade.debugState().rooms.server?.k === 0.5');
  await sleep(page, 80);
  const samples = await E(() => { clearInterval(window.__sid); return window.__samples; });
  const A2 = await lightAt(xs, 300), B2 = await lightAt(xs, 240), C2 = await lightAt(xs, 400);
  console.log('7 feet', JSON.stringify(await feet()), 'A', A1, '->', A2, 'B', B1, '->', B2, 'C', C1, '->', C2);
  const sg = await segs();
  console.log('7 segments', JSON.stringify(sg));
  check('7 server lights still off', (await lightsOn('server')) === false);
  check('7 segment server under hall x 320 w 320 weight 1', sg.some(g => g.south === 'server' && g.north === 'hall' && g.x === 320 && g.w === 320 && g.weight === 1), JSON.stringify(sg.map(g => [g.south, g.north, g.x, g.w, g.weight])));
  check('7 A at least 3x unfaded luma', luma(A2) >= 3 * luma(A1), `${luma(A1).toFixed(3)} -> ${luma(A2).toFixed(3)}`);
  check('7 A at least 0.6x B luma', luma(A2) >= 0.6 * luma(B2), `A ${luma(A2).toFixed(3)} B ${luma(B2).toFixed(3)}`);
  check('7 C unchanged within 6/255', maxDiff(C1, C2) <= 6, `${C1} -> ${C2}`);
  const rise = samples.filter(s => s[2] < 1 || true).map(s => s[1]);
  let falls = 0; for (let i = 1; i < rise.length; i++) if (rise[i] < rise[i - 1] - 0.01) falls++;
  console.log('7 A samples (luma)', rise.filter((_, i) => i % 6 === 0).map(v => v.toFixed(2)).join(' '), `n=${rise.length}`);
  check('7 A rises without falling back (30 ms samples)', falls === 0 && rise[rise.length - 1] > rise[0] * 3, `falls ${falls}, n ${rise.length}`);
  await shot(page, 's4_7_2_faded');
  await E(() => { window.lightingSystem.reducedMotion = window.__rm0; });
  // brownout: the strip follows the hall
  await E(() => window.lightingSystem.dip({ level: 0.5, ms: 1600 }));
  const dipS = []; for (let i = 0; i < 40; i++) { dipS.push([luma(await lightAt(xs, 300)), luma(await lightAt(xs, 240))]); await sleep(page, 50); }
  const sA = dipS[0][0], sB = dipS[0][1], mA = Math.min(...dipS.map(d => d[0])), mB = Math.min(...dipS.map(d => d[1]));
  console.log('7 dip startA', sA.toFixed(3), 'minA', mA.toFixed(3), 'startB', sB.toFixed(3), 'minB', mB.toFixed(3));
  check('7 brownout: |minA/startA - minB/startB| <= 0.15', Math.abs(mA / sA - mB / sB) <= 0.15, `${(mA / sA).toFixed(3)} vs ${(mB / sB).toFixed(3)}`);
  await sleep(page, 800);
  // through the door into the server
  await moveTo(592, 200); await sleep(page, 300);
  await walk('down', 4000);
  const op = await E(() => window.__test.interact('door:hall->server'));
  await sleep(page, 800);
  // Deviation: the hall/server doorway does not let the player cross (feet stop at y 320 with the door open,
  // with the fade off too: not a fade bug), so place the player on the server floor, as the m04 walk did.
  await E(() => { const p = window.rooms.server.position; window.player.setPosition(592, p.y + 190); });
  await wait('() => !window.behindWallFade.debugState().rooms.server', 5000).catch(() => {});
  await sleep(page, 500);
  console.log('7 after door', JSON.stringify(await feet()), 'on', await lightsOn('server'));
  check('7 in the server: lights strike, fade gone, no segments', (await lightsOn('server')) === true && !(await fadeState()).rooms.server && (await segs()).length === 0, JSON.stringify(await feet()));
  await shot(page, 's4_7_3_in_server');

  // ---- step 8: seam ----
  await goRoom('hall', 320, 150);
  await E(() => window.lightingSystem.switchOff('server')); await sleep(page, 600);
  await moveTo(320, 200); await walk('down', 4500);
  await wait('() => { const r = window.behindWallFade.debugState().rooms; return r.reception?.k === 0.5 && r.server?.k === 0.5; }');
  await sleep(page, 150);
  await focus();
  const sg8 = await segs();
  console.log('8 segments', JSON.stringify(sg8.map(g => [g.south, g.north, g.x, g.w, g.weight])));
  const has = (s, n, x, w) => sg8.some(g => g.south === s && g.north === n && g.x === x && g.w === w && g.weight === 1);
  check('8 seam segments: reception x0 w320; server x320 w256 and x608 w32', has('reception', 'hall', 0, 320) && has('server', 'hall', 320, 256) && has('server', 'hall', 608, 32), '');
  await shot(page, 's4_8_seam');

  // ---- step 4: hall from office_n ----
  await goRoom('office_n', 160, -100);
  await moveTo(160, -100); await walk('down', 4500);
  await wait('() => window.behindWallFade.debugState().rooms.hall?.k === 0.5');
  await sleep(page, 150);
  await focus();
  const sg4 = await segs();
  console.log('4 feet', JSON.stringify(await feet()), 'segments', JSON.stringify(sg4.map(g => [g.south, g.north, g.x, g.w, g.weight])));
  const hallSegs = sg4.filter(g => g.south === 'hall' && g.north === 'office_n');
  check('4 two segments x0 w32 and x64 w256 weight 1', hallSegs.length === 2 && hallSegs.some(g => g.x === 0 && g.w === 32 && g.weight === 1) && hallSegs.some(g => g.x === 64 && g.w === 256 && g.weight === 1), JSON.stringify(hallSegs.map(g => [g.x, g.w])));
  const [x4, m4] = await E(() => window.pickX(['office_n'], 40, 220, 310, 160, 60));
  const A4 = await lightAt(x4, 40), B4 = await lightAt(x4, -20);
  console.log('4 x', x4, 'margin', m4.toFixed(1), 'A', A4, 'B', B4);
  check('4 A matches B within 6/255 (strip is office_n\'s dark light)', maxDiff(A4, B4) <= 6, `${A4} vs ${B4}`);
  const far = await lightAt(480, 40); set('beyond480', far);
  console.log('4 (480,40) =', far);
  const dr = await E(() => Object.values(window.rooms.office_n.doorSprites).concat(Object.values(window.rooms.hall.doorSprites)).filter(d => /hall|office_n/.test(d.doorProperties.connectedRoom)).map(d => [d.doorProperties.connectedRoom, d.x, d.y, d.active, d.doorProperties.open]));
  console.log('4 doors', JSON.stringify(dr));
  for (const pt of [[48, -30], [48, -6], [48, 10], [48, 40], [80, -3], [80, 3], [100, -3], [100, 3], [130, 3]]) console.log('4 spill probe', pt, JSON.stringify(await lightAt(...pt)));
  const spillIn = await lightAt(100, 3), spillOut = await lightAt(100, -3);
  check('4 spill pool continues into the strip within 6/255', maxDiff(spillIn, spillOut) <= 6, `${spillIn} vs ${spillOut}`);
  const f4 = await feet();
  const torch = await lightAt(f4.x, f4.y + 6 - 0);
  const pl = await E(() => ({ x: window.player.x, y: window.player.y }));
  const torchPt = await lightAt(pl.x, pl.y + 6);
  console.log('4 torch pt', torchPt, 'luma', luma(torchPt).toFixed(3), 'A luma', luma(A4).toFixed(3));
  check('4 torch pool centre brighter than A', luma(torchPt) > luma(A4));
  await shot(page, 's4_4_hall_from_office');

  // ---- step 9: beside the open door (segments) ----
  await goRoom('hall', 320, 150);
  await moveTo(48, 200); await walk('down', 3000);
  await wait('() => window.behindWallFade.debugState().rooms.reception?.k === 0.5');
  await E(() => window.__test.interact('door:hall->reception'));
  await wait('() => (window.behindWallFade.debugState().rooms.reception?.k ?? 1) === 1');
  await goRoom('hall', 320, 150);
  await moveTo(88, 200); await walk('down', 4500);
  await wait('() => window.behindWallFade.debugState().rooms.reception?.k === 0.5');
  await sleep(page, 150);
  await focus();
  const sg9 = (await segs()).filter(g => g.south === 'reception');
  console.log('9 feet', JSON.stringify(await feet()), 'segments', JSON.stringify(sg9.map(g => [g.north, g.x, g.w])));
  check('9 reception fades beside the open door; segments exclude x 32-64', sg9.length >= 1 && sg9.every(g => g.x + g.w <= 32 || g.x >= 64) && sg9.some(g => g.x === 0 && g.w === 32) && sg9.some(g => g.x === 64), JSON.stringify(sg9.map(g => [g.x, g.w])));
  await shot(page, 's4_9_beside_open_door');

  // ---- step 10: resize ----
  await E(() => { window.__rm0 = window.lightingSystem.reducedMotion; window.lightingSystem.reducedMotion = true; });
  const [x10, m10] = await E(() => window.pickX(['hall', 'reception'], 300, 100, 310, 88, 60));
  await sleep(page, 300);
  await focus();
  const R0 = await lightAt(x10, 300);
  const w0 = await E(() => window.lightingSystem.lightMap.width);
  await E(() => window.game.scale.resize(window.game.scale.width + 64, window.game.scale.height));
  await sleep(page, 400);
  const w1 = await E(() => window.lightingSystem.lightMap.width);
  const R1 = await lightAt(x10, 300);
  console.log('10 x', x10, 'margin', m10.toFixed(1), 'width', w0, '->', w1, 'A\'', R0, '->', R1);
  check('10 light map width changed', w1 !== w0, `${w0} -> ${w1}`);
  check('10 A\' within 6/255 after resize, not black', maxDiff(R0, R1) <= 6 && luma(R1) > 0.02, `${R0} -> ${R1}`);
  await shot(page, 's4_10_resized');
  await E(() => window.game.scale.resize(window.game.scale.width - 64, window.game.scale.height));
  await sleep(page, 300);
  const R2 = await lightAt(x10, 300);
  check('10 and back again within 6/255', maxDiff(R0, R2) <= 6, `${R0} -> ${R2}`);
  await E(() => { window.lightingSystem.reducedMotion = window.__rm0; });
  set('xs', xs); set('A1', A1);
}

if (phase === 'off') {
  const xs = saved.xs ?? 456;
  check('12 enabled false', (await fadeState()).enabled === false);
  await goRoom('office_n', 160, -100);
  await moveTo(160, -100); await walk('down', 4500); await sleep(page, 600);
  const far = await lightAt(480, 40);
  console.log('12 (480,40)', far, 'main run', saved.beyond480);
  check('12 no fade state and no segments in the office_n walk', Object.keys((await fadeState()).rooms).length === 0 && (await segs()).length === 0);
  if (saved.beyond480) check('12 (480,40) matches the fade-on value within 6/255', maxDiff(far, saved.beyond480) <= 6, `${far} vs ${saved.beyond480}`);
  await goRoom('hall', 320, 150);
  await E(() => { window.lightingSystem.reducedMotion = true; });
  await moveTo(440, 200); await sleep(page, 500);
  const A1 = await lightAt(xs, 300);
  await walk('down', 4500); await sleep(page, 600);
  const A2 = await lightAt(xs, 300);
  console.log('12 server strip A', A1, '->', A2, 'x_s', xs, JSON.stringify(await feet()));
  check('12 A stays at its unfaded value (within 6/255)', maxDiff(A1, A2) <= 6 && (await segs()).length === 0, `${A1} -> ${A2}`);
  await shot(page, 's4_12_killswitch');
}

if (phase === 'rm') {
  check('13 reduced motion emulated', await E(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
  await goRoom('hall', 320, 150);
  await moveTo(440, 200); await sleep(page, 500);
  await E(() => { window.__ser = []; const tick = () => { const st = window.behindWallFade.debugState().rooms.server; window.__ser.push([performance.now(), st?.k ?? 1, window.lightingSystem.stripBlendDebug().segments.map(g => g.weight)[0] ?? 0]); window.__rid = requestAnimationFrame(tick); }; tick(); });
  await walk('down', 4500); await sleep(page, 300);
  const ser = await E(() => { cancelAnimationFrame(window.__rid); return window.__ser; });
  const ks = ser.map(s => s[1]); const first = ks.findIndex(k => k < 1);
  console.log('13 k series around the change', ks.slice(Math.max(0, first - 2), first + 4).join(', '), 'weights', ser.slice(first, first + 6).map(s => s[2]).join(', '));
  const tK = ser[first][0], iW = ser.findIndex(s => s[2] === 1), tW = ser[iW]?.[0];
  check('13 k goes 1 -> 0.5 in one step', ks[first] === 0.5 && ks[first - 1] === 1, `${ks[first - 1]} -> ${ks[first]}`);
  check('13 segment weight 1 within one redraw (<= 50 ms) of the k change', iW >= 0 && tW - tK <= 50, `${(tW - tK).toFixed(1)} ms`);
  await shot(page, 's4_13_reduced_motion');
}
await browser.close();
process.exit(results.every(Boolean) ? 0 : 1);
