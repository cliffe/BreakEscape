import { MinigameScene } from '../framework/base-minigame.js';
import { escapeHtml } from '../../utils/escape-html.js';
// Author text keeps entities and bare <strong> <em> <b> <i> <br> (see utils/author-html.js).
import { authorHtml } from '../../utils/author-html.js';

/**
 * NCSC Brief Minigame
 *
 * Fully scenario-driven. All content comes from scenarioData via params.lockable.
 *
 * Required scenarioData fields:
 *   gateVar            — global var that must be truthy to allow opening
 *   reviewedVar        — global var set to true when the brief is opened
 *   caseRef            — case reference shown on the envelope
 *
 * Optional scenarioData fields:
 *   sealedMessage      — text shown in sealed state
 *   openableStatusBadge — badge text when openable (after ✓)
 *   openableReadyMessage — body text shown when openable
 *   briefTitle         — heading inside the opened brief
 *   briefMeta          — ref/addressee/date line (text: entities and <strong> <em> <br> only)
 *   sections[]         — typed content blocks (see _renderSection)
 *
 * Section types:
 *   { type: 'section', title, confidence: { text, cssClass }, body, bullets[], note: { title, body } }
 *   { type: 'legal-gap', title, paragraphs[] }
 *   { type: 'coverage-note', title, paragraphs[] }
 */

export class NcscBriefMinigame extends MinigameScene {
    // Draws in the shared console window (UI decision X8): title bar and X come from there
    static consoleWindow = true;

    constructor(container, params = {}) {
        const sd = params.lockable?.scenarioData || {};
        const md = sd.minigameData || {};
        super(container, {
            ...params,
            title:      sd.title      || 'NCSC Attribution Brief'
        });
        this._gateVar         = sd.gateVar             || 'warranty_checklist_complete';
        this._reviewedVar     = md.reviewedVar          || 'ncsc_brief_reviewed';
        this._caseRef         = md.caseRef              || 'NCSC Attribution Brief';
        this._sealedMessage   = sd.sealedMessage        || 'Complete the required assessment before accessing this document.';
        this._openableBadge   = md.openableStatusBadge  || 'AUTHORISED';
        this._openableMessage = sd.openableReadyMessage || 'You are authorised to open this brief.';
        this._briefTitle      = md.briefTitle           || 'NCSC Technical Attribution Assessment';
        this._briefMeta       = md.briefMeta            || '';
        this._sections        = md.sections             || [];
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        this.container.classList.add('ncsc-minigame-container');
        this.gameContainer.classList.add('ncsc-game-container');
        this._renderLayout();
    }

    start() {
        super.start();
        const globals = window.gameState?.globalVariables || {};
        if (globals[this._reviewedVar]) {
            this._renderContent();
        } else if (globals[this._gateVar]) {
            this._renderOpenable();
        } else {
            this._renderSealed();
        }
    }

    // ── Outer shell ──────────────────────────────────────────────────────────

    _renderLayout() {
        this.gameContainer.innerHTML = `
<div class="ncsc-wrap">
  <div class="ncsc-tlp-bar">TLP:AMBER &mdash; PRIVILEGED AND CONFIDENTIAL &mdash; ADDRESSEE ONLY</div>
  <div class="ncsc-body pixel-scroll" id="ncsc-body"></div>
</div>`;
    }

    _body() {
        return this.gameContainer.querySelector('#ncsc-body');
    }

    // ── Sealed state ─────────────────────────────────────────────────────────

    _renderSealed() {
        const el = this._body();
        if (!el) return;
        el.innerHTML = `
<div class="ncsc-envelope-panel">
  <img class="ncsc-envelope-icon" src="/break_escape/assets/icons/mail-new.png" alt="" width="64" height="64">
  <div class="ncsc-envelope-ref">${authorHtml(this._caseRef)}</div>
  <div class="ncsc-status-badge ncsc-status-locked"><img class="ncsc-badge-icon" src="/break_escape/assets/icons/npc-lock.png" alt="" width="16" height="16"> SEALED &mdash; AUTHORISATION REQUIRED</div>
  <div class="ncsc-sealed-message">${authorHtml(this._sealedMessage)}</div>
</div>`;
    }

