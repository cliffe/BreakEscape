// t16_cyberchef_vigenere (m09, keyless, NOT YET RUN): the CyberChef Workstation (a start item) opened with window.openCryptoWorkstation (as m01 t14), a neutral textbook Vigenere example (key LEMON, ciphertext LXFOPVEFRNHR, plaintext a classic, not the mission's) set through setCyberChefInput with a Vigenere Decode recipe. Crop to recipe + input/output panes in the edit.
// Entry state (new-game): --imports=none --start-room reading_room --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh mei_lin_chow t16_cyberchef_vigenere "<flags>" "--hide-hud --zoom-step 1"
// Marks: workstation-open, cyberchef-ready, input-set, output-shown, linger-end. Risk: the recipe name needs the accent (Vigenère_Decode); if setCyberChefInput rejects it try "Vigenere_Decode". Check no earlier input/history from the scenario is shown.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(800); }
export default async (page, bridge, mark) => {
  await sleep(1200);
  const o = await page.evaluate(() => { if (!window.openCryptoWorkstation) return false; window.openCryptoWorkstation(); return true; });
  mark('workstation-open', { ok: o }); if (!o) throw new Error('openCryptoWorkstation not available');
  await sleep(4000); mark('cyberchef-ready');
  let r = await bridge.setCyberChefInput('LXFOPVEFRNHR', { recipe: "Vigenère_Decode('LEMON')" });
  if (!r || r.ok === false) r = await bridge.setCyberChefInput('LXFOPVEFRNHR', { recipe: "Vigenere_Decode('LEMON')" });
  mark('input-set', { ok: r && r.ok, output: r && r.output }); if (!r || r.ok === false) throw new Error('setCyberChefInput failed');
  mark('output-shown'); await sleep(3500); mark('linger-end');
};
