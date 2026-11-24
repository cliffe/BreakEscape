// Second step on a lock (ops layer S8c unit 08). A leaf: no imports, everything arrives through
// configure. run() takes the `secondStep: true` answer from POST /unlock plus the body just
// posted, opens one pane at a time, and resolves with the FINAL /unlock answer (or rejects with a
// cancel error shaped like a refused post). Nothing here stores a request body outside a closure,
// and nothing here emits an event itself (mfa.noteRequired does).

const PENDING_TOAST = 'Second step pending. It opens when you finish here.';
const NOT_APPROVED = 'Not approved.';
const CLEAR_RETRY_MS = 400;

const NOOP = () => {};
let cfg = {};
let paneOpen = false;
// Requests ready to open that found a pane open: { start() }, served in order
let waiting = [];

export function configure(options = {}) {
    cfg = { ...options };
}

export function reset() {
    cfg = {};
    paneOpen = false;
    waiting = [];
}

function fn(name) {
    return typeof cfg[name] === 'function' ? cfg[name] : NOOP;
}

function cancelError(closedByPlayer) {
    const err = new Error('Second step cancelled');
    err.status = 403;
    err.body = { success: false, reason: 'second_step_cancelled', closedByPlayer: closedByPlayer === true };
    return err;
}

export function isCancel(error) {
    return !!error && error.status === 403 && !!error.body && error.body.reason === 'second_step_cancelled';
}

// A deny or an expiry shows the reject tone once and "Not approved."; the player's own X shows nothing.
export function cancelFeedback(error) {
    if (!isCancel(error) || error.body.closedByPlayer === true) return false;
    fn('rejectTone')();
    fn('toast')(NOT_APPROVED);
    return true;
}

function copy(body) {
    return JSON.parse(JSON.stringify(body || {}));
}

// Resolves true when the screen is clear and the pane may open, false for a door retry that is not.
function whenClear(request, opts) {
    const isClear = fn('isClear');
    if (opts.fromDoor) return Promise.resolve(request.method === 'npc' ? isClear() === true : true);
    if (request.method !== 'npc') return Promise.resolve(true);
    if (isClear() === true) return Promise.resolve(true);
    fn('toast')(PENDING_TOAST);
    return new Promise((resolve) => {
        let clearRun = 0;
        const tick = () => {
            clearRun = isClear() === true ? clearRun + 1 : 0;
            if (clearRun >= 2) { resolve(true); return; }
            fn('setTimer')(tick, CLEAR_RETRY_MS);
        };
        fn('setTimer')(tick, CLEAR_RETRY_MS);
    });
}

async function post(body) {
    const clientTs = fn('nextClientTs')();
    const answer = await cfg.post('/unlock', copy(body));
    fn('applyServerWrites')(answer, clientTs);
    return answer;
}

// The one pane slot. Taken by a request ready to open, held until its pane closes (or until a
// queued request settles without one), then handed straight to the next in line.
function release() {
    const next = waiting.shift();
    if (next) next(); else paneOpen = false;
}

// Resolves false when the slot was free (now ours), true when we queued and the slot was handed on.
function takeSlot() {
    return new Promise((resolve) => {
        if (paneOpen) { waiting.push(() => resolve(true)); return; }
        paneOpen = true;
        resolve(false);
    });
}

// Open the pane on an answer and settle with its outcome. Never rejects. Holds the slot.
async function showPane(answer, fromDoor) {
    try {
        const ctx = {
            subject: `${answer.targetType}:${answer.targetId}`,
            targetType: answer.targetType,
            targetId: answer.targetId,
            kind: answer.kind,
            npcId: answer.npcId,
            number: answer.number,
            opener: answer.opener,
            fromDoor: fromDoor === true
        };
        const pane = fn('openPane')(ctx);
        return await pane.done;
    } catch (e) {
        return 'closed';
    }
}

export async function run(answer, request, opts = {}) {
    const body = copy(request);
    const fromDoor = opts.fromDoor === true;
    let current = answer;
    const subject = `${current.targetType}:${current.targetId}`;
    if (current.targetType === 'door' && current.opener) fn('writeOpener')(current.targetId, current.opener);
    if (cfg.mfa && typeof cfg.mfa.noteRequired === 'function') cfg.mfa.noteRequired(subject, current);

    if (!(await whenClear(body, { fromDoor }))) throw cancelError(true);

    let released = false;
    const queued = await takeSlot();
    try {
        if (queued) {
            let fresh;
            try {
                if (fn('isOpenInClient')(current.targetType, current.targetId) === true) throw cancelError(true);
                fresh = await post(body);
            } catch (e) {
                if (isCancel(e)) throw e;
                throw cancelError(true);
            }
            if (fresh && fresh.success === true) return fresh;
            if (!fresh || fresh.secondStep !== true) throw cancelError(true);
            current = fresh;
        }
        const outcome = await showPane(current, fromDoor);
        release();
        released = true;
        if (outcome === 'passed') {
            const final = await post(body);
            if (final && final.secondStep === true) throw cancelError(false);
            return final;
        }
        if (outcome === 'denied' || outcome === 'expired') throw cancelError(false);
        throw cancelError(true);
    } finally {
        if (!released) release();
    }
}
