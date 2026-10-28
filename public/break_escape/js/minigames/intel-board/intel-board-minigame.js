// The intel board (SE design 03; implementation plan Phase 1a, packet P1-G).
//
// Recon mode (P1-G), defender mode (P3-D), scope and plan modes (P6-C). Recon is a case-file overlay that shows what the player has
// found, grouped by person and company, and what is still missing. Display
// only. It is rebuilt from the persisted `se_intel_*`, `target_ready_*` and
// `osint_done` globals every time it opens (N2); nothing is collected while an
// overlay is open (00 §5), so it has no live updates. Readiness is shown, never
// computed here (N3): systems/social-intel.js sets the globals.
//
// Closing is a normal exit (N5). Close and Esc call complete(true) with
// { mode, completed, ready }, so a close never emits minigame_failed, and a
// `returnTo` in the params reopens the caller (the OSINT browser's Case file
// button, 00 S12). Task completion keys on the mode's globals, never on the
// minigame_completed event, because a close fires that too.
//
// Params: { mode: 'recon' (default), returnTo?, social? }. `social` defaults to
// window.gameScenario.social and the globals are window.gameState.globalVariables;
// `social` exists so a test can hand in a fixture.
//
// Defender mode (03 "Defender mode"): the same facts as exposure. For each
// engagement.defender.factMitigations entry the card shows the fact, its
// reduceNote and the authored options; a wrong pick shows its `why` and can be
// changed, a good pick locks the card. Picks are option ids in
// se_board_state.defender.picks, so a reload shows them again. The block's
// onCompleteGlobal (profile_done) and any step globals are set through the
// shared writer on the false-to-true flip, and again on open if the saved picks
// were complete but the global never landed. No typing.
//
// The optional indicators step (engagement.defender.indicators; the lab
// authors none): below the exposures, one card per authored indicator whose
// `tell` is in a record the player sent (mailState, 00 §10a). The player marks
// it Block or Let through; the right mark locks, a wrong one shows `why`.
// Marks are ids in se_board_state.defender.indicators. Indicators gate
// profile_done only through a declared step they name (board-model.js).
//
// Scope and plan modes (03 "Modes"; 00 §11): sorting cards (in or out), question cards and single-select
// picks, all "pick one of these buttons". A right answer locks; a wrong pick shows its `why` and can be
// changed; a wrongly sorted card goes back. Right sorts and every question or pick answer are saved as
// ids in se_board_state.<mode>. Step globals and the block global (roe_signed, plan_done) are set through
// the shared writer on the false-to-true flip, and again on open if the saved answers were complete but
// the global never landed. A `confirm` item (Confirm button) is supported for the report's read-only step.
//
// All text the player reads is set with textContent in the pixel font (--se-font-readable;
// addresses in --se-font-address), never through innerHTML or displayDashes.

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { writeGlobal } from '../../systems/global-writer.js';
import { createInfluenceBar } from '../../ui/influence-bar.js';
import { buildBoardModel, buildDefenderModel, buildEngagementModel, readBoardState, readEngagementState,
    ENGAGEMENT_MODES, STATE_KEY, READY_TEXT } from './board-model.js';

const ICON = '/break_escape/assets/icons/';
const SUPPORTED_MODES = ['recon', 'defender', ...ENGAGEMENT_MODES];

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
    return h('img', { class: 'ib-icon', src: `${ICON}${name}.png`, alt: '', 'aria-hidden': 'true',
        width: size, height: size });
}

/** SVG string between pins, decorative. One line threading `count` pin positions. */
export function stringSvg(count) {
    if (count < 2) return '';
    const pts = [];
    for (let i = 0; i < count; i++) pts.push(`${(((i + 0.5) / count) * 100).toFixed(2)},${i % 2 ? 7 : 3}`);
    return `<svg class="ib-string" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
        `<polyline points="${pts.join(' ')}" fill="none" stroke="#b8362e" stroke-width="2" ` +
        `vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
}

