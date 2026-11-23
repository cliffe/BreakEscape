// t05_esd (m04), keyless: the ESD panel, the "trigger holder is still within reach of the laptop" variant. Plant room, Voltage not neutralised, anomaly_detected and attack_mechanism_known set,
// so the unauthorised text is the third variant (the earlier two hand out the dial and jump-server hints). The button is opened and read, NEVER pressed. Static stood aside (idle at the wall).
// Entry state: new-game.rb m04_critical_failure --imports=none --start-room plant_room --set briefing_played=true --set static_stood_aside=true --set anomaly_detected=true --set attack_mechanism_known=true
// Record: BE_SPRITE=lucia_moreno tools/video/takes/run-take.sh m04 t05_esd "<flags above>" "--hide-hud --zoom-step 1"
// Marks: esd-interact, esd-open, esd-text (what the panel shows), esd-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
const ID = 'esd_pushbutton';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveToNear(ID, { timeoutMs: 20000 }).catch(e => console.error('moveToNear', String(e).slice(0, 200)));
  await sleep(900);
  const s = await bridge.getState();
  console.error('SETUP', JSON.stringify({ p: s.player, near: s.nearby.map(n => [n.id, n.inRange]).slice(0, 8) }));
}
const texts = (page) => page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 600)).catch(() => '');
export default async (page, bridge, mark) => {
  await sleep(900);
  mark('esd-interact');
  const r = await bridge.interact(ID, { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + JSON.stringify(r).slice(0, 200));
  await sleep(1200);
  mark('esd-open', { mg: (await bridge.getState()).activeMinigame });
  console.error('TXT0', await texts(page));
  await sleep(2500);
  // lift the safety flap if the panel offers one, then hold (never press the button)
  const flap = await page.evaluate(() => { const b = [...document.querySelectorAll('button,div,span')].filter(e => e.offsetParent && /lift|flap/i.test(e.innerText || '') && (e.innerText || '').length < 40)[0]; if (b) { b.click(); return (b.innerText || '').trim(); } return null; });
  mark('flap', { flap });
  await sleep(1800);
  mark('esd-text', { t: await texts(page) });
  console.error('TXT1', await texts(page));
  await sleep(1000);
  await page.evaluate(() => window.MinigameFramework.endMinigame(false));
  await bridge.waitForMinigameClosed({ timeoutMs: 5000 });
  mark('esd-closed');
  await sleep(900);
};
