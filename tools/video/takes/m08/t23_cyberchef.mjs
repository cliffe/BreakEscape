// t23_cyberchef (m08, keyless, NOT YET RUN): the real-tool shot. CyberChef in the in-game laptop overlay with a neutral ROT13 test sentence (m03/m04 pattern: window.openCryptoWorkstation, no pickup or preload). Player not visible. The 'panes' mark logs the pane rectangles for the crop. The cryptography_lab workstation object is the in-world source; Nightshade is in the room, so the overlay is opened without walking to it.
// Entry state (new-game): --imports=none --start-room cryptography_lab --set briefing_played=true --set brief_taken=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh daniel_seo t23_cyberchef "<flags>" "--hide-hud --zoom-step 1"
// Marks: workstation-open, cyberchef-ready, input-set, panes, linger-end, laptop-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
const ENCODED = 'Uryyb, jbeyq. Guvf vf n grfg bs gur gbby.';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1200);
  const o = await page.evaluate(() => { if (!window.openCryptoWorkstation) return false; window.openCryptoWorkstation(); return true; });
  mark('workstation-open', { ok: o }); if (!o) throw new Error('openCryptoWorkstation not available');
  await sleep(4000); mark('cyberchef-ready');
  const r = await bridge.setCyberChefInput(ENCODED, { recipe: 'ROT13(true,true,false,13)' });
  mark('input-set', { ok: r && r.ok, via: r && r.via }); if (!r || r.ok === false) throw new Error('setCyberChefInput failed ' + JSON.stringify(r).slice(0, 300));
  await sleep(600);
  const panes = await page.evaluate(() => { const f = document.getElementById('cyberchef-frame'); const fr = f.getBoundingClientRect(); const d = f.contentDocument; const out = { frame: [fr.x, fr.y, fr.width, fr.height] }; for (const id of ['input-text', 'output-text', 'recipe']) { const e = d.getElementById(id); if (e) { const b = e.getBoundingClientRect(); out[id] = [Math.round(fr.x + b.x), Math.round(fr.y + b.y), Math.round(b.width), Math.round(b.height)]; } } return out; });
  mark('panes', panes); await sleep(3500); mark('linger-end');
  await page.evaluate(async () => { window.closeLaptop && window.closeLaptop(); for (const c of [window.MusicController && window.MusicController.context, window.game && window.game.sound && window.game.sound.context]) { try { if (c && c.state !== 'running') await c.resume(); } catch (_) {} } });
  await sleep(700); mark('laptop-closed');
};
