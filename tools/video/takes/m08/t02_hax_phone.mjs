// t02_hax_phone (m08 The Mole): a voiced Agent HaX phone-hub beat and a flag payoff line. HaX is the handler on the
// secure line (player_phone / agent_0x99), RP British, fully voiced. With flags 1, 3 and 4 in (found_gitlist_vuln,
// found_leaked_creds, found_architect_comms, found_access_logs all true) and the mole not yet named, the take opens
// the phone, picks HaX, and plays two gated hub lines in order so her voice is heard in full:
//   1. "[What does the Director need from me?]" - the case-building payoff line (gated not mole_identified/not audit_closed),
//   2. "[Where would the door logs be?]"        - points the player at the door audit (gated not found_badge_audit).
// Both are voiced and REPLAYABLE: neither sets a one-shot global (they do not flip found_badge_audit / mole_identified),
// so the hub can be re-entered. The take never names the mole, never reads the audit, never finishes the mission.
// No flag value or password appears (HaX speaks story, not secrets). Entry: LIVE game 85 (playtest03, m08, set 919, all
// flags in); no new game.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/85 STORAGE_STATE=<playtest03 login.mjs state> \
//   tools/video/takes/run-take.sh m08 t02_hax_phone "" ""      (no --hide-hud: the phone opens from the inventory tray)
// Marks: phone-open, contact-picked, tts-response (per voiced line, from watchTts), choices-shown, choice:<text>,
//        line-settled, linger-end, closed.
import { sleep, clearScreen, awaitChoice } from '../lib/lib.mjs';
import { watchTts } from './_live.mjs';

// The two hub choices to play, in order. Matched loosely so a small copy change does not break the take.
const TOPICS = [/Director need from me/i, /door logs/i];

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const g = await page.evaluate(() => {
    const v = (window.gameState && window.gameState.globalVariables) || {};
    return { vuln: v.found_gitlist_vuln, mole: v.mole_identified, audit: v.found_badge_audit, logs: v.found_access_logs };
  });
  console.error('GLOBALS', JSON.stringify(g));
  if (g.mole === true || g.audit === true) throw new Error('hub topics have moved on: ' + JSON.stringify(g));
  await sleep(500);
}

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  await sleep(1200);
  const r = await bridge.openInventoryItem('phone');
  if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  mark('phone-open');
  await sleep(1700);
  const c = await bridge.minigame.clickText('Agent HaX');
  mark('contact-picked', { ok: c && c.ok });
  for (const re of TOPICS) {
    const d = await awaitChoice(bridge, 60000);
    if (!d) throw new Error('no hub choices for ' + re);
    mark('choices-shown', { choices: d.choices.map(x => x.text) });
    await sleep(1600);
    const ch = await bridge.minigame.choose(re);
    if (!ch || !ch.ok) throw new Error('choose failed ' + re + ' ' + JSON.stringify(ch).slice(0, 300));
    mark('choice:' + ch.chose, { number: ch.number });
    // Let HaX's voiced reply play out (watchTts marks each /tts), then hold on the line.
    await sleep(6500);
    mark('line-settled', { re: String(re) });
  }
  await sleep(2500);
  mark('linger-end', { ttsCount: tts.length });
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
};
