/**
 * Flag Station Minigame
 * 
 * CTF flag submission interface.
 * Players can submit flags they've found and receive in-game rewards.
 */

import { MinigameScene } from '../framework/base-minigame.js';
import { applyActions } from '../../systems/apply-actions.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { flagRefusalLine, flagRejectReason, flagHistoryHtml } from '../../utils/flag-wording.js';
import { escapeHtml } from '../../utils/escape-html.js';
import { lockScopeRefusal, lockScopeRefusalLine, unlockWithRouteRoomRetry } from '../../utils/lock-scope-refusal.js';

export class FlagStationMinigame extends MinigameScene {
    // The X sits inside the themed frame, not on its border (critique A26, A30)
    static closeInsideFrame = true;
    static REWARD_ICONS = {
        give_item: '[ITEM]', unlock_door: '[DOOR]', unlock_object: '[OPEN]',
        emit_event: '[EVENT]', hint: '[HINT]', set_global: '[+]'
    };
    // Launch device (launch-abort mode): header colour per state. The words come from
    // launchHeader(), built from the item's operationName and outcome texts.
    static LAUNCH_COLORS = { prompt: '#ff4444', armed: '#ff4444', aborted: '#00ff00', launched: '#ff4444' };
    // Neutral outcome lines for a device whose scenario gives none (abortedText, launchedText)
    static DEFAULT_ABORTED_TEXT = 'Abort confirmed. The operation will not go ahead.';
    static DEFAULT_LAUNCHED_TEXT = 'Launch confirmed. The operation is under way.';

    constructor(container, params) {
        super(container, params);
        this.stationId = params.stationId || 'flag-station';
        this.stationName = params.stationName || 'Flag Submission Terminal';
        // The server sends only a COUNT, never the flag values — they are the
        // answers, and validation is server-side (POST /games/:id/flags).
        // `params.flags` is retained purely as a fallback for any caller that
        // still passes an array; never rely on its contents.
        this.expectedFlagCount = params.flagCount ?? (params.flags || []).length;
        this.acceptsVms = params.acceptsVms || []; // List of VM names whose flags are accepted
        // R8: in-world names for those VMs, { "<vm id>": "<name>" }. The raw id stays the
        // server's matching key; only the badge text changes.
        this.acceptsVmLabels = (params.acceptsVmLabels && typeof params.acceptsVmLabels === 'object')
            ? params.acceptsVmLabels : {};
        // Only THIS station's flags. The caller passes the server's per-station list; the
        // game-wide list (every machine's flags) is never used, or a link for one VM
        // shows another VM's flags as submitted (m09 Tomb Beta, m-4).
        const sessionFlags = window.gameState?.stationSubmittedFlags?.[this.stationId] || [];
        this.submittedFlags = Array.isArray(params.submittedFlags)
            ? [...params.submittedFlags, ...sessionFlags.filter(f => !params.submittedFlags.includes(f))]
            : sessionFlags.slice();
        // Key-type flags this station recognised but sends to another device (hintOnlyFlags)
        this.recognisedFlags = (window.gameState?.stationRecognisedFlags?.[this.stationId] || []).slice();
        this.gameId = params.gameId || window.breakEscapeConfig?.gameId || window.gameConfig?.gameId;
        this.isSubmitting = false;
        this.lockObjectId     = params.objectId          || null;
        this.mode             = params.mode             || 'standard';
        this.onAbortConfig    = params.onAbort          || null;
        this.onLaunchConfig   = params.onLaunch         || null;
        this.abortConfirmText = params.abortConfirmText  || 'Abort the operation?';
        this.launchConfirmText= params.launchConfirmText || 'Execute the operation?';
        // The name in every launch heading. Without one (a game stored before the field
        // existed), the device's own name, so no mission's operation is named by the engine.
        this.operationName    = (typeof params.operationName === 'string' && params.operationName.trim())
            || (typeof params.stationName === 'string' && params.stationName.trim())
            || 'LAUNCH DEVICE';
        this.abortedText      = params.abortedText  || FlagStationMinigame.DEFAULT_ABORTED_TEXT;
        this.launchedText     = params.launchedText || FlagStationMinigame.DEFAULT_LAUNCHED_TEXT;
        this.choiceMade       = false;
        // The device's own flagRewards (the server leaves them on the client copy). Its
        // set_global reward with value true is the "launch code accepted" marker, so the
        // choice can be restored on reopen without naming a mission's global here.
        this.flagRewards      = Array.isArray(params.flagRewards) ? params.flagRewards : [];
    }
    /**
     * Test bridge state (see MinigameScene.getTestState).
     *
     * Note for playtests: the flags themselves are earned on a real VM, which
     * the browser bridge cannot do. A runner reaching this minigame needs a
     * flag value supplied by the operator, or must treat the step as blocked.
     */
    getTestState() {
        return {
            ...super.getTestState(),
            stationId: this.stationId,
            stationName: this.stationName,
            expectedFlagCount: this.expectedFlagCount,
            submittedFlags: Array.isArray(this.submittedFlags) ? this.submittedFlags.slice() : [],
            isSubmitting: !!this.isSubmitting,
            requiresExternalVm: true,
            submitHint: 'type(0, "<flag>", { submit: true })'
        };
    }


