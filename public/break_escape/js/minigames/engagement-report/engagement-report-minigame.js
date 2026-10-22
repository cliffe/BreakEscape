// The engagement report builder (SE design 10 stage 6, N1, N2; implementation plan Phase 6, P6-B).
//
// A results-and-findings overlay that closes the lab. It is display-only for the campaign
// results (read live from mailState.metrics, the landing-page records and the pretext globals,
// 00 §10a, §11a, 06 N8) and interactive for the two steps:
//
//   results  — the student reads the results table and presses Confirm (a `confirm` item in
//              engagement.report.items). Pressing it sets report_results_done.
//   findings — for each finding the student pairs a root cause with a control from authored
//              lists. A wrong pick shows its `why` and can be changed; one wrong cause per
//              finding is a blame wording, shown why rather than punished (stage 6, Ch. 9). A
//              finding locks when its cause and control are both correct. All correct →
//              report_findings_done, then report_filed.
//
// The report keeps no store of its own (N2): the only thing it writes is the in-progress
// pairings in the object global se_report_state (ids only), saved with stateSync.sync() as the
// board does. It is rebuilt from the globals every time it opens, so a reopen with the done
// globals set but the task incomplete re-applies them (the board's pattern).
//
// Closing is a normal exit (overlay rule): Close and Esc call complete(true), so a close never
// emits minigame_failed. Task completion keys on the step/block globals, never on the completed
// event. All text the player reads is set with textContent in Source Sans 3 (--se-font-readable).

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { writeGlobal } from '../../systems/global-writer.js';
import { buildReportModel, readReportState, STATE_KEY } from './report-model.js';

const ICON = '/break_escape/assets/icons/';

function h(tag, props = {}, ...kids) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else node.setAttribute(k, v === true ? '' : String(v));
    }
    for (const kid of kids.flat()) {
        if (kid === undefined || kid === null || kid === false) continue;
        node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return node;
}

function icon(name, size = 16) {
    return h('img', { class: 'er-icon', src: `${ICON}${name}.png`, alt: '', 'aria-hidden': 'true',
        width: size, height: size });
}

/** The two-outcome page line (00 §11a; 07 §5): the same wording as the builder's metrics line. */
export function pageOutcomeLine(page) {
    if (!page.sent) return 'No page sent.';
    const visited = page.visited ? 'yes' : 'no';
    const submitted = page.submitted ? 'yes (simulated)' : (page.noticed ? 'no (noticed)' : 'no');
    return `Visited: ${visited} · Submitted: ${submitted}`;
}

