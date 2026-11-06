/**
 * Seating: the player sits on chairs, or stands on them.
 *
 * Interacting with a supported chair (E, or a click) puts the player on it. The
 * player sprite stays the physics/movement driver but is hidden; a separate sprite
 * shows the pose on the chair:
 *  - sit: the atlas's seated frame ("sit_<compass>_frame_000", made by
 *    tools/pixellab_pipeline.py import --sit-from);
 *  - stand: the player's idle animation, feet on the seat. An avatar without seated
 *    frames stands on the chair instead of sitting.
 *
 * Controls while on a chair:
 *  - Swivel chairs roll with the player: normal movement (keys or click-to-move)
 *    moves the chair, with no walk animation, and the seat turns to the direction of
 *    travel, snapped to the chair's valid facings.
 *  - Static chairs: any move (keys or a click) hops the player off.
 *  - Space: from sitting, stand up on the chair; from standing on it, jump off.
 *  - Punching or blocking gets the player off. E still reaches objects nearby
 *    (a desk PC) and gets off only when there's nothing else in reach.
 *
 * Layering (from the 8-direction render tests): facing away (N, NE, NW) the chair is
 * drawn over the player, so the backrest hides the torso; every other facing draws
 * the player over the chair, with armrest strips redrawn on top where a chair has them
 * (seated only: standing, the player is above the armrests).
 *
 * Anchors: seat points are in chair-texture pixels (origin top-left); hip points are
 * in the 80x80 character atlas frame (PixelLab 60px seated rotations pasted at +10,+12);
 * standing, the feet (the body collider's centre) go on the seat point.
 */

export const COMPASS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
const REAR = new Set(['north', 'north-east', 'north-west']);

const PLAYER_TO_COMPASS = {
    'down': 'south', 'down-right': 'south-east', 'right': 'east', 'up-right': 'north-east',
    'up': 'north', 'up-left': 'north-west', 'left': 'west', 'down-left': 'south-west'
};
const COMPASS_TO_PLAYER = Object.fromEntries(Object.entries(PLAYER_TO_COMPASS).map(([k, v]) => [v, k]));

// Where the sitter's hips are in the atlas frame, per facing.
const SIT_HIP = {
    'south': [40, 52], 'south-east': [39, 54], 'east': [35, 52], 'north-east': [36, 52],
    'north': [40, 50], 'north-west': [44, 52], 'west': [45, 52], 'south-west': [41, 54]
};

// Atlases differ by a pixel or two in where the seated figure lands on the 80x80 canvas
// (the converter centres each character on its own standing pose), so SIT_HIP is
// corrected per atlas from the sit_south frame's opaque bounds, measured once. The
// reference is female_hacker_hood_v2: columns 28-51, last row 71.
const SIT_REF = { centreX: 39.5, bottom: 71 };
const hipShift = new Map();

function sitShift(textureKey) {
    if (hipShift.has(textureKey)) return hipShift.get(textureKey);
    let shift = { x: 0, y: 0 };
    try {
        const tm = window.game?.textures;
        const frame = tm?.getFrame(textureKey, 'sit_south_frame_000');
        if (frame && tm.getPixelAlpha) {
            let minX = Infinity, maxX = -1, bottom = -1;
            for (let y = 0; y < frame.height; y++) {
                for (let x = 0; x < frame.width; x++) {
                    if (tm.getPixelAlpha(x, y, textureKey, 'sit_south_frame_000') > 0) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        bottom = y;
                    }
                }
            }
            if (bottom >= 0) shift = { x: Math.round((minX + maxX) / 2 - SIT_REF.centreX), y: bottom - SIT_REF.bottom };
        }
    } catch (e) { /* keep the reference anchors */ }
    hipShift.set(textureKey, shift);
    return shift;
}

/** Hip point in the atlas frame for this texture and facing. */
function sitHip(textureKey, facing) {
    const h = SIT_HIP[facing], d = sitShift(textureKey);
    return [h[0] + d.x, h[1] + d.y];
}

// Seat point per facing for each chair shape. front: [x, y, w, h] strips of the chair
// (armrests) drawn over the sitter.
const FAMILIES = {
    exec: {
        // facing away, 4px higher than the seat itself so the hood clears the tall backrest
        seat: { 'south': [19, 37], 'south-east': [21, 34], 'east': [16, 31], 'north-east': [20, 26],
                'north': [19, 26], 'north-west': [18, 26], 'west': [22, 31], 'south-west': [17, 34] },
        front: { 'south': [[0, 24, 8, 14], [30, 24, 8, 14]] }
    },
    office40: {
        seat: { 'south': [19, 21], 'south-west': [21, 21], 'west': [23, 21], 'north-west': [21, 20],
                'north': [19, 20], 'north-east': [17, 20], 'east': [16, 21], 'south-east': [17, 21] },
        front: { 'south': [[6, 15, 6, 12], [28, 15, 6, 12]] }
    },
    white32: {
        seat: { 'south': [16, 11], 'south-west': [17, 11], 'west': [18, 11], 'north-west': [17, 10],
                'north': [16, 10], 'north-east': [15, 10], 'east': [14, 11], 'south-east': [15, 11] }
    }
};

// Swivel chairs: rotation texture base -> shape and frame order. The rotation sheets
// don't share one order (checked by eye on every frame): order 'cw' lists the frames in
// COMPASS order (S, SE, E, NE, ...), 'ccw' the other way (S, SW, W, NW, ...), each from
// its start facing. Frame 1 is south for most, north for chair-white-1.
// test/js/seating.test.mjs pins every table.
const SWIVEL_SEATS = {
    'chair-exec-rotate':       { family: 'exec',     order: 'cw',  start: 'south' },
    'chair-darkgray-1-rotate': { family: 'office40', order: 'ccw', start: 'south' },
    'chair-grey-1-rotate':     { family: 'office40', order: 'ccw', start: 'south' },
    'chair-grey-4-rotate':     { family: 'office40', order: 'ccw', start: 'south' },
    'chair-white-1-rotate':    { family: 'white32',  order: 'ccw', start: 'north' },
    'chair-white-2-rotate':    { family: 'white32',  order: 'ccw', start: 'south' }
    // valid: [...] (a subset of COMPASS) limits a chair's facings; default all 8
};