    init() {
        this.params.title = this.stationName;
        this.params.cancelText = 'Close';
        super.init();
        if (this.mode === 'launch-abort') {
            this.buildLaunchAbortUI();
        } else if (this.mode === 'lock') {
            this.buildLockUI();
        } else {
            this.buildUI();
        }
    }
    
    buildUI() {
        // Add custom styles
        const style = document.createElement('style');
        style.textContent = `
            .flag-station {
                padding: 20px;
                font-family: 'VT323', monospace;
            }
            
            .flag-station-header {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .flag-station-icon {
                display: inline-block;
                font-family: 'Press Start 2P', monospace;
                font-size: 24px;
                color: #00ff00;
                border: 2px solid #00aa00;
                padding: 8px 16px;
                margin-bottom: 10px;
            }
            
            .flag-station-description {
                color: #888;
                font-size: 20px;
                line-height: 1.4;
            }
            
            .flag-input-container {
                margin: 20px 0;
            }
            
            .flag-input-label {
                display: block;
                color: #00ff00;
                margin-bottom: 8px;
                font-size: 20px;
            }
            
            .flag-input-wrapper {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .flag-input {
                flex: 1;
                min-width: 0;
                background: #000;
                border: 2px solid #333;
                color: #00ff00;
                padding: 12px 15px;
                font-family: 'VT323', monospace;
                font-size: 24px;
                outline: none;
            }
            
            .flag-input:focus {
                border-color: #00ff00;
            }
            
            .flag-input::placeholder {
                color: #444;
            }
            
            .flag-submit-btn {
                background: #00aa00;
                color: #fff;
                border: 2px solid #000;
                padding: 12px 20px;
                font-family: 'Press Start 2P', monospace;
                font-size: 16px;
                cursor: pointer;
                white-space: nowrap;
            }
            
            .flag-submit-btn:hover:not(:disabled) {
                background: #00cc00;
            }
            
            .flag-submit-btn:disabled {
                background: #333;
                color: #666;
                cursor: not-allowed;
            }
            
            .flag-result {
                margin-top: 15px;
                padding: 15px;
                text-align: center;
                font-size: 20px;
                overflow-wrap: anywhere;
                display: none;
            }
            
            .flag-result.success {
                display: block;
                background: rgba(0, 170, 0, 0.2);
                border: 2px solid #00aa00;
                color: #00ff00;
            }
            
            .flag-result.error {
                display: block;
                background: rgba(170, 0, 0, 0.2);
                border: 2px solid #aa0000;
                color: #ff4444;
            }
            
            .flag-result.loading {
                display: block;
                background: rgba(255, 170, 0, 0.2);
                border: 2px solid #ffaa00;
                color: #ffaa00;
            }

            /* R7: a flag that belongs elsewhere: a note, not a success */
            .flag-result.info {
                display: block;
                background: rgba(136, 136, 136, 0.12);
                border: 2px solid #777;
                color: #ccc;
            }
            
            .flag-history {
                margin-top: 30px;
                border-top: 2px solid #333;
                padding-top: 20px;
            }
            
            .flag-history-title {
                color: #888;
                font-size: 20px;
                margin-bottom: 10px;
                text-transform: uppercase;
            }
            
            .flag-history-list {
                list-style: none;
                padding: 0;
                margin: 0;
                max-height: 150px;
                overflow-y: auto;
            }
            
            .flag-history-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                padding: 8px 12px;
                margin: 5px 0;
                background: rgba(0, 255, 0, 0.05);
                border-left: 3px solid #00aa00;
            }
            
            .flag-value {
                font-family: 'VT323', monospace;
                color: #00ff00;
                font-size: 20px;
                min-width: 0;
                overflow-wrap: anywhere;
            }
            
            .flag-check {
                color: #00aa00;
                flex-shrink: 0;
            }
            
            .reward-notification {
                margin-top: 15px;
                padding: 15px;
                background: rgba(0, 136, 255, 0.1);
                border: 2px solid #0088ff;
                border-radius: 0;
            }
            
            .reward-notification h4 {
                color: #0088ff;
                margin: 0 0 10px 0;
                font-size: 20px;
            }
            
            .reward-item {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #ccc;
                font-size: 20px;
                margin: 5px 0;
            }
            
            .reward-icon {
                font-size: 20px;
            }
            
            .no-flags-yet {
                color: #666;
                font-style: italic;
                font-size: 20px;
            }
            
            .accepts-vms {
                margin-top: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .accepts-label {
                color: #888;
                font-size: 20px;
            }
            
            .vm-badge {
                background: #00aa00;
                color: #000;
                padding: 4px 12px;
                font-size: 20px;
                font-weight: bold;
                font-family: 'VT323', monospace;
            }

            .flag-recognised-tag {
                font-size: 20px;
            }

            /* Short landscape screens: compact header and spacing so the input and
               the result fit without scrolling the panel */
            @media (max-height: 450px) {
                .flag-station { padding: 8px 12px; }
                .flag-station-header { margin-bottom: 8px; }
                .flag-station-icon { font-size: 16px; padding: 4px 8px; margin-bottom: 4px; }
                .flag-station-description { margin: 4px 0; }
                .flag-input-container { margin: 8px 0; }
                .flag-result { margin-top: 8px; padding: 8px; }
                .flag-history { margin-top: 12px; padding-top: 8px; }
                .flag-history-list { max-height: 96px; }
            }
        `;
        this.gameContainer.appendChild(style);
        
        // Build main container
        const station = document.createElement('div');
        station.className = 'flag-station';
        station.innerHTML = this.buildStationContent();
        
        this.gameContainer.appendChild(station);
        this.attachEventHandlers();
    }
    
