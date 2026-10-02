import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

export class BleScannerMinigame extends MinigameScene {
    constructor(container, params) {
        params = params || {};
        if (!params.title) params.title = 'BLE Scanner';
        params.showCancel = true;
        params.cancelText = 'Close Scanner';
        super(container, params);

        this.item = params.item;
        this.bleDevices = [];
        this.selectedDevice = null;
        this.lastPanelUpdate = 0;
        this.scanInterval = null;

        this.BLE_SCAN_RANGE = 150;
        this.BLE_SCAN_INTERVAL = 200;
        this.UPDATE_THROTTLE = 100;
    }

    init() {
        super.init();
        this.container.className += ' ble-scanner-minigame-container';
        this.headerElement.innerHTML = '';
        this.gameContainer.className += ' ble-scanner-minigame-game-container';
        this.createScannerInterface();
        this.initializeBleDevices();
    }

    createScannerInterface() {
        const header = document.createElement('div');
        header.className = 'ble-scanner-header';
        header.innerHTML = `
            <div class="ble-scanner-title">
                <img src="/break_escape/assets/objects/bluetooth_scanner.png" alt="BLE Scanner" class="ble-scanner-icon">
                <span>BLE Scanner</span>
            </div>
            <div class="ble-scanner-status">
                <div class="ble-scanner-indicator active"></div>
                <span>Scanning...</span>
            </div>
        `;

        const controls = document.createElement('div');
        controls.className = 'ble-scanner-controls';
        controls.innerHTML = `
            <div class="ble-search-container">
                <input type="text" id="ble-search" placeholder="Search devices..." class="ble-search-input">
            </div>
            <div class="ble-categories">
                <div class="ble-category active" data-category="all">All</div>
                <div class="ble-category" data-category="nearby">Nearby</div>
                <div class="ble-category" data-category="saved">Saved</div>
                <div class="ble-category" data-category="targets">Targets</div>
                <div class="ble-category" data-category="paired">Paired</div>
            </div>
        `;

        const listContainer = document.createElement('div');
        listContainer.className = 'ble-device-list-container';
        listContainer.innerHTML = `
            <div class="ble-device-list-header">
                <span>Detected Devices</span>
                <div class="ble-device-count">0 devices</div>
            </div>
            <div class="ble-device-list" id="ble-device-list"></div>
        `;

        const actionPanel = document.createElement('div');
        actionPanel.className = 'ble-action-panel';
        actionPanel.id = 'ble-action-panel';
        actionPanel.style.display = 'none';
        actionPanel.innerHTML = `
            <div class="ble-action-header">
                <span id="ble-action-title">No target selected</span>
                <button class="ble-clear-target-btn" id="ble-clear-target">✕ Clear</button>
            </div>
            <div class="ble-action-target-info" id="ble-action-info"></div>
            <div class="ble-action-section" id="ble-pin-section" style="display:none">
                <div class="ble-action-section-label">PIN Pairing</div>
                <div class="ble-attempts-remaining" id="ble-attempts-remaining">Attempts remaining: 3</div>
                <div class="ble-pin-entry">
                    <input type="text" id="ble-pin-input" class="ble-pin-input" placeholder="Enter PIN..." maxlength="16">
                    <button class="ble-pin-btn" id="ble-pin-submit">Try PIN</button>
                </div>
            </div>
            <div class="ble-action-section" id="ble-handshake-section" style="display:none">
                <div class="ble-action-section-label">Handshake Replay</div>
                <textarea class="ble-handshake-input" id="ble-handshake-input" placeholder="Paste captured handshake here..."></textarea>
                <button class="ble-replay-btn" id="ble-replay-btn">Replay Handshake</button>
            </div>
            <div class="ble-action-feedback" id="ble-action-feedback"></div>
        `;

        const hintPanel = document.createElement('div');
        hintPanel.className = 'ble-hint-panel';
        hintPanel.id = 'ble-hint-panel';
        hintPanel.style.display = 'none';
        hintPanel.innerHTML = `<div class="ble-hint-text" id="ble-hint-text"></div>`;

        this.gameContainer.appendChild(header);
        this.gameContainer.appendChild(controls);
        this.gameContainer.appendChild(listContainer);
        this.gameContainer.appendChild(actionPanel);
        this.gameContainer.appendChild(hintPanel);

        this.actionPanelEl = actionPanel;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const searchInput = this.gameContainer.querySelector('#ble-search');
        if (searchInput) {
            this.addEventListener(searchInput, 'input', () => this.updatePanel());
            this.addEventListener(searchInput, 'keydown', (e) => e.stopPropagation());
            this.addEventListener(searchInput, 'keyup', (e) => e.stopPropagation());
        }

        const categories = this.gameContainer.querySelectorAll('.ble-category');
        categories.forEach(cat => {
            this.addEventListener(cat, 'click', () => {
                categories.forEach(c => c.classList.remove('active'));
                cat.classList.add('active');
                this.updatePanel();
            });
        });

        const clearBtn = this.gameContainer.querySelector('#ble-clear-target');
        if (clearBtn) {
            this.addEventListener(clearBtn, 'click', () => this.clearTarget());
        }

        const pinInput = this.gameContainer.querySelector('#ble-pin-input');
        if (pinInput) {
            this.addEventListener(pinInput, 'keydown', (e) => {
                e.stopPropagation();
                if (e.key === 'Enter') this.submitPinInput();
            });
            this.addEventListener(pinInput, 'keyup', (e) => e.stopPropagation());
        }

        const pinSubmit = this.gameContainer.querySelector('#ble-pin-submit');
        if (pinSubmit) {
            this.addEventListener(pinSubmit, 'click', () => this.submitPinInput());
        }

        const handshakeInput = this.gameContainer.querySelector('#ble-handshake-input');
        if (handshakeInput) {
            this.addEventListener(handshakeInput, 'keydown', (e) => e.stopPropagation());
            this.addEventListener(handshakeInput, 'keyup', (e) => e.stopPropagation());
        }

        const replayBtn = this.gameContainer.querySelector('#ble-replay-btn');
        if (replayBtn) {
            this.addEventListener(replayBtn, 'click', () => {
                const text = this.gameContainer.querySelector('#ble-handshake-input')?.value || '';
                this.replayHandshake(text);
            });
        }
    }

