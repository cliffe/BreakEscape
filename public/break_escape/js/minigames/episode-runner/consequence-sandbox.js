// Consequence sandbox (awareness product, ENG-04): the `mistake` stage of a consequence-flip
// episode. In place of an attack half the learner makes a few ordinary choices in a safe
// sandbox, one beat at a time; the flip then runs as a montage of where each choice led.
//
// The scene 'consequence-sandbox', launched by the episode runner through launchChild.
//
// Params: { config: { beats: [{ id, situation, options: [{ id, label, safe, approvedRoute? }] }],
//                     flipBeat, scored: false },
//           strings?: { intro, progress, legend, empty, next, finish } }
//   strings over the defaults below; `progress` may hold {n} and {total}.
// Result: { mistakeChoices: { <beatId>: <optionId> }, finished: boolean }
//   finished is true only once every beat has an answer; the runner advances on that alone, so
//   closing part-way leaves the stage where it was.
//
// Nothing is scored and nothing says which option is the safe one: the sandbox never marks a
// choice right or wrong. The montage shows what each led to. Learner strings go in with
// textContent. Overlay rules (00 §6): requiresKeyboardInput, its own Close, Esc through
// SocialOverlayScene (a normal exit).

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { mistakeBeats } from './episode-model.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

const COPY = Object.freeze({
    intro: 'A few ordinary choices from an ordinary day. Nothing here is scored, so choose what you would really do.',
    progress: 'Choice {n} of {total}',
    legend: 'What do you do?',
    empty: 'There is nothing to choose here.',
    next: 'Next choice',
    finish: 'See where they led'
});

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export class ConsequenceSandboxMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, { title: 'Choices', ...(params || {}) });
        this.beats = mistakeBeats({ mistake: isObj(this.params.config) ? this.params.config : {} });
        this.copy = isObj(this.params.strings) ? this.params.strings : {};
        this.index = 0;          // the beat on screen
        this.choices = {};       // { beatId: optionId }
        this.pending = null;     // the option picked on this beat, not yet confirmed
        this.finished = false;
    }

    _str(key) {
        return isStr(this.copy[key]) ? this.copy[key] : COPY[key];
    }

    // ── lifecycle ──────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        const root = el('div', 'epr-sbx-root');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', 'Everyday choices');
        this.root = root;

        const bar = el('div', 'epr-sbx-bar');
        bar.appendChild(el('span', 'epr-sbx-title', this.params.title || 'Choices'));
        this.mountCloseControl(bar, 'Close');
        root.appendChild(bar);

        this.card = el('section', 'epr-sbx-card');
        root.appendChild(this.card);
        this.gameContainer.appendChild(root);
        this._draw();
    }

    start() {
        super.start();
        this._focus();
    }

    _focus() {
        try {
            const first = this.card?.querySelector?.('.epr-sbx-radio, .epr-sbx-heading');
            first?.focus?.();
        } catch (e) { /* focus is a nicety */ }
    }

    // ── drawing ────────────────────────────────────────────────────────────────

    _draw() {
        const card = this.card;
        card.textContent = '';
        this.pending = null;
        const beat = this.beats[this.index];
        if (!beat) {
            card.appendChild(el('p', 'epr-sbx-situation', this._str('empty')));
            return;
        }
        const last = this.index === this.beats.length - 1;
        if (this.index === 0) card.appendChild(el('p', 'epr-sbx-intro', this._str('intro')));
        const heading = el('h2', 'epr-sbx-heading',
            this._str('progress').replace('{n}', String(this.index + 1)).replace('{total}', String(this.beats.length)));
        heading.tabIndex = -1;
        card.appendChild(heading);
        if (beat.situation) card.appendChild(el('p', 'epr-sbx-situation', beat.situation));

        const group = el('fieldset', 'epr-sbx-options');
        const legend = el('legend', 'epr-sbx-legend', this._str('legend'));
        group.appendChild(legend);
        const name = `epr_sbx_${beat.id}`;
        for (const opt of beat.options) {
            const label = el('label', 'epr-sbx-option');
            const radio = el('input', 'epr-sbx-radio');
            radio.type = 'radio';
            radio.name = name;
            radio.value = opt.id;
            this.addEventListener(radio, 'change', () => {
                this.pending = opt.id;
                this.confirmButton.disabled = false;
                for (const l of group.querySelectorAll('.epr-sbx-option')) l.classList.remove('epr-sbx-picked');
                label.classList.add('epr-sbx-picked');
            });
            label.append(radio, el('span', 'epr-sbx-option-label', opt.label));
            group.appendChild(label);
        }
        card.appendChild(group);

        this.confirmButton = el('button', 'epr-sbx-confirm epr-button aw-button',
            last ? this._str('finish') : this._str('next'));
        this.confirmButton.type = 'button';
        this.confirmButton.disabled = true;
        this.addEventListener(this.confirmButton, 'click', (e) => {
            e.preventDefault?.();
            this._confirm();
        });
        card.appendChild(this.confirmButton);
        this._focus();
    }

    /** Store the picked option for this beat and move on; the last beat finishes the scene. */
    _confirm() {
        const beat = this.beats[this.index];
        if (!beat || !this.pending || !beat.options.some((o) => o.id === this.pending)) return;
        this.choices[beat.id] = this.pending;
        if (this.index < this.beats.length - 1) {
            this.index++;
            this._draw();
            return;
        }
        this.finished = true;
        this.close();
    }

    // ── exit and test bridge ───────────────────────────────────────────────────

    closeResult() {
        return { mistakeChoices: { ...this.choices }, finished: this.finished };
    }

    getTestState() {
        return {
            ...super.getTestState(),
            sandbox: {
                beat: this.beats[this.index]?.id ?? null,
                index: this.index,
                total: this.beats.length,
                choices: { ...this.choices },
                pending: this.pending,
                finished: this.finished
            }
        };
    }
}

export default ConsequenceSandboxMinigame;
