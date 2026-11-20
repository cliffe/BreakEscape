// The capture client (sync deltas R2, 6a; design in SYNC_DELTAS_PLAN 6.4).
//
// The capture record is server-owned: `se_captures` no longer rides PUT /sync_state as a global.
// This module submits one small pending entry per new capture inside the sync body's `captures`
// part, mirrors it into the client's `se_captures` global for the readers and listeners
// (capture log, landing-page captures view, password minigame) to show at once, and replaces that
// optimistic mirror with the server's record when the answer comes back. A heard shared login is
// recorded by the server itself, so the client only mirrors it (mirrorCapture, no sync).
//
// Only two static imports: captures.js (pure entry rules) and global-writer.js (the mirror write).

import { CAPTURES_KEY, makeCaptureEntry, mergeCapture, readCaptures } from './captures.js';
import { writeGlobal } from './global-writer.js';

/** The live globals the mirror reads and writes, or {} before a game loads. */
function liveGlobals() {
  return (typeof window !== 'undefined' && window.gameState && window.gameState.globalVariables) || {};
}

/**
 * Install the capture client on the state sync: register the `captures` part and expose
 * `window.submitSECapture` / `window.mirrorSECapture`. Call once at startup, after `new StateSync`.
 */
export function installCaptureClient(stateSync) {
  // targetId -> { targetId, kind, address, host, roleLabel }: captures the server has not yet
  // acknowledged. Only these fields ride up; the server takes every stored field from the scenario.
  const pending = new Map();

  // Write the mirror to a new map value (writeGlobal fires global_variable_changed:se_captures).
  function setMirror(next) {
    writeGlobal(CAPTURES_KEY, next, { openChat: false });
  }

  /**
   * Record a new capture: build the entry, mirror it (first-capture-wins), queue a pending entry
   * and ask the sync to run. Returns true when a new entry was queued. Synchronous, so the capture
   * is pending before the caller (performSend) returns and rides the same sync body as the sent
   * record and the page record.
   */
  function submitCapture(input) {
    const entry = makeCaptureEntry({ ...input, at: Date.now() });
    if (!entry) return false;
    const base = readCaptures(liveGlobals());
    if (base[entry.targetId]) return false; // first wins: the mirror already holds this target
    const next = mergeCapture(base, entry);
    if (next === base) return false;
    setMirror(next);
    const p = { targetId: entry.targetId, kind: entry.kind };
    for (const k of ['address', 'host', 'roleLabel']) if (entry[k] !== undefined) p[k] = entry[k];
    pending.set(entry.targetId, p);
    stateSync?.sync?.();
    return true;
  }

  /**
   * Mirror a capture the server recorded itself (a heard shared login): write the mirror only, so
   * the capture log shows it this session. Nothing is queued and no sync runs; the server already
   * holds it and ships it back as `captures` on the next bootstrap.
   */
  function mirrorCapture(input) {
    const entry = makeCaptureEntry(input);
    if (!entry) return false;
    const base = readCaptures(liveGlobals());
    const next = mergeCapture(base, entry);
    if (next === base) return false;
    setMirror(next);
    return true;
  }

  // Replace an answered mirror entry with the server's record (no secret) and drop it from pending.
  function recordServerEntry(targetId, serverEntry) {
    const map = readCaptures(liveGlobals());
    const entry = makeCaptureEntry(serverEntry) || serverEntry;
    setMirror({ ...map, [targetId]: entry });
  }

  // Drop a refused entry from the mirror (the optimistic write never landed server-side).
  function removeMirrorEntry(targetId) {
    const map = readCaptures(liveGlobals());
    if (!(targetId in map)) return;
    const next = { ...map };
    delete next[targetId];
    setMirror(next);
  }

  function onAnswer(response) {
    if (!response || typeof response !== 'object') return;
    const answered = (response.captures && typeof response.captures === 'object') ? response.captures : {};
    for (const [targetId, serverEntry] of Object.entries(answered)) {
      if (!pending.has(targetId)) continue;
      recordServerEntry(targetId, serverEntry);
      pending.delete(targetId);
    }
    const refused = (response.capturesRefused && typeof response.capturesRefused === 'object') ? response.capturesRefused : {};
    for (const [targetId, reason] of Object.entries(refused)) {
      if (!pending.has(targetId)) continue;
      pending.delete(targetId);
      removeMirrorEntry(targetId);
      console.warn(`Capture refused for ${targetId}: ${reason}`);
    }
  }

  // The sent records (phish evidence) for a still-pending target, so the pagehide flush keeps
  // them even when it drops the rest of the mail from its reduced body.
  function flushKeep(changes) {
    if (pending.size === 0) return {};
    const mailState = changes && changes.body && changes.body.mailState;
    if (!mailState || typeof mailState !== 'object') return {};
    const keep = {};
    for (const [key, value] of Object.entries(mailState)) {
      if (value && typeof value === 'object' && value.folder === 'sent'
          && typeof value.targetId === 'string' && pending.has(value.targetId)) {
        keep[key] = value;
      }
    }
    return Object.keys(keep).length ? { mailState: keep } : {};
  }

  stateSync?.registerPart?.('captures', {
    build: () => (pending.size ? [...pending.values()] : undefined),
    onAnswer,
    pendingCount: () => pending.size,
    flushKeep
  });

  if (typeof window !== 'undefined') {
    window.submitSECapture = submitCapture;
    window.mirrorSECapture = mirrorCapture;
  }

  return { submitCapture, mirrorCapture, onAnswer, flushKeep, pendingCount: () => pending.size };
}
