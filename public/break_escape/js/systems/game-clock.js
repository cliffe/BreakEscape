/**
 * GameClock - elapsed game time that survives a reload, and an optional in-game
 * time of day.
 *
 * Elapsed time is wall time since the game started, minus the time the page
 * was closed: on load it resumes from the elapsed time saved at the last sync
 * (state-sync.js sends exportState() as part of `scenarioClock`). Scenario
 * timers count from the same start, so a reload no longer restarts them.
 *
 * A scenario can set an in-game start time:
 *   "gameClock": { "start": "Tue 07:30" }      (or just "gameClock": "Tue 07:30")
 * The in-game time is then the start plus elapsed game time. Without it,
 * clock displays keep showing the real wall clock, as they always did.
 *
 * A story rate and phase anchors keep the in-game time in step with the story:
 *   "gameClock": { "start": "Wed 16:30", "rate": 6,
 *                  "anchors": [{ "condition": "globalVars.night === true", "time": "20:10" }] }
 * rate: game minutes per real minute (default 1). anchors: when an anchor's
 * condition (globalVars syntax, && only) first holds, the clock jumps forward to
 * its time, never back; a time with no day means that time on the current game
 * day. Reached anchors are saved with the clock, so a reload keeps each message's
 * time. Elapsed game time (timers, delays) is real time and is not scaled.
 */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Parse an in-game start time: "Tue 07:30", "Tuesday 07:30:15", "07:30".
 * @returns {{dayIndex: number|null, seconds: number}|null} dayIndex 0 = Sunday;
 *   seconds since midnight
 */
