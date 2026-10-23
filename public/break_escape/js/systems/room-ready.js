// Wait for a lazily loaded room to be ready for door set-up.
//
// loadRoom() (core/rooms.js) is async: it fetches the room, loads its NPCs
// (ink story, textures) and only then calls createRoom(), which stores
// room.doorSprites. How long that takes depends on the room, so doors.js must
// not guess a fixed delay. loadPromise is loadRoom's own promise, which
// resolves right after createRoom() returns; once it settles the room is
// either ready or has failed. The timeout is a generous backstop for the case
// where no load promise is available and the room never appears.
export const ROOM_READY_TIMEOUT_MS = 30000;
const POLL_MS = 50;

const isReady = (room) => !!room && room.doorSprites !== undefined;

// Resolves { ready, timedOut, waitedMs, room }. Never rejects.
export function waitForRoomReady(getRoom, loadPromise, opts = {}) {
    const timeoutMs = opts.timeoutMs ?? ROOM_READY_TIMEOUT_MS;
    const pollMs = opts.pollMs ?? POLL_MS;
    const started = Date.now();
    const result = (ready, timedOut) => ({
        ready, timedOut, waitedMs: Date.now() - started, room: getRoom() || null
    });

    return new Promise((resolve) => {
        let done = false;
        let timer = null;
        const finish = (ready, timedOut) => {
            if (done) return;
            done = true;
            if (timer) clearTimeout(timer);
            resolve(result(ready, timedOut));
        };
        const poll = () => {
            if (done) return;
            if (isReady(getRoom())) return finish(true, false);
            if (Date.now() - started >= timeoutMs) return finish(false, true);
            timer = setTimeout(poll, pollMs);
        };
        // loadRoom's promise settling is the real signal: createRoom has run,
        // or the load failed and nothing more is coming. Without a promise
        // (a load started elsewhere) fall back to polling until the timeout.
        if (loadPromise) {
            Promise.resolve(loadPromise).then(
                () => finish(isReady(getRoom()), false),
                () => finish(isReady(getRoom()), false)
            );
            return;
        }
        poll();
    });
}
