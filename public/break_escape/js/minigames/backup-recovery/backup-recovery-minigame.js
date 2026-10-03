import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

const DEFAULT_SOURCES = [
    {
        id: 'nas_encrypted',
        name: 'NAS Appliance',
        status: 'ENCRYPTED',
        etaLabel: 'Not recoverable',
        compromised: true,
        etaHours: null,
        marker: 'X',
        statusTone: 'danger',
        bannerTone: 'danger',
        bannerText: 'WARNING: THIS SOURCE IS COMPROMISED',
        icon: '[NAS]',
        bullets: [
            'Data integrity risk: ENCRYPTED - not recoverable without decryption key.',
            'Estimated restore time: no reliable NAS recovery path.',
            'Malware reintroduction risk: source is compromised.',
            'Operational impact during the wait: EHR recovery delayed; manual clinical operations continue.'
        ]
    },
    {
        id: 'tape_wiped',
        name: 'Tape Library',
        status: 'CATALOGUE WIPED',
        etaLabel: '3-5 days estimate',
        compromised: true,
        etaHours: null,
        marker: 'X',
        statusTone: 'danger',
        bannerTone: 'danger',
        bannerText: 'WARNING: THIS SOURCE IS COMPROMISED',
        icon: '[TAPE]',
        bullets: [
            'Data integrity risk: CATALOGUE WIPED - tapes intact but unindexed.',
            'Estimated restore time: 3-5 days minimum.',
            'Malware reintroduction risk: source integrity cannot be guaranteed.',
            'Operational impact during the wait: prolonged manual clinical operations.'
        ]
    },
    {
        id: 'cloud_vendor',
        name: 'Vendor Cloud Backup',
        status: 'AVAILABLE',
        etaLabel: 'ETA: 18 HOURS',
        compromised: false,
        etaHours: 18,
        marker: '!',
        statusTone: 'success',
        bannerTone: 'warning',
        bannerText: 'CAUTION: 18-HOUR RESTORATION WINDOW - MANUAL CLINICAL OPERATIONS REQUIRED',
        icon: '[CLOUD]',
        bullets: [
            'Data integrity risk: AVAILABLE vendor cloud backup (EHR only).',
            'Estimated restore time: ETA 18 HOURS.',
            'Malware reintroduction risk: restoring to an un-isolated network may reintroduce the attacker.',
            'Operational impact during the wait: manual clinical operations required.'
        ]
    }
];

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Escaped for innerHTML, with " -- " shown as an en dash. Display only: ids and
// stored data keep escapeHtml / the raw text.
function escapeText(value) {
    return escapeHtml(displayDashes(String(value)));
}

export class BackupRecoveryMinigame extends MinigameScene {
    constructor(container, params) {
        params = params || {};
        params.title = params.title || 'Backup Recovery Console';
        params.showCancel = true;
        params.cancelText = params.cancelText || 'Close Console';

        super(container, params);

        this.sources = [];
        this.selectedSourceId = null;
        this.lockedSourceId = null;
        this.choiceLocked = false;
        this.isSubmitting = false;
        this.reinfectionDelayMs = 30000;
    }

    init() {
        super.init();

        this.container.className += ' backup-recovery-minigame-container';
        this.gameContainer.className += ' backup-recovery-game-container';
        this.headerElement.style.display = 'none';

        this.sources = this.resolveSources().map((source) => this.applyWhenAvailable(source));
        const persistedSourceId = window.gameState?.globalVariables?.backup_recovery_source || null;
        const hasValidPersistedSource = !!persistedSourceId
            && this.sources.some((source) => source.id === persistedSourceId);
        this.lockedSourceId = hasValidPersistedSource ? persistedSourceId : null;
        this.choiceLocked = !!this.lockedSourceId;

        if (this.lockedSourceId && this.sources.some((source) => source.id === this.lockedSourceId)) {
            this.selectedSourceId = this.lockedSourceId;
        }

        this.render();
    }

    start() {
        super.start();

        const tileButtons = this.gameContainer.querySelectorAll('.backup-recovery-tile');
        tileButtons.forEach((btn) => {
            this.addEventListener(btn, 'click', () => {
                const sourceId = btn.getAttribute('data-source-id');
                this.handleSelect(sourceId);
            });
        });

        const confirmBtn = this.gameContainer.querySelector('#backup-recovery-confirm');
        if (confirmBtn) {
            this.addEventListener(confirmBtn, 'click', () => {
                this.handleConfirm();
            });
        }

        this.updateUI();
    }

