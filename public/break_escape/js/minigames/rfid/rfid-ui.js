/**
 * RFID UI Renderer
 *
 * Renders RFID Flipper-style RFID interface:
 * - Main menu (Read / Saved)
 * - Tap interface (unlock mode)
 * - Saved cards list
 * - Emulation screen
 * - Card reading screen (clone mode)
 * - Card data display
 * - Protocol-specific displays for all supported protocols
 *
 * @module rfid-ui
 */

import { getProtocolInfo, detectProtocol } from './rfid-protocols.js';

export class RFIDUIRenderer {
    constructor(minigame) {
        this.minigame = minigame;
        this.container = minigame.gameContainer;
        this.dataManager = minigame.dataManager;
        console.log('🎨 RFIDUIRenderer initialized');
    }

    /**
     * Create unlock mode interface
     */
    createUnlockInterface() {
        this.clear();

        // Create RFID Flipper frame
        const flipper = this.createFlipperFrame();

        // Append to container first so screen element is in the DOM
        this.container.appendChild(flipper);

        // Show main menu
        this.showMainMenu('unlock');
    }

    /**
     * Create clone mode interface
     */
    createCloneInterface() {
        this.clear();

        // Create RFID Flipper frame
        const flipper = this.createFlipperFrame();

        // Append to container first so screen element is in the DOM
        this.container.appendChild(flipper);

        // Auto-start reading if card provided
        if (this.minigame.params.cardToClone) {
            this.showReadingScreen();
        } else {
            this.showMainMenu('clone');
        }
    }

    /**
     * Create RFID Flipper device frame
     * @returns {HTMLElement} Flipper frame element
     */
    createFlipperFrame() {
        const frame = document.createElement('div');
        frame.className = 'flipper-zero-frame';

        // Header with logo and battery
        const header = document.createElement('div');
        header.className = 'flipper-header';

        // Logo
        const logo = document.createElement('div');
        logo.className = 'flipper-logo';
        logo.textContent = 'RFID FLIPPER';

        const battery = document.createElement('div');
        battery.className = 'flipper-battery';
        battery.textContent = '⚡ 100%';

        header.appendChild(logo);
        header.appendChild(battery);

        // Screen container
        const screen = document.createElement('div');
        screen.className = 'flipper-screen';
        screen.id = 'rfid-screen';

        frame.appendChild(header);
        frame.appendChild(screen);

        return frame;
    }

    /**
     * Get screen element
     * @returns {HTMLElement} Screen element
     */
    getScreen() {
        return document.getElementById('rfid-screen');
    }

    /**
     * Show main menu
     * @param {string} mode - 'unlock' or 'clone'
     */
    showMainMenu(mode) {
        const screen = this.getScreen();
        screen.innerHTML = '';

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID';
        screen.appendChild(breadcrumb);

        // Menu items
        const menu = document.createElement('div');
        menu.className = 'flipper-menu';

        if (mode === 'unlock') {
            // Read option (tap cards)
            const readOption = document.createElement('div');
            readOption.className = 'flipper-menu-item';
            readOption.textContent = '> Read';
            readOption.addEventListener('click', () => this.showTapInterface());
            menu.appendChild(readOption);

            // Saved option (emulate)
            const savedOption = document.createElement('div');
            savedOption.className = 'flipper-menu-item';
            savedOption.textContent = '  Saved';
            savedOption.addEventListener('click', () => this.showSavedCards());
            menu.appendChild(savedOption);
        } else {
            // Clone mode - just show "Reading..." message
            const info = document.createElement('div');
            info.className = 'flipper-info';
            info.textContent = 'Place card...';
            menu.appendChild(info);
        }

        screen.appendChild(menu);
    }