export class EngagementReportMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, params);
        this.model = null;
        this._liveText = '';
    }

    // ── data ──────────────────────────────────────────────────────────────
    get social() {
        return this.params.social || (typeof window !== 'undefined' ? window.gameScenario?.social : null) || {};
    }

    get globals() {
        return (typeof window !== 'undefined' ? window.gameState?.globalVariables : null) || {};
    }

    get mailState() {
        return this.params.mailState || (typeof window !== 'undefined' ? window.mailState : null) || {};
    }

    /** Re-read the records and draw the report again (called on open). */
    rebuild() {
        this.model = buildReportModel(this.social, this.globals, this.mailState);
        this._applyCompletion(); // a reopen with a completed step re-applies a global that never landed
        this._render();
    }

    // ── lifecycle ─────────────────────────────────────────────────────────
    init() {
        super.init();
        this.gameContainer.classList.add('engagement-report-game-container');
        this.container.classList.add('engagement-report-container');
        this.rebuild();
    }

    start() {
        super.start();
        this.root?.focus?.();
    }

    // ── drawing ───────────────────────────────────────────────────────────
    _render(focusSel = null) {
        const m = this.model;
        this.gameContainer.textContent = '';

        const live = h('div', { class: 'er-live', role: 'status', 'aria-live': 'polite' });
        live.textContent = this._liveText;
        this._liveEl = live;

        const close = h('button', { type: 'button', class: 'se-overlay-close minigame-button er-close',
            'aria-label': 'Close', text: 'Close' });
        this.addEventListener(close, 'click', (e) => {
            e.preventDefault?.();
            e.stopPropagation?.();
            this.requestClose();
        });
        this.closeButton = close;

        const resultsDone = m.steps.find((s) => s.id === 'results')?.done;
        const progress = m.complete
            ? 'Report filed.'
            : `${m.steps.filter((s) => s.done).length} of ${m.steps.length} steps done.`;
        const head = h('header', { class: 'er-head' },
            h('h2', { class: 'er-title', text: m.title }),
            h('p', { class: 'er-progress', text: progress }),
            close);

        const body = h('div', { class: 'er-scroll', tabindex: '0', role: 'region',
            'aria-label': `${m.title}: results and findings` });
        if (m.intro) body.appendChild(h('p', { class: 'er-intro', text: m.intro }));

        body.appendChild(this._resultsSection(m, resultsDone));
        body.appendChild(this._findingsSection(m));

        this.root = h('div', { class: 'er-root', tabindex: '-1' }, head, live, body);
        this.gameContainer.appendChild(this.root);

        if (focusSel) this.root.querySelector(focusSel)?.focus?.();
    }

    // ── results ─────────────────────────────────────────────────────────────
    _resultsSection(m, done) {
        const sec = h('section', { class: `er-section er-results is-${done ? 'done' : 'open'}`,
            'aria-labelledby': 'er-h-results' },
            h('h3', { id: 'er-h-results', class: 'er-h', text: 'Campaign results' }));

        // Mail
        const r = m.results;
        if (r.mail.length) {
            const table = h('table', { class: 'er-table er-mail', 'aria-label': 'Mail results by target' },
                h('thead', {}, h('tr', {},
                    h('th', { scope: 'col', text: 'Target' }),
                    h('th', { scope: 'col', text: 'Sent' }),
                    h('th', { scope: 'col', text: 'Failed' }),
                    h('th', { scope: 'col', text: 'Landed' }),
                    h('th', { scope: 'col', text: 'First send landed' }))));
            const tbody = h('tbody', {});
            for (const row of r.mail) {
                tbody.appendChild(h('tr', { class: 'er-mail-row', 'data-target': row.targetId },
                    h('th', { scope: 'row', class: 'er-mail-name', text: row.name }),
                    h('td', { class: 'er-num', text: String(row.sent) }),
                    h('td', { class: 'er-num', text: String(row.failed) }),
                    h('td', { class: 'er-num', text: String(row.landed) }),
                    h('td', { class: 'er-mail-first', text: row.firstTryLanded ? 'yes' : 'no' })));
            }
            table.appendChild(tbody);
            sec.appendChild(table);
            if (r.mail.some((row) => row.failed > 0)) {
                sec.appendChild(h('p', { class: 'er-note er-fail-note',
                    text: 'Failed sends are not wasted: in a live test each one is a chance for a member of staff to report you.' }));
            }
        } else {
            sec.appendChild(h('p', { class: 'er-empty', text: 'No mail has been sent yet.' }));
        }

        // Pages
        const pagePanel = h('div', { class: 'er-pages', 'aria-label': 'Landing page results' },
            h('h4', { class: 'er-subh', text: 'Landing page' }));
        if (!r.pages.length) {
            pagePanel.appendChild(h('p', { class: 'er-empty', text: 'No landing page in this engagement.' }));
        } else {
            for (const p of r.pages) {
                pagePanel.appendChild(h('p', { class: `er-page-line is-${p.sent ? 'sent' : 'unsent'}`,
                    'data-page': p.pageId, text: p.sent ? `${p.label}: ${pageOutcomeLine(p)}` : 'No page sent.' }));
            }
        }
        sec.appendChild(pagePanel);

        // Calls
        if (r.calls.length) {
            const callPanel = h('div', { class: 'er-calls', 'aria-label': 'Call results' },
                h('h4', { class: 'er-subh', text: 'Pretext call' }));
            for (const c of r.calls) {
                const parts = [];
                // The globals are the engagement's latest state (outcome/reported) plus a running
                // count of failed calls, so a success after an earlier reported call must read as
                // two calls, not one contradictory one (lab R3 F7).
                const twoCalls = c.outcome === 'got_it' && (c.reported || c.failedAttempts > 0);
                if (twoCalls) {
                    parts.push(c.reported
                        ? 'An earlier call was reported to the manager; a later call got what it asked for.'
                        : 'An earlier call got nothing; a later call got what it asked for.');
                } else {
                    parts.push(c.done ? 'An ask was granted.' : 'No ask was granted.');
                    if (c.reported) parts.push('The contact reported the attempt.');
                    if (c.outcome) {
                        const outcomeText = { got_it: 'The contact gave up what was asked.',
                            reported: 'The contact rang off and reported it.', walked_away: 'The call ended without a result.' };
                        parts.push(outcomeText[c.outcome] || `Latest call ended: ${c.outcome}.`);
                    }
                }
                if (c.lowest !== null) parts.push(`Lowest influence: ${c.lowest}.`);
                callPanel.appendChild(h('p', { class: 'er-call-line', 'data-call': c.callId, text: parts.join(' ') }));
            }
            sec.appendChild(callPanel);
        }

        sec.appendChild(h('p', { class: 'er-note er-unseen', text: r.unseenNote }));

        // Confirm items (the results step)
        for (const item of m.items) {
            const row = h('div', { class: `er-confirm is-${item.confirmed ? 'done' : 'open'}`,
                'data-confirm': item.id || '' });
            if (item.confirmed) {
                row.appendChild(h('p', { class: 'er-confirmed', role: 'status' },
                    icon('mark-tick'), h('span', { class: 'er-word', text: item.text })));
            } else {
                const btn = h('button', { type: 'button', class: 'er-confirm-btn minigame-button',
                    'data-confirm-btn': item.id || '', text: item.text });
                this.addEventListener(btn, 'click', (e) => {
                    e.preventDefault?.();
                    e.stopPropagation?.();
                    this.confirmResults(item.id);
                });
                row.appendChild(btn);
            }
            sec.appendChild(row);
        }

        return sec;
    }

    // ── findings ──────────────────────────────────────────────────────────────
    _findingsSection(m) {
        const sec = h('section', { class: 'er-section er-findings', 'aria-labelledby': 'er-h-findings' },
            h('h3', { id: 'er-h-findings', class: 'er-h', text: 'Findings' }));
        if (!m.findings.length) {
            sec.appendChild(h('p', { class: 'er-empty', text: 'No findings to write up.' }));
            return sec;
        }
        sec.appendChild(h('p', { class: 'er-note',
            text: 'Pair each finding with its root cause and a control. Findings are about processes, not people.' }));
        const list = h('ol', { class: 'er-finding-list' });
        for (const f of m.findings) list.appendChild(this._findingCard(f));
        sec.appendChild(list);
        return sec;
    }

    _findingCard(f) {
        const headingId = `er-f-${f.id}`;
        const state = f.done ? 'done' : 'open';
        const card = h('li', { class: `er-card er-finding is-${state}`, 'data-finding': f.id, 'data-state': state,
            'aria-labelledby': headingId },
            h('div', { class: 'er-card-head' },
                h('h4', { id: headingId, class: 'er-finding-text', text: f.text }),
                h('span', { class: `er-status ${f.done ? 'ready' : 'not-ready'}` },
                    icon(f.done ? 'mark-tick' : 'board-not-ready'),
                    h('span', { class: 'er-status-word', text: f.done ? 'Written up' : 'Open' }))));

        card.appendChild(this._pairGroup(f, 'cause', 'Root cause', f.rootCauses, f.pickedCause, f.causeDone));
        card.appendChild(this._pairGroup(f, 'control', 'Control', f.controls, f.pickedControl, f.controlDone));
        return card;
    }

    _pairGroup(f, part, label, options, picked, done) {
        const groupId = `er-${f.id}-${part}`;
        const group = h('div', { class: `er-pair er-pair-${part} is-${done ? 'done' : 'open'}`, 'data-part': part },
            h('p', { id: groupId, class: 'er-pair-label', text: label }));
        const opts = h('ul', { class: 'er-options', role: 'group', 'aria-labelledby': groupId });
        for (const o of options) {
            const chosen = picked && picked.id === o.id;
            const btn = h('button', { type: 'button', class: `er-option minigame-button${chosen ? ' is-chosen' : ''}`,
                'data-option': o.id, 'aria-pressed': String(!!chosen), disabled: done && !chosen ? true : false,
                text: o.text });
            this.addEventListener(btn, 'click', (e) => {
                e.preventDefault?.();
                e.stopPropagation?.();
                this.pick(f.id, part, o.id);
            });
            opts.appendChild(h('li', { class: 'er-option-row' }, btn));
        }
        group.appendChild(opts);
        if (picked) {
            const good = picked.correct === true;
            group.appendChild(h('p', { class: `er-feedback ${good ? 'good' : (picked.blame ? 'blame' : 'bad')}`, role: 'status' },
                icon(good ? 'mark-tick' : 'mark-cross'),
                h('span', { class: 'er-word', text: good ? 'Good:' : (picked.blame ? 'Blaming staff:' : 'Not quite:') }),
                h('span', { class: 'er-why', text: picked.why })));
        }
        return group;
    }

    // ── interactions ──────────────────────────────────────────────────────────
    /** Press a results confirm item. Records the press and applies completion. */
    confirmResults(itemId) {
        if (!itemId) return false;
        const item = this.model.items.find((i) => i.id === itemId);
        if (!item || item.confirmed) return false;
        const state = readReportState(this.globals);
        const confirmed = [...new Set([...state.confirmed, itemId])];
        this._writeState({ ...state, confirmed });
        this.model = buildReportModel(this.social, this.globals, this.mailState);
        this._liveText = 'Results confirmed.';
        if (this._applyCompletion()) this._liveText += ' Report filed.';
        this._render(`[data-confirm="${itemId}"]`);
        return true;
    }

    /** Pick a root cause or a control for a finding. A locked finding ignores the pick. */
    pick(findingId, part, optionId) {
        if (part !== 'cause' && part !== 'control') return false;
        const f = this.model.findings.find((x) => x.id === findingId);
        if (!f || f.done) return false;
        const options = part === 'cause' ? f.rootCauses : f.controls;
        const chosen = options.find((o) => o.id === optionId);
        if (!chosen) return false;
        const state = readReportState(this.globals);
        const prev = state.findings[findingId] || {};
        const findings = { ...state.findings, [findingId]: { ...prev, [part]: optionId } };
        this._writeState({ ...state, findings });
        this.model = buildReportModel(this.social, this.globals, this.mailState);
        const now = this.model.findings.find((x) => x.id === findingId);
        this._liveText = chosen.correct
            ? `Good. ${chosen.why}`
            : (chosen.blame ? `That blames staff. ${chosen.why}` : `Not quite. ${chosen.why}`);
        if (now?.done) this._liveText += ' Finding written up.';
        if (this._applyCompletion()) this._liveText += ' Report filed.';
        this._render(`[data-finding="${findingId}"] [data-part="${part}"] [data-option="${optionId}"]`);
        return true;
    }

    // ── state and completion ────────────────────────────────────────────────
    _writeState(next) {
        writeGlobal(STATE_KEY, next, { openChat: false });
        window.stateSync?.sync?.();
    }

    /** Set the step and block globals that are due (steps first). Returns whether report_filed flipped. */
    _applyCompletion() {
        const due = this.model?.toSet || [];
        if (!due.length) return false;
        const blockName = this.model.onCompleteGlobal;
        for (const name of due) writeGlobal(name, true, { openChat: false });
        window.stateSync?.sync?.();
        this.model = buildReportModel(this.social, this.globals, this.mailState);
        return due.includes(blockName);
    }

    saveDraft() { /* every change already writes se_report_state */ }

    returnParams() { return {}; }

    // ── exit ──────────────────────────────────────────────────────────────────
    closeResult() {
        const m = this.model || buildReportModel(this.social, this.globals, this.mailState);
        return { completed: m.complete };
    }

    // ── test bridge ───────────────────────────────────────────────────────────
    getTestState() {
        const m = this.model;
        return {
            ...super.getTestState(),
            report: m ? {
                title: m.title,
                complete: m.complete,
                live: this._liveText,
                steps: m.steps.map((s) => ({ id: s.id, done: s.done })),
                results: {
                    mail: m.results.mail.map((r) => ({ targetId: r.targetId, name: r.name, sent: r.sent,
                        failed: r.failed, landed: r.landed, firstTryLanded: r.firstTryLanded })),
                    pages: m.results.pages.map((p) => ({ pageId: p.pageId, sent: p.sent, visited: p.visited,
                        submitted: p.submitted, noticed: p.noticed, line: pageOutcomeLine(p) })),
                    calls: m.results.calls.map((c) => ({ callId: c.callId, done: c.done, reported: c.reported,
                        outcome: c.outcome, lowest: c.lowest, failedAttempts: c.failedAttempts }))
                },
                items: m.items.map((i) => ({ id: i.id, confirmed: i.confirmed })),
                findings: m.findings.map((f) => ({ id: f.id, done: f.done,
                    cause: f.pickedCauseId, control: f.pickedControlId,
                    causeDone: f.causeDone, controlDone: f.controlDone,
                    causeWhy: f.pickedCause ? f.pickedCause.why : null,
                    causeBlame: f.pickedCause ? f.pickedCause.blame : null,
                    controlWhy: f.pickedControl ? f.pickedControl.why : null }))
            } : null
        };
    }

    cleanup() {
        this.root = null;
        super.cleanup();
    }
}

export default EngagementReportMinigame;
