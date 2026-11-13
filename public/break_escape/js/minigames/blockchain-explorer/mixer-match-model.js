// "Match across the mixer": the rules behind the blockchain explorer's tracing
// board (mode "mixer_match"). Pure functions, no DOM, so node tests can load it.
//
// A mixer pools many deposits and pays out fresh coins, so the chain itself no
// longer links a deposit to a withdrawal. An analyst links them anyway with
// what the mixer cannot hide:
//   - amount less fee: the payout is the deposit less the pool's cut;
//   - timing window: nothing leaves sooner than the pool's minimum hold (and,
//     when a mixer has one, no later than its maximum);
//   - change outputs: only the amount sent INTO the mixer counts, not the
//     leftover the depositor's wallet paid back to itself;
//   - address reuse: the same people keep cashing out to the same place.
//
// The board never stores the answer. A link is right when it passes the rules,
// and the slot is the one every required deposit's match landed in.
//
// Case data (minigameData, all from the scenario):
//   mixer:       { name, feePercent, minHoldHours, maxHoldHours?, source? }
//   deposits:    [{ id, wallet, label?, amount, time, required?, change?: { wallet, amount } }]
//   withdrawals: [{ id, slot, amount, time }]
// Times are ISO strings ("2025-07-14T21:40Z"). Amounts are whole currency units.

const MINUTE = 60 * 1000;

export function parseTime(value) {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
}

/** The payout a deposit should produce: the deposit less the pool's fee, rounded. */
export function expectedPayout(amount, feePercent) {
    return Math.round(Number(amount) * (1 - (Number(feePercent) || 0) / 100));
}

/** Minutes from deposit to withdrawal (negative when the withdrawal came first). */
export function holdMinutes(deposit, withdrawal) {
    const a = parseTime(deposit?.time);
    const b = parseTime(withdrawal?.time);
    if (a === null || b === null) return null;
    return Math.round((b - a) / MINUTE);
}

/** "6 h 40 m", "-3 h 35 m", "2 d 4 h". */
export function formatHold(minutes) {
    if (minutes === null || minutes === undefined) return '?';
    const sign = minutes < 0 ? '-' : '+';
    let m = Math.abs(minutes);
    const d = Math.floor(m / 1440); m -= d * 1440;
    const h = Math.floor(m / 60); m -= h * 60;
    if (d > 0) return `${sign}${d} d ${h} h`;
    return `${sign}${h} h ${String(m).padStart(2, '0')} m`;
}

/** Withdrawal as a percentage of the deposit, one decimal place ("98.5"). */
export function payoutPercent(deposit, withdrawal) {
    const a = Number(deposit?.amount);
    if (!a) return null;
    return Math.round((Number(withdrawal?.amount) / a) * 1000) / 10;
}

/**
 * Check one link against the mixer's rules.
 * @returns {{ ok:boolean, amountOk:boolean, timeOk:boolean, hold:number|null,
 *             expected:number, problems:Array<{code:string}> }}
 * Problem codes: before_deposit, too_early, too_late, no_fee, change_included,
 * wrong_amount.
 */
export function evaluateLink(deposit, withdrawal, mixer = {}) {
    const fee = Number(mixer.feePercent) || 0;
    const minHold = (Number(mixer.minHoldHours) || 0) * 60;
    const maxHold = mixer.maxHoldHours != null ? Number(mixer.maxHoldHours) * 60 : null;
    const expected = expectedPayout(deposit.amount, fee);
    const hold = holdMinutes(deposit, withdrawal);
    const problems = [];

    let timeOk = true;
    if (hold === null || hold < 0) { timeOk = false; problems.push({ code: 'before_deposit' }); }
    else if (hold < minHold) { timeOk = false; problems.push({ code: 'too_early' }); }
    else if (maxHold !== null && hold > maxHold) { timeOk = false; problems.push({ code: 'too_late' }); }

    const amount = Number(withdrawal.amount);
    const amountOk = amount === expected;
    if (!amountOk) {
        const withChange = deposit.change ? expectedPayout(Number(deposit.amount) + Number(deposit.change.amount), fee) : null;
        if (fee > 0 && amount === Number(deposit.amount)) problems.push({ code: 'no_fee' });
        else if (withChange !== null && amount === withChange) problems.push({ code: 'change_included' });
        else problems.push({ code: 'wrong_amount' });
    }

    return { ok: amountOk && timeOk, amountOk, timeOk, hold, expected, problems };
}

/** Every withdrawal that passes the rules for this deposit. */
export function candidatesFor(deposit, withdrawals, mixer) {
    return (withdrawals || []).filter(w => evaluateLink(deposit, w, mixer).ok);
}

export function requiredDeposits(deposits) {
    const list = deposits || [];
    const flagged = list.filter(d => d.required);
    return flagged.length ? flagged : list;
}

/**
 * The slot every required deposit's match landed in, given a map
 * depositId -> withdrawal. Null until all are matched or if they disagree.
 */
export function reusedSlot(deposits, matches) {
    const req = requiredDeposits(deposits);
    if (!req.length) return null;
    const slots = new Set();
    for (const d of req) {
        const w = matches[d.id];
        if (!w) return null;
        slots.add(String(w.slot));
    }
    return slots.size === 1 ? [...slots][0] : null;
}

/**
 * Authoring check: each required deposit must have exactly one withdrawal that
 * passes the rules, and they must share one slot. Returns a list of problems
 * (empty when the case is solvable one way only).
 */
export function checkCase({ deposits, withdrawals, mixer }) {
    const issues = [];
    const matches = {};
    for (const d of requiredDeposits(deposits)) {
        const c = candidatesFor(d, withdrawals, mixer);
        if (c.length !== 1) issues.push(`deposit ${d.id}: ${c.length} withdrawals pass the rules (want 1)`);
        else matches[d.id] = c[0];
    }
    if (!issues.length && reusedSlot(deposits, matches) === null) {
        issues.push('the required deposits do not all land in one slot');
    }
    return issues;
}

/** The plain-English reason for a problem code, for the board's feedback line. */
export function problemText(code, { deposit, withdrawal, mixer, result, money }) {
    const fmt = money || (n => String(n));
    const hours = Number(mixer.minHoldHours) || 0;
    switch (code) {
        case 'before_deposit':
            return 'That credit cleared before the deposit went in. Money can\'t come out before it goes in.';
        case 'too_early':
            return `Too soon: ${formatHold(result.hold).slice(1)} after the deposit, and the pool holds everything for at least ${hours} hours.`;
        case 'too_late':
            return `Too late: outside the pool's ${mixer.maxHoldHours}-hour window.`;
        case 'no_fee':
            return `That's the full ${fmt(deposit.amount)}, with no fee taken. The mixer keeps ${mixer.feePercent}% of every output.`;
        case 'change_included':
            return 'That matches the whole spend, change and all. Only the amount sent into the mixer counts.';
        case 'wrong_amount':
            return `Wrong amount: ${fmt(withdrawal.amount)} isn't ${fmt(deposit.amount)} less ${mixer.feePercent}%.`;
        default:
            return 'That doesn\'t fit the pool\'s rules.';
    }
}