    buildStationContent() {
        // Show which VMs' flags are accepted at this station
        const vmBadges = this.acceptsVms.length > 0
            ? `<div class="accepts-vms">
                <span class="accepts-label">Accepts flags from:</span>
                ${this.acceptsVms.map(vm => `<span class="vm-badge">${this.escapeHtml(this.vmLabel(vm))}</span>`).join('')}
               </div>`
            : '';
        
        return `
            <div class="flag-station-header">
                <div class="flag-station-icon">FLAG</div>
                <p class="flag-station-description">
                    Enter captured CTF flags below to validate your findings.
                </p>
                ${vmBadges}
            </div>
            
            <div class="flag-input-container">
                <label class="flag-input-label">Enter Flag:</label>
                <div class="flag-input-wrapper">
                    <input type="text" 
                           class="flag-input" 
                           id="flag-input" 
                           placeholder="flag{...}" 
                           autocomplete="off"
                           spellcheck="false">
                    <button class="flag-submit-btn" id="flag-submit-btn">SUBMIT</button>
                </div>
            </div>
            
            <div class="flag-result" id="flag-result"></div>
            <div class="reward-notification" id="reward-notification" style="display: none;"></div>
            
            <div class="flag-history">
                <div class="flag-history-title">Submitted Flags</div>
                <ul class="flag-history-list" id="flag-history-list">
                    ${this.buildFlagHistory()}
                </ul>
            </div>
        `;
    }
    
    /** The badge text for a VM: its in-world label (acceptsVmLabels), else the raw id. */
    vmLabel(vm) {
        const label = this.acceptsVmLabels?.[vm];
        return (typeof label === 'string' && label.trim()) ? label.trim() : String(vm);
    }

    /**
     * R9: tell the scenario a flag was refused, so a mission can map it to a bark or
     * a nudge. reason: invalid | wrong_station | already_submitted.
     */
    emitFlagRejected(reason, extra = {}) {
        const data = { stationId: this.stationId, reason, ...extra };
        try {
            window.eventDispatcher?.emit?.('flag_rejected', data);
        } catch (err) {
            console.warn('[FlagStation] flag_rejected listener failed:', err);
        }
        return data;
    }

    buildFlagHistory() {
        return flagHistoryHtml(this.submittedFlags, this.recognisedFlags, (x) => this.escapeHtml(x));
    }

    buildLaunchAbortUI() {
        const style = document.createElement('style');
        style.textContent = `
            .flag-station { padding: 20px; font-family: 'VT323', monospace; }
            .flag-station-icon { display: inline-block; font-family: 'Press Start 2P', monospace; font-size: 24px;
                color: #ff4444; border: 2px solid #880000; padding: 8px 16px; margin-bottom: 10px; }
            .flag-station-heading { font-size: 24px; margin-bottom: 6px; }
            .flag-station-sub { color: #888; font-size: 20px; }
            .flag-input-label { display: block; color: #ff4444; margin-bottom: 8px; font-size: 20px; }
            .flag-input-wrapper { display: flex; gap: 10px; }
            .flag-input { flex: 1; background: #000; border: 2px solid #440000; color: #ff4444;
                padding: 12px 15px; font-family: 'VT323', monospace; font-size: 20px; outline: none; }
            .flag-input:focus { border-color: #ff4444; }
            .flag-input::placeholder { color: #444; }
            .flag-submit-btn { background: #440000; color: #ff4444; border: 2px solid #ff4444;
                padding: 12px 20px; font-family: 'Press Start 2P', monospace; font-size: 16px; cursor: pointer; }
            .flag-submit-btn:hover:not(:disabled) { background: #660000; }
            .flag-submit-btn:disabled { background: #333; color: #666; cursor: not-allowed; }
            .flag-result { margin-top: 10px; padding: 10px; display: none; }
            .flag-result.success { background: #001100; border: 2px solid #00ff00; color: #00ff00; }
            .flag-result.error { background: #110000; border: 2px solid #ff0000; color: #ff4444; }
            .flag-result.loading { color: #888; }
            .reward-notification { margin-top: 10px; padding: 10px; background: #001100;
                border: 2px solid #00aa00; color: #00ff00; }
            @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
            @keyframes pulse-border { 0%,100%{border-color:#ff4444} 50%{border-color:#880000} }
        `;
        this.gameContainer.appendChild(style);

        const station = document.createElement('div');
        station.className = 'flag-station';
        station.innerHTML = `
            <div class="launch-abort-header" style="text-align:center; margin-bottom:20px;">
                <div class="flag-station-icon launch-abort-icon">LAUNCH</div>
                <div class="flag-station-heading launch-abort-heading" style="color:#ff4444;"></div>
                <div class="flag-station-sub launch-abort-status"></div>
            </div>

            <div class="flag-input-container">
                <label class="flag-input-label">LAUNCH AUTHORISATION CODE:</label>
                <div class="flag-input-wrapper">
                    <input type="text" class="flag-input" id="flag-input" placeholder="flag{...}"
                           autocomplete="off" spellcheck="false">
                    <button class="flag-submit-btn" id="flag-submit-btn">SUBMIT</button>
                </div>
            </div>

            <div class="flag-result" id="flag-result"></div>
            <div class="reward-notification" id="reward-notification" style="display: none;"></div>
        `;
        this.gameContainer.appendChild(station);
        this.setLaunchHeader('prompt');
        this.attachEventHandlers();

        this.restoreLaunchState();
    }

