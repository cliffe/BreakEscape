import { MinigameScene } from '../framework/base-minigame.js';
import { escapeHtml } from '../../utils/escape-html.js';
// Author text keeps entities and bare <strong> <em> <b> <i> <br> (see utils/author-html.js).
import { authorHtml } from '../../utils/author-html.js';

/**
 * Coverage Decision Form Minigame
 *
 * Fully scenario-driven. All content comes from scenarioData via params.lockable.
 *
 * Required scenarioData fields:
 *   headerRef          — policy reference shown in header and submitted badge
 *   claimsManager      — name shown in header sub-line
 *   openVar            — global var set to true when the form is first opened
 *   sections[]         — form section definitions (see below)
 *   completionActions[]— global var writes executed on submit (see below)
 *
 * Optional scenarioData fields:
 *   formTitle          — text in the cdf-header-title span
 *   outcomeSpeaker     — label above the post-submit NPC quote
 *   outcomeQuoteSection— section id whose selected value keys outcomeQuotes lookup
 *   outcomeQuotes{}    — NPC response quotes keyed by option value
 *
 * Section schema:
 *   { id, title, description, options: [{ value, label, sublabel }] }
 *
 * Completion action schema:
 *   { setVariable, value }                        — write a fixed value
 *   { setVariable, fromSection }                  — write the selected option value
 *   { setVariable, fromSection, equalsValue }     — write boolean (selected === equalsValue)
 */

export class CoverageDecisionFormMinigame extends MinigameScene {
    constructor(container, params = {}) {
        const sd = params.lockable?.scenarioData?.minigameData || {};
        super(container, {
            ...params,
            title:      'Coverage Recommendation Form',
            showCancel: true,
            cancelText: 'Close',
        });
        this._headerRef          = sd.headerRef          || '';
        this._claimsManager      = sd.claimsManager      || '';
        this._openVar            = sd.openVar            || '';
        this._formTitle          = sd.formTitle          || 'Coverage Recommendation Form';
        this._outcomeSpeaker     = sd.outcomeSpeaker     || '';
        this._outcomeQuoteSection= sd.outcomeQuoteSection|| '';
        this._outcomeQuotes      = sd.outcomeQuotes      || {};
        this._sections           = sd.sections           || [];
        this._completionActions  = sd.completionActions  || [];
        this._submitted          = false;
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        this.container.classList.add('cdf-minigame-container');
        this.gameContainer.classList.add('cdf-game-container');
        this._renderLayout();
    }

    start() {
        super.start();
        if (this._openVar) {
            const globals = window.gameState?.globalVariables || {};
            if (!globals[this._openVar]) this._setGlobalAndNotify(this._openVar, true);
        }
    }

    cleanup() {
        super.cleanup();
    }

    // ── Layout ───────────────────────────────────────────────────────────────

