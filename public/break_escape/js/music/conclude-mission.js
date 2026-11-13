/**
 * Asking the server to conclude the mission, and what the ending says when it
 * can't be asked (R14).
 *
 * The player reaching the end of the story must not lose the ending to a dropped
 * request, so a conclude that never gets an answer still rolls the credits. It no
 * longer rolls the server-confirmed MISSION COMPLETE, though: the header, the
 * status row and the title say the result is not recorded yet and will sync, and
 * the conclude is retried in the background until the server answers.
 *
 * No imports, so node tests can load it on its own.
 */

const TAG = '[ConcludeMission]';

/** Waits before each retry of a conclude that got no answer (ms). */
export const CONCLUDE_RETRY_DELAYS_MS = [1500, 4000];
/** Background retry period once the ending is showing offline (ms). */
export const BACKGROUND_RETRY_MS = 30000;

export const OFFLINE_HEADER = 'RESULT NOT YET RECORDED // WILL SYNC';
export const OFFLINE_STATUS = 'PENDING SYNC';
export const OFFLINE_TITLE = 'MISSION COMPLETE: NOT YET RECORDED';
export const OFFLINE_NOTE = 'Your result has not reached the server yet. It will sync when the connection returns. Keep this page open.';
export const RECORDED_NOTICE = 'Mission result recorded.';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * One conclude request. Resolves { concluded, missing } when the server answered,
 * or { failed: true, why } when it did not (network error, HTTP error, a body that
 * is not JSON).
 * @param {string|number} gameId
 * @param {object} [deps] - fetch, csrf
 */
export async function postConclude(gameId, deps = {}) {
    const fetchImpl = deps.fetch ?? (typeof fetch === 'function' ? fetch : null);
    if (!fetchImpl) return { failed: true, why: 'no fetch' };
    const csrf = deps.csrf ?? (typeof document !== 'undefined'
        ? document.querySelector('meta[name="csrf-token"]')?.content || '' : '');
    let response;
    try {
        response = await fetchImpl(`/break_escape/games/${gameId}/conclude`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        });
    } catch (err) {
        return { failed: true, why: `request did not reach the server (${err?.message || err})` };
    }
    if (!response.ok) {
        return { failed: true, why: `HTTP ${response.status}` };
    }
    try {
        const json = await response.json();
        return { concluded: !!(json.success || json.alreadyConcluded), missing: json.missing || [] };
    } catch (err) {
        return { failed: true, why: 'a 200 that is not JSON' };
    }
}

/**
 * Conclude, retrying a request that got no answer. Resolves
 * { concluded, missing, offline }: offline is true when every attempt failed, and
 * concluded is then true too (the fail-open choice: the player keeps the ending).
 * @param {string|number} gameId
 * @param {object} [deps] - fetch, csrf, delays, wait
 */
export async function concludeWithRetry(gameId, deps = {}) {
    if (!gameId) return { concluded: true, missing: [], offline: false };
    const delays = deps.delays ?? CONCLUDE_RETRY_DELAYS_MS;
    const wait = deps.wait ?? sleep;
    let last;
    for (let attempt = 0; attempt <= delays.length; attempt++) {
        if (attempt > 0) await wait(delays[attempt - 1]);
        last = await postConclude(gameId, deps);
        if (!last.failed) return { ...last, offline: false };
        console.warn(`${TAG} conclude attempt ${attempt + 1} failed: ${last.why}`);
    }
    console.error(`${TAG} conclude never reached the server (${last?.why}). ` +
        'Showing the ending as not yet recorded, and retrying in the background.');
    return { concluded: true, missing: [], offline: true };
}

/**
 * The credits options for an ending the server has not recorded: the scenario's
 * own credits, with any plain "MISSION COMPLETE" title replaced and a note that the
 * result will sync. Never the server-confirmed wording.
 * @param {object} opts - the BondVisualiser.open options the ending would use
 * @returns {object} a copy with headerText, statusText and credits changed
 */
export function offlineEndingOptions(opts = {}) {
    const credits = Array.isArray(opts.credits) ? opts.credits : [];
    const textOf = (line) => (typeof line === 'string' ? line : line?.text);
    const out = [];
    let titled = false;
    for (const line of credits) {
        const text = textOf(line);
        if (!titled && typeof text === 'string' && /^\s*mission complete\s*$/i.test(text)) {
            out.push(typeof line === 'string' ? OFFLINE_TITLE : { ...line, text: OFFLINE_TITLE });
            out.push({ text: OFFLINE_NOTE, style: 'warning' });
            titled = true;
            continue;
        }
        out.push(line);
    }
    if (!titled) {
        out.unshift({ text: OFFLINE_TITLE, style: 'title' }, { text: OFFLINE_NOTE, style: 'warning' });
    }
    return { ...opts, credits: out, headerText: OFFLINE_HEADER, statusText: OFFLINE_STATUS };
}

/**
 * Keep trying the conclude in the background (every BACKGROUND_RETRY_MS, and as
 * soon as the browser says it is back online) until the server answers.
 * @param {string|number} gameId
 * @param {object} [deps] - fetch, csrf, window, every, notify, sync
 * @returns {{ stop: Function, attempt: Function }}
 */
export function queueConcludeRetry(gameId, deps = {}) {
    const w = deps.window ?? (typeof window !== 'undefined' ? window : null);
    const every = deps.every ?? BACKGROUND_RETRY_MS;
    const notify = deps.notify ?? ((msg, type, title) => w?.gameAlert?.(msg, type, title, 5000));
    let timer = null;
    let done = false;
    let busy = false;

    const stop = () => {
        done = true;
        if (timer) clearInterval(timer);
        timer = null;
        w?.removeEventListener?.('online', attempt);
    };

    async function attempt() {
        if (done || busy) return null;
        busy = true;
        try {
            await (deps.sync ?? w?.stateSync?.sync?.bind(w.stateSync))?.();
            const result = await postConclude(gameId, deps);
            if (result.failed) return result;
            stop();
            if (result.concluded) {
                notify(RECORDED_NOTICE, 'success', 'Synced');
            } else {
                console.warn(`${TAG} late conclude refused; missing:`, result.missing);
                notify('The server has not recorded this mission as finished: there is outstanding work on their network.',
                    'warning', 'Not Recorded');
            }
            return result;
        } finally {
            busy = false;
        }
    }

    timer = setInterval(attempt, every);
    w?.addEventListener?.('online', attempt);
    return { stop, attempt };
}
