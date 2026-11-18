// Send the latest globals to the server before a networked request (9.3b plan 5.2).
//
// The server judges outages, a host's own service and the like from its copy of the globals, so
// a remote sign-in, a remote desktop fetch and a share fetch await window.stateSync.sync()
// first: a switch flipped a moment ago counts at once. This is the wait the network view uses
// (network-links.js view calls this helper): a failed or slow sync never blocks the request, which goes after
// SYNC_BEFORE_FETCH_WAIT_MS with the server's last known state. sync() sends deltas only, so
// the synced player_state does not grow.

export const SYNC_BEFORE_FETCH_WAIT_MS = 3000;

/**
 * Resolves { synced: boolean, timedOut: boolean, run } and never rejects. `synced` is true only
 * when the sync finished and did not report failure within the limit; `run` is the sync's own
 * promise (true when it landed), for a caller that wants to act when a slow one finishes.
 */
export async function syncBeforeFetch({ waitMs = SYNC_BEFORE_FETCH_WAIT_MS } = {}) {
    const sync = typeof window !== 'undefined' ? window.stateSync?.sync : null;
    if (typeof sync !== 'function') return { synced: false, timedOut: false };
    let timer;
    try {
        const TIMED_OUT = {};
        const run = Promise.resolve(window.stateSync.sync()).then(ok => ok !== false, () => false);
        const waited = new Promise(r => { timer = setTimeout(() => r(TIMED_OUT), waitMs); });
        const result = await Promise.race([run, waited]);
        return result === TIMED_OUT ? { synced: false, timedOut: true, run } : { synced: result === true, timedOut: false, run };
    } catch (e) {
        return { synced: false, timedOut: false };
    } finally {
        clearTimeout(timer);
    }
}
