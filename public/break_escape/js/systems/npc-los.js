/**
 * NPC LINE-OF-SIGHT (LOS) SYSTEM
 * ===============================
 * 
 * Handles visibility detection for NPCs with configurable:
 * - Detection range (in pixels)
 * - Field-of-view angle (in degrees, cone shape)
 * - Facing direction (auto-calculated from NPC's current direction)
 * - Visualization (debug cone rendering)
 * 
 * Used to determine if an NPC can "see" the player or events like lockpicking.
 */

/**
 * Check if target is within NPC's line of sight
 * @param {Object} npc - NPC object with position and direction
 * @param {Object} target - Target position { x, y } or entity with sprite
 * @param {Object} losConfig - LOS configuration { range, angle, enabled }
 * @returns {boolean} True if target is in LOS
 */
export function isInLineOfSight(npc, target, losConfig = {}) {
  // Default LOS config if not provided
  const {
    range = 200,        // Detection range in pixels
    angle = 120,        // Field of view angle in degrees (120 = 60° on each side of facing direction)
    enabled = true
  } = losConfig;
  
  // Hidden or KO'd NPCs see nothing (checked before the "LOS disabled" shortcut)
  if (npc?.id && window.npcHostileSystem?.isNPCKO?.(npc.id)) return false;
  const losSprite = npc?._sprite || npc?.sprite;
  if (losSprite && losSprite.visible === false) return false;

  if (!enabled) return true; // If LOS disabled, always return true (can see everything)
  
  // Get NPC position
  const npcPos = getNPCPosition(npc);
  if (!npcPos) return false;
  
  // Get target position
  const targetPos = getTargetPosition(target);
  if (!targetPos) return false;
  
  // Calculate distance
  const distance = Phaser.Math.Distance.Between(npcPos.x, npcPos.y, targetPos.x, targetPos.y);
  if (distance > range) {
    return false; // Target outside range
  }
  
  // Get NPC's facing direction (0-360 degrees)
  const npcFacing = getNPCFacingDirection(npc);
  
  // Calculate angle to target from NPC
  const angleToTarget = Phaser.Math.Angle.Between(npcPos.x, npcPos.y, targetPos.x, targetPos.y);
  const angleToTargetDegrees = Phaser.Math.RadToDeg(angleToTarget);
  
  // Normalize angles to 0-360
  const normalizedFacing = normalizeAngle(npcFacing);
  const normalizedTarget = normalizeAngle(angleToTargetDegrees);
  
  // Calculate angular difference (shortest arc)
  const angleDiff = shortestAngularDistance(normalizedFacing, normalizedTarget);
  const maxAngle = angle / 2; // Half angle on each side
  
  return Math.abs(angleDiff) <= maxAngle;
}

/**
 * Get NPC's current position
 */
function getNPCPosition(npc) {
  if (!npc) return null;
  
  // If NPC has _sprite property (how it's stored: npc._sprite = sprite)
  if (npc._sprite && typeof npc._sprite.getCenter === 'function') {
    return npc._sprite.getCenter();
  }
  
  // If NPC has sprite property (Phaser sprite)
  if (npc.sprite && typeof npc.sprite.getCenter === 'function') {
    return npc.sprite.getCenter();
  }
  
  // If NPC has x, y properties (raw coordinates)
  if (npc.x !== undefined && npc.y !== undefined) {
    return { x: npc.x, y: npc.y };
  }
  
  // If NPC has position property
  if (npc.position && npc.position.x !== undefined && npc.position.y !== undefined) {
    return { x: npc.position.x, y: npc.position.y };
  }
  
  return null;
}

/**
 * Get target position (handles both plain objects and sprites)
 */
function getTargetPosition(target) {
  if (!target) return null;
  
  // If target has getCenter method (Phaser sprite)
  if (typeof target.getCenter === 'function') {
    return target.getCenter();
  }
  
  // If target has x, y properties
  if (target.x !== undefined && target.y !== undefined) {
    return { x: target.x, y: target.y };
  }
  
  return null;
}

/**
 * Get NPC's current facing direction in degrees (0-360)
 * Tries multiple sources: stored direction, sprite direction, patrol direction
 */