    // ── Openable state ───────────────────────────────────────────────────────

    _renderOpenable() {
        const el = this._body();
        if (!el) return;
        el.innerHTML = `
<div class="ncsc-envelope-panel">
  <img class="ncsc-envelope-icon" src="/break_escape/assets/icons/mail-new.png" alt="" width="64" height="64">
  <div class="ncsc-envelope-ref">${authorHtml(this._caseRef)}</div>
  <div class="ncsc-status-badge ncsc-status-ready"><img class="ncsc-badge-icon" src="/break_escape/assets/icons/mark-tick.png" alt="" width="16" height="16"> ${authorHtml(this._openableBadge)}</div>
  <div class="ncsc-sealed-message ncsc-ready-message">${authorHtml(this._openableMessage)}</div>
  <button class="ncsc-open-btn" id="ncsc-open-btn">BREAK SEAL &mdash; OPEN BRIEF</button>
</div>`;

        const btn = this.gameContainer.querySelector('#ncsc-open-btn');
        if (btn) this.addEventListener(btn, 'click', () => this._onOpen());
    }

    // ── Open action ──────────────────────────────────────────────────────────

    _onOpen() {
        this._setGlobalAndNotify(this._reviewedVar, true);
        this._renderContent();
    }

    // ── Full brief content ───────────────────────────────────────────────────

    _renderContent() {
        const el = this._body();
        if (!el) return;
        const meta = this._briefMeta
            ? `<div class="ncsc-brief-meta">${authorHtml(this._briefMeta)}</div>`
            : '';
        el.innerHTML = `
<div class="ncsc-brief-content">
  <div class="ncsc-brief-header">
    <div class="ncsc-brief-title">${authorHtml(this._briefTitle)}</div>
    ${meta}
  </div>
  ${this._sections.map(s => this._renderSection(s)).join('\n')}
</div>`;
    }

    // ── Section renderers ────────────────────────────────────────────────────

    _renderSection(s) {
        switch (s.type) {
            case 'section':      return this._renderStandardSection(s);
            case 'legal-gap':    return this._renderLegalGap(s);
            case 'coverage-note':return this._renderCoverageNote(s);
            default:             return '';
        }
    }

    _renderStandardSection(s) {
        const confidence = s.confidence
            ? `<p>Attribution confidence: <span class="ncsc-badge ${escapeHtml(s.confidence.cssClass)}">${authorHtml(s.confidence.text)}</span></p>`
            : '';
        const body = s.body ? `<p>${authorHtml(s.body)}</p>` : '';
        const bulletsIntro = s.bullets?.length ? `<p><span class="mg-section-label">Basis for attribution:</span></p>` : '';
        const bullets = s.bullets?.length
            ? `<ul class="ncsc-list">${s.bullets.map(b => `<li>${authorHtml(b)}</li>`).join('')}</ul>`
            : '';
        const note = s.note
            ? `<div class="ncsc-note"><div class="ncsc-note-title">${authorHtml(s.note.title)}</div><p>${authorHtml(s.note.body)}</p></div>`
            : '';
        return `
  <div class="ncsc-section">
    <div class="ncsc-section-title">${authorHtml(s.title)}</div>
    ${confidence}${body}${bulletsIntro}${bullets}${note}
  </div>`;
    }

    _renderLegalGap(s) {
        const paras = (s.paragraphs || []).map(p => `<p>${authorHtml(p)}</p>`).join('');
        return `
  <div class="ncsc-legal-gap">
    <div class="ncsc-legal-gap-title">${authorHtml(s.title)}</div>
    ${paras}
  </div>`;
    }

    _renderCoverageNote(s) {
        const paras = (s.paragraphs || []).map(p => `<p>${authorHtml(p)}</p>`).join('');
        return `
  <div class="ncsc-coverage-note">
    <div class="ncsc-coverage-note-title">${authorHtml(s.title)}</div>
    ${paras}
  </div>`;
    }

    // ── Global state ─────────────────────────────────────────────────────────

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

    cleanup() {
        super.cleanup();
    }
}
