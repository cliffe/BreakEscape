// Live proof for D254 M-C: Delphine's follow-through bark (ca14) is cut by `done` 5 s after `moved`.
// Usage: node tools/playtest/ca14-bubble-cut-proof.mjs <gameId> <port> <outPrefix>
// Seeds kit_quiet / kit_ca14_out, then writes photo_choice "post" (the wrong answer) through
// window.stateSync.writeGlobal and samples the bubble state and screenshots as the chain runs.
import { open, dismiss, ev } from './m01-ol-lib.mjs';
const [gid, port, out] = process.argv.slice(2);
const h = await open(gid, port);
await ev(h, () => window.__test.throttleFps?.(20));
await dismiss(h);
const wg = (n, v) => ev(h, ([n, v]) => window.stateSync.writeGlobal(n, v), [n, v]);
await wg('kit_quiet', true);
await wg('kit_ca14_out', true);
await h.t(7000);
await dismiss(h);
const t0 = Date.now();
await wg('kit_ca14_photo_choice', 'post');
const seen = [];
let shots = 0;
for (let i = 0; i < 70; i++) {
  const s = await ev(h, () => {
    const b = window.npcWorldBubbles, st = b?.says?.get('kit_delphine_arvanitis');
    const g = (n) => window.gameState?.globalVariables?.[n];
    return { st: st ? { page: st.page, pages: st.pages.length, text: st.pages[st.page], times: st.times } : null, moved: g('kit_ca14_moved'), done: g('kit_ca14_done'),
      log: (b?.log || []).filter(e => e.npcId === 'kit_delphine_arvanitis').slice(-3).map(e => e.event) };
  });
  const t = ((Date.now() - t0) / 1000).toFixed(1);
  seen.push({ t, ...s });
  if (s.st && shots < 8 && i % 3 === 0) { await h.page.screenshot({ path: `${out}_${String(shots++)}_t${t}.png` }); }
  await h.t(250);
}
let last = '';
for (const r of seen) { const k = JSON.stringify([r.st?.page, r.st?.text, r.moved, r.done, r.log.at(-1)]); if (k !== last) console.log(r.t, k); last = k; }
console.log('errs', h.errs.slice(0, 3));
await h.browser.close();
