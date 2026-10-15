import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Visible text: escaped, with " -- " shown as an en dash (display only; ids use escapeHtml).
function escapeText(value) {
    return escapeHtml(displayDashes(String(value ?? '')));
}

function setGlobalAndNotify(varName, value) {
    if (!window.gameState) window.gameState = {};
    if (!window.gameState.globalVariables) window.gameState.globalVariables = {};
    const oldValue = window.gameState.globalVariables[varName];
    if (oldValue === value) return;
    window.gameState.globalVariables[varName] = value;
    if (window.gameScenario?.globalVariables) {
        window.gameScenario.globalVariables[varName] = value;
    }
    if (window.npcConversationStateManager) {
        window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
    }
    if (window.eventDispatcher) {
        window.eventDispatcher.emit(`global_variable_changed:${varName}`, { name: varName, value, oldValue });
    }
}

function readGlobal(varName) {
    return window.gameState?.globalVariables?.[varName];
}

function truncAddr(str) {
    if (!str || str.length <= 13) return str;
    return `${str.slice(0, 6)}...${str.slice(-4)}`;
}
function truncHash(str) {
    if (!str || str.length <= 16) return str;
    return `${str.slice(0, 10)}...`;
}

export class BlockchainExplorerMinigame extends MinigameScene {
    constructor(container, params = {}) {
        super(container, {
            ...params,
            showCancel: false
        });

        const sd = params.lockable?.scenarioData || {};
        const md = sd.minigameData || {};

        this._title          = params.title          || md.title          || 'Chain Tracer';
        this._caseRef        = params.caseRef        || md.caseRef        || '';
        this._currency       = params.currency       || md.currency       || 'BTC';
        this._seedTx         = params.seedTransaction     || md.seedTransaction;
        this._mixerThreshold = params.mixerFanOutThreshold ?? md.mixerFanOutThreshold ?? 4;
        this._targetAddress  = params.targetWalletAddress  || md.targetWalletAddress;
        this._stateWrites    = params.stateWrites    || md.stateWrites    || {};
        this._requiresMixer  = !!this._stateWrites.onMixerFlagged;

        this._wallets      = Object.fromEntries((md.wallets      || []).map(w => [w.address, w]));
        this._transactions = Object.fromEntries((md.transactions || []).map(t => [t.hash,    t]));

        this._seedTxOutputAddresses = new Set(
            (this._transactions[this._seedTx]?.outputs || []).map(o => o.wallet)
        );

        this._navHistory  = [];
        this._currentView = null;
        this._hasHopped   = false;

        this._mixerFlagged       = false;
        this._destinationFlagged = false;

        // Cache graph layout so it doesn't recompute on every render
        this._graphLayout = null;
    }

    init() {
        super.init();
        this.container.classList.add('bce-container');
        this.gameContainer.classList.add('bce-game-container');
        if (this.headerElement) this.headerElement.style.display = 'none';

        if (this._stateWrites.onMixerFlagged && readGlobal(this._stateWrites.onMixerFlagged)) {
            this._mixerFlagged = true;
        }
        if (this._stateWrites.onDestinationFlagged && readGlobal(this._stateWrites.onDestinationFlagged)) {
            this._destinationFlagged = true;
        }
        if (this._destinationFlagged) this._hasHopped = true;

        if (this._targetAddress) {
            const tw = this._wallets[this._targetAddress];
            if (tw && !tw.threatIntelMatch) {
                console.warn(`[BlockchainExplorer] Target wallet "${this._targetAddress}" has no threatIntelMatch — players have no logical basis to identify it.`);
            }
        }

        if (this._seedTx && this._transactions[this._seedTx]) {
            this._navigate('tx', this._seedTx);
        } else {
            this.render();
        }
    }

    start() {
        super.start();
    }

    // ── Navigation ─────────────────────────────────────────────────────────────