// Static chairs: texture -> the one way they face and the seat point.
const HOSPITAL_S = { facing: 'south', seat: [8, 15] };
const HOSPITAL_N = { facing: 'north', seat: [8, 13] };
const STATIC_SEATS = {
    hospital_chair_south: HOSPITAL_S, aw_chair_south_charcoal1: HOSPITAL_S, aw_chair_south_slate1: HOSPITAL_S,
    hospital_chair_north: HOSPITAL_N, hospital_chair_north2: HOSPITAL_N,
    aw_chair_north_charcoal1: HOSPITAL_N, aw_chair_north_slate1: HOSPITAL_N,
    exec_chair_back1: { facing: 'north', seat: [19, 26] },
    exec_chair_black1: { facing: 'south', seat: [16, 33] },
    aw_studio_chair_n1: { facing: 'north', seat: [16, 10] },
    m10_steel_chair1: { facing: 'south', seat: [8, 13] },
    // side-view sling chairs in receptions: left-1 faces west, right-1 east
    'chair-waiting-left-1': { facing: 'west', seat: [24, 23] },
    'chair-waiting-right-1': { facing: 'east', seat: [10, 23] },
    aw_studio_chair_s1: { facing: 'south', seat: [16, 11] },
    // armchairs
    sofa1: { facing: 'south', seat: [26, 41] },
    club_chair_e1: { facing: 'east', seat: [16, 26] },
    club_chair_w1: { facing: 'west', seat: [20, 26] },
    leather_chair1: { facing: 'south', seat: [15, 30] },
    // sofas and benches: several places, each taken by one person (two fit at this scale)
    leather_sofa1: { facing: 'south', places: [[19, 25], [43, 25]] },
    uni_sofa2: { facing: 'south', places: [[21, 25], [42, 25]] },
    hce_bench1: { facing: 'south', places: [[19, 10], [41, 10]] }
};

const ROLL_SPEED = 0.8;        // seated rolling speed, as a share of walking speed
const SEAT_DEPTH_STEP = 0.01;  // sitter just above/below the chair

function frameOrder(spec) {
    const order = spec.order === 'cw' ? COMPASS.slice() : [COMPASS[0], ...COMPASS.slice(1).reverse()];
    const s = order.indexOf(spec.start);
    return [...order.slice(s), ...order.slice(0, s)];
}

function swivelBase(sprite) {
    if (!sprite?.isSwivelChair || !sprite.originalTexture) return null;
    return sprite.originalTexture.replace(/\d+$/, '');
}

/** Seat description for a chair sprite, or null if it can't be sat on. */
export function seatSpec(sprite) {
    if (!sprite) return null;
    const base = swivelBase(sprite);
    if (base && SWIVEL_SEATS[base]) {
        const spec = SWIVEL_SEATS[base];
        return { kind: 'swivel', base, spec, family: FAMILIES[spec.family], order: frameOrder(spec),
                 valid: spec.valid || COMPASS };
    }
    const key = sprite.texture?.key;
    if (!sprite.isSwivelChair && STATIC_SEATS[key]) return { kind: 'static', ...STATIC_SEATS[key] };
    return null;
}

/** True for a texture/image name that is a sittable static chair (rooms.js marks these interactable). */
export function isStaticSeatTexture(name) {
    return !!STATIC_SEATS[name];
}

export function isSeat(sprite) {
    return !!seatSpec(sprite);
}

export function hasSitFrames(textureKey) {
    const tex = window.game?.textures?.get(textureKey);
    return !!tex && tex.has('sit_south_frame_000');
}

function angleOf(compass) {
    return COMPASS.indexOf(compass) * 45;
}

/** Screen angle (radians, 0 = east, +y = south) of the way a compass facing points. */
function forwardRad(compass) {
    return (90 - angleOf(compass)) * Math.PI / 180;
}

/** Nearest valid facing to a wanted one. */
export function snapFacing(wanted, valid = COMPASS) {
    if (valid.includes(wanted)) return wanted;
    let best = valid[0], bestDiff = Infinity;
    for (const v of valid) {
        let d = Math.abs(angleOf(v) - angleOf(wanted)) % 360;
        if (d > 180) d = 360 - d;
        if (d < bestDiff) { bestDiff = d; best = v; }
    }
    return best;
}

/** Which way a chair faces now. */
export function chairFacing(chair, seat = seatSpec(chair)) {
    if (!seat) return null;
    if (seat.kind === 'static') return seat.facing;
    const idx = ((Math.floor(chair.currentFrame || 0) % 8) + 8) % 8;
    return seat.order[idx];
}

/** Turn a swivel chair to a facing (sets its texture and frame counter). */
export function setChairFacing(chair, facing, seat = seatSpec(chair)) {
    if (!seat || seat.kind !== 'swivel') return;
    const idx = seat.order.indexOf(facing);
    if (idx < 0) return;
    chair.currentFrame = idx;
    chair.rotationSpeed = 0;
    chair.spinDirection = 0;
    const tex = `${seat.base}${idx + 1}`;
    if (chair.texture.key !== tex && chair.scene.textures.exists(tex)) chair.setTexture(tex);
}

/** World point where the sitter's hips go on this chair (place `place` of a sofa), facing `facing`. */
function seatPoint(chair, seat, facing, place = 0) {
    const p = seat.kind === 'static' ? (seat.places ? seat.places[place] : seat.seat) : seat.family.seat[facing];
    return { x: chair.x + p[0], y: chair.y + p[1] };
}

// ---- occupancy. A chair holds one person (chair.seatedBy); a sofa or bench one per
// place (chair._places), and reads as seatedBy 'full' once every place is taken, so
// code that only asks "is it free?" keeps working.

/** Floor point under a place (or under the chair). */
function placeFoot(chair, seat, place = 0) {
    const x = seat?.places ? chair.x + seat.places[place][0] : chair.x + chair.width / 2;
    return { x, y: chair.y + chair.height };
}

/** Free places, nearest to `near` first (a plain chair: [0] if free). */
function freePlaces(chair, seat, near = null) {
    if (!seat?.places) return chair.seatedBy ? [] : [0];
    const taken = chair._places || {};
    const free = seat.places.map((_, i) => i).filter(i => !taken[i]);
    if (near) {
        const d = i => { const f = placeFoot(chair, seat, i); return Math.hypot(f.x - near.x, f.y - near.y); };
        free.sort((a, b) => d(a) - d(b));
    }
    return free;
}

/** Take a place for `who`; returns its index, or -1 when the chair is full. */
function takePlace(chair, seat, who, near = null) {
    const i = freePlaces(chair, seat, near)[0];
    if (i === undefined) return -1;
    if (!seat?.places) { chair.seatedBy = who; return 0; }
    chair._places = chair._places || {};
    chair._places[i] = who;
    if (Object.keys(chair._places).length >= seat.places.length) chair.seatedBy = 'full';
    return i;
}

function releasePlace(chair, seat, place = 0) {
    if (seat?.places && chair._places) delete chair._places[place];
    delete chair.seatedBy;
}

// ---------------------------------------------------------------- player state

// { chair, seat, facing, pose, sprite, overlays[], approach, footOffset, savedBody,
//   chairBodyWasEnabled, jumping }
let state = null;

