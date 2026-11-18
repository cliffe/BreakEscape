// live02_phone_agent_hax (m02): a PHONE-CALL beat scaffold. Opens the player's phone (Your Phone) and calls the
// handler Agent HaX (phone contact id agent_0x99, voice Aoede / British RP).
// FINDING (2026-11-13, Stage A): on game 93 with briefing_played already set, the handler's intro is consumed, so
//   the call opens straight onto a text-only hub menu ("Understood." / "What should I know going in?" / ...) and
//   those hub lines did NOT voice (watchTts saw 0 audio responses) - so this contact does not yield a clean voiced
//   phone beat on a progressed game. Use it against a FRESH game before briefing_played is set to capture the voiced
//   first_call intro, or repoint CONTACT/STEP at a voiced story call (e.g. a Ghost bark after a flag submission).
//   Kept as a working scaffold (phone open + contact select + playThrough all work); it is not a delivered take.
// No flag value, password or credential is on screen - handler dialogue only.
// Entry state: LIVE game 93 (playtest03, m02, set 931), near the mission start (reception_lobby); the phone and the
// Agent HaX contact are available from the start. TTS must be on (keyed :3000) - watchTts logs each voiced line.
// Record (LIVE mode, see tools/video/takes/run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/93 STORAGE_STATE=<playtest03 login.mjs state> \
//   BE_DISPLAY=99 tools/video/takes/run-take.sh m02 live02_phone_agent_hax "" "--hide-hud --zoom-step 1"
// Marks: tts-response (per voiced line), phone-open, hax-open, choices-shown/menu-reached, linger-end, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts, playThrough } from './_live.mjs';

const PHONE_NAME = process.env.PHONE_NAME || 'Your Phone';
const CONTACT = process.env.CONTACT || 'Agent HaX';

function makeVw(seen) {
  return { lines: seen, async drain() { return seen; } };
}

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  console.error('SETUP room', s.player && s.player.room, 'inv', (s.inventory || []).map(i => i.id || i.name).join(','));
  await sleep(500);
}

export default async (page, bridge, mark) => {
  const seen = watchTts(page, mark);
  const vw = makeVw(seen);
  await sleep(1000);
  const p = await bridge.openInventoryItem(PHONE_NAME);
  if (!p || p.ok === false) throw new Error('could not open phone ' + JSON.stringify(p).slice(0, 200));
  await sleep(1600);
  mark('phone-open', { ok: true });
  await bridge.minigame.clickText(CONTACT).catch((e) => { throw new Error('could not select contact ' + CONTACT + ' ' + e); });
  await sleep(1500);
  mark('hax-open', { contact: CONTACT });
  // The handler's intro is already consumed (briefing_played), so the call opens on an informational hub menu.
  // Pick one informational hub line ("What should I know going in?") to hear a fresh voiced handler reply, then
  // stop at the next menu. These are replayable hub lines - no irreversible story state is committed.
  const STEP = Number(process.env.STEP || 2);
  await playThrough(page, bridge, mark, vw, { steps: [STEP], settleMs: 1100, timeoutMs: 80000 });
  await sleep(2500);
  mark('linger-end', { voicedLines: seen.filter(e => e.status === 200 && /audio/.test(e.type)).length });
  for (let i = 0; i < 5 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
};
