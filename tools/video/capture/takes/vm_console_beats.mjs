/**
 * vm_console_beats.mjs - an INTERACTIVE full-screen VNC console take (record-take.mjs --no-game).
 *
 * Like vm_console.mjs it signs in, opens the VM's noVNC console 1:1 at the guest's native size and
 * (if the greeter is showing) logs the desktop in during setup(), BEFORE recording starts. What it
 * adds is the shot itself: once recording is running and vm_display has opened a full-screen
 * interactive terminal on the desktop (see Hacktivity vm_display --open-term), this take types a
 * sequence of "beats" into that terminal over VNC at human typing speed and runs each live, marking
 * every beat so the editor can cut between steps. It is the interactive counterpart to the
 * non-interactive --film typescript path.
 *
 * Nothing secret is ever an argument. The commands to type come from the environment (the
 * orchestrator supplies them), and only no-secret, "filmable" content (e.g. an nmap scan, a tool
 * banner) should ever be typed: the prompt vm_display opens shows no account name, host or path, and
 * this take neither logs nor stores the beat text beyond handing it to the keyboard.
 *
 * Environment (in addition to everything vm_console.mjs reads - CONSOLE_VM_URL, CONSOLE_VM_ID,
 * PLAYTEST_DESKTOP_CREDS, CONSOLE_DESKTOP_LOGIN, CONSOLE_READY_FILE, CONSOLE_STOP_FILE, CONSOLE_HOLD_S,
 * CONSOLE_SIZE, CONSOLE_TOKEN_TIMEOUT_S):
 *   CONSOLE_BEATS        (required) JSON array of beats. Each: { "label": "nmap",
 *                        "text": "nmap -Pn -sV -p 22 172.16.0.2", "settleMs": 6000,
 *                        "delayMs"?: per-char typing delay, "enter"?: false to type without running,
 *                        "clearBefore"?: true/false to override the CONSOLE_CLEAR_BEFORE default }
 *   CONSOLE_CLEAR_BEFORE    "yes"/"1"/"true" to run `clear` at the START of every beat, so each step
 *                        is recorded on a clean screen with no earlier step's scrollback behind it
 *                        (the editor can then snip each step out as a self-contained segment). A
 *                        `${label}-clear` mark is emitted at the cleared frame. Default off.
 *   CONSOLE_CLEAR_SETTLE_MS how long to hold the freshly cleared screen before typing the step
 *                        (default 700)
 *   CONSOLE_GO_FILE      optional: wait for this file (the orchestrator touches it once the terminal
 *                        is open) before typing. Without it, wait CONSOLE_GO_FALLBACK_MS then type.
 *   CONSOLE_GO_TIMEOUT_S how long to wait for CONSOLE_GO_FILE (default 60)
 *   CONSOLE_GO_FALLBACK_MS  fixed wait before typing when no CONSOLE_GO_FILE is set (default 9000)
 *   CONSOLE_TYPE_DELAY_MS   default per-char typing delay (default 110)
 *   CONSOLE_BEAT_SETTLE_MS  default per-beat wait after Enter when a beat sets no settleMs (default 4000)
 */
import fs from 'node:fs';
import { consoleSettings } from './vm_console.mjs';

export { setup } from './vm_console.mjs';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Parse and validate the beat list and timings from the environment. Never echoes a beat's text in a throw. */
export function parseBeats(env = process.env) {
  if (!env.CONSOLE_BEATS) throw new Error('CONSOLE_BEATS is not set');
  let raw;
  try { raw = JSON.parse(env.CONSOLE_BEATS); } catch (_) { throw new Error('CONSOLE_BEATS is not valid JSON'); }
  if (!Array.isArray(raw) || raw.length === 0) throw new Error('CONSOLE_BEATS must be a non-empty JSON array');
  const typeDelayMs = Number(env.CONSOLE_TYPE_DELAY_MS) || 110;
  const beatSettleMs = Number(env.CONSOLE_BEAT_SETTLE_MS) || 4000;
  const clearDefault = /^(yes|1|true)$/i.test(env.CONSOLE_CLEAR_BEFORE || '');
  const beats = raw.map((b, i) => {
    if (!b || typeof b !== 'object') throw new Error(`beat ${i} is not an object`);
    if (typeof b.text !== 'string' || !b.text) throw new Error(`beat ${i} has no text`);
    const label = typeof b.label === 'string' && b.label ? b.label : `beat${i + 1}`;
    if (!/^[A-Za-z0-9_-]+$/.test(label)) throw new Error(`beat ${i} label is not a simple token`);
    return {
      label,
      text: b.text,
      enter: b.enter !== false,
      clearBefore: typeof b.clearBefore === 'boolean' ? b.clearBefore : clearDefault,
      delayMs: Number(b.delayMs) > 0 ? Number(b.delayMs) : typeDelayMs,
      settleMs: Number(b.settleMs) >= 0 ? Number(b.settleMs) : beatSettleMs,
    };
  });
  return {
    beats,
    goFile: env.CONSOLE_GO_FILE || null,
    goTimeoutS: Number(env.CONSOLE_GO_TIMEOUT_S) || 60,
    goFallbackMs: Number(env.CONSOLE_GO_FALLBACK_MS) || 9000,
    clearSettleMs: Number(env.CONSOLE_CLEAR_SETTLE_MS) >= 0 ? Number(env.CONSOLE_CLEAR_SETTLE_MS) : 700,
  };
}

async function focusCanvas(page) {
  await page.evaluate(() => { const c = document.querySelector('#vnc-screen canvas'); if (c) c.focus(); });
}

export default async function take(page, _bridge, mark) {
  const cfg = consoleSettings();
  const plan = parseBeats();

  mark('console-ready', { beats: plan.beats.length });
  if (cfg.readyFile) fs.writeFileSync(cfg.readyFile, '');

  // Wait for the terminal to be opened on the desktop (the orchestrator's CONSOLE_GO_FILE), or a
  // fixed fallback. The desktop establishing beat is whatever shows until here; the head is trimmed
  // in the edit so only a short beat of desktop precedes the terminal opening.
  if (plan.goFile) {
    for (const end = Date.now() + plan.goTimeoutS * 1000; !fs.existsSync(plan.goFile) && Date.now() < end;) await sleep(250);
  } else {
    await sleep(plan.goFallbackMs);
  }
  await sleep(600);              // let the terminal finish drawing before the first keystroke
  mark('terminal-open');

  await focusCanvas(page);
  for (const b of plan.beats) {
    await sleep(500);            // a short, even gap between beats
    if (b.clearBefore) {
      // Run `clear` first so this step begins on a clean screen with no earlier step's scrollback
      // behind it. The ${label}-clear mark lands on the freshly cleared frame, so the editor can
      // snip each step out as a self-contained segment that starts blank.
      await page.keyboard.type('clear', { delay: b.delayMs });
      await page.keyboard.press('Enter');
      await sleep(plan.clearSettleMs);
      mark(`${b.label}-clear`);
    }
    mark(`${b.label}-type`);
    await page.keyboard.type(b.text, { delay: b.delayMs });
    if (b.enter) {
      await page.keyboard.press('Enter');
      mark(`${b.label}-run`);
    }
    if (b.settleMs > 0) await sleep(b.settleMs);
    mark(`${b.label}-done`);
  }
  mark('beats-end');

  // Hold on the final frame until the stop file or the hold budget, so the last result stays readable.
  const end = Date.now() + cfg.holdS * 1000;
  while (Date.now() < end) {
    if (cfg.stopFile && fs.existsSync(cfg.stopFile)) { mark('stop-file'); break; }
    await sleep(500);
  }
}
