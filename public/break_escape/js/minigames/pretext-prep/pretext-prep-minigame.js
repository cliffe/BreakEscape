// Pretext preparation (06 beats 1 and 2, N5, N6; packet P4-C).
//
// Beat 1 is the brief: scope and objectives when the scenario authors them,
// the ethics line, and the board sentences for facts the player holds.
// Beat 2 is the pretext card. Each blank is a picker of held facts only
// (the mail composer's slot rules, 01 N10). A blank with nothing held stays
// an empty gap. Nothing is typed in.
//
// Begin replaces this overlay with person-chat or phone-chat:
//   { npcId, startKnot, pretextCallId, blanks }
// blanks is keyed by fact id → { value, label } (fillPretextVars). The prep
// overlay itself completes with no payload: Close and Esc are a clean exit (no
// task, no failure — F11), and handing over to the chat does not emit a result a
// scenario could key on. The call's result is pretext_<callId>_outcome, written
// by the chat (06 N7, N8).
//
// Registration, the starter and the callId branch are not this packet
// (P4-T0 adds the shared-file blocks; P4-D already opens this scene).
// Keyboard: requiresKeyboardInput is set here, and start() pauses the player
// keys, because the interactions starter does not pass the flag before
// startMinigame reads params. Esc closes an open picker first (00 §6).

import { SocialOverlayScene } from '../framework/social-overlay.js';
import {
    blankSlot, blanksPayload, briefCopy, callGate, callWords, callLaunch, cardFacts, cardLines, heldIdsFor,
    factLabel, heldOnBoard, hintLine, kindText, optionsForFact, readinessLines, textParts
} from './pretext-card.js';

function h(tag, props = {}, ...kids) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (value === undefined || value === null || value === false) continue;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else node.setAttribute(key, value === true ? '' : String(value));
    }
    for (const kid of kids.flat()) {
        if (kid === undefined || kid === null || kid === false) continue;
        node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return node;
}

