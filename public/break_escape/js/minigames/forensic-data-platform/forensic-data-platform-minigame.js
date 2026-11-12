import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

// The title is plain text (scenario or server data): escaped before it reaches HTML.
const escapeTitle = (value) => String(value ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

// Block content (labels, descriptions, bodies, cells, values) is rich text by design:
// the scenarios use <strong>, <p>, <br> and <code>, a style on <strong> and <p>, and
// HTML entities. Everything else is dropped: other tags are unwrapped to their text,
// script-like elements are removed whole, and every other attribute goes.
const RICH_TAGS = new Set(['STRONG', 'P', 'BR', 'CODE']);
const RICH_STYLE_TAGS = new Set(['STRONG', 'P']);
const RICH_DROP = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH',
    'NOSCRIPT', 'TEXTAREA', 'TITLE', 'XMP', 'NOEMBED', 'NOFRAMES', 'SELECT']);
// A plain declaration value: no url(), expression(), @import, escapes or markup.
const SAFE_STYLE = /^[\w\s#%.,()-]*$/;
const UNSAFE_STYLE = /url\s*\(|expression|@import|javascript:/i;
// Only text styling and spacing: nothing that positions, sizes or layers a block, so a
// scenario style cannot cover the game (position:fixed, z-index, width:100%).
const SAFE_STYLE_PROPS = /^(color|background-color|font-weight|font-style|font-size|text-decoration|text-align|(margin|padding)(-(top|right|bottom|left))?)$/;

// A style attribute value with only allow-listed properties and safe values kept, or ''.
export function cleanStyle(value) {
    return String(value ?? '').split(';').map((decl) => {
        const at = decl.indexOf(':');
        if (at < 0) return null;
        const prop = decl.slice(0, at).trim().toLowerCase();
        const val = decl.slice(at + 1).trim();
        if (!SAFE_STYLE_PROPS.test(prop) || !val || !SAFE_STYLE.test(val) || UNSAFE_STYLE.test(val)) return null;
        return `${prop}:${val}`;
    }).filter(Boolean).join(';');
}

// insideP: a <p> already holds this content, so a nested <p> is unwrapped (a <p> in a <p>
// re-parses into sibling paragraphs and an empty one).
function cleanRich(node, insideP = false) {
    for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) continue;                    // text
        if (child.nodeType !== 1) { child.remove(); continue; } // comments and the rest
        const tag = child.tagName.toUpperCase();
        if (RICH_DROP.has(tag)) { child.remove(); continue; }
        cleanRich(child, insideP || tag === 'P');
        if (!RICH_TAGS.has(tag) || (tag === 'P' && insideP)) { child.replaceWith(...child.childNodes); continue; }
        for (const attr of [...child.attributes]) {
            const style = attr.name === 'style' && RICH_STYLE_TAGS.has(tag) ? cleanStyle(attr.value) : '';
            if (style) child.setAttribute('style', style);
            else child.removeAttribute(attr.name);
        }
    }
}

export function sanitizeRich(value, { insideP = false } = {}) {
    // No DOM to parse with (a bare node test): fail closed, as plain text
    if (typeof document === 'undefined') return escapeTitle(value);
    const tpl = document.createElement('template');
    tpl.innerHTML = String(value ?? '');
    cleanRich(tpl.content, insideP);
    const box = document.createElement('div');
    box.appendChild(tpl.content);
    return box.innerHTML;
}

const rich = (value, opts) => sanitizeRich(displayDashes(value), opts);
const plain = (value) => escapeTitle(displayDashes(value));

/**
 * MG-02 — Forensic Data Platform
 *
 * Tab content comes from the scenario: `params.tabs` (the object's minigameData)
 * is an array of tabs, each `{ id, label, heading, blocks }`. A scenario may
 * instead name a built-in set with `params.tabSet` (a key into TAB_SETS below);
 * `tabs` wins when both are given. Each tab's `blocks` array of typed content
 * objects is rendered by generic functions, so no scenario-specific render
 * functions are needed.
 *
 * Block types: p, timeline, log-table, setpoint-table, document-excerpt, list, callout
 * Callout styles: evidence-gap, session-record, compliance-note
 * Conditional blocks: add `showIf: 'globalVarName'` to any block
 *
 * Params (one of tabs / tabSet is required):
 *   tabs             — array of tab objects supplied by the scenario
 *   tabSet           — key into TAB_SETS, used when `tabs` is absent
 *   title            — header left text
 *   caseRef          — header right text (case reference)
 *   reviewedVar      — global var written on first open
 *   confirmedVar     — global var written on causal chain confirm
 *   confirmGateTab   — tab id that must be visited before confirm is enabled
 *   confirmLabel     — confirm button text
 *   confirmHint      — hint shown while gate not met
 *   confirmReadyHint — hint shown when gate is met
 *   confirmSuccessText — text shown after confirming
 */

