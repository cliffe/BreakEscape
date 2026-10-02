import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

const DEFAULT_TITLE = 'Meridian Claims Management System';

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

function ensureGlobalStores() {
    if (!window.gameState) {
        window.gameState = {};
    }

    if (!window.gameState.globalVariables) {
        window.gameState.globalVariables = {};
    }

    if (window.gameScenario && !window.gameScenario.globalVariables) {
        window.gameScenario.globalVariables = {};
    }
}

function readGlobal(varName) {
    const runtimeGlobals = window.gameState?.globalVariables || {};
    const scenarioGlobals = window.gameScenario?.globalVariables || {};

    if (Object.prototype.hasOwnProperty.call(runtimeGlobals, varName)) {
        return runtimeGlobals[varName];
    }

    return scenarioGlobals[varName];
}

function setGlobalAndNotify(varName, value) {
    ensureGlobalStores();

    const oldValue = readGlobal(varName);
    if (oldValue === value) {
        return false;
    }

    window.gameState.globalVariables[varName] = value;

    if (window.gameScenario?.globalVariables) {
        window.gameScenario.globalVariables[varName] = value;
    }

    if (window.npcConversationStateManager) {
        window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
    }

    if (window.eventDispatcher) {
        window.eventDispatcher.emit(`global_variable_changed:${varName}`, {
            name: varName,
            value,
            oldValue
        });
    }

    return true;
}

function normalizeSections(rawSections) {
    if (Array.isArray(rawSections) && rawSections.length > 0) {
        return rawSections
            .map((section, index) => ({
                id: String(section.id || section.key || `section_${index + 1}`),
                label: section.label || section.title || `Section ${index + 1}`,
                heading: section.heading || section.title || section.label || `Section ${index + 1}`,
                status: section.status || 'Review Pending',
                relevance: section.relevance || '',
                relevanceHighlights: Array.isArray(section.relevanceHighlights)
                    ? section.relevanceHighlights
                    : [],
                summary: Array.isArray(section.summary)
                    ? section.summary
                    : [],
                content: Array.isArray(section.content)
                    ? section.content
                    : [section.content || section.text || 'No content provided.']
            }))
            .filter((section) => section.id && section.label);
    }

    if (rawSections && typeof rawSections === 'object') {
        return Object.keys(rawSections).map((key) => {
            const value = rawSections[key];
            return {
                id: key,
                label: value.label || value.title || key,
                heading: value.heading || value.title || value.label || key,
                status: value.status || 'Review Pending',
                relevance: value.relevance || '',
                relevanceHighlights: Array.isArray(value.relevanceHighlights)
                    ? value.relevanceHighlights
                    : [],
                summary: Array.isArray(value.summary)
                    ? value.summary
                    : [],
                content: Array.isArray(value.content)
                    ? value.content
                    : [value.content || value.text || 'No content provided.']
            };
        });
    }

    return [];
}

function normalizeStateWrites(rawStateWrites) {
    if (!rawStateWrites || typeof rawStateWrites !== 'object') {
        return {};
    }

    const normalized = {};
    Object.keys(rawStateWrites).forEach((key) => {
        const value = rawStateWrites[key];
        if (typeof value === 'string' && value.trim().length > 0) {
            normalized[key] = value.trim();
        }
    });

    return normalized;
}

export class ClaimsManagementSystemMinigame extends MinigameScene {
    constructor(container, params = {}) {
        super(container, {
            ...params,
            title: params.title || DEFAULT_TITLE,
            showCancel: false
        });

        const scenarioData = params.lockable?.scenarioData || {};
        const minigameData = scenarioData.minigameData || {};

        // Sections are scenario-driven for SIS03; do not inject fallback tabs.
        this.sections = normalizeSections(params.sections || minigameData.sections);
        this.stateWrites = normalizeStateWrites(params.stateWrites || minigameData.stateWrites);
        this.minigameKey = String(params.lockable?.id || params.id || 'claims_management_system');
        this.printEnabled = params.printEnabled !== false && minigameData.printEnabled !== false;
        this.activeSectionId = this.sections[0]?.id || null;
        this.viewedSections = new Set();
    }

    getViewedSectionStore() {
        if (!window.gameState) {
            window.gameState = {};
        }

        if (!window.gameState.cmsViewedSections || typeof window.gameState.cmsViewedSections !== 'object') {
            window.gameState.cmsViewedSections = {};
        }

        return window.gameState.cmsViewedSections;
    }