export function isSeated() { return !!state; }
export function currentSeat() { return state?.chair || null; }
export function currentPose() { return state?.pose || null; }
export function canRoll() { return state?.seat.kind === 'swivel'; }

/** Whether the player's avatar has seated frames (otherwise it stands on chairs). */
export function canPlayerSit() {
    const player = window.player;
    return !!player && hasSitFrames(player.texture?.key);
}

/** Interaction entry point: get on a chair. Returns true when it handled the sprite. */
export function trySit(chair) {
    const seat = seatSpec(chair);
    if (!seat || !window.player?.body) return false;
    if (state?.jumping) return true;
    if (state?.chair === chair) { standUp(); return true; }
    if (state) standUp();
    if (!freePlaces(chair, seat).length) return true; // taken: nothing happens
    sitOn(chair, seat, canPlayerSit() ? 'sit' : 'stand');
    return true;
}

/**
 * Feet (body-collider centre) of a sprite, from its transform and body offset. Not
 * body.center: that is stale between a body.reset() and the next physics step.
 */
function bodyFeet(sprite) {
    const b = sprite.body;
    if (!b) return { x: sprite.x, y: sprite.y };
    return {
        x: sprite.x + (b.offset.x - sprite.displayOriginX) * sprite.scaleX + b.width / 2,
        y: sprite.y + (b.offset.y - sprite.displayOriginY) * sprite.scaleY + b.height / 2
    };
}
const playerFeet = bodyFeet;

/**
 * Move a sprite and its body together. Phaser 3.60's body.reset() puts the body at
 * the sprite's top-left, ignoring the body offset, until the next physics step, so
 * body.center reads wrong in between (the needs system reads it). Re-sync from the
 * sprite and set prev/prevFrame to match, so the post-update write-back adds nothing.
 */
function placeBody(sprite, x, y) {
    const b = sprite.body;
    if (!b) { sprite.setPosition(x, y); return; }
    b.reset(x, y);
    if (b.updateFromGameObject) {
        b.updateFromGameObject();
        b.prev.copy(b.position);
        b.prevFrame.copy(b.position);
        b.updateCenter?.();
    }
}

/** Move a sprite so its feet land on (x, y). */
function moveFeetTo(sprite, x, y) {
    const f = bodyFeet(sprite);
    placeBody(sprite, sprite.x + (x - f.x), sprite.y + (y - f.y));
}
const moveDriverFeetTo = moveFeetTo;

function sitOn(chair, seat, pose) {
    const player = window.player;
    const scene = chair.scene;
    window.cancelClickToMove?.();
    player.body.setVelocity(0, 0);

    const approach = playerFeet(player);
    const placeIdx = takePlace(chair, seat, 'player', approach);
    if (placeIdx < 0) return false; // every place taken
    let facing;
    if (seat.kind === 'swivel') {
        facing = snapFacing(chairFacing(chair, seat), seat.valid);
        setChairFacing(chair, facing, seat);
    } else {
        facing = seat.facing;
    }

    const savedBody = {
        w: player.body.width, h: player.body.height,
        ox: player.body.offset.x, oy: player.body.offset.y,
        none: player.body.checkCollision.none
    };
    let footOffset;
    let chairBodyWasEnabled = false;
    if (seat.kind === 'swivel' && chair.body) {
        // The driver's body takes over the chair's footprint; the chair follows it.
        footOffset = { x: chair.body.offset.x + chair.body.width / 2, y: chair.body.offset.y + chair.body.height / 2 };
        const bw = chair.body.width, bh = chair.body.height;
        const cx = savedBody.ox + savedBody.w / 2, cy = savedBody.oy + savedBody.h / 2;
        chair.body.setVelocity(0, 0);
        chairBodyWasEnabled = chair.body.enable;
        chair.body.enable = false;
        player.body.setSize(bw, bh, false);
        player.body.setOffset(cx - bw / 2, cy - bh / 2);
        moveDriverFeetTo(player, chair.x + footOffset.x, chair.y + footOffset.y);
    } else {
        // Static: no collisions while on it; the driver sits at the chair's foot.
        const pf = placeFoot(chair, seat, placeIdx);
        footOffset = { x: pf.x - chair.x, y: chair.height - 2 };
        player.body.checkCollision.none = true;
        moveDriverFeetTo(player, chair.x + footOffset.x, chair.y + footOffset.y);
    }

    const sprite = scene.add.sprite(0, 0, player.texture.key).setOrigin(0, 0);
    const overlays = [0, 1].map(() => scene.add.image(0, 0, chair.texture.key).setOrigin(0, 0).setVisible(false));

    player.setVisible(false);
    player.anims.stop();
    player.isMoving = false;
    player.isSeated = true;
    player.direction = COMPASS_TO_PLAYER[facing];
    player.lastDirection = player.direction;

    state = { chair, seat, facing, pose, sprite, overlays, approach, footOffset, savedBody,
              chairBodyWasEnabled, jumping: false, shownAnim: null, place: placeIdx };
    applyPose();
    place();
    window.eventDispatcher?.emit?.(pose === 'sit' ? 'player_sat' : 'player_stood_on_chair',
        { objectId: chair.objectId, facing });
}

/** Show the current pose on the proxy sprite. */
function applyPose() {
    const { sprite, pose, facing } = state;
    const player = window.player;
    if (pose === 'sit') {
        state.shownAnim = null;
        sprite.anims.stop();
        const frame = `sit_${facing}_frame_000`;
        if (sprite.frame.name !== frame) sprite.setFrame(frame);
    } else {
        const key = `idle-${COMPASS_TO_PLAYER[facing]}`;
        if (state.shownAnim !== key) {
            state.shownAnim = key;
            if (player.anims.animationManager.exists(key)) sprite.play(key, true);
            else sprite.setFrame(player.frame.name);
        }
    }
}

/** Get off the chair: stand beside it (or at `spot`). */
export function standUp(spot = null) {
    if (!state) return false;
    const player = window.player;
    const { chair, seat, sprite, overlays, savedBody, approach, chairBodyWasEnabled, facing, place: placeIdx } = state;
    state = null;
    sprite.destroy();
    overlays.forEach(o => o.destroy());
    releasePlace(chair, seat, placeIdx);

    player.body.setVelocity(0, 0);
    player.body.setSize(savedBody.w, savedBody.h, false);
    player.body.setOffset(savedBody.ox, savedBody.oy);
    player.body.checkCollision.none = savedBody.none;

    if (seat.kind === 'swivel' && chair.body) {
        chair.body.enable = chairBodyWasEnabled;
        placeBody(chair, chair.x, chair.y);
        chair.body.setVelocity(0, 0);
    }
    spot = spot || landingSpot(chair, seat, facing, approach);
    if (spot) moveDriverFeetTo(player, spot.x, spot.y);

    player.isSeated = false;
    player.setVisible(true);
    const dir = player.direction || 'down';
    const animKey = `idle-${dir}`;
    if (player.anims.animationManager.exists(animKey)) player.anims.play(animKey, true);
    window.eventDispatcher?.emit?.('player_stood', { objectId: chair.objectId });
    return true;
}