export function parseGameClockStart(config) {
  const raw = typeof config === 'string' ? config : config?.start;
  if (typeof raw !== 'string') return null;
  const m = raw.trim().match(/^(?:([A-Za-z]{3,9})\.?\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  let dayIndex = null;
  if (m[1]) {
    dayIndex = WEEKDAYS.findIndex(d => m[1].toLowerCase().startsWith(d.toLowerCase()));
    if (dayIndex < 0) return null;
  }
  const h = Number(m[2]);
  const min = Number(m[3]);
  const s = Number(m[4] || 0);
  if (h > 23 || min > 59 || s > 59) return null;
  return { dayIndex, seconds: h * 3600 + min * 60 + s };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Game minutes per real minute: a positive number, else 1. Capped at 1440 (a day a minute). */
export function parseGameClockRate(config) {
  const rate = Number(config && typeof config === 'object' ? config.rate : undefined);
  return Number.isFinite(rate) && rate > 0 ? Math.min(rate, 1440) : 1;
}

/** The scenario's anchors that parse: [{ index, condition, target: {dayIndex, seconds} }]. */
export function parseGameClockAnchors(config) {
  const list = config && typeof config === 'object' && Array.isArray(config.anchors) ? config.anchors : [];
  return list.map((a, index) => ({
    index,
    condition: typeof a?.condition === 'string' ? a.condition : null,
    target: parseGameClockStart(a?.time)
  })).filter(a => a.condition && a.target);
}


export class GameClock {
  /**
   * @param {Object} opts
   * @param {Object|string} [opts.config] - scenario.gameClock
   * @param {Object} [opts.saved] - exportState() output from the last sync
   * @param {number} [opts.now]
   */
  constructor({ config = null, saved = null, now = Date.now() } = {}) {
    const savedElapsed = Number(saved?.elapsedMs);
    this.startTime = now - (Number.isFinite(savedElapsed) && savedElapsed > 0 ? savedElapsed : 0);
    this.start = parseGameClockStart(config);
    this.rate = parseGameClockRate(config);
    this.anchors = this.start ? parseGameClockAnchors(config) : [];
    // Anchors already reached: index -> { atMs: elapsed ms, gameSec: game seconds from
    // the start day's midnight }. Restored from the save, so times stay put.
    this.reached = new Map();
    const savedAnchors = saved?.anchors && typeof saved.anchors === 'object' ? saved.anchors : {};
    for (const a of this.anchors) {
      const r = savedAnchors[a.index] || savedAnchors[String(a.index)];
      if (r && Number.isFinite(Number(r.atMs)) && Number.isFinite(Number(r.gameSec))) {
        this.reached.set(a.index, { atMs: Number(r.atMs), gameSec: Number(r.gameSec) });
      }
    }
  }

  /**
   * Game seconds from the start day's midnight at an elapsed time: the start,
   * advanced at the story rate from the latest anchor reached by then.
   */
  gameSecondsAt(atElapsedMs) {
    let fromMs = 0;
    let fromSec = this.start ? this.start.seconds : 0;
    for (const r of this.reached.values()) {
      if (r.atMs <= atElapsedMs && r.atMs >= fromMs) { fromMs = r.atMs; fromSec = r.gameSec; }
    }
    // Before the game started (a preloaded text "an hour ago") time runs at 1:1,
    // so a backdated message keeps the gap it was written with
    const rate = atElapsedMs < 0 ? 1 : this.rate;
    return fromSec + Math.floor(((atElapsedMs - fromMs) / 1000) * rate);
  }

  /** An anchor's time as game seconds from the start day's midnight, on or after `nowSec`'s day. */
  anchorGameSeconds(target, nowSec) {
    if (target.dayIndex === null || this.start.dayIndex === null) {
      return Math.floor(nowSec / 86400) * 86400 + target.seconds;
    }
    const days = ((target.dayIndex - this.start.dayIndex) % 7 + 7) % 7;
    let sec = days * 86400 + target.seconds;
    while (sec + 7 * 86400 <= nowSec) sec += 7 * 86400;
    return sec;
  }

  /**
   * Jump to any anchor whose condition now holds (first time only), never back.
   * @param {(condition: string) => boolean} holds - evaluates a globalVars condition
   * @returns {boolean} true when the clock moved
   */
  checkAnchors(holds, now = Date.now()) {
    if (!this.anchors.length || typeof holds !== 'function') return false;
    let moved = false;
    for (const a of this.anchors) {
      if (this.reached.has(a.index)) continue;
      let ok = false;
      try { ok = holds(a.condition) === true; } catch (e) { ok = false; }
      if (!ok) continue;
      const atMs = this.elapsedMs(now);
      const cur = this.gameSecondsAt(atMs);
      const target = this.anchorGameSeconds(a.target, cur);
      this.reached.set(a.index, { atMs, gameSec: Math.max(cur, target) });
      if (target > cur) moved = true;
    }
    return moved;
  }

  /** True when the scenario gave an in-game start time. */
  get configured() {
    return !!this.start;
  }

  elapsedMs(now = Date.now()) {
    return Math.max(0, now - this.startTime);
  }

  /**
   * In-game (or, unconfigured, wall-clock) date parts for a game time.
   * @param {number} [atElapsedMs] - defaults to now
   * @returns {{day: string, hours: number, minutes: number, seconds: number}}
   */
  timeParts(atElapsedMs = this.elapsedMs()) {
    if (!this.start) {
      const d = new Date(this.startTime + atElapsedMs);
      return { day: WEEKDAYS[d.getDay()], hours: d.getHours(), minutes: d.getMinutes(), seconds: d.getSeconds() };
    }
    const total = this.gameSecondsAt(atElapsedMs);
    const dayOffset = Math.floor(total / 86400);
    // A time before the game started (a phone thread preloaded "an hour ago") wraps
    // back into the previous day rather than going negative
    const inDay = ((total % 86400) + 86400) % 86400;
    const day = this.start.dayIndex === null ? '' : WEEKDAYS[(((this.start.dayIndex + dayOffset) % 7) + 7) % 7];
    return { day, hours: Math.floor(inDay / 3600), minutes: Math.floor((inDay % 3600) / 60), seconds: inDay % 60 };
  }

  /** "Tue 07:42" (no day when the scenario gave none). */
  formatStamp(atElapsedMs) {
    const p = this.timeParts(atElapsedMs);
    const hm = `${pad2(p.hours)}:${pad2(p.minutes)}`;
    return p.day ? `${p.day} ${hm}` : hm;
  }

  /** "07:42" or "07:42:05". */
  formatClock(atElapsedMs, withSeconds = false) {
    const p = this.timeParts(atElapsedMs);
    const hm = `${pad2(p.hours)}:${pad2(p.minutes)}`;
    return withSeconds ? `${hm}:${pad2(p.seconds)}` : hm;
  }

  exportState(now = Date.now()) {
    const out = { elapsedMs: this.elapsedMs(now) };
    if (this.reached.size > 0) {
      out.anchors = {};
      for (const [i, r] of this.reached) out.anchors[i] = { atMs: r.atMs, gameSec: r.gameSec };
    }
    return out;
  }
}

/** "HH:MM" of the in-game clock, or of the wall clock when no game clock is set up. */
export function currentClockText(withSeconds = false) {
  const clock = typeof window !== 'undefined' ? window.gameClock : null;
  if (clock?.configured) return clock.formatClock(undefined, withSeconds);
  const d = new Date();
  const hm = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return withSeconds ? `${hm}:${pad2(d.getSeconds())}` : hm;
}

/**
 * The time shown on a phone message: when it arrived, not when the thread was opened.
 * With an in-game clock (scenario.gameClock) that is the game time it arrived at
 * (msg.gameTime, elapsed game ms stamped by NPCManager.addMessage; a message saved
 * without one is placed by its wall timestamp). Without one it is the wall time it
 * arrived (msg.timestamp), in the phone's usual "h:mm" form.
 * @param {{timestamp?: number, gameTime?: number}} msg
 * @param {GameClock|null} [clock] - defaults to window.gameClock
 * @param {number} [now] - used when the message has no time at all
 * @returns {string}
 */
export function messageClockText(msg, clock = (typeof window !== 'undefined' ? window.gameClock : null), now = Date.now()) {
  const timestamp = Number.isFinite(msg?.timestamp) ? msg.timestamp : null;
  if (clock?.configured) {
    let at = Number.isFinite(msg?.gameTime) ? msg.gameTime : null;
    if (at === null) at = timestamp !== null ? timestamp - clock.startTime : clock.elapsedMs(now);
    return clock.formatClock(at);
  }
  const d = new Date(timestamp !== null ? timestamp : now);
  return `${d.getHours() % 12 || 12}:${pad2(d.getMinutes())}`;
}

if (typeof window !== 'undefined') {
  window.GameClock = GameClock;
}
