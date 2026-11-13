// t04_ransom (m02): the ransomware display on the reception workstation (reception_terminal, six-screen ransom minigame), held 3 s.
// Entry state: fresh game with the briefing gate: new-game.rb m02_ransomed_trust --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t04_ransom "--set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: interact, minigame-open, hold-end (3 s after the screen opened), closed. The take does not click through the screens.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveToNear('reception_terminal', { timeoutMs: 20000 });
  await sleep(800);
}
export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('interact');
  const r = await bridge.interact('reception_terminal', { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + JSON.stringify(r).slice(0, 300));
  const w = await bridge.waitForMinigame(null, { timeoutMs: 8000 });
  const st = await bridge.minigame.getState();
  mark('minigame-open', { id: st && st.id, title: st && st.title, text: String((st && st.text) || '').slice(0, 300) });
  await sleep(3000);
  mark('hold-end');
  await bridge.minigame.close().catch(() => {});
  await bridge.waitForMinigameClosed({ timeoutMs: 5000 });
  mark('closed');
  await sleep(800);
};