    /** Globals the player's current state holds (empty when the game state is not up). */
    launchGlobals() {
        return window.gameState?.globalVariables || {};
    }

    /** True when every key in a setGlobal block already holds its value. */
    outcomeApplied(config) {
        const set = config && config.setGlobal;
        const keys = set ? Object.keys(set) : [];
        if (keys.length === 0) return false;
        const g = this.launchGlobals();
        return keys.every(k => g[k] === set[k]);
    }

    /** Has the launch code been accepted? Server flag, this session's list, or the
     *  device's own set_global reward (read from its config, so no mission key is
     *  named here). The reward global is what survives a reload, because an item
     *  carried in the inventory keeps a stale flagsAllSubmitted from when it was picked up. */
    launchCodeAccepted() {
        if (this.params.flagsAllSubmitted) return true;
        if (this.expectedFlagCount > 0 && this.submittedFlags.length >= this.expectedFlagCount) return true;
        const g = this.launchGlobals();
        return this.flagRewards.some(r => r && r.type === 'set_global' && r.value === true && g[r.key] === true);
    }

    /** On open: show the result if ABORT or LAUNCH was already chosen, else the choice if
     *  the code is already accepted, else leave the code prompt. */
    restoreLaunchState() {
        if (this.outcomeApplied(this.onAbortConfig)) {
            this.choiceMade = true;
            this.showFinalState('aborted');
        } else if (this.outcomeApplied(this.onLaunchConfig)) {
            this.choiceMade = true;
            this.showFinalState('launched');
        } else if (this.launchCodeAccepted()) {
            this.showLaunchAbortChoice();
        }
    }

    buildLockUI() {
        const style = document.createElement('style');
        style.textContent = `
            .flag-station { padding: 20px; font-family: 'VT323', monospace; }
            .flag-station-icon { display: inline-block; font-family: 'Press Start 2P', monospace; font-size: 24px;
                color: #00ff00; border: 2px solid #00aa00; padding: 8px 16px; margin-bottom: 10px; }
            .flag-station-heading { font-size: 24px; margin-bottom: 6px; }
            .flag-station-sub { color: #888; font-size: 20px; }
            .flag-input-label { display: block; color: #00ff00; margin-bottom: 8px; font-size: 20px; }
            .flag-input-wrapper { display: flex; gap: 10px; }
            .flag-input { flex: 1; background: #000; border: 2px solid #004400; color: #00ff00;
                padding: 12px 15px; font-family: 'VT323', monospace; font-size: 20px; outline: none; }
            .flag-input:focus { border-color: #00ff00; }
            .flag-input::placeholder { color: #444; }
            .flag-submit-btn { background: #002200; color: #00ff00; border: 2px solid #00ff00;
                padding: 12px 20px; font-family: 'Press Start 2P', monospace; font-size: 16px; cursor: pointer; }
            .flag-submit-btn:hover:not(:disabled) { background: #003300; }
            .flag-submit-btn:disabled { background: #333; color: #666; cursor: not-allowed; }
            .flag-result { margin-top: 10px; padding: 10px; display: none; }
            .flag-result.success { background: #001100; border: 2px solid #00ff00; color: #00ff00; }
            .flag-result.error { background: #110000; border: 2px solid #ff0000; color: #ff4444; }
            .flag-result.loading { color: #888; }
            .reward-notification { margin-top: 10px; padding: 10px; background: #001100;
                border: 2px solid #00aa00; color: #00ff00; }
        `;
        this.gameContainer.appendChild(style);

        const station = document.createElement('div');
        station.className = 'flag-station';
        station.innerHTML = `
            <div style="text-align:center; margin-bottom:20px;">
                <div class="flag-station-icon">LOCKED</div>
                <div class="flag-station-heading" style="color:#00ff00;">ENCRYPTED: SUBMIT DECRYPTION KEY</div>
                <div class="flag-station-sub">Enter the correct flag to unlock this item.</div>
            </div>

            <div class="flag-input-container">
                <label class="flag-input-label">DECRYPTION KEY:</label>
                <div class="flag-input-wrapper">
                    <input type="text" class="flag-input" id="flag-input" placeholder="flag{...}"
                           autocomplete="off" spellcheck="false">
                    <button class="flag-submit-btn" id="flag-submit-btn">UNLOCK</button>
                </div>
            </div>

            <div class="flag-result" id="flag-result"></div>
            <div class="reward-notification" id="reward-notification" style="display: none;"></div>
        `;
        this.gameContainer.appendChild(station);
        this.attachLockEventHandlers();
    }