export class IntelBoardMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, params);
        this.mode = SUPPORTED_MODES.includes(this.params.mode) ? this.params.mode : (this.params.mode || 'recon');
        this.model = null;
        this.dmodel = null;
        this.emodel = null;
        this._feedback = {};
        this._liveText = '';
        this._bars = [];
    }

    // ── data ──────────────────────────────────────────────────────────────
    get social() {
        return this.params.social || (typeof window !== 'undefined' ? window.gameScenario?.social : null) || {};
    }

    get globals() {
        return (typeof window !== 'undefined' ? window.gameState?.globalVariables : null) || {};
    }

    /** The live mailState (00 §10a), read for the defender indicators step only. */
    get mailState() {
        return this.params.mailState || (typeof window !== 'undefined' ? window.mailState : null) || null;
    }

    /** Re-read the globals and draw the board again (called on open). */
    rebuild() {
        this.model = buildBoardModel(this.social, this.globals);
        if (this.mode === 'defender') {
            this.dmodel = buildDefenderModel(this.social, this.globals, this.mailState);
            this._applyDefenderCompletion();
        } else if (ENGAGEMENT_MODES.includes(this.mode)) {
            this.emodel = buildEngagementModel(this.social, this.globals, this.mode);
            this._applyEngagementCompletion();
        }
        this._render();
        this._rememberReady();
    }

    // ── lifecycle ─────────────────────────────────────────────────────────
    init() {
        super.init();
        this.gameContainer.classList.add('intel-board-game-container');
        this.container.classList.add('intel-board-container');
        this.rebuild();
    }

    start() {
        super.start();
        this.root?.focus?.();
    }

    // ── drawing ───────────────────────────────────────────────────────────
    _render() {
        this._destroyBars();
        if (this.mode === 'defender') { this._renderDefender(); return; }
        if (ENGAGEMENT_MODES.includes(this.mode)) { this._renderEngagement(); return; }
        const m = this.model;
        const supported = SUPPORTED_MODES.includes(this.mode);
        this.gameContainer.textContent = '';

        const live = h('div', { class: 'ib-live', role: 'status', 'aria-live': 'polite' });
        this._liveText = m.newlyReady.length
            ? m.targets.filter((t) => t.newlyReady).map((t) => `${t.name} is now ready to approach.`).join(' ')
            : '';
        live.textContent = this._liveText;

        const close = h('button', { type: 'button', class: 'se-overlay-close minigame-button ib-close',
            'aria-label': 'Close', text: 'Close' });
        this.addEventListener(close, 'click', (e) => {
            e.preventDefault?.();
            e.stopPropagation?.();
            this.requestClose();
        });
        this.closeButton = close;

        const progress = `${m.ready.length} of ${m.total} targets ready to approach`;
        const head = h('header', { class: 'ib-head' },
            h('h2', { class: 'ib-title', text: m.title }),
            h('p', { class: 'ib-progress', text: m.osintDone ? `Recon complete. ${progress}.` : `${progress}.` }),
            close);

        const body = h('div', { class: 'ib-scroll', tabindex: '0', role: 'region',
            'aria-label': `${m.title}: evidence and readiness` });

        if (m.scopeNote) body.appendChild(h('p', { class: 'ib-scope-note', text: m.scopeNote }));

        if (!supported) {
            body.appendChild(h('p', { class: 'ib-empty', text: 'This board mode is not available yet.' }));
        } else {
            body.appendChild(this._peopleSection(m));
            body.appendChild(this._contactsSection(m));
            body.appendChild(this._companySection(m));
        }

        this.root = h('div', { class: 'ib-root', tabindex: '-1', 'data-mode': this.mode }, head, live, body);
        this.gameContainer.appendChild(this.root);
    }

    // ── defender mode ─────────────────────────────────────────────────────
    _renderDefender(focusIntel = null, focusOpt = null) {
        const d = this.dmodel;
        this.gameContainer.textContent = '';
        const live = h('div', { class: 'ib-live', role: 'status', 'aria-live': 'polite' });
        live.textContent = this._liveText;
        this._liveEl = live;

        const close = h('button', { type: 'button', class: 'se-overlay-close minigame-button ib-close',
            'aria-label': 'Close', text: 'Close' });
        this.addEventListener(close, 'click', (e) => {
            e.preventDefault?.();
            e.stopPropagation?.();
            this.requestClose();
        });
        this.closeButton = close;

        const progress = d.complete
            ? `Exposure review complete. ${d.doneCount} of ${d.total} reduced.`
            : `${d.doneCount} of ${d.total} exposures reduced.`;
        const head = h('header', { class: 'ib-head' },
            h('h2', { class: 'ib-title', text: d.title }),
            h('p', { class: 'ib-progress', text: progress }),
            close);

        const body = h('div', { class: 'ib-scroll', tabindex: '0', role: 'region',
            'aria-label': `${d.title}: pick a mitigation for each exposure` });
        if (d.intro) body.appendChild(h('p', { class: 'ib-scope-note', text: d.intro }));
        if (!d.items.length) {
            body.appendChild(h('p', { class: 'ib-empty', text: 'Nothing to review here yet.' }));
        } else {
            const list = h('ul', { class: 'ib-exposures', 'aria-label': 'Exposures' });
            for (const item of d.items) list.appendChild(this._exposureCard(item));
            body.appendChild(list);
        }
        if (d.indicatorsShown) body.appendChild(this._indicatorSection(d));

        this.root = h('div', { class: 'ib-root', tabindex: '-1', 'data-mode': 'defender' }, head, live, body);
        this.gameContainer.appendChild(this.root);

        if (focusIntel) {
            const btn = this.root.querySelector(`[data-exposure="${focusIntel}"] [data-option="${focusOpt}"]`)
                || this.root.querySelector(`[data-indicator="${focusIntel}"] [data-mark="${focusOpt}"]`);
            btn?.focus?.();
        }
    }

    /** The optional indicators step: one card per shown indicator, Block or Let through. */
    _indicatorSection(d) {
        const section = h('section', { class: 'ib-section ib-indicators', 'aria-labelledby': 'ib-ind-head' },
            h('h3', { id: 'ib-ind-head', class: 'ib-h', text: 'Indicators to block' }),
            h('p', { class: 'ib-scope-note', text: `${d.indicatorsIntro
                || 'Each of these was in mail you sent during the engagement. Would you block incoming mail on it?'} ` +
                `${d.indicatorsDone} of ${d.indicatorsShown} indicators marked.` }));
        const list = h('ul', { class: 'ib-exposures', 'aria-label': 'Indicators' });
        for (const ind of d.indicators) if (ind.shown) list.appendChild(this._indicatorCard(ind));
        section.appendChild(list);
        return section;
    }

    _indicatorCard(ind) {
        const headingId = `ib-ind-${ind.id}`;
        const state = ind.done ? 'done' : (ind.marked ? 'wrong' : 'open');
        const card = h('li', { class: `ib-card ib-exposure ib-indicator is-${state}`, 'data-indicator': ind.id,
            'data-state': state, 'aria-labelledby': headingId },
            h('div', { class: 'ib-card-head' },
                h('h4', { id: headingId, class: 'ib-name', text: ind.text || ind.id }),
                h('span', { class: `ib-status ${ind.done ? 'ready' : 'not-ready'}` },
                    icon(ind.done ? 'board-ready' : 'board-not-ready'),
                    h('span', { class: 'ib-status-word', text: ind.done ? 'Marked' : 'Not marked' }))));
        const s = ind.sentIn;
        if (s && (s.to || s.subject)) {
            const where = [s.to ? `to ${s.to}` : '', s.subject ? `"${s.subject}"` : ''].filter(Boolean).join(', ');
            card.appendChild(h('p', { class: 'ib-reduce', text: `Seen in your mail ${where}` }));
        }
        const opts = h('ul', { class: 'ib-options', role: 'group', 'aria-labelledby': headingId });
        for (const [mark, label] of [['block', 'Block'], ['allow', 'Let through']]) {
            const chosen = ind.marked === mark;
            const btn = h('button', { type: 'button', class: `ib-option minigame-button${chosen ? ' is-chosen' : ''}`,
                'data-mark': mark, 'aria-pressed': String(chosen), disabled: ind.done && !chosen ? true : false,
                text: label });
            this.addEventListener(btn, 'click', (e) => {
                e.preventDefault?.();
                e.stopPropagation?.();
                this.markIndicator(ind.id, mark);
            });
            opts.appendChild(h('li', { class: 'ib-option-row' }, btn));
        }
        card.appendChild(opts);
        if (ind.marked) {
            const word = ind.done ? 'Right:' : 'Not quite:';
            card.appendChild(h('p', { class: `ib-feedback ${ind.done ? 'good' : 'bad'}`, role: 'status' },
                icon(ind.done ? 'mark-tick' : 'mark-cross'),
                h('span', { class: 'ib-word', text: word }),
                h('span', { class: 'ib-why', text: ind.why })));
        }
        return card;
    }

    /** Mark one shown indicator 'block' or 'allow'. A right mark locks; a hidden or unknown id is ignored. */
    markIndicator(id, mark) {
        if (this.mode !== 'defender' || !this.dmodel || (mark !== 'block' && mark !== 'allow')) return false;
        const ind = this.dmodel.indicators.find((i) => i.id === id);
        if (!ind || !ind.shown || ind.done) return false;
        const state = readBoardState(this.globals);
        const marks = { ...(state.defender?.indicators || {}), [id]: mark };
        this._writeState({ ...state, defender: { ...(state.defender || {}), indicators: marks } });
        this.dmodel = buildDefenderModel(this.social, this.globals, this.mailState);
        const now = this.dmodel.indicators.find((i) => i.id === id);
        this._liveText = now.done ? `Right. ${now.why}` : `Not quite. ${now.why}`;
        const flipped = this._applyDefenderCompletion();
        if (flipped) this._liveText += ' Exposure review complete.';
        this._renderDefender(id, mark);
        return true;
    }

    _exposureCard(item) {
        const headingId = `ib-exp-${item.intel}`;
        const state = item.done ? 'done' : (item.picked ? 'wrong' : 'open');
        const card = h('li', { class: `ib-card ib-exposure is-${state}`, 'data-exposure': item.intel,
            'data-state': state, 'aria-labelledby': headingId },
            h('img', { class: 'ib-pin', src: `${ICON}board-pushpin.png`, alt: '', 'aria-hidden': 'true',
                width: 11, height: 14 }),
            h('div', { class: 'ib-card-head' },
                h('h4', { id: headingId, class: 'ib-name', text: item.text || item.intel }),
                h('span', { class: `ib-status ${item.done ? 'ready' : 'not-ready'}` },
                    icon(item.done ? 'board-ready' : 'board-not-ready'),
                    h('span', { class: 'ib-status-word', text: item.done ? 'Reduced' : 'Still exposed' }))));
        if (item.reduceNote) {
            card.appendChild(h('p', { class: 'ib-reduce', text: `Reduce this: ${item.reduceNote}` }));
        }
        card.appendChild(h('p', { class: 'ib-ask', text: 'Which mitigation would you put in place?' }));

        const opts = h('ul', { class: 'ib-options', role: 'group', 'aria-labelledby': headingId });
        for (const o of item.options) {
            const chosen = item.pickedId === o.id;
            const btn = h('button', { type: 'button', class: `ib-option minigame-button${chosen ? ' is-chosen' : ''}`,
                'data-option': o.id, 'aria-pressed': String(chosen), disabled: item.done && !chosen ? true : false,
                text: o.text });
            this.addEventListener(btn, 'click', (e) => {
                e.preventDefault?.();
                e.stopPropagation?.();
                this.pickMitigation(item.intel, o.id);
            });
            opts.appendChild(h('li', { class: 'ib-option-row' }, btn));
        }
        card.appendChild(opts);

        if (item.picked) {
            const word = item.done ? 'Good choice:' : 'Not enough:';
            card.appendChild(h('p', { class: `ib-feedback ${item.done ? 'good' : 'bad'}`, role: 'status' },
                icon(item.done ? 'mark-tick' : 'mark-cross'),
                h('span', { class: 'ib-word', text: word }),
                h('span', { class: 'ib-why', text: item.picked.why })));
        }
        return card;
    }

    /** A pick on one exposure. A card already reduced is locked; an unknown option is ignored. */
    pickMitigation(intel, optionId) {
        if (this.mode !== 'defender' || !this.dmodel) return false;
        const item = this.dmodel.items.find((i) => i.intel === intel);
        if (!item || item.done || !item.options.some((o) => o.id === optionId)) return false;
        const state = readBoardState(this.globals);
        const picks = { ...(state.defender?.picks || {}), [intel]: optionId };
        this._writeState({ ...state, defender: { ...(state.defender || {}), picks } });
        this.dmodel = buildDefenderModel(this.social, this.globals, this.mailState);
        const now = this.dmodel.items.find((i) => i.intel === intel);
        this._liveText = now.done ? `Good choice. ${now.picked.why}` : `Not enough. ${now.picked.why}`;
        const flipped = this._applyDefenderCompletion();
        if (flipped) this._liveText += ' Exposure review complete.';
        this._renderDefender(intel, optionId);
        return true;
    }

    /** Set the block and step globals that are due (steps first). Returns whether the block global flipped. */
    _applyDefenderCompletion() {
        const due = this.dmodel?.toSet || [];
        if (!due.length) return false;
        const blockName = this.social?.engagement?.defender?.onCompleteGlobal;
        for (const name of due) writeGlobal(name, true, { openChat: false });
        window.stateSync?.sync?.();
        this.dmodel = buildDefenderModel(this.social, this.globals, this.mailState);
        return due.includes(blockName);
    }

    // ── scope and plan modes ──────────────────────────────────────────────
    _renderEngagement(focus = null) {
        const e = this.emodel;
        this.gameContainer.textContent = '';
        const live = h('div', { class: 'ib-live', role: 'status', 'aria-live': 'polite' });
        live.textContent = this._liveText;
        this._liveEl = live;

        const close = h('button', { type: 'button', class: 'se-overlay-close minigame-button ib-close',
            'aria-label': 'Close', text: 'Close' });
        this.addEventListener(close, 'click', (ev) => {
            ev.preventDefault?.();
            ev.stopPropagation?.();
            this.requestClose();
        });
        this.closeButton = close;

        const progress = e.complete
            ? `${e.title} complete.`
            : `${e.doneCount} of ${e.total} answered correctly.`;
        const head = h('header', { class: 'ib-head' },
            h('h2', { class: 'ib-title', text: e.title }),
            h('p', { class: 'ib-progress', text: progress }),
            close);

        const body = h('div', { class: 'ib-scroll', tabindex: '0', role: 'region',
            'aria-label': `${e.title}: choose an answer for each item` });
        const note = this.model?.scopeNote;
        if (note) body.appendChild(h('p', { class: 'ib-scope-note', text: note }));
        if (e.intro) body.appendChild(h('p', { class: 'ib-brief', text: e.intro }));
        if (e.roe) body.appendChild(this._roeSheet(e.roe));

        if (!e.items.length) {
            body.appendChild(h('p', { class: 'ib-empty', text: 'Nothing to do here yet.' }));
        } else {
            const sorts = e.items.filter((i) => i.kind === 'sort');
            if (sorts.length) body.appendChild(this._sortSection(sorts));
            const others = e.items.filter((i) => i.kind !== 'sort');
            if (others.length) {
                const list = h('ul', { class: 'ib-exposures ib-steps', 'aria-label': 'Questions' });
                for (const item of others) list.appendChild(this._choiceCard(item));
                body.appendChild(list);
            }
        }

        this.root = h('div', { class: 'ib-root', tabindex: '-1', 'data-mode': this.mode }, head, live, body);
        this.gameContainer.appendChild(this.root);
        if (focus) this.root.querySelector(focus)?.focus?.();
    }

    _roeSheet(roe) {
        const list = (label, arr, cls) => h('div', { class: `ib-roe-col ${cls}` },
            h('h4', { class: 'ib-subh', text: label }),
            h('ul', { class: 'ib-facts' }, arr.map((t) => h('li', { class: 'ib-fact' }, h('span', { class: 'ib-fact-text', text: t })))));
        return h('section', { class: 'ib-section ib-roe', 'aria-labelledby': 'ib-h-roe' },
            h('h3', { id: 'ib-h-roe', class: 'ib-h', text: 'Rules of engagement' }),
            h('div', { class: 'ib-card ib-roe-card' },
                h('img', { class: 'ib-pin', src: `${ICON}board-pushpin.png`, alt: '', 'aria-hidden': 'true', width: 11, height: 14 }),
                h('div', { class: 'ib-roe-cols' },
                    roe.inScope.length ? list('In scope', roe.inScope, 'in') : null,
                    roe.outScope.length ? list('Out of scope', roe.outScope, 'out') : null),
                roe.stopContact ? h('p', { class: 'ib-meta', text: `Emergency contact: ${roe.stopContact}` }) : null));
    }

    _sortSection(sorts) {
        const open = sorts.filter((c) => !c.done);
        const sec = h('section', { class: 'ib-section ib-sort', 'aria-labelledby': 'ib-h-sort' },
            h('h3', { id: 'ib-h-sort', class: 'ib-h', text: 'Sort the scope cards' }),
            h('p', { class: 'ib-ask', text: 'Put each card in the pile it belongs in.' }));
        const list = h('ul', { class: 'ib-exposures ib-sort-cards', 'aria-label': 'Cards to sort' });
        for (const c of open) list.appendChild(this._sortCard(c));
        if (open.length) sec.appendChild(list);
        else sec.appendChild(h('p', { class: 'ib-empty', text: 'Every card is sorted.' }));

        const piles = h('div', { class: 'ib-piles' });
        for (const [key, label] of [['in', 'In scope'], ['out', 'Out of scope']]) {
            const placed = sorts.filter((c) => c.done && c.placed === key);
            piles.appendChild(h('div', { class: `ib-pile ib-pile-${key}`, 'data-pile': key },
                h('h4', { class: 'ib-subh', text: `${label} (${placed.length})` }),
                h('ul', { class: 'ib-facts', 'aria-label': `${label} pile` }, placed.map((c) =>
                    h('li', { class: 'ib-fact', 'data-card': c.id }, icon('mark-tick'),
                        h('span', { class: 'ib-fact-text', text: c.text }),
                        h('span', { class: 'ib-why', text: c.why }))))));
        }
        sec.appendChild(piles);
        return sec;
    }

    _sortCard(c) {
        const headingId = `ib-sort-${c.id}`;
        const fb = this._feedback[c.id];
        const card = h('li', { class: `ib-card ib-exposure is-${fb ? 'wrong' : 'open'}`, 'data-card': c.id,
            'data-state': fb ? 'wrong' : 'open', 'aria-labelledby': headingId },
            h('img', { class: 'ib-pin', src: `${ICON}board-pushpin.png`, alt: '', 'aria-hidden': 'true', width: 11, height: 14 }),
            h('h4', { id: headingId, class: 'ib-name', text: c.text }));
        const opts = h('ul', { class: 'ib-options', role: 'group', 'aria-labelledby': headingId });
        for (const [key, label] of [['in', 'In scope'], ['out', 'Out of scope']]) {
            const btn = h('button', { type: 'button', class: 'ib-option minigame-button', 'data-option': key, text: label });
            this.addEventListener(btn, 'click', (e) => {
                e.preventDefault?.();
                e.stopPropagation?.();
                this.placeCard(c.id, key);
            });
            opts.appendChild(h('li', { class: 'ib-option-row' }, btn));
        }
        card.appendChild(opts);
        if (fb) {
            card.appendChild(h('p', { class: 'ib-feedback bad', role: 'status' }, icon('mark-cross'),
                h('span', { class: 'ib-word', text: `Not in the ${fb.tried === 'in' ? 'in scope' : 'out of scope'} pile:` }),
                h('span', { class: 'ib-why', text: fb.why })));
        }
        return card;
    }

    _choiceCard(item) {
        const headingId = `ib-ch-${item.id}`;
        const state = item.done ? 'done' : (item.picked ? 'wrong' : 'open');
        const card = h('li', { class: `ib-card ib-exposure is-${state}`, 'data-item': item.id, 'data-kind': item.kind,
            'data-state': state, 'aria-labelledby': headingId },
            h('img', { class: 'ib-pin', src: `${ICON}board-pushpin.png`, alt: '', 'aria-hidden': 'true', width: 11, height: 14 }),
            h('div', { class: 'ib-card-head' },
                h('h4', { id: headingId, class: 'ib-name', text: item.text || this._stepTitle(item) }),
                h('span', { class: `ib-status ${item.done ? 'ready' : 'not-ready'}` },
                    icon(item.done ? 'board-ready' : 'board-not-ready'),
                    h('span', { class: 'ib-status-word', text: item.done ? 'Done' : 'Open' }))));

        if (item.kind === 'confirm') {
            const btn = h('button', { type: 'button', class: 'ib-option minigame-button', 'data-option': 'confirm',
                disabled: item.done ? true : false, text: item.text });
            this.addEventListener(btn, 'click', (e) => {
                e.preventDefault?.();
                e.stopPropagation?.();
                this.confirmItem(item.id);
            });
            card.appendChild(h('ul', { class: 'ib-options' }, h('li', { class: 'ib-option-row' }, btn)));
            return card;
        }

        const opts = h('ul', { class: 'ib-options', role: 'group', 'aria-labelledby': headingId });
        for (const o of item.options) {
            const chosen = item.pickedId === o.id;
            const btn = h('button', { type: 'button', class: `ib-option minigame-button${chosen ? ' is-chosen' : ''}`,
                'data-option': o.id, 'aria-pressed': String(chosen), disabled: item.done && !chosen ? true : false,
                text: o.text });
            this.addEventListener(btn, 'click', (e) => {
                e.preventDefault?.();
                e.stopPropagation?.();
                this.choose(item.id, o.id);
            });
            opts.appendChild(h('li', { class: 'ib-option-row' }, btn));
        }
        card.appendChild(opts);
        if (item.picked) {
            const word = item.done ? 'Right answer:' : 'Not this one:';
            card.appendChild(h('p', { class: `ib-feedback ${item.done ? 'good' : 'bad'}`, role: 'status' },
                icon(item.done ? 'mark-tick' : 'mark-cross'),
                h('span', { class: 'ib-word', text: word }),
                h('span', { class: 'ib-why', text: item.picked.why })));
        }
        return card;
    }

    _stepTitle(item) {
        const s = this.emodel?.steps.find((x) => x.id === item.step);
        return s?.title || item.id;
    }

    /** Save this mode's answers, rebuild the model and set whatever globals are now due. */
    _saveEngagement(patch) {
        const state = readBoardState(this.globals);
        const cur = readEngagementState(this.globals, this.mode);
        this._writeState({ ...state, [this.mode]: { ...cur, ...patch } });
        this.emodel = buildEngagementModel(this.social, this.globals, this.mode);
        return this._applyEngagementCompletion();
    }

    /** Place a scope card in a pile. A right placement is saved; a wrong one goes back with its why. */
    placeCard(cardId, pile) {
        if (!ENGAGEMENT_MODES.includes(this.mode) || !this.emodel || !['in', 'out'].includes(pile)) return false;
        const item = this.emodel.items.find((i) => i.kind === 'sort' && i.id === cardId);
        if (!item || item.done) return false;
        this._feedback = {}; // one hint at a time: it belongs to the card just tried, not an earlier one
        if (pile !== item.right) {
            this._feedback[cardId] = { tried: pile, why: item.why };
            this._liveText = `Not that pile. ${item.why}`;
            this._renderEngagement(`[data-card="${cardId}"] [data-option="${pile}"]`);
            return true;
        }
        const cur = readEngagementState(this.globals, this.mode);
        const flipped = this._saveEngagement({ sorted: { ...cur.sorted, [cardId]: pile } });
        this._liveText = `Right. ${item.why}`.trim() + (flipped ? ` ${this.emodel.title} complete.` : '');
        this._renderEngagement();
        return true;
    }

    /** Answer a question card or a plan pick. A right answer locks it; a wrong one shows its why and can change. */
    choose(itemId, optionId) {
        if (!ENGAGEMENT_MODES.includes(this.mode) || !this.emodel) return false;
        const item = this.emodel.items.find((i) => (i.kind === 'question' || i.kind === 'pick') && i.id === itemId);
        if (!item || item.done || !item.options.some((o) => o.id === optionId)) return false;
        const cur = readEngagementState(this.globals, this.mode);
        const key = item.kind === 'question' ? 'answers' : 'picks';
        const flipped = this._saveEngagement({ [key]: { ...cur[key], [itemId]: optionId } });
        const now = this.emodel.items.find((i) => i.id === itemId);
        this._liveText = `${now.done ? 'Right answer.' : 'Not this one.'} ${now.picked.why}`.trim()
            + (flipped ? ` ${this.emodel.title} complete.` : '');
        this._renderEngagement(`[data-item="${itemId}"] [data-option="${optionId}"]`);
        return true;
    }

    confirmItem(itemId) {
        if (!ENGAGEMENT_MODES.includes(this.mode) || !this.emodel) return false;
        const item = this.emodel.items.find((i) => i.kind === 'confirm' && i.id === itemId);
        if (!item || item.done) return false;
        const cur = readEngagementState(this.globals, this.mode);
        const flipped = this._saveEngagement({ confirmed: [...cur.confirmed, itemId] });
        this._liveText = 'Confirmed.' + (flipped ? ` ${this.emodel.title} complete.` : '');
        this._renderEngagement();
        return true;
    }

    /** Set the step and block globals that are due (steps first). Returns whether the block global flipped. */
    _applyEngagementCompletion() {
        const due = this.emodel?.toSet || [];
        if (!due.length) return false;
        const blockName = this.social?.engagement?.[this.mode]?.onCompleteGlobal;
        for (const name of due) writeGlobal(name, true, { openChat: false });
        window.stateSync?.sync?.();
        this.emodel = buildEngagementModel(this.social, this.globals, this.mode);
        return due.includes(blockName);
    }

    _peopleSection(m) {
        const list = h('ul', { class: 'ib-people', 'aria-label': 'People' });
        for (const t of m.targets) list.appendChild(this._personCard(t));
        const sec = h('section', { class: 'ib-section', 'aria-labelledby': 'ib-h-people' },
            h('h3', { id: 'ib-h-people', class: 'ib-h', text: 'People' }), list);
        const strings = document.createElement('div');
        strings.className = 'ib-strings';
        strings.innerHTML = stringSvg(m.targets.length); // fixed SVG string, no data in it
        sec.appendChild(strings);
        return sec;
    }

    _personCard(t) {
        const headingId = `ib-card-${t.id}`;
        const status = t.ready ? 'Ready to approach' : 'Not ready';
        const card = h('li', { class: `ib-card ib-person ${t.ready ? 'is-ready' : 'is-not-ready'}`,
            'data-person': t.id, 'data-status': t.status, 'aria-labelledby': headingId },
            h('img', { class: 'ib-pin', src: `${ICON}board-pushpin.png`, alt: '', 'aria-hidden': 'true',
                width: 11, height: 14 }),
            h('div', { class: 'ib-card-head' },
                h('h4', { id: headingId, class: `ib-name${t.identified ? '' : ' is-unknown'}`, text: t.name }),
                h('span', { class: `ib-status ${t.ready ? 'ready' : 'not-ready'}` },
                    icon(t.ready ? 'board-ready' : 'board-not-ready'),
                    h('span', { class: 'ib-status-word', text: status }),
                    t.newlyReady ? h('span', { class: 'ib-new', text: 'New since you last looked' }) : null)));

        if (t.role || t.address) {
            card.appendChild(h('p', { class: 'ib-meta' },
                t.role ? h('span', { text: t.role }) : null,
                t.role && t.address ? ' · ' : null,
                t.address ? h('span', { class: 'ib-address', text: t.address }) : null));
        }

        // Influence section (03, 00 S4): only for a target that is a social character, and
        // nothing when its influence.display has bar: false. Read-only, from gameState.
        const bar = createInfluenceBar({ characterId: t.id, scenario: { ...this._scenarioFor(), social: this.social }, mount: 'board' });
        if (bar) {
            this._bars.push(bar);
            card.appendChild(h('div', { class: 'ib-influence', 'data-person': t.id }, bar.el));
        }

        const found = h('ul', { class: 'ib-facts', 'aria-label': `Found about ${t.name}` });
        for (const f of t.facts) {
            found.appendChild(h('li', { class: 'ib-fact', 'data-fact': f.id },
                icon('mark-tick'), h('span', { class: 'ib-fact-text', text: f.text })));
        }
        for (const label of t.emptySlots) {
            found.appendChild(h('li', { class: 'ib-fact is-empty' },
                icon('board-slot-empty'),
                h('span', { class: 'ib-fact-text', text: `${label}: ???` }),
                h('span', { class: 'ib-word', text: 'Not yet found' })));
        }
        card.appendChild(found);

        if (t.fromCall && t.fromCall.length) {
            card.appendChild(h('h4', { class: 'ib-subh', text: 'From the call' }));
            const calls = h('ul', { class: 'ib-facts ib-from-call', 'aria-label': 'From the call' });
            for (const f of t.fromCall) {
                calls.appendChild(h('li', { class: 'ib-fact', 'data-fact': f.id },
                    icon('mark-tick'), h('span', { class: 'ib-fact-text', text: f.text })));
            }
            card.appendChild(calls);
        }

        if (t.slots.length) {
            const check = h('ul', { class: 'ib-check', 'aria-label': 'Readiness checklist' });
            for (const s of t.slots) {
                const li = h('li', { class: `ib-slot ${s.done ? 'done' : 'missing'}`, 'data-done': String(s.done) },
                    icon(s.done ? 'mark-tick' : 'mark-cross'),
                    h('span', { class: 'ib-slot-word', text: s.done ? 'Done:' : 'Missing:' }));
                if (s.done) {
                    li.appendChild(h('span', { class: 'ib-slot-text', text: s.doneString }));
                } else if (s.gapString) {
                    // lab6 (opt-in): a slot with a gapString names only the gap; the explicit
                    // where-to-look pointer (goalString) hides behind a "Stuck?" disclosure, so a
                    // capable student works recon out and a stuck one still has the net one click away.
                    li.appendChild(h('span', { class: 'ib-slot-text', text: s.gapString }));
                    li.appendChild(h('details', { class: 'ib-slot-stuck' },
                        h('summary', { class: 'ib-slot-stuck-summary', text: 'Stuck? Show me where to look' }),
                        h('span', { class: 'ib-slot-goal', text: s.goalString })));
                } else {
                    li.appendChild(h('span', { class: 'ib-slot-text', text: s.goalString }));
                }
                check.appendChild(li);
            }
            card.appendChild(check);
        }
        if (t.ready) card.appendChild(h('p', { class: 'ib-ready-line', text: READY_TEXT }));
        return card;
    }

    _scenarioFor() {
        return (typeof window !== 'undefined' ? window.gameScenario : null) || {};
    }

    _destroyBars() {
        for (const bar of this._bars) bar.destroy();
        this._bars = [];
    }

    _contactsSection(m) {
        const sec = h('section', { class: 'ib-section', 'aria-labelledby': 'ib-h-contacts' },
            h('h3', { id: 'ib-h-contacts', class: 'ib-h', text: 'Contacts' }));
        if (!m.contacts.length) {
            sec.appendChild(h('p', { class: 'ib-empty', text: 'No one else has come up yet.' }));
            return sec;
        }
        const list = h('ul', { class: 'ib-contacts' });
        for (const c of m.contacts) {
            list.appendChild(h('li', { class: 'ib-card ib-contact', 'data-contact': c.id },
                h('img', { class: 'ib-pin', src: `${ICON}board-pushpin.png`, alt: '', 'aria-hidden': 'true',
                    width: 11, height: 14 }),
                h('span', { class: 'ib-name', text: c.name }),
                c.address ? h('span', { class: 'ib-meta ib-address', text: c.address }) : null));
        }
        sec.appendChild(list);
        return sec;
    }

    _companySection(m) {
        const sec = h('section', { class: 'ib-section ib-company', 'aria-labelledby': 'ib-h-company' },
            h('h3', { id: 'ib-h-company', class: 'ib-h', text: 'Company' }));
        const card = h('div', { class: 'ib-card ib-company-card' },
            h('img', { class: 'ib-pin', src: `${ICON}board-pushpin.png`, alt: '', 'aria-hidden': 'true',
                width: 11, height: 14 }));
        if (!m.company.facts.length) {
            card.appendChild(h('p', { class: 'ib-empty', text: 'Nothing found about the company yet.' }));
        } else {
            const ul = h('ul', { class: 'ib-facts' });
            for (const f of m.company.facts) {
                ul.appendChild(h('li', { class: 'ib-fact', 'data-fact': f.id },
                    icon('mark-tick'), h('span', { class: 'ib-fact-text', text: f.text })));
            }
            card.appendChild(ul);
        }
        if (m.company.fromCall && m.company.fromCall.length) {
            card.appendChild(h('h4', { class: 'ib-subh', text: 'From the call' }));
            const ul = h('ul', { class: 'ib-facts ib-from-call', 'aria-label': 'From the call' });
            for (const f of m.company.fromCall) {
                ul.appendChild(h('li', { class: 'ib-fact', 'data-fact': f.id },
                    icon('mark-tick'), h('span', { class: 'ib-fact-text', text: f.text })));
            }
            card.appendChild(ul);
        }
        if (m.company.stale.length) {
            card.appendChild(h('h4', { class: 'ib-subh', text: 'Old or unverified' }));
            const ul = h('ul', { class: 'ib-facts ib-stale' });
            for (const f of m.company.stale) {
                ul.appendChild(h('li', { class: 'ib-fact is-stale', 'data-fact': f.id },
                    icon('mark-question'), h('span', { class: 'ib-word', text: 'Old or unverified:' }),
                    h('span', { class: 'ib-fact-text', text: f.text })));
            }
            card.appendChild(ul);
        }
        sec.appendChild(card);
        return sec;
    }

    // ── state ─────────────────────────────────────────────────────────────
    /** Ids only: which ready cards the player has now seen. Small, and it survives a reload. */
    _rememberReady() {
        if (!this.model || this.mode !== 'recon') return;
        const state = readBoardState(this.globals);
        const merged = [...new Set([...state.recon.seenReady, ...this.model.ready])];
        if (merged.length === state.recon.seenReady.length) return;
        this._writeState({ ...state, recon: { ...state.recon, seenReady: merged } });
    }

    _writeState(next) {
        writeGlobal(STATE_KEY, next, { openChat: false });
        window.stateSync?.sync?.();
    }

    saveDraft() { this._rememberReady(); }

    returnParams() { return { mode: this.mode }; }

    // ── exit ──────────────────────────────────────────────────────────────
    /** Close and Esc are a normal exit; completion is reported in the result. */
    closeResult() {
        const m = this.model || buildBoardModel(this.social, this.globals);
        const completed = this.mode === 'recon' ? m.osintDone : (this.mode === 'defender' ? !!this.dmodel?.complete : (this.emodel ? this.emodel.complete : false));
        return { mode: this.mode, completed, ready: [...m.ready] };
    }

    // ── test bridge ───────────────────────────────────────────────────────
    getTestState() {
        const m = this.model;
        return {
            ...super.getTestState(),
            board: m ? {
                mode: this.mode,
                engagement: this.emodel ? {
                    complete: this.emodel.complete,
                    done: this.emodel.doneCount,
                    total: this.emodel.total,
                    live: this._liveText,
                    steps: this.emodel.steps.map((s) => ({ id: s.id, done: s.done })),
                    items: this.emodel.items.map((i) => ({
                        id: i.id, kind: i.kind, step: i.step, done: i.done,
                        placed: i.placed || null, picked: i.pickedId || null,
                        options: i.options ? i.options.map((o) => o.id) : undefined
                    }))
                } : null,
                defender: this.dmodel ? {
                    complete: this.dmodel.complete,
                    done: this.dmodel.doneCount,
                    total: this.dmodel.total,
                    live: this._liveText,
                    steps: this.dmodel.steps.map((s) => ({ id: s.id, done: s.done })),
                    facts: this.dmodel.items.map((i) => ({
                        intel: i.intel, reduceNote: i.reduceNote, picked: i.pickedId, done: i.done,
                        options: i.options.map((o) => o.id)
                    })),
                    indicators: this.dmodel.indicators.map((i) => ({
                        id: i.id, tell: i.tell, step: i.step, shown: i.shown, marked: i.marked, done: i.done
                    }))
                } : null,
                title: m.title,
                osintDone: m.osintDone,
                ready: [...m.ready],
                newlyReady: [...m.newlyReady],
                live: this._liveText,
                scopeNote: !!m.scopeNote,
                targets: m.targets.map((t) => ({
                    id: t.id, name: t.name, identified: t.identified, role: t.role, address: t.address,
                    status: t.status, facts: [...t.factIds], emptySlots: [...t.emptySlots],
                    fromCall: (t.fromCall || []).map((f) => f.id),
                    slots: t.slots.map((s) => ({ label: s.label, done: s.done, gap: s.gapString || '', goal: s.goalString || '' }))
                })),
                influence: this._bars.map((b) => b.getState()),
                contacts: m.contacts.map((c) => c.id),
                company: {
                    facts: [...m.company.factIds],
                    stale: [...m.company.staleIds],
                    fromCall: [...(m.company.fromCallIds || [])]
                }
            } : null
        };
    }

    cleanup() {
        this._destroyBars();
        this.root = null;
        super.cleanup();
    }
}

export default IntelBoardMinigame;
