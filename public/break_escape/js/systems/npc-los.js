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
 *
 * Where sight starts (los.origin):
 *   "body"  - the old origin: range and angle from the sprite centre, walls and
 *             props tested from the feet (physics body centre), the drawn cone
 *             from the feet.
 *   "torch" - everything (range, angle, occlusion, drawn cone) from the hand that
 *             holds the torch, npcTorchOrigin() below; lighting.js starts the
 *             beam from the same point, so the cone lies over the beam.
 * Unset: "torch" while the NPC holds a torch (behavior.torch, its condition
 * holding), otherwise "body".
 */

/**
 * The torch hand, in 80x80 atlas-frame pixels from the frame centre (40, 40); the
 * feet are on row 69. Measured on ray_hollis and terry_mott idle and walk frames:
 * the hands hang about 10 px either side of the body axis, level with row 50-52.
 * The right hand is the one 90 degrees clockwise of the facing (screen y down), so
 * facing east it is on the near side and a little lower, facing west on the far
 * side, a little higher and behind the body, facing south on the viewer's left
 * and facing north on the viewer's right. A torch is held a little forward.
 */
export const NPC_TORCH_HAND = {
  side: 10,      // px from the body axis to the hand
  height: 10.5,  // px below the frame centre, hand height (row ~50.5)
  depth: 2,      // px lower when the hand is on the near side, higher on the far side
  forward: 2.5,  // px the torch is held out along the facing
  frame: 80      // the frame height these numbers are for; other sizes scale
};

/**
 * Offset of the torch hand from the sprite centre for an aim angle (degrees,
 * 0 east, 90 south). Continuous in the angle, so a beam whose angle is smoothed
 * through a turn moves its start round the body with it instead of jumping.
 * @param {number} angleDeg
 * @param {number} [frameHeight=80] - the sprite's display height
 * @returns {{dx:number, dy:number}}
 */
export function torchHandOffset(angleDeg, frameHeight = NPC_TORCH_HAND.frame) {
  const h = NPC_TORCH_HAND;
  const k = (Number.isFinite(frameHeight) && frameHeight > 0 ? frameHeight : h.frame) / h.frame;
  const f = (angleDeg * Math.PI) / 180;
  const r = f + Math.PI / 2;          // the right hand: 90 degrees clockwise of the facing
  const dx = h.side * Math.cos(r) + h.forward * Math.cos(f);
  const dy = h.height + h.depth * Math.sin(r) + h.forward * Math.sin(f);
  return { dx: dx * k, dy: dy * k };
}

/**
 * One frame of torch-aim smoothing: a quarter of the way to the target along the
 * shorter arc (lighting.js, every frame). Degrees in, degrees 0-360 out.
 */
export function stepTorchAim(prev, target, rate = 0.25) {
  if (!Number.isFinite(prev)) return ((target % 360) + 360) % 360;
  const diff = ((target - prev + 540) % 360) - 180;
  return (prev + diff * rate + 360) % 360;
}

/** How long a smoothed aim stored by lighting.js (npc._torchAim) stays good, ms. */
export const TORCH_AIM_FRESH_MS = 500;

/**
 * True when the NPC holds a torch now: behavior.torch is set and, if it has a
 * condition, the condition holds. Conditions are evaluated by the lighting system
 * (window.lightingSystem.npcTorchHeld); without lighting a conditional torch
 * counts as not held, the same as its beam, which never shows then either.
 */
export function npcTorchHeld(npc) {
  const torch = npc?.behavior?.torch;
  if (!torch) return false;
  if (typeof torch === 'object' && torch.condition) {
    const ls = (typeof window !== 'undefined') ? window.lightingSystem : null;
    if (ls && typeof ls.npcTorchHeld === 'function') return !!ls.npcTorchHeld(npc);
    return false;
  }
  return true;
}

/**
 * World point of the NPC's torch hand: the sprite centre plus torchHandOffset at
 * the beam's smoothed aim (npc._torchAim, stored by lighting.js each frame) or,
 * with no fresh aim, the NPC's facing.
 * @param {object} npc
 * @param {number} [now=Date.now()]
 * @returns {{x:number, y:number}|null}
 */
export function npcTorchOrigin(npc, now = Date.now()) {
  const s = npc?._sprite || npc?.sprite;
  let c = null;
  if (s && typeof s.getCenter === 'function') c = s.getCenter();
  else if (s && Number.isFinite(s.x) && Number.isFinite(s.y)) c = { x: s.x, y: s.y };
  if (!c || !Number.isFinite(c.x) || !Number.isFinite(c.y)) return null;
  const aim = npc._torchAim;
  const angle = (aim && Number.isFinite(aim.angle) && now - (aim.at ?? 0) <= TORCH_AIM_FRESH_MS)
    ? aim.angle : getNPCFacingDirection(npc);
  const { dx, dy } = torchHandOffset(angle, s.displayHeight || NPC_TORCH_HAND.frame);
  return { x: c.x + dx, y: c.y + dy };
}