    resolveSources() {
        const objectData = this.params?.lockable?.scenarioData?.minigameData || {};
        const configuredSources = this.params?.sources
            || objectData.backupRecoverySources
            || objectData.backup_recovery_sources
            || objectData.recoverySources;

        if (!Array.isArray(configuredSources) || configuredSources.length === 0) {
            return DEFAULT_SOURCES;
        }

        const byId = new Map(DEFAULT_SOURCES.map((source) => [source.id, source]));
        const normalized = configuredSources
            .filter((entry) => entry && typeof entry.id === 'string')
            .map((entry) => {
                const base = byId.get(entry.id) || {};
                return {
                    ...base,
                    ...entry,
                    bullets: Array.isArray(entry.bullets) && entry.bullets.length > 0
                        ? entry.bullets
                        : (Array.isArray(base.bullets) ? base.bullets : [])
                };
            });

        return normalized.length > 0 ? normalized : DEFAULT_SOURCES;
    }

    getMinigameData() {
        return this.params?.lockable?.scenarioData?.minigameData || {};
    }

    /**
     * Key slots: the material the console holds, shown as a checklist under the
     * header. A slot is loaded when the player carries the named inventory item
     * (`item`, matched on the item's id) or when the named global is true
     * (`global`). An item-backed slot makes a physical artefact the actual key,
     * rather than a flag the player never sees. Scenarios without `keySlots`
     * render exactly as before.
     */
    getKeySlots() {
        const slots = this.getMinigameData().keySlots;
        return Array.isArray(slots) ? slots.filter((slot) => slot && typeof slot.id === 'string') : [];
    }

    isSlotLoaded(slot) {
        if (!slot) {
            return false;
        }
        if (slot.item) {
            const items = window.inventory?.items || [];
            if (items.some((item) => item?.scenarioData?.id === slot.item)) {
                return true;
            }
        }
        if (slot.global) {
            const globals = window.gameState?.globalVariables || {};
            if (globals[slot.global] === true) {
                return true;
            }
        }
        return false;
    }

    /**
     * The first reason a source cannot be chosen, or null when it can. A source may
     * declare `requiresGlobal` (a global that must be true) and/or `needs` (key slot
     * ids that must all be loaded). Lets a scenario make a prerequisite real rather
     * than writing it in a bullet the console never enforces. Sources with neither
     * are always available, so existing scenarios are unaffected.
     */
    getUnmetRequirement(source) {
        if (!source) {
            return null;
        }
        if (Array.isArray(source.needs) && source.needs.length > 0) {
            const slots = this.getKeySlots();
            for (const slotId of source.needs) {
                const slot = slots.find((s) => s.id === slotId);
                if (slot && !this.isSlotLoaded(slot)) {
                    return slot.blockedText || `${slot.label || slotId} not loaded.`;
                }
            }
        }
        if (source.requiresGlobal) {
            const globals = window.gameState?.globalVariables || {};
            if (globals[source.requiresGlobal] !== true) {
                return source.requiresGlobalLabel || 'That source is not available yet.';
            }
        }
        return null;
    }

    isSourceAvailable(source) {
        return this.getUnmetRequirement(source) === null;
    }

    /**
     * Opt-in (sis01 blind playtest 2): a source may declare `whenAvailable`, card and
     * panel fields (status, statusTone, marker, bannerText, bullets...) that replace
     * its own once its `needs` / `requiresGlobal` are met, so a card stops saying
     * "unverified" after the check that verifies it. Read when the console opens.
     * Sources without `whenAvailable` are returned unchanged.
     */
    applyWhenAvailable(source) {
        if (!source || !source.whenAvailable || typeof source.whenAvailable !== 'object') {
            return source;
        }
        const { whenAvailable, ...base } = source;
        if (!this.isSourceAvailable(base)) {
            return base;
        }
        const { id, needs, requiresGlobal, ...overrides } = whenAvailable;
        return { ...base, ...overrides };
    }

    getSelectedSource() {
        return this.sources.find((source) => source.id === this.selectedSourceId) || null;
    }