    _navigate(type, id) {
        const alreadyInHistory = this._navHistory.some(n => n.type === type && n.id === id);
        if (!alreadyInHistory) {
            this._navHistory.push({ type, id });
        }
        this._currentView = { type, id };

        if (type === 'wallet' && !this._seedTxOutputAddresses.has(id)) {
            this._hasHopped = true;
        }

        this.render();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    _renderAmount(n) {
        const num = typeof n === 'number' ? n : parseFloat(n) || 0;
        return `${num.toFixed(4)} ${escapeText(this._currency)}`;
    }

    _walletTxs(address) {
        return Object.values(this._transactions).filter(tx =>
            tx.inputs.some(i => i.wallet === address) ||
            tx.outputs.some(o => o.wallet === address)
        );
    }

    _maxSenderOutputCount(address) {
        let max = 0;
        for (const tx of Object.values(this._transactions)) {
            if (tx.inputs.some(i => i.wallet === address)) {
                max = Math.max(max, tx.outputs.length);
            }
        }
        return max;
    }

    _walletLabel(address) {
        const w = this._wallets[address];
        return w ? escapeText(w.displayName || 'Unknown Wallet') : 'Unknown Wallet';
    }

    _canFlagDestination() {
        return this._hasHopped;
    }

    // ── Flagging ───────────────────────────────────────────────────────────────

    _flagMixer() {
        if (this._mixerFlagged) return;
        this._mixerFlagged = true;
        if (this._stateWrites.onMixerFlagged) {
            setGlobalAndNotify(this._stateWrites.onMixerFlagged, true);
        }
        this.render();
        this._checkCompletion();
    }

    _flagDestination() {
        if (this._destinationFlagged) return;
        this._destinationFlagged = true;
        if (this._stateWrites.onDestinationFlagged) {
            setGlobalAndNotify(this._stateWrites.onDestinationFlagged, true);
        }
        this.render();
        this._checkCompletion();
    }

    _checkCompletion() {
        if (this._allFlagsSet()) {
            this._submit();
        }
    }

    _allFlagsSet() {
        return (!this._requiresMixer || this._mixerFlagged) && this._destinationFlagged;
    }

    _submit() {
        if (!this._allFlagsSet()) return;
        this.showSuccess('Findings submitted. Investigation complete.', true, 3000);
    }

    // ── Graph layout ───────────────────────────────────────────────────────────

    _buildGraphLayout() {
        if (this._graphLayout) return this._graphLayout;

        // Map<id, { id, type, depth, row }>
        const nodes = new Map();
        const rowByDepth = new Map();
        const nextRow = (depth) => {
            const r = rowByDepth.get(depth) ?? 0;
            rowByDepth.set(depth, r + 1);
            return r;
        };

        const seedId = this._seedTx;
        if (!seedId || !this._transactions[seedId]) return nodes;

        // Seed tx inputs go at depth -1
        const seedTx = this._transactions[seedId];
        for (const inp of seedTx.inputs) {
            if (!nodes.has(inp.wallet)) {
                nodes.set(inp.wallet, { id: inp.wallet, type: 'wallet', depth: -1, row: nextRow(-1) });
            }
        }

        // BFS forward from seed tx (depth 0)
        const visited = new Set(nodes.keys());
        const queue   = [{ id: seedId, type: 'tx', depth: 0 }];

        while (queue.length > 0) {
            const { id, type, depth } = queue.shift();
            if (visited.has(id)) continue;
            visited.add(id);
            nodes.set(id, { id, type, depth, row: nextRow(depth) });

            if (type === 'tx') {
                const tx = this._transactions[id];
                if (!tx) continue;
                for (const out of tx.outputs) {
                    if (!visited.has(out.wallet)) {
                        queue.push({ id: out.wallet, type: 'wallet', depth: depth + 1 });
                    }
                }
            } else {
                // Find txs where this wallet spends (is an input)
                for (const tx of Object.values(this._transactions)) {
                    if (!visited.has(tx.hash) && tx.inputs.some(i => i.wallet === id)) {
                        queue.push({ id: tx.hash, type: 'tx', depth: depth + 1 });
                    }
                }
            }
        }

        this._graphLayout = nodes;
        return nodes;
    }

    // ── Graph rendering ────────────────────────────────────────────────────────

    _renderGraph() {
        const layout = this._buildGraphLayout();
        if (layout.size === 0) return '<div class="bce-graph-empty">No graph data.</div>';

        const COL_W  = 158;
        const ROW_H  = 58;
        const NODE_W = 130;
        const NODE_H = 40;
        const PAD_X  = 12;
        const PAD_Y  = 14;

        let minDepth = Infinity, maxDepth = -Infinity;
        const rowsByDepth = new Map();

        for (const node of layout.values()) {
            minDepth = Math.min(minDepth, node.depth);
            maxDepth = Math.max(maxDepth, node.depth);
            const arr = rowsByDepth.get(node.depth) ?? [];
            arr.push(node.id);
            rowsByDepth.set(node.depth, arr);
        }

        const colCount = maxDepth - minDepth + 1;
        const maxRows  = Math.max(...[...rowsByDepth.values()].map(r => r.length));

        const svgW = colCount * COL_W + PAD_X * 2;
        const svgH = maxRows  * ROW_H + PAD_Y * 2;

        // Assign pixel centre positions
        const pos = new Map();
        for (const node of layout.values()) {
            const col       = node.depth - minDepth;
            const depthIds  = rowsByDepth.get(node.depth) ?? [];
            const totalH    = depthIds.length * ROW_H;
            const startY    = (svgH - totalH) / 2;
            pos.set(node.id, {
                x:  PAD_X + col * COL_W + (COL_W - NODE_W) / 2,
                y:  startY + node.row * ROW_H + (ROW_H - NODE_H) / 2,
                cx: PAD_X + col * COL_W + COL_W / 2,
                cy: startY + node.row * ROW_H + ROW_H / 2,
            });
        }

        // Build forward-only edge list from tx inputs/outputs
        const ARROW_LEN = 10; // must match marker polygon tip x
        const edges = [];
        for (const node of layout.values()) {
            if (node.type !== 'tx') continue;
            const tx = this._transactions[node.id];
            if (!tx) continue;
            for (const inp of tx.inputs) {
                if (pos.has(inp.wallet) && pos.get(inp.wallet).cx < pos.get(node.id).cx) {
                    edges.push({ from: inp.wallet, to: node.id });
                }
            }
            for (const out of tx.outputs) {
                if (pos.has(out.wallet) && pos.get(out.wallet).cx > pos.get(node.id).cx) {
                    edges.push({ from: node.id, to: out.wallet });
                }
            }
        }

        // Count outgoing/incoming per node (forward edges only) for fan-out spread.
        const departCount = new Map();
        const departIndex = new Map();
        const arriveCount = new Map();
        const arriveIndex = new Map();
        for (const edge of edges) {
            if (!edge.forward) continue;
            const key = `${edge.from}→${edge.to}`;
            const di = departCount.get(edge.from) ?? 0;
            departIndex.set(key, di);
            departCount.set(edge.from, di + 1);
            const ai = arriveCount.get(edge.to) ?? 0;
            arriveIndex.set(key, ai);
            arriveCount.set(edge.to, ai + 1);
        }

        // Render edges
        let svgEdges = '';
        for (const edge of edges) {
            const fp = pos.get(edge.from);
            const tp = pos.get(edge.to);
            if (!fp || !tp) continue;

            const key    = `${edge.from}→${edge.to}`;
            const dTotal = departCount.get(edge.from) ?? 1;
            const dIdx   = departIndex.get(key) ?? 0;
            const aTotal = arriveCount.get(edge.to) ?? 1;
            const aIdx   = arriveIndex.get(key) ?? 0;

            // Spread departure along right edge; path ends ARROW_LEN before wallet left edge
            // so arrowhead tip lands exactly on the wallet border.
            const y1 = fp.y + NODE_H * (dIdx + 1) / (dTotal + 1);
            const x1 = fp.x + NODE_W;
            const y2 = tp.y + NODE_H * (aIdx + 1) / (aTotal + 1);
            const x2 = tp.x - ARROW_LEN;
            const mx = (x1 + x2) / 2;
            const d  = `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;

            svgEdges += `<path d="${d}" class="bce-edge" marker-end="url(#bce-arrow)"/>`;
        }

        // Render nodes
        const currentId  = this._currentView?.id;
        const visitedIds = new Set(this._navHistory.map(n => n.id));
        let svgNodes = '';

        for (const node of layout.values()) {
            const p = pos.get(node.id);
            if (!p) continue;

            const isCurrent = node.id === currentId;
            const isVisited = visitedIds.has(node.id);
            const isMixer   = node.type === 'wallet' && this._maxSenderOutputCount(node.id) >= this._mixerThreshold;
            const isTarget  = node.id === this._targetAddress;

            let variant = node.type === 'tx' ? 'tx' : 'wallet';
            if (isMixer)  variant = this._mixerFlagged       ? 'mixer-flagged'  : 'mixer';
            if (isTarget && this._destinationFlagged) variant = 'target-flagged';

            const activeClass = isCurrent ? ' bce-gnode-active' : '';
            const opacity     = (isVisited || isCurrent) ? '1' : '0.38';

            const typeLabel = node.type === 'tx' ? 'TX' : 'WALLET';
            const shortId   = node.type === 'tx' ? truncHash(node.id) : truncAddr(node.id);

            svgNodes += `
<g class="bce-gnode bce-gnode-${variant}${activeClass}"
   data-type="${escapeHtml(node.type)}" data-id="${escapeHtml(node.id)}"
   opacity="${opacity}" transform="translate(${p.x},${p.y})">
  <rect class="bce-gn-rect" width="${NODE_W}" height="${NODE_H}" rx="3"/>
  <text class="bce-gn-type" x="9" y="13">${typeLabel}</text>
  <text class="bce-gn-id" x="${NODE_W / 2}" y="31" text-anchor="middle">${escapeText(shortId)}</text>
</g>`;

            // Sub-label below node (wallet display name or tx date)
            const sublabel = node.type === 'wallet'
                ? this._walletLabel(node.id)
                : (this._transactions[node.id]?.timestamp?.slice(0, 10) || '');
            if (sublabel) {
                svgNodes += `<text class="bce-gn-sublabel" x="${p.cx}" y="${p.y + NODE_H + 11}" text-anchor="middle" opacity="${opacity}">${escapeText(sublabel)}</text>`;
            }
        }

        return `
<div class="bce-graph-section-label">CHAIN GRAPH</div>
<svg class="bce-graph-svg"
     viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="bce-arrow" markerWidth="10" markerHeight="8" refX="0" refY="4" orient="auto" markerUnits="userSpaceOnUse">
      <polygon points="0 0, 10 4, 0 8" class="bce-arrow-marker"/>
    </marker>
  </defs>
  ${svgEdges}
  ${svgNodes}
</svg>`;
    }

    // ── Main render ────────────────────────────────────────────────────────────

    render() {
        // Preserve graph pane scroll so clicking a node doesn't reset position
        const existingPane = this.gameContainer.querySelector('#bce-graph-pane');
        const scrollLeft = existingPane?.scrollLeft ?? 0;
        const scrollTop  = existingPane?.scrollTop  ?? 0;

        const caseRef = this._caseRef
            ? `<span class="bce-case-ref">${escapeText(this._caseRef)}</span>`
            : '';

        this.gameContainer.innerHTML = `
            <div class="bce-panel">
                <div class="bce-header">
                    <div class="bce-title-group">
                        <span class="bce-title-icon">⛓</span>
                        <span class="bce-title">${escapeText(this._title)}</span>
                    </div>
                    ${caseRef}
                </div>
                <div class="bce-body">
                    <div class="bce-graph-pane" id="bce-graph-pane">
                        ${this._renderGraph()}
                    </div>
                    <div class="bce-detail" id="bce-detail">
                        ${this._renderDetail()}
                    </div>
                </div>
                <div class="bce-footer">
                    ${this._renderFooter()}
                </div>
            </div>
        `;

        const newPane = this.gameContainer.querySelector('#bce-graph-pane');
        if (newPane) {
            newPane.scrollLeft = scrollLeft;
            newPane.scrollTop  = scrollTop;
        }

        this.bindEvents();
    }

    _renderDetail() {
        if (!this._currentView) {
            return '<div class="bce-detail-empty">Select a node in the graph<br>to begin your investigation.</div>';
        }
        if (this._currentView.type === 'tx') {
            const tx = this._transactions[this._currentView.id];
            return tx ? this._renderTxView(tx) : '<div class="bce-detail-empty">Transaction not found.</div>';
        }
        const wallet = this._wallets[this._currentView.id] || { address: this._currentView.id, displayName: 'Unknown', balance: 0 };
        return this._renderWalletView(wallet);
    }

    // ── Transaction detail view ────────────────────────────────────────────────

    _renderTxView(tx) {
        const inputRows = tx.inputs.map(i => `
            <div class="bce-io-row">
                <div class="bce-io-cell">
                    <button class="bce-link" data-type="wallet" data-id="${escapeHtml(i.wallet)}" type="button">${escapeText(truncAddr(i.wallet))}</button>
                    <span class="bce-link-sublabel">${this._walletLabel(i.wallet)}</span>
                </div>
                <span class="bce-amount bce-amount-in">+${this._renderAmount(i.amount)}</span>
            </div>
        `).join('');

        const inputAddresses = new Set(tx.inputs.map(i => i.wallet));
        const outputRows = [...tx.outputs]
            .filter(o => !inputAddresses.has(o.wallet))
            .sort((a, b) => b.amount - a.amount)
            .map(o => `
                <div class="bce-io-row">
                    <div class="bce-io-cell">
                        <button class="bce-link" data-type="wallet" data-id="${escapeHtml(o.wallet)}" type="button">${escapeText(truncAddr(o.wallet))}</button>
                        <span class="bce-link-sublabel">${this._walletLabel(o.wallet)}</span>
                    </div>
                    <span class="bce-amount bce-amount-out">-${this._renderAmount(o.amount)}</span>
                </div>`)
            .join('');

        const confirms = tx.confirmations != null
            ? `<span class="bce-meta-label">Confirms</span><span class="bce-meta-subtle">${tx.confirmations.toLocaleString()}</span>`
            : '';

        return `
            <div class="bce-view-header">
                <span class="bce-view-icon">⇄</span>
                <span class="bce-view-title">TRANSACTION</span>
            </div>
            <div class="bce-divider"></div>
            <div class="bce-meta-grid">
                <span class="bce-meta-label">Hash</span>
                <span class="bce-meta-value">${escapeText(truncHash(tx.hash))}</span>
                <span class="bce-meta-label">Block</span>
                <span class="bce-meta-value">${tx.blockHeight?.toLocaleString() || '—'}</span>
                <span class="bce-meta-label">Time</span>
                <span class="bce-meta-value">${escapeText(tx.timestamp || '—')}</span>
                <span class="bce-meta-label">Fee</span>
                <span class="bce-meta-value">${this._renderAmount(tx.fee ?? 0)}</span>
                ${confirms}
            </div>
            <div class="bce-io-section">
                <div class="bce-io-heading">INPUTS</div>
                ${inputRows || '<div class="bce-io-empty">No inputs</div>'}
            </div>
            <div class="bce-io-section">
                <div class="bce-io-heading">OUTPUTS</div>
                ${outputRows || '<div class="bce-io-empty">No outputs</div>'}
            </div>
            <div class="bce-divider"></div>
        `;
    }

    // ── Wallet detail view ─────────────────────────────────────────────────────

    _renderWalletView(wallet) {
        const address = wallet.address;
        const txs     = this._walletTxs(address);
        const fanOut  = this._maxSenderOutputCount(address);
        const isMixer = fanOut >= this._mixerThreshold;
        const isDest  = address === this._targetAddress;

        const txRows = txs.map(tx => {
            const isOut    = tx.inputs.some(i => i.wallet === address);
            const relevant = isOut
                ? tx.outputs.reduce((s, o) => s + (o.wallet !== address ? o.amount : 0), 0)
                : tx.outputs.filter(o => o.wallet === address).reduce((s, o) => s + o.amount, 0);
            const dirClass = isOut ? 'bce-amount-out' : 'bce-amount-in';
            const sign     = isOut ? '-' : '+';
            const timeStr  = (tx.timestamp || '').slice(0, 16);
            return `
                <div class="bce-io-row bce-io-row-3col">
                    <div class="bce-io-cell">
                        <button class="bce-link" data-type="tx" data-id="${escapeHtml(tx.hash)}" type="button">${escapeText(truncHash(tx.hash))}</button>
                        <span class="bce-badge ${isOut ? 'bce-badge-out' : 'bce-badge-in'}">${isOut ? 'OUT' : 'IN'}</span>
                    </div>
                    <span class="bce-amount ${dirClass}">${sign}${this._renderAmount(relevant)}</span>
                    <span class="bce-tx-time">${escapeText(timeStr)}</span>
                </div>
            `;
        }).join('');

        const mixerCallout = isMixer ? `
            <div class="bce-callout bce-callout-mixer">
                <div class="bce-callout-title">⚠ High fan-out detected</div>
                <div class="bce-callout-body">This wallet sent funds to ${fanOut} recipients in a single transaction — consistent with a mixing or tumbling service.</div>
            </div>
        ` : '';

        const threatIntel = wallet.threatIntelMatch
            ? `<div class="bce-callout bce-callout-threat">
                <div class="bce-callout-title">⬡ Threat Intel Match</div>
                <div class="bce-callout-body">${escapeText(wallet.threatIntelMatch)}</div>
               </div>`
            : `<div class="bce-no-intel">No threat intelligence matches found for this address.</div>`;

        const mixerAction = isMixer && this._requiresMixer
            ? (this._mixerFlagged
                ? '<div class="bce-flagged-badge">✓ Flagged as Mixing Service</div>'
                : '<button class="bce-flag-btn" id="bce-flag-mixer" type="button">Flag as Mixing Service ▶</button>')
            : '';

        const destAction = isDest && this._canFlagDestination()
            ? (this._destinationFlagged
                ? '<div class="bce-flagged-badge">✓ Flagged as Destination</div>'
                : '<button class="bce-flag-btn" id="bce-flag-dest" type="button">Flag as Destination Wallet ▶</button>')
            : '';

        return `
            <div class="bce-view-header">
                <span class="bce-view-icon">◈</span>
                <span class="bce-view-title">WALLET</span>
            </div>
            <div class="bce-divider"></div>
            <div class="bce-meta-grid">
                <span class="bce-meta-label">Address</span>
                <span class="bce-meta-value">${escapeText(truncAddr(address))}</span>
                <span class="bce-meta-label">Label</span>
                <span class="bce-meta-value">${escapeText(wallet.displayName || 'Unknown Wallet')}</span>
                <span class="bce-meta-label">Balance</span>
                <span class="bce-meta-value">${this._renderAmount(wallet.balance ?? 0)}</span>
            </div>
            <div class="bce-io-section">
                <div class="bce-io-heading">TRANSACTIONS (${txs.length})</div>
                ${txRows || '<div class="bce-io-empty">No transactions found.</div>'}
            </div>
            ${mixerCallout}
            ${threatIntel}
            ${mixerAction}
            ${destAction}
            <div class="bce-divider"></div>
        `;
    }

    // ── Footer ─────────────────────────────────────────────────────────────────

    _renderFooter() {
        const mixerStatus = this._requiresMixer ? `
            <span class="bce-status-item ${this._mixerFlagged ? 'bce-status-ok' : 'bce-status-pending'}">
                <span class="bce-status-icon">${this._mixerFlagged ? '✓' : '○'}</span>
                Mixing Service
            </span>` : '';

        const destStatus = `
            <span class="bce-status-item ${this._destinationFlagged ? 'bce-status-ok' : 'bce-status-pending'}">
                <span class="bce-status-icon">${this._destinationFlagged ? '✓' : '○'}</span>
                Destination Wallet
            </span>`;

        return `
            <div class="bce-status-bar">
                ${mixerStatus}
                ${destStatus}
            </div>
            <button class="bce-close-btn" id="bce-close-btn" type="button">Close Terminal</button>
        `;
    }

    // ── Events ─────────────────────────────────────────────────────────────────

    bindEvents() {
        // SVG graph node clicks
        this.gameContainer.querySelectorAll('.bce-gnode').forEach(g => {
            this.addEventListener(g, 'click', () => {
                this._navigate(g.dataset.type, g.dataset.id);
            });
        });

        // Inline address/tx links in detail panel
        this.gameContainer.querySelectorAll('.bce-link').forEach(btn => {
            this.addEventListener(btn, 'click', () => {
                this._navigate(btn.dataset.type, btn.dataset.id);
            });
        });

        // Flag buttons
        const mixerBtn = this.gameContainer.querySelector('#bce-flag-mixer');
        if (mixerBtn) this.addEventListener(mixerBtn, 'click', () => this._flagMixer());

        const destBtn = this.gameContainer.querySelector('#bce-flag-dest');
        if (destBtn) this.addEventListener(destBtn, 'click', () => this._flagDestination());

        // Close Terminal
        const closeBtn = this.gameContainer.querySelector('#bce-close-btn');
        if (closeBtn) this.addEventListener(closeBtn, 'click', () => this.complete(false));
    }
}
