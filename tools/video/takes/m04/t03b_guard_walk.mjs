// t03b_guard_walk (m04), keyless: the cover with an approach. The player starts in operations_office, walks north through the door into main_entrance and on towards the gate desk;
// the guard challenges on sight as she comes in ("Morning. Bit early for visitors. Desk first, if you don't mind."), the take picks [Grid-safety regulator. I'm here for the audit.] and plays "Regulator, is it." in full.
// Entry state: new-game.rb m04_critical_failure --imports=none --start-room operations_office --set briefing_played=true
// Record: BE_SPRITE=ngozi_adeyemi tools/video/takes/run-take.sh m04 t03b_guard_walk "--imports=none --start-room operations_office --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: walk-start, door-open, walk-end, conversation-open, choice:*, line-start:/line-end:, regulator-done, targets-done.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
let PG = null;
const find = async () => PG.evaluate(() => { const n = window.npcManager.getNPC('security_guard'); return n && n._sprite && { x: n._sprite.x, y: n._sprite.y }; });
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {}); await sleep(1500);
  const s = await bridge.getState();
  PG = page; console.error('SETUP', JSON.stringify({ p: s.player }));
}
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await sleep(1000);
  mark('walk-start', (await bridge.getState()).player);
  const r = await bridge.interact('door:operations_office->main_entrance', { timeoutMs: 20000 });
  mark('door-open', { ok: r && r.ok, r: JSON.stringify(r).slice(0, 120) });
  await sleep(600);
  const open = async () => !!(await bridge.getState()).dialogue;
  await keyLegs(bridge, [['up', (await bridge.getState()).player.y - 60]], 105, mark);
  let opened = await open();
  for (let i = 0; i < 6 && !opened; i++) { await keyLegs(bridge, [['right', (await bridge.getState()).player.x + 30]], 105, mark); await sleep(200); opened = await open(); }
  for (let i = 0; i < 40 && !(opened = await open()); i++) await sleep(100);
  mark('walk-end', { p: (await bridge.getState()).player, opened });
  if (!opened) throw new Error('guard did not challenge');
  const d0 = (await bridge.getState()).dialogue; mark('conversation-open', { text: ((d0 && d0.text) || '').slice(0, 120) });
  let picked = false; const t0 = Date.now(); let done = false;
  while (Date.now() - t0 < 90000 && !done) {
    const d = (await bridge.getState()).dialogue;
    if (!d) { await sleep(150); continue; }
    const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
    if (d.awaitingChoice && !picked) {
      mark('choices-shown', { choices: d.choices.map(c => c.text) }); await sleep(1100);
      const ch = await bridge.minigame.choose(/Grid-safety regulator/i); if (!ch || !ch.ok) throw new Error('choose failed');
      mark('choice:' + ch.chose); picked = true; await sleep(300); continue;
    }
    if (/Regulator, is it/i.test(last)) { const l = await vw.waitForLine(/Regulator, is it/i, 20000); if (!l) throw new Error('regulator line never played'); mark('regulator-done', { durMs: l.durMs }); done = true; break; }
    if (d.canContinue && !d.awaitingChoice) { await sleep(450); await bridge.minigame.continue_().catch(() => {}); }
    await sleep(120);
  }
  if (!done) throw new Error('line not reached');
  await sleep(900); await vw.stop(); mark('targets-done');
};
