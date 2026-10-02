/**
 * Flag Station Minigame
 * 
 * CTF flag submission interface.
 * Players can submit flags they've found and receive in-game rewards.
 */

import { MinigameScene } from '../framework/base-minigame.js';
import { applyActions } from '../../systems/apply-actions.js';
import { displayDashes } from '../../utils/display-dashes.js';

export class FlagStationMinigame extends MinigameScene {
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
        this.submittedFlags = params.submittedFlags || window.gameState?.submittedFlags || [];
        this.gameId = params.gameId || window.breakEscapeConfig?.gameId || window.gameConfig?.gameId;
        this.isSubmitting = false;
        this.lockObjectId     = params.objectId          || null;
        this.mode             = params.mode             || 'standard';
        this.onAbortConfig    = params.onAbort          || null;
        this.onLaunchConfig   = params.onLaunch         || null;
        this.abortConfirmText = params.abortConfirmText  || 'Abort the operation?';
        this.launchConfirmText= params.launchConfirmText || 'Execute the operation?';
        this.choiceMade       = false;
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
                font-family: 'VT323', 'Courier New', monospace;
            }
            
            .flag-station-header {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .flag-station-icon {
                font-size: 48px;
                margin-bottom: 10px;
            }
            
            .flag-station-description {
                color: #888;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .flag-input-container {
                margin: 20px 0;
            }
            
            .flag-input-label {
                display: block;
                color: #00ff00;
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            .flag-input-wrapper {
                display: flex;
                gap: 10px;
            }
            
            .flag-input {
                flex: 1;
                background: #000;
                border: 2px solid #333;
                color: #00ff00;
                padding: 12px 15px;
                font-family: 'Courier New', monospace;
                font-size: 16px;
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
                font-size: 11px;
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
                font-size: 14px;
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
            
            .flag-history {
                margin-top: 30px;
                border-top: 1px solid #333;
                padding-top: 20px;
            }
            
            .flag-history-title {
                color: #888;
                font-size: 12px;
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
                padding: 8px 12px;
                margin: 5px 0;
                background: rgba(0, 255, 0, 0.05);
                border-left: 3px solid #00aa00;
            }
            
            .flag-value {
                font-family: 'Courier New', monospace;
                color: #00ff00;
                font-size: 13px;
            }
            
            .flag-check {
                color: #00aa00;
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
                font-size: 14px;
            }
            
            .reward-item {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #ccc;
                font-size: 13px;
                margin: 5px 0;
            }
            
            .reward-icon {
                font-size: 18px;
            }
            
            .no-flags-yet {
                color: #666;
                font-style: italic;
                font-size: 13px;
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
                font-size: 12px;
            }
            
            .vm-badge {
                background: #00aa00;
                color: #000;
                padding: 4px 12px;
                font-size: 14px;
                font-weight: bold;
                font-family: 'Courier New', monospace;
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
                ${this.acceptsVms.map(vm => `<span class="vm-badge">${this.escapeHtml(vm)}</span>`).join('')}
               </div>`
            : '';
        
        return `
            <div class="flag-station-header">
                <div class="flag-station-icon">🏁</div>
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
    
    buildFlagHistory() {
        if (this.submittedFlags.length === 0) {
            return '<li class="no-flags-yet">No flags submitted yet</li>';
        }

        return this.submittedFlags.map(flag => `
            <li class="flag-history-item">
                <span class="flag-value">${this.escapeHtml(flag)}</span>
                <span class="flag-check">✓</span>
            </li>
        `).join('');
    }

    buildLaunchAbortUI() {
        const style = document.createElement('style');
        style.textContent = `
            .flag-station { padding: 20px; font-family: 'VT323', 'Courier New', monospace; }
            .flag-input-label { display: block; color: #ff4444; margin-bottom: 8px; font-size: 14px; }
            .flag-input-wrapper { display: flex; gap: 10px; }
            .flag-input { flex: 1; background: #000; border: 2px solid #440000; color: #ff4444;
                padding: 12px 15px; font-family: 'Courier New', monospace; font-size: 16px; outline: none; }
            .flag-input:focus { border-color: #ff4444; }
            .flag-input::placeholder { color: #444; }
            .flag-submit-btn { background: #440000; color: #ff4444; border: 2px solid #ff4444;
                padding: 12px 20px; font-family: 'Press Start 2P', monospace; font-size: 11px; cursor: pointer; }
            .flag-submit-btn:hover:not(:disabled) { background: #660000; }
            .flag-submit-btn:disabled { background: #333; color: #666; cursor: not-allowed; }
            .flag-result { margin-top: 10px; padding: 10px; display: none; }
            .flag-result.success { background: #001100; border: 1px solid #00ff00; color: #00ff00; }
            .flag-result.error { background: #110000; border: 1px solid #ff0000; color: #ff4444; }
            .flag-result.loading { color: #888; }
            .reward-notification { margin-top: 10px; padding: 10px; background: #001100;
                border: 1px solid #00aa00; color: #00ff00; }
            @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
            @keyframes pulse-border { 0%,100%{border-color:#ff4444} 50%{border-color:#880000} }
        `;
        this.gameContainer.appendChild(style);

        const station = document.createElement('div');
        station.className = 'flag-station';
        station.innerHTML = `
            <div style="text-align:center; margin-bottom:20px;">
                <div style="font-size:48px; margin-bottom:10px;">⚠️</div>
                <div style="color:#ff4444; font-size:16px; margin-bottom:6px;">OPERATION SHATTER — ENTER LAUNCH AUTHORIZATION CODE</div>
                <div style="color:#888; font-size:13px;">This device is armed. Enter the authorization code to proceed.</div>
            </div>

            <div class="flag-input-container">
                <label class="flag-input-label">LAUNCH AUTHORIZATION CODE:</label>
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
        this.attachEventHandlers();

        // If the server confirms all flags for this station are already submitted, skip to choice UI
        if (this.params.flagsAllSubmitted) {
            this.showLaunchAbortChoice();
        }
    }

    buildLockUI() {
        const style = document.createElement('style');
        style.textContent = `
            .flag-station { padding: 20px; font-family: 'VT323', 'Courier New', monospace; }
            .flag-input-label { display: block; color: #00ff00; margin-bottom: 8px; font-size: 14px; }
            .flag-input-wrapper { display: flex; gap: 10px; }
            .flag-input { flex: 1; background: #000; border: 2px solid #004400; color: #00ff00;
                padding: 12px 15px; font-family: 'Courier New', monospace; font-size: 16px; outline: none; }
            .flag-input:focus { border-color: #00ff00; }
            .flag-input::placeholder { color: #444; }
            .flag-submit-btn { background: #002200; color: #00ff00; border: 2px solid #00ff00;
                padding: 12px 20px; font-family: 'Press Start 2P', monospace; font-size: 11px; cursor: pointer; }
            .flag-submit-btn:hover:not(:disabled) { background: #003300; }
            .flag-submit-btn:disabled { background: #333; color: #666; cursor: not-allowed; }
            .flag-result { margin-top: 10px; padding: 10px; display: none; }
            .flag-result.success { background: #001100; border: 1px solid #00ff00; color: #00ff00; }
            .flag-result.error { background: #110000; border: 1px solid #ff0000; color: #ff4444; }
            .flag-result.loading { color: #888; }
            .reward-notification { margin-top: 10px; padding: 10px; background: #001100;
                border: 1px solid #00aa00; color: #00ff00; }
        `;
        this.gameContainer.appendChild(style);

        const station = document.createElement('div');
        station.className = 'flag-station';
        station.innerHTML = `
            <div style="text-align:center; margin-bottom:20px;">
                <div style="font-size:48px; margin-bottom:10px;">🔒</div>
                <div style="color:#00ff00; font-size:15px; margin-bottom:6px;">ENCRYPTED — SUBMIT DECRYPTION KEY</div>
                <div style="color:#888; font-size:13px;">Enter the correct flag to unlock this item.</div>
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
            this.showResult(resultEl, 'error', '✗ Cannot validate — missing configuration');
            return;
        }

        this.isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = '...';
        this.showResult(resultEl, 'loading', 'Validating...');

        try {
            const response = await apiClient.unlock(targetType, targetId, flagValue, 'flag');

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
                this.showResult(resultEl, 'success', '✓ Access granted. Unlocking...');
                setTimeout(() => {
                    this.gameResult = { serverResponse: response };
                    this.complete(true);
                }, 1500);
            } else {
                if (window.playUISound) window.playUISound('reject');
                this.showResult(resultEl, 'error', '✗ Incorrect decryption key');
            }
        } catch (error) {
            console.error('[FlagLock] Unlock error:', error);
            this.showResult(resultEl, 'error', '✗ Validation failed. Try again.');
        } finally {
            this.isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.textContent = 'UNLOCK';
        }
    }

    showLaunchAbortChoice() {
        const inputContainer = this.gameContainer.querySelector('.flag-input-container');
        if (!inputContainer) return;

        inputContainer.innerHTML = `
            <div class="launch-abort-armed" style="text-align:center; margin: 20px 0;">
                <div style="color:#ff4444; font-size:16px; margin-bottom:8px; animation: blink 1s infinite;">
                    ⚠ ARMED — LAUNCH WINDOW: SUNDAY 06:00 UTC
                </div>
                <div style="display:flex; gap:20px; justify-content:center; margin-top:20px;">
                    <button id="abort-btn" style="
                        background:#004400; border:2px solid #00ff00; color:#00ff00;
                        padding:15px 30px; font-family:'Press Start 2P',monospace;
                        font-size:11px; cursor:pointer; min-width:160px;">
                        ABORT OPERATION
                    </button>
                    <button id="launch-btn" style="
                        background:#440000; border:2px solid #ff4444; color:#ff4444;
                        padding:15px 30px; font-family:'Press Start 2P',monospace;
                        font-size:11px; cursor:pointer; min-width:160px;
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
        this.showFinalState('OPERATION ABORTED', 'Abort signal transmitted. All attack vectors terminated.', '#00ff00');
    }

    handleLaunch() {
        if (this.choiceMade) return;
        if (!confirm(this.launchConfirmText)) return;
        this.choiceMade = true;
        this.applyChoiceConfig(this.onLaunchConfig);
        this.showFinalState('OPERATION LAUNCHED', 'Attack vector deployed. 2,347,832 targets receiving payload.', '#ff4444');
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
    }

    showFinalState(title, message, color) {
        const inputContainer = this.gameContainer.querySelector('.flag-input-container');
        if (!inputContainer) return;
        inputContainer.innerHTML = `
            <div style="text-align:center; padding:20px; color:${color}; font-size:14px;">
                <div style="font-size:18px; margin-bottom:12px;">${title}</div>
                <div style="color:#888;">${message}</div>
            </div>`;
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
        if (this.isSubmitting) return;
        
        const input = this.gameContainer.querySelector('#flag-input');
        const submitBtn = this.gameContainer.querySelector('#flag-submit-btn');
        const resultEl = this.gameContainer.querySelector('#flag-result');
        const rewardEl = this.gameContainer.querySelector('#reward-notification');
        
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

            if (response.ok && data.success) {
                // Success!
                if (window.playUISound) window.playUISound('confirm');
                this.showResult(resultEl, 'success', `✓ ${data.message || 'Flag accepted!'}`);
                
                // Add to history only for real submissions, not hint-only responses.
                // Hints return success:true so the player sees the message, but the flag
                // is not consumed server-side and must still be submittable elsewhere.
                if (!data.hint) {
                    this.submittedFlags.push(flagValue);
                    this.updateFlagHistory();

                    // Update global state
                    if (window.gameState) {
                        window.gameState.submittedFlags = this.submittedFlags;
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
                
                // Clear input
                input.value = '';

                // In launch-abort mode, show ABORT/LAUNCH buttons after successful validation
                if (this.mode === 'launch-abort' && !this.choiceMade) {
                    setTimeout(() => this.showLaunchAbortChoice(), 800);
                }


            } else {
                if (window.playUISound) window.playUISound('reject');
                this.showResult(resultEl, 'error', `✗ ${data.message || 'Invalid flag'}`);
            }
            
        } catch (error) {
            console.error('[FlagStation] Submit error:', error);
            this.showResult(resultEl, 'error', '✗ Failed to submit flag. Please try again.');
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
    }
    
    showRewards(element, rewards) {
        const rewardHtml = rewards.map(reward => {
            switch (reward.type) {
                case 'give_item':
                    return `
                        <div class="reward-item">
                            <span class="reward-icon">📦</span>
                            <span>Received: ${reward.item?.name || 'Item'}</span>
                        </div>
                    `;
                case 'unlock_door':
                    return `
                        <div class="reward-item">
                            <span class="reward-icon">🔓</span>
                            <span>Door unlocked: ${reward.room_id}</span>
                        </div>
                    `;
                case 'emit_event':
                    return `
                        <div class="reward-item">
                            <span class="reward-icon">⚡</span>
                            <span>Event triggered</span>
                        </div>
                    `;
                case 'hint':
                    return reward.message ? `
                        <div class="reward-item">
                            <span class="reward-icon">💡</span>
                            <span>${this.escapeHtml(displayDashes(reward.message))}</span>
                        </div>
                    ` : '';
                default:
                    return '';
            }
        }).filter(h => h).join('');
        
        if (rewardHtml) {
            element.innerHTML = `<h4>🎁 Rewards Unlocked!</h4>${rewardHtml}`;
            element.style.display = 'block';
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
    
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
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

