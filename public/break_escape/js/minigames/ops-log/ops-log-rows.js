/**
 * Ops log viewer: pure helpers (no DOM, no imports), so a node test can run them directly.
 * Plan: OPS_LOG_ROWS_PLAN.md 5.2 and 7. A row from GET /log_rows has exactly the keys
 * id, elapsedMs or at, event, as, where, result, detail. Every value is a string or number;
 * the viewer shows each through textContent.
 */

export const COLUMNS = [
    { key: 'time', label: 'TIME' },
    { key: 'event', label: 'EVENT' },
    { key: 'as', label: 'IDENTITY' },
    { key: 'where', label: 'LOCATION' },
    { key: 'result', label: 'RESULT' },
    { key: 'detail', label: 'DETAIL' }
];

// Four six-hour ranges, read from the row's hour (never from string positions)
export const TIME_RANGES = [
    { id: 'night', label: '00:00-05:59', from: 0, to: 6 },
    { id: 'morning', label: '06:00-11:59', from: 6, to: 12 },
    { id: 'afternoon', label: '12:00-17:59', from: 12, to: 18 },
    { id: 'evening', label: '18:00-23:59', from: 18, to: 24 }
];

const pad2 = (n) => String(n).padStart(2, '0');
const text = (v) => (v === undefined || v === null ? '' : String(v));

/** A seed row's authored `at` ("07:12" or "Mon 23:58") as { day, hours, minutes }, or null. */
export function parseAt(at) {
    const m = /^\s*(?:([A-Za-z]{2,9})\s+)?(\d{1,2}):(\d{2})\s*$/.exec(text(at));
    if (!m) return null;
    const hours = Number(m[2]);
    const minutes = Number(m[3]);
    if (hours > 23 || minutes > 59) return null;
    return { day: m[1] || '', hours, minutes };
}

function partsOf(row, clock) {
    if (typeof row.at === 'string' && row.at !== '') return parseAt(row.at);
    if (typeof row.elapsedMs === 'number' && Number.isFinite(row.elapsedMs)) {
        if (clock && typeof clock.timeParts === 'function') {
            const p = clock.timeParts(row.elapsedMs);
            return { day: p.day || '', hours: p.hours, minutes: p.minutes };
        }
        const total = Math.floor(row.elapsedMs / 60000);
        return { day: '', hours: Math.floor(total / 60) % 24, minutes: total % 60 };
    }
    return null;
}

/** The TIME cell: a play row through the game clock, a seed row as authored. */
export function timeText(row, clock) {
    if (typeof row.at === 'string' && row.at !== '') return row.at;
    if (typeof row.elapsedMs === 'number' && Number.isFinite(row.elapsedMs)) {
        if (clock && typeof clock.formatStamp === 'function') return clock.formatStamp(row.elapsedMs);
        const p = partsOf(row, null);
        return `${pad2(p.hours)}:${pad2(p.minutes)}`;
    }
    return '-';
}

/** The row's hour 0-23, or null when it has no readable time. */
export function rowHour(row, clock) {
    const p = partsOf(row, clock);
    return p ? p.hours : null;
}

export function timeRangeOf(row, clock) {
    const h = rowHour(row, clock);
    if (h === null) return null;
    return TIME_RANGES.find(r => h >= r.from && h < r.to)?.id || null;
}

/** The value a column shows for a row. */
export function cellText(row, key, clock) {
    if (key === 'time') return timeText(row, clock);
    const v = text(row[key]);
    return v === '' ? '-' : v;
}

/** Distinct values, in first-seen order, of one column across the rows. */
export function distinctValues(rows, key) {
    const seen = [];
    for (const r of rows) {
        const v = text(r[key]);
        if (v !== '' && !seen.includes(v)) seen.push(v);
    }
    return seen;
}

/**
 * The word of a RESULT cell, without the merge count or the open-ended plus: "FAIL x3" and
 * "FAIL" are both "FAIL", "DENIED x10+" is "DENIED", "BLOCKED+" is "BLOCKED". The RESULT filter
 * works on this word, so a count that grows never makes a chosen filter value disappear.
 */
export function resultWord(result) {
    return text(result).replace(/\s+x\d+\+?$/, '').replace(/\+$/, '');
}

/** The option lists the filter bar offers: EVENT, RESULT (as words) and LOCATION values present. */
export function buildFilterOptions(rows) {
    const words = [];
    for (const r of rows) {
        const w = resultWord(r.result);
        if (w !== '' && !words.includes(w)) words.push(w);
    }
    return {
        event: distinctValues(rows, 'event'),
        result: words,
        where: distinctValues(rows, 'where')
    };
}

/**
 * Clears (in place) every select filter whose value is no longer among the options the rows
 * offer, and returns the keys it cleared. A filter must never stay set to a value the player
 * cannot see in its select.
 */
export function pruneFilters(filters, rows) {
    const opts = buildFilterOptions(rows);
    const cleared = [];
    for (const key of ['event', 'result', 'where']) {
        if (filters[key] && !opts[key].includes(filters[key])) { filters[key] = ''; cleared.push(key); }
    }
    return cleared;
}

export const EMPTY_FILTERS = Object.freeze({ event: '', result: '', where: '', as: '', time: '' });

/** Rows that match every set filter. IDENTITY is a case-insensitive substring. */
export function applyFilters(rows, filters, clock) {
    const f = { ...EMPTY_FILTERS, ...(filters || {}) };
    const who = f.as.trim().toLowerCase();
    return rows.filter(r =>
        (!f.event || text(r.event) === f.event) &&
        (!f.result || resultWord(r.result) === f.result) &&
        (!f.where || text(r.where) === f.where) &&
        (!who || text(r.as).toLowerCase().includes(who)) &&
        (!f.time || timeRangeOf(r, clock) === f.time));
}

/** The status line: "3 rows", "2 of 5 rows". */
export function countText(shown, total) {
    const noun = (n) => (n === 1 ? 'row' : 'rows');
    return shown >= total ? `${total} ${noun(total)}` : `${shown} of ${total} ${noun(total)}`;
}

/** Detail panel fields, in order, each [label, value]. */
export function detailFields(row, clock) {
    return COLUMNS.map(c => [c.label, cellText(row, c.key, clock)]);
}

/** Keeps only the answer's seven keys, coerced to plain values. Anything else is dropped. */
export function cleanRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.filter(r => r && typeof r === 'object' && text(r.id) !== '').map(r => {
        const out = { id: text(r.id) };
        if (typeof r.at === 'string') out.at = r.at;
        else if (typeof r.elapsedMs === 'number') out.elapsedMs = r.elapsedMs;
        for (const k of ['event', 'as', 'where', 'result', 'detail']) out[k] = text(r[k]);
        return out;
    });
}