/** Where the player lands getting off: beside a swivel chair, back where they came from for a static one. */
function landingSpot(chair, seat, facing, approach) {
    return seat.kind === 'swivel' ? standSpot(chair, facing) : approach;
}

/** A walkable spot next to a swivel chair, in front of it first. */
function standSpot(chair, facing) {
    const pfm = window.pathfindingManager;
    const b = chair.body;
    const foot = b ? bodyFeet(chair) : { x: chair.x + chair.width / 2, y: chair.y + chair.height };
    const cx = foot.x, cy = foot.y;
    const reach = (b ? Math.max(b.width, b.height) / 2 : 10) + 14; // clear of the chair body
    const start = COMPASS.indexOf(facing);
    for (const step of [0, 1, -1, 2, -2, 3, -3, 4]) {
        const a = forwardRad(COMPASS[(start + step + 8) % 8]);
        const x = cx + Math.cos(a) * reach, y = cy + Math.sin(a) * reach;
        const cell = pfm?.findNearestWalkableWorldCell?.(x, y, 1);
        if (cell && Math.hypot(cell.x - x, cell.y - y) < 12) return { x: cell.x, y: cell.y };
    }
    return pfm?.findNearestWalkableWorldCell?.(cx, cy + reach, 3) || null;
}

/**
 * Space on a chair: sitting -> stand up on the seat; standing on it -> jump off.
 * Returns true when it handled the key.
 */
export function onJumpKey() {
    if (!state) return false;
    if (state.jumping) return true;
    if (state.pose === 'sit') {
        state.pose = 'stand';
        applyPose();
        place();
        window.eventDispatcher?.emit?.('player_stood_on_chair', { objectId: state.chair.objectId, facing: state.facing });
        return true;
    }
    jumpOff();
    return true;
}

const JUMP_MS = 320;
const JUMP_HEIGHT = 14;

/** Hop from the seat to the floor beside the chair, then hand control back. */
function jumpOff() {
    const player = window.player;
    const { chair, seat, facing, approach, sprite } = state;
    // Work out the landing spot with the chair's own body back in place.
    const spot = landingSpot(chair, seat, facing, approach);
    if (!spot) { standUp(); return; }
    state.jumping = true;
    player.body.setVelocity(0, 0);
    window.cancelClickToMove?.();
    // The proxy's feet move from the seat to the spot along an arc.
    const feet = proxyFeetOffset();
    const fromX = sprite.x, fromY = sprite.y;
    const toX = Math.round(spot.x - feet.x), toY = Math.round(spot.y - feet.y);
    sprite.setDepth(Math.max(sprite.depth, chair.depth) + 1);
    state.overlays.forEach(o => o.setVisible(false));
    chair.scene.tweens.addCounter({
        from: 0, to: 1, duration: JUMP_MS,
        onUpdate: (tw) => {
            const t = tw.getValue();
            sprite.setPosition(Math.round(fromX + (toX - fromX) * t),
                               Math.round(fromY + (toY - fromY) * t - Math.sin(t * Math.PI) * JUMP_HEIGHT));
        },
        onComplete: () => { if (state?.sprite === sprite) standUp(spot); }
    });
}

/** Feet point inside the player's frame: the centre of its (standing) body collider. */
function proxyFeetOffset() {
    const b = state.savedBody;
    return { x: b.ox + b.w / 2, y: b.oy + b.h / 2 };
}

// Castor sound while rolling: the steady 1.5-7.5 s stretch of chair_roll.mp3 (it fades
// out and has a gap after 8 s), looped. Same channel as footsteps (scene sound, not SoundManager).
let rollSound = null;
function updateRollSound(moving) {
    try {
        const scene = window.game;
        if (!scene?.sound) return;
        if (moving) {
            if (!rollSound) {
                if (!scene.cache?.audio?.exists?.('chair_roll')) return;
                rollSound = scene.sound.add('chair_roll');
                rollSound.addMarker({ name: 'roll', start: 1.5, duration: 6, config: { loop: true, volume: 0.9 } });
            }
            if (!rollSound.isPlaying) rollSound.play('roll');
        } else if (rollSound?.isPlaying) {
            rollSound.stop();
        }
    } catch (e) { /* sound unavailable */ }
}

/** Called right after the normal player movement each frame. */
export function afterPlayerMovement() {
    if (!state) { updateRollSound(false); checkPending(); return; }
    const player = window.player;
    if (window.playerHealth?.isKO?.()) { standUp(); return; }
    if (state.jumping) { player.body.setVelocity(0, 0); updateRollSound(false); return; }
    if (state.seat.kind === 'swivel') {
        player.body.velocity.x *= ROLL_SPEED;
        player.body.velocity.y *= ROLL_SPEED;
    }
    updateRollSound(state.seat.kind === 'swivel' && (player.body.velocity.x !== 0 || player.body.velocity.y !== 0));
    if (player.anims.isPlaying) player.anims.stop(); // no walk/idle animation on the hidden driver
}

/** Static chairs: a move attempt hops the player off first. Any move drops a queued sit. */
export function onMoveIntent() {
    pending = null;
    if (state && !state.jumping && state.seat.kind === 'static') standUp();
}

// A chair tapped from out of reach: sit once the walk there ends in reach.
let pending = null; // { chair, until, still }
const PENDING_MS = 8000;

export function queueSit(chair) {
    pending = { chair, until: Date.now() + PENDING_MS, still: 0 };
}

function checkPending() {
    if (!pending) return;
    const player = window.player;
    const { chair } = pending;
    if (Date.now() > pending.until || !chair.active || state) { pending = null; return; }
    const v = player.body.velocity;
    pending.still = (v.x === 0 && v.y === 0) ? pending.still + 1 : 0;
    if (pending.still >= 3 && window.isObjectInInteractionRange?.(chair)) {
        pending = null;
        trySit(chair);
    }
}

