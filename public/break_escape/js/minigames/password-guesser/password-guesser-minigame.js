// Password guesser (awareness product, ENG-02): the `guess` stage of an episode. The learner steps an
// authored "guesser" through a made-up colleague's guess list in the order attackers try it: the usual
// first guesses, patterns built from OSINT facts the learner collected, a password reused from a
// breached hobby site that opens the work account, and a three-random-words passphrase that is still
// being tried when the rig is switched off.
// ENG-02b: `mode` 'spray' and 'stuff' draw the organisation-scale console (E18) through the same rows and
// stepping: roster, word list, spray passes, a masked credential-stuffing panel and the passphrase hold-out.
//
// The scene 'password-guesser', launched by the episode runner through launchChild.
//
// Params: { config: awarenessEpisode.guess (see password-guesser-model.js; `mode` picks the builder,
//                    default 'target'),
//           note?: strings.guessNote, the on-screen "nothing real is typed" line,
//           globals?: the globals the facts are read from (default gameState.globalVariables),
//           write?: (name, value) => void   the writer for config.landedGlobal (default writeGlobal) }
// Result: { finished: boolean, landed: boolean }
//   finished is true once the rig has been switched off after every guess was reached; the runner
//   advances on that alone, so closing part-way leaves the stage where it was.
//   On any normal close with a landed account the scene writes config.landedGlobal = true.
//
// Nothing here is typed and nothing typed is a password: there is no text field, no clipboard write
// and no value other than the authored strings. Every string goes in with textContent. Nothing is
// scored. Overlay rules (00 §6): requiresKeyboardInput, its own Close, Esc through SocialOverlayScene
// (a normal exit).

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { writeGlobal } from '../../systems/global-writer.js';
import { buildRun, GuesserRun, modeOf, textFor, DEFAULT_TEXT } from './password-guesser-model.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export class PasswordGuesserMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, { title: DEFAULT_TEXT.heading, ...(params || {}) });
        this.config = isObj(this.params.config) ? this.params.config : {};
        this.mode = modeOf(this.config);
        const globals = isObj(this.params.globals) ? this.params.globals
            : ((typeof window !== 'undefined' ? window.gameState?.globalVariables : null) || {});
        const built = this.mode ? buildRun(this.config, globals) : null;
        this.run = new GuesserRun(built);
        this.built = built;
        // strings.guessNote, passed by the runner, wins over the block's own note.
        if (built && isStr(this.params.note)) built.note = this.params.note;
        this.switchedOff = false;
        this.rowNodes = [];
    }

    _text(key) { return textFor(this.config, key); }

    // ── lifecycle ──────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        const root = el('div', 'epr-gs-root');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', this._text('heading'));
        this.root = root;

        const bar = el('div', 'epr-gs-bar');
        bar.appendChild(el('span', 'epr-gs-title', this.params.title || this._text('heading')));
        this.mountCloseControl(bar, this._text('close'));
        root.appendChild(bar);

        this.card = el('section', 'epr-gs-card');
        root.appendChild(this.card);
        this.gameContainer.appendChild(root);
        this._draw();
    }

    start() {
        super.start();
        try { this.card?.querySelector?.('.epr-gs-step')?.focus?.(); } catch (e) { /* focus is a nicety */ }
    }

    // ── drawing ────────────────────────────────────────────────────────────────

    _draw() {
        const card = this.card;
        card.textContent = '';
        if (!this.built) {
            card.appendChild(el('p', 'epr-gs-note', this._text('unsupported')));
            return;
        }
        // The on-screen "nothing real here" line (strings.guessNote, else the block's note, else the default).
        card.appendChild(el('p', 'epr-gs-note', this.built.note));

        this.rowNodes = [];
        for (const panel of this.built.panels) {
            const sec = el('section', 'epr-gs-panel');
            sec.dataset.panel = panel.id;
            sec.appendChild(el('h2', 'epr-gs-heading', panel.heading));
            if (isStr(panel.intro)) sec.appendChild(el('p', 'epr-gs-intro', panel.intro));
            const list = el('ul', 'epr-gs-rows');
            for (const row of panel.rows) {
                const li = el('li', 'epr-gs-row');
                li.dataset.row = row.id;
                if (row.address) li.dataset.address = 'true';
                const text = el('span', 'epr-gs-text', row.text);
                const status = el('span', 'epr-gs-status');
                li.append(text, status);
                const note = isStr(row.note) ? el('p', 'epr-gs-row-note', row.note) : null;
                if (note) { note.hidden = true; li.appendChild(note); }
                list.appendChild(li);
                this.rowNodes.push({ li, status, note });
            }
            sec.appendChild(list);
            card.appendChild(sec);
        }

        this.live = el('p', 'epr-gs-live');
        this.live.setAttribute('aria-live', 'polite');
        card.appendChild(this.live);

        const controls = el('div', 'epr-gs-controls');
        this.stepButton = this._button(controls, this._text('step'), 'epr-gs-step', () => this._step());
        this.allButton = this._button(controls, this._text('runAll'), 'epr-gs-all', () => this._runAll());
        this.offButton = this._button(controls, this._text('switchOff'), 'epr-gs-off', () => this._switchOff());
        card.appendChild(controls);
        this._refresh();
    }

    _button(parent, label, className, onClick) {
        const b = el('button', `${className} epr-button aw-button`, label);
        b.type = 'button';
        this.addEventListener(b, 'click', (e) => {
            e.preventDefault?.();
            onClick();
        });
        parent.appendChild(b);
        return b;
    }

    /** Paint every row's state and the buttons from the run. */
    _refresh() {
        this.built.rows.forEach((row, i) => {
            const state = this.run.stateOf(i);
            const node = this.rowNodes[i];
            node.li.dataset.state = state;
            node.li.className = `epr-gs-row epr-gs-${state}${row.address ? ' epr-gs-address' : ''}`;
            node.status.textContent = this._text(state);
            if (node.note) node.note.hidden = state !== 'opened';
        });
        const done = this.run.switchOffReady;
        this.stepButton.disabled = done;
        this.allButton.disabled = done;
        this.offButton.disabled = !done || this.switchedOff;
        this.stepButton.textContent = done ? this._text('step')
            : `${this._text('step')} (${this._text('stepsLeft').split('{n}').join(String(this.run.remaining))})`;
    }

    // ── playing ────────────────────────────────────────────────────────────────

    _step() {
        const row = this.run.advance();
        if (!row) return;
        this._refresh();
        const state = this.run.stateOf(this.run.index - 1);
        this.live.textContent = `${row.text}: ${this._text(state)}`;
        if (this.run.switchOffReady) this._focusOff();
    }

    _runAll() {
        this.run.runAll();
        this._refresh();
        this.live.textContent = '';
        this._focusOff();
    }

    _focusOff() {
        try { this.offButton?.focus?.(); } catch (e) { /* focus is a nicety */ }
    }

    _switchOff() {
        if (!this.run.switchOffReady) return;
        this.switchedOff = true;
        this.close();
    }

    // ── exit and test bridge ───────────────────────────────────────────────────

    /** A normal close with a landed account writes the config's landed global (true), once. */
    close() {
        if (!this.gameState.isActive) return;
        this._writeLanded();
        super.close();
    }

    _writeLanded() {
        const name = this.config.landedGlobal;
        if (!this.built || !this.run.landed || !isStr(name)) return;
        try {
            if (typeof this.params.write === 'function') this.params.write(name, true);
            else writeGlobal(name, true, { openChat: false });
            if (typeof window !== 'undefined') window.stateSync?.sync?.();
        } catch (e) {
            console.error('[guess] could not write the landed global:', e);
        }
    }

    closeResult() {
        return { finished: this.switchedOff, landed: !!this.built && this.run.landed };
    }

    getTestState() {
        return {
            ...super.getTestState(),
            guesser: {
                mode: this.mode,
                total: this.run.total,
                revealed: this.run.index,
                landed: !!this.built && this.run.landed,
                switchedOff: this.switchedOff,
                rows: (this.built?.rows ?? []).map((r, i) => ({ id: r.id, text: r.text, state: this.run.stateOf(i) }))
            }
        };
    }
}

export default PasswordGuesserMinigame;