// ── Tab set registry ───────────────────────────────────────────────────────────
// Built-in tab sets, for a scenario that names one with `tabSet` instead of
// supplying `tabs`. sis03's Albion set (formerly `albion_sis03`) now lives in
// scenarios/sis03_cyber_insurance/scenario.json.erb, so the evidence on screen is
// edited with the scenario's other documents.
const TAB_SETS = {};

// ── Generic block renderers ────────────────────────────────────────────────────

function _renderTimeline(steps) {
    let n = 0;
    const items = steps.map(s => {
        const num = s.warn ? '!' : ++n;
        const cls = s.warn ? ' fdp-timeline-num-warn' : '';
        return `
<li class="fdp-timeline-step">
  <div class="fdp-timeline-num${cls}">${num}</div>
  <div class="fdp-timeline-body">
    <div class="fdp-timeline-label">${rich(s.label)}</div>
    <div class="fdp-timeline-desc">${rich(s.desc)}</div>
  </div>
</li>`;
    }).join('');
    return `<ul class="fdp-timeline">${items}</ul>`;
}

function _renderLogTable(block) {
    const headers = block.columns.map(c => `<th>${rich(c)}</th>`).join('');
    const rows = block.rows.map(r => {
        const rowCls = r.highlight ? ' class="fdp-row-highlight"' : '';
        const cells  = r.cells.map(c => {
            if (c && typeof c === 'object') return `<td class="${escapeTitle(c.class || '')}">${rich(c.html)}</td>`;
            return `<td>${rich(c)}</td>`;
        }).join('');
        return `<tr${rowCls}>${cells}</tr>`;
    }).join('');
    return `<table class="fdp-log-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

function _renderSetpointTable(block) {
    const rows = block.rows.map(r => `<tr><td>${rich(r.label)}</td><td>${rich(r.value)}</td></tr>`).join('');
    return `<table class="fdp-setpoint-table"><tbody>${rows}</tbody></table>`;
}

function _renderDocumentExcerpt(block) {
    return `<div class="fdp-doc-excerpt">${rich(block.body)}<div class="fdp-doc-source">${rich(block.source)}</div></div>`;
}

function _renderList(block) {
    const items = block.items.map(i => `<li>${rich(i)}</li>`).join('');
    return `<ul style="margin:6px 0 10px 18px; font-size:11px; color:#c9d1d9; line-height:1.7">${items}</ul>`;
}

function _renderCallout(block) {
    const CSS_CLASS = {
        'evidence-gap':    'fdp-evidence-gap',
        'session-record':  'fdp-session-record',
        'compliance-note': 'fdp-compliance-note',
    };
    const TITLE_CLASS = {
        'evidence-gap':   'fdp-evidence-gap-title',
        'session-record': 'fdp-session-record-title',
    };
    const cls       = CSS_CLASS[block.style] || 'fdp-evidence-gap';
    const titleCls  = TITLE_CLASS[block.style];
    const titleHtml = (block.title && titleCls) ? `<div class="${titleCls}">${rich(block.title)}</div>` : '';
    // style2 goes through the same property allow-list as a style inside the rich text
    const style2 = block.style2 ? cleanStyle(block.style2) : '';
    const extraStyle = style2 ? ` style="${escapeTitle(style2)}"` : '';
    return `<div class="${cls}"${extraStyle}>${titleHtml}${rich(block.body)}</div>`;
}

function _renderBlocks(blocks, globals) {
    return blocks.map(block => {
        if (block.showIf && !globals[block.showIf]) return '';
        switch (block.type) {
            case 'p':                return `<p>${rich(block.html, { insideP: true })}</p>`;
            case 'timeline':        return _renderTimeline(block.steps);
            case 'log-table':       return _renderLogTable(block);
            case 'setpoint-table':  return _renderSetpointTable(block);
            case 'document-excerpt': return _renderDocumentExcerpt(block);
            case 'list':            return _renderList(block);
            case 'callout':         return _renderCallout(block);
            default:                return '';
        }
    }).join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────

export class ForensicDataPlatformMinigame extends MinigameScene {
    constructor(container, params = {}) {
        super(container, {
            ...params,
            showCancel: true,
            cancelText: params.cancelText || 'Close Terminal'
        });
        this._tabsSeen  = new Set();
        this._confirmed = false;

        this._tabs = ForensicDataPlatformMinigame.resolveTabs(params);
    }

    // Scenario-supplied tabs (minigameData.tabs) first, then a built-in TAB_SETS entry.
    static resolveTabs(params = {}) {
        if (Array.isArray(params.tabs) && params.tabs.length > 0) return params.tabs;
        const tabSetKey = params.tabSet;
        if (tabSetKey && !TAB_SETS[tabSetKey]) {
            console.warn(`[FDP] Unknown tabSet "${tabSetKey}" and no tabs in minigameData: no tabs will render.`);
        }
        return tabSetKey ? (TAB_SETS[tabSetKey]?.tabs || []) : [];
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        this.container.classList.add('fdp-minigame-container');
        this.gameContainer.classList.add('fdp-game-container');
        this._renderLayout();
    }

    start() {
        super.start();
        this._resumeStateFromGlobals();
        const reviewedVar = this.params.reviewedVar || 'fdp_reviewed';
        if (!window.gameState?.globalVariables?.[reviewedVar]) {
            this._setGlobalAndNotify(reviewedVar, true);
        }
        if (this._tabs.length > 0) this._onTabClick(this._tabs[0].id);
    }

    _resumeStateFromGlobals() {
        const globals  = window.gameState?.globalVariables || {};
        const confirmedVar = this.params.confirmedVar || 'forensic_chain_verified';
        if (globals[confirmedVar] === true) {
            this._confirmed = true;
        }
    }

    // ── Layout ───────────────────────────────────────────────────────────────

    _renderLayout() {
        const title        = this.params.title        || 'Forensic Data Platform';
        const caseRef      = this.params.caseRef      || '';
        const confirmLabel = this.params.confirmLabel || 'CONFIRM CAUSAL CHAIN';
        const confirmHint  = this.params.confirmHint  || 'Review all evidence before confirming.';

        const tabButtons = this._tabs.map(t =>
            `<button class="fdp-tab" data-tab="${escapeTitle(t.id)}">${plain(t.label)}</button>`
        ).join('');

        this.gameContainer.innerHTML = `
<div class="fdp-wrap">
  <div class="fdp-header">
    <span class="fdp-title">${escapeTitle(displayDashes(title))}</span>
    <span class="fdp-case">${plain(caseRef)}</span>
  </div>
  <div class="fdp-tab-bar" id="fdp-tab-bar">
    ${tabButtons}
  </div>
  <div class="fdp-panel" id="fdp-panel"></div>
  <div class="fdp-footer">
    <button class="fdp-confirm-btn" id="fdp-confirm-btn" disabled>
      ${plain(confirmLabel)}
    </button>
    <div id="fdp-confirm-hint" class="fdp-confirm-hint">${plain(confirmHint)}</div>
  </div>
</div>`;

        this.gameContainer.querySelectorAll('.fdp-tab').forEach(btn => {
            this.addEventListener(btn, 'click', () => this._onTabClick(btn.dataset.tab));
        });
        this.addEventListener(this.gameContainer.querySelector('#fdp-confirm-btn'), 'click', () => this._onConfirm());
    }

    // ── Tab interaction ───────────────────────────────────────────────────────

    _onTabClick(tabId) {
        this.gameContainer.querySelectorAll('.fdp-tab').forEach(btn => {
            const isActive = btn.dataset.tab === tabId;
            btn.classList.toggle('fdp-tab-active', isActive);
            if (this._tabsSeen.has(btn.dataset.tab) && !isActive) {
                btn.classList.add('fdp-tab-seen');
            }
        });

        this._tabsSeen.add(tabId);
        const activeBtn = [...this.gameContainer.querySelectorAll('.fdp-tab')].find(b => b.dataset.tab === tabId);
        if (activeBtn) activeBtn.classList.add('fdp-tab-seen');

        this._renderTabContent(tabId);
        this._updateConfirmButton();
    }

    _updateConfirmButton() {
        if (this._confirmed) return;
        const btn  = this.gameContainer.querySelector('#fdp-confirm-btn');
        const hint = this.gameContainer.querySelector('#fdp-confirm-hint');
        if (!btn || !hint) return;

        const gateTab    = this.params.confirmGateTab   || this._tabs[this._tabs.length - 1]?.id;
        const confirmHint  = this.params.confirmHint      || 'Review all evidence before confirming.';
        const readyHint    = this.params.confirmReadyHint || 'All critical evidence reviewed. Confirm the causal chain.';

        if (this._tabsSeen.has(gateTab)) {
            btn.disabled     = false;
            hint.textContent = displayDashes(readyHint);
        } else {
            btn.disabled     = true;
            hint.textContent = displayDashes(confirmHint);
        }
    }

    _onConfirm() {
        if (this._confirmed) return;
        this._confirmed = true;

        const confirmedVar = this.params.confirmedVar       || 'forensic_chain_verified';
        const successText  = this.params.confirmSuccessText || '✓ Causal chain confirmed and logged.';
        const confirmLabel = this.params.confirmLabel       || 'CONFIRM CAUSAL CHAIN';

        const btn  = this.gameContainer.querySelector('#fdp-confirm-btn');
        const hint = this.gameContainer.querySelector('#fdp-confirm-hint');
        if (btn)  { btn.disabled = true; btn.textContent = displayDashes(`${confirmLabel} — CONFIRMED`); }
        if (hint) { hint.className = 'fdp-confirm-success'; hint.textContent = displayDashes(successText); }

        this._setGlobalAndNotify(confirmedVar, true);
        this._executeCompletionActions();
    }

    _executeCompletionActions() {
        const actions = this.params.completionActions;
        if (!Array.isArray(actions)) return;
        for (const action of actions) {
            if (action.type === 'set_global') {
                this._setGlobalAndNotify(action.key, action.value);
            } else if (action.type === 'complete_task') {
                window.objectivesManager?.completeTask(action.taskId);
            }
        }
    }

    // ── Tab content ───────────────────────────────────────────────────────────

    _renderTabContent(tabId) {
        const panel = this.gameContainer.querySelector('#fdp-panel');
        if (!panel) return;
        const tab = this._tabs.find(t => t.id === tabId);
        if (!tab) { panel.innerHTML = ''; return; }
        const globals = window.gameState?.globalVariables || {};
        const heading = tab.heading ? `<h3>${rich(tab.heading)}</h3>` : '';
        panel.innerHTML = heading + _renderBlocks(tab.blocks, globals);
    }

    // ── Global state ──────────────────────────────────────────────────────────

    _setGlobalAndNotify(name, value) {
        if (window.npcManager?.setGlobalVariable) {
            window.npcManager.setGlobalVariable(name, value);
            return;
        }
        const oldValue = window.gameState?.globalVariables?.[name];
        if (window.gameState?.globalVariables) {
            window.gameState.globalVariables[name] = value;
        }
        window.npcConversationStateManager?.broadcastGlobalVariableChange(name, value, null);
        window.eventDispatcher?.emit(`global_variable_changed:${name}`, { name, value, oldValue });
    }

    cleanup() {
        super.cleanup();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Starter helper
// ─────────────────────────────────────────────────────────────────────────────

export function startForensicDataPlatformMinigame(scenarioData = {}, extraParams = {}) {
    if (!window.MinigameFramework) {
        console.error('[FDP] MinigameFramework not available');
        return;
    }
    window.MinigameFramework.startMinigame('forensic-data-platform', null, {
        showCancel: true,
        ...scenarioData,
        ...extraParams,
        onComplete: (success, result) => {
            console.log('[FDP] Forensic Data Platform closed');
            if (extraParams.onComplete) extraParams.onComplete(success, result);
        }
    });
}
