// The blockchain explorer's "match across the mixer" mode (minigameData.mode
// "mixer_match"): a tracing board. Deposits into a mixer sit on the left,
// withdrawals out of it on the right; the player links each deposit to the
// withdrawal it became, using the pool's fee and minimum hold, then names the
// slot the matches all landed in (address reuse). The rules live in
// mixer-match-model.js; all case data comes from the scenario.
//
// Easy by design: wrong links cost nothing and say exactly which rule they
// break, the deltas (time after the deposit, % of the deposit) are printed on
// every withdrawal once a deposit is picked, and "Show working" does the sum.
//
// minigameData (beyond the model's mixer/deposits/withdrawals):
//   title, caseRef, currency ("USD" shows $1,234; anything else "1.2345 BTC")
//   slotLabel:      what a withdrawal lands in ("slot", "wallet"); default "slot"
//   completionText: shown when the slot is named
//   filesLabel:     label of a button that opens the object's own contents
//                   (the container), shown only when the object has contents
//   stateWrites:    { onTraced: <global set true when the slot is named>,
//                     onOpen: [<globals set true when the board opens>] }
//
// Closing is a normal exit: complete(true) with { mode, traced }, so a close
// never emits minigame_failed. Tasks key on the onTraced global.

import { writeGlobal, readGlobal } from '../../systems/global-writer.js';
import {
    evaluateLink, expectedPayout, formatHold, payoutPercent, holdMinutes,
    requiredDeposits, reusedSlot, candidatesFor, checkCase, problemText, parseTime
} from './mixer-match-model.js';