/**
 * Which origin an NPC's sight uses: "torch" or "body" (see the header).
 * @param {object} npc
 * @param {object} [losConfig]
 */
export function losOriginMode(npc, losConfig = npc?.los || {}) {
  const o = losConfig?.origin;
  if (o === 'torch' || o === 'body') return o;
  return npcTorchHeld(npc) ? 'torch' : 'body';
}

/** The torch origin when the NPC's sight starts at its torch, else null (body origin). */
export function losTorchOrigin(npc, losConfig) {
  return losOriginMode(npc, losConfig) === 'torch' ? npcTorchOrigin(npc) : null;
}

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
  
  // Get NPC position: the torch hand when sight starts there (los.origin)
  const torchFrom = losTorchOrigin(npc, losConfig);
  const npcPos = torchFrom || getNPCPosition(npc);
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

  if (Math.abs(angleDiff) > maxAngle) return false;

  // Walls, closed doors and tall props block the view (npc-sight-occlusion.js,
  // reached through window so this module stays import-free). los.occlusion: false
  // turns it off for one NPC.
  if (losConfig.occlusion !== false) {
    const occ = (typeof window !== 'undefined') ? window.npcSightOcclusion : null;
    if (occ && typeof occ.isSightClear === 'function' && !occ.isSightClear(npc, target, torchFrom || undefined)) return false;
  }
  return true;
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
/**
 * True when an NPC's vision cone or sight circle should not be drawn (7.1j;
 * m06, m08 E9): the NPC is hidden (isVisible: false, or its sprite is hidden,
 * inactive or destroyed) or knocked out. A cone round a man on the floor, or
 * round someone who isn't there yet, looked like a bug.
 * @param {object} npc - NPC entry from the NPC manager
 * @param {boolean} [isKO=false] - npcHostileSystem.isNPCKO(npc.id)
 */
export function losVisualSuppressed(npc, isKO = false) {
  if (!npc) return true;
  if (isKO) return true;
  if (npc.isVisible === false) return true;
  const sprite = npc._sprite || npc.sprite;
  if (sprite && (sprite.visible === false || sprite.active === false || sprite.destroyed)) return true;
  return false;
}

/**
 * True when an NPC's cone should not be drawn because the NPC stands in a room
 * other than the player's: the cone isn't clipped at walls, so a checkpoint
 * guard's cone was painted across the next room (m06 R5, m08 blind M2). A
 * hostile NPC keeps its cone wherever it is (the player needs to see a chaser).
 * @param {object} npc - NPC entry (npc.roomId)
 * @param {string|null} playerRoomId - the player's room (last known)
 * @param {boolean} [isHostile=false]
 */
export function losVisualOutOfRoom(npc, playerRoomId, isHostile = false) {
  if (isHostile || !npc || !npc.roomId || !playerRoomId) return false;
  return npc.roomId !== playerRoomId;
}

/**
 * True when an NPC's sight circle has nothing left to warn about (m08 E9): its
 * only use of sight is catching a lockpick (one or more lockpick_used_in_view
 * person-chat mappings, no los.challengeOnSight), and none of those mappings
 * would fire now: a once-only catch already spent, maxTriggers reached, or its
 * condition off (m08's off-duty agent after the naming). A mapping that is only
 * on cooldown still counts as live. Hostile NPCs keep their cone.
 * @param {object} npc - NPC entry (eventMappings, los)
 * @param {Function} wouldFire - (mapping, index) => { fire, reason } from npc-manager _mappingWouldFire
 * @param {boolean} [isHostile=false]
 */