export class PretextPrepMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, params);
        this.chosen = {}; // factId -> value id
        this._picker = null;
        this._popPicker = null;
    }

    // A plain Close or Esc is a clean exit, not a failure: nothing reads the prep's
    // result, no task completes, and the student has simply stepped away from the card
    // (F11). The call's own result is written by the chat, not here.
    get closeMode() { return 'close'; }

    get social() {
        return this.params.social || (typeof window !== 'undefined' ? window.gameScenario?.social : null) || {};
    }

    get globals() {
        return (typeof window !== 'undefined' ? window.gameState?.globalVariables : null) || {};
    }

    get spec() {
        const calls = this.social?.pretextNpcs;
        const callId = this.params?.callId;
        if (Array.isArray(calls) && callId) {
            const found = calls.find((call) => call && call.callId === callId);
            if (found) return found;
        }
        return this.params.spec || null;
    }

    npc() {
        const id = this.params?.npcId;
        if (!id || typeof window === 'undefined') return null;
        return window.npcManager?.getNPC?.(id) || null;
    }

    init() {
        super.init();
        this.container.classList.add('pretext-prep-container');
        this.gameContainer.classList.add('pretext-prep-game');
        this.render();
    }

    start() {
        super.start();
        // The interactions starter does not pass requiresKeyboardInput before
        // the manager reads params, so pause here as well (00 §6).
        if (typeof window.pauseKeyboardInput === 'function') window.pauseKeyboardInput();
        this.root?.focus?.();
    }

    facts() {
        return cardFacts(this.spec, this.social);
    }

    optionsByFact() {
        const out = {};
        for (const fact of this.facts()) {
            out[fact.factId] = optionsForFact(fact.factId, this.spec, this.social, this.globals);
        }
        return out;
    }

    gate() {
        return callGate(this.facts(), this.optionsByFact(), this.chosen,
            { requireFact: this.spec?.requireFact === true, line: this.spec?.requireFactLine });
    }

    payload() {
        return blanksPayload(this.facts(), this.optionsByFact(), this.chosen);
    }

    render() {
        this._closePicker();
        const spec = this.spec;
        const facts = this.facts();
        const options = this.optionsByFact();
        const brief = briefCopy(spec, this.social);
        const held = heldOnBoard(this.social, this.globals);
        const gate = this.gate();
        const ready = readinessLines(facts, options);
        const npcMissing = gate.ok && !this.npc();
        const gateText = npcMissing ? 'This call has no contact.' : gate.line;
        const lines = cardLines(spec, heldIdsFor(this.social, this.globals));
        const factIds = facts.map((fact) => fact.factId);
        const labelFor = (id) => options[id]?.find((option) => option.value === this.chosen[id])?.label || '';
        const npc = npcMissing ? null : this.npc();
        const beginLabel = npc?.npcType === 'phone' ? 'Make the call' : (npc ? 'Approach' : 'Begin');

        const words = callWords(spec, npc);
        const root = h('div', { class: 'pretext-prep', role: 'dialog', 'aria-label': words.title, tabindex: '-1' });
        this.root = root;

        const head = h('div', { class: 'pretext-head' },
            h('h2', { class: 'pretext-title', text: words.title }),
            brief.characterName ? h('p', { class: 'pretext-who', text: brief.characterName }) : null,
            this._closeButton()
        );
        root.appendChild(head);

        const scroll = h('div', { class: 'pretext-scroll' });
        scroll.appendChild(this._briefBlock(brief, held, words));
        const hint = hintLine(spec, this.globals);
        if (hint) scroll.appendChild(h('p', { class: 'pretext-hint', text: hint }));
        scroll.appendChild(this._cardBlock(facts, options, lines, factIds, labelFor, ready));
        root.appendChild(scroll);

        const bar = h('div', { class: 'pretext-bar' });
        const begin = h('button', {
            type: 'button', class: 'pretext-begin minigame-button', text: beginLabel,
            'aria-label': beginLabel
        });
        begin.disabled = !gate.ok || !npc;
        this.addEventListener(begin, 'click', () => this.begin());
        const gateLine = h('p', { class: 'pretext-gate', id: 'pretext-gate', 'aria-live': 'polite' });
        gateLine.textContent = gateText;
        if (gateText) begin.setAttribute('aria-describedby', 'pretext-gate');
        bar.append(begin, gateLine);
        root.appendChild(bar);

        this.beginButton = begin;
        this.gameContainer.textContent = '';
        this.gameContainer.appendChild(root);
    }

    _closeButton() {
        const btn = h('button', { type: 'button', class: 'pretext-close minigame-button', text: 'Close', 'aria-label': 'Close' });
        this.addEventListener(btn, 'click', (event) => {
            event.preventDefault?.();
            event.stopPropagation?.();
            this.requestClose();
        });
        this.closeButton = btn;
        return btn;
    }

    _briefBlock(brief, held, words) {
        const block = h('section', { class: 'pretext-brief', 'aria-label': 'Brief' });
        if (brief.scope) block.appendChild(h('p', { class: 'pretext-scope', text: brief.scope }));
        block.appendChild(h('p', { class: 'pretext-ethics', text: brief.ethics }));
        if (brief.objectives.length) {
            const list = h('ul', { class: 'pretext-objectives' });
            for (const item of brief.objectives) list.appendChild(h('li', { text: item }));
            block.appendChild(list);
        }
        block.appendChild(h('h3', { class: 'pretext-held-title', text: words.heldTitle }));
        if (!held.length) {
            block.appendChild(h('p', { class: 'pretext-held-empty', text: words.heldEmpty }));
        } else {
            const list = h('ul', { class: 'pretext-held' });
            for (const row of held) {
                const li = h('li', { 'data-fact': row.id });
                if (row.stale) li.classList.add('pretext-held-stale');
                li.appendChild(document.createTextNode(row.text));
                if (row.stale) li.appendChild(h('span', { class: 'pretext-held-warning', text: ' — old or unverified' }));
                list.appendChild(li);
            }
            block.appendChild(list);
        }
        return block;
    }

    _cardBlock(facts, options, lines, factIds, labelFor, ready) {
        const block = h('section', { class: 'pretext-card', 'aria-label': 'Pretext card' });
        block.appendChild(h('h3', { class: 'pretext-card-title', text: 'Pretext card' }));
        // A line whose blank refers to a fact with nothing held can never be completed, so it is
        // not shown: an un-fillable "____" line beside a disabled "nothing held yet" button only
        // puzzled the learner (E3 N4). A line with no blanks, or with blanks that do have options
        // (fillable, even if not yet chosen), still shows.
        const usableLines = lines.filter((line) => {
            const ids = [...String(line.text).matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((m) => m[1]);
            return ids.every((id) => !factIds.includes(id) || (options[id] || []).length > 0);
        });
        if (usableLines.length) {
            const list = h('ul', { class: 'pretext-lines' });
            for (const line of usableLines) {
                const li = h('li', { class: 'pretext-line', 'data-line': line.lineId });
                for (const part of textParts(line.text, factIds, labelFor)) {
                    if (part.kind === 'text') li.appendChild(document.createTextNode(part.text));
                    else li.appendChild(h('span', { class: part.kind === 'gap' ? 'pretext-gap' : 'pretext-value', text: part.text }));
                }
                list.appendChild(li);
            }
            block.appendChild(list);
        }
        if (!facts.length) {
            block.appendChild(h('p', { class: 'pretext-no-blanks', text: 'No blanks to fill. The lines are fixed.' }));
        }
        for (const fact of facts) {
            block.appendChild(this._blankControl(fact, options[fact.factId] || []));
        }
        if (ready.length) {
            const note = h('p', { class: 'pretext-readiness' });
            note.textContent = ready.join(' ');
            block.appendChild(note);
        }
        return block;
    }

    _blankControl(fact, options) {
        const label = factLabel(fact.factId, fact.label);
        const picked = options.find((option) => option.value === this.chosen[fact.factId]);
        const empty = options.length === 0;
        const field = h('div', { class: 'pretext-blank-field' });
        const btn = h('button', {
            type: 'button',
            class: 'pretext-blank minigame-button',
            'data-fact': fact.factId,
            'data-empty': empty ? 'true' : 'false',
            'aria-haspopup': 'listbox',
            'aria-expanded': 'false'
        });
        btn.disabled = empty;
        btn.textContent = empty ? `${label}: nothing held yet` : (picked ? `${label}: ${picked.label}` : `${label}: choose…`);
        if (!empty) this.addEventListener(btn, 'click', () => this.openPicker(fact.factId, btn));
        field.appendChild(btn);
        return field;
    }

    openPicker(factId, anchor) {
        this._closePicker();
        const options = this.optionsByFact()[factId] || [];
        if (!options.length) return;
        const label = factLabel(factId, this.facts().find((f) => f.factId === factId)?.label);
        const panel = h('div', { class: 'pretext-picker', role: 'dialog', 'aria-label': `Choose ${label}` });
        const list = h('ul', { class: 'pretext-picker-list', role: 'listbox', 'aria-label': `${label} options`, tabindex: '0' });
        const chosen = this.chosen[factId];
        let active = Math.max(0, options.findIndex((option) => option.value === chosen));
        const items = [];
        options.forEach((option, index) => {
            const li = h('li', {
                class: 'pretext-picker-option', role: 'option', id: `pretext-opt-${index}`,
                'data-value': option.value, 'aria-selected': option.value === chosen ? 'true' : 'false'
            });
            li.appendChild(h('span', { class: 'pretext-picker-label', text: option.label }));
            const kind = kindText(option.kind);
            if (kind) li.appendChild(h('span', { class: `pretext-picker-kind kind-${option.kind}`, text: kind }));
            this.addEventListener(li, 'click', () => this._pick(factId, option.value));
            items.push(li);
            list.appendChild(li);
        });
        const setActive = (index) => {
            active = (index + items.length) % items.length;
            items.forEach((li, i) => li.classList.toggle('active', i === active));
            list.setAttribute('aria-activedescendant', items[active].id);
        };
        this.addEventListener(list, 'keydown', (event) => {
            if (event.key === 'Tab') event.preventDefault();
            else if (event.key === 'Home') { event.preventDefault(); setActive(0); }
            else if (event.key === 'End') { event.preventDefault(); setActive(items.length - 1); }
            else if (event.key === 'ArrowDown') { event.preventDefault(); setActive(active + 1); }
            else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); }
            else if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this._pick(factId, options[active].value);
            }
        });
        panel.appendChild(list);
        this.root.appendChild(panel);
        this._picker = { factId, panel };
        this._popPicker = this.pushLayer(() => this._closePicker(true), 'blank-picker');
        anchor?.setAttribute?.('aria-expanded', 'true');
        this._pickerAnchor = anchor;
        setActive(active);
        list.focus?.();
    }

    _pick(factId, value) {
        this._closePicker();
        this.chosen[factId] = value;
        this.render();
        this.root?.querySelector?.(`[data-fact="${factId}"]`)?.focus?.();
    }

    _closePicker(focusAnchor = false) {
        if (this._popPicker) { this._popPicker(); this._popPicker = null; }
        if (this._picker) {
            this._picker.panel.remove?.();
            this._picker = null;
        }
        if (this._pickerAnchor) {
            this._pickerAnchor.setAttribute?.('aria-expanded', 'false');
            if (focusAnchor) this._pickerAnchor.focus?.();
            this._pickerAnchor = null;
        }
    }

    /** Hand the filled card to the chat. No result is recorded on this overlay. */
    begin() {
        if (!this.gate().ok) return;
        const npc = this.npc();
        const launch = callLaunch(this.spec, npc, this.params?.npcId, this.payload());
        const fw = typeof window !== 'undefined' ? window.MinigameFramework : null;
        if (!launch || typeof fw?.startMinigame !== 'function') return;
        const started = fw.startMinigame(launch.scene, null, launch.params);
        if (!started) {
            const line = this.root?.querySelector?.('.pretext-gate');
            if (line) line.textContent = 'The call did not open.';
        }
    }

    getTestState() {
        const facts = this.facts();
        const options = this.optionsByFact();
        const npc = this.npc();
        const launch = callLaunch(this.spec, npc, this.params?.npcId, this.payload());
        return {
            ...super.getTestState(),
            pretext: {
                callId: this.params?.callId || this.spec?.callId || null,
                character: this.spec?.character || null,
                npcId: this.params?.npcId || null,
                scene: launch?.scene || null,
                startKnot: launch?.params?.startKnot || null,
                canCall: this.gate().ok && !!npc,
                gate: this.gate().line,
                picker: this._picker ? this._picker.factId : null,
                held: heldOnBoard(this.social, this.globals).map((row) => row.id),
                blanks: this.payload(),
                facts: facts.map((fact) => ({
                    factId: fact.factId,
                    slot: blankSlot(fact.factId, this.spec, this.social?.intelFacts),
                    options: (options[fact.factId] || []).map((option) => ({
                        value: option.value, label: option.label, kind: option.kind
                    })),
                    chosen: this.chosen[fact.factId] || null
                }))
            }
        };
    }
}
