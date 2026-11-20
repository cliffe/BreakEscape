// Test 9 reload half: on a game already past entropy_reveal_read, reload, assert the extras stay hidden
// (restored from npcVisibility) before and after the onceOnly re-hides fire. node ... <gameId> [port] [shotDir]
import { open, ev, dismiss } from './m01-ol-lib.mjs';
const [gid, port = '3094', shotDir = 'tmp'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
const snap = () => ev(h, () => ({ room: window.currentPlayerRoom, reveal: window.gameState.globalVariables.entropy_reveal_read,
  npcs: Object.fromEntries(['fatima_begum', 'graham_whitfield'].map(i => { const b = window.npcBehaviorManager.getBehavior(i); return [i, { vis: !!b.sprite.visible, seat: !!b._seat, mode: window.__test.needs.state(i)?.mode ?? null }]; })) }));
await h.t(8000);
log('after reload', await snap());
await h.page.screenshot({ path: `${shotDir}/evening-after-reload.png` });
for (const r of ['it_room', 'server_room', 'it_room', 'main_office_area']) { const x = await ev(h, async r => await window.__test.enterRoom(r), r); await h.t(1500); await dismiss(h); log('enter ' + r, { ok: x?.ok, ...(await snap()) }); }
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
