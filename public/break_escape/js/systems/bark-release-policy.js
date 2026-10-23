// Release policy for barks held while a minigame is open (npc-barks.js holds them,
// minigame-manager.js and person-chat call drainDeferredBarks when it closes).
// No imports, so node tests can load it on its own.
//
//  1. First in, first out.
//  2. Re-check at release: a bark may carry stillValid(), a function that re-runs the
//     conditions that gated it when it was queued (the eventMapping's `condition`
//     against the original event data, or a timed text's skipIfGlobal). False => dropped
//     as "stale". A bark with no stillValid() can't go stale.
//  3. One at a time, HELD_BARK_GAP_MS apart (or until its voice finishes, if longer).
//     If a minigame opens mid-release, the rest wait for the next release.
//  4. Cap: if more than HELD_BARK_CAP are still waiting, the oldest beyond the newest
//     HELD_BARK_CAP are dropped ("capped"), but only barks with a persistent copy
//     (hasPersistentCopy(): the text is in a phone thread the player can reopen).
//     Barks with no persistent copy are never capped.
//  5. Every drop is logged with console.debug and its reason.

export const HELD_BARK_GAP_MS = 2500;
export const HELD_BARK_CAP = 3;

const textOf = (p) => (p && (p.text || p.message)) || '';

function drop(payload, reason, log) {
  log(`[barks] dropped held bark (${reason}):`, textOf(payload), payload && payload.npcId);
}

function isStale(payload) {
  if (!payload || typeof payload.stillValid !== 'function') return false;
  try { return !payload.stillValid(); } catch (e) { return false; }   // can't tell: keep it
}

/**
 * Drop stale barks, then apply the cap. Mutates and returns `queue`.
 */
export function pruneHeldBarks(queue, { hasPersistentCopy = () => false, cap = HELD_BARK_CAP, log = console.debug } = {}) {
  for (let i = 0; i < queue.length;) {
    if (isStale(queue[i])) { drop(queue[i], 'stale', log); queue.splice(i, 1); } else i++;
  }
  let excess = queue.length - cap;
  for (let i = 0; i < queue.length && excess > 0;) {
    if (hasPersistentCopy(queue[i])) { drop(queue[i], 'capped', log); queue.splice(i, 1); excess--; } else i++;
  }
  return queue;
}

/**
 * Release held barks in order, one at a time.
 * @param {Array} queue           held payloads, oldest first (mutated)
 * @param {Object} o
 * @param {Function} o.shouldHold   () => true while a minigame is open
 * @param {Function} o.render       async (payload) => optional promise that settles when its voice ends
 * @param {Function} [o.sleep]      (ms) => Promise
 * @param {Function} [o.hasPersistentCopy]
 * @param {number}   [o.gapMs]
 * @param {Function} [o.log]
 * @returns {Promise<number>} how many barks were shown
 */
export async function releaseHeldBarks(queue, o) {
  const {
    shouldHold, render, hasPersistentCopy = () => false, gapMs = HELD_BARK_GAP_MS,
    sleep = (ms) => new Promise(r => setTimeout(r, ms)), log = console.debug
  } = o;
  if (queue.length === 0 || shouldHold()) return 0;
  pruneHeldBarks(queue, { hasPersistentCopy, log });
  let shown = 0;
  while (queue.length > 0) {
    if (shouldHold()) break;                 // a minigame opened: the rest wait for it
    const payload = queue.shift();
    if (isStale(payload)) { drop(payload, 'stale', log); continue; }
    const voice = await render(payload);
    shown++;
    if (queue.length > 0) await Promise.all([voice || Promise.resolve(), sleep(gapMs)]);
  }
  return shown;
}