    handleSelect(sourceId) {
        if (this.isSubmitting) {
            return;
        }

        const target = this.sources.find((source) => source.id === sourceId);
        if (!target) {
            return;
        }

        if (!this.isSourceAvailable(target)) {
            // Locked out by an unmet prerequisite — show why rather than silently ignoring.
            this.selectedSourceId = sourceId;
            this.updateUI();
            return;
        }

        this.selectedSourceId = sourceId;
        this.updateUI();
    }

    handleConfirm() {
        if (this.isSubmitting) {
            return;
        }

        if (this.choiceLocked) {
            const lockedSource = this.sources.find((source) => source.id === this.lockedSourceId) || null;
            const lockedLabel = lockedSource?.name || this.lockedSourceId || 'previously selected source';
            if (window.gameAlert) {
                window.gameAlert(
                    displayDashes(`Restore decision already locked to ${lockedLabel}.`),
                    'info',
                    'Decision Locked In',
                    3000
                );
            }
            return;
        }

        const source = this.getSelectedSource();
        if (!source) {
            return;
        }

        if (!this.isSourceAvailable(source)) {
            if (window.gameAlert) {
                window.gameAlert(
                    this.getUnmetRequirement(source),
                    'warning',
                    'Source Unavailable',
                    3500
                );
            }
            return;
        }

        this.isSubmitting = true;
        this.updateUI();

        const result = this.commitSelection(source);
        this.gameResult = result;

        if (window.playUISound) {
            window.playUISound('confirm');
        }

        this.showOutcomeScreen(source);
    }

    commitSelection(source) {
        const globals = window.gameState?.globalVariables || {};
        const wasNetworkIsolatedAtRestoreStart = globals.network_isolated === true;
        const isCompromised = source.compromised === true;
        const etaHours = Number.isFinite(source.etaHours) ? source.etaHours : null;

        // Write in strict order so listeners triggered by backup_restore_initiated
        // can safely read source and ETA values.
        this.setGlobalAndNotify('backup_recovery_source', source.id);
        this.setGlobalAndNotify('recovery_eta_hours', etaHours === null ? 0 : etaHours);
        this.setGlobalAndNotify('backup_restore_initiated', true);

        if (isCompromised) {
            // Compromised sources fail immediately — the restore cannot succeed.
            this.setGlobalAndNotify('backup_reinfected', true);
        } else if (!wasNetworkIsolatedAtRestoreStart) {
            // Cloud restore on an un-isolated network — delayed reinfection risk.
            this.scheduleDelayedReinfection();
        }

        return {
            selectedSource: source.id,
            backupRestoreInitiated: true,
            recoveryEtaHours: etaHours
        };
    }

    showOutcomeScreen(source) {
        const globals = window.gameState?.globalVariables || {};
        const isCompromised = source.compromised === true;
        const wasNetworkIsolated = globals.network_isolated === true;

        let panelTone, headerText, statusText, bullets;

        if (isCompromised) {
            panelTone = 'danger';
            headerText = 'RESTORE FAILED — SOURCE COMPROMISED';
            statusText = source.id === 'nas_encrypted'
                ? 'NAS APPLIANCE — ENCRYPTED PAYLOAD DETECTED'
                : 'TAPE LIBRARY — CATALOGUE INTEGRITY FAILURE';
            bullets = [
                'Restore initiated from a known-compromised source.',
                'Encrypted or corrupted data confirmed. Recovery has failed.',
                'Reinfection risk: active. Systems may be reinfected.',
                'Incident extended. Manual clinical operations continue indefinitely.'
            ];
        } else {
            panelTone = wasNetworkIsolated ? 'success' : 'warning';
            headerText = 'RESTORE INITIATED — VENDOR CLOUD BACKUP';
            statusText = 'VENDOR CLOUD BACKUP — ETA: 18 HOURS';
            bullets = [
                'Restore process initiated with the EHR cloud backup vendor.',
                'Estimated recovery window: 18 hours. Manual operations continue until then.',
                wasNetworkIsolated
                    ? 'Network is isolated. Reinfection risk: mitigated.'
                    : 'WARNING: Network not isolated. Reinfection risk remains elevated.'
            ];
        }

        // A scenario may author its own outcome copy. Anything it omits falls back to
        // the generic wording computed above, so existing scenarios are unaffected.
        if (source.outcomeTone) {
            panelTone = source.outcomeTone;
        }
        if (source.outcomeHeader) {
            headerText = source.outcomeHeader;
        }
        if (source.outcomeStatus) {
            statusText = source.outcomeStatus;
        }
        if (Array.isArray(source.outcomeBullets) && source.outcomeBullets.length > 0) {
            bullets = source.outcomeBullets;
        }

        this.gameContainer.innerHTML = `
            <div class="backup-recovery-shell backup-recovery-shell--outcome">
                <div class="backup-recovery-header">${escapeText(headerText)}</div>
                <div class="backup-recovery-outcome-panel backup-recovery-outcome-panel--${panelTone}">
                    <div class="backup-recovery-outcome-status">${escapeText(statusText)}</div>
                    <ul class="backup-recovery-panel-bullets">
                        ${bullets.map((b) => `<li>${escapeText(b)}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;

        setTimeout(() => this.complete(true), 2500);
    }

