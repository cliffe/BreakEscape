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

/**
 * Lab sheets are Jekyll pages that carry authoring metadata (description such as
 * "Hidden in-game field guide...", licence, an empty Tags line, the site header).
 * Their layout hides all of it when the URL has an `embedded` query parameter, so
 * the in-game popup must always ask for it (m01 blind playtest, item 4b).
 */
export function withEmbeddedParam(url) {
    if (typeof url !== 'string' || !url) return url;
    const hashAt = url.indexOf('#');
    const hash = hashAt >= 0 ? url.slice(hashAt) : '';
    const base = hashAt >= 0 ? url.slice(0, hashAt) : url;
    const qAt = base.indexOf('?');
    const query = qAt >= 0 ? base.slice(qAt + 1) : '';
    if (/(^|&)embedded(=|&|$)/.test(query)) return url;
    const sep = qAt < 0 ? '?' : (query === '' || base.endsWith('&') ? '' : '&');
    return `${base}${sep}embedded=1${hash}`;
}

/** The reverse of withEmbeddedParam: the full page, for "Open in new tab". */
export function withoutEmbeddedParam(url) {
    if (typeof url !== 'string' || !url) return url;
    const hashAt = url.indexOf('#');
    const hash = hashAt >= 0 ? url.slice(hashAt) : '';
    const base = hashAt >= 0 ? url.slice(0, hashAt) : url;
    const qAt = base.indexOf('?');
    if (qAt < 0) return url;
    const kept = base.slice(qAt + 1).split('&').filter(p => p !== '' && !/^embedded(=|$)/.test(p));
    return `${base.slice(0, qAt)}${kept.length ? '?' + kept.join('&') : ''}${hash}`;
}

// Open the lab workstation
export function openLabWorkstation(url) {
    url = withEmbeddedParam(url);
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
    // Toasts over the popup keep clear of its title bar and X (ui/hud-lanes.js, toast plan 2.8)
    window.hudLanesRelayout?.();
    
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

    // Barks held while the popup was open (npc-barks.js _shouldDefer)
    window.barkSystem?.drainDeferredBarks?.();
    // A held or queued call can ring or open now (phone calls plan 2.9)
    window.phoneRinger?.onPopupClosed?.();
    // Toasts placed over the popup go back to the lane (toast plan 2.8)
    window.hudLanesRelayout?.();
}

// Open the lab workstation iframe in a new tab
export function openLabWorkstationInNewTab() {
    const labFrame = document.getElementById('lab-frame');
    
    if (labFrame && labFrame.src) {
        window.open(withoutEmbeddedParam(labFrame.src), '_blank');
    }
}

