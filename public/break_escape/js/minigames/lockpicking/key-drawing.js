
/**
 * KeyDrawing
 * 
 * Extracted from lockpicking-game-phaser.js
 * Instantiate with: new KeyDrawing(this)
 * 
 * All 'this' references replaced with 'this.parent' to access parent instance state:
 * - this.parent.pins (array of pin objects)
 * - this.parent.scene (Phaser scene)
 * - this.parent.lockId (lock identifier)
 * - this.parent.lockState (lock state object)
 * etc.
 */
export class KeyDrawing {
    
    constructor(parent) {
        this.parent = parent;
    }

    drawKeyWithRenderTexture(circleRadius, shoulderWidth, shoulderHeight, bladeWidth, bladeHeight, fullKeyLength) {
        console.log('drawKeyWithRenderTexture called with:', {
            hasKeyData: !!this.parent.keyData,
            hasCuts: !!(this.parent.keyData && this.parent.keyData.cuts),
            keyData: this.parent.keyData
        });
        
        if (!this.parent.keyData || !this.parent.keyData.cuts) {
            console.log('Early return - missing key data or cuts');
            return;
        }
        
        // Create temporary graphics for drawing to render texture
        const tempGraphics = this.parent.scene.add.graphics();
        tempGraphics.fillStyle(0xcccccc); // Silver color for key
        
        // Calculate positions
        const circleX = circleRadius; // Circle center
        const shoulderX = circleRadius * 1.9; // After circle
        const bladeX = shoulderX + shoulderWidth; // After shoulder
        
        console.log('Drawing key handle:', {
            circleX: circleX,
            circleY: shoulderHeight/2,
            circleRadius: circleRadius,
            shoulderHeight: shoulderHeight,
            renderTextureWidth: this.parent.keyRenderTexture.width
        });
        
        // 1. Draw the circle (handle) - rightmost part as a separate object
        const handleGraphics = this.parent.scene.add.graphics();
        handleGraphics.fillStyle(0xcccccc); // Silver color for key
        handleGraphics.fillCircle(circleX, 0, circleRadius); // Center at y=0 relative to key group
        
        // Draw the hole in the handle (black circle)
        const holeGraphics = this.parent.scene.add.graphics();
        holeGraphics.fillStyle(0x000000); // Black to match background
        holeGraphics.fillCircle(circleX * 0.45, 0, 38);

        // Add handle and hole to the key group
        this.parent.keyGroup.add(handleGraphics);
        this.parent.keyGroup.add(holeGraphics);
        
        // 2. Draw the shoulder - rectangle
        tempGraphics.fillRect(shoulderX, 0, shoulderWidth, shoulderHeight);
        
        // 3. Draw the blade with cuts as a solid shape
        this.drawKeyBladeAsSolidShape(tempGraphics, bladeX, shoulderHeight/2 - bladeHeight/2, bladeWidth, bladeHeight);
        
        // Draw the graphics to the render texture (shoulder and blade only)
        this.parent.keyRenderTexture.draw(tempGraphics);
        
        // Clean up temporary graphics
        tempGraphics.destroy();
    }

