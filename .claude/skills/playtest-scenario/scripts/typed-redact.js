/**
 * typed-redact.js - keeps typed flag values out of the harness's `mg type` output.
 *
 * The bridge's type action echoes the text it typed. For a flag station or flag input
 * that puts the full flag in the transcript, so by default the echo is replaced with a
 * length marker. It applies when the open minigame looks like a flag station (its id,
 * title or text mention a flag) or the typed text itself matches flag{...}. Pass
 * "showTyped": true on the command to keep the value.
 *
 * Kept apart from the session script so node tests can load it without Playwright
 * (test/js/playtest-typed-redact.test.mjs).
 */
const FLAG_SHAPE = /flag\{[^}]*\}/i;
const STATION_HINT = /flag/i;

function looksLikeFlagTarget(state) {
  if (!state) return false;
  return [state.id, state.type, state.title, state.text].some(v => typeof v === 'string' && STATION_HINT.test(v));
}

/** Returns the result with `typed` redacted when it should be; the input is not mutated. */
function redactTyped(result, { state, text, show }) {
  if (show || !result || typeof result !== 'object' || result.typed === undefined) return result;
  const value = typeof text === 'string' ? text : String(result.typed);
  if (!(looksLikeFlagTarget(state) || FLAG_SHAPE.test(value))) return result;
  return { ...result, typed: `[redacted ${value.length} chars]`, typedRedacted: true };
}

module.exports = { redactTyped, looksLikeFlagTarget };
