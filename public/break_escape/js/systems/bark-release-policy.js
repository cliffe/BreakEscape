// Release policy for barks held while a minigame is open (npc-barks.js holds them,
// minigame-manager.js and person-chat call drainDeferredBarks when it closes).
// No imports, so node tests can load it on its own.
//
//  1. First in, first out.
//  2. Re-check at release: a bark may carry stillValid(), a function that re-runs the
//     conditions that gated it when it was queued (the eventMapping's `condition`
//     against the original event data, or a timed text's skipIfGlobal). False => dropped
//     as "stale". A bark with no stillValid() can't go stale.
//  3. One at a time: the next waits until HELD_BARK_GAP_MS after the last one showed, or
//     HELD_BARK_VOICE_PAUSE_MS after its voice ended, whichever is later. The wait also
//     follows the last bark if it was voiced, so a bark arriving while that voice plays
//     joins the line instead of talking over it. A voice that never settles
//     is waited for at most HELD_BARK_VOICE_CAP_MS. If a minigame opens mid-release (or
//     during that last wait), the rest wait for the next release.
//  4. Cap: if more than HELD_BARK_CAP are still waiting, the oldest beyond the newest
//     HELD_BARK_CAP are dropped ("capped"), but only barks with a persistent copy
//     (hasPersistentCopy(): the text is in a phone thread the player can reopen).
//     Barks with no persistent copy are never capped.
//  5. Every drop is logged with console.debug and its reason.

export const HELD_BARK_GAP_MS = 2500;
export const HELD_BARK_CAP = 3;
export const HELD_BARK_VOICE_CAP_MS = 30000;
export const HELD_BARK_VOICE_PAUSE_MS = 300;   // silence between one voice and the next

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
 * @param {Array} queue           held payloads, oldest first (mutated; barks pushed while it
 *                                runs are released too, in order)
 * @param {Object} o
 * @param {Function} o.shouldHold   () => true while a minigame is open
 * @param {Function} o.render       (payload) => optional { voiceEnd }: voiceEnd is a promise
 *                                  that settles when its voice has ended, true if a voice played
 * @param {Function} [o.sleep]      (ms) => Promise
 * @param {Function} [o.hasPersistentCopy]
 * @param {number}   [o.gapMs]
 * @param {number}   [o.voiceCapMs]  longest wait for one voice to end
 * @param {number}   [o.pauseMs]     silence after a voice before the next bark
 * @param {Function} [o.log]
 * @returns {Promise<number>} how many barks were shown
 */
export async function releaseHeldBarks(queue, o) {
  const {
    shouldHold, render, hasPersistentCopy = () => false, gapMs = HELD_BARK_GAP_MS,
    voiceCapMs = HELD_BARK_VOICE_CAP_MS, pauseMs = HELD_BARK_VOICE_PAUSE_MS,
    sleep = (ms) => new Promise(r => setTimeout(r, ms)), log = console.debug
  } = o;
  if (queue.length === 0 || shouldHold()) return 0;
  pruneHeldBarks(queue, { hasPersistentCopy, log });
  let shown = 0;
  while (queue.length > 0) {
    if (shouldHold()) break;                 // a minigame opened: the rest wait for it
    const payload = queue.shift();
    if (isStale(payload)) { drop(payload, 'stale', log); continue; }
    const out = await render(payload);
    shown++;
    const voiceEnd = out && typeof out === 'object' ? out.voiceEnd : null;
    if (!voiceEnd) {
      if (queue.length > 0) await sleep(gapMs);
      continue;
    }
    // Wait for max(voice end + pause, shown + gap); the voice wait is capped. After the last
    // bark, wait only if it spoke: a bark that came in meanwhile is now queued and goes next.
    const gap = sleep(gapMs);
    let ended = false;
    const spoke = await Promise.race([
      Promise.resolve(voiceEnd).then(v => { ended = true; return !!v; }, () => { ended = true; return false; }),
      sleep(voiceCapMs).then(() => {
        if (!ended) log('[barks] held bark voice wait capped:', textOf(payload));
        return true;
      })
    ]);
    if (spoke) await Promise.all([gap, sleep(pauseMs)]);
    else if (queue.length > 0) await gap;
  }
  return shown;
}