    scheduleDelayedReinfection() {
        setTimeout(() => {
            const globals = window.gameState?.globalVariables || {};

            // Guard against duplicate writes if another system has already set this.
            if (globals.backup_reinfected === true) {
                return;
            }

            this.setGlobalAndNotify('backup_reinfected', true);
        }, this.reinfectionDelayMs);
    }

    setGlobalAndNotify(varName, value) {
        if (!window.gameState) {
            window.gameState = {};
        }

        if (!window.gameState.globalVariables) {
            window.gameState.globalVariables = {};
        }

        if (window.npcManager && typeof window.npcManager.setGlobalVariable === 'function') {
            window.npcManager.setGlobalVariable(varName, value);
            return;
        }

        const oldValue = window.gameState.globalVariables[varName];
        window.gameState.globalVariables[varName] = value;

        if (window.npcConversationStateManager) {
            window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
        }

        if (window.eventDispatcher) {
            window.eventDispatcher.emit(`global_variable_changed:${varName}`, {
                name: varName,
                value: value,
                oldValue: oldValue
            });
        }
    }

    getPanelMarkup(source) {
        if (!source) {
            return {
                header: 'CONSEQUENCE ASSESSMENT - SELECT SOURCE',
                banner: 'Select a recovery source to assess risk and operational impact.',
                bannerTone: 'neutral',
                bullets: [
                    'Data integrity risk varies by backup source.',
                    'Estimated restore time determines the duration of paper operations.',
                    'Malware reintroduction risk depends on source integrity and network isolation.',
                    'Operational impact during the wait must be managed across clinical workflows.'
                ]
            };
        }

        if (!this.isSourceAvailable(source)) {
            return {
                header: `UNAVAILABLE - ${source.name.toUpperCase()}`,
                banner: this.getUnmetRequirement(source),
                bannerTone: 'danger',
                bullets: source.bullets || []
            };
        }

        return {
            header: `CONSEQUENCE ASSESSMENT - ${source.name.toUpperCase()}`,
            banner: source.bannerText,
            bannerTone: source.bannerTone || 'neutral',
            bullets: source.bullets || []
        };
    }

    updateUI() {
        const selected = this.getSelectedSource();

        const tileButtons = this.gameContainer.querySelectorAll('.backup-recovery-tile');
        tileButtons.forEach((btn) => {
            const sourceId = btn.getAttribute('data-source-id');
            const isSelected = selected && selected.id === sourceId;
            const source = this.sources.find((s) => s.id === sourceId);
            const unavailable = !this.isSourceAvailable(source);
            btn.classList.toggle('is-selected', !!isSelected);
            btn.classList.toggle('is-unavailable', unavailable);
            btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            btn.setAttribute('aria-disabled', unavailable ? 'true' : 'false');
        });

        const panel = this.getPanelMarkup(selected);
        const headerEl = this.gameContainer.querySelector('#backup-recovery-panel-header');
        const bannerEl = this.gameContainer.querySelector('#backup-recovery-panel-banner');
        const bulletsEl = this.gameContainer.querySelector('#backup-recovery-panel-bullets');

        if (headerEl) {
            headerEl.textContent = displayDashes(panel.header);
        }

        if (bannerEl) {
            bannerEl.textContent = displayDashes(panel.banner);
            bannerEl.classList.remove('is-danger', 'is-warning', 'is-neutral');
            const toneClass = panel.bannerTone === 'danger'
                ? 'is-danger'
                : panel.bannerTone === 'warning'
                    ? 'is-warning'
                    : 'is-neutral';
            bannerEl.classList.add(toneClass);
        }

        if (bulletsEl) {
            bulletsEl.innerHTML = panel.bullets
                .map((line) => `<li>${escapeText(line)}</li>`)
                .join('');
        }

        const confirmBtn = this.gameContainer.querySelector('#backup-recovery-confirm');
        if (confirmBtn) {
            const baseLabel = selected
                ? displayDashes(`CONFIRM RESTORE FROM ${selected.name.toUpperCase()}`)
                : 'CONFIRM RESTORE FROM THIS SOURCE';
            if (this.choiceLocked) {
                const lockedSource = this.sources.find((source) => source.id === this.lockedSourceId) || null;
                const lockedLabel = (lockedSource?.name || this.lockedSourceId || 'EXISTING SOURCE').toUpperCase();
                confirmBtn.textContent = displayDashes(`DECISION LOCKED: ${lockedLabel}`);
                confirmBtn.disabled = true;
            } else {
                // An unavailable source must not present a live-looking button.
                // handleConfirm() already refuses and explains, but a button
                // that looks clickable reads as a broken control rather than a
                // locked one.
                const blocked = !!selected && !this.isSourceAvailable(selected);
                confirmBtn.textContent = this.isSubmitting
                    ? 'CONFIRMING...'
                    : (blocked ? 'SOURCE UNAVAILABLE' : baseLabel);
                confirmBtn.disabled = this.isSubmitting || !selected || blocked;
            }
        }
    }

