import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

function escapeHtml(value) {
    return String(value || '')
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

export class ShreddedDocumentMinigame extends MinigameScene {
    constructor(container, params) {
        super(container, {
            ...params,
            title: params.title || 'Document Reconstruction',
            showCancel: true,
            cancelText: params.cancelText || 'Close'
        });

        const minigameData = params.lockable?.scenarioData?.minigameData || {};

        this.allowRotation   = params.allowRotation  ?? minigameData.allowRotation  ?? false;
        this.documentTitle   = params.documentTitle  || minigameData.documentTitle  || null;
        this.successMessage  = params.successMessage || minigameData.successMessage || 'Document reconstructed.';
        this.stateWriteVar   = params.stateWrites?.onComplete || minigameData.stateWrites?.onComplete || null;

        // content + stripCount: split a full document string into N word-boundary strips.
        // This creates mid-sentence breaks, making the puzzle significantly harder than
        // the strips[] array where each entry is a complete semantic unit.
        const content    = params.content    || minigameData.content    || null;
        const stripCount = params.stripCount || minigameData.stripCount || 10;
        this.correctStrips = content
            ? this._generateStripsFromContent(content, stripCount)
            : (params.strips || minigameData.strips || []);

        this.currentOrder  = [];
        this.draggedIndex  = null;
        this.completed     = false;
    }

    init() {
        super.init();
        this.container.classList.add('sdm-container');
        this.gameContainer.classList.add('sdm-game-container');
        if (this.headerElement) this.headerElement.style.display = 'none';

        this.completed = this._isAlreadyCompleted();
        this.currentOrder = this.completed
            ? this.correctStrips.map((text, i) => ({ id: i, text, rotated: false, tilt: 0 }))
            : this._shuffleStrips();

        this.render();
    }

    start() {
        super.start();
    }

    _generateStripsFromContent(content, stripCount) {
        // Split content into words, preserving intentional line breaks as visible markers
        const words = content.trim().replace(/\n/g, ' ↵ ').split(/\s+/).filter(Boolean);
        const total = words.length;
        const strips = [];
        for (let i = 0; i < stripCount; i++) {
            const start = Math.round((i / stripCount) * total);
            const end   = Math.round(((i + 1) / stripCount) * total);
            const chunk = words.slice(start, end);
            if (chunk.length > 0) strips.push(chunk.join(' '));
        }
        return strips;
    }

    _isAlreadyCompleted() {
        if (!this.stateWriteVar) return false;
        return window.gameState?.globalVariables?.[this.stateWriteVar] === true;
    }

    _shuffleStrips() {
        const strips = this.correctStrips.map((text, i) => ({ id: i, text, rotated: false, tilt: (Math.random() - 0.5) * 2.4 }));

        // Fisher-Yates shuffle
        for (let i = strips.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [strips[i], strips[j]] = [strips[j], strips[i]];
        }

        // Guarantee the result is not trivially solved (matches correct order)
        if (strips.length > 1 && strips.every((s, i) => s.id === i)) {
            [strips[0], strips[1]] = [strips[1], strips[0]];
        }

        // Apply random rotations to ~40% of strips when rotation mode is on
        if (this.allowRotation) {
            strips.forEach(s => { s.rotated = Math.random() < 0.4; });
        }

        return strips;
    }

    _checkCompletion() {
        const inOrder    = this.currentOrder.every((strip, i) => strip.id === i);
        const allUpright = !this.allowRotation || this.currentOrder.every(s => !s.rotated);
        if (inOrder && allUpright) this._onComplete();
    }

    _onComplete() {
        this.completed = true;
        if (this.stateWriteVar) {
            setGlobalAndNotify(this.stateWriteVar, true);
        }
        this.showSuccess(escapeText(this.successMessage), true, 3000);
    }

    render() {
        const prevScrollTop = this.gameContainer.querySelector('.sdm-scroll')?.scrollTop || 0;

        if (this.completed) {
            this._renderCompleted();
        } else {
            this._renderPuzzle();
        }

        const scrollable = this.gameContainer.querySelector('.sdm-scroll');
        if (scrollable && prevScrollTop > 0) scrollable.scrollTop = prevScrollTop;

        this.bindEvents();
    }

    _renderCompleted() {
        const titleHtml = this.documentTitle
            ? `<div class="sdm-doc-title">${escapeText(this.documentTitle)}</div>`
            : '';

        const stripsHtml = this.currentOrder
            .map(s => `<div class="sdm-strip sdm-strip-locked" style="--tilt: ${s.tilt}deg"><span class="sdm-strip-text">${escapeText(s.text)}</span></div>`)
            .join('');

        this.gameContainer.innerHTML = `
            <div class="sdm-panel">
                <div class="sdm-completed-banner">Document already reconstructed.</div>
                <div class="sdm-success-reveal">${escapeText(this.successMessage)}</div>
                <div class="sdm-scroll">
                    ${titleHtml}
                    <div class="sdm-strips-area">${stripsHtml}</div>
                </div>
            </div>
        `;
    }

    _renderPuzzle() {
        const titleHtml = this.documentTitle
            ? `<div class="sdm-doc-title">${escapeText(this.documentTitle)}</div>`
            : '';

        const instructionText = this.allowRotation
            ? 'Drag the strips into the correct reading order. Flip any upside-down strips using ↕.'
            : 'Drag the strips into the correct reading order.';

        const stripsHtml = this.currentOrder.map((strip, i) => {
            const rotatedClass = strip.rotated ? ' sdm-strip-rotated' : '';
            const flipBtn = this.allowRotation
                ? `<button class="sdm-flip-btn" data-index="${i}" type="button" title="Flip strip">↕</button>`
                : '';
            return `
                <div class="sdm-strip${rotatedClass}" draggable="true" data-index="${i}" style="--tilt: ${strip.tilt}deg">
                    <div class="sdm-strip-content">
                        <span class="sdm-drag-handle" aria-hidden="true">⠿</span>
                        <span class="sdm-strip-text">${escapeText(strip.text)}</span>
                    </div>
                    ${flipBtn}
                </div>
            `;
        }).join('');

        const emptyState = this.correctStrips.length === 0
            ? '<div class="sdm-empty-state">No document strips configured in scenario.</div>'
            : stripsHtml;

        this.gameContainer.innerHTML = `
            <div class="sdm-panel">
                <div class="sdm-instruction">${escapeText(instructionText)}</div>
                <div class="sdm-scroll">
                    ${titleHtml}
                    <div class="sdm-strips-area">${emptyState}</div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        if (this.completed) return;

        const stripEls = this.gameContainer.querySelectorAll('.sdm-strip[draggable]');
        stripEls.forEach((el, i) => {
            this.addEventListener(el, 'dragstart', (e) => this._handleDragStart(e, i));
            this.addEventListener(el, 'dragover',  (e) => this._handleDragOver(e, i));
            this.addEventListener(el, 'drop',      (e) => this._handleDrop(e, i));
            this.addEventListener(el, 'dragend',   ()  => this._handleDragEnd());
        });

        if (this.allowRotation) {
            const flipBtns = this.gameContainer.querySelectorAll('.sdm-flip-btn');
            flipBtns.forEach(btn => {
                const index = parseInt(btn.getAttribute('data-index'), 10);
                this.addEventListener(btn, 'click', (e) => {
                    e.stopPropagation();
                    this._handleFlip(index);
                });
            });
        }
    }

    _handleDragStart(e, index) {
        this.draggedIndex = index;
        e.currentTarget.classList.add('sdm-strip-dragging');
        e.dataTransfer.effectAllowed = 'move';
        // Firefox requires at least one dataTransfer.setData call for drag to initiate
        e.dataTransfer.setData('text/plain', String(index));
    }

    _isInsertAfter(e, index) {
        const strips = this.gameContainer.querySelectorAll('.sdm-strip[draggable]');
        const el = strips[index];
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return e.clientY > rect.top + rect.height / 2;
    }

    _handleDragOver(e, index) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (index === this.draggedIndex) return;
        const insertAfter = this._isInsertAfter(e, index);
        this.gameContainer.querySelectorAll('.sdm-strip[draggable]').forEach((el, i) => {
            el.classList.remove('sdm-insert-before', 'sdm-insert-after');
            if (i === index) el.classList.add(insertAfter ? 'sdm-insert-after' : 'sdm-insert-before');
        });
    }

    _handleDrop(e, index) {
        e.preventDefault();
        if (this.draggedIndex === null || this.draggedIndex === index) {
            this.draggedIndex = null;
            this.render();
            return;
        }

        const insertAfter = this._isInsertAfter(e, index);
        const item = this.currentOrder.splice(this.draggedIndex, 1)[0];
        let insertIndex = index > this.draggedIndex ? index - 1 : index;
        if (insertAfter) insertIndex++;
        this.currentOrder.splice(insertIndex, 0, item);

        this.draggedIndex = null;
        this.render();
        this._checkCompletion();
    }

    _handleDragEnd() {
        this.draggedIndex = null;
        this.gameContainer.querySelectorAll('.sdm-strip').forEach(el => {
            el.classList.remove('sdm-strip-dragging', 'sdm-insert-before', 'sdm-insert-after');
        });
    }

    _handleFlip(index) {
        this.currentOrder[index].rotated = !this.currentOrder[index].rotated;
        this.render();
        this._checkCompletion();
    }
}
