/**
 * typed-redact.js - keeps typed flag values out of the harness's `mg type` output.
 *
 * The bridge's type action echoes the text it typed. For a flag station or flag input
 * that puts the full flag in the transcript, so by default the echo is replaced with a
 * length marker. It applies when the open minigame looks like a flag station (its id,
 * title or text mention a flag) or the typed text itself matches flag{...}. Pass
 * "showTyped": true on the command (top level, not inside args) to keep the value in
 * the reply. The session log never keeps it: scrub() removes every registered secret
 * from the log, from `drain`, and from `mg getState` on a flag station.
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

const MIN_SECRET = 4;
const marker = (n) => `[redacted ${n} chars]`;

/**
 * A real flag station: the flag-station minigame (id 'flag-station', or its class name,
 * or its stationId state field). looksLikeFlagTarget is looser (any screen whose text
 * mentions "flag") and is used only to mask one echo; secrets are session-wide, so
 * registering a value needs this stricter test or a flag{...} shape.
 */
function isFlagStation(state) {
  if (!state) return false;
  return state.id === 'flag-station' || state.type === 'FlagStationMinigame'
    || typeof state.stationId === 'string';
}

/** Whether typed text should be treated as a flag value to keep out of every output. */
function isFlagTyped(state, text) {
  return typeof text === 'string' && text.length > 0 && (isFlagStation(state) || FLAG_SHAPE.test(text));
}

/**
 * The flag values a flag-station state exposes: submittedFlags, and the text of any
 * non-empty field (before a submit the field holds what was typed). Everything at a real
 * flag station; only flag{...}-shaped values anywhere else.
 */
function stateSecrets(state) {
  if (!state) return [];
  const station = isFlagStation(state);
  const out = [];
  // At a real flag station every value is a candidate; elsewhere only flag{...}-shaped ones.
  const add = (v) => { if (typeof v === 'string' && v.length >= MIN_SECRET && (station || FLAG_SHAPE.test(v))) out.push(v); };
  for (const f of Array.isArray(state.submittedFlags) ? state.submittedFlags : []) {
    // An object entry: take only its flag/value field, not status words like "accepted".
    if (f && typeof f === 'object') { add(f.flag); add(f.value); } else add(f);
  }
  for (const f of Array.isArray(state.fields) ? state.fields : []) if (f) add(f.value);
  return out;
}

/** Replace every secret (and any flag{...} shape when `shape`) in a string. */
function scrubString(str, secrets, shape) {
  let out = str;
  for (const v of [...secrets].sort((a, b) => b.length - a.length)) {
    if (v.length >= MIN_SECRET && out.includes(v)) out = out.split(v).join(marker(v.length));
  }
  if (shape) out = out.replace(/flag\{[^}]*\}/gi, (m) => marker(m.length));
  return out;
}

/**
 * A deep copy of `node` with the secrets replaced by length markers. `secrets` is a Set
 * of strings the session has seen typed at a flag target or configured as flags.
 */
function scrub(node, secrets, shape = false) {
  if ((!secrets || !secrets.size) && !shape) return node;
  const walk = (n) => {
    if (typeof n === 'string') return scrubString(n, secrets || new Set(), shape);
    if (Array.isArray(n)) return n.map(walk);
    if (n && typeof n === 'object') return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, walk(v)]));
    return n;
  };
  return walk(node);
}

module.exports = { redactTyped, looksLikeFlagTarget, isFlagStation, isFlagTyped, stateSecrets, scrub, MIN_SECRET };
