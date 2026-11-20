
/**
 * KeyPathDrawing
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new KeyPathDrawing(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class KeyPathDrawing {
    
    constructor(parent) {
        this.parent = parent;
    }

    addTriangularSectionToPath(path, startX, startY, endX, endY, cutDepth, isLeftTriangle) {
        // Add a triangular section to the path
        // This creates the sloping effect between cuts
        
        const width = Math.abs(endX - startX);
        const stepSize = 4; // Consistent pixel size for steps
        const steps = Math.max(1, Math.floor(width / stepSize));
        
        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const x = startX + (endX - startX) * progress;
            
            let y;
            if (isLeftTriangle) {
                // Left triangle: height increases as we move toward the cut
                y = startY + (cutDepth * progress);
            } else {
                // Right triangle: height decreases as we move away from the cut
                y = startY + (cutDepth * (1 - progress));
            }
            
            path.points.push(new Phaser.Geom.Point(x, y));
        }
    }

    addFirstCutPeakToPath(path, startX, startY, endX, endY, startCutDepth, endCutDepth) {
        // Add a triangular peak from shoulder to first cut that touches the exact edge of the cut
        // This ensures proper alignment without affecting other peaks
        
        const width = Math.abs(endX - startX);
        const stepSize = 4; // Consistent pixel size for steps
        const steps = Math.max(1, Math.floor(width / stepSize));
        const halfSteps = Math.floor(steps / 2);
        
        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const x = startX + (endX - startX) * progress;
            
            let y;
            if (i <= halfSteps) {
                // First half: slope up from start cut depth to peak (blade top)
                const upProgress = i / halfSteps;
                y = startY + startCutDepth - (startCutDepth * upProgress); // Slope up to blade top
            } else {
                // Second half: slope down from peak to end cut depth
                const downProgress = (i - halfSteps) / halfSteps;
                y = startY + (endCutDepth * downProgress); // Slope down from blade top
            }
            
            // Ensure the final point connects to the exact cut edge coordinates
            if (i === steps) {
                // Connect directly to the cut edge at the calculated depth
                y = startY + endCutDepth;
            }
            
            path.points.push(new Phaser.Geom.Point(x, y));
        }
    }

    addTriangularPeakToPath(path, startX, startY, endX, endY, startCutDepth, endCutDepth) {
        // Add a triangular peak between cuts that goes up at 45 degrees to halfway, then down at 45 degrees
        // This creates a more realistic key blade profile with proper peaks between cuts
        
        const width = Math.abs(endX - startX);
        const stepSize = 4; // Consistent pixel size for steps
        const steps = Math.max(1, Math.floor(width / stepSize));
        const halfSteps = Math.floor(steps / 2);
        
        // Calculate the peak height - should be at the blade top (0 depth) at the halfway point
        const maxPeakHeight = Math.max(startCutDepth, endCutDepth); // Use the deeper cut as reference
        
        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const x = startX + (endX - startX) * progress;
            
            let y;
            if (i <= halfSteps) {
                // First half: slope up from start cut depth to peak (blade top)
                const upProgress = i / halfSteps;
                y = startY + startCutDepth - (startCutDepth * upProgress); // Slope up to blade top
            } else {
                // Second half: slope down from peak to end cut depth
                const downProgress = (i - halfSteps) / halfSteps;
                y = startY + (endCutDepth * downProgress); // Slope down from blade top
            }
            
            path.points.push(new Phaser.Geom.Point(x, y));
        }
    }

    addPointedTipToPath(path, startX, startY, endX, bladeHeight) {
        // Add a pointed tip that extends forward from both top and bottom of the blade
        // This creates the key tip as shown in the ASCII art: \_/\_/\_/\_/\_/
        
        const width = Math.abs(endX - startX);
        const stepSize = 4; // Consistent pixel size for steps
        const steps = Math.max(1, Math.floor(width / stepSize));
        
        // Calculate the bottom point (directly below the start point)
        const bottomX = startX;
        const bottomY = startY + bladeHeight;
        
        // Calculate the tip point (the rightmost point)
        const tipX = endX;
        const tipY = startY + (bladeHeight / 2); // Center of the blade height
        
        // Draw the pointed tip: from top to tip to bottom
        // First, go from top (startY) to tip (rightmost point)
        const topToTipSteps = Math.max(1, Math.floor(width / stepSize));
        for (let i = 0; i <= topToTipSteps; i++) {
            const progress = i / topToTipSteps;
            const x = startX + (width * progress);
            const y = startY + (bladeHeight / 2 * progress); // Slope down from top to center
            path.points.push(new Phaser.Geom.Point(x, y));
        }
        
        // Then, go from tip to bottom
        const tipToBottomSteps = Math.max(1, Math.floor(width / stepSize));
        for (let i = 0; i <= tipToBottomSteps; i++) {
            const progress = i / tipToBottomSteps;
            const x = tipX - (width * progress);
            const y = tipY + (bladeHeight / 2 * progress); // Slope down from center to bottom
            path.points.push(new Phaser.Geom.Point(x, y));
        }
    }

    addRightPointingTriangleToPath(path, peakX, peakY, endX, endY, bladeHeight) {
        // Add a triangle that goes from peak down to bottom, with third point facing right |>
        // This creates the right-pointing part of the tip
        
        const width = Math.abs(endX - peakX);
        const stepSize = 4; // Consistent pixel size for steps
        const steps = Math.max(1, Math.floor(width / stepSize));
        
        // Calculate the bottom point (directly below the peak)
        const bottomX = peakX;
        const bottomY = peakY + bladeHeight;
        
        // Calculate the rightmost point (the tip pointing to the right)
        const tipX = endX;
        const tipY = peakY + (bladeHeight / 2); // Center of the blade height
        
        // Draw the triangle: from peak to bottom to tip
        // First, go from peak to bottom
        const peakToBottomSteps = Math.max(1, Math.floor(bladeHeight / stepSize));
        for (let i = 0; i <= peakToBottomSteps; i++) {
            const progress = i / peakToBottomSteps;
            const x = peakX;
            const y = peakY + (bladeHeight * progress);
            path.points.push(new Phaser.Geom.Point(x, y));
        }
        
        // Then, go from bottom to tip (rightmost point)
        const bottomToTipSteps = Math.max(1, Math.floor(width / stepSize));
        for (let i = 0; i <= bottomToTipSteps; i++) {
            const progress = i / bottomToTipSteps;
            const x = bottomX + (width * progress);
            const y = bottomY - (bladeHeight / 2 * progress); // Slope up from bottom to center
            path.points.push(new Phaser.Geom.Point(x, y));
        }
        
        // Finally, go from tip back to peak
        const tipToPeakSteps = Math.max(1, Math.floor(width / stepSize));
        for (let i = 0; i <= tipToPeakSteps; i++) {
            const progress = i / tipToPeakSteps;
            const x = tipX - (width * progress);
            const y = tipY - (bladeHeight / 2 * progress); // Slope up from center to peak
            path.points.push(new Phaser.Geom.Point(x, y));
        }
    }
    
}