    attachLockEventHandlers() {
        const input = this.gameContainer.querySelector('#flag-input');
        const submitBtn = this.gameContainer.querySelector('#flag-submit-btn');
        this.addEventListener(submitBtn, 'click', () => this.submitFlagForLock());
        this.addEventListener(input, 'keypress', (e) => {
            if (e.key === 'Enter') this.submitFlagForLock();
        });
        setTimeout(() => input.focus(), 100);
    }

    async submitFlagForLock() {
        if (this.isSubmitting) return;

        const input = this.gameContainer.querySelector('#flag-input');
        const submitBtn = this.gameContainer.querySelector('#flag-submit-btn');
        const resultEl = this.gameContainer.querySelector('#flag-result');

        const flagValue = input.value.trim();
        if (!flagValue) {
            this.showResult(resultEl, 'error', 'Please enter a flag');
            return;
        }

        const apiClient = window.ApiClient || window.APIClient;
        const lockable = this.params.lockable;
        const targetType = this.params.type || 'item';
        const targetId = this.lockObjectId || lockable?.scenarioData?.id || lockable?.objectId;

        if (!apiClient || !targetId) {
            this.showResult(resultEl, 'error', 'Cannot validate: missing configuration');
            return;
        }

        this.isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = '...';
        this.showResult(resultEl, 'loading', 'Validating...');

        try {
            // Through the shared object-unlock retry so a correct flag on a route-room object is
            // not refused during the pre-promotion window (§3.6).
            const response = await unlockWithRouteRoomRetry(targetType, targetId, flagValue, 'flag');

            if (response.success) {
                if (window.playUISound) window.playUISound('confirm');
                if (response.hasContents && response.contents && lockable?.scenarioData) {
                    lockable.scenarioData.contents = response.contents;
                }
                if (response.rewards?.length > 0) {
                    this.processRewardEvents(response.rewards);
                }
                if ((response.completedTasks?.length > 0 || response.updatedTasks?.length > 0) && window.eventDispatcher) {
                    window.eventDispatcher.emit('flag_tasks_updated', {
                        flagId:         null,
                        completedTasks: response.completedTasks || [],
                        updatedTasks:   response.updatedTasks   || []
                    });
                }
                this.showResult(resultEl, 'success', 'Access granted. Unlocking...');
                setTimeout(() => {
                    this.gameResult = { serverResponse: response };
                    this.complete(true);
                }, 1500);
            } else {
                if (window.playUISound) window.playUISound('reject');
                this.showResult(resultEl, 'error', flagRefusalLine(null, { flagValue }));
                this.emitFlagRejected('invalid', { objectId: targetId });
            }
        } catch (error) {
            // The server answered "no" (422 with a body): a refused flag, not a dropped
            // connection. ApiClient throws for any non-2xx, so a wrong flag used to land
            // here as "Validation failed".
            const refusal = lockScopeRefusal(error);
            if (refusal) {
                // The PC the lock sits on is off or out of reach (review R4 m2): the flag was
                // not judged, so no rejection is told to the mission
                this.showResult(resultEl, 'error', lockScopeRefusalLine(error));
            } else if (error?.status && error.status < 500) {
                const body = error.body || {};
                const reason = flagRejectReason(body.message || body.error, body.reason);
                if (window.playUISound) window.playUISound('reject');
                this.showResult(resultEl, 'error', flagRefusalLine(body.message || body.error, { reason, flagValue }));
                // The flag was right but unrecorded: not a wrong flag, so no rejection event
                if (reason !== 'flag_not_recorded') this.emitFlagRejected(reason, { objectId: targetId });
            } else {
                console.error('[FlagLock] Unlock error:', error);
                this.showResult(resultEl, 'error', 'Validation failed. Try again.');
            }
        } finally {
            this.isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.textContent = 'UNLOCK';
        }
    }

