// t28_cyberchef (m10, keyless, NOT YET RUN): the CyberChef Workstation (a start item) opened with window.openCryptoWorkstation (as m09 t16 / m03 t08; m03 also used ROT13, so change the sentence if the cut shows both), a NEUTRAL worked example: ROT13 of the greeting "Uryyb, jbeyq!" (not the mission's own Base64 margin strip decode). Crop to the recipe and input/output panes. Never the margin strip or anything from the casualty sheet.
// Entry (new-game): --imports=none --start-room forward_post --set briefing_played=true   Record: "--hide-hud --zoom-step 1"   (avatar vivian_ashby)
// Record: MISSION=m10 run.sh vivian_ashby t28_cyberchef "<flags>" "--hide-hud --zoom-step 1"
// Marks: workstation-open, cyberchef-ready, input-set, output-shown, linger-end. Risk: recipe name syntax (the m03 ROT13(true,true,false,13) form is tried first); check no earlier input or history is shown.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(800); }
export default async (page, bridge, mark) => {
  await sleep(1200);
  const o = await page.evaluate(() => { if (!window.openCryptoWorkstation) return false; window.openCryptoWorkstation(); return true; });
  mark('workstation-open', { ok: o }); if (!o) throw new Error('openCryptoWorkstation not available');
  await sleep(4000); mark('cyberchef-ready');
  let r = await bridge.setCyberChefInput('Uryyb, jbeyq!', { recipe: 'ROT13(true,true,false,13)' });
  if (!r || r.ok === false) r = await bridge.setCyberChefInput('Uryyb, jbeyq!', { recipe: 'ROT13' });
  mark('input-set', { ok: r && r.ok, output: r && r.output }); if (!r || r.ok === false) throw new Error('setCyberChefInput failed');
  mark('output-shown'); await sleep(3500); mark('linger-end');
  // the workstation overlay leaves the game's AudioContext suspended, so the end tone slate was silent (m09 t16 too): resume it before the slate
  await page.evaluate(async () => { const c = (window.MusicController && window.MusicController.context) || window.__beCtx; if (c && c.state !== 'running') await c.resume(); }); await sleep(400);
};
