import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

/**
 * MG-06 — Network Architecture Diagram (Purdue Model)
 *
 * All topology data (nodes, zones, lines, attack paths, external orgs) is driven
 * by scenarioData fields passed via params. The SVG renderer and interaction model
 * are scenario-independent.
 *
 * Required params:
 *   title          — header text
 *   reviewedVar    — global variable written on first open
 *   viewBox        — SVG viewBox string (default: "0 0 900 572")
 *   zones[]        — { id, label, y, h, fill, stroke, nodeClass, x?, width? }
 *                    nodeClass: "it" | "ot" | "safe"
 *                    x defaults to 8, width defaults to 780
 *   nodes[]        — { id, label, sublabel?, warn?, zone, x, y, w, h, paths[], desc, vuln }
 *                    zone: matches a zone id; paths: array of attackPath ids
 *   lines[]        — { from, to, type, paths[], label? }
 *                    type: "normal" | "boundary" | "legacy" | "hardwired"
 *   attackPaths[]  — { id, label, desc, claim, nodes[] }
 *   externalOrgs[] — { id, label, label2?, x, y, w, h, nodes[] }
 *                    nodes follow the same shape as main nodes but without zone
 */
export class NetworkArchitectureMinigame extends MinigameScene {
    constructor(container, params = {}) {
        super(container, {
            ...params,
            title: 'Network Architecture',
            showCancel: true,
            cancelText: 'Close Diagram'
        });
        this._firstOpen  = false;
        this._activeNode = null;
        this._activePaths = new Set();
        this._svgEl = null;
        this._pathMap = {};
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        this.container.classList.add('nad-minigame-container');
        this.gameContainer.classList.add('nad-game-container');

        (this.params.attackPaths || []).forEach(p => { this._pathMap[p.id] = p; });

        this.renderLayout();
    }

    start() {
        super.start();
        const reviewedVar = this.params.reviewedVar || 'network_architecture_reviewed';
        const alreadySeen = window.gameState?.globalVariables?.[reviewedVar];
        if (!alreadySeen) {
            this._firstOpen = true;
            this.setGlobalAndNotify(reviewedVar, true);
        }
    }

    // ── Layout ───────────────────────────────────────────────────────────────────

    renderLayout() {
        const title = this.params.title || 'NETWORK ARCHITECTURE (PURDUE MODEL)';
        this.gameContainer.innerHTML = `
<div class="nad-wrap">
  <div class="nad-header">
    <div class="nad-title">${displayDashes(title)}</div>
    <div class="nad-legend">
      <span class="nad-leg-item"><span class="nad-leg-line nad-leg-normal"></span>Intended path</span>
      <span class="nad-leg-item"><span class="nad-leg-line nad-leg-boundary"></span>IT/OT boundary</span>
      <span class="nad-leg-item"><span class="nad-leg-line nad-leg-legacy"></span>Legacy exception ⚠</span>
      <span class="nad-leg-item"><span class="nad-leg-line nad-leg-hardwired"></span>Hardwired interlock</span>
      <span class="nad-leg-item"><span class="nad-leg-line nad-leg-attack"></span>Attack path</span>
    </div>
  </div>
  <div class="nad-body">
    <div class="nad-svg-wrap">
      ${this._buildSVG()}
    </div>
    <div class="nad-detail" id="nad-detail">
      <div class="nad-detail-hint">Click any system node to see details and attack paths</div>
    </div>
  </div>
</div>`;

        this._svgEl = this.gameContainer.querySelector('.nad-svg');
        this._attachNodeListeners();
    }

