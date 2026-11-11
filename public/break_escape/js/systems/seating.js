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

import { walkBoxClear, pathClear, chairRect, localStandGrid, nearestCell, floodStandCells, sweepBlock } from './seat-box.js';

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

// ---- breathing: a seated figure's head and shoulders sink 1px and rise again on a slow
// cycle. The seated frames are single PixelLab rotations (breathing-idle is redrawn
// frame to frame and drawn at another scale, so it can't be reused). While "down", the
// sitter is cropped to the rows below the cut and an image of the rows above it is drawn
// 1px lower, so nothing leaves a gap. Each sitter gets its own phase. Off under reduced
// motion and while a needs NPC types (the typing bob moves the whole figure instead).
const BREATH_MS = 3600;            // one breath
const BREATH_DOWN = [0.5, 0.9];    // the part of the cycle with head and shoulders down
const BREATH_CUT = 0.42;           // share of the figure's height, from the top, that moves
const breathRowsCache = new Map(); // `${texture}|${frame}` -> { top, cut } or null

/** Opaque top row of a frame and the cut row just under the shoulders. */
export function breathRows(textureKey, frameName) {
    const k = `${textureKey}|${frameName}`;
    if (breathRowsCache.has(k)) return breathRowsCache.get(k);
    let rows = null;
    try {
        const tm = window.game?.textures;
        const frame = tm?.getFrame(textureKey, frameName);
        if (frame && tm.getPixelAlpha) {
            let top = -1, bottom = -1;
            for (let y = 0; y < frame.height; y++) {
                for (let x = 0; x < frame.width; x++) {
                    if (tm.getPixelAlpha(x, y, textureKey, frameName) > 0) { if (top < 0) top = y; bottom = y; break; }
                }
            }
            if (top >= 0 && bottom - top > 8) rows = { top, cut: top + Math.round(BREATH_CUT * (bottom - top)) };
        }
    } catch (e) { /* no breathing for this frame */ }
    breathRowsCache.set(k, rows);
    return rows;
}

/** Pure: is a sitter with this phase breathing out (head and shoulders down) at `now` ms? */
export function breathDown(now, phase) {
    const t = ((((now + phase) % BREATH_MS) + BREATH_MS) % BREATH_MS) / BREATH_MS;
    return t >= BREATH_DOWN[0] && t < BREATH_DOWN[1];
}

/**
 * Draw `sprite` breathing (or still, when `on` is false). `holder` keeps the per-sitter
 * state ({ img, phase, crop }); endBreath(holder, sprite) when the sitter gets up.
 */
function updateBreath(holder, sprite, on) {
    if (!holder || !sprite?.active) return;
    const b = holder.breath || (holder.breath = { img: null, phase: Math.random() * BREATH_MS, crop: null });
    const now = sprite.scene?.time?.now ?? performance.now();
    // A glow (postFX) can't be copied onto the image, so those sitters keep still.
    const fx = sprite.postFX?.list?.length > 0;
    const rows = on && !fx && sprite.visible && !prefersReducedMotion()
        ? breathRows(sprite.texture.key, sprite.frame.name) : null;
    if (!rows || !breathDown(now, b.phase)) {
        if (b.img) b.img.setVisible(false);
        if (b.crop) { sprite.setCrop(); b.crop = null; }
        return;
    }
    const w = sprite.frame.width, h = sprite.frame.height;
    const crop = `${sprite.frame.name}|${rows.cut}`;
    if (b.crop !== crop) { sprite.setCrop(0, rows.cut, w, h - rows.cut); b.crop = crop; }
    if (!b.img) {
        b.img = sprite.scene.add.image(0, 0, sprite.texture.key, sprite.frame.name);
        sprite.once('destroy', () => { b.img?.destroy(); b.img = null; });
    }
    const img = b.img;
    if (img.frame.name !== sprite.frame.name || img.texture.key !== sprite.texture.key) img.setTexture(sprite.texture.key, sprite.frame.name);
    img.setCrop(0, 0, w, rows.cut)
        .setOrigin(sprite.originX, sprite.originY)
        .setScale(sprite.scaleX, sprite.scaleY)
        .setFlip(sprite.flipX, sprite.flipY)
        .setPosition(sprite.x, sprite.y + sprite.scaleY)
        .setAlpha(sprite.alpha)
        .setDepth(sprite.depth + SEAT_DEPTH_STEP / 10)
        .setVisible(true);
    if (sprite.isTinted) img.setTint(sprite.tintTopLeft, sprite.tintTopRight, sprite.tintBottomLeft, sprite.tintBottomRight);
    else if (img.isTinted) img.clearTint();
}

