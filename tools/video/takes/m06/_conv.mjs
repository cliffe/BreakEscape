// Shared by the m06 keyless takes (new set, 23 Nov): open a person-chat, pick a menu entry, play lines, close. Written, not yet run.
import { sleep } from '../lib/lib.mjs';
export const ttsPlaying = (page) => page.evaluate(() => { const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame; return !!(mg && mg.ttsManager && mg.ttsManager.playing); }).catch(() => false);
export async function openChat(bridge, id) {
  let r = await bridge.interact(id, { timeoutMs: 15000, approach: false });
  let w = await bridge.waitForMinigame('person-chat', { timeoutMs: 3000 });
  if (!w || w.ok === false) { r = await bridge.interact(id, { timeoutMs: 15000, approach: false }); w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 }); }
  if (!w || w.ok === false) throw new Error('chat did not open ' + id + ' ' + JSON.stringify(r).slice(0, 200));
}
export async function pickMenu(bridge, re, mark, ms = 40000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const d = (await bridge.getState()).dialogue;
    if (d && d.awaitingChoice && d.choices.some(c => re.test(c.text))) { mark('choices-shown', { choices: d.choices.map(c => c.text) }); await sleep(700); const ch = await bridge.minigame.choose(re); if (!ch || !ch.ok) throw new Error('choose failed ' + re); mark('choice:' + ch.chose); return; }
    await sleep(150);
  }
  throw new Error('menu with ' + re + ' never showed');
}
export async function closeAll(page, bridge) { for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame; i++) { await page.evaluate(() => window.MinigameFramework && window.MinigameFramework.endMinigame(false)); await sleep(500); } }
export const DIGITS = ['5', '6', '8']; // wrong on every PIN pad in m06 (checked against the scenario's PINs and the fund slot by position and by value, 23 Nov)
