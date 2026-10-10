import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

/**
 * MG-04 — Network Segmentation Map
 *
 * All content (zones, rules, auth personnel, consequence text) is driven by
 * scenarioData fields passed via params. The 4-slot topology layout
 * (external / enterprise / clinical / legacy) is architecturally fixed; only
 * the labels, device lists, and rule definitions vary per scenario.
 *
 * Required params:
 *   title              — header bar text
 *   severButtonLabel   — label for the SEVER action button
 *   severVar           — global variable written on sever (e.g. "network_isolated")
 *   rulesReviewedVar   — global variable written on first rule interaction
 *   auth               — { itsecVar, clinicalVar, resultVar, itsecLabel, clinicalLabel, claimRef }
 *   zones[]            — { slot, label, devices[] }  (slots: external / enterprise / clinical / legacy)
 *   rules[]            — { id, label, title, connectionType, fromSlot, toSlot, consequences[] }
 *   defaultConsequences[] — [ { section, items[] } ] shown when no rule is toggled
 *   severConsequences[] — [ { severity, text } ] shown after sever
 *   modalConsequences[] — strings for the clinical-consequences bullet list in the confirm modal
 *
 * Optional params:
 *   severLockedHint    — shown beside SEVER while it is locked (why, and how to unlock it)
 *   severReadyHint     — shown once the risk paths have been reviewed
 *
 * Each rule's dashed line, its ! marker and its label all open that rule, and the
 * line brightens on hover; unreviewed lines pulse until the first one is opened
 * (sis01 blind playtest S2: players could not tell the lines were clickable).
 */
export class NetworkSegmentationMapMinigame extends MinigameScene {
    constructor(container, params) {
        params = params || {};
        super(container, params);
        this.severed = false;
        this.rulesReviewedSet = false;
        this.ruleStates = {};
        (params.rules || []).forEach(r => { this.ruleStates[r.id] = false; });
        this._resizeHandler = null;
    }

    init() {
        const severVar = this.params.severVar || 'network_isolated';
        if (window.gameState?.globalVariables?.[severVar] === true) {
            this.severed = true;
        }

        const title = this.params.title || 'NETWORK SEGMENTATION MAP';
        const severLabel = this.params.severButtonLabel || 'SEVER LINK';

        this.container.innerHTML = `
            <button type="button" class="minigame-close-button" id="nsm-close">&times;</button>
            <div class="nsm-wrapper">
                <div class="nsm-header-bar">
                    <span class="nsm-title-text">${displayDashes(title)}</span>
                    <span class="nsm-status-badge">ACTIVE INCIDENT</span>
                </div>
                <div class="nsm-body">
                    <div class="nsm-topology-area" id="nsm-topology-area">
                        <div class="nsm-zones">
                            ${this._buildZonesHTML()}
                        </div>
                        <svg class="nsm-svg" id="nsm-svg" xmlns="http://www.w3.org/2000/svg"></svg>
                    </div>
                    <div class="nsm-consequence-panel">
                        <div class="nsm-panel-title">CONSEQUENCE ASSESSMENT</div>
                        <div class="nsm-consequence-body" id="nsm-consequence-body"></div>
                    </div>
                </div>
                <div class="nsm-action-bar">
                    <div class="nsm-legend">
                        <span class="nsm-legend-item">
                            <span class="nsm-legend-line nsm-legend-white"></span>PERIMETER FIREWALL
                        </span>
                        <span class="nsm-legend-item">
                            <span class="nsm-legend-line nsm-legend-amber"></span>INTERNAL FIREWALL
                        </span>
                        <span class="nsm-legend-item">
                            <span class="nsm-legend-line nsm-legend-orange nsm-legend-dashed"></span>LEGACY EXCEPTION RULES
                        </span>
                    </div>
                    <div class="nsm-sever-group">
                        <div class="nsm-sever-hint" id="nsm-sever-hint"></div>
                        <button type="button" class="nsm-sever-btn" id="nsm-sever-btn" disabled>
                            ${displayDashes(severLabel)}
                        </button>
                    </div>
                </div>
            </div>
            <div class="nsm-modal-overlay" id="nsm-modal-overlay">
                <div class="nsm-modal">
                    <div class="nsm-modal-icon">&#9888;</div>
                    <div class="nsm-modal-title">CONFIRM NETWORK ISOLATION</div>
                    <div class="nsm-modal-body">
                        ${this._buildModalBodyHTML()}
                    </div>
                    <div class="nsm-modal-actions">
                        <button type="button" class="nsm-modal-btn nsm-modal-no" id="nsm-modal-no">NO — CANCEL</button>
                        <button type="button" class="nsm-modal-btn nsm-modal-yes" id="nsm-modal-yes">YES — SEVER LINK</button>
                    </div>
                </div>
            </div>
        `;

        this._updateConsequencePanel();
        this._updateSeverHint();
    }