function endBreath(holder, sprite) {
    const b = holder?.breath;
    if (!b) return;
    b.img?.destroy();
    if (b.crop && sprite?.active) sprite.setCrop();
    holder.breath = null;
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
    // seat 19 rows down (was 23: the sitter's feet went through the floor; SEATED_SCALE_AUDIT.md)
    'chair-waiting-left-1': { facing: 'west', seat: [24, 19] },
    'chair-waiting-right-1': { facing: 'east', seat: [10, 19] },
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

// The player's sit and stand are driven by physics, never by a jump of the body (user,
// 2026-11-11: hopping off could land through a wall; the last stretch to and from the seat
// was a teleport):
//  - getting on, the collider shrinks to the seated block and the player walks onto the seat
//    at walking pace, walls and furniture still in play (the swivel chair's own body is off);
//  - seated, the collider stays on: a swivel chair's driver has the chair's block, a static
//    seat's a small block where physics stopped it against the seat;
//  - getting off, the walking collider comes back where the seated one was, the player steps
//    to the landing spot (pickStandSpot) at walking pace and a swivel chair rolls back the other
//    way; the player and that chair don't collide until they no longer overlap.

// { chair, seat, facing, pose, sprite, overlays[], approach, footOffset, savedBody,
//   chairBodyWasEnabled, phase ('mount' while walking onto the seat, then 'seated'), mount, place }
let state = null;
// The step off a chair, once state is cleared: { target, frames, still, last, arrived, proxy,
// lift, off, jumpFrames }. proxy is set for a jump (the pose sprite carries on, on an arc).
let stepOff = null;
// Player/chair pairs whose collider is off until their bodies stop overlapping: [{ a, b }]
let ghosts = [];

export function isSeated() { return !!state; }
/** True while the player is walking onto a seat (isSeated() is already true). */
export function isMounting() { return state?.phase === 'mount'; }
export function currentSeat() { return state?.chair || null; }
export function currentPose() { return state?.pose || null; }
export function canRoll() { return state?.phase === 'seated' && state.seat.kind === 'swivel'; }

/** Whether the player's avatar has seated frames (otherwise it stands on chairs). */
export function canPlayerSit() {
    const player = window.player;
    return !!player && hasSitFrames(player.texture?.key);
}

/** Interaction entry point: get on a chair. Returns true when it handled the sprite. */
export function trySit(chair) {
    const seat = seatSpec(chair);
    if (!seat || !window.player?.body) return false;
    if (stepOff?.proxy) return true; // mid-jump
    if (state?.chair === chair) { standUp(); return true; }
    if (state) standUp();
    endStep();
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

/**
 * Collision box the driver takes on a swivel chair, centred on the chair body's centre
 * (the castor base under the seat): the chair's own body (SEAT_BOX_PLAN.md Q0; for the
 * office chairs that is seat-box.js SEAT_BLOCKS.office40, 18 x 8).
 */
export function seatedBlock(chairBody) {
    return { w: chairBody.width, h: chairBody.height };
}

/** The driver's collider on a static seat: smaller than the 18 x 10 walking box. */
export const STATIC_SEATED_BLOCK = { w: 12, h: 6 };

const WALK_SPEED = 150;          // px/s, utils/constants.js MOVEMENT_SPEED (not imported: test harness copies)
const MOUNT_SPEED = WALK_SPEED * 0.6;
const STEP_SPEED = WALK_SPEED * 0.6;
const ARRIVE_PX = 2;             // this close to the seat or the landing spot counts as there (the rest is placed)
const STUCK_FRAMES = 6;          // frames without 0.25 px of progress: blocked
const MOUNT_MAX_FRAMES = 90;     // 1.5 s at 60 fps
const STEP_MAX_FRAMES = 60;
const SWIVEL_REACH_PX = 6;       // blocked this close to a swivel chair's castor: sit (the block was the chair's)
const STATIC_REACH_PX = 28;      // blocked this close to a static seat's foot: sit (stopped by the seat itself)
const CHAIR_PUSH = 70;           // px/s given to a swivel chair pushed back on standing; its drag (100) stops it in ~24 px
const JUMP_FRAMES = 19;          // ~320 ms at 60 fps
const JUMP_HEIGHT = 14;
const FRAME_S = 1 / 60;

function sitOn(chair, seat, pose) {
    const player = window.player;
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
    let footOffset, block;
    let chairBodyWasEnabled = false;
    if (seat.kind === 'swivel' && chair.body) {
        // The driver's body takes over the chair's footprint; the chair follows it once seated.
        footOffset = { x: chair.body.offset.x + chair.body.width / 2, y: chair.body.offset.y + chair.body.height / 2 };
        block = seatedBlock(chair.body);
        chair.body.setVelocity(0, 0);
        chairBodyWasEnabled = chair.body.enable;
        chair.body.enable = false;
    } else {
        // Static: the driver walks to the seat's foot; the seat's own body (a sofa's) stops it short.
        const pf = placeFoot(chair, seat, placeIdx);
        footOffset = { x: pf.x - chair.x, y: chair.height - 2 };
        block = STATIC_SEATED_BLOCK;
    }
    // Shrink round the same feet point, so nothing moves
    const cx = savedBody.ox + savedBody.w / 2, cy = savedBody.oy + savedBody.h / 2;
    player.body.setSize(block.w, block.h, false);
    player.body.setOffset(cx - block.w / 2, cy - block.h / 2);

    state = { chair, seat, facing, pose, sprite: null, overlays: [], approach, footOffset, savedBody,
              chairBodyWasEnabled, phase: 'mount', mount: { frames: 0, still: 0, last: Infinity },
              shownAnim: null, place: placeIdx };
    advanceMount();
    return true;
}

function mountTarget() {
    const { chair, footOffset } = state;
    return { x: chair.x + footOffset.x, y: chair.y + footOffset.y };
}

/** Walk the driver onto the seat; sit on arrival, or when blocked close enough. */
function advanceMount() {
    const player = window.player;
    const m = state.mount;
    const swivel = state.seat.kind === 'swivel';
    const t = mountTarget();
    const f = playerFeet(player);
    const dx = t.x - f.x, dy = t.y - f.y, d = Math.hypot(dx, dy);
    if (d <= ARRIVE_PX) {
        moveFeetTo(player, t.x, t.y);
        finishSit();
        return;
    }
    m.still = (m.last - d < 0.25) ? m.still + 1 : 0;
    m.last = d;
    m.frames++;
    if (m.still >= STUCK_FRAMES || m.frames > MOUNT_MAX_FRAMES) {
        if (d <= (swivel ? SWIVEL_REACH_PX : STATIC_REACH_PX)) {
            // A swivel driver goes the last few px onto the chair's own spot (the chair stood
            // there); a static one sits where the seat stopped it, the pose drawn on the seat.
            if (swivel) moveFeetTo(player, t.x, t.y);
            finishSit();
        } else {
            cancelMount();
            window.gameAlert?.("Can't reach that seat from here.", 'info', 'Seat', 2500);
        }
        return;
    }
    const v = Math.min(MOUNT_SPEED, d * physicsFps(player));
    player.body.setVelocity(dx / d * v, dy / d * v);
    playWalk(player, dx, dy);
    window.updatePlayerDepth?.(player.x, player.y);
}

/** On the seat: the pose sprite takes over from the (hidden) driver. */
function finishSit() {
    const player = window.player;
    const { chair, seat, facing, pose } = state;
    const scene = chair.scene;
    player.body.setVelocity(0, 0);
    window.cancelClickToMove?.(); // a click made while walking on doesn't drive the seat
    if (seat.kind === 'swivel') setChairFacing(chair, facing, seat);
    state.sprite = scene.add.sprite(0, 0, player.texture.key).setOrigin(0, 0);
    state.overlays = [0, 1].map(() => scene.add.image(0, 0, chair.texture.key).setOrigin(0, 0).setVisible(false));

    player.setVisible(false);
    player.anims.stop();
    player.isMoving = false;
    player.isSeated = true;
    player.direction = COMPASS_TO_PLAYER[facing];
    player.lastDirection = player.direction;
    state.phase = 'seated';
    state.mount = null;
    applyPose();
    place();
    window.eventDispatcher?.emit?.(pose === 'sit' ? 'player_sat' : 'player_stood_on_chair',
        { objectId: chair.objectId, facing });
}

/** Give up walking onto the seat: the walking body back, the chair as it was. */
function cancelMount() {
    const player = window.player;
    const { chair, seat, savedBody, chairBodyWasEnabled, place: placeIdx } = state;
    state = null;
    releasePlace(chair, seat, placeIdx);
    restoreBody(player, savedBody);
    if (seat.kind === 'swivel' && chair.body) {
        chair.body.enable = chairBodyWasEnabled;
        placeBody(chair, chair.x, chair.y);
        chair.body.setVelocity(0, 0);
    }
    player.isMoving = false;
    playIdle(player);
}

function restoreBody(player, savedBody) {
    player.body.setVelocity(0, 0);
    player.body.setSize(savedBody.w, savedBody.h, false);
    player.body.setOffset(savedBody.ox, savedBody.oy);
    player.body.checkCollision.none = savedBody.none;
}

/** The walk animation for a move by (dx, dy), as player.js picks it (flipped where there's no native left). */
function playWalk(player, dx, dy) {
    let dir = COMPASS_TO_PLAYER[compassToward(dx, dy)];
    const mgr = player.anims?.animationManager;
    let flip = false;
    if (dir.includes('left') && mgr && !mgr.exists(`walk-${dir}`)) { dir = dir.replace('left', 'right'); flip = true; }
    player.direction = dir;
    player.setFlipX?.(flip);
    const key = `walk-${dir}`;
    if (mgr?.exists(key) && player.anims.currentAnim?.key !== key) player.anims.play(key, true);
    player.isMoving = true;
    player.lastDirection = dir;
}

function playIdle(player) {
    const key = `idle-${player.direction || 'down'}`;
    if (player.anims?.animationManager?.exists(key)) player.anims.play(key, true);
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

/**
 * Get off the chair: the walking body comes back where the seated one was, then the player
 * steps to the landing spot (or `spot`) with physics, and a swivel chair rolls back.
 * opts.step false: no step (a move key or a click on a static seat walks the player off
 * itself; a knockout stays put). opts.jump: the pose sprite carries on along an arc.
 */
export function standUp(spot = null, opts = {}) {
    if (!state) return false;
    if (state.phase === 'mount') { cancelMount(); return true; }
    const { step = true, jump = null } = opts;
    const player = window.player;
    const { chair, seat, sprite, overlays, savedBody, approach, chairBodyWasEnabled, facing, place: placeIdx } = state;
    endBreath(state, sprite);
    state = null;
    if (!jump) sprite.destroy();
    overlays.forEach(o => o.destroy());
    releasePlace(chair, seat, placeIdx);
    restoreBody(player, savedBody);

    // The player is already off the chair (state cleared, body restored), so a throw while
    // choosing the spot must not leave them invisible and "seated": step back to the approach
    // point and finish (SEAT_BOX_PLAN.md 1.3, R3 M1).
    if (!spot) {
        try {
            spot = landingSpot(chair, seat, facing, approach);
        } catch (e) {
            console.error('🪑 standUp: landing spot failed, back to where the player sat down', e);
            spot = approach;
            noteStand({ via: 'error-approach', x: approach?.x, y: approach?.y, forced: true });
        }
    }
    const from = playerFeet(player);
    const dist = spot ? Math.hypot(spot.x - from.x, spot.y - from.y) : 0;

    if (seat.kind === 'swivel' && chair.body) {
        chair.body.enable = chairBodyWasEnabled;
        placeBody(chair, chair.x, chair.y);
        chair.body.setVelocity(0, 0);
        if (chair.body.enable) {
            ghostPair(player, chair, () => state?.chair === chair);
            // Push the chair back, away from where the player steps (behind the sitter without a spot)
            let ux, uy;
            if (dist >= 1) { ux = (spot.x - from.x) / dist; uy = (spot.y - from.y) / dist; }
            else { const a = forwardRad(facing); ux = Math.cos(a); uy = Math.sin(a); }
            chair.body.setVelocity(-ux * CHAIR_PUSH, -uy * CHAIR_PUSH);
        }
    }

    player.isSeated = false;
    player.isMoving = false;
    stepOff = null;
    if (jump) {
        stepOff = { target: spot, frames: 0, still: 0, last: Infinity, arrived: !spot || dist <= ARRIVE_PX,
                    proxy: sprite, lift: jump.lift, off: jump.off, jumpFrames: JUMP_FRAMES, baseDepth: sprite.depth,
                    speed: Math.max(STEP_SPEED, dist / (JUMP_FRAMES * FRAME_S)) };
        player.setVisible(false);
        placeStepProxy();
    } else {
        player.setVisible(true);
        playIdle(player);
        if (step && spot && dist > ARRIVE_PX) {
            stepOff = { target: spot, frames: 0, still: 0, last: Infinity, arrived: false, proxy: null, speed: STEP_SPEED };
        }
    }
    window.eventDispatcher?.emit?.('player_stood', { objectId: chair.objectId });
    return true;
}

/** One frame of the step off: walk to the target, stop there or when blocked. */
function advanceStep() {
    const s = stepOff;
    const player = window.player;
    if (!player?.body) { endStep(); return; }
    s.frames++;
    const ko = window.playerHealth?.isKO?.();
    const busy = window.playerCombat?.isBlocking || /punch|jab/.test(player.anims?.currentAnim?.key || '');
    if (!s.arrived && (ko || (busy && !s.proxy))) s.arrived = true;
    if (!s.arrived) {
        const f = playerFeet(player);
        const dx = s.target.x - f.x, dy = s.target.y - f.y, d = Math.hypot(dx, dy);
        s.still = (s.last - d < 0.25) ? s.still + 1 : 0;
        s.last = d;
        if (d <= ARRIVE_PX) {
            moveFeetTo(player, s.target.x, s.target.y);
            s.arrived = true;
        } else if (s.still >= STUCK_FRAMES || s.frames > STEP_MAX_FRAMES) {
            s.arrived = true; // blocked: stay where physics stopped the player
        } else {
            const v = Math.min(s.speed, d * physicsFps(player));
            player.body.setVelocity(dx / d * v, dy / d * v);
            if (!s.proxy) playWalk(player, dx, dy);
            window.updatePlayerDepth?.(player.x, player.y);
        }
    }
    if (s.arrived) {
        player.body.setVelocity(0, 0);
        if (!s.proxy || s.frames >= s.jumpFrames) endStep();
    }
}

/** End the step off (the player keeps the spot they reached). */
function endStep() {
    const s = stepOff;
    if (!s) return;
    stepOff = null;
    const player = window.player;
    if (s.proxy) { s.proxy.destroy(); player?.setVisible(true); }
    if (player?.body) {
        player.body.setVelocity(0, 0);
        if (player.isMoving) { player.isMoving = false; playIdle(player); }
    }
}

/** The jump's pose sprite: on the driver's feet, lifted from the seat height down to the floor, on an arc. */
function placeStepProxy() {
    const s = stepOff;
    const player = window.player;
    if (!s?.proxy || !player) return;
    const t = Math.min(1, s.frames / s.jumpFrames);
    const f = playerFeet(player);
    s.proxy.setPosition(f.x - s.off.x + s.lift.x * (1 - t),
                        f.y - s.off.y + s.lift.y * (1 - t) - Math.sin(t * Math.PI) * JUMP_HEIGHT);
    window.updatePlayerDepth?.(player.x, player.y);
    s.proxy.setDepth(Math.max(s.baseDepth, player.depth + SEAT_DEPTH_STEP));
}

/** Turn off the collider(s) between a and b until their bodies stop overlapping (updateGhosts). */
function ghostPair(a, b, hold = null) {
    const had = ghosts.find(g => g.a === a && g.b === b);
    if (had) { had.hold = hold; return; }
    if (setPairCollide(a, b, false)) ghosts.push({ a, b, hold });
}

function setPairCollide(a, b, on) {
    const q = a?.scene?.physics?.world?.colliders || b?.scene?.physics?.world?.colliders
        || window.game?.physics?.world?.colliders;
    const list = q?.getActive?.() || q?._active || [];
    let hit = false;
    for (const c of list) {
        if ((c.object1 === a && c.object2 === b) || (c.object1 === b && c.object2 === a)) { c.active = on; hit = true; }
    }
    return hit;
}

function bodyRect(sprite) {
    const f = bodyFeet(sprite);
    const b = sprite.body;
    return { x: f.x - b.width / 2, y: f.y - b.height / 2, w: b.width, h: b.height };
}

function updateGhosts() {
    if (!ghosts.length) return;
    ghosts = ghosts.filter(({ a, b, hold }) => {
        if (a?.active === false || !b?.body || !a?.body || b.active === false) { setPairCollide(a, b, true); return false; }
        if (hold?.()) return true; // back on it (or walking onto it): stays off
        const p = bodyRect(a), r = bodyRect(b);
        const apart = p.x + p.w <= r.x || r.x + r.w <= p.x || p.y + p.h <= r.y || r.y + r.h <= p.y;
        if (apart) setPairCollide(a, b, true);
        return !apart;
    });
}

/** Where the player lands getting off: beside a swivel chair, back where they came from for a static one. */
function landingSpot(chair, seat, facing, approach, forced = true) {
    if (seat.kind !== 'swivel') return approach;
    const spot = window.__seatBox === false ? legacyStandSpot(chair, facing)
        : playerStandSpot(chair, facing, { approach, forced });
    noteStand(spot ? { via: spot.via, x: spot.x, y: spot.y, forced }
        : { via: window.__seatBox === false ? 'legacy-none' : (forced ? 'none' : 'refused'), forced });
    return spot;
}

/** Max distance from the castor base for a voluntary stand to take the approach point (R2 m4). */
export const VOLUNTARY_APPROACH_PX = 32;

/**
 * The stand-up order (SEAT_BOX_PLAN.md 1.3). Pure, so each branch can be tested with fakes.
 * `facing` is the player's facing at stand time (state.facing, the way they last rolled; R3 M3).
 * `io` gives:
 *   cellNear(x, y, r)    nearest walkable cell of the local stand grid within r cells, or null
 *   boxClear(x, y)       an 18x10 walking box with its feet at (x, y) overlaps no solid body and
 *                        not the chair just left
 *   lineClear(x, y)      the line from the chair's castor base to (x, y) crosses no solid body
 *   flood(maxCells)      walkable cells reachable from the chair's cell through walkable cells,
 *                        within maxCells steps, nearest first (never across a desk)
 * Order: 1 the compass candidates (forward, sides, back diagonals, back, forward diagonals
 * last); 2 the flood fill, 4 cells; 3 the approach point (a voluntary stand only when it is
 * within 32 px and line clear); then a voluntary jump-off returns null (stay seated), and a
 * forced stand takes the flood fill to 8 cells (box only), then the approach point unchecked.
 * Never an unchecked cell picked by direction. The player walks to the spot it returns, so
 * physics stops them short of anything in the way.
 */
export function pickStandSpot({ cx, cy, facing, reach, approach = null, forced = true }, io) {
    const start = Math.max(0, COMPASS.indexOf(facing));
    // Forward, the sides, back, and the forward diagonals last: a chair tucked in faces its
    // desk, and a forward diagonal steps round the desk's corner to its far side.
    for (const step of [0, 2, -2, 3, -3, 4, 1, -1]) {
        const a = forwardRad(COMPASS[(start + step + 8) % 8]);
        const x = cx + Math.cos(a) * reach, y = cy + Math.sin(a) * reach;
        const cell = io.cellNear(x, y, 1);
        if (cell && Math.hypot(cell.x - x, cell.y - y) < 12 && io.boxClear(cell.x, cell.y) && io.lineClear(cell.x, cell.y)) {
            return { x: cell.x, y: cell.y, via: 'compass' };
        }
    }
    for (const c of io.flood(4)) {
        if (io.boxClear(c.x, c.y) && io.lineClear(c.x, c.y)) return { x: c.x, y: c.y, via: 'flood' };
    }
    if (approach && io.boxClear(approach.x, approach.y)
        && (forced || (Math.hypot(approach.x - cx, approach.y - cy) <= VOLUNTARY_APPROACH_PX && io.lineClear(approach.x, approach.y)))) {
        return { x: approach.x, y: approach.y, via: 'approach' };
    }
    if (!forced) return null;
    for (const c of io.flood(8)) {
        if (io.boxClear(c.x, c.y)) return { x: c.x, y: c.y, via: 'forced-flood' };
    }
    return approach ? { x: approach.x, y: approach.y, via: 'forced-approach' } : null;
}

/** Castor base and stand reach of a swivel chair. */
function castorOf(chair) {
    const b = chair.body;
    const foot = b ? bodyFeet(chair) : { x: chair.x + chair.width / 2, y: chair.y + chair.height };
    return { cx: foot.x, cy: foot.y, reach: (b ? Math.max(b.width, b.height) / 2 : 10) + 14 }; // clear of the chair body
}

/** Record the last player stand for the stand audit (window.seating.lastStand). */
function noteStand(rec) {
    if (window.seating && typeof window.seating === 'object') window.seating.lastStand = rec;
}

/**
 * A walkable spot next to a swivel chair, in front of it first: the stand-up code before the
 * seat box plan, kept only for the player under `window.__seatBox === false` (test-only, for the stand audit's side by side). It can
 * land on or across a desk; there is no box or line check.
 */
function legacyStandSpot(chair, facing) {
    const pfm = window.pathfindingManager;
    const { cx, cy, reach } = castorOf(chair);
    const start = COMPASS.indexOf(facing);
    for (const step of [0, 1, -1, 2, -2, 3, -3, 4]) {
        const a = forwardRad(COMPASS[(start + step + 8) % 8]);
        const x = cx + Math.cos(a) * reach, y = cy + Math.sin(a) * reach;
        const cell = pfm?.findNearestWalkableWorldCell?.(x, y, 1);
        if (cell && Math.hypot(cell.x - x, cell.y - y) < 12) return { x: cell.x, y: cell.y, via: 'legacy-compass' };
    }
    const fb = pfm?.findNearestWalkableWorldCell?.(cx, cy + reach, 3);
    return fb ? { x: fb.x, y: fb.y, via: 'legacy-fallback' } : null;
}

/**
 * The player's landing spot off a swivel chair: the order in SEAT_BOX_PLAN.md 1.3 over a local
 * stand grid built from the live bodies without the chair and the player, so cells only they
 * block (or a chair an NPC baked into the world grid) are free. `facing` is state.facing at
 * stand time. Returns { x, y, via } or null (voluntary, nothing clear: stay seated).
 */
function playerStandSpot(chair, facing, { approach = null, forced = true } = {}) {
    const player = window.player;
    const scene = chair.scene || window.pathfindingManager?.scene;
    const { cx, cy, reach } = castorOf(chair);
    const rect = chairRect(chair);
    const built = localStandGrid(window.pathfindingManager, { exclude: [chair, player] });
    const ignore = [chair, player];
    return pickStandSpot({ cx, cy, facing, reach, approach, forced }, {
        cellNear: (x, y, r) => nearestCell(built, x, y, r),
        boxClear: (x, y) => walkBoxClear(scene, x, y, { ignore, extra: rect ? [rect] : [] }),
        lineClear: (x, y) => pathClear(scene, { x: cx, y: cy }, { x, y }, { ignore }),
        flood: n => floodStandCells(built, cx, cy, n)
    });
}


/**
 * Space on a chair: sitting -> stand up on the seat; standing on it -> jump off.
 * Returns true when it handled the key.
 */
export function onJumpKey() {
    if (stepOff?.proxy) return true; // mid-jump
    if (!state) return false;
    if (state.phase === 'mount') return true;
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

/** Hop from the seat to the floor beside the chair: the body steps there, the pose sprite arcs down. */
function jumpOff() {
    const player = window.player;
    const { chair, seat, facing, approach, sprite } = state;
    // A voluntary stand: with nowhere clear the player stays seated, with a line, and can roll
    // somewhere else (SEAT_BOX_PLAN.md 1.3 step 4). `__seatBox === false` (test-only) keeps the
    // old code, which never refuses.
    const legacy = window.__seatBox === false;
    let spot;
    try {
        spot = landingSpot(chair, seat, facing, approach, legacy);
    } catch (e) {
        console.error('🪑 jumpOff: landing spot failed; standing up instead', e);
        standUp();
        return;
    }
    if (!spot && !legacy) { window.gameAlert?.('No room to stand up here.', 'info', 'Seat', 2500); return; }
    if (!spot) { standUp(); return; }
    updateBreath(state, sprite, false);
    window.cancelClickToMove?.();
    // The pose sprite's feet start on the seat, above the driver's feet: that lift shrinks to 0.
    const off = proxyFeetOffset();
    const f = playerFeet(player);
    const lift = { x: sprite.x + off.x - f.x, y: sprite.y + off.y - f.y };
    sprite.setDepth(Math.max(sprite.depth, chair.depth) + 1);
    standUp(spot, { jump: { lift, off } });
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
    updateGlides();
    updateGhosts();
    if (!state) {
        updateRollSound(false);
        if (stepOff) advanceStep(); else checkPending();
        return;
    }
    const player = window.player;
    if (window.playerHealth?.isKO?.()) { standUp(null, { step: false }); return; }
    if (state.phase === 'mount') { updateRollSound(false); advanceMount(); return; }
    if (state.seat.kind === 'swivel') {
        player.body.velocity.x *= ROLL_SPEED;
        player.body.velocity.y *= ROLL_SPEED;
    }
    updateRollSound(state.seat.kind === 'swivel' && (player.body.velocity.x !== 0 || player.body.velocity.y !== 0));
    if (player.anims.isPlaying) player.anims.stop(); // no walk/idle animation on the hidden driver
}

/**
 * A move (key or click): a static seat gets the player up, who then walks off it themselves;
 * the step off a chair ends (a jump plays out). Walking onto a seat isn't interrupted. Any move
 * drops a queued sit.
 */
export function onMoveIntent() {
    pending = null;
    if (stepOff && !stepOff.proxy) endStep();
    if (state && state.phase === 'seated' && state.seat.kind === 'static') standUp(null, { step: false });
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
    if (stepOff?.proxy) placeStepProxy();
    if (!state || state.phase !== 'seated') return;
    const player = window.player;
    const { chair, seat, sprite, overlays, footOffset } = state;
    if (!chair.active || !player?.body) { standUp(null, { step: false }); return; }

    if (seat.kind === 'swivel') {
        const want = snapFacing(PLAYER_TO_COMPASS[player.direction] || state.facing, seat.valid);
        if (want !== state.facing) {
            state.facing = want;
            setChairFacing(chair, want, seat);
        }
        // Not rounded: the chair and the pose keep the driver's sub-pixel position, as the
        // walking player sprite does, so they don't shimmer a pixel against the camera.
        const f = playerFeet(player);
        chair.x = f.x - footOffset.x;
        chair.y = f.y - footOffset.y;
        window.updateSpriteDepth?.(chair, chair.elevation || 0);
    } else if (player.direction !== COMPASS_TO_PLAYER[state.facing]) {
        // Static seats keep their facing (a conversation may have turned the driver).
        player.direction = COMPASS_TO_PLAYER[state.facing];
    }
    applyPose();

    const facing = state.facing;
    const sp = seatPoint(chair, seat, facing, state.place);
    const anchor = state.pose === 'sit' ? sitHip(sprite.texture.key, facing) : [proxyFeetOffset().x, proxyFeetOffset().y];
    sprite.setPosition(sp.x - anchor[0], sp.y - anchor[1]);
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
            .setDepth(chair.depth + 2 * SEAT_DEPTH_STEP).setVisible(chair.visible)
            .setAlpha(chair.alpha); // match the chair when the behind-wall fade has dimmed it
    });
    updateBreath(state, sprite, state.pose === 'sit');
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

/**
 * Place a seated sprite (origin-aware) so its hips land on the chair's seat. `dy` (0 or 1 px)
 * is the typing bob: applied here because this runs every frame and would undo it otherwise.
 */
export function poseSprite(sprite, chair, seat, facing, place = 0, dy = 0) {
    const sp = seatPoint(chair, seat, facing, place);
    const hip = sitHip(sprite.texture.key, facing);
    const x = Math.round(sp.x - hip[0] + sprite.displayOriginX);
    const y = Math.round(sp.y - hip[1] + sprite.displayOriginY) + dy;
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

// ---- idle motion (OFFICE_LIFE_PLAN 12.7, slice 21). The roll: a seated NPC on a swivel chair
// rolls a few pixels, mostly along x on screen and never towards the desk, holds 1 to 2 s and
// rolls back to where it sat down. Cosmetic: Math.random, no event, outside the decision log.
// The swivel: now and then a seated needs NPC turns its chair one compass step and back, on a
// seeded roll per 6 s slot of the needs clock; it turns towards a colleague speaking nearby.
const FIDGET_MIN_MS = 4000, FIDGET_MAX_MS = 11000, FIDGET_ROLL_MS = 700;
const FIDGET_HOLD_MIN_MS = 1000, FIDGET_HOLD_MAX_MS = 2000;
const FIDGET_X = 3, FIDGET_X_AWAY = 2;

/**
 * A roll offset for a chair facing `facing`, in screen pixels: `x` within 3 px and `y` within
 * 1 px, never towards the desk. Where the facing has an east or west part, `x` goes only away
 * from the desk, up to 2 px; where it has a north or south part, so does `y`. Never zero.
 */
export function fidgetOffset(facing, rand = Math.random) {
    const a = forwardRad(facing); // forward, as tuckIn
    const fx = Math.cos(a), fy = Math.sin(a);
    const awayX = Math.abs(fx) > 0.1 ? -Math.sign(fx) : 0;
    const awayY = Math.abs(fy) > 0.1 ? -Math.sign(fy) : 0;
    const span = awayX ? FIDGET_X_AWAY : FIDGET_X;
    const mag = 1 + Math.min(Math.floor(rand() * span), span - 1);
    const x = (awayX || (rand() < 0.5 ? -1 : 1)) * mag;
    const r = rand();
    const y = awayY ? (r < 0.5 ? 0 : awayY) : (r < 1 / 3 ? -1 : r < 2 / 3 ? 0 : 1);
    return { x, y: y || 0 };
}

/** A fresh roll state: waiting at the spot the NPC sat down. */
export function newFidget(now, rand = Math.random) {
    return { phase: 'wait', from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, cur: { x: 0, y: 0 }, start: now,
             until: now + FIDGET_MIN_MS + rand() * (FIDGET_MAX_MS - FIDGET_MIN_MS) };
}

/**
 * Advance a roll to `now` and return its offset: wait, roll out (700 ms), hold 1 to 2 s, roll back,
 * wait 4 to 11 s. `held` starts no roll and brings a roll that is out straight back.
 */
export function fidgetStep(fd, now, { held = false, facing = 'south', rand = Math.random } = {}) {
    const ease = () => {
        const t = Math.min(1, (now - fd.start) / FIDGET_ROLL_MS);
        const e = 0.5 - Math.cos(t * Math.PI) / 2;
        fd.cur = { x: fd.from.x + (fd.to.x - fd.from.x) * e, y: fd.from.y + (fd.to.y - fd.from.y) * e };
        return t >= 1;
    };
    const back = () => { fd.phase = 'back'; fd.from = { ...fd.cur }; fd.to = { x: 0, y: 0 }; fd.start = now; };
    if (fd.phase === 'wait') {
        if (!held && now >= fd.until) {
            fd.phase = 'out'; fd.from = { ...fd.cur }; fd.to = fidgetOffset(facing, rand); fd.start = now;
        }
    } else if (fd.phase === 'hold' && (held || now >= fd.until)) {
        back();
    } else if (fd.phase === 'out' && held) {
        back();
    }
    if (fd.phase === 'out' && ease()) {
        fd.phase = 'hold';
        fd.until = now + FIDGET_HOLD_MIN_MS + rand() * (FIDGET_HOLD_MAX_MS - FIDGET_HOLD_MIN_MS);
    } else if (fd.phase === 'back' && ease()) {
        fd.phase = 'wait'; fd.cur = { x: 0, y: 0 };
        fd.until = now + FIDGET_MIN_MS + rand() * (FIDGET_MAX_MS - FIDGET_MIN_MS);
    }
    return fd.cur;
}

/** Move a seated NPC's swivel chair along its current roll; `held` starts none and rolls back. */
function fidgetChair(st, sprite, held) {
    const chair = st.chair;
    if (st.seat.kind !== 'swivel' || !chair.body) return;
    const now = sprite.scene?.time?.now ?? performance.now();
    if (!st.fidget) st.fidget = { ...newFidget(now), home: { x: chair.x, y: chair.y } };
    const fd = st.fidget;
    const cur = fidgetStep(fd, now, { held, facing: st.homeFacing });
    let ox = cur.x, oy = cur.y;
    // Clamp a roll so the seated block can't push into a desk, at the front or the sides
    // (slideChairFootTo sets the position directly; SEAT_BOX_PLAN.md section 6 item 6)
    const mag = Math.hypot(ox, oy);
    if (mag > 0 && chair.scene) {
        const rect = chairRect(chair);
        rect.x += fd.home.x - chair.x; rect.y += fd.home.y - chair.y; // the block at the home spot
        // Ignore the chair and the NPC riding it: the seated sprite's own body overlaps the
        // seated block, so without this the sweep reads distance 0 and the roll never moves.
        const d = sweepBlock(chair.scene, rect, ox / mag, oy / mag, { ignore: [chair, sprite] });
        if (d < mag) { ox = (ox / mag) * d; oy = (oy / mag) * d; }
    }
    const x = Math.round(fd.home.x + ox), y = Math.round(fd.home.y + oy);
    if (chair.x !== x || chair.y !== y) {
        chair.x = x; chair.y = y;
        placeBody(chair, x, y);
    }
}

export const SWIVEL_SLOT_MS = 6000;
export const SWIVEL_CHANCE = 0.05;
export const LISTEN_RADIUS = 128; // px, four tiles

/** True while a needs NPC is typing: a `work` use in its `using` phase (the typing bob's rule). */
export function isTyping(ns) {
    const job = ns?.job;
    // Slice 19: on a desk-phone call the hands are off the keyboard
    return !!(ns && !ns.call && ns.mode === 'job' && job && job.kind === 'use' && job.need === 'work' && job.phase === 'using');
}

/** Pure: the roll and the swivel are held on a call, paired at a chatter object, saying a line, typing or chatting with the player. */
export function idleMotionHeld({ call = false, paired = false, talking = false, typing = false, chatting = false } = {}) {
    return !!(call || paired || talking || typing || chatting);
}

/**
 * Pure: the facing of an idle swivel at `clockMs` (needs clock). Each 6 s slot, the seeded
 * `roll('swivel:' + slot)` below `chance` turns the chair one compass step (left or right, and a
 * hold of 2 to 4 s, both from the same roll), snapped to `valid`, then back to `homeFacing`.
 * Never while typing. The same seed gives the same facing at the same clock.
 */
export function swivelFacing({ state, clockMs, homeFacing, valid = COMPASS, roll, chance = SWIVEL_CHANCE }) {
    if (isTyping(state) || typeof roll !== 'function' || !COMPASS.includes(homeFacing)) return homeFacing;
    const clock = Number(clockMs) || 0;
    const slot = Math.floor(clock / SWIVEL_SLOT_MS);
    const r = roll(`swivel:${slot}`);
    if (!(r < chance)) return homeFacing;
    const u = r / chance; // uniform in [0, 1)
    const hold = 2000 + Math.floor(((u * 2) % 1) * 2000);
    if (clock - slot * SWIVEL_SLOT_MS >= hold) return homeFacing;
    const i = COMPASS.indexOf(homeFacing);
    return snapFacing(COMPASS[(i + (u < 0.5 ? 1 : 7)) % 8], valid);
}

/** Pure: the nearest colleague speaking in the same room within `radius`, or null. */
export function listenTarget({ npcId, roomId, x, y, speakers, clockMs, radius = LISTEN_RADIUS }) {
    let best = null, bestD = Infinity;
    for (const sp of speakers || []) {
        if (!sp || sp.npcId === npcId || sp.roomId !== roomId || !(sp.until > clockMs)) continue;
        const d = Math.hypot(sp.x - x, sp.y - y);
        if (d <= radius && d < bestD) { best = sp; bestD = d; }
    }
    return best;
}

/** Swivel on for this NPC: not `swivel: false`, not `"officeVisuals": false`, no `los.enabled` (LOS reads the facing). */
export function swivelEnabled(rec, scenario) {
    if (scenario?.officeVisuals === false) return false;
    if (rec?.swivel === false) return false;
    if (rec?.los?.enabled) return false;
    return true;
}

// ---- NPC seat moves (user, 2026-11-11: NPCs too). An NPC walks onto a seat and steps off it
// with physics and its collider on; a swivel chair rolls (velocity, colliding on the way) where
// it used to be set down in place. behavior._seatMove = { stage, ... } runs one stage per NPC
// tick (npc-behavior.js, every 50 ms) and holds the rest of the behaviour while it runs:
//   walk     to the work spot (a needs NPC that stopped short of it)
//   pull     the swivel chair rolls out to the work spot
//   contact  then in to the desk's contact line
//   mount    the NPC walks onto the seat (castor base, or a static seat's foot), then sits
//   step     after standing: to the stand spot (the work spot, or a box- and line-checked one)

const NPC_TICK_S = 0.05;           // npc-behavior.js updateInterval
const NPC_SEAT_SPEED = 70;         // px/s onto and off a seat
const NPC_STUCK_TICKS = 4;         // ticks without 0.5 px of progress: blocked
const NPC_MOVE_MAX_TICKS = 40;     // 2 s
const NPC_WALK_GIVE_UP_PX = 8;     // blocked this far from the work spot: work standing
const CHAIR_GLIDE_SPEED = 80;      // px/s a pulled or tucked chair rolls at
const GLIDE_MAX_FRAMES = 150;

const glides = new Map(); // chair -> { x, y, still, last, frames }

function physicsFps(obj) { return obj?.scene?.physics?.world?.fps || window.game?.physics?.world?.fps || 60; }

/** Roll a swivel chair's foot to (x, y) with physics (it collides on the way); it stops where blocked. */
export function glideChairFootTo(chair, x, y) {
    if (!chair?.body) return;
    chair.body.enable = true;
    glides.set(chair, { x, y, still: 0, last: Infinity, frames: 0 });
}
export function isGliding(chair) { return glides.has(chair); }

/** One frame of every chair glide (afterPlayerMovement runs it). */
export function updateGlides() {
    for (const [chair, g] of glides) {
        if (!chair.active || !chair.body?.enable) { glides.delete(chair); continue; }
        const f = bodyFeet(chair);
        const dx = g.x - f.x, dy = g.y - f.y, d = Math.hypot(dx, dy);
        g.still = (g.last - d < 0.2) ? g.still + 1 : 0;
        g.last = d;
        g.frames++;
        if (d <= 1) { chair.body.setVelocity(0, 0); moveFeetTo(chair, g.x, g.y); glides.delete(chair); }
        else if (g.still >= 8 || g.frames > GLIDE_MAX_FRAMES) { chair.body.setVelocity(0, 0); glides.delete(chair); }
        else { const v = Math.min(CHAIR_GLIDE_SPEED, d * physicsFps(chair)); chair.body.setVelocity(dx / d * v, dy / d * v); }
        window.updateSpriteDepth?.(chair, chair.elevation || 0);
    }
}

function stopGlide(chair) {
    if (!glides.has(chair)) return;
    glides.delete(chair);
    chair.body?.setVelocity(0, 0);
}

/** Re-sync a body after its offset changed (as placeBody does after a move). */
function syncBody(sprite) {
    const b = sprite.body;
    if (!b?.updateFromGameObject) return;
    b.updateFromGameObject();
    b.prev?.copy?.(b.position);
    b.prevFrame?.copy?.(b.position);
    b.updateCenter?.();
}

/** Shrink (or grow) a body to w x h round its current feet point. */
function resizeAtFeet(sprite, w, h) {
    const b = sprite.body;
    if (!b?.setSize || !b.setOffset) return;
    const cx = b.offset.x + b.width / (2 * (sprite.scaleX || 1)), cy = b.offset.y + b.height / (2 * (sprite.scaleY || 1));
    b.setSize(w, h, false);
    b.setOffset(cx - w / (2 * (sprite.scaleX || 1)), cy - h / (2 * (sprite.scaleY || 1)));
    syncBody(sprite);
}

/** Where a seated NPC's block sits: the chair's castor base (swivel) or the seat's foot. */
function seatedCentre(st) {
    const { chair, seat, place } = st;
    if (seat.kind === 'swivel' && chair.body?.offset) return bodyFeet(chair);
    const pf = placeFoot(chair, seat, place);
    return { x: pf.x, y: pf.y - 2 };
}

/** Keep a seated NPC's collider on its seat while the posed sprite moves (the body offset follows). */
function fitSeatedBody(sprite, st) {
    const b = sprite?.body;
    if (!b?.setOffset || !b.offset) return;
    const c = seatedCentre(st);
    const sx = sprite.scaleX || 1, sy = sprite.scaleY || 1;
    const ox = (c.x - sprite.x - b.width / 2) / sx + sprite.displayOriginX;
    const oy = (c.y - sprite.y - b.height / 2) / sy + sprite.displayOriginY;
    if (Math.abs(ox - b.offset.x) < 0.01 && Math.abs(oy - b.offset.y) < 0.01) return;
    b.setOffset(ox, oy);
    syncBody(sprite);
}

/** One tick of an NPC walk to `target`: 'moving', 'arrived' (placed exactly) or 'stuck'. */
function npcWalkTick(behavior, m, target) {
    const sprite = behavior.sprite;
    const f = bodyFeet(sprite);
    const dx = target.x - f.x, dy = target.y - f.y, d = Math.hypot(dx, dy);
    if (d <= ARRIVE_PX) { sprite.body.setVelocity(0, 0); moveFeetTo(sprite, target.x, target.y); return 'arrived'; }
    m.still = (m.last - d < 0.5) ? m.still + 1 : 0;
    m.last = d;
    m.ticks++;
    if (m.still >= NPC_STUCK_TICKS || m.ticks > NPC_MOVE_MAX_TICKS) { sprite.body.setVelocity(0, 0); return 'stuck'; }
    const v = Math.min(NPC_SEAT_SPEED, d / NPC_TICK_S);
    sprite.body.setVelocity(dx / d * v, dy / d * v);
    const dir = COMPASS_TO_PLAYER[compassToward(dx, dy)];
    if (behavior.direction !== dir || !behavior.isMoving) {
        behavior.direction = dir;
        behavior.isMoving = true;
        behavior.playAnimation?.('walk', dir);
    }
    behavior.updateDepth?.();
    return 'moving';
}

function resetWalk(m) { m.ticks = 0; m.still = 0; m.last = Infinity; }

function npcHold(behavior, chair) {
    return () => behavior._seat?.chair === chair || behavior._seatMove?.chair === chair;
}

/**
 * Get a needs NPC onto `chair`. opts: { toward, needsStop, ref } — ref is the work spot it sits
 * at (and stands back up on). Swivel: walk to ref, roll the chair out to it and in to the
 * desk, walk onto it. Static: walk onto the seat's foot (the seat's own body stops it short).
 */
function startSeatMove(behavior, chair, seat, opts) {
    const sprite = behavior.sprite;
    const m = { chair, seat, opts, stopKey: opts.needsStop, savedImm: sprite.body.immovable, savedBody: null,
                stage: null, ticks: 0, still: 0, last: Infinity };
    sprite.body.immovable = false; // an immovable body walks through walls
    sprite.body.setVelocity(0, 0);
    behavior._seatMove = m;
    if (seat.kind === 'swivel') {
        chair.seatedBy = behavior.npcId; // reserved
        ghostPair(sprite, chair, npcHold(behavior, chair));
        const f = bodyFeet(sprite);
        if (Math.hypot(opts.ref.x - f.x, opts.ref.y - f.y) > ARRIVE_PX) m.stage = 'walk';
        else startPull(m);
    } else {
        startMount(behavior, m);
    }
    behavior.isMoving = m.stage === 'walk';
    if (!behavior.isMoving) behavior.playAnimation?.('idle', behavior.direction);
    return true;
}

function startPull(m) {
    m.stage = 'pull';
    glideChairFootTo(m.chair, m.opts.ref.x, m.opts.ref.y);
}

function startContact(m) {
    m.stage = 'contact';
    const toward = m.opts.toward, ref = m.opts.ref;
    const face = toward ? snapFacing(compassToward(toward.x - ref.x, toward.y - ref.y), m.seat.valid) : null;
    const t = face ? contactTarget(m.chair, face) : null;
    if (t) glideChairFootTo(m.chair, t.x, t.y);
}

function startMount(behavior, m) {
    const sprite = behavior.sprite;
    const { chair, seat } = m;
    m.stage = 'mount';
    resetWalk(m);
    const b = sprite.body;
    m.savedBody = { w: b.width, h: b.height, ox: b.offset.x, oy: b.offset.y };
    const block = seat.kind === 'swivel' && chair.body?.width ? seatedBlock(chair.body) : STATIC_SEATED_BLOCK;
    resizeAtFeet(sprite, block.w, block.h);
    if (seat.kind !== 'swivel' || !chair.body) {
        const place = freePlaces(chair, seat, bodyFeet(sprite))[0] ?? 0;
        const pf = placeFoot(chair, seat, place);
        m.target = { x: pf.x, y: pf.y - 2 };
    }
}

/** End a seat move. Restores the NPC's body and the chair; the NPC stands where it got to. */
function endSeatMove(behavior) {
    const m = behavior._seatMove;
    if (!m) return;
    behavior._seatMove = null;
    const sprite = behavior.sprite;
    if (m.chair) {
        stopGlide(m.chair);
        if (m.chair.seatedBy === behavior.npcId) delete m.chair.seatedBy;
    }
    if (sprite?.body) {
        sprite.body.setVelocity(0, 0);
        if (m.savedBody) {
            const f = bodyFeet(sprite);
            sprite.body.setSize(m.savedBody.w, m.savedBody.h, false);
            sprite.body.setOffset(m.savedBody.ox, m.savedBody.oy);
            moveFeetTo(sprite, f.x, f.y);
        }
        sprite.body.immovable = m.savedImm;
    }
    if (behavior.isMoving) { behavior.isMoving = false; behavior.playAnimation?.('idle', behavior.direction); }
}

/** One tick of the NPC's seat move. Returns true while it holds the behaviour. */
function advanceSeatMove(behavior) {
    const m = behavior._seatMove;
    const sprite = behavior.sprite;
    if (!sprite?.body || (m.chair && !m.chair.active)) { endSeatMove(behavior); return false; }
    switch (m.stage) {
        case 'walk': {
            const r = npcWalkTick(behavior, m, m.opts.ref);
            if (r === 'moving') return true;
            const f = bodyFeet(sprite);
            if (r === 'stuck' && Math.hypot(m.opts.ref.x - f.x, m.opts.ref.y - f.y) > NPC_WALK_GIVE_UP_PX) { endSeatMove(behavior); return false; }
            m.opts.ref = { x: f.x, y: f.y }; // work from where it got to
            behavior.isMoving = false;
            behavior.playAnimation?.('idle', behavior.direction);
            startPull(m);
            return true;
        }
        case 'pull':
            if (isGliding(m.chair)) return true;
            startContact(m);
            return true;
        case 'contact':
            if (isGliding(m.chair)) return true;
            startMount(behavior, m);
            return true;
        case 'mount': {
            const target = m.target || bodyFeet(m.chair);
            const r = npcWalkTick(behavior, m, target);
            if (r === 'moving') return true;
            if (r === 'stuck') {
                const f = bodyFeet(sprite);
                const reach = m.seat.kind === 'swivel' ? SWIVEL_REACH_PX : STATIC_REACH_PX;
                if (Math.hypot(target.x - f.x, target.y - f.y) > reach) { endSeatMove(behavior); return false; }
                if (m.seat.kind === 'swivel') moveFeetTo(sprite, target.x, target.y);
            }
            const { chair, opts } = m;
            endSeatMove(behavior); // walking body back, reservation off: seatNPC takes the place
            return seatNPC(behavior, chair, { toward: opts.toward, facePlayer: false, needsStop: opts.needsStop, standAt: opts.ref });
        }
        case 'step': {
            const r = npcWalkTick(behavior, m, m.target);
            if (r === 'moving') return true;
            endSeatMove(behavior);
            return false;
        }
    }
    endSeatMove(behavior);
    return false;
}

/** Sit an NPC (its behaviour object) on a chair, where it stands. Returns true when seated. */
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
    const b = sprite.body;
    const saved = { none: b.checkCollision.none, immovable: b.immovable,
                    chairImmovable: chair.body ? chair.body.immovable : null,
                    w: b.width, h: b.height, ox: b.offset.x, oy: b.offset.y };
    const standFeet = bodyFeet(sprite);
    b.setVelocity(0, 0);
    // The collider stays on, shrunk to the seated block on the seat (fitSeatedBody keeps it there)
    b.immovable = true;
    const block = seat.kind === 'swivel' && chair.body?.width ? seatedBlock(chair.body) : STATIC_SEATED_BLOCK;
    b.setSize?.(block.w, block.h, false);
    if (chair.body) { chair.body.setVelocity(0, 0); chair.body.immovable = true; stopGlide(chair); }
    const placeIdx = takePlace(chair, seat, behavior.npcId, standFeet);
    behavior._seat = { chair, seat, facing, saved, place: placeIdx, homeFacing: facing, facePlayer: opts.facePlayer !== false,
                       needsStop: opts.needsStop || null,
                       // needs seats: stand back up where the NPC works from
                       standAt: opts.standAt || (opts.needsStop ? standFeet : null) };
    if (chair.body) ghostPair(sprite, chair, npcHold(behavior, chair));
    behavior.isMoving = false;
    behavior.direction = COMPASS_TO_PLAYER[facing];
    poseSprite(sprite, chair, seat, facing, placeIdx);
    fitSeatedBody(sprite, behavior._seat);
    window.eventDispatcher?.emit?.('npc_sat', { npcId: behavior.npcId, objectId: chair.objectId, facing });
    return true;
}

/**
 * Stand a seated NPC up: the standing body comes back where the seated block was, then it steps
 * to its stand spot (the work spot for a needs seat, else a box- and line-checked spot by the
 * chair) while a swivel chair rolls back (or tucks in to the desk, for a needs seat). A hostile
 * or knocked-out NPC doesn't step. A seat move under way (walking on) is dropped.
 */
export function unseatNPC(behavior) {
    const st = behavior?._seat;
    if (!st) {
        if (behavior?._seatMove && behavior._seatMove.stage !== 'step') endSeatMove(behavior);
        return false;
    }
    const sprite = behavior.sprite;
    const { chair, seat, facing, saved, standAt, needsStop, place: placeIdx } = st;
    const at = seatedCentre(st);
    endBreath(st, sprite);
    if (typeof window !== 'undefined') window.officeTypists?.delete(behavior.npcId);
    behavior._seat = null;
    behavior._seatTried = true; // don't sit straight back down
    releasePlace(chair, seat, placeIdx);
    if (chair.body && saved.chairImmovable !== null) chair.body.immovable = saved.chairImmovable;
    const halt = behavior.hostile || window.npcHostileSystem?.isNPCKO?.(behavior.npcId);
    let spot = null;
    if (sprite?.body) {
        const b = sprite.body;
        b.checkCollision.none = saved.none;
        b.immovable = saved.immovable;
        if (saved.w !== undefined && b.setSize) { b.setSize(saved.w, saved.h, false); b.setOffset(saved.ox, saved.oy); }
        moveFeetTo(sprite, at.x, at.y); // the standing frame where the seated block was: the body doesn't move
        b.setVelocity(0, 0);
        if (chair.body?.enable) ghostPair(sprite, chair, npcHold(behavior, chair));
        if (!halt) {
            try {
                spot = standAt || npcStandSpot(behavior, chair, seat, st.homeFacing, at);
            } catch (e) {
                console.warn(`🪑 ${behavior.npcId}: stand spot failed; stands where it sat`, e);
            }
        }
        if (spot && Math.hypot(spot.x - at.x, spot.y - at.y) > ARRIVE_PX) {
            behavior._seatMove = { stage: 'step', target: { x: spot.x, y: spot.y }, chair: null,
                                   savedImm: b.immovable, savedBody: null, ticks: 0, still: 0, last: Infinity };
            b.immovable = false;
        }
        if (seat.kind === 'swivel' && chair.body?.enable && !needsStop) {
            // Push the chair back, away from where the NPC steps
            const d = spot ? Math.hypot(spot.x - at.x, spot.y - at.y) : 0;
            let ux, uy;
            if (d >= 1) { ux = (spot.x - at.x) / d; uy = (spot.y - at.y) / d; }
            else { const a = forwardRad(st.homeFacing); ux = Math.cos(a); uy = Math.sin(a); }
            chair.body.setVelocity(-ux * CHAIR_PUSH, -uy * CHAIR_PUSH);
        }
    }
    if (needsStop) tuckIn(chair, seat, st.homeFacing, { glide: true }); // tuck along the home facing, clear of the work spot
    behavior.direction = COMPASS_TO_PLAYER[facing];
    behavior.playAnimation?.('idle', behavior.direction);
    window.eventDispatcher?.emit?.('npc_stood', { npcId: behavior.npcId, objectId: chair.objectId });
    return true;
}

/**
 * An NPC's stand spot off a seat with no work spot: the stand-up order (pickStandSpot, forced)
 * over a local grid without the chair and the NPC, from the castor base (swivel) or the seat's
 * foot (static: the seat's own body still counts, so nothing lands across it). null: no grid.
 */
function npcStandSpot(behavior, chair, seat, facing, at) {
    const sprite = behavior.sprite;
    const pfm = window.pathfindingManager;
    const scene = chair.scene || pfm?.scene;
    if (!pfm?.buildWorldGrid || !scene) return null;
    const swivel = seat.kind === 'swivel' && !!chair.body;
    const c = swivel ? castorOf(chair) : { cx: at.x, cy: at.y, reach: 18 };
    const rect = swivel ? chairRect(chair) : null;
    const ignore = swivel ? [chair, sprite] : [sprite];
    const built = localStandGrid(pfm, { exclude: ignore });
    return pickStandSpot({ ...c, facing, approach: null, forced: true }, {
        cellNear: (x, y, r) => nearestCell(built, x, y, r),
        boxClear: (x, y) => walkBoxClear(scene, x, y, { ignore, extra: rect ? [rect] : [] }),
        lineClear: (x, y) => pathClear(scene, { x: c.cx, y: c.cy }, { x, y }, { ignore }),
        flood: n => floodStandCells(built, c.cx, c.cy, n)
    });
}

/**
 * Called from NPCBehavior.update(). Returns true when the NPC is seated and the
 * rest of its behaviour should be skipped this tick.
 */
export function updateSeatedNPC(behavior, playerPos) {
    if (behavior?._seatMove?.stage === 'step') return advanceSeatMove(behavior);
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
    if (behavior.hostile || ko || !st.chair.active) { unseatNPC(behavior); return !!behavior._seatMove; }
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
    fitSeatedBody(sprite, st);
    updateBreath(st, sprite, true);
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
const POST_SNAP = 48;       // px (1.5 tiles): at its post, an NPC this close to its home cell looks from there
const FETCH_RANGE = 192;    // px to look for a chair to fetch
const FETCH_TIMEOUT_MS = 15000;

/** Where a needs NPC is parked: { key, targetId } or null while it's on the move. */
export function needsStop(ns) {
    const home = window.npcManager?.getNPC?.(ns.npcId)?.needsHome;
    const homeId = typeof home === 'string' ? home : null;
    // Own-desk work never leaves the post (npc-needs _atOwnPost): the home stop in every phase
    // (start, goto_target, using) and on the one `returning` tick after it, so the key never
    // changes and the NPC stays seated (OFFICE_LIFE_PLAN 2.11)
    // A visit to the own desk too (review R2 m2): the needs core keeps it at its post (_atOwnPost)
    const ownDesk = ns.atPost && ns.mode === 'job' && (ns.job?.kind === 'use' || ns.job?.kind === 'visit') && homeId && ns.job.targetId === homeId;
    // Access 9.2 C (8.2): a phone use at the post is sitting at the post (no target to stop at)
    const phoneAtPost = ns.atPost && ns.mode === 'job' && ns.job?.kind === 'self';
    if (phoneAtPost) return { key: `at:${homeId || 'post'}`, targetId: homeId, post: true };
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

export const TYPING_BOB_MS = 600;

let reducedMotionQuery;
function prefersReducedMotion() {
    try {
        if (reducedMotionQuery === undefined) reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') || null;
        return reducedMotionQuery?.matches === true;
    } catch (e) { return false; }
}

/**
 * Pure: the seated typing bob (OFFICE_LIFE_PLAN 2.12), 0 or 1 px. Only while the NPC's job is
 * a `work` use in its `using` phase, alternating every TYPING_BOB_MS of the needs clock (so it
 * stops with the clock and is the same in every run). Off under reduced motion and with
 * `"officeVisuals": false`.
 */
export function typingBob(ns, clockMs, { reduced = false, off = false } = {}) {
    if (reduced || off || !ns || ns.mode !== 'job' || ns.call) return 0;   // slice 19: not on a call
    const job = ns.job;
    if (!job || job.kind !== 'use' || job.need !== 'work' || job.phase !== 'using') return 0;
    return Math.floor((Number(clockMs) || 0) / TYPING_BOB_MS) % 2;
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
const CONTACT_SWEEP_PX = 24; // a slid or fetched chair tucks to a desk only when the desk is this close

/**
 * Tuck a just-placed swivel chair up to its desk's contact line (SEAT_BOX_PLAN.md section 6,
 * items 2 and 3). From where the chair was pulled out to, sweep its seated block along
 * `faceCompass` (the way its sitter faces, toward the desk) and slide it that far, but only
 * when a solid body is within CONTACT_SWEEP_PX; otherwise the chair stays where it was pulled
 * out to. In a footprint-boxed map this gives castor F + 4 in front and the footprint's back
 * edge − 4 behind; against today's bottom-quarter box it still lands the front castor at F + 4.
 */
export function sweepChairToContact(chair, faceCompass) {
    const t = contactTarget(chair, faceCompass);
    if (t) slideChairFootTo(chair, t.x, t.y);
}

/** Where sweepChairToContact puts the chair's foot, or null to leave it (the seat moves roll it there). */
function contactTarget(chair, faceCompass) {
    // __seatBoxNpc === false keeps the interim "chair a tile out" look, for the before/after audit only
    if (typeof window !== 'undefined' && window.__seatBoxNpc === false) return null;
    if (!chair?.body || !chair.scene) return null;
    const a = forwardRad(faceCompass);
    const dx = Math.cos(a), dy = Math.sin(a);
    const d = sweepBlock(chair.scene, chairRect(chair), dx, dy, { ignore: [chair] });
    if (d > 0 && d <= CONTACT_SWEEP_PX) {
        const f = bodyFeet(chair);
        return { x: f.x + dx * d, y: f.y + dy * d };
    }
    return null;
}

/** Slide a swivel chair so its foot is at (x, y) (pulling it out to sit, tucking it in on leaving). */
function slideChairFootTo(chair, x, y) {
    if (!chair.body) return;
    const f = bodyFeet(chair);
    chair.x = Math.round(chair.x + (x - f.x));
    chair.y = Math.round(chair.y + (y - f.y));
    placeBody(chair, chair.x, chair.y);
    window.updateSpriteDepth?.(chair, chair.elevation || 0);
}

/**
 * Where a parked needs NPC looks for a chair from. At its post (stop.post) and within POST_SNAP
 * of its home cell, the home cell: a walk ends anywhere within a tile of its target (npc-behavior's
 * arrival tolerance), so the feet can be ~32 px off the cell on the side it came from, and a chair
 * ~14 px from the cell was then past NEAR_CHAIR (lab_physical_pentest: Melanie back from coffee
 * at (235,172), her chair's foot (200,186), 37.7 px; she stood at her desk for good). Elsewhere,
 * or farther off (a script moved it), the feet.
 */
export function needsSeatRef(feet, stop, home) {
    if (stop?.post && home && Number.isFinite(home.x) && Number.isFinite(home.y)
        && Math.hypot(home.x - feet.x, home.y - feet.y) <= POST_SNAP) {
        return { x: home.x, y: home.y };
    }
    return { x: feet.x, y: feet.y };
}

function updateNeedsSeat(behavior, ns, playerPos) {
    const sprite = behavior.sprite;
    const stop = needsStop(ns);
    const status = window.npcNeedsSystem?.world?.npcStatus?.(behavior.npcId) || {};

    if (behavior._seatMove) {
        const m = behavior._seatMove;
        if (!stop || stop.key !== m.stopKey || status.ko || status.hostile) { endSeatMove(behavior); return false; }
        return advanceSeatMove(behavior);
    }
    if (behavior._fetch) return advanceFetch(behavior, ns, stop);

    if (behavior._seat) {
        const st = behavior._seat;
        if (!stop || stop.key !== st.needsStop || status.ko || status.hostile || !st.chair.active) {
            unseatNPC(behavior);
            behavior._seatTried = false;
            return !!behavior._seatMove; // stepping off
        }
        sprite.body.setVelocity(0, 0);
        // Swivel: face the work, the player while they talk, a colleague speaking nearby, or now
        // and then a glance round (slice 21); the roll and the swivel wait while the NPC is busy
        const sys = window.npcNeedsSystem;
        const chatting = sys?.world?.inChatWith?.(behavior.npcId);
        const held = idleMotionHeld({ call: !!ns.call, paired: !!sys?._chatPartner?.(behavior.npcId),
            talking: !!sys?._talking?.(behavior.npcId), typing: isTyping(ns), chatting: !!chatting });
        if (st.seat.kind === 'swivel') {
            let want = st.homeFacing, reason = null;
            if (chatting && playerPos) {
                const p = bodyFeet(sprite);
                want = compassToward(playerPos.x - p.x, playerPos.y - p.y);
            } else if (!held && sys && swivelEnabled(window.npcManager?.getNPC?.(behavior.npcId), window.gameScenario)) {
                const p = sys.world?.npcPos?.(behavior.npcId) || bodyFeet(sprite); // body centre, as the speakers list
                const sp = listenTarget({ npcId: behavior.npcId, roomId: behavior.roomId, x: p.x, y: p.y,
                    speakers: sys.speakers, clockMs: sys.clockMs });
                if (sp) {
                    want = compassToward(sp.x - p.x, sp.y - p.y);
                    reason = 'listen';
                } else {
                    const chance = Number(window.npcManager?.getNPC?.(behavior.npcId)?.swivelChance);
                    want = swivelFacing({ state: ns, clockMs: sys.clockMs, homeFacing: st.homeFacing, valid: st.seat.valid,
                        roll: salt => sys.roll(behavior.npcId, salt),
                        chance: Number.isFinite(chance) ? chance : SWIVEL_CHANCE });
                    reason = 'idle';
                }
            }
            want = snapFacing(want, st.seat.valid);
            if (want !== st.facing) {
                st.facing = want;
                setChairFacing(st.chair, want, st.seat);
                behavior.direction = COMPASS_TO_PLAYER[want];
                if (reason && want !== st.homeFacing) {
                    window.eventDispatcher?.emit?.(`npc_swivelled:${behavior.npcId}`, { npcId: behavior.npcId, facing: want, reason });
                }
            }
        }
        fidgetChair(st, sprite, held);
        // Slice 20: seated typists per NPC (room tone counts the player's room); updated in this loop
        const typists = window.officeTypists || (window.officeTypists = new Map());
        if (isTyping(ns)) typists.set(behavior.npcId, behavior.roomId); else typists.delete(behavior.npcId);
        window.updateSpriteDepth?.(st.chair, st.chair.elevation || 0);
        const bob = typingBob(ns, window.npcNeedsSystem?.clockMs,
            { reduced: prefersReducedMotion(), off: window.gameScenario?.officeVisuals === false });
        poseSprite(sprite, st.chair, st.seat, st.facing, st.place, bob);
        fitSeatedBody(sprite, st);
        behavior._typingBob = bob;
        // Typing moves the whole figure; breathe only between keystroke spells
        const typing = typingBob(ns, TYPING_BOB_MS, { reduced: prefersReducedMotion(),
            off: window.gameScenario?.officeVisuals === false }) === 1;
        updateBreath(st, sprite, !typing);
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
    const feet = needsSeatRef(bodyFeet(sprite), stop, ns.home);
    const toward = facePointFor(obj, feet);
    // Chairs at another needs NPC's post are theirs, unless this is that spot too
    const posts = otherPosts(behavior.npcId).filter(p => Math.hypot(p.x - feet.x, p.y - feet.y) > NEAR_CHAIR);
    const free = c => !posts.some(p => Math.hypot(p.x - (c.obj.x + c.obj.width / 2), p.y - (c.obj.y + c.obj.height)) < NEAR_CHAIR);
    const near = chairsNear(behavior.roomId, feet.x, feet.y, NEAR_CHAIR)
        .find(c => free(c) && (c.seat.kind === 'swivel' || staticFacesToward(c.seat, feet, toward)));
    if (near) {
        // Walk to the work cell, roll a swivel chair out to it and in to the desk front, walk onto the seat
        return startSeatMove(behavior, near.obj, near.seat, { toward, needsStop: stop.key, ref: { x: feet.x, y: feet.y } });
    }
    if (pref !== 'fetch') return false;
    const fetchable = chairsNear(behavior.roomId, feet.x, feet.y, FETCH_RANGE)
        .filter(c => c.seat.kind === 'swivel' && c.obj.body && free(c))[0];
    if (!fetchable) return false; // work standing
    startFetch(behavior, fetchable.obj, feet, toward, stop.key);
    return true;
}

/**
 * Push a swivel chair in toward where its sitter faced, clear of the spot they work from.
 * Move min(TUCK_PX, sweep distance) along `facing` (the NPC's home facing), so a chair tucked
 * against a footprint-boxed desk can't be driven into it (slideChairFootTo sets the position
 * directly and physics never pushes back; SEAT_BOX_PLAN.md section 6 item 4).
 */
export function tuckIn(chair, seat, facing, { glide = false } = {}) {
    if (seat?.kind !== 'swivel' || !chair.body || chair.seatedBy) return;
    const a = forwardRad(facing);
    const dx = Math.cos(a), dy = Math.sin(a);
    const d = chair.scene ? sweepBlock(chair.scene, chairRect(chair), dx, dy, { ignore: [chair] }) : Infinity;
    const dist = Math.min(TUCK_PX, d);
    const f = bodyFeet(chair);
    if (glide) glideChairFootTo(chair, f.x + dx * dist, f.y + dy * dist);
    else slideChairFootTo(chair, f.x + dx * dist, f.y + dy * dist);
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
    // The chair stops a step ahead of the NPC: roll it back to the work spot, in to the desk, then sit
    return startSeatMove(behavior, chair, seatSpec(chair), { toward: f.toward, needsStop: f.stopKey, ref: f.spot });
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
    const ahead = 14; // on arrival the seat move rolls it back under the NPC
    f.chair.x = Math.round(feet.x + Math.cos(a) * ahead - off.x);
    f.chair.y = Math.round(feet.y + Math.sin(a) * ahead - off.y);
    if (seat?.kind === 'swivel' && !arrived) setChairFacing(f.chair, snapFacing(dirC, seat.valid), seat);
    window.updateSpriteDepth?.(f.chair, f.chair.elevation || 0);
    if (!arrived) return false;
    // The seat move tucks it to the desk's contact line before seating (section 6 item 3)
    return endFetch(behavior, true);
}

export function installSeating(scene) {
    scene.events.on('postupdate', place);
    scene.events.once('shutdown', () => { state = null; stepOff = null; ghosts = []; glides.clear(); });
}

const seating = {
    seatSpec, isSeat, isStaticSeatTexture, hasSitFrames, canPlayerSit, trySit, standUp, onJumpKey, queueSit,
    isSeated, isMounting, currentSeat, currentPose, canRoll, afterPlayerMovement, onMoveIntent, place, installSeating,
    chairFacing, setChairFacing, snapFacing, seatNPC, unseatNPC, updateSeatedNPC, cancelFetch
};
window.seating = seating;
export default seating;