    /**
     * Show tap interface for unlock mode
     */
    showTapInterface() {
        const screen = this.getScreen();
        screen.innerHTML = '';

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Read';
        screen.appendChild(breadcrumb);

        // NFC waves animation
        const waves = document.createElement('div');
        waves.className = 'rfid-nfc-waves-container';
        waves.innerHTML = '<div class="rfid-nfc-icon">📡</div>';
        screen.appendChild(waves);

        // Instruction
        const instruction = document.createElement('div');
        instruction.className = 'flipper-info';
        instruction.textContent = 'Place card near reader...';
        screen.appendChild(instruction);

        // List available keycards
        const cardList = document.createElement('div');
        cardList.className = 'flipper-card-list';

        const availableCards = this.minigame.params.availableCards || [];

        if (availableCards.length === 0) {
            const noCards = document.createElement('div');
            noCards.className = 'flipper-info-dim';
            noCards.textContent = 'No keycards in inventory';
            cardList.appendChild(noCards);
        } else {
            availableCards.forEach(card => {
                const cardItem = document.createElement('div');
                cardItem.className = 'flipper-menu-item';
                cardItem.textContent = `> ${card.scenarioData?.name || 'Keycard'}`;
                cardItem.addEventListener('click', () => {
                    this.minigame.handleCardTap(card);
                });
                cardList.appendChild(cardItem);
            });
        }

        screen.appendChild(cardList);

        // Back button
        const back = document.createElement('div');
        back.className = 'flipper-button-back';
        back.textContent = '← Back';
        back.addEventListener('click', () => this.showMainMenu('unlock'));
        screen.appendChild(back);
    }

    /**
     * Show saved cards list
     */
    showSavedCards() {
        const screen = this.getScreen();
        screen.innerHTML = '';

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Saved';
        screen.appendChild(breadcrumb);

        // Get saved cards
        const savedCards = this.dataManager.getSavedCards();

        if (savedCards.length === 0) {
            const noCards = document.createElement('div');
            noCards.className = 'flipper-info';
            noCards.textContent = 'No saved cards';
            screen.appendChild(noCards);
        } else {
            // Card list
            const cardList = document.createElement('div');
            cardList.className = 'flipper-card-list';

            savedCards.forEach(card => {
                const cardItem = document.createElement('div');
                cardItem.className = 'flipper-menu-item';
                cardItem.textContent = `> ${card.name}`;
                cardItem.addEventListener('click', () => this.showCardDetails(card));
                cardList.appendChild(cardItem);
            });

            screen.appendChild(cardList);
        }

        // Back button
        const back = document.createElement('div');
        back.className = 'flipper-button-back';
        back.textContent = '← Back';
        back.addEventListener('click', () => this.showMainMenu('unlock'));
        screen.appendChild(back);
    }