/** Position the chair, the pose sprite and armrest strips (scene postupdate). */
export function place() {
    if (!state || state.jumping) return;
    const player = window.player;
    const { chair, seat, sprite, overlays, footOffset } = state;
    if (!chair.active || !player?.body) { standUp(); return; }

    if (seat.kind === 'swivel') {
        const want = snapFacing(PLAYER_TO_COMPASS[player.direction] || state.facing, seat.valid);
        if (want !== state.facing) {
            state.facing = want;
            setChairFacing(chair, want, seat);
        }
        const f = playerFeet(player);
        chair.x = Math.round(f.x - footOffset.x);
        chair.y = Math.round(f.y - footOffset.y);
        window.updateSpriteDepth?.(chair, chair.elevation || 0);
    } else if (player.direction !== COMPASS_TO_PLAYER[state.facing]) {
        // Static seats keep their facing (a conversation may have turned the driver).
        player.direction = COMPASS_TO_PLAYER[state.facing];
    }
    applyPose();

    const facing = state.facing;
    const sp = seatPoint(chair, seat, facing, state.place);
    const anchor = state.pose === 'sit' ? sitHip(sprite.texture.key, facing) : [proxyFeetOffset().x, proxyFeetOffset().y];
    sprite.setPosition(Math.round(sp.x - anchor[0]), Math.round(sp.y - anchor[1]));
    sprite.setVisible(chair.visible);

    const rear = REAR.has(facing);
    sprite.setDepth(chair.depth + (rear ? -SEAT_DEPTH_STEP : SEAT_DEPTH_STEP));
    // The hidden driver keeps a depth too, for anything that reads it.
    player.setDepth(sprite.depth);

    const strips = (state.pose === 'sit' && !rear && seat.kind === 'swivel' && seat.family.front?.[facing]) || [];
    overlays.forEach((o, i) => {
        const r = strips[i];
        if (!r) { o.setVisible(false); return; }
        if (o.texture.key !== chair.texture.key) o.setTexture(chair.texture.key);
        o.setPosition(chair.x, chair.y).setCrop(r[0], r[1], r[2], r[3])
            .setDepth(chair.depth + 2 * SEAT_DEPTH_STEP).setVisible(chair.visible);
    });
}

// ---------------------------------------------------------------- NPCs
//
// An NPC with "seated": true (or { "maxDistance": 48, "facing": "west",
// "facePlayer": true, "chair": "exec_chair_back1" }) in its scenario entry sits on the
// nearest free chair within maxDistance px of its spawn (only chairs matching "chair",
// an object id, id suffix or image name, when given). Its own sprite shows the seated frame and stays the
// interaction and sight target. It holds the chair (no patrol) until a scripted move
// (goToAndStay, the needs system), hostility or a KO gets it up. On a swivel chair it
// turns to face a player within its facePlayerDistance unless facePlayer is false.
// Atlases without seated frames can't sit: the NPC stays standing (warned once).

const NPC_DEFAULT_REACH = 40;

function npcSeatConfig(behavior) {
    const npc = window.npcManager?.getNPC?.(behavior.npcId);
    const raw = npc?.seated;
    if (!raw) return null;
    return raw === true ? {} : raw;
}

/** Does a chair match a "chair" filter: its object id (or id suffix) or its image name. */
function chairMatches(obj, want) {
    if (!want) return true;
    const id = obj.objectId || '';
    return id === want || id.endsWith(`_${want}`) || obj.name === want || obj.scenarioData?.id === want
        || (obj.originalTexture || '').replace(/-rotate\d+$/, '') === want;
}

function chairsNear(roomId, x, y, maxDistance, want = null) {
    const room = window.rooms?.[roomId];
    if (!room?.objects) return [];
    const out = [];
    for (const obj of Object.values(room.objects)) {
        if (!obj.active || obj.seatedBy || !chairMatches(obj, want)) continue;
        const seat = seatSpec(obj);
        if (!seat) continue;
        const i = freePlaces(obj, seat, { x, y })[0];
        if (i === undefined) continue;
        const f = placeFoot(obj, seat, i);
        const d = Math.hypot(f.x - x, f.y - y);
        if (d <= maxDistance) out.push({ obj, seat, d });
    }
    return out.sort((a, b) => a.d - b.d);
}

/** Place a seated sprite (origin-aware) so its hips land on the chair's seat. */
function poseSprite(sprite, chair, seat, facing, place = 0) {
    const sp = seatPoint(chair, seat, facing, place);
    const hip = sitHip(sprite.texture.key, facing);
    const x = Math.round(sp.x - hip[0] + sprite.displayOriginX);
    const y = Math.round(sp.y - hip[1] + sprite.displayOriginY);
    if (Math.round(sprite.x) !== x || Math.round(sprite.y) !== y) placeBody(sprite, x, y);
    if (sprite.anims?.isPlaying) sprite.anims.stop();
    const frame = `sit_${facing}_frame_000`;
    if (sprite.frame.name !== frame) sprite.setFrame(frame);
    sprite.setDepth(chair.depth + (REAR.has(facing) ? -SEAT_DEPTH_STEP : SEAT_DEPTH_STEP));
}

export function compassToward(dx, dy) {
    const a = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360; // 0 = east, 90 = south
    return COMPASS[((Math.round((90 - a) / 45) % 8) + 8) % 8];
}

// ---- fidget: a seated NPC on a swivel chair rolls a few pixels now and again, sideways
// or back from where it faces (never forward, into the desk), then settles.
const FIDGET_MIN_MS = 4000, FIDGET_MAX_MS = 11000, FIDGET_ROLL_MS = 700;
const FIDGET_SIDE = 3, FIDGET_BACK = 2;

/** A roll offset for a chair facing `facing`: up to 3px sideways and 2px back. */
export function fidgetOffset(facing, rand = Math.random) {
    if (rand() < 0.3) return { x: 0, y: 0 }; // back to where it sat down
    const a = forwardRad(facing); // forward, as tuckIn
    const fx = Math.cos(a), fy = Math.sin(a);
    const side = Math.round((rand() * 2 - 1) * FIDGET_SIDE);
    const back = Math.round(rand() * FIDGET_BACK);
    return { x: Math.round(-fy * side - fx * back), y: Math.round(fx * side - fy * back) };
}

/** Move a seated NPC's swivel chair along its current roll; `hold` starts no new roll. */
function fidgetChair(st, sprite, hold) {
    const chair = st.chair;
    if (st.seat.kind !== 'swivel' || !chair.body) return;
    const now = sprite.scene?.time?.now ?? performance.now();
    const wait = () => now + FIDGET_MIN_MS + Math.random() * (FIDGET_MAX_MS - FIDGET_MIN_MS);
    const fd = st.fidget || (st.fidget = { home: { x: chair.x, y: chair.y }, from: { x: 0, y: 0 },
                                           to: { x: 0, y: 0 }, cur: { x: 0, y: 0 }, start: 0, next: wait() });
    if (now >= fd.next && !hold) {
        fd.from = { ...fd.cur };
        fd.to = fidgetOffset(st.homeFacing);
        fd.start = now;
        fd.next = wait();
    }
    const t = Math.min(1, (now - fd.start) / FIDGET_ROLL_MS);
    const e = 0.5 - Math.cos(t * Math.PI) / 2;
    fd.cur = { x: fd.from.x + (fd.to.x - fd.from.x) * e, y: fd.from.y + (fd.to.y - fd.from.y) * e };
    const x = Math.round(fd.home.x + fd.cur.x), y = Math.round(fd.home.y + fd.cur.y);
    if (chair.x !== x || chair.y !== y) {
        chair.x = x; chair.y = y;
        placeBody(chair, x, y);
    }
}

