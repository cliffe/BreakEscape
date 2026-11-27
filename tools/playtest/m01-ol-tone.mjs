// Tests 5 and 6 (PLAN section 8): room tone per room, and the 60 s dwell.
//   node tools/playtest/m01-ol-tone.mjs <gameId> <tour|dwell> [port]
// Game: new-game.rb m01_first_contact --start-room main_office_area, with --unlock for every room on the tour.
// Chromium launches with --autoplay-policy=no-user-gesture-required (m01-ol-lib.mjs).
import { open, ev, dismiss } from './m01-ol-lib.mjs';
const [gid, mode, port = '3094'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
await h.t(6000);
// Pause-menu evidence (part 3): an in-page poll records each time #game-menu-overlay opens, with the room,
// the probe's step label (window.__probeStep) and the time since the last Escape keydown that reached the page.
// It only observes; it does not press anything. Opens during open() (the lib's load-time dismiss) are not seen.
await ev(h, () => {
  window.__probeStep = 'boot';
  window.__escAt = -1e9;
  window.__menuLog = [];
  window.addEventListener('keydown', e => { if (e.key === 'Escape') window.__escAt = performance.now(); }, true);
  let wasOpen = false;
  setInterval(() => {
    let id = null; try { id = window.__test.getState().blockingUi?.id || null; } catch (e) { /* bridge not ready */ }
    const isOpen = id === 'game-menu-overlay';
    if (isOpen && !wasOpen) window.__menuLog.push({ t: Math.round(performance.now()), room: window.currentPlayerRoom, step: window.__probeStep, msSinceEsc: Math.round(performance.now() - window.__escAt) });
    wasOpen = isOpen;
  }, 200);
});
const step = s => ev(h, s => { window.__probeStep = s; }, s);
log('sounds loaded', await ev(h, () => { const s = window.soundManager.sounds || {}; return { office_ambient: !!s.office_ambient, typing_loop: !!s.typing_loop, count: Object.keys(s).length, tone: !!window.officeRoomTone }; }));
const amb = () => ev(h, () => ({ room: window.currentPlayerRoom, current: window.soundManager.currentAmbient, choice: window.ambientChoice ? { room: window.ambientChoice.room, key: window.ambientChoice.key, level: window.ambientChoice.level, step: window.ambientChoice.step } : null }));
// Retry once after a pause: a transient overlay (toast, popup) can sit on the canvas centre for a moment.
// The failure payload is logged in full so a blocker that persists can be identified from the log.
// The lib's dismiss() presses Escape, which opens the game's PAUSED menu (#game-menu-overlay) when the
// blocker it was reacting to has already gone. That menu then blocks every enterRoom. So this probe
// closes the menu with its own Resume button and never sends Escape.
const clearMenu = async () => {
  const st = await ev(h, () => { const s = window.__test.getState(); return { mg: !!s.activeMinigame, ui: s.blockingUi ? (s.blockingUi.id || 'other') : null }; });
  if (st.ui === 'game-menu-overlay') {
    const r = await ev(h, () => window.__test.dismissBlockingUi('Resume'));
    log('cleared pause menu', { ok: r?.ok ?? null });
    await h.t(500);
  } else if (st.mg || st.ui) {
    await dismiss(h);
  }
};
const go = async r => {
  for (let attempt = 0; attempt < 2; attempt++) {
    await step('go ' + r + ' attempt ' + attempt);
    await clearMenu();
    let x;
    try { x = await ev(h, async r => await window.__test.enterRoom(r), r); } catch (e) { x = { ok: false, reason: 'probe-exception: ' + String(e).slice(0, 200) }; }
    if (x.ok) return true;
    log('enterRoom failed', { r, attempt, reason: x.reason, blockingUi: x.blockingUi ? { id: x.blockingUi.id, buttons: (x.blockingUi.buttons || []).map(b => b.label) } : null, hint: x.hint ?? null });
    await h.t(2500);
  }
  return false;
};
const tlog = () => ev(h, () => window.officeRoomTone.log.map(e => ({ ...e, t: undefined })));
if (mode === 'tour') {
  const dwell = Number(process.env.DWELL || 4000);
  for (const r of ['it_room', 'server_room', 'it_room', 'main_office_area', 'break_room', 'conference_room', 'break_room', 'main_office_area', 'reception_area', 'main_office_area', 'hallway_east', 'storage_closet', 'hallway_east', 'maya_office', 'hallway_east', 'derek_office', 'hallway_east', 'main_office_area', 'hallway_west', 'kevin_office', 'hallway_west', 'manager_office']) {
    const ok = await go(r); await step('tour dwell in ' + r); await h.t(dwell);
    log('room', { r, ok, ...(await amb()) });
  }
  const L = await tlog();
  log('started entries', L.filter(e => e.what === 'started'));
  log('spot entries', L.filter(e => e.what === 'spot'));
} else {
  // dwell: needs clock must advance; spot entries in the three mapped rooms; typing count while an extra works
  const clock = () => ev(h, () => ({ clockMs: Math.round(window.npcNeedsSystem.clockMs), lastSlot: window.officeRoomTone.lastSlot }));
  for (const r of ['main_office_area', 'reception_area', 'break_room']) {
    // reception_area has no door to break_room (the hint from enterRoom said so in game 7334), so route via the main office.
    if (r === 'break_room') await go('main_office_area');
    if (r !== 'main_office_area' || (await amb()).room !== 'main_office_area') await go(r);
    await step('dwell in ' + r);
    await h.t(1500);
    const c0 = await clock(), t0 = Date.now(); let c1 = c0;
    const need = Number(process.env.NEEDS_SECS || 60);
    while ((c1.clockMs - c0.clockMs) < need * 1000 && Date.now() - t0 < 240000) { await h.t(2000); c1 = await clock(); }
    const L = (await tlog());
    log('dwell', { room: r, realSecs: Math.round((Date.now() - t0) / 1000), needsSecsAdvanced: Math.round((c1.clockMs - c0.clockMs) / 1000), slotAdvance: c1.lastSlot - c0.lastSlot, amb: await amb(),
      spotsInRoom: L.filter(e => e.what === 'spot' && e.room === r), typingInRoom: L.filter(e => e.what === 'typing' && e.room === r),
      // added in part 3: the seated typists the typing loop counts (window.officeTypists), so a zero can be read as "none seated"
      typistsNow: await ev(h, () => { const m = window.officeTypists; return m ? Array.from(m.entries()).map(([k, v]) => ({ npc: k, room: v?.room ?? v?.roomId ?? null })) : null; }) });
  }
  log('all log', await tlog());
}
log('pause menu opens', await ev(h, () => window.__menuLog));
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
