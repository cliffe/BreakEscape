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

// Open the crypto workstation
export function openCryptoWorkstation() {
    const laptopPopup = document.getElementById('laptop-popup');
    const cyberchefFrame = document.getElementById('cyberchef-frame');
    
    // Set the iframe source to the CyberChef HTML file
    cyberchefFrame.src = '/break_escape/assets/cyberchef/CyberChef_v10.19.4.html';
    
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
    const cyberchefFrame = document.getElementById('cyberchef-frame');
    
    // Hide the laptop popup
    laptopPopup.style.display = 'none';
    
    // Clear the iframe source
    cyberchefFrame.src = '';
    
    // Re-enable game input
    if (window.game && window.game.input) {
        window.game.input.mouse.enabled = true;
        window.game.input.keyboard.enabled = true;
    }
}

// Open the crypto workstation iframe in a new tab
export function openCryptoWorkstationInNewTab() {
    const cyberchefFrame = document.getElementById('cyberchef-frame');
    
    if (cyberchefFrame && cyberchefFrame.src) {
        window.open(cyberchefFrame.src, '_blank');
    }
} 