    persistViewedSections() {
        const store = this.getViewedSectionStore();
        store[this.minigameKey] = Array.from(this.viewedSections);
    }

    setCmsReviewedIfComplete() {
        if (this.sections.length === 0) {
            return;
        }

        if (this.viewedSections.size < this.sections.length) {
            return;
        }

        if (readGlobal('cms_reviewed') === true) {
            return;
        }

        setGlobalAndNotify('cms_reviewed', true);
    }

    init() {
        super.init();

        this.container.classList.add('cms-minigame-container');
        this.gameContainer.classList.add('cms-minigame-game-container');

        if (this.headerElement) {
            this.headerElement.style.display = 'none';
        }

        this.syncViewedSectionsFromGlobals();
        this.render();
    }

    start() {
        super.start();

        this.syncViewedSectionsFromGlobals();
        this.render();
    }

    syncViewedSectionsFromGlobals() {
        const store = this.getViewedSectionStore();
        const persistedSections = Array.isArray(store[this.minigameKey])
            ? store[this.minigameKey]
            : [];

        persistedSections.forEach((sectionId) => {
            this.viewedSections.add(String(sectionId));
        });

        Object.keys(this.stateWrites).forEach((sectionId) => {
            const varName = this.stateWrites[sectionId];
            if (readGlobal(varName) === true) {
                this.viewedSections.add(sectionId);
            }
        });

        this.persistViewedSections();
        this.setCmsReviewedIfComplete();
    }

    setSectionViewed(sectionId) {
        // UI viewed state should reflect tab visits even when no global write is configured.
        this.viewedSections.add(sectionId);
        this.persistViewedSections();
        this.setCmsReviewedIfComplete();

        const varName = this.stateWrites[sectionId];
        if (!varName) {
            return;
        }

        if (readGlobal(varName) === true) {
            return;
        }

        setGlobalAndNotify(varName, true);
    }

    setActiveSection(sectionId) {
        this.activeSectionId = sectionId;
        this.setSectionViewed(sectionId);
        this.render();
    }

    handlePrintExcerpt() {
        if (!this.printEnabled) {
            return;
        }

        const section = this.sections.find((item) => item.id === this.activeSectionId);
        if (!section) {
            return;
        }

        if (!window.gameState) {
            window.gameState = {};
        }

        if (!Array.isArray(window.gameState.cmsPrintQueue)) {
            window.gameState.cmsPrintQueue = [];
        }

        window.gameState.cmsPrintQueue.push({
            id: section.id,
            title: section.heading,
            printedAt: new Date().toISOString()
        });

        if (window.gameAlert) {
            window.gameAlert('Excerpt queued for printer review.', 'info', 'CMS Print Queue', 2500);
        }
    }

    renderNav(section) {
        const isActive = section.id === this.activeSectionId;
        const isViewed = this.viewedSections.has(section.id);

        return `
            <button
                type="button"
                class="cms-nav-button${isActive ? ' active' : ''}"
                data-cms-section="${escapeHtml(section.id)}"
            >
                <span class="cms-nav-label">${escapeText(section.label)}</span>
                <span class="cms-nav-state${isViewed ? ' viewed' : ''}">${isViewed ? 'VIEWED' : 'PENDING'}</span>
            </button>
        `;
    }

    renderSectionBody(section) {
        const contentLines = (section.content || [])
            .map((line) => `<li>${escapeText(line)}</li>`)
            .join('');

        return `
            <div class="cms-content-header">
                <h3 class="cms-content-title">${escapeText(section.heading)}</h3>
                <span class="cms-content-status">${escapeText(section.status || 'Review Pending')}</span>
            </div>
            <ul class="cms-content-list">${contentLines}</ul>
        `;
    }

    renderSummaryStrip(section) {
        const summaryItems = Array.isArray(section.summary)
            ? section.summary.filter((item) => item && typeof item === 'object')
            : [];

        let cards = [];

        if (summaryItems.length > 0) {
            cards = summaryItems.slice(0, 2).map((item) => {
                const label = typeof item.label === 'string' && item.label.trim().length > 0
                    ? item.label
                    : 'Detail';
                const value = typeof item.value === 'string' && item.value.trim().length > 0
                    ? item.value
                    : 'Unavailable';

                return `<div class="cms-summary-card"><span class="cms-summary-label">${escapeText(label)}</span><span class="cms-summary-value">${escapeText(value)}</span></div>`;
            });
        }

        if (cards.length === 0) {
            const reviewState = this.viewedSections.has(section.id) ? 'Viewed' : 'Pending';
            cards = [
                `<div class="cms-summary-card"><span class="cms-summary-label">Section</span><span class="cms-summary-value">${escapeText(section.label)}</span></div>`,
                `<div class="cms-summary-card"><span class="cms-summary-label">Review State</span><span class="cms-summary-value">${escapeText(reviewState)}</span></div>`
            ];
        }

        return `<div class="cms-summary-strip">${cards.join('')}</div>`;
    }

