// Shared by the m02 flag-payoff takes (live04..live07). The drop-site's flag submission is done OFF CAMERA in the
// playtest session (the session resolves the <vmflag:REF> token from the real VM; the take rig cannot, and the flag
// station screen lists flag strings so it is never filmed). Each take then opens the reward the submission handed over,
// from the inventory tray, and holds on it. No flag value, password or PIN is on these pages (story text only).
// Marks: open:<id> {minigame}, hold-end:<id>, closed:<id>.
import { sleep, clearScreen } from '../lib/lib.mjs';

export async function payoffSetup(page, bridge, ids) {
  await clearScreen(page, bridge, () => {});
  const inv = ((await bridge.getState()).inventory || []).map(i => i.id || i.name);
  const missing = ids.filter(id => !inv.some(x => x === id || x.includes(id)));
  if (missing.length) throw new Error('not in the inventory: ' + missing.join(', ') + ' (have ' + inv.join(', ') + ')');
  await sleep(500);
}

export async function payoffRun(bridge, mark, id, holdMs, page) {
  await sleep(1200);
  const r = await bridge.openInventoryItem(id);
  if ((!r || !r.ok) && page) console.error('TRAY', JSON.stringify(await page.evaluate(() => ({ vw: innerWidth, vh: innerHeight, items: [...document.querySelectorAll('.inventory-item')].map(e => { const b = e.getBoundingClientRect(); return [e.alt || e.id, Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; }) }))));
  if (!r || !r.ok) throw new Error('could not open ' + id + ' ' + JSON.stringify(r).slice(0, 300));
  await sleep(400);
  const mg = (await bridge.getState()).activeMinigame;
  mark('open:' + id, { minigame: mg && mg.id });
  await sleep(holdMs);
  mark('hold-end:' + id);
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
  mark('closed:' + id);
  await sleep(900);
}