    showLaunchAbortChoice() {
        const inputContainer = this.gameContainer.querySelector('.flag-input-container');
        if (!inputContainer) return;
        // The code is in: the header stops asking for it
        this.setLaunchHeader('armed');

        inputContainer.innerHTML = `
            <div class="launch-abort-armed" style="text-align:center; margin: 20px 0;">
                <div style="color:#ff4444; font-size:20px; margin-bottom:8px; animation: blink 1s infinite;">
                    ARMED: LAUNCH WINDOW SUNDAY 06:00 UTC
                </div>
                <div style="display:flex; gap:20px; justify-content:center; margin-top:20px;">
                    <button id="abort-btn" style="
                        background:#004400; border:2px solid #00ff00; color:#00ff00;
                        padding:15px 30px; font-family:'Press Start 2P',monospace;
                        font-size:16px; cursor:pointer; min-width:160px;">
                        ABORT OPERATION
                    </button>
                    <button id="launch-btn" style="
                        background:#440000; border:2px solid #ff4444; color:#ff4444;
                        padding:15px 30px; font-family:'Press Start 2P',monospace;
                        font-size:16px; cursor:pointer; min-width:160px;
                        animation: pulse-border 1.5s infinite;">
                        EXECUTE LAUNCH
                    </button>
                </div>
            </div>`;

        this.addEventListener(
            this.gameContainer.querySelector('#abort-btn'), 'click', () => this.handleAbort()
        );
        this.addEventListener(
            this.gameContainer.querySelector('#launch-btn'), 'click', () => this.handleLaunch()
        );
    }

    handleAbort() {
        if (this.choiceMade) return;
        if (!confirm(this.abortConfirmText)) return;
        this.choiceMade = true;
        this.applyChoiceConfig(this.onAbortConfig);
        this.showFinalState('aborted');
    }

    handleLaunch() {
        if (this.choiceMade) return;
        if (!confirm(this.launchConfirmText)) return;
        this.choiceMade = true;
        this.applyChoiceConfig(this.onLaunchConfig);
        this.showFinalState('launched');
    }

    applyChoiceConfig(config) {
        if (!config) return;
        if (config.setGlobal && window.gameState?.globalVariables) {
            Object.assign(window.gameState.globalVariables, config.setGlobal);
            for (const [key, value] of Object.entries(config.setGlobal)) {
                window.eventDispatcher?.emit(`global_variable_changed:${key}`, { name: key, value });
            }
        }
        if (config.emitEvent) {
            window.eventDispatcher?.emit(config.emitEvent, { source: 'launch_device' });
        }
        // Save the choice now rather than on the 30 s timer or pagehide, so a crash or a
        // hard close straight after it keeps the outcome. The sync sends only what changed
        // (the choice's globals, plus anything else already pending). A failed request is
        // tried again a few times at 250, 500 and 1000 ms (syncConfirmed: bounded, stops on
        // a 403) rather than waiting for the timer; each retry resends the same delta.
        // A config with only an event syncs too: its mapping can set the globals or the
        // timed message itself. handleAbort/handleLaunch call this once per choice.
        if (config.setGlobal || config.emitEvent) {
            const sync = window.stateSync;
            try {
                const run = typeof sync?.syncConfirmed === 'function'
                    ? sync.syncConfirmed({ attempts: 4 })
                    : sync?.sync?.();
                Promise.resolve(run).catch(() => {});
            } catch (e) { /* the timer retries */ }
        }
    }

    /** Heading and status line for a launch-device state: prompt, armed, aborted, launched. */
    launchHeader(state) {
        const op = this.operationName.toUpperCase();
        switch (state) {
            case 'armed': return { heading: `${op}: CODE ACCEPTED`, status: 'Choose: abort the operation or execute the launch.' };
            case 'aborted': return { heading: `${op}: ABORTED`, status: this.abortedText };
            case 'launched': return { heading: `${op}: LAUNCHED`, status: this.launchedText };
            default: return { heading: `${op}: ENTER LAUNCH AUTHORISATION CODE`, status: 'This device is armed. Enter the authorisation code to proceed.' };
        }
    }

    /** Write a state's header (textContent: scenario text stays plain text). The LAUNCH
     *  tag shows only while the device is armed (prompt and armed states). Colour is set
     *  every time, so the helper can move between any two states. */
    setLaunchHeader(state) {
        const { heading, status } = this.launchHeader(state);
        const q = (sel) => this.gameContainer.querySelector(sel);
        const h = q('.launch-abort-heading');
        const s = q('.launch-abort-status');
        const i = q('.launch-abort-icon');
        if (h) { h.textContent = displayDashes(heading); h.style.color = FlagStationMinigame.LAUNCH_COLORS[state] || ''; }
        if (s) s.textContent = displayDashes(status);
        if (i) i.style.display = (state === 'aborted' || state === 'launched') ? 'none' : '';
    }

    /** The result of the choice, 'aborted' or 'launched'. The header carries the outcome
     *  (one heading, one status line); the input block and the submit step's result and
     *  reward lines (which still said the attack was "yours to abort") are cleared. Same
     *  on a reopen. */
    showFinalState(outcome) {
        if (outcome !== 'aborted' && outcome !== 'launched') return;
        const inputContainer = this.gameContainer.querySelector('.flag-input-container');
        if (!inputContainer) return;
        this.setLaunchHeader(outcome);
        for (const id of ['flag-result', 'reward-notification']) {
            const el = this.gameContainer.querySelector(`#${id}`);
            // The ids are also the elements' base class names
            if (el) { el.innerHTML = ''; el.className = id; el.style.display = 'none'; }
        }
        inputContainer.innerHTML = `<div class="launch-abort-final" data-outcome="${outcome}"></div>`;
    }