    render() {
        const tiles = this.sources.map((source) => {
            const markerClass = source.marker === 'X'
                ? 'is-danger'
                : 'is-warning';
            const statusClass = source.statusTone === 'success'
                ? 'is-success'
                : source.statusTone === 'warning'
                    ? 'is-warning'
                    : 'is-danger';

            return `
                <button type="button" class="backup-recovery-tile" data-source-id="${escapeHtml(source.id)}" aria-pressed="false">
                    <div class="backup-recovery-tile-top">
                        <span class="backup-recovery-icon">${escapeText(source.icon || '[SRC]')}</span>
                        <span class="backup-recovery-marker ${markerClass}">${escapeText(source.marker || '!')}</span>
                    </div>
                    <div class="backup-recovery-source-name">${escapeText(source.name)}</div>
                    <div class="backup-recovery-status-badge ${statusClass}">${escapeText(source.status || 'UNKNOWN')}</div>
                    <div class="backup-recovery-eta">${escapeText(source.etaLabel || '')}</div>
                </button>
            `;
        }).join('');

        const consoleTitle = this.getMinigameData().consoleTitle || 'NORTHGATE TRUST // BACKUP RECOVERY CONSOLE';
        const slots = this.getKeySlots();
        const slotsMarkup = slots.length === 0 ? '' : `
                    <ul class="backup-recovery-slots">
                        ${slots.map((slot) => {
                            const loaded = this.isSlotLoaded(slot);
                            const stateText = loaded
                                ? (slot.loadedText || 'LOADED')
                                : (slot.missingText || 'NOT LOADED');
                            return `
                        <li class="backup-recovery-slot ${loaded ? 'is-loaded' : 'is-missing'}" data-slot-id="${escapeHtml(slot.id)}">
                            <span class="backup-recovery-slot-box">${loaded ? '[x]' : '[ ]'}</span>
                            <span class="backup-recovery-slot-label">${escapeText(slot.label || slot.id)}</span>
                            <span class="backup-recovery-slot-state">${escapeText(stateText)}</span>
                        </li>`;
                        }).join('')}
                    </ul>`;

        this.gameContainer.innerHTML = `
            <div class="backup-recovery-shell">
                <div class="backup-recovery-header">${escapeText(consoleTitle)}${slotsMarkup}</div>

                <div class="backup-recovery-tiles" role="list">
                    ${tiles}
                </div>

                <div class="backup-recovery-panel">
                    <div id="backup-recovery-panel-header" class="backup-recovery-panel-header"></div>
                    <div id="backup-recovery-panel-banner" class="backup-recovery-panel-banner"></div>
                    <ul id="backup-recovery-panel-bullets" class="backup-recovery-panel-bullets"></ul>
                </div>

                <div class="backup-recovery-actions">
                    <button type="button" id="backup-recovery-confirm" class="backup-recovery-confirm-btn" disabled>
                        CONFIRM RESTORE FROM THIS SOURCE
                    </button>
                </div>
            </div>
        `;
    }
}