/** Sit an NPC (its behaviour object) on a chair. Returns true when seated. */
export function seatNPC(behavior, chair, opts = {}) {
    const sprite = behavior?.sprite;
    const seat = seatSpec(chair);
    if (!sprite?.body || !seat || !freePlaces(chair, seat).length) return false;
    if (!hasSitFrames(sprite.texture.key)) {
        if (!behavior._seatWarned) console.warn(`🪑 ${behavior.npcId}: atlas ${sprite.texture.key} has no seated frames; stays standing`);
        behavior._seatWarned = true;
        return false;
    }
    let facing = seat.kind === 'static' ? seat.facing
        : snapFacing(opts.facing && COMPASS.includes(opts.facing) ? opts.facing : chairFacing(chair, seat), seat.valid);
    if (seat.kind === 'swivel' && opts.toward) {
        const f = bodyFeet(sprite);
        facing = snapFacing(compassToward(opts.toward.x - f.x, opts.toward.y - f.y), seat.valid);
    }
    if (seat.kind === 'swivel') setChairFacing(chair, facing, seat);
    const saved = { none: sprite.body.checkCollision.none, immovable: sprite.body.immovable,
                    chairImmovable: chair.body ? chair.body.immovable : null };
    sprite.body.setVelocity(0, 0);
    sprite.body.checkCollision.none = true;
    sprite.body.immovable = true;
    if (chair.body) { chair.body.setVelocity(0, 0); chair.body.immovable = true; }
    const placeIdx = takePlace(chair, seat, behavior.npcId, bodyFeet(sprite));
    behavior._seat = { chair, seat, facing, saved, place: placeIdx, homeFacing: facing, facePlayer: opts.facePlayer !== false,
                       needsStop: opts.needsStop || null,
                       // needs seats: stand back up where the NPC works from
                       standAt: opts.needsStop ? bodyFeet(sprite) : null };
    behavior.isMoving = false;
    behavior.direction = COMPASS_TO_PLAYER[facing];
    poseSprite(sprite, chair, seat, facing, placeIdx);
    window.eventDispatcher?.emit?.('npc_sat', { npcId: behavior.npcId, objectId: chair.objectId, facing });
    return true;
}

/** Stand a seated NPC up beside its chair. */
export function unseatNPC(behavior) {
    const st = behavior?._seat;
    if (!st) return false;
    const sprite = behavior.sprite;
    const { chair, seat, facing, saved, standAt, needsStop, place: placeIdx } = st;
    behavior._seat = null;
    behavior._seatTried = true; // don't sit straight back down
    releasePlace(chair, seat, placeIdx);
    if (chair.body && saved.chairImmovable !== null) chair.body.immovable = saved.chairImmovable;
    if (sprite?.body) {
        sprite.body.checkCollision.none = saved.none;
        sprite.body.immovable = saved.immovable;
        // Stand on the floor in front of the chair (or beside it)
        const spot = standAt || (seat.kind === 'swivel' ? standSpot(chair, facing) : frontSpot(chair, facing, placeFoot(chair, seat, placeIdx)));
        if (spot) moveFeetTo(sprite, spot.x, spot.y);
    }
    if (needsStop) tuckIn(chair, seat, facing); // clear of the spot they come back to
    behavior.direction = COMPASS_TO_PLAYER[facing];
    behavior.playAnimation?.('idle', behavior.direction);
    window.eventDispatcher?.emit?.('npc_stood', { npcId: behavior.npcId, objectId: chair.objectId });
    return true;
}

function frontSpot(chair, facing, foot = null) {
    const a = forwardRad(facing);
    const f = foot || { x: chair.x + chair.width / 2, y: chair.y + chair.height };
    const x = f.x + Math.cos(a) * 18;
    const y = f.y - 4 + Math.sin(a) * 18;
    return window.pathfindingManager?.findNearestWalkableWorldCell?.(x, y, 2) || { x, y };
}

/**
 * Called from NPCBehavior.update(). Returns true when the NPC is seated and the
 * rest of its behaviour should be skipped this tick.
 */
export function updateSeatedNPC(behavior, playerPos) {
    const ns = window.npcNeedsSystem?.states?.get?.(behavior?.npcId);
    if (ns) return updateNeedsSeat(behavior, ns, playerPos);
    if (!behavior?._seat) {
        if (behavior._seatTried || !window.rooms) return false;
        const cfg = npcSeatConfig(behavior);
        if (!cfg) { behavior._seatTried = true; return false; }
        const room = window.rooms[behavior.roomId];
        if (!room?.objects || !Object.keys(room.objects).length) return false; // room not built yet
        behavior._seatTried = true;
        const f = bodyFeet(behavior.sprite);
        const found = chairsNear(behavior.roomId, f.x, f.y, cfg.maxDistance ?? NPC_DEFAULT_REACH, cfg.chair || null)[0];
        if (!found) {
            console.warn(`🪑 ${behavior.npcId}: "seated" but no free chair within ${cfg.maxDistance ?? NPC_DEFAULT_REACH}px of its spawn`);
            return false;
        }
        if (!seatNPC(behavior, found.obj, cfg)) return false;
    }
    const st = behavior._seat;
    const sprite = behavior.sprite;
    const ko = window.npcHostileSystem?.isNPCKO?.(behavior.npcId);
    if (behavior.hostile || ko || !st.chair.active) { unseatNPC(behavior); return false; }
    sprite.body.setVelocity(0, 0);
    let facingPlayer = false;
    if (st.seat.kind === 'swivel' && st.facePlayer && playerPos) {
        const p = bodyFeet(sprite);
        const dx = playerPos.x - p.x, dy = playerPos.y - p.y;
        const near = dx * dx + dy * dy <= (behavior.config?.facePlayerDistanceSq ?? 96 * 96);
        facingPlayer = near;
        const want = snapFacing(near ? compassToward(dx, dy) : st.homeFacing, st.seat.valid);
        if (want !== st.facing) {
            st.facing = want;
            setChairFacing(st.chair, want, st.seat);
            behavior.direction = COMPASS_TO_PLAYER[want];
        }
    }
    fidgetChair(st, sprite, facingPlayer);
    window.updateSpriteDepth?.(st.chair, st.chair.elevation || 0);
    poseSprite(sprite, st.chair, st.seat, st.facing, st.place);
    return true;
}

