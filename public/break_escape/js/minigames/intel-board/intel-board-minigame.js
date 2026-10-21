// The intel board (SE design 03; implementation plan Phase 1a, packet P1-G).
//
// Recon mode only for now: a case-file overlay that shows what the player has
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
// All text the player reads is set with textContent in Source Sans 3
// (--se-font-readable), never through innerHTML or displayDashes.

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { writeGlobal } from '../../systems/global-writer.js';
import { buildBoardModel, readBoardState, STATE_KEY, READY_TEXT } from './board-model.js';

const ICON = '/break_escape/assets/icons/';
const SUPPORTED_MODES = ['recon'];

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
        this._liveText = '';
    }

    // ── data ──────────────────────────────────────────────────────────────
    get social() {
        return this.params.social || (typeof window !== 'undefined' ? window.gameScenario?.social : null) || {};
    }

    get globals() {
        return (typeof window !== 'undefined' ? window.gameState?.globalVariables : null) || {};
    }

    /** Re-read the globals and draw the board again (called on open). */
    rebuild() {
        this.model = buildBoardModel(this.social, this.globals);
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
        const meta = [t.role, t.address].filter(Boolean);
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

        if (meta.length) card.appendChild(h('p', { class: 'ib-meta', text: meta.join(' · ') }));

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

        if (t.slots.length) {
            const check = h('ul', { class: 'ib-check', 'aria-label': 'Readiness checklist' });
            for (const s of t.slots) {
                check.appendChild(h('li', { class: `ib-slot ${s.done ? 'done' : 'missing'}`, 'data-done': String(s.done) },
                    icon(s.done ? 'mark-tick' : 'mark-cross'),
                    h('span', { class: 'ib-slot-word', text: s.done ? 'Done:' : 'Missing:' }),
                    h('span', { class: 'ib-slot-text', text: s.done ? s.doneString : s.goalString })));
            }
            card.appendChild(check);
        }
        if (t.ready) card.appendChild(h('p', { class: 'ib-ready-line', text: READY_TEXT }));
        return card;
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
                c.address ? h('span', { class: 'ib-meta', text: c.address }) : null));
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
        if (!this.model || !SUPPORTED_MODES.includes(this.mode)) return;
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
        return { mode: this.mode, completed: this.mode === 'recon' ? m.osintDone : false, ready: [...m.ready] };
    }

    // ── test bridge ───────────────────────────────────────────────────────
    getTestState() {
        const m = this.model;
        return {
            ...super.getTestState(),
            board: m ? {
                mode: this.mode,
                title: m.title,
                osintDone: m.osintDone,
                ready: [...m.ready],
                newlyReady: [...m.newlyReady],
                live: this._liveText,
                scopeNote: !!m.scopeNote,
                targets: m.targets.map((t) => ({
                    id: t.id, name: t.name, identified: t.identified, role: t.role, address: t.address,
                    status: t.status, facts: [...t.factIds], emptySlots: [...t.emptySlots],
                    slots: t.slots.map((s) => ({ label: s.label, done: s.done }))
                })),
                contacts: m.contacts.map((c) => c.id),
                company: { facts: [...m.company.factIds], stale: [...m.company.staleIds] }
            } : null
        };
    }

    cleanup() {
        this.root = null;
        super.cleanup();
    }
}

export default IntelBoardMinigame;
