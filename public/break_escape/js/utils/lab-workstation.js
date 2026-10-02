// Lab workstation functionality - opens lab sheets in iframe
export function createLabWorkstation(objectData) {
    // Create the workstation sprite
    const workstationSprite = this.add.sprite(0, 0, 'workstation');
    workstationSprite.setVisible(false);
    workstationSprite.name = "lab-workstation";
    workstationSprite.scenarioData = objectData;
    workstationSprite.setInteractive({ useHandCursor: true });
    
    return workstationSprite;
}

// Open the lab workstation
export function openLabWorkstation(url) {
    const labPopup = document.getElementById('lab-popup');
    const labFrame = document.getElementById('lab-frame');
    
    if (!labPopup || !labFrame) {
        console.error('Lab workstation popup elements not found in DOM');
        return;
    }
    
    // Only set the iframe source if it's not already set or if it's different
    // This preserves scroll position when reopening
    if (!labFrame.src || labFrame.src !== url) {
        labFrame.src = url;
    }
    
    // Show the lab popup
    labPopup.style.display = 'block';
    
    // Disable game input while lab is open
    if (window.game && window.game.input) {
        window.game.input.mouse.enabled = false;
        window.game.input.keyboard.enabled = false;
    }
}

// Close the lab workstation
export function closeLabWorkstation() {
    const labPopup = document.getElementById('lab-popup');
    
    if (!labPopup) {
        return;
    }
    
    // Hide the lab popup (but don't clear iframe src to preserve scroll position)
    labPopup.style.display = 'none';
    
    // Re-enable game input
    if (window.game && window.game.input) {
        window.game.input.mouse.enabled = true;
        window.game.input.keyboard.enabled = true;
    }
}

// Open the lab workstation iframe in a new tab
export function openLabWorkstationInNewTab() {
    const labFrame = document.getElementById('lab-frame');
    
    if (labFrame && labFrame.src) {
        window.open(labFrame.src, '_blank');
    }
}