// ---------------------------------------------------------------- NPC needs (npc-needs.js)
//
// A needs NPC that has stopped at an object (using it, or idle at its post) sits on
// a free chair right there, facing the object. With none close it fetches a free
// swivel chair from the same room (rolling it to where it works), unless the object's
// affordance says "seat": "stay" (sit only if one is there) or false (always stand);
// with nothing to fetch it works standing. Chairs at another needs NPC's post are left
// alone. Any needs move (coffee, going home) gets it up: goToAndStay unseats.
// Atlases without seated frames always stand.

const NEAR_CHAIR = 36;      // px from the NPC's feet to a chair's foot to sit straight down
const FETCH_RANGE = 192;    // px to look for a chair to fetch
const FETCH_TIMEOUT_MS = 15000;

/** Where a needs NPC is parked: { key, targetId } or null while it's on the move. */
export function needsStop(ns) {
    const home = window.npcManager?.getNPC?.(ns.npcId)?.needsHome;
    const homeId = typeof home === 'string' ? home : null;
    // Own-desk work never leaves the post (npc-needs _atOwnPost): the home stop in every phase
    // (start, goto_target, using) and on the one `returning` tick after it, so the key never
    // changes and the NPC stays seated (OFFICE_LIFE_PLAN 2.11)
    const ownDesk = ns.atPost && ns.mode === 'job' && ns.job?.kind === 'use' && homeId && ns.job.targetId === homeId;
    if (ownDesk || (ns.mode === 'returning' && ns.atPost)) {
        return { key: `at:${homeId || 'post'}`, targetId: homeId, post: true, need: ownDesk ? ns.job.need : undefined };
    }
    // Keyed on the object, so finishing work at one's own desk doesn't stand the NPC up
    if (ns.mode === 'job' && ns.job?.phase === 'using') {
        return { key: `at:${ns.job.targetId}`, targetId: ns.job.targetId, post: ns.job.targetId === homeId, need: ns.job.need };
    }
    if (ns.mode === 'idle' && ns.atPost) return { key: `at:${homeId || 'post'}`, targetId: homeId, post: true };
    return null;
}

function needsObject(id) {
    return id ? window.npcNeedsSystem?.world?.getObject?.(id) || null : null;
}

/**
 * 'stand', 'near' (sit only on a chair already there) or 'fetch'. Default: fetch for
 * work and at the NPC's own post; elsewhere (the coffee machine) only a chair already there.
 */
function seatPreference(obj, npcRec, stop) {
    const a = obj?.affordance?.seat;
    if (a === false || a === 'never' || a === 'stand') return 'stand';
    if (a === 'stay' || a === 'near') return 'near';
    const n = npcRec?.seated;
    if (n === false) return 'stand';
    if (n && typeof n === 'object' && n.fetch === false) return 'near';
    if (a === 'fetch') return 'fetch';
    const sat = [].concat(obj?.affordance?.satisfies || []);
    return stop?.post || sat.includes('work') ? 'fetch' : 'near';
}

/** The point an NPC at this object faces: back along useFrom when given (square to the desk). */
function facePointFor(obj, feet) {
    if (!obj) return null;
    const uf = obj.affordance?.useFrom;
    if (uf && Number.isFinite(uf.dx) && Number.isFinite(uf.dy) && (uf.dx || uf.dy)) {
        return { x: feet.x - uf.dx * 32, y: feet.y - uf.dy * 32 };
    }
    return { x: obj.x, y: obj.y };
}

/** Facing a static chair allows: within 67 degrees of the way to the object. */
function staticFacesToward(seat, from, to) {
    if (!to) return true;
    const want = compassToward(to.x - from.x, to.y - from.y);
    let d = Math.abs(angleOf(want) - angleOf(seat.facing)) % 360;
    if (d > 180) d = 360 - d;
    return d <= 67;
}

/** Feet points of every other needs NPC's post (their chairs aren't taken or fetched). */
function otherPosts(npcId) {
    const out = [];
    const world = window.npcNeedsSystem?.world;
    for (const [id, st] of window.npcNeedsSystem?.states || []) {
        if (id === npcId) continue;
        if (st.home) { out.push(st.home); continue; }
        // Not ticked yet: work it out from its needsHome object, as the needs system will
        const home = window.npcManager?.getNPC?.(id)?.needsHome;
        const obj = typeof home === 'string' ? world?.getObject?.(home) : null;
        const cell = obj ? world?.approachCell?.(obj) : null;
        if (cell) out.push(cell);
    }
    return out;
}

const TUCK_PX = 12;

/** Slide a swivel chair so its foot is at (x, y) (pulling it out to sit, tucking it in on leaving). */
function slideChairFootTo(chair, x, y) {
    if (!chair.body) return;
    const f = bodyFeet(chair);
    chair.x = Math.round(chair.x + (x - f.x));
    chair.y = Math.round(chair.y + (y - f.y));
    placeBody(chair, chair.x, chair.y);
    window.updateSpriteDepth?.(chair, chair.elevation || 0);
}