export function losCatchSpent(npc, wouldFire, isHostile = false) {
  if (isHostile || !npc || typeof wouldFire !== 'function') return false;
  if (npc.los?.challengeOnSight) return false;
  const maps = Array.isArray(npc.eventMappings) ? npc.eventMappings : [];
  const catches = [];
  maps.forEach((mapping, index) => {
    if (mapping?.eventPattern === 'lockpick_used_in_view' && mapping.conversationMode === 'person-chat') {
      catches.push({ mapping, index });
    }
  });
  if (catches.length === 0) return false;
  return catches.every(({ mapping, index }) => {
    const r = wouldFire(mapping, index) || {};
    if (r.fire) return false;
    return !(typeof r.reason === 'string' && r.reason.startsWith('on cooldown'));
  });
}

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
  
  // The cone sits on the floor at the NPC's feet (body centre), where sight is
  // tested (npc-sight-occlusion.js), so it stops at the foot of a wall or rack.
  // No body yet: the sprite centre. Sight from the torch (los.origin): the hand,
  // where the beam starts, so the cone lies over the beam.
  const feet = npc?._sprite?.body?.center || npc?.sprite?.body?.center;
  const torchFrom = losTorchOrigin(npc, losConfig);
  const coneOrigin = torchFrom
    ? torchFrom
    : (feet && Number.isFinite(feet.x) && Number.isFinite(feet.y))
      ? { x: feet.x, y: feet.y }
      : { x: npcPos.x, y: npcPos.y };

  const npcFacingRad = Phaser.Math.DegToRad(npcFacing);
  const halfAngleRad = Phaser.Math.DegToRad(angle / 2);
  const leftAngle = npcFacingRad - halfAngleRad;
  const rightAngle = npcFacingRad + halfAngleRad;
  const segments = Math.max(12, Math.floor(angle / 5));

  // Ray fan clipped by walls, closed doors and tall props (unless los.occlusion is false)
  const occ = (typeof window !== 'undefined' && losConfig.occlusion !== false) ? window.npcSightOcclusion : null;
  const fanAngles = [];
  for (let i = 0; i <= segments; i++) fanAngles.push(leftAngle + (rightAngle - leftAngle) * (i / segments));
  const fan = (occ && typeof occ.clipFan === 'function')
    ? occ.clipFan(coneOrigin, fanAngles, scaledRange)
    : fanAngles.map(() => scaledRange);
  const pointAt = (i, radius) => new Phaser.Geom.Point(
    coneOrigin.x + Math.min(radius, fan[i]) * Math.cos(fanAngles[i]),
    coneOrigin.y + Math.min(radius, fan[i]) * Math.sin(fanAngles[i])
  );

  const graphics = scene.add.graphics();

  // Outer range outline (light), clipped the same way
  graphics.lineStyle(1, color, 0.2);
  if (occ && typeof occ.clipFan === 'function') {
    const ringSteps = 48;
    const ringAngles = [];
    for (let i = 0; i < ringSteps; i++) ringAngles.push((i / ringSteps) * Math.PI * 2);
    const ring = occ.clipFan(coneOrigin, ringAngles, scaledRange);
    graphics.strokePoints(ringAngles.map((a, i) => new Phaser.Geom.Point(
      coneOrigin.x + ring[i] * Math.cos(a), coneOrigin.y + ring[i] * Math.sin(a))), true);
  } else {
    graphics.strokeCircle(coneOrigin.x, coneOrigin.y, scaledRange);
  }

  // Cone fill in rings, fading in from the centre; each ray stops at its occluder
  const numRadii = Math.max(8, Math.floor(segments / 2));
  for (let r = 0; r < numRadii; r++) {
    const innerRadius = scaledRange * (r / numRadii);
    const outerRadius = scaledRange * ((r + 1) / numRadii);
    // Nothing of this ring is in view
    if (!fan.some(d => d > innerRadius)) break;
    const slicePoints = [];
    for (let i = 0; i <= segments; i++) slicePoints.push(pointAt(i, innerRadius));
    for (let i = segments; i >= 0; i--) slicePoints.push(pointAt(i, outerRadius));
    graphics.fillStyle(color, coneAlpha * ((r + 1) / numRadii));
    graphics.fillPoints(slicePoints, true);
  }

  // Facing line
  graphics.lineStyle(3, color, 0.1);
  const mid = Math.floor(segments / 2);
  const dirLength = Math.min(scaledRange * 0.4, fan[mid]);
  graphics.lineBetween(
    coneOrigin.x,
    coneOrigin.y,
    coneOrigin.x + dirLength * Math.cos(npcFacingRad),
    coneOrigin.y + dirLength * Math.sin(npcFacingRad)
  );

  // Edge markers
  graphics.lineStyle(1, color, 0.5);
  const leftEdge = pointAt(0, scaledRange);
  const rightEdge = pointAt(segments, scaledRange);
  graphics.lineBetween(coneOrigin.x, coneOrigin.y, leftEdge.x, leftEdge.y);
  graphics.lineBetween(coneOrigin.x, coneOrigin.y, rightEdge.x, rightEdge.y);
  
  // On top of other objects, and above the light map when lighting is on, so a night
  // room doesn't dim the cone the player has to read. Same rule as overlayDepth() in
  // utils/constants.js, written against the light map's own depth so this module stays
  // import-free (several tests load it on its own).
  const lightMapDepth = (typeof window !== 'undefined') ? window.lightingSystem?.lightMap?.depth : undefined;
  graphics.setDepth(lightMapDepth !== undefined ? lightMapDepth + 10 + 9999 / 100 : 9999);
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
