// t08_cyberchef (m04): the CyberChef workstation (real CyberChef in the in-game laptop overlay) with a neutral ROT13 test sentence as input and the ROT13 operation applied. Player not visible.
// Input and output are both neutral (a 'test of the tool' sentence): no crop is needed for secrets, the edit may crop to the panes anyway. The 'panes' mark logs the pane rectangles (frame pixels).
// cyberchef_workstation is a starting item in m04; opened with window.openCryptoWorkstation as in m03.
// Entry state: new-game.rb m04_critical_failure --imports=none --start-room scada_control_room --set briefing_played=true
// Record: BE_SPRITE=<any> tools/video/takes/run-take.sh m04 t10_cyberchef "--imports=none --start-room scada_control_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// setup(): none (picking the workstation up or preloading it made the recording drop 30% of frames). Take: open via window.openCryptoWorkstation (the handler the tray click uses; --hide-hud hides the tray), wait for load,
// paste the encoded note with the ROT13 recipe. Marks: workstation-open, cyberchef-ready, input-set, panes, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
const ENCODED = 'Uryyb, jbeyq. Guvf vf n grfg bs gur gbby.';
export async function setup(page, bridge) {
  // No pickup and no preload: both made the recording drop about 30 percent of frames. window.openCryptoWorkstation opens the overlay without the item.
  await clearScreen(page, bridge, () => {});
  await sleep(500);
}
export default async (page, bridge, mark) => {
  await sleep(1200);
  mark('workstation-open-start');
  const o = await page.evaluate(() => { if (!window.openCryptoWorkstation) return false; window.openCryptoWorkstation(); return true; });
  mark('workstation-open', { ok: o });
  if (!o) throw new Error('openCryptoWorkstation not available');
  await sleep(4000);
  mark('cyberchef-ready');
  const r = await bridge.setCyberChefInput(ENCODED, { recipe: 'ROT13(true,true,false,13)' });
  mark('input-set', { ok: r && r.ok, via: r && r.via, recipe: r && r.recipe });
  if (!r || r.ok === false) throw new Error('setCyberChefInput failed ' + JSON.stringify(r).slice(0, 300));
  await sleep(600);
  const panes = await page.evaluate(() => {
    const f = document.getElementById('cyberchef-frame'); const fr = f.getBoundingClientRect();
    const d = f.contentDocument; const out = { frame: [fr.x, fr.y, fr.width, fr.height] };
    for (const id of ['input-text', 'output-text', 'input', 'output', 'recipe', 'operations']) {
      const e = d.getElementById(id); if (e) { const b = e.getBoundingClientRect(); out[id] = [Math.round(fr.x + b.x), Math.round(fr.y + b.y), Math.round(b.width), Math.round(b.height)]; }
    }
    return out;
  });
  mark('panes', panes);
  console.error('PANES', JSON.stringify(panes));
  await sleep(3500);
  mark('linger-end');
  // opening the laptop leaves the page's AudioContext suspended, which hides the end sync tone: close the laptop and resume audio before the recorder's end slate
  await page.evaluate(async () => { window.closeLaptop && window.closeLaptop(); for (const c of [window.MusicController && window.MusicController.context, window.game && window.game.sound && window.game.sound.context]) { try { if (c && c.state !== 'running') await c.resume(); } catch (_) {} } });
  await sleep(700);
  mark('laptop-closed', await page.evaluate(() => ({ music: window.MusicController && window.MusicController.context.state })));
};