export function getNPCFacingDirection(npc) {
  if (!npc) return 0;
  
  // If NPC has explicit facing direction property
  if (npc.facingDirection !== undefined) {
    return npc.facingDirection;
  }
  
  // Try to get direction from behavior system (most current)
  if (window.npcBehaviorManager) {
    const behavior = window.npcBehaviorManager.getBehavior?.(npc.id);
    if (behavior && behavior.direction !== undefined) {
      const directions = {
        'down': 90,     // Down (south)
        'up': 270,      // Up (north)
        'left': 180,    // Left (west)
        'right': 0,     // Right (east)
        'down-left': 135,
        'down-right': 45,
        'up-left': 225,
        'up-right': 315
      };
      return directions[behavior.direction] ?? 90;
    }
  }
  
  // If NPC has _sprite (stored sprite reference) with rotation
  if (npc._sprite && npc._sprite.rotation !== undefined) {
    return Phaser.Math.RadToDeg(npc._sprite.rotation);
  }
  
  // If NPC has sprite with rotation
  if (npc.sprite && npc.sprite.rotation !== undefined) {
    return Phaser.Math.RadToDeg(npc.sprite.rotation);
  }
  
  // If NPC has direction property (string or numeric)
  if (npc.direction !== undefined) {
    if (typeof npc.direction === 'string') {
      const directions = {
        'down': 90,
        'up': 270,
        'left': 180,
        'right': 0,
        'down-left': 135,
        'down-right': 45,
        'up-left': 225,
        'up-right': 315
      };
      return directions[npc.direction] ?? 90;
    } else if (typeof npc.direction === 'number') {
      // Numeric: 0=down, 1=left, 2=up, 3=right
      const directions = [90, 180, 270, 0];
      return directions[npc.direction % 4] ?? 0;
    }
  }
  
  // Default: facing down (90 degrees in Phaser convention for top-down)
  return 90;
}

/**
 * Normalize angle to 0-360 range
 */
