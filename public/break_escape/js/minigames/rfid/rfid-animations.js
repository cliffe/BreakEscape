/**
 * RFID Animations
 *
 * Handles animation effects for RFID minigame:
 * - Card reading progress animation
 * - Tap success/failure animations
 * - NFC wave animations
 * - Emulation success/failure animations
 *
 * @module rfid-animations
 */

export class RFIDAnimations {
    constructor(minigame) {
        this.minigame = minigame;
        this.activeIntervals = [];
        console.log('✨ RFIDAnimations initialized');
    }

    /**
     * Animate card reading progress
     * @param {Function} progressCallback - Called with progress (0-100)
     * @param {number} [durationMs=2500] - How long the read takes (an EM4100 ID is quicker)
     * @returns {Promise} Resolves when reading complete
     */
    animateReading(progressCallback, durationMs = 2500) {
        // 50 ms ticks; the step is sized so the bar fills in about durationMs
        const step = Math.max(2, Math.ceil(100 / Math.max(1, durationMs / 50)));
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress = Math.min(100, progress + step);
                progressCallback(progress);

                if (progress >= 100) {
                    clearInterval(interval);
                    this.activeIntervals = this.activeIntervals.filter(i => i !== interval);
                    resolve();
                }
            }, 50);

            this.activeIntervals.push(interval);
        });
    }

    /**
     * Show tap success animation
     */
    showTapSuccess() {
        console.log('✅ Tap success');
        // Visual feedback handled by UI layer
    }

    /**
     * Show tap failure animation
     */
    showTapFailure() {
        console.log('❌ Tap failure');
        // Visual feedback handled by UI layer
    }

    /**
     * Show emulation success animation
     */
    showEmulationSuccess() {
        console.log('✅ Emulation success');
        // Visual feedback handled by UI layer
    }

    /**
     * Show emulation failure animation
     */
    showEmulationFailure() {
        console.log('❌ Emulation failure');
        // Visual feedback handled by UI layer
    }

    /**
     * Animate NFC waves
     * @param {HTMLElement} container - Container element
     */
    animateNFCWaves(container) {
        // Create wave elements
        const waves = document.createElement('div');
        waves.className = 'rfid-nfc-waves';

        for (let i = 0; i < 3; i++) {
            const wave = document.createElement('div');
            wave.className = 'rfid-nfc-wave';
            wave.style.animationDelay = `${i * 0.3}s`;
            waves.appendChild(wave);
        }

        container.appendChild(waves);
        return waves;
    }

    /**
     * Clean up all active animations
     */
    cleanup() {
        this.activeIntervals.forEach(interval => clearInterval(interval));
        this.activeIntervals = [];
        console.log('🧹 RFIDAnimations cleanup complete');
    }
}