    initializeBleDevices() {
        this.bleDevices = window.gameState?.bleDevices
            ? [...window.gameState.bleDevices]
            : [];
        // Targeting is a live UI state, not persistent — reset on every open
        this.bleDevices.forEach(d => { d.targeted = false; });

        // Restore _scenarioData immediately from live room objects so the action
        // panel renders correctly before the first scan tick
        const roomObjects = window.currentPlayerRoom
            ? Object.values(window.rooms?.[window.currentPlayerRoom]?.objects || {})
            : [];
        this.bleDevices.forEach(d => {
            const match = roomObjects.find(o =>
                o.scenarioData?.lockType === 'ble' && o.scenarioData?.mac === d.mac
            );
            if (match) d._scenarioData = match.scenarioData;
        });

        this.updatePanel();
    }

    startScanning() {
        this.scanInterval = setInterval(() => this.checkBleDevices(), this.BLE_SCAN_INTERVAL);
    }

    stopScanning() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
    }

    checkBleDevices() {
        if (!window.currentPlayerRoom || !window.rooms?.[window.currentPlayerRoom]?.objects) return;
        const room = window.rooms[window.currentPlayerRoom];
        const player = window.player;
        if (!player) return;

        const detected = new Set();
        let needsUpdate = false;

        Object.values(room.objects).forEach(obj => {
            if (obj.scenarioData?.lockType !== 'ble') return;

            const dist = Math.hypot(player.x - obj.x, player.y - obj.y);
            const mac = obj.scenarioData?.mac || 'Unknown';
            const name = obj.scenarioData?.name || 'Unknown Device';
            const uuids = obj.scenarioData?.uuids || [];

            if (dist <= this.BLE_SCAN_RANGE) {
                detected.add(mac);
                const pct = Math.max(0, Math.round(100 - (dist / this.BLE_SCAN_RANGE * 100)));
                const dbm = Math.round(-100 + (pct * 0.7));

                const existing = this.bleDevices.find(d => d.mac === mac);
                if (existing) {
                    const changed = !existing.nearby || Math.abs(existing.signalStrengthPercentage - pct) > 5;
                    existing.nearby = true;
                    existing.signalStrength = dbm;
                    existing.signalStrengthPercentage = pct;
                    existing.lastSeen = new Date();
                    existing._scenarioData = obj.scenarioData;
                    if (changed) needsUpdate = true;
                } else {
                    this.addBleDevice(name, mac, uuids, true, obj.scenarioData);
                    needsUpdate = true;
                }
            }
        });

        this.bleDevices.forEach(d => {
            if (d.nearby && !detected.has(d.mac)) {
                d.nearby = false;
                d.lastSeen = new Date();
                needsUpdate = true;
            }
        });

        if (needsUpdate) {
            this.syncBleDevices();
            const now = Date.now();
            if (now - this.lastPanelUpdate > this.UPDATE_THROTTLE) {
                this.updatePanel();
                this.lastPanelUpdate = now;
            }
        }

        // Auto-target the object that launched this minigame, once it appears in scan results
        if (this.params.preselectTarget && !this.selectedDevice) {
            const mac = this.params.preselectTarget.scenarioData?.mac;
            const match = this.bleDevices.find(d => d.mac === mac);
            if (match) this.selectTarget(match);
        }
    }

    addBleDevice(name, mac, uuids, nearby, scenarioData) {
        if (this.bleDevices.some(d => d.mac === mac)) return null;

        const device = {
            id: mac !== 'Unknown' ? mac : `ble_${Date.now()}`,
            name,
            mac,
            uuids: uuids || [],
            nearby,
            saved: false,
            targeted: false,
            paired: false,
            pinAttempts: 0,
            lastHandshakeAttempt: null,
            signalStrength: -100,
            signalStrengthPercentage: 0,
            firstSeen: new Date(),
            lastSeen: new Date(),
            inInventory: false,
            _scenarioData: scenarioData || {}
        };

        this.bleDevices.push(device);
        this.syncBleDevices();
        return device;
    }

    updatePanel() {
        const list = this.gameContainer.querySelector('#ble-device-list');
        if (!list) return;

        const searchTerm = (this.gameContainer.querySelector('#ble-search')?.value || '').toLowerCase();
        const activeCategory = this.gameContainer.querySelector('.ble-category.active')?.dataset.category || 'all';

        let devices = [...this.bleDevices];

        if (activeCategory === 'nearby') devices = devices.filter(d => d.nearby);
        else if (activeCategory === 'saved') devices = devices.filter(d => d.saved);
        else if (activeCategory === 'targets') devices = devices.filter(d => d.targeted);
        else if (activeCategory === 'paired') devices = devices.filter(d => d.paired);

        if (searchTerm) {
            devices = devices.filter(d =>
                d.name.toLowerCase().includes(searchTerm) ||
                d.mac.toLowerCase().includes(searchTerm) ||
                d.uuids.some(u => u.toLowerCase().includes(searchTerm))
            );
        }

        devices.sort((a, b) => {
            if (a.nearby !== b.nearby) return a.nearby ? -1 : 1;
            if (a.nearby && b.nearby) return b.signalStrength - a.signalStrength;
            return new Date(b.lastSeen) - new Date(a.lastSeen);
        });

        const countEl = this.gameContainer.querySelector('.ble-device-count');
        if (countEl) countEl.textContent = `${devices.length} device${devices.length !== 1 ? 's' : ''}`;

        list.innerHTML = '';

        if (devices.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'ble-device';
            empty.textContent = activeCategory !== 'all'
                ? `No ${activeCategory} devices found.`
                : 'No BLE devices detected. Walk near a BLE device.';
            list.appendChild(empty);
            return;
        }

        devices.forEach(device => list.appendChild(this.renderDeviceRow(device)));
    }

    renderDeviceRow(device) {
        const el = document.createElement('div');
        el.className = 'ble-device';
        el.dataset.id = device.id;
        if (device.targeted) el.classList.add('ble-device--targeted');
        if (device.paired) el.classList.add('ble-device--paired');

        const ts = new Date(device.lastSeen);
        const tsStr = `${ts.toLocaleDateString()} ${ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        let signalBars = '';
        if (device.nearby && typeof device.signalStrength === 'number') {
            const pct = device.signalStrengthPercentage || 0;
            const activeBars = Math.ceil(pct / 20);
            const color = pct >= 80 ? '#00cc00' : pct >= 50 ? '#cccc00' : '#cc5500';
            signalBars = `<div class="ble-signal-bar-container"><div class="ble-signal-bars">`;
            for (let i = 1; i <= 5; i++) {
                signalBars += `<div class="ble-signal-bar ${i <= activeBars ? 'active' : ''}" style="color:${color}"></div>`;
            }
            signalBars += `</div></div>`;
        }

        const statusIcons = [
            device.targeted ? '<span class="ble-device-icon" title="Targeted">🎯</span>' : '',
            device.paired   ? '<span class="ble-device-icon" title="Paired">✓</span>'  : '',
        ].join('');

        el.innerHTML = `
            <div class="ble-device-name">
                <span>${displayDashes(device.name)}</span>
                <div class="ble-device-icons">${signalBars}${statusIcons}</div>
            </div>
            <div class="ble-device-mac">MAC: ${device.mac}</div>
            ${device.uuids.length > 0 ? `<div class="ble-uuid-chips">${this.renderUuidChips(device.uuids)}</div>` : ''}
            <div class="ble-device-timestamp">Last seen: ${tsStr}</div>
        `;

        // Save button — separate DOM element so its click doesn't bubble to selectTarget
        const saveBtn = document.createElement('button');
        saveBtn.className = `ble-save-btn${device.saved ? ' ble-save-btn--saved' : ''}`;
        saveBtn.title = device.saved ? 'Saved' : 'Save device';
        saveBtn.textContent = '💾';
        el.querySelector('.ble-device-icons').prepend(saveBtn);
        this.addEventListener(saveBtn, 'click', (e) => {
            e.stopPropagation();
            device.saved = !device.saved;
            saveBtn.className = `ble-save-btn${device.saved ? ' ble-save-btn--saved' : ''}`;
            saveBtn.title = device.saved ? 'Saved' : 'Save device';
            if (window.playUISound) window.playUISound('card_scan');
            this.syncBleDevices();
        });

        this.addEventListener(el, 'click', () => {
            if (!device.paired) this.selectTarget(device);
        });

        return el;
    }

    renderUuidChips(uuids) {
        return uuids.map(uuid => {
            const display = uuid.length > 8 ? uuid.substring(0, 8) + '…' : uuid;
            return `<span class="ble-uuid-chip" title="${uuid}">${display}</span>`;
        }).join('');
    }

    selectTarget(device) {
        // If _scenarioData hasn't been restored by the scan loop yet (stale gameState load),
        // use preselectTarget directly — it's the same live Phaser object with full scenarioData
        if (!device._scenarioData?.lockType && this.params.preselectTarget?.scenarioData?.mac === device.mac) {
            device._scenarioData = this.params.preselectTarget.scenarioData;
        }
        this.bleDevices.forEach(d => { d.targeted = false; });
        device.targeted = true;
        this.selectedDevice = device;
        this.syncBleDevices();
        this.updatePanel();
        this.updateActionPanel(device);
        this.actionPanelEl.style.display = 'block';
    }

    clearTarget() {
        if (this.selectedDevice) this.selectedDevice.targeted = false;
        this.selectedDevice = null;
        this.params.preselectTarget = null;
        this.syncBleDevices();
        this.updatePanel();
        this.actionPanelEl.style.display = 'none';
    }

    updateActionPanel(device) {
        const sd = device._scenarioData || {};

        const titleEl = this.gameContainer.querySelector('#ble-action-title');
        if (titleEl) titleEl.textContent = displayDashes(`Target: ${device.name}`);

        const infoEl = this.gameContainer.querySelector('#ble-action-info');
        if (infoEl) {
            infoEl.innerHTML = `
                <div class="ble-action-mac">MAC: ${device.mac}</div>
                ${device.uuids.length > 0 ? `<div class="ble-uuid-chips">${this.renderUuidChips(device.uuids)}</div>` : ''}
            `;
        }

        const pinSection = this.gameContainer.querySelector('#ble-pin-section');
        if (pinSection) {
            const hasPins = sd.allowedPins?.length > 0;
            pinSection.style.display = hasPins ? 'block' : 'none';
            if (hasPins) {
                const maxAttempts = sd.maxPinAttempts ?? 3;
                const remaining = Math.max(0, maxAttempts - device.pinAttempts);
                const attemptsEl = this.gameContainer.querySelector('#ble-attempts-remaining');
                if (attemptsEl) attemptsEl.textContent = `Attempts remaining: ${remaining}`;
                if (device.pinAttempts >= maxAttempts || device.paired) this.disablePinButtons();
            }
        }

        const hsSection = this.gameContainer.querySelector('#ble-handshake-section');
        if (hsSection) {
            hsSection.style.display = sd.handshakeFingerprint ? 'block' : 'none';
        }

        const feedback = this.gameContainer.querySelector('#ble-action-feedback');
        if (feedback) {
            feedback.className = 'ble-action-feedback';
            feedback.textContent = '';
        }

        const hintPanel = this.gameContainer.querySelector('#ble-hint-panel');
        const hintText = this.gameContainer.querySelector('#ble-hint-text');
        if (hintPanel && hintText && sd.hintText) {
            hintText.textContent = displayDashes(sd.hintText);
            hintPanel.style.display = 'block';
        }

        if (device.paired) {
            this.showActionFeedback('✓ Device already paired', 'success');
            this.disablePinButtons();
        }
    }

    disablePinButtons() {
        const input = this.gameContainer.querySelector('#ble-pin-input');
        const submit = this.gameContainer.querySelector('#ble-pin-submit');
        if (input) { input.disabled = true; }
        if (submit) { submit.disabled = true; submit.classList.add('ble-btn--disabled'); }
    }

    submitPinInput() {
        const input = this.gameContainer.querySelector('#ble-pin-input');
        const pin = (input?.value || '').trim();
        if (!pin) {
            this.showActionFeedback('Enter a PIN first.', 'info');
            return;
        }
        this.attemptPin(pin);
        if (input) input.value = '';
    }

    attemptPin(pin) {
        const device = this.selectedDevice;
        if (!device || device.paired) return;

        const sd = device._scenarioData || {};
        const maxAttempts = sd.maxPinAttempts ?? 3;

        if (device.pinAttempts >= maxAttempts) {
            this.showActionFeedback('Max attempts reached. PIN entry locked.', 'failure');
            return;
        }

        device.pinAttempts++;
        this.syncBleDevices();

        const allowed = sd.allowedPins || [];

        if (allowed.includes(pin)) {
            this.handlePairingSuccess(device, `PIN ${pin}`);
        } else {
            const remaining = maxAttempts - device.pinAttempts;
            const msg = remaining > 0
                ? `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
                : 'Incorrect PIN. No attempts remaining.';
            this.handlePairingFailure(device, msg);
            const attemptsEl = this.gameContainer.querySelector('#ble-attempts-remaining');
            if (attemptsEl) attemptsEl.textContent = `Attempts remaining: ${remaining}`;
            if (device.pinAttempts >= maxAttempts) this.disablePinButtons();
        }
    }

    async replayHandshake(text) { // async for crypto.subtle
        const device = this.selectedDevice;
        if (!device || device.paired) return;

        const sd = device._scenarioData || {};
        if (!sd.handshakeFingerprint) {
            this.showActionFeedback('This device does not support handshake replay.', 'info');
            return;
        }

        if (!text.trim()) {
            this.showActionFeedback('Enter a handshake token first.', 'info');
            return;
        }

        const normalize = s => s.trim().toLowerCase().replace(/\s+/g, '');
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(normalize(text)));
        const hashHex = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        device.lastHandshakeAttempt = text;
        this.syncBleDevices();

        if (hashHex === sd.handshakeFingerprint.toLowerCase()) {
            this.handlePairingSuccess(device, 'handshake replay');
        } else {
            this.handlePairingFailure(device, 'Handshake mismatch. Token does not match captured fingerprint.');
        }
    }

    handlePairingSuccess(device, method) {
        device.paired = true;
        device.targeted = false;
        this.syncBleDevices();
        this.disablePinButtons();
        this.updatePanel();
        this.showActionFeedback(`✓ Paired via ${method}`, 'success');

        const sd = device._scenarioData || {};

        // Complete any task declared on the BLE object itself
        if (sd.completesTask && window.eventDispatcher) {
            window.eventDispatcher.emit('task_completed_by_npc', { taskId: sd.completesTask });
        }

        // Set any globals declared on the BLE object itself
        if (sd.onPairSetGlobal && window.gameState?.globalVariables) {
            Object.entries(sd.onPairSetGlobal).forEach(([key, value]) => {
                const oldValue = window.gameState.globalVariables[key];
                window.gameState.globalVariables[key] = value;
                if (window.eventDispatcher) {
                    window.eventDispatcher.emit(`global_variable_changed:${key}`, { name: key, value, oldValue });
                }
                if (window.npcConversationStateManager) {
                    window.npcConversationStateManager.broadcastGlobalVariableChange(key, value, null);
                }
            });
        }

        this._successTimeout = setTimeout(() => this.complete(true), 2000);
    }

    handlePairingFailure(device, reason) {
        this.showActionFeedback(reason, 'failure');
        this.actionPanelEl.classList.add('ble-action-panel--shake');
        setTimeout(() => this.actionPanelEl.classList.remove('ble-action-panel--shake'), 400);
    }

    showActionFeedback(message, type) {
        const el = this.gameContainer.querySelector('#ble-action-feedback');
        if (!el) return;
        el.className = `ble-action-feedback ble-feedback--${type}`;
        el.textContent = displayDashes(message);
    }

    syncBleDevices() {
        if (!window.gameState) window.gameState = {};
        window.gameState.bleDevices = this.bleDevices.map(({ _scenarioData, ...rest }) => rest);
    }

    start() {
        super.start();
        this.startScanning();
    }

    complete(success) {
        this.stopScanning();
        this.syncBleDevices();
        super.complete(success);
    }

    cleanup() {
        this.stopScanning();
        if (this._successTimeout) {
            clearTimeout(this._successTimeout);
            this._successTimeout = null;
        }
        super.cleanup();
    }
}

export function startBleScannerMinigame(item, extraParams) {
    if (window.MinigameFramework && !window.MinigameFramework.registeredScenes['ble-scanner']) {
        window.MinigameFramework.registerScene('ble-scanner', BleScannerMinigame);
    }

    if (!window.MinigameFramework.mainGameScene && item?.scene) {
        window.MinigameFramework.init(item.scene);
    }

    const params = {
        title: 'BLE Scanner',
        item,
        disableGameInput: false,
        onComplete: (success) => {
            console.log('BLE scanner minigame completed:', success);
        },
        ...(extraParams || {}),
    };

    window.MinigameFramework.startMinigame('ble-scanner', null, params);
}