    /** Say why SEVER is locked and how to unlock it, or that it is ready. */
    _updateSeverHint() {
        const hintEl = this.container.querySelector('#nsm-sever-hint');
        const btn = this.container.querySelector('#nsm-sever-btn');
        if (!hintEl) return;
        let text = '';
        if (this.severed) {
            text = '';
        } else if (!this.rulesReviewedSet) {
            text = this.params.severLockedHint
                || 'SEVER is locked until you review the risk paths: click an orange dashed line or its ! marker.';
        } else {
            text = this.params.severReadyHint || '';
        }
        hintEl.textContent = displayDashes(text);
        hintEl.classList.toggle('nsm-sever-hint-locked', !this.severed && !this.rulesReviewedSet);
        if (btn) btn.title = text;
    }

    _buildZonesHTML() {
        return (this.params.zones || []).map(z => `
            <div class="nsm-zone nsm-zone-${z.slot}" id="nsm-zone-${z.slot}">
                <div class="nsm-zone-label">${displayDashes(z.label)}</div>
                <div class="nsm-zone-devices">
                    ${(z.devices || []).map(d => `<div class="nsm-device">${displayDashes(d)}</div>`).join('')}
                </div>
            </div>
        `).join('');
    }

    _buildModalBodyHTML() {
        const auth = this.params.auth || {};
        const consequences = (this.params.modalConsequences || [])
            .map(c => `<br/>• ${displayDashes(c)}`)
            .join('');
        return `
            This will disconnect all clinical zone systems from the enterprise network.
            <br/><br/>
            <strong>CLINICAL CONSEQUENCES:</strong>
            ${consequences}
            <br/><br/>
            <strong>DUAL AUTHORISATION STATUS:</strong>
            <br/><span id="nsm-auth-itsec">⬜ ${displayDashes(auth.itsecLabel || 'IT Security')} — pending</span>
            <br/><span id="nsm-auth-clinical">⬜ ${displayDashes(auth.clinicalLabel || 'Clinical Engineering')} — pending</span>
            <br/><br/>
            <span id="nsm-auth-warning"></span>
        `;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    start() {
        super.start();

        this.addEventListener(this.container.querySelector('#nsm-close'), 'click',
            (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.complete(false);
            });
        this.addEventListener(this.container.querySelector('#nsm-sever-btn'), 'click',
            (event) => {
                event.preventDefault();
                event.stopPropagation();
                this._openModal();
            });
        this.addEventListener(this.container.querySelector('#nsm-modal-yes'), 'click',
            (event) => {
                event.preventDefault();
                event.stopPropagation();
                this._confirmSever();
            });
        this.addEventListener(this.container.querySelector('#nsm-modal-no'), 'click',
            (event) => {
                event.preventDefault();
                event.stopPropagation();
                this._closeModal();
            });

        if (this.severed) {
            const btn = this.container.querySelector('#nsm-sever-btn');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'LINK ALREADY SEVERED';
                btn.classList.add('nsm-sever-btn-done');
            }
        }

        this._resizeHandler = () => this._drawConnections();
        window.addEventListener('resize', this._resizeHandler);

        requestAnimationFrame(() => this._drawConnections());
    }

