// Steps 2 and 7: both extras at their desks, one pc sprite per Tiled pc, typing log, screenshot.
//   node tools/playtest/m01-ol-seats.mjs <gameId> [port] [shotPath]
import { open, ev } from './m01-ol-lib.mjs';
const [gid, port = '3094', shot = 'tmp/m01-seats.png'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
await h.t(20000);
log('needs', await ev(h, () => ['fatima_begum', 'graham_whitfield'].map(i => { const s = window.__test.needs.state(i); return s && { id: i, mode: s.mode, atPost: s.atPost, job: s.job && { obj: s.job.objectId, phase: s.job.phase, need: s.job.need }, levels: s.levels || s.needs }; })));
log('pcs', await ev(h, () => Object.values(window.rooms.main_office_area.objects || {}).filter(o => /^pc/.test(o.texture?.key || '') || /pc/.test(o.scenarioData?.type || '')).map(o => ({ key: o.texture?.key, id: o.scenarioData?.id || null, x: +(o.x / 32).toFixed(2), y: +(o.y / 32).toFixed(2) }))));
log('chairs', await ev(h, () => (window.chairs || []).filter(c => c.texture?.key?.startsWith('chair-white-2')).map(c => ({ k: c.texture.key, cx: Math.round(c.body?.center?.x ?? c.x), cy: Math.round(c.body?.center?.y ?? c.y), bottom: Math.round(c.body?.bottom ?? 0) }))));
log('bodies', await ev(h, () => ['fatima_begum', 'graham_whitfield'].map(i => { const b = window.npcBehaviorManager.getBehavior(i); const s = b?.sprite; return { i, x: Math.round(s.body.center.x), y: Math.round(s.body.center.y), seatStop: b._seatStopKey || null, seated: !!(b.isSeated || b._seated || s._seated), anim: s.anims?.currentAnim?.key || null }; })));
log('typing log', await ev(h, () => (window.officeRoomTone?.log || []).slice(-12)));
log('tone', await ev(h, () => ({ room: window.currentPlayerRoom, amb: window.soundManager?.currentAmbient })));
await h.page.screenshot({ path: shot });
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