    /**
     * Show card details with Emulate button
     * @param {Object} card - Card to display
     */
    showCardDetails(card) {
        const screen = this.getScreen();
        screen.innerHTML = '';

        const displayData = this.dataManager.getCardDisplayData(card);

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Saved > Details';
        screen.appendChild(breadcrumb);

        // Card icon
        const icon = document.createElement('div');
        icon.className = 'rfid-emulate-icon';
        icon.textContent = '🔑';
        screen.appendChild(icon);

        // Protocol with color indicator
        const protocolDiv = document.createElement('div');
        protocolDiv.className = 'flipper-info';
        protocolDiv.style.borderLeft = `4px solid ${displayData.color}`;
        protocolDiv.style.paddingLeft = '8px';
        protocolDiv.innerHTML = `${displayData.icon} ${displayData.protocolName}`;
        screen.appendChild(protocolDiv);

        // Card name
        const name = document.createElement('div');
        name.className = 'flipper-card-name';
        name.textContent = card.name || 'Card';
        screen.appendChild(name);

        // Card data fields
        const data = document.createElement('div');
        data.className = 'flipper-card-data';

        // Show first 3 fields (most relevant for emulation)
        displayData.fields.slice(0, 3).forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.innerHTML = `${field.label}: ${field.value}`;
            data.appendChild(fieldDiv);
        });

        screen.appendChild(data);

        // Emulate button
        const emulateBtn = document.createElement('div');
        emulateBtn.className = 'flipper-menu-item';
        emulateBtn.textContent = '> Emulate';
        emulateBtn.addEventListener('click', () => this.showEmulationScreen(card));
        screen.appendChild(emulateBtn);

        // Back button
        const back = document.createElement('div');
        back.className = 'flipper-button-back';
        back.textContent = '← Back';
        back.addEventListener('click', () => this.showSavedCards());
        screen.appendChild(back);
    }

    /**
     * Show emulation screen (supports all protocols)
     * @param {Object} card - Card to emulate
     */
    showEmulationScreen(card) {
        const screen = this.getScreen();
        screen.innerHTML = '';

        // Get protocol-specific display data
        const displayData = this.dataManager.getCardDisplayData(card);

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Saved > Emulating';
        screen.appendChild(breadcrumb);

        // Emulation icon
        const icon = document.createElement('div');
        icon.className = 'rfid-emulate-icon';
        icon.textContent = '📡';
        screen.appendChild(icon);

        // Protocol with color indicator
        const protocolDiv = document.createElement('div');
        protocolDiv.className = 'flipper-info';
        protocolDiv.style.borderLeft = `4px solid ${displayData.color}`;
        protocolDiv.style.paddingLeft = '8px';
        protocolDiv.innerHTML = `${displayData.icon} ${displayData.protocolName}`;
        screen.appendChild(protocolDiv);

        // Card name
        const name = document.createElement('div');
        name.className = 'flipper-card-name';
        name.textContent = card.name || 'Card';
        screen.appendChild(name);

        // Card data fields
        const data = document.createElement('div');
        data.className = 'flipper-card-data';

        // Show first 3 fields (most relevant for emulation)
        displayData.fields.slice(0, 3).forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.innerHTML = `${field.label}: ${field.value}`;
            data.appendChild(fieldDiv);
        });

        screen.appendChild(data);

        // Emulating message
        const emulating = document.createElement('div');
        emulating.className = 'flipper-emulating';
        if (displayData.protocol === 'MIFARE_DESFire' && !card.rfid_data?.masterKeyKnown) {
            emulating.textContent = 'Emulating UID only...';
        } else {
            emulating.textContent = 'Emulating...';
        }
        screen.appendChild(emulating);

        // Trigger emulation after showing screen
        setTimeout(() => {
            this.minigame.handleEmulate(card);
        }, 500);
    }

    /**
     * Show protocol information screen with attack options
     * @param {Object} cardData - Card data to display protocol info for
     */
    showProtocolInfo(cardData) {
        const screen = this.getScreen();
        screen.innerHTML = '';

        const displayData = this.dataManager.getCardDisplayData(cardData);
        const protocol = displayData.protocol;

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Info';
        screen.appendChild(breadcrumb);

        // Protocol header with icon and color
        const header = document.createElement('div');
        header.className = 'flipper-protocol-header';
        header.style.borderLeft = `4px solid ${displayData.color}`;
        header.innerHTML = `
            <div class="protocol-header-top">
                <span class="protocol-icon">${displayData.icon}</span>
                <span class="protocol-name">${displayData.protocolName}</span>
            </div>
            <div class="protocol-meta">
                <span>${displayData.frequency}</span>
                <span class="security-badge security-${displayData.security}">
                    ${displayData.security.toUpperCase()}
                </span>
            </div>
        `;
        screen.appendChild(header);

        // Security note
        if (displayData.securityNote) {
            const note = document.createElement('div');
            note.className = 'flipper-info';
            note.textContent = displayData.securityNote;
            screen.appendChild(note);
        }

        // Card data fields
        const dataDiv = document.createElement('div');
        dataDiv.className = 'flipper-card-data';
        displayData.fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.innerHTML = `<strong>${field.label}:</strong> ${field.value}`;
            dataDiv.appendChild(fieldDiv);
        });
        screen.appendChild(dataDiv);

        // Actions based on protocol
        const actions = document.createElement('div');
        actions.className = 'flipper-menu';
        actions.style.marginTop = '20px';

        if (protocol === 'MIFARE_Classic_Weak_Defaults') {
            const keysKnown = cardData.rfid_data?.sectors ?
                Object.keys(cardData.rfid_data.sectors).length : 0;

            if (keysKnown === 0) {
                // Suggest dictionary first
                const dictBtn = document.createElement('div');
                dictBtn.className = 'flipper-menu-item';
                dictBtn.textContent = '> Dictionary Attack (instant)';
                dictBtn.addEventListener('click', () =>
                    this.minigame.startKeyAttack('dictionary', cardData));
                actions.appendChild(dictBtn);
            } else if (keysKnown < 16) {
                // Some keys found
                const nestedBtn = document.createElement('div');
                nestedBtn.className = 'flipper-menu-item';
                nestedBtn.textContent = `> Nested Attack (${16 - keysKnown} sectors)`;
                nestedBtn.addEventListener('click', () =>
                    this.minigame.startKeyAttack('nested', cardData));
                actions.appendChild(nestedBtn);
            } else {
                // All keys - can clone
                const readBtn = document.createElement('div');
                readBtn.className = 'flipper-menu-item';
                readBtn.textContent = '> Read & Clone';
                readBtn.addEventListener('click', () =>
                    this.showCardDataScreen(cardData));
                actions.appendChild(readBtn);
            }

        } else if (protocol === 'MIFARE_Classic_Custom_Keys') {
            const keysKnown = cardData.rfid_data?.sectors ?
                Object.keys(cardData.rfid_data.sectors).length : 0;

            if (keysKnown === 0) {
                // No keys - suggest Darkside
                const darksideBtn = document.createElement('div');
                darksideBtn.className = 'flipper-menu-item';
                darksideBtn.textContent = '> Darkside Attack (~30 sec)';
                darksideBtn.addEventListener('click', () =>
                    this.minigame.startKeyAttack('darkside', cardData));
                actions.appendChild(darksideBtn);

                // Dictionary unlikely but allow try
                const dictBtn = document.createElement('div');
                dictBtn.className = 'flipper-menu-item flipper-menu-item-dim';
                dictBtn.textContent = '  Dictionary Attack (unlikely)';
                dictBtn.addEventListener('click', () =>
                    this.minigame.startKeyAttack('dictionary', cardData));
                actions.appendChild(dictBtn);
            } else if (keysKnown < 16) {
                // Some keys - nested attack
                const nestedBtn = document.createElement('div');
                nestedBtn.className = 'flipper-menu-item';
                nestedBtn.textContent = `> Nested Attack (~10 sec)`;
                nestedBtn.addEventListener('click', () =>
                    this.minigame.startKeyAttack('nested', cardData));
                actions.appendChild(nestedBtn);
            } else {
                // All keys
                const readBtn = document.createElement('div');
                readBtn.className = 'flipper-menu-item';
                readBtn.textContent = '> Read & Clone';
                readBtn.addEventListener('click', () =>
                    this.showCardDataScreen(cardData));
                actions.appendChild(readBtn);
            }

        } else if (protocol === 'MIFARE_DESFire') {
            // UID only
            const uidBtn = document.createElement('div');
            uidBtn.className = 'flipper-menu-item';
            uidBtn.textContent = '> Save UID Only';
            uidBtn.addEventListener('click', () =>
                this.showCardDataScreen(cardData));
            actions.appendChild(uidBtn);

        } else {
            // EM4100 - instant
            const readBtn = document.createElement('div');
            readBtn.className = 'flipper-menu-item';
            readBtn.textContent = '> Read & Clone';
            readBtn.addEventListener('click', () =>
                this.showReadingScreen());
            actions.appendChild(readBtn);
        }

        const cancelBtn = document.createElement('div');
        cancelBtn.className = 'flipper-button-back';
        cancelBtn.textContent = '← Cancel';
        cancelBtn.addEventListener('click', () => this.minigame.complete(false));
        actions.appendChild(cancelBtn);

        screen.appendChild(actions);
    }

    /**
     * Show card reading screen (clone mode)
     */
    showReadingScreen() {
        const screen = this.getScreen();
        screen.innerHTML = '';

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Read';
        screen.appendChild(breadcrumb);

        // Status
        const status = document.createElement('div');
        status.className = 'flipper-info';
        status.textContent = 'Reading 1/2';
        screen.appendChild(status);

        // Modulation
        const modulation = document.createElement('div');
        modulation.className = 'flipper-info-dim';
        modulation.textContent = '> ASK   PSK';
        screen.appendChild(modulation);

        // Instruction
        const instruction = document.createElement('div');
        instruction.className = 'flipper-info';
        instruction.textContent = "Don't move card...";
        screen.appendChild(instruction);

        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'rfid-progress-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'rfid-progress-bar';
        progressBar.id = 'rfid-progress-bar';

        progressContainer.appendChild(progressBar);
        screen.appendChild(progressContainer);

        // Start reading animation
        this.minigame.startCardReading();
    }

    /**
     * Update reading progress
     * @param {number} progress - Progress percentage (0-100)
     */
    updateReadingProgress(progress) {
        const progressBar = document.getElementById('rfid-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;

            // Change color based on progress
            if (progress < 50) {
                progressBar.style.backgroundColor = '#FF8200';
            } else if (progress < 100) {
                progressBar.style.backgroundColor = '#FFA500';
            } else {
                progressBar.style.backgroundColor = '#00FF00';
            }
        }
    }

    /**
     * Show card data screen after reading (supports all protocols)
     * @param {Object} cardData - Read card data
     */
    showCardDataScreen(cardData) {
        const screen = this.getScreen();
        screen.innerHTML = '';

        // Get protocol-specific display data
        const displayData = this.dataManager.getCardDisplayData(cardData);

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Read';
        screen.appendChild(breadcrumb);

        // Protocol header
        const protocolHeader = document.createElement('div');
        protocolHeader.className = 'flipper-protocol-header';
        protocolHeader.style.borderLeft = `4px solid ${displayData.color}`;
        protocolHeader.innerHTML = `
            <div class="protocol-header-top">
                <span class="protocol-icon">${displayData.icon}</span>
                <span class="protocol-name">${displayData.protocolName}</span>
            </div>
            <div class="protocol-meta">
                <span>${displayData.frequency}</span>
                <span class="security-badge security-${displayData.security}">
                    ${displayData.security.toUpperCase()}
                </span>
            </div>
        `;
        screen.appendChild(protocolHeader);

        // Security note (if applicable)
        // A keyless MIFARE read shows the crack hint instead (keeps the buttons on screen).
        const keyless = !this.dataManager.canClone(cardData);
        if (displayData.securityNote && !keyless) {
            const note = document.createElement('div');
            note.className = 'flipper-info';
            note.textContent = displayData.securityNote;
            screen.appendChild(note);
        }

        // Card data fields
        const data = document.createElement('div');
        data.className = keyless ? 'flipper-card-data flipper-card-data-compact' : 'flipper-card-data';
        displayData.fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.innerHTML = `<strong>${field.label}:</strong> ${field.value}`;
            data.appendChild(fieldDiv);
        });

        // For EM4100, add checksum (legacy)
        if (displayData.protocol === 'EM4100') {
            const hex = cardData.rfid_data?.hex || cardData.rfid_hex;
            if (hex) {
                const checksum = this.dataManager.calculateChecksum(hex);
                const checksumDiv = document.createElement('div');
                checksumDiv.innerHTML = `<strong>Checksum:</strong> 0x${checksum.toString(16).toUpperCase().padStart(2, '0')}`;
                data.appendChild(checksumDiv);
            }
        }

        screen.appendChild(data);

        // Buttons
        const buttons = document.createElement('div');
        buttons.className = 'flipper-buttons';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'flipper-button';
        if (keyless) {
            // MIFARE Classic with no keys: no plain Save, point at the attack menu.
            const why = document.createElement('div');
            why.className = 'flipper-info flipper-crack-hint';
            why.textContent = 'Sector keys protect the data. Weak default keys fall to a dictionary attack; custom keys need Darkside or Nested.';
            screen.appendChild(why);
            saveBtn.textContent = 'Crack keys first';
            saveBtn.addEventListener('click', () => this.showProtocolInfo(cardData));
        } else {
            saveBtn.textContent = displayData.protocol === 'MIFARE_DESFire' ? 'Save UID' : 'Save';
            saveBtn.addEventListener('click', () => this.minigame.handleSaveCard(cardData));
        }

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'flipper-button flipper-button-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => this.minigame.complete(false));

        buttons.appendChild(saveBtn);
        buttons.appendChild(cancelBtn);
        screen.appendChild(buttons);
    }

    /**
     * Show attack progress screen
     * @param {Object} data - Attack data {type, progress, currentSector, etc.}
     */
    showAttackProgress(data) {
        const screen = this.getScreen();
        screen.innerHTML = '';

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = `RFID > ${data.type} Attack`;
        screen.appendChild(breadcrumb);

        // Attack type
        const type = document.createElement('div');
        type.className = 'flipper-info';
        type.textContent = `${data.type} Attack`;
        type.style.fontSize = '18px';
        type.style.marginBottom = '10px';
        screen.appendChild(type);

        // Status
        const status = document.createElement('div');
        status.className = 'flipper-info-dim';
        status.id = 'attack-status';
        if (data.currentSector !== undefined) {
            status.textContent = `Sector ${data.currentSector}/${data.totalSectors || 16}`;
        } else if (data.sectorsRemaining !== undefined) {
            status.textContent = `${data.sectorsRemaining} sectors remaining`;
        } else {
            status.textContent = 'Working...';
        }
        screen.appendChild(status);

        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'rfid-progress-container';
        progressContainer.style.marginTop = '20px';

        const progressBar = document.createElement('div');
        progressBar.className = 'rfid-progress-bar';
        progressBar.id = 'attack-progress-bar';
        progressBar.style.width = `${data.progress || 0}%`;

        progressContainer.appendChild(progressBar);
        screen.appendChild(progressContainer);

        // Percentage
        const percentage = document.createElement('div');
        percentage.className = 'flipper-info';
        percentage.id = 'attack-percentage';
        percentage.textContent = `${Math.floor(data.progress || 0)}%`;
        percentage.style.textAlign = 'center';
        percentage.style.marginTop = '10px';
        screen.appendChild(percentage);
    }

    /**
     * Update attack progress
     * @param {Object} data - Progress data
     */
    updateAttackProgress(data) {
        const progressBar = document.getElementById('attack-progress-bar');
        const status = document.getElementById('attack-status');
        const percentage = document.getElementById('attack-percentage');

        if (progressBar) {
            progressBar.style.width = `${data.progress}%`;

            // Change color based on progress
            if (data.progress < 50) {
                progressBar.style.backgroundColor = '#FF8200';
            } else if (data.progress < 100) {
                progressBar.style.backgroundColor = '#FFA500';
            } else {
                progressBar.style.backgroundColor = '#00FF00';
            }
        }

        if (status) {
            if (data.currentSector !== undefined) {
                status.textContent = `Sector ${data.currentSector}/${data.totalSectors || 16}`;
            } else if (data.sectorsRemaining !== undefined) {
                status.textContent = `${data.sectorsRemaining} sectors remaining`;
            }
        }

        if (percentage) {
            percentage.textContent = `${Math.floor(data.progress)}%`;
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        const screen = this.getScreen();
        screen.innerHTML = '';

        const success = document.createElement('div');
        success.className = 'flipper-success';
        success.innerHTML = `
            <div class="flipper-success-icon">✓</div>
            <div class="flipper-success-message">${message}</div>
        `;
        screen.appendChild(success);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const screen = this.getScreen();
        screen.innerHTML = '';

        const error = document.createElement('div');
        error.className = 'flipper-error';
        error.innerHTML = `
            <div class="flipper-error-icon">✗</div>
            <div class="flipper-error-message">${message}</div>
        `;
        screen.appendChild(error);
    }

    /**
     * Clear screen
     */
    clear() {
        this.container.innerHTML = '';
    }
}
