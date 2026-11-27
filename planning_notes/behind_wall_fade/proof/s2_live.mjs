// Slice 2 live proof (no lighting checks): steps 4-6, 8, 9, 11 of DESIGN.md section 12, plus the kill switch (12).
import { open, loadRooms, dbg, shot, sleep } from './lib.mjs';
const gid = process.argv[2], phase = process.argv[3] || 'main';
const results = [];
const check = (name, ok, info = '') => { results.push([ok, name]); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const { browser, page } = await open(gid, { query: phase === 'off' ? '&behindWallFade=off' : '' });
await loadRooms(page, ['reception', 'server', 'office_n']);
const E = (fn, arg) => page.evaluate(fn, arg);
const wait = (src) => E((s) => window.__test.waitUntil(s, { timeoutMs: 8000 }), src);
const tile = (room, kind, c, r) => E(([room, kind, c, r]) => { const l = Object.entries(window.rooms[room].layers).find(([k]) => k.includes('_' + kind + '_')); const t = l?.[1].getTileAt(c, r); return t ? { alpha: t.alpha, visible: t.visible } : null; }, [room, kind, c, r]);
const alpha = (room, id) => E(([room, id]) => { const s = window.rooms[room].objects[id]; return s ? { a: +s.alpha.toFixed(3), k: s.behindWallK } : null; }, [room, id]);
const state = () => E(() => window.behindWallFade.debugState());
const walkTo = async (x, y, dir = 'down') => { await E(([x, y]) => window.__test.moveTo(x, y), [x, y]); await E((d) => window.__test.walk(d, 2500), dir); };
const feet = () => E(() => ({ x: window.player.body.center.x, y: window.player.body.bottom, room: window.currentPlayerRoom }));

if (phase === 'off') {
  check('kill switch: enabled false', (await state()).enabled === false);
  await E(() => window.__test.enterRoom('office_n'));
  await walkTo(160, -100);
  await sleep(page, 600);
  console.log('feet', JSON.stringify(await feet()));
  const s = await state();
  check('kill switch: no state after walking to the hall wall', Object.keys(s.rooms).length === 0, JSON.stringify(await feet()));
  check('kill switch: wall opaque', (await tile('hall', 'room', 19, 0))?.alpha === 1);
  await shot(page, 's2_12_killswitch'); await browser.close(); process.exit(results.every(r => r[0]) ? 0 : 1);
}

// Step 4: hall from office_n
await E(() => window.__test.enterRoom('office_n'));
await walkTo(160, -100);
await wait('() => window.behindWallFade.debugState().rooms.hall?.k === 0.5');
console.log('feet', JSON.stringify(await feet()));
check('4 hall k = 0.5', (await state()).rooms.hall?.k === 0.5);
check('4 hall room layer (19,0) alpha 0.5 (beyond office_n)', (await tile('hall', 'room', 19, 0))?.alpha === 0.5);
check('4 hall walls layer (10,1) hidden', (await tile('hall', 'walls', 10, 1))?.visible === false);
const hose = await E(() => { const o = Object.values(window.rooms.hall.objects).find(s => /hose/i.test(s.name || s.texture?.key || '')); return o && { n: o.name, a: o.alpha }; });
check('4 hall hose reel at 0.5', hose?.a === 0.5, JSON.stringify(hose));
check('4 north_card untouched', (await alpha('office_n', 'north_card'))?.a === 1);
await shot(page, 's2_4_hall_from_office');

// Step 5: reception, closed door
await walkTo(48, 200);
await wait('() => window.behindWallFade.debugState().rooms.reception?.k === 0.5');
let st = await state();
check('5 only reception fades', Object.keys(st.rooms).join() === 'reception', JSON.stringify(st.rooms));
check('5 reception room (0,1) and (2,1) at 0.5', (await tile('reception', 'room', 0, 1))?.alpha === 0.5 && (await tile('reception', 'room', 2, 1))?.alpha === 0.5);
check('5 doorway cell (1,1) null', (await tile('reception', 'room', 1, 1)) === null);
const doors = await E(() => ['reception', 'hall'].flatMap(r => Object.values(window.rooms[r].doorSprites).map(d => [r, d.doorProperties.connectedRoom, d.alpha, d.behindWallK])));
check('5 door sprites solid, no behindWallK', doors.every(d => d[2] === 1 && d[3] === undefined), JSON.stringify(doors));
await shot(page, 's2_5_reception_closed_door');

// Step 6: reception objects
await walkTo(96, 200);
await wait('() => window.behindWallFade.debugState().rooms.reception?.k === 0.5');
console.log('step6 feet', JSON.stringify(await feet()), JSON.stringify((await state()).rooms));
const half = ['reception_picture9_65', 'reception_reception_table1_71', 'fade_pc', 'fade_safe_edge', 'fade_key', 'fade_elevated', 'fade_desk_note'];
for (const id of half) check('6 ' + id + ' at 0.5', (await alpha('reception', id))?.a === 0.5, JSON.stringify(await alpha('reception', id)));
for (const id of ['fade_safe_low', 'fade_floor_edge']) check('6 ' + id + ' unchanged', (await alpha('reception', id))?.a === 1);
check('6 fade_npc unchanged', await E(() => window.rooms.reception.npcSprites.every(s => s.alpha === 1)));
await shot(page, 's2_6_reception_objects');

// Step 8: seam
await walkTo(320, 200);
await wait('() => { const r = window.behindWallFade.debugState().rooms; return r.reception?.k === 0.5 && r.server?.k === 0.5; }');
check('8 seam: reception and server both fade', true);
await shot(page, 's2_8_seam');

// Step 9: doorway
await walkTo(48, 200);
await wait('() => window.behindWallFade.debugState().rooms.reception?.k === 0.5');
const op = await E(() => window.__test.interact('door:hall->reception'));
console.log('open door', JSON.stringify(op).slice(0, 160));
await wait('() => (window.behindWallFade.debugState().rooms.reception?.k ?? 1) === 1');
await E(() => { window.__poll = { ks: [], xs: [] }; window.__pollId = setInterval(() => { window.__poll.ks.push(window.behindWallFade.debugState().rooms.reception?.k ?? 1); window.__poll.xs.push(window.player.body.center.x); }, 16); });
await E(() => window.__test.walk('down', 4500));
await sleep(page, 300);
const poll = await E(() => { clearInterval(window.__pollId); return { ...window.__poll, room: window.currentPlayerRoom }; });
const validRun = poll.xs.every(x => Math.abs(x - 48) <= 25);
check('9 doorway run valid (centre within 48 +- 25)', validRun, `x range ${Math.min(...poll.xs).toFixed(0)}-${Math.max(...poll.xs).toFixed(0)}`);
check('9 reception k exactly 1 on every polled frame', poll.ks.every(k => k === 1), `${poll.ks.length} frames`);
check('9 player ended in reception', poll.room === 'reception', poll.room);
await shot(page, 's2_9_doorway_walk');
await E(() => window.__test.enterRoom('hall'));
await walkTo(88, 200);
await wait('() => window.behindWallFade.debugState().rooms.reception?.k === 0.5');
check('9 beside the open door reception fades', true);
await shot(page, 's2_9_beside_open_door');

// Step 11: restore
await walkTo(320, 120, 'up');
await wait('() => Object.keys(window.behindWallFade.debugState().rooms).length === 0');
const fin = await E(() => {
  const bad = [];
  for (const [rid, r] of Object.entries(window.rooms)) {
    for (const [k, s] of Object.entries(r.objects || {})) if (s.alpha !== 1 && !/ani/.test(k) && s.alpha !== undefined && s.visible) bad.push([rid, k, s.alpha]);
    for (const l of Object.values(r.layers || {})) for (let c = 0; c < 20; c++) for (let rr = 0; rr < 2; rr++) { const t = l.getTileAt(c, rr); if (t && (t.alpha !== 1 || !t.visible)) bad.push([rid, 'tile', c, rr]); }
    for (const d of Object.values(r.doorSprites || {})) if (d.alpha !== 1) bad.push([rid, 'door', d.alpha]);
  }
  return bad;
});
check('11 everything restored', fin.length === 0, JSON.stringify(fin.slice(0, 5)));
await shot(page, 's2_11_restored');
await browser.close();
process.exit(results.every(r => r[0]) ? 0 : 1);
