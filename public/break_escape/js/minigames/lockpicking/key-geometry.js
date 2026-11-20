
/**
 * KeyGeometry
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new KeyGeometry(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class KeyGeometry {
    
    constructor(parent) {
        this.parent = parent;
    }

    getKeySurfaceHeightAtPinPosition(pinX, keyBladeStartX, keyBladeBaseY) {
        // Use collision detection to find the key surface height at a specific pin position
        // This method traces a vertical line from the pin position down to find where it intersects the key polygon
        
        const bladeWidth = this.parent.keyConfig.bladeWidth;
        const bladeHeight = this.parent.keyConfig.bladeHeight;
        
        // Calculate the pin's position relative to the key blade
        const pinRelativeToKey = pinX - keyBladeStartX;
        
        // If pin is beyond the key blade, return base surface
        if (pinRelativeToKey < 0 || pinRelativeToKey > bladeWidth) {
            return keyBladeBaseY;
        }
        
        // Generate the key polygon points at the current position
        const keyPolygonPoints = this.generateKeyPolygonPoints(keyBladeStartX, keyBladeBaseY);
        
        // Find the intersection point by tracing a vertical line from the pin position
        const intersectionY = this.findVerticalIntersection(pinX, keyBladeBaseY, keyBladeBaseY + bladeHeight, keyPolygonPoints);
        
        return intersectionY !== null ? intersectionY : keyBladeBaseY;
    }

    generateKeyPolygonPoints(keyBladeStartX, keyBladeBaseY) {
        // Generate the key polygon points at the current position
        // This recreates the same polygon logic used in drawKeyBladeAsSolidShape
        const points = [];
        const bladeWidth = this.parent.keyConfig.bladeWidth;
        const bladeHeight = this.parent.keyConfig.bladeHeight;
        const cutWidth = 24;
        
        // Calculate pin spacing
        const pinSpacing = 400 / (this.parent.pinCount + 1);
        const margin = pinSpacing * 0.75;
        
        // Start at the top-left corner of the blade
        points.push({ x: keyBladeStartX, y: keyBladeBaseY });
        
        let currentX = keyBladeStartX;
        
        // Generate the same path as the drawing method
        for (let i = 0; i <= this.parent.pinCount; i++) {
            let cutDepth = 0;
            let nextCutDepth = 0;
            
            if (i < this.parent.pinCount) {
                cutDepth = (this.parent.selectedKeyData || this.parent.keyData).cuts[i] || 0;
            }
            if (i < this.parent.pinCount - 1) {
                nextCutDepth = (this.parent.selectedKeyData || this.parent.keyData).cuts[i + 1] || 0;
            }
            
            // Calculate pin position
            const pinX = 100 + margin + i * pinSpacing;
            const cutX = keyBladeStartX + (pinX - 100);
            
            if (i === 0) {
                // First section: from left edge to first cut
                const firstCutStartX = cutX - cutWidth/2;
                this.addTriangularPeakToPoints(points, currentX, keyBladeBaseY, firstCutStartX, keyBladeBaseY, 0, cutDepth);
                currentX = firstCutStartX;
            }
            
            if (i < this.parent.pinCount) {
                // Draw the cut
            const cutStartX = cutX - cutWidth/2;
            const cutEndX = cutX + cutWidth/2;
                points.push({ x: cutStartX, y: keyBladeBaseY + cutDepth });
                points.push({ x: cutEndX, y: keyBladeBaseY + cutDepth });
                currentX = cutEndX;
            }
            
            if (i < this.parent.pinCount - 1) {
                // Draw triangular peak to next cut
                const nextPinX = 100 + margin + (i + 1) * pinSpacing;
                const nextCutX = keyBladeStartX + (nextPinX - 100);
                const nextCutStartX = nextCutX - cutWidth/2;
                this.addTriangularPeakToPoints(points, currentX, keyBladeBaseY, nextCutStartX, keyBladeBaseY, cutDepth, nextCutDepth);
                currentX = nextCutStartX;
            } else if (i === this.parent.pinCount - 1) {
                // Last section: pointed tip
                const keyRightEdge = keyBladeStartX + bladeWidth;
                const tipExtension = 12;
                const tipEndX = keyRightEdge + tipExtension;
                const peakX = currentX + (keyRightEdge - currentX) * 0.3;
                this.addTriangularPeakToPoints(points, currentX, keyBladeBaseY, peakX, keyBladeBaseY, cutDepth, 0);
                this.addPointedTipToPoints(points, peakX, keyBladeBaseY, tipEndX, bladeHeight);
                currentX = tipEndX;
            }
        }
        
        // Complete the path
        points.push({ x: keyBladeStartX + bladeWidth, y: keyBladeBaseY + bladeHeight });
        points.push({ x: keyBladeStartX, y: keyBladeBaseY + bladeHeight });
        points.push({ x: keyBladeStartX, y: keyBladeBaseY });
        
        return points;
    }

    findVerticalIntersection(pinX, startY, endY, polygonPoints) {
        // Find where a vertical line at pinX intersects the polygon
        // Returns the Y coordinate of the intersection, or null if no intersection
        
        let intersectionY = null;
        
        for (let i = 0; i < polygonPoints.length - 1; i++) {
            const p1 = polygonPoints[i];
            const p2 = polygonPoints[i + 1];
            
            // Check if this line segment crosses the vertical line at pinX
            if ((p1.x <= pinX && p2.x >= pinX) || (p1.x >= pinX && p2.x <= pinX)) {
                // Calculate intersection
                const t = (pinX - p1.x) / (p2.x - p1.x);
                const y = p1.y + t * (p2.y - p1.y);
                
                // Keep the highest intersection point (closest to the pin)
                if (intersectionY === null || y < intersectionY) {
                    intersectionY = y;
                }
            }
        }
        
        return intersectionY;
    }

    getKeySurfaceHeightAtPosition(pinX, keyBladeStartX) {
        // Method moved to KeyOperations module - delegate to it
        return this.parent.keyOps.getKeySurfaceHeightAtPosition(pinX, keyBladeStartX);
    }

    addTriangularPeakToPoints(points, startX, startY, endX, endY, startCutDepth, endCutDepth) {
        // Add triangular peak points (same logic as addTriangularPeakToPath)
        const width = Math.abs(endX - startX);
        const stepSize = 4;
        const steps = Math.max(1, Math.floor(width / stepSize));
        const halfSteps = Math.floor(steps / 2);
        
        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const x = startX + (endX - startX) * progress;
            
            let y;
            if (i <= halfSteps) {
                const upProgress = i / halfSteps;
                y = startY + startCutDepth - (startCutDepth * upProgress);
            } else {
                const downProgress = (i - halfSteps) / halfSteps;
                y = startY + (endCutDepth * downProgress);
            }
            
            points.push({ x: x, y: y });
        }
    }

    addPointedTipToPoints(points, startX, startY, endX, bladeHeight) {
        // Add pointed tip points (same logic as addPointedTipToPath)
        const width = Math.abs(endX - startX);
        const stepSize = 4;
        const steps = Math.max(1, Math.floor(width / stepSize));
        
        const tipX = endX;
        const tipY = startY + (bladeHeight / 2);
        
        // From top to tip
        const topToTipSteps = Math.max(1, Math.floor(width / stepSize));
        for (let i = 0; i <= topToTipSteps; i++) {
            const progress = i / topToTipSteps;
            const x = startX + (width * progress);
            const y = startY + (bladeHeight / 2 * progress);
            points.push({ x: x, y: y });
        }
        
        // From tip to bottom
        const tipToBottomSteps = Math.max(1, Math.floor(width / stepSize));
        for (let i = 0; i <= tipToBottomSteps; i++) {
            const progress = i / tipToBottomSteps;
            const x = tipX - (width * progress);
            const y = tipY + (bladeHeight / 2 * progress);
            points.push({ x: x, y: y });
        }
    }

    getTriangularSectionHeightAtX(relativeX, bladeWidth, bladeHeight) {
        // Calculate height of triangular sections at a given X position
        // Creates peaks that go up to blade top between cuts
        const cutWidth = 24;
        const pinSpacing = 400 / (this.parent.pinCount + 1);
        const margin = pinSpacing * 0.75;
        
        // Check triangular sections between cuts
        for (let i = 0; i < this.parent.pinCount - 1; i++) {
            const cut1X = margin + i * pinSpacing;
            const cut2X = margin + (i + 1) * pinSpacing;
            const cut1EndX = cut1X + cutWidth/2;
            const cut2StartX = cut2X - cutWidth/2;
            
            // Check if we're in the triangular section between these cuts
            if (relativeX >= cut1EndX && relativeX <= cut2StartX) {
                const distanceFromCut1 = relativeX - cut1EndX;
                const triangularWidth = cut2StartX - cut1EndX;
                const progress = distanceFromCut1 / triangularWidth;
                
                // Get cut depths for both cuts
                const cut1Depth = this.parent.keyData.cuts[i] || 0;
                const cut2Depth = this.parent.keyData.cuts[i + 1] || 0;
                
                // Create a peak: go up from cut1 to blade top, then down to cut2
                const halfWidth = triangularWidth / 2;
                
                if (distanceFromCut1 <= halfWidth) {
                    // First half: slope up from cut1 to blade top
                    const upProgress = distanceFromCut1 / halfWidth;
                    return cut1Depth + (bladeHeight - cut1Depth) * upProgress;
                } else {
                    // Second half: slope down from blade top to cut2
                    const downProgress = (distanceFromCut1 - halfWidth) / halfWidth;
                    return bladeHeight - (bladeHeight - cut2Depth) * downProgress;
                }
            }
        }
        
        // Check triangular section from left edge to first cut
        const firstCutX = margin;
        const firstCutStartX = firstCutX - cutWidth/2;
        
        if (relativeX >= 0 && relativeX < firstCutStartX) {
            const progress = relativeX / firstCutStartX;
            const firstCutDepth = this.parent.keyData.cuts[0] || 0;
            
            // Create a peak: slope up from base to blade top, then down to first cut
            const halfWidth = firstCutStartX / 2;
            
            if (relativeX <= halfWidth) {
                // First half: slope up from base (0) to blade top
                const upProgress = relativeX / halfWidth;
                return bladeHeight * upProgress;
            } else {
                // Second half: slope down from blade top to first cut depth
                const downProgress = (relativeX - halfWidth) / halfWidth;
                return bladeHeight - (bladeHeight - firstCutDepth) * downProgress;
            }
        }
        
        // Check triangular section from last cut to right edge
        const lastCutX = margin + (this.parent.pinCount - 1) * pinSpacing;
        const lastCutEndX = lastCutX + cutWidth/2;
        
        if (relativeX > lastCutEndX && relativeX <= bladeWidth) {
            const triangularWidth = bladeWidth - lastCutEndX;
            const distanceFromLastCut = relativeX - lastCutEndX;
            const progress = distanceFromLastCut / triangularWidth;
            const lastCutDepth = this.parent.keyData.cuts[this.parent.pinCount - 1] || 0;
            
            // Create a peak: slope up from last cut to blade top, then down to base
            const halfWidth = triangularWidth / 2;
            
            if (distanceFromLastCut <= halfWidth) {
                // First half: slope up from last cut depth to blade top
                const upProgress = distanceFromLastCut / halfWidth;
                return lastCutDepth + (bladeHeight - lastCutDepth) * upProgress;
            } else {
                // Second half: slope down from blade top to base (0)
                const downProgress = (distanceFromLastCut - halfWidth) / halfWidth;
                return bladeHeight * (1 - downProgress);
            }
        }
        
        return 0; // Not in a triangular section
    }

    getTriangularSectionHeightAsKeyMoves(pinRelativeToKeyLeadingEdge, bladeWidth, bladeHeight) {
        // Calculate triangular section height as the key moves underneath the pin
        // This creates the sloping effect as pins follow the key's surface
        
        const cutWidth = 24;
        const pinSpacing = 400 / (this.parent.pinCount + 1);
        const margin = pinSpacing * 0.75;
        
        // Check triangular section from left edge to first cut
        const firstCutX = margin;
        const firstCutStartX = firstCutX - cutWidth/2;
        
        if (pinRelativeToKeyLeadingEdge >= 0 && pinRelativeToKeyLeadingEdge < firstCutStartX) {
            // Pin is in the triangular section from left edge to first cut
            const progress = pinRelativeToKeyLeadingEdge / firstCutStartX;
            const firstCutDepth = this.parent.keyData.cuts[0] || 0;
            // Start from base level (0) and slope up to first cut depth
            return Math.max(0, firstCutDepth * progress); // Ensure we never go below base level
        }
        
        // Check triangular sections between cuts
        for (let i = 0; i < this.parent.pinCount - 1; i++) {
            const cut1X = margin + i * pinSpacing;
            const cut2X = margin + (i + 1) * pinSpacing;
            const cut1EndX = cut1X + cutWidth/2;
            const cut2StartX = cut2X - cutWidth/2;
            
            if (pinRelativeToKeyLeadingEdge >= cut1EndX && pinRelativeToKeyLeadingEdge <= cut2StartX) {
                // Pin is in triangular section between these cuts
                const distanceFromCut1 = pinRelativeToKeyLeadingEdge - cut1EndX;
                const triangularWidth = cut2StartX - cut1EndX;
                const progress = distanceFromCut1 / triangularWidth;
                
                // Get cut depths for both cuts
                const cut1Depth = this.parent.keyData.cuts[i] || 0;
                const cut2Depth = this.parent.keyData.cuts[i + 1] || 0;
                
                // Interpolate between cut depths (slope from cut1 to cut2)
                return cut1Depth + (cut2Depth - cut1Depth) * progress;
            }
        }
        
        // Check triangular section from last cut to right edge
        const lastCutX = margin + (this.parent.pinCount - 1) * pinSpacing;
        const lastCutEndX = lastCutX + cutWidth/2;
        
        if (pinRelativeToKeyLeadingEdge >= lastCutEndX && pinRelativeToKeyLeadingEdge <= bladeWidth) {
            // Pin is in triangular section from last cut to right edge
            const distanceFromLastCut = pinRelativeToKeyLeadingEdge - lastCutEndX;
            const triangularWidth = bladeWidth - lastCutEndX;
            const progress = distanceFromLastCut / triangularWidth;
            const lastCutDepth = this.parent.keyData.cuts[this.parent.pinCount - 1] || 0;
            return lastCutDepth * (1 - progress); // Slope down from last cut depth to 0
        }
        
        return 0; // Not in a triangular section
    }
    
}
