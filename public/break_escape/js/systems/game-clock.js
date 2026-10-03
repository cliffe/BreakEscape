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
    const total = this.start.seconds + Math.floor(atElapsedMs / 1000);
    const dayOffset = Math.floor(total / 86400);
    const inDay = total % 86400;
    const day = this.start.dayIndex === null ? '' : WEEKDAYS[(this.start.dayIndex + dayOffset) % 7];
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
    return { elapsedMs: this.elapsedMs(now) };
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

if (typeof window !== 'undefined') {
  window.GameClock = GameClock;
}
