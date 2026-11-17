// Tests 5 and 6 (PLAN section 8): room tone per room, and the 60 s dwell.
//   node tools/playtest/m01-ol-tone.mjs <gameId> <tour|dwell> [port]
// Game: new-game.rb m01_first_contact --start-room main_office_area, with --unlock for every room on the tour.
// Chromium launches with --autoplay-policy=no-user-gesture-required (m01-ol-lib.mjs).
import { open, ev, dismiss } from './m01-ol-lib.mjs';
const [gid, mode, port = '3094'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
await h.t(6000);
log('sounds loaded', await ev(h, () => { const s = window.soundManager.sounds || {}; return { office_ambient: !!s.office_ambient, typing_loop: !!s.typing_loop, count: Object.keys(s).length, tone: !!window.officeRoomTone }; }));
const amb = () => ev(h, () => ({ room: window.currentPlayerRoom, current: window.soundManager.currentAmbient, choice: window.ambientChoice ? { room: window.ambientChoice.room, key: window.ambientChoice.key, level: window.ambientChoice.level, step: window.ambientChoice.step } : null }));
const go = async r => { await dismiss(h); const x = await ev(h, async r => await window.__test.enterRoom(r), r); if (!x.ok) log('enterRoom failed', { r, reason: x.reason }); return x.ok; };
const tlog = () => ev(h, () => window.officeRoomTone.log.map(e => ({ ...e, t: undefined })));
if (mode === 'tour') {
  const dwell = Number(process.env.DWELL || 4000);
  for (const r of ['it_room', 'server_room', 'it_room', 'main_office_area', 'break_room', 'conference_room', 'break_room', 'main_office_area', 'reception_area', 'main_office_area', 'hallway_east', 'storage_closet', 'hallway_east', 'maya_office', 'hallway_east', 'derek_office', 'hallway_east', 'main_office_area', 'hallway_west', 'kevin_office', 'hallway_west', 'manager_office']) {
    const ok = await go(r); await h.t(dwell);
    log('room', { r, ok, ...(await amb()) });
  }
  const L = await tlog();
  log('started entries', L.filter(e => e.what === 'started'));
  log('spot entries', L.filter(e => e.what === 'spot'));
} else {
  // dwell: needs clock must advance; spot entries in the three mapped rooms; typing count while an extra works
  const clock = () => ev(h, () => ({ clockMs: Math.round(window.npcNeedsSystem.clockMs), lastSlot: window.officeRoomTone.lastSlot }));
  for (const r of ['main_office_area', 'reception_area', 'break_room']) {
    if (r !== 'main_office_area' || (await amb()).room !== 'main_office_area') await go(r);
    await h.t(1500);
    const c0 = await clock(), t0 = Date.now(); let c1 = c0;
    const need = Number(process.env.NEEDS_SECS || 60);
    while ((c1.clockMs - c0.clockMs) < need * 1000 && Date.now() - t0 < 240000) { await h.t(2000); c1 = await clock(); }
    const L = (await tlog());
    log('dwell', { room: r, realSecs: Math.round((Date.now() - t0) / 1000), needsSecsAdvanced: Math.round((c1.clockMs - c0.clockMs) / 1000), slotAdvance: c1.lastSlot - c0.lastSlot, amb: await amb(),
      spotsInRoom: L.filter(e => e.what === 'spot' && e.room === r), typingInRoom: L.filter(e => e.what === 'typing' && e.room === r) });
  }
  log('all log', await tlog());
}
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