function normalizeAngle(angle) {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Calculate shortest angular distance between two angles
 * Returns signed value: positive = clockwise, negative = counter-clockwise
 */
function shortestAngularDistance(from, to) {
  let diff = to - from;
  
  // Normalize to -180 to 180
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  
  return diff;
}

/**
 * Draw LOS cone for debugging
 * @param {Phaser.Scene} scene - Phaser scene for drawing
 * @param {Object} npc - NPC object
 * @param {Object} losConfig - LOS configuration
 * @param {number} color - Hex color for cone (default 0x00ff00)
 * @param {number} alpha - Alpha value for cone (default 0.2)
 */
export function drawLOSCone(scene, npc, losConfig = {}, color = 0x00ff00, alpha = 0.2) {
  const {
    range = 200,
    angle = 120,
    enabled = true
  } = losConfig;
  
  if (!enabled || !scene || !scene.add) {
    console.log('🔴 Cannot draw LOS cone - missing scene or disabled');
    return null;
  }
  
  const npcPos = getNPCPosition(npc);
  if (!npcPos) {
    console.log('🔴 Cannot draw LOS cone - NPC position not found', {
      npcId: npc?.id,
      hasSprite: !!npc?.sprite,
      hasX: npc?.x !== undefined,
      hasPosition: !!npc?.position
    });
    return null;
  }
  
  // Use full range as configured (no scaling)
  const scaledRange = range;
  // Set cone opacity to 20%
  const coneAlpha = 0.2;
  
  // console.log(`🟢 Drawing LOS cone for NPC at (${npcPos.x.toFixed(0)}, ${npcPos.y.toFixed(0)}), range: ${scaledRange}px, angle: ${angle}°`);
  
  const npcFacing = getNPCFacingDirection(npc);
  // console.log(`   NPC facing: ${npcFacing.toFixed(0)}°`);
  
  // Offset cone origin to eye level (30% higher on the NPC sprite)
  const coneOriginY = npcPos.y - (npc._sprite?.height ?? 32) * 0.3;
  const coneOrigin = { x: npcPos.x, y: coneOriginY };
  // console.log(`   Cone origin at eye level: (${coneOrigin.x.toFixed(0)}, ${coneOrigin.y.toFixed(0)})`);
  
  const npcFacingRad = Phaser.Math.DegToRad(npcFacing);
  const halfAngleRad = Phaser.Math.DegToRad(angle / 2);
  
  // Create graphics object for the cone
  const graphics = scene.add.graphics();
  // console.log(`   📊 Graphics object created - checking properties:`, {
  //   graphicsExists: !!graphics,
  //   hasScene: !!graphics.scene,
  //   sceneKey: graphics.scene?.key,
  //   canAdd: typeof graphics.add === 'function'
  // });
  
  // Draw outer range circle (light, semi-transparent)
  graphics.lineStyle(1, color, 0.2);
  graphics.strokeCircle(coneOrigin.x, coneOrigin.y, scaledRange);
  // console.log(`   ⭕ Range circle drawn at (${coneOrigin.x}, ${coneOrigin.y}) radius: ${scaledRange}`);
  
  // Draw the cone fill with radial transparency gradient
  graphics.lineStyle(2, color, 0.2);
  
  // Draw the cone shape with gradient opacity (transparent near center, opaque at edges)
  const conePoints = [];
  
  // Left edge of cone
  const leftAngle = npcFacingRad - halfAngleRad;
  const leftPoint = new Phaser.Geom.Point(
    coneOrigin.x + scaledRange * Math.cos(leftAngle),
    coneOrigin.y + scaledRange * Math.sin(leftAngle)
  );
  conePoints.push(leftPoint);
  
  // Arc from left to right (approximate with segments)
  const segments = Math.max(12, Math.floor(angle / 5));
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const currentAngle = npcFacingRad - halfAngleRad + (angle * Math.PI / 180) * t;
    conePoints.push(new Phaser.Geom.Point(
      coneOrigin.x + scaledRange * Math.cos(currentAngle),
      coneOrigin.y + scaledRange * Math.sin(currentAngle)
    ));
  }
  
  // Right edge of cone
  const rightAngle = npcFacingRad + halfAngleRad;
  const rightPoint = new Phaser.Geom.Point(
    coneOrigin.x + scaledRange * Math.cos(rightAngle),
    coneOrigin.y + scaledRange * Math.sin(rightAngle)
  );
  conePoints.push(rightPoint);
  
  // Draw radiating slices from center to outer edge with gradient opacity
  const numRadii = Math.max(8, Math.floor(segments / 2));
  for (let r = 0; r < numRadii; r++) {
    const radiusT = r / numRadii; // 0 to 1
    const outerRadius = scaledRange * radiusT;
    const nextOuterRadius = scaledRange * ((r + 1) / numRadii);
    
    // Opacity gradient: 0 at center, full at outer edge
    const alpha1 = coneAlpha * radiusT;
    const alpha2 = coneAlpha * ((r + 1) / numRadii);
    
    // Draw slice from left to right at this radius
    const slicePoints = [];
    
    // Left inner point
    slicePoints.push(new Phaser.Geom.Point(
      coneOrigin.x + outerRadius * Math.cos(leftAngle),
      coneOrigin.y + outerRadius * Math.sin(leftAngle)
    ));
    
    // Arc at this radius
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const currentAngle = npcFacingRad - halfAngleRad + (angle * Math.PI / 180) * t;
      slicePoints.push(new Phaser.Geom.Point(
        coneOrigin.x + outerRadius * Math.cos(currentAngle),
        coneOrigin.y + outerRadius * Math.sin(currentAngle)
      ));
    }
    
    // Right inner point
    slicePoints.push(new Phaser.Geom.Point(
      coneOrigin.x + outerRadius * Math.cos(rightAngle),
      coneOrigin.y + outerRadius * Math.sin(rightAngle)
    ));
    
    // Right outer point
    slicePoints.push(new Phaser.Geom.Point(
      coneOrigin.x + nextOuterRadius * Math.cos(rightAngle),
      coneOrigin.y + nextOuterRadius * Math.sin(rightAngle)
    ));
    
    // Arc at outer radius (backwards)
    for (let i = segments - 1; i > 0; i--) {
      const t = i / segments;
      const currentAngle = npcFacingRad - halfAngleRad + (angle * Math.PI / 180) * t;
      slicePoints.push(new Phaser.Geom.Point(
        coneOrigin.x + nextOuterRadius * Math.cos(currentAngle),
        coneOrigin.y + nextOuterRadius * Math.sin(currentAngle)
      ));
    }
    
    // Left outer point
    slicePoints.push(new Phaser.Geom.Point(
      coneOrigin.x + nextOuterRadius * Math.cos(leftAngle),
      coneOrigin.y + nextOuterRadius * Math.sin(leftAngle)
    ));
    
    // Draw this slice with gradient opacity
    graphics.fillStyle(color, alpha2);
    graphics.fillPoints(slicePoints, true);
  }
  
  // Draw a line showing the facing direction (to front of cone)
  graphics.lineStyle(3, color, 0.1);
  const dirLength = scaledRange * 0.4;
  graphics.lineBetween(
    coneOrigin.x,
    coneOrigin.y,
    coneOrigin.x + dirLength * Math.cos(npcFacingRad),
    coneOrigin.y + dirLength * Math.sin(npcFacingRad)
  );
  
  // Draw angle wedge markers
  graphics.lineStyle(1, color, 0.5);
  graphics.lineBetween(coneOrigin.x, coneOrigin.y, 
    coneOrigin.x + scaledRange * Math.cos(leftAngle),
    coneOrigin.y + scaledRange * Math.sin(leftAngle)
  );
  graphics.lineBetween(coneOrigin.x, coneOrigin.y, 
    coneOrigin.x + scaledRange * Math.cos(rightAngle),
    coneOrigin.y + scaledRange * Math.sin(rightAngle)
  );
  
  // Set depth on top of other objects (was -999, now 9999)
  graphics.setDepth(9999); // On top of everything
  graphics.setAlpha(1.0); // Ensure not transparent
  
  // console.log(`✅ LOS cone rendered successfully:`, {
  //   positionX: npcPos.x.toFixed(0),
  //   positionY: npcPos.y.toFixed(0),
  //   depth: graphics.depth,
  //   alpha: graphics.alpha,
  //   visible: graphics.visible,
  //   active: graphics.active,
  //   pointsCount: conePoints.length
  // });
  
  return graphics;
}

/**
 * Clean up LOS visualization
 * @param {Phaser.GameObjects.Graphics} graphics - Graphics object to destroy
 */
export function clearLOSCone(graphics) {
  if (graphics && typeof graphics.destroy === 'function') {
    graphics.destroy();
  }
}