    _renderLayout() {
        // HTML: each scenario part goes through authorHtml once. headerSub and badge are
        // finished HTML (escaped parts joined by literal &mdash; and &#10003;): insert them
        // as they are, never through authorHtml or escapeHtml again.
        const headerSub = [
            'Meridian Cyber Insurance',
            this._headerRef   ? `Policy Ref: ${authorHtml(this._headerRef)}`       : null,
            this._claimsManager ? `Claims Manager: ${authorHtml(this._claimsManager)}` : null,
        ].filter(Boolean).join(' &mdash; ');

        const badge = this._headerRef
            ? `&#10003; RECOMMENDATION LOGGED &mdash; ${authorHtml(this._headerRef)}`
            : '&#10003; RECOMMENDATION LOGGED';

        const sectionsHtml = this._sections.map(s => this._renderSection(s)).join('\n');

        this.gameContainer.innerHTML = `
<div class="cdf-wrap">
  <div class="cdf-header">
    <div class="cdf-header-title">${authorHtml(this._formTitle)}</div>
    <div class="cdf-header-sub">${headerSub}</div>
  </div>

  <div class="cdf-body">
    ${sectionsHtml}
  </div>

  <div class="cdf-footer">
    <div class="cdf-outcome-note" id="cdf-outcome-note">
      <div class="cdf-outcome-speaker">${authorHtml(this._outcomeSpeaker)}</div>
      <div id="cdf-outcome-text"></div>
    </div>
    <div class="cdf-submitted-badge" id="cdf-submitted-badge">${badge}</div>
    <button class="cdf-submit-btn" id="cdf-submit-btn" disabled>[SUBMIT RECOMMENDATION &#9654;]</button>
    <div class="cdf-hint" id="cdf-hint">Complete all ${this._sections.length} sections to submit your recommendation.</div>
    <button class="cdf-close-btn" id="cdf-close-btn">Close</button>
  </div>
</div>`;

        const closeBtn = this.gameContainer.querySelector('#cdf-close-btn');
        this.addEventListener(closeBtn, 'click', () => this.complete(false));

        this.gameContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
            this.addEventListener(radio, 'change', () => this._onRadioChange(radio));
        });

        const submitBtn = this.gameContainer.querySelector('#cdf-submit-btn');
        this.addEventListener(submitBtn, 'click', () => this._onSubmit());
    }

    _renderSection(section) {
        const options = section.options.map(opt => `
      <label class="cdf-radio-row" id="${escapeHtml(`${section.id}-${opt.value}`)}">
        <input type="radio" name="${escapeHtml(section.id)}" value="${escapeHtml(opt.value)}">
        <span>
          <span>${authorHtml(opt.label)}</span>
          <span class="cdf-radio-sublabel">${authorHtml(opt.sublabel)}</span>
        </span>
      </label>`).join('');

        return `
    <div class="cdf-section">
      <div class="cdf-section-title">${authorHtml(section.title)}</div>
      <div class="cdf-section-desc">${authorHtml(section.description)}</div>
      ${options}
    </div>`;
    }

    // ── Radio interaction ─────────────────────────────────────────────────────

    // Section ids come from the scenario, so they are matched by property, never
    // spliced into a selector
    _radios(name) {
        return [...this.gameContainer.querySelectorAll('input[type="radio"]')].filter(r => r.name === String(name));
    }

    _checked(name) {
        return this._radios(name).find(r => r.checked) || null;
    }

    _onRadioChange(radio) {
        const name = radio.name;
        this._radios(name).forEach(r => {
            r.closest('.cdf-radio-row').classList.toggle('cdf-selected', r.checked);
        });
        this._updateSubmitButton();
    }

    _updateSubmitButton() {
        if (this._submitted) return;
        const allSelected = this._sections.every(section =>
            !!this._checked(section.id)
        );
        const btn  = this.gameContainer.querySelector('#cdf-submit-btn');
        const hint = this.gameContainer.querySelector('#cdf-hint');
        if (!btn) return;
        btn.disabled = !allSelected;
        btn.classList.toggle('cdf-ready', allSelected);
        if (hint) hint.classList.toggle('hidden', allSelected);
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    _onSubmit() {
        if (this._submitted) return;
        this._submitted = true;

        this.gameContainer.querySelectorAll('input[type="radio"]').forEach(r => { r.disabled = true; });
        this.gameContainer.querySelectorAll('.cdf-radio-row').forEach(row => {
            row.style.cursor = 'default';
        });

        const btn = this.gameContainer.querySelector('#cdf-submit-btn');
        if (btn) {
            btn.disabled = true;
            btn.classList.remove('cdf-ready');
            btn.classList.add('cdf-done');
            btn.textContent = 'RECOMMENDATION SUBMITTED';
        }

        const outcomeNote = this.gameContainer.querySelector('#cdf-outcome-note');
        const outcomeText = this.gameContainer.querySelector('#cdf-outcome-text');
        const badge       = this.gameContainer.querySelector('#cdf-submitted-badge');
        const hint        = this.gameContainer.querySelector('#cdf-hint');
        if (hint)  hint.classList.add('hidden');
        if (badge) badge.classList.add('visible');

        if (outcomeNote && outcomeText) {
            const quoteSection = this._outcomeQuoteSection || this._sections[0]?.id;
            const quoteKey     = this._checked(quoteSection)?.value;
            const quote        = this._outcomeQuotes[quoteKey] || '';
            if (quote) {
                // The same author formatting as the rest of the form (entities, bare tags)
                outcomeText.innerHTML = authorHtml(quote);
                outcomeNote.classList.add('visible');
            }
        }

        this._completionActions.forEach(action => {
            if (action.value !== undefined) {
                this._setGlobalAndNotify(action.setVariable, action.value);
            } else if (action.fromSection) {
                const selected = this._checked(action.fromSection)?.value;
                const val = action.equalsValue !== undefined ? selected === action.equalsValue : selected;
                this._setGlobalAndNotify(action.setVariable, val);
            }
        });
    }

    // ── Global state ──────────────────────────────────────────────────────────

    _setGlobalAndNotify(name, value) {
        if (window.npcManager?.setGlobalVariable) {
            window.npcManager.setGlobalVariable(name, value);
            return;
        }
        const oldValue = window.gameState?.globalVariables?.[name];
        if (window.gameState?.globalVariables) window.gameState.globalVariables[name] = value;
        window.npcConversationStateManager?.broadcastGlobalVariableChange(name, value, null);
        window.eventDispatcher?.emit(`global_variable_changed:${name}`, { name, value, oldValue });
    }
}