function updateNeedsSeat(behavior, ns, playerPos) {
    const sprite = behavior.sprite;
    const stop = needsStop(ns);
    const status = window.npcNeedsSystem?.world?.npcStatus?.(behavior.npcId) || {};

    if (behavior._fetch) return advanceFetch(behavior, ns, stop);

    if (behavior._seat) {
        const st = behavior._seat;
        if (!stop || stop.key !== st.needsStop || status.ko || status.hostile || !st.chair.active) {
            unseatNPC(behavior);
            behavior._seatTried = false;
            return false;
        }
        sprite.body.setVelocity(0, 0);
        // Swivel: face the work, or the player while they talk
        const chatting = window.npcNeedsSystem?.world?.inChatWith?.(behavior.npcId);
        if (st.seat.kind === 'swivel') {
            let want = st.homeFacing;
            if (chatting && playerPos) {
                const p = bodyFeet(sprite);
                want = compassToward(playerPos.x - p.x, playerPos.y - p.y);
            }
            want = snapFacing(want, st.seat.valid);
            if (want !== st.facing) {
                st.facing = want;
                setChairFacing(st.chair, want, st.seat);
                behavior.direction = COMPASS_TO_PLAYER[want];
            }
        }
        fidgetChair(st, sprite, !!chatting);
        window.updateSpriteDepth?.(st.chair, st.chair.elevation || 0);
        poseSprite(sprite, st.chair, st.seat, st.facing, st.place);
        return true;
    }

    if (!stop || status.ko || status.hostile) { behavior._seatStopKey = null; return false; }
    if (behavior.isMoving || behavior._goToStayDest) return false;
    if (behavior._seatStopKey === stop.key) return false; // already tried at this stop
    behavior._seatStopKey = stop.key;
    if (!hasSitFrames(sprite.texture.key)) return false;

    const obj = needsObject(stop.targetId);
    const npcRec = window.npcManager?.getNPC?.(behavior.npcId);
    const pref = seatPreference(obj, npcRec, stop);
    if (pref === 'stand') return false;
    const feet = bodyFeet(sprite);
    const toward = facePointFor(obj, feet);
    // Chairs at another needs NPC's post are theirs, unless this is that spot too
    const posts = otherPosts(behavior.npcId).filter(p => Math.hypot(p.x - feet.x, p.y - feet.y) > NEAR_CHAIR);
    const free = c => !posts.some(p => Math.hypot(p.x - (c.obj.x + c.obj.width / 2), p.y - (c.obj.y + c.obj.height)) < NEAR_CHAIR);
    const near = chairsNear(behavior.roomId, feet.x, feet.y, NEAR_CHAIR)
        .find(c => free(c) && (c.seat.kind === 'swivel' || staticFacesToward(c.seat, feet, toward)));
    if (near) {
        if (near.seat.kind === 'swivel') slideChairFootTo(near.obj, feet.x, feet.y); // pull it out
        return seatNPC(behavior, near.obj, { toward, facePlayer: false, needsStop: stop.key });
    }
    if (pref !== 'fetch') return false;
    const fetchable = chairsNear(behavior.roomId, feet.x, feet.y, FETCH_RANGE)
        .filter(c => c.seat.kind === 'swivel' && c.obj.body && free(c))[0];
    if (!fetchable) return false; // work standing
    startFetch(behavior, fetchable.obj, feet, toward, stop.key);
    return true;
}

/** Push a swivel chair in toward where its sitter faced, clear of the spot they work from. */
function tuckIn(chair, seat, facing) {
    if (seat?.kind !== 'swivel' || !chair.body || chair.seatedBy) return;
    const a = forwardRad(facing);
    const f = bodyFeet(chair);
    slideChairFootTo(chair, f.x + Math.cos(a) * TUCK_PX, f.y + Math.sin(a) * TUCK_PX);
}

/** Walk to a swivel chair, roll it back to `spot`, sit on it. */
function startFetch(behavior, chair, spot, toward, stopKey) {
    const foot = bodyFeet(chair);
    behavior._fetch = { chair, spot: { x: spot.x, y: spot.y }, toward, stopKey, phase: 'to_chair',
                        until: Date.now() + FETCH_TIMEOUT_MS, issued: false };
    chair.seatedBy = behavior.npcId; // reserved
    const pm = window.pathfindingManager;
    const grab = pm?.findNearestWalkableWorldCell?.(foot.x, foot.y + 12, 2) || { x: foot.x, y: foot.y + 12 };
    moveNeeds(behavior, grab.x, grab.y);
    window.eventDispatcher?.emit?.('npc_fetching_chair', { npcId: behavior.npcId, objectId: chair.objectId });
}

function moveNeeds(behavior, x, y) {
    // owner 'needs' so the needs system isn't suspended; its arrival is ignored while using
    behavior.goToAndStay(x, y, window.npcNeedsSystem?.world?.speedFor?.(behavior.npcId), { owner: 'needs', fromSeating: true });
    behavior._fetch.issued = true;
}

function endFetch(behavior, seatIt) {
    const f = behavior._fetch;
    behavior._fetch = null;
    if (!f) return false;
    const chair = f.chair;
    if (chair.body) { chair.body.enable = true; placeBody(chair, chair.x, chair.y); chair.body.setVelocity(0, 0); }
    if (chair.seatedBy === behavior.npcId) delete chair.seatedBy;
    if (!seatIt) return false;
    return seatNPC(behavior, chair, { toward: f.toward, facePlayer: false, needsStop: f.stopKey });
}

/** A move from elsewhere (a script, the needs selector) drops a chair being fetched where it is. */
export function cancelFetch(behavior) {
    if (behavior?._fetch) endFetch(behavior, false);
}

function advanceFetch(behavior, ns, stop) {
    const f = behavior._fetch;
    const status = window.npcNeedsSystem?.world?.npcStatus?.(behavior.npcId) || {};
    // The work ended (or the NPC was called away) while fetching: leave the chair where it is
    if (!stop || stop.key !== f.stopKey || status.ko || status.hostile || Date.now() > f.until || !f.chair.active) {
        if (behavior._goToStayDest && stop && stop.key === f.stopKey) behavior.cancelMove?.();
        endFetch(behavior, false);
        return false;
    }
    const arrived = f.issued && !behavior._goToStayDest && !behavior.isMoving;
    const feet = bodyFeet(behavior.sprite);
    if (f.phase === 'to_chair') {
        if (!arrived) return false;
        f.phase = 'pushing';
        if (f.chair.body) { f.chair.body.setVelocity(0, 0); f.chair.body.enable = false; }
        moveNeeds(behavior, f.spot.x, f.spot.y);
        return false;
    }
    // pushing: the chair rolls just ahead of the NPC's feet
    const dirC = PLAYER_TO_COMPASS[behavior.direction] || 'south';
    const a = forwardRad(dirC);
    const seat = seatSpec(f.chair);
    const off = f.chair.body ? { x: f.chair.body.offset.x + f.chair.body.width / 2, y: f.chair.body.offset.y + f.chair.body.height / 2 }
                             : { x: f.chair.width / 2, y: f.chair.height };
    const ahead = arrived ? 0 : 14;
    f.chair.x = Math.round(feet.x + Math.cos(a) * ahead - off.x);
    f.chair.y = Math.round(feet.y + Math.sin(a) * ahead - off.y);
    if (seat?.kind === 'swivel' && !arrived) setChairFacing(f.chair, snapFacing(dirC, seat.valid), seat);
    window.updateSpriteDepth?.(f.chair, f.chair.elevation || 0);
    if (!arrived) return false;
    return endFetch(behavior, true);
}

export function installSeating(scene) {
    scene.events.on('postupdate', place);
    scene.events.once('shutdown', () => { state = null; });
}

const seating = {
    seatSpec, isSeat, isStaticSeatTexture, hasSitFrames, canPlayerSit, trySit, standUp, onJumpKey, queueSit,
    isSeated, currentSeat, currentPose, canRoll, afterPlayerMovement, onMoveIntent, place, installSeating,
    chairFacing, setChairFacing, snapFacing, seatNPC, unseatNPC, updateSeatedNPC, cancelFetch
};
window.seating = seating;
export default seating;