    _buildSVG() {
        const nodes       = this.params.nodes || [];
        const externalOrgs = this.params.externalOrgs || [];
        const zones       = this.params.zones || [];
        const lines       = this.params.lines || [];
        const viewBox     = this.params.viewBox || '0 0 900 572';

        const zoneMap = {};
        zones.forEach(z => { zoneMap[z.id] = z; });

        const allNodes = this._allNodes();
        const nodeMap  = Object.fromEntries(allNodes.map(n => [n.id, n]));

        const cx = n => n.x + n.w / 2;
        const cy = n => n.y + n.h / 2;

        let linesSvg   = '';
        let attackLines = '';

        lines.forEach(ln => {
            const a = nodeMap[ln.from];
            const b = nodeMap[ln.to];
            if (!a || !b) return;

            const cls = ln.type === 'legacy'    ? 'nad-line-legacy'    :
                        ln.type === 'boundary'  ? 'nad-line-boundary'  :
                        ln.type === 'hardwired' ? 'nad-line-hardwired' :
                                                  'nad-line-normal';
            const pathAttr = ln.paths?.length ? `data-paths="${ln.paths.join(',')}"` : '';
            const dashAttr = ln.type === 'legacy' ? 'stroke-dasharray="7 4"' : '';

            linesSvg += `<line class="nad-line ${cls}" ${pathAttr} x1="${cx(a)}" y1="${cy(a)}" x2="${cx(b)}" y2="${cy(b)}" ${dashAttr}/>`;

            if (ln.paths?.length) {
                attackLines += `<line class="nad-line-attack" data-paths="${ln.paths.join(',')}" x1="${cx(a)}" y1="${cy(a)}" x2="${cx(b)}" y2="${cy(b)}"/>`;
            }

            if (ln.label) {
                const mx = (cx(a) + cx(b)) / 2;
                const my = (cy(a) + cy(b)) / 2 - 5;
                linesSvg += `<text class="nad-line-label" x="${mx}" y="${my}">${displayDashes(ln.label)}</text>`;
            }
        });

        let zonesSvg = '';
        zones.forEach(z => {
            const zx = z.x !== undefined ? z.x : 8;
            const zw = z.width !== undefined ? z.width : 780;
            zonesSvg += `<rect class="nad-zone" x="${zx}" y="${z.y}" width="${zw}" height="${z.h}" fill="${z.fill}" stroke="${z.stroke}" stroke-width="1"/>`;
            zonesSvg += `<text class="nad-zone-label" x="${zx + 6}" y="${z.y + 11}">${displayDashes(z.label)}</text>`;
        });

        externalOrgs.forEach(org => {
            zonesSvg += `<rect class="nad-zone" x="${org.x}" y="${org.y}" width="${org.w}" height="${org.h}" fill="#0d1a0d" stroke="#14532d" stroke-width="1"/>`;
            zonesSvg += `<text class="nad-zone-label" x="${org.x + 6}" y="${org.y + 11}">${displayDashes(org.label)}</text>`;
            if (org.label2) {
                zonesSvg += `<text class="nad-zone-label" x="${org.x + 6}" y="${org.y + 22}">${displayDashes(org.label2)}</text>`;
            }
        });

        let nodesSvg = '';
        allNodes.forEach(n => {
            const zone = zoneMap[n.zone];
            const nodeClass = n.nodeClass || zone?.nodeClass || 'ot';
            const zoneCls = nodeClass === 'safe' ? 'nad-node-safe' :
                            nodeClass === 'it'   ? 'nad-node-it'   : 'nad-node-ot';
            const warnBadge = n.warn ? `<text class="nad-node-warn" x="${n.x + n.w - 6}" y="${n.y + 10}">⚠</text>` : '';

            nodesSvg += `
<g class="nad-node ${zoneCls}" id="nad-${n.id}" data-id="${n.id}" style="cursor:pointer" role="button" tabindex="0">
  <rect class="nad-node-rect" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="2"/>
  <text class="nad-node-label" x="${n.x + n.w / 2}" y="${n.y + (n.sublabel ? 14 : 20)}">${displayDashes(n.label)}</text>
  ${n.sublabel ? `<text class="nad-node-sub" x="${n.x + n.w / 2}" y="${n.y + 26}">${displayDashes(n.sublabel)}</text>` : ''}
  ${warnBadge}
</g>`;
        });

        return `
<svg class="nad-svg" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="nad-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#ef4444"/>
    </marker>
  </defs>
  ${zonesSvg}
  <g class="nad-lines">${linesSvg}</g>
  <g class="nad-attack-lines">${attackLines}</g>
  <g class="nad-nodes">${nodesSvg}</g>
</svg>`;
    }

    // ── Interaction ──────────────────────────────────────────────────────────────