const COLOURS = ['#f0b429', '#58d6ff', '#e38cff', '#7ee787', '#ff8f6b'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** "14 Jul 21:40" in UTC. */
export function formatTime(iso) {
    const ms = parseTime(iso);
    if (ms === null) return String(iso ?? '');
    const d = new Date(ms);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${hh}:${mm}`;
}

export class MixerMatchBoard {
    constructor(scene, md = {}, params = {}) {
        this.scene = scene;
        this.lockable = params.lockable || null;
        this.title = md.title || 'Mixer Tracer';
        this.caseRef = md.caseRef || '';
        this.currency = md.currency || 'USD';
        this.slotLabel = md.slotLabel || 'slot';
        this.completionText = md.completionText || '';
        this.filesLabel = md.filesLabel || '';
        this.mixer = { name: 'the mixer', feePercent: 0, minHoldHours: 0, ...(md.mixer || {}) };
        this.deposits = (md.deposits || []).map((d, i) => ({ ...d, colour: COLOURS[i % COLOURS.length] }));
        this.withdrawals = [...(md.withdrawals || [])].sort((a, b) => (parseTime(a.time) ?? 0) - (parseTime(b.time) ?? 0));
        this.stateWrites = md.stateWrites || {};

        this.matches = {};          // depositId -> withdrawal
        this.selected = null;       // depositId
        this.working = new Set();   // depositIds with "Show working" open
        this.showHelp = false;
        this.feedback = null;       // { kind: 'ok'|'bad'|'info', text }
        this.traced = false;

        const issues = checkCase({ deposits: this.deposits, withdrawals: this.withdrawals, mixer: this.mixer });
        if (issues.length) console.warn('[BlockchainExplorer mixer_match] case data:', issues.join('; '));
    }

    init() {
        for (const name of [].concat(this.stateWrites.onOpen || [])) writeGlobal(name, true);
        if (this.stateWrites.onTraced && readGlobal(this.stateWrites.onTraced)) {
            // Already solved: show the finished board (the rules give one match each).
            this.traced = true;
            for (const d of requiredDeposits(this.deposits)) {
                const c = candidatesFor(d, this.withdrawals, this.mixer);
                if (c.length === 1) this.matches[d.id] = c[0];
            }
        }
        if (!this.traced) this.selected = this.deposits[0]?.id ?? null;
        this.render();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    money(n) {
        const num = Number(n) || 0;
        if (this.currency === 'USD') return `$${Math.round(num).toLocaleString('en-GB')}`;
        if (this.currency === 'GBP') return `£${Math.round(num).toLocaleString('en-GB')}`;
        return `${num.toFixed(4)} ${this.currency}`;
    }

    deposit(id) { return this.deposits.find(d => d.id === id) || null; }

    matchedBy(withdrawal) {
        return this.deposits.find(d => this.matches[d.id]?.id === withdrawal.id) || null;
    }

    allMatched() {
        return requiredDeposits(this.deposits).every(d => this.matches[d.id]);
    }

    nextUnmatched() {
        return requiredDeposits(this.deposits).find(d => !this.matches[d.id])?.id ?? null;
    }

    // ── Actions ────────────────────────────────────────────────────────────

    selectDeposit(id) {
        if (this.traced) return;
        this.selected = id;
        this.feedback = null;
        this.render();
    }

    tryLink(withdrawalId) {
        if (this.traced) return;
        const w = this.withdrawals.find(x => x.id === withdrawalId);
        const d = this.deposit(this.selected);
        if (!w) return;
        if (!d) {
            this.feedback = { kind: 'info', text: 'Pick a deposit on the left first.' };
            return this.render();
        }
        if (this.matches[d.id]) {
            this.feedback = { kind: 'info', text: `${d.label || d.wallet} is already matched. Pick another deposit.` };
            return this.render();
        }
        const taken = this.matchedBy(w);
        if (taken) {
            this.feedback = { kind: 'info', text: `That credit is already matched to ${taken.label || taken.wallet}.` };
            return this.render();
        }
        const result = evaluateLink(d, w, this.mixer);
        if (result.ok) {
            this.matches[d.id] = w;
            this.feedback = {
                kind: 'ok',
                text: `Match. ${this.money(d.amount)} less ${this.mixer.feePercent}% is ${this.money(result.expected)}, `
                    + `and it cleared ${formatHold(result.hold).slice(1)} later, after the ${this.mixer.minHoldHours}-hour hold.`
            };
            this.selected = this.nextUnmatched();
            if (this.allMatched()) {
                this.feedback.text += ` That's all ${requiredDeposits(this.deposits).length}. Now look at where they landed.`;
            }
        } else {
            const ctx = { deposit: d, withdrawal: w, mixer: this.mixer, result, money: n => this.money(n) };
            this.feedback = { kind: 'bad', text: result.problems.map(p => problemText(p.code, ctx)).join(' ') };
        }
        this.render();
    }

    nameSlot(slot) {
        if (this.traced) return;
        const answer = reusedSlot(this.deposits, this.matches);
        if (String(slot) === answer) {
            this.traced = true;
            this.feedback = { kind: 'ok', text: `Address reuse: every matched credit went to ${this.slotLabel} ${answer}.` };
            if (this.stateWrites.onTraced) writeGlobal(this.stateWrites.onTraced, true);
        } else {
            const n = requiredDeposits(this.deposits).filter(d => String(this.matches[d.id]?.slot) === String(slot)).length;
            const total = requiredDeposits(this.deposits).length;
            this.feedback = {
                kind: 'bad',
                text: n === 0
                    ? `None of your matched credits went to ${this.slotLabel} ${slot}.`
                    : `Only ${n} of your ${total} matched credits went to ${this.slotLabel} ${slot}.`
            };
        }
        this.render();
    }

    // ── Render ─────────────────────────────────────────────────────────────

    render() {
        const root = this.scene.gameContainer;
        const outPane = root.querySelector('.bce-mx-out .bce-mx-list');
        const outScroll = outPane?.scrollTop ?? 0;

        const matchedCount = requiredDeposits(this.deposits).filter(d => this.matches[d.id]).length;
        const total = requiredDeposits(this.deposits).length;
        const hasFiles = !!(this.filesLabel && this.lockable?.scenarioData?.contents?.length);

        root.innerHTML = `
            <div class="bce-panel bce-mx">
                <div class="bce-header">
                    <div class="bce-title-group">
                        <span class="bce-title-icon">⛓</span>
                        <span class="bce-title">${esc(this.title)}</span>
                    </div>
                    ${this.caseRef ? `<span class="bce-case-ref">${esc(this.caseRef)}</span>` : ''}
                </div>
                ${this.renderRules()}
                ${this.showHelp ? this.renderHelp() : ''}
                <div class="bce-mx-body">
                    <div class="bce-mx-col bce-mx-in">
                        <div class="bce-mx-heading">INTO ${esc(String(this.mixer.name).toUpperCase())}</div>
                        <div class="bce-mx-list">${this.deposits.map(d => this.renderDeposit(d)).join('')}</div>
                    </div>
                    <div class="bce-mx-col bce-mx-mid">${this.renderMiddle()}</div>
                    <div class="bce-mx-col bce-mx-out">
                        <div class="bce-mx-heading">OUT OF ${esc(String(this.mixer.name).toUpperCase())}</div>
                        <div class="bce-mx-list">${this.withdrawals.map(w => this.renderWithdrawal(w)).join('')}</div>
                    </div>
                </div>
                <div class="bce-mx-feedback ${this.feedback ? `bce-mx-fb-${this.feedback.kind}` : ''}" role="status">
                    ${this.feedback ? esc(this.feedback.text) : esc(this.prompt())}
                </div>
                <div class="bce-footer">
                    <div class="bce-status-bar">
                        <span class="bce-status-item ${matchedCount === total ? 'bce-status-ok' : 'bce-status-pending'}">
                            <span class="bce-status-icon">${matchedCount === total ? '✓' : '○'}</span>
                            Matched ${matchedCount}/${total}
                        </span>
                        <span class="bce-status-item ${this.traced ? 'bce-status-ok' : 'bce-status-pending'}">
                            <span class="bce-status-icon">${this.traced ? '✓' : '○'}</span>
                            ${esc(this.slotLabel.charAt(0).toUpperCase() + this.slotLabel.slice(1))} found
                        </span>
                    </div>
                    <div class="bce-mx-footer-btns">
                        ${hasFiles ? `<button class="bce-close-btn bce-mx-files-btn" id="bce-mx-files" type="button">${esc(this.filesLabel)}</button>` : ''}
                        <button class="bce-close-btn" id="bce-close-btn" type="button">Close</button>
                    </div>
                </div>
            </div>`;

        const newOut = root.querySelector('.bce-mx-out .bce-mx-list');
        if (newOut) newOut.scrollTop = outScroll;
        this.bind();
    }

    prompt() {
        if (this.traced) return 'Traced. Close the board when you\'re ready.';
        if (this.allMatched()) return `Which ${this.slotLabel} did every matched credit land in?`;
        if (!this.selected) return 'Pick a deposit on the left.';
        return 'Now pick the credit on the right that this deposit became.';
    }

    renderRules() {
        const m = this.mixer;
        const holdText = m.maxHoldHours != null ? `${m.minHoldHours}–${m.maxHoldHours} h in the pool` : `at least ${m.minHoldHours} h in the pool`;
        return `
            <div class="bce-mx-rules">
                <span class="bce-mx-rules-label">POOL RULES${m.source ? ` <span class="bce-mx-src">(${esc(m.source)})</span>` : ''}</span>
                <span class="bce-mx-chip">Fee: ${esc(m.feePercent)}% off every output</span>
                <span class="bce-mx-chip">Hold: ${esc(holdText)}</span>
                <button class="bce-mx-help-btn" id="bce-mx-help" type="button">${this.showHelp ? 'Hide tips ▴' : 'How analysts match ▾'}</button>
            </div>`;
    }

    renderHelp() {
        const m = this.mixer;
        const cards = [
            ['Amount less fee', `The mixer keeps its cut. A deposit of $100,000 comes out as $${(100000 - 1000 * m.feePercent).toLocaleString('en-GB')} at ${m.feePercent}%.`],
            ['Timing window', `Coins sit in the pool before they leave. Anything sooner than ${m.minHoldHours} hours after the deposit can't be it.`],
            ['Change outputs', 'A wallet pays the mixer and sends the leftover back to itself. That change never enters the mix: match the deposit, not the whole spend.'],
            ['Address reuse', 'Mixers break the chain, but people reuse the same place to cash out. When several matches land in one wallet, that wallet is theirs.']
        ];
        return `<div class="bce-mx-help">${cards.map(([t, b]) => `
            <div class="bce-mx-tip"><div class="bce-mx-tip-title">${esc(t)}</div><div class="bce-mx-tip-body">${esc(b)}</div></div>`).join('')}
        </div>`;
    }

    renderDeposit(d) {
        const match = this.matches[d.id];
        const sel = d.id === this.selected ? ' bce-mx-selected' : '';
        return `
            <button class="bce-mx-card bce-mx-dep${sel}${match ? ' bce-mx-matched' : ''}" data-dep="${esc(d.id)}" type="button" style="--mx-c:${d.colour}">
                <span class="bce-mx-swatch"></span>
                <span class="bce-mx-card-main">
                    <span class="bce-mx-card-title">${esc(d.label || d.wallet)}</span>
                    <span class="bce-mx-card-sub">${esc(d.wallet)}</span>
                    <span class="bce-mx-card-row"><span>${esc(formatTime(d.time))}</span><span class="bce-mx-amt">${this.money(d.amount)}</span></span>
                    ${match ? `<span class="bce-mx-card-link">→ ${esc(this.slotLabel)} ${esc(match.slot)} · ${esc(formatTime(match.time))}</span>` : ''}
                </span>
            </button>`;
    }

    renderWithdrawal(w) {
        const d = this.deposit(this.selected);
        const by = this.matchedBy(w);
        let delta = '';
        let early = false;
        if (d && !by && !this.traced) {
            const hold = holdMinutes(d, w);
            early = hold !== null && hold < 0;
            delta = early
                ? '<span class="bce-mx-delta">before the deposit</span>'
                : `<span class="bce-mx-delta">${esc(formatHold(hold))} · ${esc(payoutPercent(d, w))}%</span>`;
        }
        const cls = ['bce-mx-card', 'bce-mx-wd'];
        if (by) cls.push('bce-mx-matched');
        if (early) cls.push('bce-mx-early');
        return `
            <button class="${cls.join(' ')}" data-wd="${esc(w.id)}" type="button" ${by ? `style="--mx-c:${by.colour}"` : ''}>
                <span class="bce-mx-swatch"></span>
                <span class="bce-mx-card-main">
                    <span class="bce-mx-card-row"><span>${esc(formatTime(w.time))}</span><span class="bce-mx-slot">${esc(this.slotLabel)} ${esc(w.slot)}</span><span class="bce-mx-amt">${this.money(w.amount)}</span></span>
                    ${by ? `<span class="bce-mx-card-link">← ${esc(by.label || by.wallet)}</span>` : delta}
                </span>
            </button>`;
    }

    renderMiddle() {
        if (this.traced) {
            const slot = reusedSlot(this.deposits, this.matches);
            return `
                <div class="bce-mx-mid-title">TRACED</div>
                <div class="bce-mx-big">${esc(this.slotLabel)} ${esc(slot)}</div>
                <div class="bce-mx-text">${esc(this.completionText || `Every deposit came out in ${this.slotLabel} ${slot}.`)}</div>`;
        }
        if (this.allMatched()) {
            const slots = [...new Set(this.withdrawals.map(w => String(w.slot)))].sort();
            return `
                <div class="bce-mx-mid-title">ADDRESS REUSE</div>
                <div class="bce-mx-text">The mixer broke the chain. The people using it didn't change where they cash out. Which ${esc(this.slotLabel)} did all ${requiredDeposits(this.deposits).length} of your matches land in?</div>
                <div class="bce-mx-slots">${slots.map(s => `<button class="bce-mx-slot-btn" data-slot="${esc(s)}" type="button">${esc(s)}</button>`).join('')}</div>`;
        }
        const d = this.deposit(this.selected);
        if (!d) return '<div class="bce-mx-text">Pick a deposit on the left.</div>';
        const m = this.mixer;
        const expected = expectedPayout(d.amount, m.feePercent);
        const fee = Number(d.amount) - expected;
        const earliest = parseTime(d.time) + (Number(m.minHoldHours) || 0) * 3600 * 1000;
        const change = d.change ? `
                <div class="bce-mx-out-row"><span>${this.money(d.change.amount)} → ${esc(d.change.wallet)}</span><span class="bce-mx-tag bce-mx-tag-change">change</span></div>
                <div class="bce-mx-note">Change goes back to the sender's own new address. It never enters the mixer.</div>` : '';
        const working = this.working.has(d.id) ? `
                <div class="bce-mx-working">
                    ${m.feePercent}% of ${this.money(d.amount)} is ${this.money(fee)}, so look for <b>${this.money(expected)}</b>.<br>
                    Earliest it can leave: <b>${esc(formatTime(new Date(earliest).toISOString()))}</b>.
                </div>` : `<button class="bce-mx-work-btn" id="bce-mx-work" type="button">Show working</button>`;
        return `
            <div class="bce-mx-mid-title" style="color:${d.colour}">${esc(d.label || 'DEPOSIT')}</div>
            <div class="bce-mx-text">${esc(formatTime(d.time))} UTC, from ${esc(d.wallet)}</div>
            <div class="bce-mx-tx">
                <div class="bce-mx-out-row"><span>${this.money(d.amount)} → ${esc(m.name)}</span><span class="bce-mx-tag">deposit</span></div>
                ${change}
            </div>
            <div class="bce-mx-look">Look for: this deposit less ${esc(m.feePercent)}%, at least ${esc(m.minHoldHours)} hours later.</div>
            ${working}`;
    }

    bind() {
        const root = this.scene.gameContainer;
        const on = (el, fn) => el && this.scene.addEventListener(el, 'click', fn);
        root.querySelectorAll('[data-dep]').forEach(el => on(el, () => this.selectDeposit(el.dataset.dep)));
        root.querySelectorAll('[data-wd]').forEach(el => on(el, () => this.tryLink(el.dataset.wd)));
        root.querySelectorAll('[data-slot]').forEach(el => on(el, () => this.nameSlot(el.dataset.slot)));
        on(root.querySelector('#bce-mx-help'), () => { this.showHelp = !this.showHelp; this.render(); });
        on(root.querySelector('#bce-mx-work'), () => { if (this.selected) this.working.add(this.selected); this.render(); });
        on(root.querySelector('#bce-close-btn'), () => this.close());
        on(root.querySelector('#bce-mx-files'), () => this.openFiles());
    }

    close() {
        this.scene.gameResult = { mode: 'mixer_match', traced: this.traced };
        this.scene.complete(true);
    }

    openFiles() {
        const sprite = this.lockable;
        this.close();
        // The normal container route: handleUnlock registers an unlocked container
        // with the server before the container loads its contents (a direct
        // startContainerMinigame gets a 403 for an object it hasn't seen opened).
        if (sprite && typeof window !== 'undefined' && window.handleUnlock) {
            setTimeout(() => window.handleUnlock(sprite, 'item'), 50);
        }
    }
}
