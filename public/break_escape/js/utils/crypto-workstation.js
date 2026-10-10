// Crypto workstation functionality
export function createCryptoWorkstation(objectData) {
    // Create the workstation sprite
    const workstationSprite = this.add.sprite(0, 0, 'workstation');
    workstationSprite.setVisible(false);
    workstationSprite.name = "workstation";
    workstationSprite.scenarioData = objectData;
    workstationSprite.setInteractive({ useHandCursor: true });
    
    return workstationSprite;
}

const CYBERCHEF_PATH = '/break_escape/assets/cyberchef/CyberChef_v10.19.4.html';

// Open the crypto workstation
export function openCryptoWorkstation() {
    const laptopPopup = document.getElementById('laptop-popup');
    const cyberchefFrame = document.getElementById('cyberchef-frame');
    
    // Load CyberChef only the first time. Closing the laptop keeps the frame
    // loaded, so the player's recipe and input survive close and reopen.
    if (cyberchefFrame.getAttribute('src') !== CYBERCHEF_PATH) {
        cyberchefFrame.src = CYBERCHEF_PATH;
    }
    
    // Show the laptop popup
    laptopPopup.style.display = 'block';
    
    // Disable game input while laptop is open
    if (window.game && window.game.input) {
        window.game.input.mouse.enabled = false;
        window.game.input.keyboard.enabled = false;
    }
}

// Close the crypto workstation
export function closeLaptop() {
    const laptopPopup = document.getElementById('laptop-popup');
    // Hide the laptop popup
    laptopPopup.style.display = 'none';
    
    // Leave the iframe loaded (do not clear src) so the recipe and input persist.
    
    // Re-enable game input
    if (window.game && window.game.input) {
        window.game.input.mouse.enabled = true;
        window.game.input.keyboard.enabled = true;
    }
}

// Open the crypto workstation iframe in a new tab. CyberChef keeps the recipe
// and input in the URL hash, so opening the frame's live location carries them over.
export function openCryptoWorkstationInNewTab() {
    const cyberchefFrame = document.getElementById('cyberchef-frame');
    if (!cyberchefFrame) return;

    let url = CYBERCHEF_PATH;
    try {
        const live = cyberchefFrame.contentWindow && cyberchefFrame.contentWindow.location.href;
        if (live && live.indexOf(CYBERCHEF_PATH) !== -1) url = live;
    } catch (e) {
        // Cross-origin or not loaded: fall back to the base URL.
    }
    window.open(url, '_blank');
}