    attachEventHandlers() {
        const input = this.gameContainer.querySelector('#flag-input');
        const submitBtn = this.gameContainer.querySelector('#flag-submit-btn');
        
        // Submit on button click
        this.addEventListener(submitBtn, 'click', () => this.submitFlag());
        
        // Submit on Enter key
        this.addEventListener(input, 'keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitFlag();
            }
        });
        
        // Focus input on start
        setTimeout(() => input.focus(), 100);
    }
    
    async submitFlag() {
        const input = this.gameContainer.querySelector('#flag-input');
        const submitBtn = this.gameContainer.querySelector('#flag-submit-btn');
        const resultEl = this.gameContainer.querySelector('#flag-result');
        const rewardEl = this.gameContainer.querySelector('#reward-notification');

        // One check at a time. A second Enter while the first is in flight used to be
        // dropped silently; say so instead. What the player typed stays in the box
        // (the first check's success only clears the value it submitted).
        if (this.isSubmitting) {
            this.showResult(resultEl, 'loading', 'Still checking the last flag...');
            return;
        }
        
        const flagValue = input.value.trim();
        
        if (!flagValue) {
            this.showResult(resultEl, 'error', 'Please enter a flag');
            return;
        }
        
        this.isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = '...';
        this.showResult(resultEl, 'loading', 'Validating flag...');
        rewardEl.style.display = 'none';
        
        try {
            const payload = { flag: flagValue, stationId: this.stationId };
            console.log('[FlagDebug] submitFlag payload:', payload);
            const response = await fetch(`/break_escape/games/${this.gameId}/flags`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.getCsrfToken()
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            console.log('[FlagDebug] submitFlag response:', response.status, data);

            if (response.ok && data.success && data.hint) {
                // R7: a flag for another device (hintOnlyFlags). Not consumed and not
                // scored here, so no success tick or confirm chime: a neutral note with
                // a soft sound, saying where it goes.
                if (window.playUISound) window.playUISound('notification');
                const note = (data.rewards || []).find(r => r?.type === 'hint' && r.message)?.message;
                this.showResult(resultEl, 'info', `NOTE: ${note || 'Flag recognised, but this station does not take it.'}`);
                // Keep it in the list, marked as a key for another device, and for reopening
                if (!this.recognisedFlags.some(r => r.flag === flagValue) && !this.submittedFlags.includes(flagValue)) {
                    this.recognisedFlags.push({ flag: flagValue, note: note || '' });
                    if (window.gameState) {
                        const byStation = window.gameState.stationRecognisedFlags || (window.gameState.stationRecognisedFlags = {});
                        byStation[this.stationId] = this.recognisedFlags.slice();
                    }
                    this.updateFlagHistory();
                }
                this.emitFlagRejected('wrong_station', { hint: true });
            } else if (response.ok && data.success) {
                // Success!
                if (window.playUISound) window.playUISound('confirm');
                this.showResult(resultEl, 'success', `${data.message || 'Flag accepted!'}`);
                
                // Add to history only for real submissions, not hint-only responses.
                // Hints return success:true so the player sees the message, but the flag
                // is not consumed server-side and must still be submittable elsewhere.
                if (!data.hint) {
                    this.submittedFlags.push(flagValue);
                    this.updateFlagHistory();

                    // Remember it for this station (reopening the panel in the same session),
                    // and in the game-wide list. Never hand one station's list to the other.
                    if (window.gameState) {
                        const byStation = window.gameState.stationSubmittedFlags || (window.gameState.stationSubmittedFlags = {});
                        (byStation[this.stationId] || (byStation[this.stationId] = [])).push(flagValue);
                        if (!Array.isArray(window.gameState.submittedFlags)) window.gameState.submittedFlags = [];
                        window.gameState.submittedFlags.push(flagValue);
                    }
                }
                
                // Emit generic flag_submitted event with identifier for objectives tracking
                if (data.flagId) {
                    const eventData = {
                        flagKey: flagValue,
                        flagId: data.flagId,     // e.g., "desktop-flag1"
                        vmId: data.vmId,         // e.g., "desktop"
                        stationId: this.stationId
                    };

                    if (window.eventDispatcher) {
                        window.eventDispatcher.emit('flag_submitted', eventData);
                        console.log('[FlagStation] Emitted flag_submitted event:', data.flagId, eventData);

                        // Notify objectives manager of server-confirmed task outcomes.
                        // Task completion is server-authoritative — no secondary POST needed.
                        if (data.completedTasks?.length > 0 || data.updatedTasks?.length > 0) {
                            window.eventDispatcher.emit('flag_tasks_updated', {
                                flagId:         data.flagId,
                                completedTasks: data.completedTasks || [],
                                updatedTasks:   data.updatedTasks   || [],
                            });
                            console.log('[FlagStation] Emitted flag_tasks_updated:', data.completedTasks, data.updatedTasks);
                        }
                    } else {
                        console.warn('[FlagStation] eventDispatcher not available, cannot emit flag_submitted event');
                    }
                } else {
                    console.warn('[FlagStation] No flagId in response, cannot track flag submission:', data);
                }
                
                // Show rewards if any
                if (data.rewards && data.rewards.length > 0) {
                    this.showRewards(rewardEl, data.rewards);
                    
                    // Emit events for rewards
                    this.processRewardEvents(data.rewards);
                }
                
                // Clear the input only if it still holds the flag we submitted: the
                // player may have typed the next one while this check was in flight.
                if (input.value.trim() === flagValue) input.value = '';

                // In launch-abort mode, show ABORT/LAUNCH buttons after successful validation
                if (this.mode === 'launch-abort' && !this.choiceMade) {
                    setTimeout(() => this.showLaunchAbortChoice(), 800);
                }


            } else {
                if (window.playUISound) window.playUISound('reject');
                const reason = flagRejectReason(data.message, data.reason);
                const ownerName = reason === 'wrong_station' ? (data.ownerStationName || null) : null;
                this.showResult(resultEl, 'error', flagRefusalLine(data.message, { reason, ownerName, flagValue }));
                this.emitFlagRejected(reason, ownerName ? { ownerStationName: ownerName } : {});
            }
            
        } catch (error) {
            console.error('[FlagStation] Submit error:', error);
            this.showResult(resultEl, 'error', 'Failed to submit flag. Please try again.');
        } finally {
            this.isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.textContent = 'SUBMIT';
        }
    }
    
    showResult(element, type, message) {
        element.className = `flag-result ${type}`;
        element.textContent = displayDashes(message);
        element.style.display = 'block';
        // On a short screen the result can land below the fold of the scrolling panel
        if (typeof element.scrollIntoView === 'function') element.scrollIntoView({ block: 'nearest' });
    }
    
    showRewards(element, rewards) {
        const rewardHtml = rewards.map(reward => {
            // R1: a reward's in-world label, when the scenario gives one, replaces the
            // generic line ("Event triggered", "Door unlocked: <room id>")
            const label = typeof reward?.label === 'string' ? reward.label.trim() : '';
            if (label) {
                return `
                        <div class="reward-item">
                            <span class="reward-icon">${FlagStationMinigame.REWARD_ICONS[reward.type] || '[+]'}</span>
                            <span>${this.escapeHtml(displayDashes(label))}</span>
                        </div>
                    `;
            }
            switch (reward.type) {
                case 'give_item':
                    return `
                        <div class="reward-item">
                            <span class="reward-icon">[ITEM]</span>
                            <span>Received: ${this.escapeHtml(displayDashes(reward.item?.name || 'Item'))}</span>
                        </div>
                    `;
                case 'unlock_door':
                    return `
                        <div class="reward-item">
                            <span class="reward-icon">[DOOR]</span>
                            <span>Door unlocked: ${this.escapeHtml(reward.room_id)}</span>
                        </div>
                    `;
                case 'emit_event':
                    return `
                        <div class="reward-item">
                            <span class="reward-icon">[EVENT]</span>
                            <span>Event triggered</span>
                        </div>
                    `;
                case 'hint':
                    return reward.message ? `
                        <div class="reward-item">
                            <span class="reward-icon">[HINT]</span>
                            <span>${this.escapeHtml(displayDashes(reward.message))}</span>
                        </div>
                    ` : '';
                default:
                    return '';
            }
        }).filter(h => h).join('');
        
        if (rewardHtml) {
            element.innerHTML = `<h4>Rewards Unlocked!</h4>${rewardHtml}`;
            element.style.display = 'block';
            if (typeof element.scrollIntoView === 'function') element.scrollIntoView({ block: 'nearest' });
        }
    }
    
    processRewardEvents(rewards) {
        // Delegate to shared action executor (also used by triggerOnInteract on world objects)
        applyActions(rewards, { source: 'flag_reward', gameId: this.gameId });
    }
    
    updateFlagHistory() {
        const list = this.gameContainer.querySelector('#flag-history-list');
        if (list) list.innerHTML = this.buildFlagHistory();
    }
    
    getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }
    
    // Server and scenario text (flags, VM labels, reward names) is plain text:
    // escaped once, quotes included, so it is safe in text and in attributes.
    escapeHtml(str) {
        return escapeHtml(str);
    }
    
    start() {
        super.start();
        console.log('[FlagStation] Started with', this.expectedFlagCount, 'expected flags');
        
        // Disable WASD key capture from main game so text input works properly
        if (window.pauseKeyboardInput) {
            window.pauseKeyboardInput();
            console.log('[FlagStation] Paused keyboard input for text entry');
        } else {
            // Fallback to dynamic import if not available on window
            import('../../../js/core/player.js').then(module => {
                if (module.pauseKeyboardInput) {
                    module.pauseKeyboardInput();
                    console.log('[FlagStation] Paused keyboard input for text entry (via import)');
                }
            });
        }
    }
}

// Register with MinigameFramework
if (window.MinigameFramework) {
    window.MinigameFramework.registerMinigame('flag-station', FlagStationMinigame);
}

export default FlagStationMinigame;

