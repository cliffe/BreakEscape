// GAP-4 (S20 c_base64, S21 c_vigenere, S22 c_rot13; 3 s each) for the LTH whole-game trailer: the in-game CyberChef workstation (the laptop overlay, as m01 t14,
//   m09 t16, m02 t08) decoding three neutral sample strings at 200% zoom, one beat after another in ONE take. Mission m01 (any game opens the workstation).
// The strings are textbook-style samples chosen here, never a mission's message, key or answer:
//   Base64   THVuY2ggaXMgYXQgbm9vbg==  -> "Lunch is at noon"      (recipe From Base64)
//   Vigenere JMZCFLIORFFV, key RIVER   -> "SEEYOUATNOON"          (recipe Vigenere Decode)
//   ROT13    "Tbbq zbeavat grnz"       -> "Good morning team"     (recipe ROT13)
// 200%: the iframe is laid out at half size (960x540 CSS px) and scaled 2x from its corner, which is what 200% browser zoom gives: input, recipe and output panes
//   bigger and close together. The overlay is full-screen, so it fills the 1920x1080 frame. Each beat clears the previous input first (new input replaces it).
// Entry state: run.sh gap4_decoding = new-game m01 --start-room it_room --set briefing_played=true (nothing else is needed; the workstation is opened by its handler).
// Record flags: none (HUD hidden by the overlay). Marks: workstation-open, cyberchef-ready, zoom-set, base64-set/-out, vigenere-set/-out, rot13-set/-out, linger-end.
// Each output mark is at the moment the output is on screen; the editor holds 3 s from the -out mark minus about 0.5 s of the input arriving. Spoiler: none.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(800); }
const BEATS = [
  ['base64', 'THVuY2ggaXMgYXQgbm9vbg==', "From_Base64('A-Za-z0-9+/=',true,false)", /Lunch is at noon/],
  ['vigenere', 'JMZCFLIORFFV', "Vigenère_Decode('RIVER')", /SEEYOUATNOON/i],
  ['rot13', 'Tbbq zbeavat grnz', 'ROT13(true,true,false,13)', /Good morning team/],
];
export default async (page, bridge, mark) => {
  await sleep(1000);
  const o = await page.evaluate(() => { if (!window.openCryptoWorkstation) return false; window.openCryptoWorkstation(); return true; });
  mark('workstation-open', { ok: o }); if (!o) throw new Error('openCryptoWorkstation not available');
  await sleep(4500); mark('cyberchef-ready');
  await page.evaluate(() => {
    const f = document.getElementById('cyberchef-frame');
    f.style.width = '960px'; f.style.height = '540px'; f.style.transformOrigin = '0 0'; f.style.transform = 'scale(2)';
  });
  await sleep(1200); mark('zoom-set');
  const fr = await page.evaluate(() => { const r = document.getElementById('cyberchef-frame').getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); });
  mark('frame-rect', { rect: fr });
  for (const [name, input, recipe, want] of BEATS) {
    let r = await bridge.setCyberChefInput(input, { recipe });
    if ((!r || r.ok === false) && name === 'vigenere') r = await bridge.setCyberChefInput(input, { recipe: "Vigenere_Decode('RIVER')" });
    mark(name + '-set', { ok: r && r.ok });
    if (!r || r.ok === false) throw new Error(name + ' setCyberChefInput failed ' + JSON.stringify(r).slice(0, 300));
    if (!want.test(r.output || '')) throw new Error(name + ' unexpected output');
    await sleep(500); mark(name + '-out'); await sleep(3200);
  }
  mark('linger-end');
};
