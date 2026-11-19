// m07 confirm minors live proof: (5) the substation map answers its first interact
// with the readable dialog; (2) Ray's contractor-list option leaves the hub once burned.
// usage: node m07-confirm-minors-proof.mjs map <gid> <port> | ray <gid> <port>
import { open, ev, dlg } from './m01-ol-lib.mjs';
const [mode, gid, port = '3214'] = process.argv.slice(2);
const h = await open(gid, port);
await ev(h, () => window.__test.throttleFps(20));
const log = (k, v) => console.log(k, JSON.stringify(v));
await h.t(3000);
log('close brief', await ev(h, () => { try { window.__test.minigame.close(); return true; } catch (e) { return String(e); } }));
await h.t(800);
if (mode === 'map') {
  log('room', await ev(h, () => window.currentPlayerRoom));
  log('move', await ev(h, () => window.__test.moveToNear('substation_map')));
  const snap = () => ev(h, () => ({
    overlays: [...document.querySelectorAll('[class*=modal],[class*=dialog],[class*=game-display],[class*=alert],[class*=toast],[class*=notification]')]
      .filter(e => e.offsetParent !== null).map(e => (e.className + ': ' + e.textContent.trim().slice(0, 160))),
    mg: window.__test.minigame.isActive(),
    notes: (window.gameState?.notes || window.notes || []).length
  }));
  log('before', await snap());
  log('interact', await ev(h, () => window.__test.interact('substation_map')));
  await h.t(600);
  log('after600ms', await snap());
  await h.page.screenshot({ path: process.env.OUT + '/map-first.png' });
  await h.t(5500);
  log('after6s', await snap());
}
if (mode === 'ray') {
  const pick = async re => { const r = await ev(h, p => window.__test.minigame.chooseMatching(p), re); await h.t(900); return r?.ok; };
  const ch = async () => (await dlg(h)).controls;
  log('move', await ev(h, () => window.__test.moveToNear('ray_hollis')));
  log('talk', (await ev(h, () => window.__test.interact('ray_hollis')))?.ok);
  await h.t(2500);
  log('d0', await dlg(h));
  for (let i = 0; i < 4 && !(await ch()).some(c => /contractor list/.test(c)); i++) { await ev(h, () => window.__test.minigame.continue?.()); await h.t(800); }
  log('choices1', await ch());
  log('pick bluff', await pick(/contractor list/));
  for (let i = 0; i < 6 && !(await ch()).some(c => /grid goes down/.test(c)); i++) { await ev(h, () => window.__test.minigame.continue?.()); await h.t(800); }
  log('choices2', await ch());
  log('contractor list still offered', (await ch()).some(c => /contractor list/.test(c)));
  await h.page.screenshot({ path: process.env.OUT + '/ray-after-bluff.png' });
}
log('errs', h.errs.filter(e => !/503|tts/i.test(e)));
await h.browser.close();