    cleanup() {
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
        super.cleanup();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Modal
    // ─────────────────────────────────────────────────────────────────────────

    _openModal() {
        const auth = this.params.auth || {};
        const globals = window.gameState?.globalVariables || {};
        const itsecDone = globals[auth.itsecVar] === true;
        const clinicalDone = globals[auth.clinicalVar] === true;

        const itsecEl = this.container.querySelector('#nsm-auth-itsec');
        const clinicalEl = this.container.querySelector('#nsm-auth-clinical');
        const warnEl = this.container.querySelector('#nsm-auth-warning');

        if (itsecEl) itsecEl.innerHTML = itsecDone
            ? `✅ ${displayDashes(auth.itsecLabel || 'IT Security')} — authorised`
            : `⬜ ${displayDashes(auth.itsecLabel || 'IT Security')} — <strong>not received</strong>`;
        if (clinicalEl) clinicalEl.innerHTML = clinicalDone
            ? `✅ ${displayDashes(auth.clinicalLabel || 'Clinical Engineering')} — authorised`
            : `⬜ ${displayDashes(auth.clinicalLabel || 'Clinical Engineering')} — <strong>not received</strong>`;

        const claimRef = auth.claimRef || 'dual authorisation policy';
        if (warnEl) warnEl.innerHTML = (itsecDone && clinicalDone)
            ? `<strong style="color:#4caf50">Both authorisations confirmed. Proceeding will honour ${displayDashes(claimRef)}.</strong>`
            : `<strong style="color:#e57373">⚠ Proceeding without full authorisation violates ${displayDashes(claimRef)}.</strong>`;

        this.container.querySelector('#nsm-modal-overlay').classList.add('nsm-modal-visible');
        if (window.playUISound) window.playUISound('alert');
    }

    _closeModal() {
        this.container.querySelector('#nsm-modal-overlay').classList.remove('nsm-modal-visible');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEVER action
    // ─────────────────────────────────────────────────────────────────────────

    _confirmSever() {
        this.severed = true;
        this._closeModal();

        const auth = this.params.auth || {};
        const severVar = this.params.severVar || 'network_isolated';
        const globals = window.gameState?.globalVariables || {};
        const bothAuthorised = globals[auth.itsecVar] === true && globals[auth.clinicalVar] === true;

        const setGlobal = (name, value) => {
            if (window.npcManager && window.npcManager.setGlobalVariable) {
                window.npcManager.setGlobalVariable(name, value);
            } else if (window.gameState?.globalVariables) {
                window.gameState.globalVariables[name] = value;
                if (window.eventDispatcher) {
                    window.eventDispatcher.emit(`global_variable_changed:${name}`, {
                        name, value, oldValue: false
                    });
                }
            }
        };

        if (bothAuthorised && auth.resultVar) {
            setGlobal(auth.resultVar, true);
        }

        setGlobal(severVar, true);

        this._drawConnections();
        this._updateConsequencePanel();

        const btn = this.container.querySelector('#nsm-sever-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'LINK SEVERED';
            btn.classList.add('nsm-sever-btn-done');
        }

        this._updateSeverHint();
        if (window.playUISound) window.playUISound('confirm');

        setTimeout(() => this.complete(true), 2000);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Rule toggle interaction
    // ─────────────────────────────────────────────────────────────────────────

    _toggleRule(ruleId) {
        if (!this.rulesReviewedSet) {
            this.rulesReviewedSet = true;
            const rulesReviewedVar = this.params.rulesReviewedVar || 'network_rules_reviewed';
            if (window.npcManager && window.npcManager.setGlobalVariable) {
                window.npcManager.setGlobalVariable(rulesReviewedVar, true);
            } else if (window.gameState?.globalVariables) {
                window.gameState.globalVariables[rulesReviewedVar] = true;
                if (window.eventDispatcher) {
                    window.eventDispatcher.emit(`global_variable_changed:${rulesReviewedVar}`, {
                        name: rulesReviewedVar, value: true, oldValue: false
                    });
                }
            }
            const btn = this.container.querySelector('#nsm-sever-btn');
            if (btn && !this.severed) {
                btn.disabled = false;
            }
            this._updateSeverHint();
        }

        this.ruleStates[ruleId] = !this.ruleStates[ruleId];
        this._drawConnections();
        this._updateConsequencePanel();

        if (window.playUISound) window.playUISound('toggle');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Reactive consequence panel
    // ─────────────────────────────────────────────────────────────────────────

    _buildConsequenceItem(item) {
        const cls = `nsm-cons-item nsm-impact-${item.severity}${item.isAttackPath ? ' nsm-attack-path' : ''}`;
        const content = item.isAttackPath
            ? `<strong>ATTACK VECTOR:</strong> ${displayDashes(item.text)}`
            : displayDashes(item.text);
        return `<li class="${cls}">${content}</li>`;
    }

    _updateConsequencePanel() {
        const body = this.container.querySelector('#nsm-consequence-body');
        if (!body) return;

        if (this.severed) {
            const items = (this.params.severConsequences || [])
                .map(item => this._buildConsequenceItem(item))
                .join('');
            body.innerHTML = `
                <div class="nsm-cons-severed">NETWORK ISOLATED</div>
                <ul class="nsm-cons-list">${items}</ul>
            `;
            return;
        }

        let html = '';

        const rules = this.params.rules || [];
        const ruleCount = rules.length;
        const anyToggled = rules.some(r => this.ruleStates[r.id]);

        if (!this.rulesReviewedSet) {
            html += `
                <div class="nsm-cons-intro">
                    <span class="nsm-warn-text">${ruleCount} legacy exception rule${ruleCount !== 1 ? 's' : ''}</span>
                    currently bridge enterprise and clinical zones.
                    <br/><br/>
                    Click each orange dashed line on the map (or its ! marker) to see what it carries and what cutting it would cost. SEVER unlocks once you have opened one.
                </div>
            `;
        }

        rules.forEach(rule => {
            if (!this.ruleStates[rule.id]) return;
            const items = (rule.consequences || [])
                .map(item => this._buildConsequenceItem(item))
                .join('');
            html += `
                <div class="nsm-cons-rule">
                    <div class="nsm-cons-rule-title">▪ ${displayDashes(rule.title)}</div>
                    <ul class="nsm-cons-list">${items}</ul>
                </div>
            `;
        });

        if (!anyToggled) {
            (this.params.defaultConsequences || []).forEach(group => {
                html += `<div class="nsm-cons-section">${displayDashes(group.section)}</div>`;
                const items = (group.items || [])
                    .map(item => this._buildConsequenceItem(item))
                    .join('');
                html += `<ul class="nsm-cons-list">${items}</ul>`;
            });
        }

        body.innerHTML = html;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SVG connection drawing
    // ─────────────────────────────────────────────────────────────────────────

    _drawConnections() {
        const svg    = this.container.querySelector('#nsm-svg');
        const area   = this.container.querySelector('#nsm-topology-area');
        const extEl  = this.container.querySelector('#nsm-zone-external');
        const entEl  = this.container.querySelector('#nsm-zone-enterprise');
        const clinEl = this.container.querySelector('#nsm-zone-clinical');
        const legEl  = this.container.querySelector('#nsm-zone-legacy');

        if (!svg || !area || !extEl || !entEl || !clinEl || !legEl) return;

        const aRect = area.getBoundingClientRect();
        if (aRect.width === 0 || aRect.height === 0) return;

        const local = (el) => {
            const b = el.getBoundingClientRect();
            return {
                left:  b.left   - aRect.left,
                right: b.right  - aRect.left,
                top:   b.top    - aRect.top,
                bot:   b.bottom - aRect.top,
                midX: (b.left  + b.right)  / 2 - aRect.left,
                midY: (b.top   + b.bottom) / 2 - aRect.top,
            };
        };

        const slotEl = { external: extEl, enterprise: entEl, clinical: clinEl, legacy: legEl };
        const slot = {};
        Object.entries(slotEl).forEach(([k, el]) => { slot[k] = local(el); });

        const ext  = slot.external;
        const ent  = slot.enterprise;
        const clin = slot.clinical;
        const leg  = slot.legacy;
        const W    = aRect.width;
        const H    = aRect.height;

        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.setAttribute('width',   W);
        svg.setAttribute('height',  H);
        svg.innerHTML = '';

        const ns = 'http://www.w3.org/2000/svg';

        const pfMidX = (ext.right  + ent.left)  / 2;
        const ecMidX = (ent.right  + clin.left) / 2;
        const elMidX = (ent.right  + leg.left)  / 2;

        const centerY = ent.midY;

        // Partition rules by connection type
        const rules = this.params.rules || [];
        const directRules = rules.filter(r => r.connectionType === 'direct');
        const curvedRules  = rules.filter(r => r.connectionType === 'curved');

        const ifY = centerY - 32;

        if (!this.severed) {
            // ── Perimeter firewall: External → Enterprise (white, solid) ──────────
            this._svgLine(svg, ns, ext.right, centerY, ent.left, centerY, '#ffffff', 3, null);
            this._svgPadlock(svg, ns, pfMidX, centerY, '#ffffff');

            // ── Internal firewall: Enterprise → Clinical (amber, solid) ─────────
            this._svgLine(svg, ns, ent.right, ifY, clin.left, ifY, '#ffb300', 3, null);
            this._svgPadlock(svg, ns, ecMidX, ifY, '#ffb300');

            // ── Direct rules (enterprise → clinical) ─────────────────────────────
            directRules.forEach((rule, i) => {
                const fromEl = slotEl[rule.fromSlot];
                const toEl   = slotEl[rule.toSlot];
                if (!fromEl || !toEl) return;
                const from = slot[rule.fromSlot];
                const to   = slot[rule.toSlot];
                const midX = (from.right + to.left) / 2;
                const rY   = centerY + i * 32;
                const active = this.ruleStates[rule.id];

                const ruleLine = this._svgLine(svg, ns, from.right, rY, to.left, rY, '#ff7700', 2, '8 5', active ? 1 : 0.45);
                this._markRuleLine(ruleLine, active);
                this._wireRuleToggle(ruleLine, rule.id, rule.title);
                const ruleHit = this._svgLine(svg, ns, from.right, rY, to.left, rY, '#ffffff', 16, null, 0);
                this._wireRuleToggle(ruleHit, rule.id, rule.title, ruleLine);
                const warn = this._svgWarning(svg, ns, midX, rY);
                this._wireRuleToggle(warn, rule.id, rule.title, ruleLine);
                const lbl = this._svgRuleLabel(svg, ns, midX, rY + 16, rule.label, 13);
                this._wireRuleToggle(lbl, rule.id, rule.title, ruleLine);
                if (active) {
                    this._drawAttackPath(svg, ns, from.right, rY, to.left, rY);
                }
            });

            // ── Curved rules (enterprise → legacy) ───────────────────────────────
            curvedRules.forEach(rule => {
                const from = slot[rule.fromSlot];
                const to   = slot[rule.toSlot];
                if (!from || !to) return;
                const midX = (from.right + to.left) / 2;
                const legacyArcPeakY = Math.max(10, Math.min(from.top, clin.top, to.top) - 30);
                const legacyWarnY = legacyArcPeakY + 2;
                const active = this.ruleStates[rule.id];

                const d = `M ${from.midX} ${from.top} Q ${midX} ${legacyArcPeakY} ${to.midX} ${to.top}`;

                const rulePath = this._svgPath(svg, ns, d, '#ff7700', 2, '8 5', active ? 1 : 0.45);
                this._markRuleLine(rulePath, active);
                this._wireRuleToggle(rulePath, rule.id, rule.title);
                const ruleHit = this._svgPath(svg, ns, d, '#ffffff', 18, null, 0);
                this._wireRuleToggle(ruleHit, rule.id, rule.title, rulePath);
                const warn = this._svgWarning(svg, ns, midX, legacyWarnY);
                this._wireRuleToggle(warn, rule.id, rule.title, rulePath);
                const lbl = this._svgRuleLabel(svg, ns, midX, legacyWarnY + 22, rule.label);
                this._wireRuleToggle(lbl, rule.id, rule.title, rulePath);
                if (active) {
                    this._drawAttackPathCurve(svg, ns, d);
                }
                this._svgRuleLabel(svg, ns, midX, legacyArcPeakY - 10, 'NO SEGMENTATION');
            });

        } else {
            // ── Severed state: red X between enterprise and clinical ──────────────
            const sX = ecMidX;
            const sY = ent.midY;

            this._svgLine(svg, ns, ent.right,  sY, sX - 22, sY, '#cc2200', 2, '5 4');
            this._svgLine(svg, ns, sX + 22,    sY, clin.left, sY, '#cc2200', 2, '5 4');

            this._svgLine(svg, ns, sX - 14, sY - 14, sX + 14, sY + 14, '#ff2200', 4, null);
            this._svgLine(svg, ns, sX + 14, sY - 14, sX - 14, sY + 14, '#ff2200', 4, null);

            const t = document.createElementNS(ns, 'text');
            t.setAttribute('x',           sX);
            t.setAttribute('y',           sY + 32);
            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('fill',        '#ff2200');
            t.setAttribute('font-size',   '14');
            t.setAttribute('font-family', "'VT323', monospace");
            t.textContent = 'LINK SEVERED';
            svg.appendChild(t);
        }
    }

    _drawAttackPath(svg, ns, x1, y1, x2, y2) {
        const arrowY = (y1 + y2) / 2;

        const marker = document.createElementNS(ns, 'defs');
        const arrowMarker = document.createElementNS(ns, 'marker');
        arrowMarker.setAttribute('id', 'attack-arrow');
        arrowMarker.setAttribute('markerWidth', '10');
        arrowMarker.setAttribute('markerHeight', '10');
        arrowMarker.setAttribute('refX', '9');
        arrowMarker.setAttribute('refY', '3');
        arrowMarker.setAttribute('orient', 'auto');
        arrowMarker.setAttribute('markerUnits', 'strokeWidth');

        const poly = document.createElementNS(ns, 'polygon');
        poly.setAttribute('points', '0 0, 10 3, 0 6');
        poly.setAttribute('fill', '#ff2200');
        arrowMarker.appendChild(poly);
        marker.appendChild(arrowMarker);
        svg.appendChild(marker);

        const path = document.createElementNS(ns, 'line');
        path.setAttribute('x1', x1);
        path.setAttribute('y1', arrowY);
        path.setAttribute('x2', x2);
        path.setAttribute('y2', arrowY);
        path.setAttribute('stroke', '#ff2200');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('marker-end', 'url(#attack-arrow)');
        path.setAttribute('opacity', '0.7');
        path.setAttribute('pointer-events', 'none');
        svg.appendChild(path);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SVG primitive helpers
    // ─────────────────────────────────────────────────────────────────────────

    _svgLine(svg, ns, x1, y1, x2, y2, stroke, width, dash, opacity = 1) {
        const el = document.createElementNS(ns, 'line');
        el.setAttribute('x1', x1);
        el.setAttribute('y1', y1);
        el.setAttribute('x2', x2);
        el.setAttribute('y2', y2);
        el.setAttribute('stroke', stroke);
        el.setAttribute('stroke-width', width);
        if (dash) el.setAttribute('stroke-dasharray', dash);
        el.setAttribute('opacity', opacity);
        svg.appendChild(el);
        return el;
    }

    _svgPath(svg, ns, d, stroke, width, dash, opacity = 1) {
        const el = document.createElementNS(ns, 'path');
        el.setAttribute('d', d.replace(/\s+/g, ' ').trim());
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', stroke);
        el.setAttribute('stroke-width', width);
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('stroke-linejoin', 'round');
        if (dash) el.setAttribute('stroke-dasharray', dash);
        el.setAttribute('opacity', opacity);
        svg.appendChild(el);
        return el;
    }

    /** Visible rule line: class for CSS hover/pulse. Unreviewed lines pulse until the first is opened. */
    _markRuleLine(el, active) {
        if (!el) return;
        el.classList.add('nsm-rule-line');
        if (!this.rulesReviewedSet && !active && !this.severed) el.classList.add('nsm-rule-unreviewed');
    }

    /**
     * Make a rule's line, hit area, ! marker or label open the rule. `visibleLine` is the
     * dashed line to brighten while the pointer is over the element.
     */
    _wireRuleToggle(el, ruleId, label, visibleLine = null) {
        if (!el || this.severed) return;
        const isShape = el.tagName === 'line' || el.tagName === 'path';
        el.style.pointerEvents = isShape ? 'stroke' : 'all';
        el.style.cursor = 'pointer';
        el.setAttribute('aria-label', `${label} toggle`);
        el.setAttribute('role', 'button');
        this.addEventListener(el, 'click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this._toggleRule(ruleId);
        });
        const line = visibleLine || (isShape ? el : null);
        if (line) {
            this.addEventListener(el, 'mouseenter', () => line.classList.add('nsm-rule-hover'));
            this.addEventListener(el, 'mouseleave', () => line.classList.remove('nsm-rule-hover'));
        }
    }

    _drawAttackPathCurve(svg, ns, d) {
        const marker = document.createElementNS(ns, 'defs');
        const arrowMarker = document.createElementNS(ns, 'marker');
        arrowMarker.setAttribute('id', 'attack-arrow-curve');
        arrowMarker.setAttribute('markerWidth', '10');
        arrowMarker.setAttribute('markerHeight', '10');
        arrowMarker.setAttribute('refX', '9');
        arrowMarker.setAttribute('refY', '3');
        arrowMarker.setAttribute('orient', 'auto');
        arrowMarker.setAttribute('markerUnits', 'strokeWidth');

        const poly = document.createElementNS(ns, 'polygon');
        poly.setAttribute('points', '0 0, 10 3, 0 6');
        poly.setAttribute('fill', '#ff2200');
        arrowMarker.appendChild(poly);
        marker.appendChild(arrowMarker);
        svg.appendChild(marker);

        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', d.replace(/\s+/g, ' ').trim());
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#ff2200');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('marker-end', 'url(#attack-arrow-curve)');
        path.setAttribute('opacity', '0.75');
        path.setAttribute('pointer-events', 'none');
        svg.appendChild(path);
    }

    _svgRuleLabel(svg, ns, x, y, text, fontSize = 11) {
        const t = document.createElementNS(ns, 'text');
        t.setAttribute('x', x);
        t.setAttribute('y', y);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('fill', '#d0d6ff');
        t.setAttribute('font-size', fontSize);
        t.setAttribute('font-family', "'VT323', monospace");
        t.setAttribute('font-weight', 'bold');
        t.setAttribute('pointer-events', 'none');
        t.textContent = displayDashes(text);
        svg.appendChild(t);
        return t;
    }

    _svgPadlock(svg, ns, x, y, color) {
        const g = document.createElementNS(ns, 'g');

        const arc = document.createElementNS(ns, 'path');
        arc.setAttribute('d', `M ${x-6} ${y-2} Q ${x-6} ${y-14} ${x} ${y-14} Q ${x+6} ${y-14} ${x+6} ${y-2}`);
        arc.setAttribute('stroke', color);
        arc.setAttribute('stroke-width', '2.5');
        arc.setAttribute('fill', 'none');
        g.appendChild(arc);

        const body = document.createElementNS(ns, 'rect');
        body.setAttribute('x', x - 8);
        body.setAttribute('y', y - 2);
        body.setAttribute('width',  '16');
        body.setAttribute('height', '12');
        body.setAttribute('fill',   '#0d0d1a');
        body.setAttribute('stroke', color);
        body.setAttribute('stroke-width', '2');
        g.appendChild(body);

        const dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y + 4);
        dot.setAttribute('r',  '2.5');
        dot.setAttribute('fill', color);
        g.appendChild(dot);

        g.setAttribute('pointer-events', 'none');
        svg.appendChild(g);
    }

    _svgWarning(svg, ns, x, y) {
        const g = document.createElementNS(ns, 'g');

        const tri = document.createElementNS(ns, 'polygon');
        tri.setAttribute('points', `${x},${y-9} ${x-8},${y+5} ${x+8},${y+5}`);
        tri.setAttribute('fill',   '#1a0a00');
        tri.setAttribute('stroke', '#ff7700');
        tri.setAttribute('stroke-width', '1.5');
        g.appendChild(tri);

        const t = document.createElementNS(ns, 'text');
        t.setAttribute('x',           x);
        t.setAttribute('y',           y + 4);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('fill',        '#ff7700');
        t.setAttribute('font-size',   '9');
        t.setAttribute('font-family', 'monospace');
        t.setAttribute('font-weight', 'bold');
        t.textContent = '!';
        g.appendChild(t);

        g.setAttribute('pointer-events', 'none');
        svg.appendChild(g);
        return g;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Starter helper
// ─────────────────────────────────────────────────────────────────────────────

export function startNetworkSegmentationMapMinigame(scenarioData = {}, extraParams = {}) {
    if (!window.MinigameFramework) {
        console.error('[NSM] MinigameFramework not available');
        return;
    }
    window.MinigameFramework.startMinigame('network-segmentation-map', null, {
        showCancel: false,
        ...scenarioData,
        ...extraParams,
        onComplete: (success, result) => {
            console.log('[NSM] Network segmentation map completed, severed:', success);
            if (extraParams.onComplete) extraParams.onComplete(success, result);
        }
    });
}