    _attachNodeListeners() {
        this._allNodes().forEach(n => {
            const el = this.gameContainer.querySelector(`#nad-${n.id}`);
            if (!el) return;
            this.addEventListener(el, 'click', () => this._onNodeClick(n.id));
            this.addEventListener(el, 'keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') this._onNodeClick(n.id);
            });
        });
    }

    _onNodeClick(nodeId) {
        const node = this._allNodes().find(n => n.id === nodeId);
        if (!node) return;

        if (this._activeNode) {
            const prev = this.gameContainer.querySelector(`#nad-${this._activeNode}`);
            if (prev) prev.classList.remove('nad-node-selected');
        }

        this._activeNode = nodeId;
        const el = this.gameContainer.querySelector(`#nad-${nodeId}`);
        if (el) el.classList.add('nad-node-selected');

        this._activePaths = new Set(node.paths || []);
        this._updateAttackLines();
        this._renderDetail(node);
    }

    _updateAttackLines() {
        const attackLineEls = this.gameContainer.querySelectorAll('.nad-line-attack');
        attackLineEls.forEach(l => {
            const linePaths = (l.dataset.paths || '').split(',');
            l.classList.toggle('nad-path-active', linePaths.some(p => this._activePaths.has(p)));
        });

        const baseLines = this.gameContainer.querySelectorAll('.nad-line[data-paths]');
        baseLines.forEach(l => {
            const linePaths = (l.dataset.paths || '').split(',');
            l.classList.toggle('nad-line-in-path', linePaths.some(p => this._activePaths.has(p)));
        });

        const allNodes = this._allNodes();
        this.gameContainer.querySelectorAll('.nad-node').forEach(el => {
            const nid = el.dataset.id;
            const n = allNodes.find(x => x.id === nid);
            if (!n) return;
            const inAnyActivePath = (n.paths || []).some(p => this._activePaths.has(p));
            const isSelected = nid === this._activeNode;
            el.classList.toggle('nad-node-dim', !inAnyActivePath && !isSelected && this._activePaths.size > 0);
        });
    }

    _renderDetail(node) {
        const detail = this.gameContainer.querySelector('#nad-detail');
        if (!detail) return;

        const pathEntries = (node.paths || [])
            .map(pid => this._pathMap[pid])
            .filter(Boolean)
            .map(p => `<div class="nad-detail-path"><span class="nad-path-label">${displayDashes(p.label)}</span> <span class="nad-path-claim">[${displayDashes(p.claim)}]</span><div class="nad-path-desc">${displayDashes(p.desc)}</div></div>`)
            .join('');

        const vulnHtml = node.vuln
            ? `<div class="nad-detail-vuln"><span class="nad-detail-vuln-badge">⚠ VULNERABILITY</span><div class="nad-detail-vuln-text">${displayDashes(node.vuln)}</div></div>`
            : '';

        detail.innerHTML = `
<div class="nad-detail-name">${displayDashes(node.label)}${node.sublabel ? ' — ' + displayDashes(node.sublabel) : ''}</div>
<div class="nad-detail-desc">${displayDashes(node.desc)}</div>
${vulnHtml}
${pathEntries
    ? '<div class="nad-detail-paths-title">ATTACK PATHS THROUGH THIS NODE:</div>' + pathEntries
    : '<div class="nad-detail-no-paths">No attack paths through this node.</div>'}`;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────────

    _allNodes() {
        const main = this.params.nodes || [];
        const ext  = (this.params.externalOrgs || []).flatMap(o => o.nodes || []);
        return [...main, ...ext];
    }

    // ── Global state ──────────────────────────────────────────────────────────────

    setGlobalAndNotify(name, value) {
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

export function startNetworkArchitectureMinigame(scenarioData = {}, extraParams = {}) {
    if (!window.MinigameFramework) {
        console.error('[NAD] MinigameFramework not available');
        return;
    }
    window.MinigameFramework.startMinigame('network-architecture', null, {
        showCancel: true,
        ...scenarioData,
        ...extraParams,
        onComplete: (success, result) => {
            console.log('[NAD] Network architecture diagram closed');
            if (extraParams.onComplete) extraParams.onComplete(success, result);
        }
    });
}
