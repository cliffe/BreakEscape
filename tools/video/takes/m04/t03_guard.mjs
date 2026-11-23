// t03_guard (m04), keyless: the cover. The player walks from the entrance down to the gate desk; the guard challenges on sight (or the player interacts),
// the take picks [Grid-safety regulator. I'm here for the audit.] and plays "Regulator, is it." in full (scout 1.90 s, knot guard_credentials_check). The menu after it is never touched.
// Entry state: new-game.rb m04_critical_failure --imports=none --set briefing_played=true   (the real gate: the briefing's own setGlobalOnStart; also arms the guard's sight challenge)
// Record: BE_SPRITE=lucia_moreno tools/video/takes/run-take.sh m04 t03_guard "--imports=none --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: walk-start, walk-end, interact (only if the sight challenge did not fire), conversation-open {first line}, choice:*, line-start:/line-end:, regulator-done, targets-done.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
let PG = null;
const find = async () => PG.evaluate(() => { const n = window.npcManager.getNPC('security_guard'); return n && n._sprite && { x: n._sprite.x, y: n._sprite.y }; });
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {}); await sleep(1500);
  const s = await bridge.getState();
  PG = page; console.error('SETUP', JSON.stringify({ p: s.player, g: await find() }));
}
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await sleep(1000);
  const g = await find(); const p = (await bridge.getState()).player;
  mark('walk-start', { g, p });
  // walk toward the guard on the axis with the longer gap, in short legs, until the chat opens
  let opened = false;
  const open = async () => !!(await bridge.getState()).dialogue;
  const dx = g.x - p.x, dy = g.y - p.y;
  const legs = Math.abs(dy) >= Math.abs(dx) ? [['down', g.y - 70], ['right', g.x - 30]] : [['right', g.x - 70], ['down', g.y - 30]];
  for (const leg of legs) { if (await open()) break; await keyLegs(bridge, [leg], 105, mark); }
  for (let i = 0; i < 40 && !(opened = await open()); i++) await sleep(100);
  if (!opened) {
    mark('walk-end', { g: await find(), p: (await bridge.getState()).player });
    mark('interact'); await bridge.interact('security_guard', { timeoutMs: 15000 });
    await bridge.waitForMinigame('person-chat', { timeoutMs: 8000 });
  }
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
