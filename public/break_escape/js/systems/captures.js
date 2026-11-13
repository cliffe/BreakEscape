// The capture store (SE lab payoff; design in plans/linear-petting-forest.md).
//
// A PURE module: it reads plain objects, touches no DOM, window or other global, and makes no
// request. `se_captures` is a map keyed by the phish target id, one entry per target the
// campaign got something from — a credential sign-in (from a look-alike page) or a foothold
// (a document or executable the target opened). The writer (mail-client/mail-bridge.js) does
// the read-modify-write through global-writer.js, exactly as it does for se_landing_pages; this
// module only shapes and reads the data, so it stays testable and the sync boundary
// (state-sync.js) can enforce the same closed key set as a defence in depth.
//
// Safety (mirrors the landing-page builder's): a shown credential is AUTHORED fiction on the
// victim's page (social.landingPages[].capture / social.phishTargets[].foothold), never
// anything the player typed and nothing real. `revealSecret` is a per-scenario opt-in that is
// OFF by default, so an awareness lab reusing the minigame withholds the secret and only
// acknowledges that a sign-in was captured.

export const CAPTURES_KEY = 'se_captures';

// The closed entry key set. state-sync.js keeps its own copy for the sync-boundary guard; the
// social-captures test asserts the two stay in step.
export const CAPTURE_ENTRY_KEYS = Object.freeze(['targetId', 'roleLabel', 'address', 'kind', 'secret', 'host', 'note', 'at']);

const CAPTURE_KINDS = Object.freeze(['credential', 'foothold']);
const MASK = '••••••••';

const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string';

/** The capture map from a globals object (or {} when absent/malformed). */
export function readCaptures(globals) {
  return isObj(globals) && isObj(globals[CAPTURES_KEY]) ? globals[CAPTURES_KEY] : {};
}

/** Whether this scenario reveals the captured secret. Off unless social.captures.revealSecret is true. */
export function capturesReveal(social) {
  return !!(isObj(social) && isObj(social.captures) && social.captures.revealSecret === true);
}

/** The masked form of any secret, for an awareness lab or a withheld view. */
export function maskSecret() {
  return MASK;
}

/**
 * One capture entry, with only the closed keys kept and the kind constrained. A non-object or
 * a missing/blank targetId returns null (nothing to key it by). `at` defaults to 0 so a caller
 * that does not stamp a time still produces a stable, serialisable entry.
 */
export function makeCaptureEntry(input) {
  if (!isObj(input) || !isStr(input.targetId) || !input.targetId) return null;
  const kind = CAPTURE_KINDS.includes(input.kind) ? input.kind : 'credential';
  const out = { targetId: input.targetId, kind, at: Number.isFinite(input.at) ? input.at : 0 };
  if (isStr(input.roleLabel) && input.roleLabel) out.roleLabel = input.roleLabel;
  if (isStr(input.address) && input.address) out.address = input.address;
  if (isStr(input.secret) && input.secret) out.secret = input.secret;
  if (isStr(input.host) && input.host) out.host = input.host;
  if (isStr(input.note) && input.note) out.note = input.note;
  return out;
}

/**
 * Add an entry to the capture map, first-capture-wins: an existing entry for the same target is
 * kept and the map is returned unchanged (reference-equal), so a resend never overwrites what
 * the first landing recorded and the writer's `next !== before` check skips a redundant sync.
 * This is the store's idempotency — it does not need the se_mail_applied marker, since the map
 * it reads is the persisted state. Returns the same map when `entry` is null.
 */
export function mergeCapture(map, entry) {
  const base = isObj(map) ? map : {};
  if (!entry || !isStr(entry.targetId) || !entry.targetId) return base;
  if (isObj(base[entry.targetId])) return base;
  return { ...base, [entry.targetId]: entry };
}

/** The captures as a list, oldest first (by `at`, then target id), for a stable view order. */
export function captureList(globals) {
  const map = readCaptures(globals);
  return Object.values(map)
    .filter(isObj)
    .sort((a, b) => (a.at || 0) - (b.at || 0) || String(a.targetId).localeCompare(String(b.targetId)));
}

/**
 * How a capture's secret reads for display: the real (authored) secret when the scenario
 * reveals it, otherwise the mask. A foothold carries no secret, so this returns null for it.
 *
 * The secret is NOT shipped in the scenario bootstrap (the server strips it); it is served by
 * GET /capture_secrets only once the capture is earned, as a { targetId: secret } map. Pass that
 * map as `secretsById` and its entry wins. `entry.secret` is used as a fallback for a save made
 * before the secret was stripped. With neither (a revealing scenario whose secret has not arrived
 * yet) the mask is shown until the fetch fills it in.
 */
export function displaySecret(entry, social, secretsById = null) {
  if (!isObj(entry) || entry.kind !== 'credential') return null;
  const fromMap = isObj(secretsById) && isStr(secretsById[entry.targetId]) && secretsById[entry.targetId]
    ? secretsById[entry.targetId] : null;
  const secret = fromMap || (isStr(entry.secret) && entry.secret ? entry.secret : null);
  if (!secret) return null;
  return capturesReveal(social) ? secret : maskSecret();
}
