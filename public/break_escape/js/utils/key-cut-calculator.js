/**
 * KeyCutCalculator
 * 
 * Utility for calculating key cut depths based on key pin lengths
 * Uses the geometric formula: cutDepth = keyPinLength - gapFromKeyBladeTopToShearLine
 * 
 * The gap of 20px accounts for:
 * - Key blade top at Y=175 (keyway center 230 - blade height/2 55)
 * - Shear line at Y=155 (pin container 200 - shear line local -45)
 * - Gap = 175 - 155 = 20px
 */
export class KeyCutCalculator {
    
    // The geometric gap between key blade top and shear line
    static GAP_FROM_KEY_BLADE_TOP_TO_SHEAR_LINE = 20;
    
    // Maximum key blade height (constraint)
    static MAX_KEY_BLADE_HEIGHT = 110;
    
    // Minimum cut depth
    static MIN_CUT_DEPTH = 0;
    
    /**
     * Calculate cut depth for a single key pin
     * @param {number} keyPinLength - Height of the key pin in pixels
     * @returns {number} Cut depth in pixels, clamped to valid range
     */
    static calculateCutDepth(keyPinLength) {
        const cutDepth = keyPinLength - this.GAP_FROM_KEY_BLADE_TOP_TO_SHEAR_LINE;
        return Math.max(
            this.MIN_CUT_DEPTH,
            Math.min(this.MAX_KEY_BLADE_HEIGHT, cutDepth)
        );
    }
    
    /**
     * Calculate cut depths for an array of key pin lengths
     * @param {number[]} keyPinLengths - Array of key pin heights
     * @returns {number[]} Array of cut depths
     */
    static calculateCutDepths(keyPinLengths) {
        return keyPinLengths.map(keyPinLength => this.calculateCutDepth(keyPinLength));
    }
    
    /**
     * Calculate and round cut depths for an array of key pin lengths
     * @param {number[]} keyPinLengths - Array of key pin heights
     * @returns {number[]} Array of rounded cut depths
     */
    static calculateCutDepthsRounded(keyPinLengths) {
        return this.calculateCutDepths(keyPinLengths).map(depth => Math.round(depth));
    }
}

export default KeyCutCalculator;