    getHeaderStatus(reviewedCount, totalCount) {
        if (totalCount <= 0 || reviewedCount <= 0) {
            return { text: 'Status: Pending Review', className: 'pending' };
        }

        if (reviewedCount >= totalCount) {
            return { text: 'Status: Ready for Determination', className: 'ready' };
        }

        return { text: 'Status: In Progress', className: 'in-progress' };
    }

    renderRelevancePanel(section) {
        const highlights = Array.isArray(section.relevanceHighlights)
            ? section.relevanceHighlights
            : [];
        const highlightsMarkup = highlights
            .slice(0, 4)
            .map((item) => `<li>${escapeText(item)}</li>`)
            .join('');

        return `
            <aside class="cms-context">
                <h4>Evidence Relevance</h4>
                <p>${escapeText(section.relevance || 'No additional guidance for this section.')}</p>
                ${highlightsMarkup ? `<ul class="cms-context-highlights">${highlightsMarkup}</ul>` : ''}
            </aside>
        `;
    }

    bindEvents() {
        const navButtons = this.gameContainer.querySelectorAll('[data-cms-section]');
        navButtons.forEach((button) => {
            const sectionId = button.getAttribute('data-cms-section');
            this.addEventListener(button, 'click', () => {
                this.setActiveSection(sectionId);
            });
        });

        const closeButton = this.gameContainer.querySelector('#cms-close-button');
        if (closeButton) {
            this.addEventListener(closeButton, 'click', () => {
                this.complete(false);
            });
        }

        const printButton = this.gameContainer.querySelector('#cms-print-button');
        if (printButton) {
            this.addEventListener(printButton, 'click', () => {
                this.handlePrintExcerpt();
            });
        }
    }

    render() {
        const activeSection = this.sections.find((section) => section.id === this.activeSectionId) || this.sections[0];
        if (!activeSection) {
            this.gameContainer.innerHTML = '<div class="cms-empty-state">No CMS sections configured in scenario data.</div>';
            return;
        }

        const reviewedCount = this.viewedSections.size;
        const totalCount = this.sections.length;
        const progressPercent = totalCount > 0
            ? Math.round((reviewedCount / totalCount) * 100)
            : 0;
        const headerStatus = this.getHeaderStatus(reviewedCount, totalCount);

        this.gameContainer.innerHTML = `
            <div class="cms-panel">
                <div class="cms-header">
                    <div class="cms-header-left">
                        <h2 class="cms-title">${escapeText(this.params.title || DEFAULT_TITLE)}</h2>
                        <div class="cms-subtitle">MC-2023-ALBE-007 | Coverage Analysis Workspace</div>
                        <div class="cms-progress-wrap">
                            <div class="cms-progress-label">Review Progress: ${reviewedCount}/${totalCount} sections</div>
                            <div class="cms-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPercent}">
                                <span class="cms-progress-fill" style="width: ${progressPercent}%;"></span>
                            </div>
                        </div>
                    </div>
                    <div class="cms-header-right cms-header-right-${headerStatus.className}">${escapeText(headerStatus.text)}</div>
                </div>

                <div class="cms-body">
                    <nav class="cms-nav">
                        ${this.sections.map((section) => this.renderNav(section)).join('')}
                    </nav>

                    <main class="cms-content">
                        ${this.renderSummaryStrip(activeSection)}
                        ${this.renderSectionBody(activeSection)}
                    </main>

                    ${this.renderRelevancePanel(activeSection)}
                </div>

                <div class="cms-footer">
                    <button id="cms-close-button" class="cms-button cms-button-secondary" type="button">Close</button>
                    <button id="cms-print-button" class="cms-button cms-button-primary" type="button" ${this.printEnabled ? '' : 'disabled'}>Print Excerpt</button>
                </div>
            </div>
        `;

        this.bindEvents();
    }
}
