// R3 fixes live proof: the tour_notice board fits the modal without scrolling.
//   PORT=3094 node tools/playtest/showcase-r3fix-board.mjs <gameId>
// Keyless server, headless, setFPS(20) with fixed steps on (lib open), POST /tts aborted by the lib's
// URL predicate. Screenshot goes to planning/screens/r3fix-board.png.
import fs from 'node:fs';
import { start, ev, waitAtPost, NPCS, PORT, OUT } from './showcase-s4-lib.mjs';

const gid = process.argv[2];
if (!gid) { console.error('usage: PORT=3094 node tools/playtest/showcase-r3fix-board.mjs <gameId>'); process.exit(2); }
const R = { gid, port: PORT };
const h = await start(gid);
try {
  for (const id of NPCS) await waitAtPost(h, id, 60000);
  await h.t(1500);
  R.move = await ev(h, () => window.__test.moveToNear('tour_notice', { timeoutMs: 30000 })).then(() => 'ok', e => String(e));
  const ir = await ev(h, () => window.__test.interact('tour_notice')).catch(e => ({ ok: false, err: String(e) }));
  R.interact = ir?.ok ?? ir;
  await h.t(1500);
  R.metrics = await h.page.evaluate(() => {
    const d = document.querySelector('.game-display-dialog');
    const b = document.querySelector('.game-display-body');
    if (!d || !b) return null;
    const r = d.getBoundingClientRect();
    return { bodyScrollH: b.scrollHeight, bodyClientH: b.clientHeight, dialogScrollH: d.scrollHeight,
      dialogClientH: d.clientHeight, dialogTop: Math.round(r.top), dialogBottom: Math.round(r.bottom),
      viewportH: innerHeight, bodyText: b.innerText };
  });
  if (R.metrics) {
    await h.page.locator('.game-display-dialog').screenshot({ path: `${OUT}/r3fix-board.png` });
    const m = R.metrics;
    R.verdict = m.bodyScrollH <= m.bodyClientH && m.dialogScrollH <= m.dialogClientH && m.dialogBottom <= m.viewportH &&
      /Evening:/.test(m.bodyText) && /Walk into the kitchen/.test(m.bodyText) ? 'PASS' : 'FAIL';
  } else R.verdict = 'FAIL (no modal)';
} catch (e) { R.fatal = String(e).slice(0, 400); }
finally {
  fs.mkdirSync('tmp/r3fix', { recursive: true });
  fs.writeFileSync(`tmp/r3fix/board-${gid}.json`, JSON.stringify(R, null, 1));
  console.log(JSON.stringify(R, null, 1));
  await h.browser.close();
}