    drawKeyBladeAsSolidShape(graphics, bladeX, bladeY, bladeWidth, bladeHeight) {
        // Draw the key blade as a solid shape with cuts removed
        // The blade has a pattern like: \_/\_/\_/\_/\ where the cuts _ are based on pin depths

        // ASCII art of the key blade:
        //  _________
        // /         \ ____   
        // |          | |  \_/\_/\_/\_/\
        // |          |_|______________/
        //  \________/ 
        
        
        
        const cutWidth = 24; // Width of each cut (same as pin width)
        
        // Calculate pin spacing to match the lock's pin positions
        const pinSpacing = 400 / (this.parent.pinCount + 1);
        const margin = pinSpacing * 0.75;
        
        // Start with the base blade rectangle
        const baseBladeRect = {
            x: bladeX,
            y: bladeY,
            width: bladeWidth,
            height: bladeHeight
        };
        
        // Create a path for the solid key blade
        const path = new Phaser.Geom.Polygon();
        
        // Start at the top-left corner of the blade
        path.points.push(new Phaser.Geom.Point(bladeX, bladeY));
        
        // Draw the top edge with cuts and ridges
        let currentX = bladeX;
        
        // For each pin position, create the blade profile
        for (let i = 0; i <= this.parent.pinCount; i++) {
            let cutDepth = 0;
            let nextCutDepth = 0;
            
            if (i < this.parent.pinCount) {
                cutDepth = this.parent.keyData.cuts[i] || 0;
            }
            if (i < this.parent.pinCount - 1) {
                nextCutDepth = this.parent.keyData.cuts[i + 1] || 0;
            }
            
            // Calculate pin position
            const pinX = 100 + margin + i * pinSpacing;
            const cutX = bladeX + (pinX - 100);
            
            if (i === 0) {
                // First section: from left edge (shoulder) to first cut
                const firstCutStartX = cutX - cutWidth/2;
                
                // Draw triangular peak from shoulder to first cut edge (touches exact edge of cut)
                this.parent.keyPathDraw.addFirstCutPeakToPath(path, currentX, bladeY, firstCutStartX, bladeY, 0, cutDepth);
                currentX = firstCutStartX;
            }
            
            if (i < this.parent.pinCount) {
                // Draw the cut (negative space - skip this section)
                const cutStartX = cutX - cutWidth/2;
                const cutEndX = cutX + cutWidth/2;
                
                // Move to the bottom of the cut
                path.points.push(new Phaser.Geom.Point(cutStartX, bladeY + cutDepth));
                
                // Draw the cut bottom
                path.points.push(new Phaser.Geom.Point(cutEndX, bladeY + cutDepth));
                
                currentX = cutEndX;
            }
            
            if (i < this.parent.pinCount - 1) {
                // Draw triangular peak to next cut
                const nextPinX = 100 + margin + (i + 1) * pinSpacing;
                const nextCutX = bladeX + (nextPinX - 100);
                const nextCutStartX = nextCutX - cutWidth/2;
                
                // Use triangular peak that goes up at 45 degrees to halfway, then down at 45 degrees
                this.parent.keyPathDraw.addTriangularPeakToPath(path, currentX, bladeY, nextCutStartX, bladeY, cutDepth, nextCutDepth);
                currentX = nextCutStartX;
            } else if (i === this.parent.pinCount - 1) {
                // Last section: from last cut to right edge - create pointed tip that extends forward
                const keyRightEdge = bladeX + bladeWidth;
                const tipExtension = 12; // How far the tip extends beyond the blade
                const tipEndX = keyRightEdge + tipExtension;
                
                // First: draw triangular peak from last cut back up to blade top
                const peakX = currentX + (keyRightEdge - currentX) * 0.3; // Peak at 30% of the way
                this.parent.keyPathDraw.addTriangularPeakToPath(path, currentX, bladeY, peakX, bladeY, cutDepth, 0);
                
                // Second: draw the pointed tip that extends forward from top and bottom
                this.parent.keyPathDraw.addPointedTipToPath(path, peakX, bladeY, tipEndX, bladeHeight);
                currentX = tipEndX;
            }
        }
        
        // Complete the path: right edge, bottom edge, left edge
        path.points.push(new Phaser.Geom.Point(bladeX + bladeWidth, bladeY + bladeHeight));
        path.points.push(new Phaser.Geom.Point(bladeX, bladeY + bladeHeight));
        path.points.push(new Phaser.Geom.Point(bladeX, bladeY));
        
        // Draw the solid shape
        graphics.fillPoints(path.points, true, true);
    }

    drawPixelArtCircleToGraphics(graphics, centerX, centerY, radius) {
        // Draw a pixel art circle to the specified graphics object
        const stepSize = 4; // Consistent pixel size for steps
        const diameter = radius * 2;
        const steps = Math.floor(diameter / stepSize);
        
        // Draw horizontal lines to create the circle shape
        for (let i = 0; i <= steps; i++) {
            const y = centerY - radius + (i * stepSize);
            const distanceFromCenter = Math.abs(y - centerY);
            
            // Calculate the width of this horizontal line using circle equation
            // For a circle: x² + y² = r², so x = √(r² - y²)
            const halfWidth = Math.sqrt(radius * radius - distanceFromCenter * distanceFromCenter);
            
            if (halfWidth > 0) {
                // Draw the horizontal line for this row
                const lineWidth = halfWidth * 2;
                const lineX = centerX - halfWidth;
                
                // Round to stepSize for pixel art consistency
                const roundedWidth = Math.floor(lineWidth / stepSize) * stepSize;
                const roundedX = Math.floor(lineX / stepSize) * stepSize;
                
                graphics.fillRect(roundedX, y, roundedWidth, stepSize);
            }
        }
    }
    
}
