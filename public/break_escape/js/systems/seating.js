/**
 * Seating: the player sits on chairs.
 *
 * Interacting with a supported chair (E, or a click) sits the player down. The
 * player sprite stays the physics/movement driver but is hidden; a separate image
 * shows the atlas's seated frame ("sit_<compass>_frame_000", see
 * tools/pixellab_pipeline.py import --sit-from) on the chair.
 *
 *  - Swivel chairs roll with the player: normal movement (keys or click-to-move)
 *    moves the chair, with no walk animation, and the seat turns to the direction of
 *    travel, snapped to the chair's valid facings.
 *  - Static chairs: any move (keys or a click) hops the player off.
 *  - Space, punching or blocking stands the player up; E still reaches objects
 *    nearby (a desk PC) and stands up only when there's nothing else in reach.
 *
 * Layering (from the 8-direction render tests): facing away (N, NE, NW) the chair is
 * drawn over the sitter, so the backrest hides the torso; every other facing draws
 * the sitter over the chair, with armrest strips redrawn on top where a chair has them.
 *
 * Anchors: seat points are in chair-texture pixels (origin top-left); hip points are
 * in the 80x80 character atlas frame (PixelLab 60px seated rotations pasted at +10,+12).
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

// Seat point per facing for each chair shape. front: [x, y, w, h] strips of the chair
// (armrests) drawn over the sitter.
const FAMILIES = {
    exec: {
        seat: { 'south': [19, 37], 'south-east': [21, 34], 'east': [16, 31], 'north-east': [20, 30],
                'north': [19, 30], 'north-west': [18, 30], 'west': [22, 31], 'south-west': [17, 34] },
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
// don't share one order: frame 1 is south for most, north for chair-white-1, and some
// turn clockwise, some anticlockwise (checked by eye on every frame).
const SWIVEL_SEATS = {
    'chair-exec-rotate':       { family: 'exec',     order: 'cw',  start: 'south' },
    'chair-darkgray-1-rotate': { family: 'office40', order: 'ccw', start: 'south' },
    'chair-grey-1-rotate':     { family: 'office40', order: 'ccw', start: 'south' },
    'chair-grey-4-rotate':     { family: 'office40', order: 'ccw', start: 'south' },
    'chair-white-1-rotate':    { family: 'white32',  order: 'cw',  start: 'north' },
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
    exec_chair_back1: { facing: 'north', seat: [19, 30] },
    exec_chair_black1: { facing: 'south', seat: [16, 33] },
    aw_studio_chair_n1: { facing: 'north', seat: [16, 10] },
    aw_studio_chair_s1: { facing: 'south', seat: [16, 11] }
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

/** World point where the sitter's hips go on this chair, facing `facing`. */
function seatPoint(chair, seat, facing) {
    const p = seat.kind === 'static' ? seat.seat : seat.family.seat[facing];
    return { x: chair.x + p[0], y: chair.y + p[1] };
}

// ---------------------------------------------------------------- player state

let state = null; // { chair, seat, facing, image, overlays[], approach, footOffset, savedBody, chairBodyWasEnabled }

export function isSeated() { return !!state; }
export function currentSeat() { return state?.chair || null; }
export function canRoll() { return state?.seat.kind === 'swivel'; }

export function canPlayerSit() {
    const player = window.player;
    return !!player && hasSitFrames(player.texture?.key);
}

/** Interaction entry point: sit on a chair. Returns true when it handled the sprite. */
export function trySit(chair) {
    const seat = seatSpec(chair);
    if (!seat || !canPlayerSit()) return false;
    if (state?.chair === chair) { standUp(); return true; }
    if (state) standUp();
    sitOn(chair, seat);
    return true;
}

function playerFeet(player) {
    return player.body ? { x: player.body.center.x, y: player.body.center.y } : { x: player.x, y: player.y };
}

function moveDriverFeetTo(player, x, y) {
    const f = playerFeet(player);
    player.body.reset(player.x + (x - f.x), player.y + (y - f.y));
}

function sitOn(chair, seat) {
    const player = window.player;
    const scene = chair.scene;
    window.cancelClickToMove?.();
    player.body.setVelocity(0, 0);

    const approach = playerFeet(player);
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
        // Static: no collisions while seated; the driver sits at the chair's foot.
        footOffset = { x: chair.width / 2, y: chair.height - 2 };
        player.body.checkCollision.none = true;
        moveDriverFeetTo(player, chair.x + footOffset.x, chair.y + footOffset.y);
    }

    const image = scene.add.image(0, 0, player.texture.key, `sit_${facing}_frame_000`).setOrigin(0, 0);
    const overlays = [0, 1].map(() => scene.add.image(0, 0, chair.texture.key).setOrigin(0, 0).setVisible(false));

    player.setVisible(false);
    player.anims.stop();
    player.isMoving = false;
    player.isSeated = true;
    player.direction = COMPASS_TO_PLAYER[facing];
    player.lastDirection = player.direction;

    state = { chair, seat, facing, image, overlays, approach, footOffset, savedBody, chairBodyWasEnabled };
    chair.seatedBy = 'player';
    place();
    window.eventDispatcher?.emit?.('player_sat', { objectId: chair.objectId, facing });
}

/** Stand the player up beside the chair. */
export function standUp() {
    if (!state) return false;
    const player = window.player;
    const { chair, seat, image, overlays, savedBody, approach, chairBodyWasEnabled, facing } = state;
    state = null;
    image.destroy();
    overlays.forEach(o => o.destroy());
    delete chair.seatedBy;

    player.body.setVelocity(0, 0);
    player.body.setSize(savedBody.w, savedBody.h, false);
    player.body.setOffset(savedBody.ox, savedBody.oy);
    player.body.checkCollision.none = savedBody.none;

    let spot;
    if (seat.kind === 'swivel') {
        if (chair.body) {
            chair.body.enable = chairBodyWasEnabled;
            chair.body.reset(chair.x, chair.y);
            chair.body.setVelocity(0, 0);
        }
        spot = standSpot(chair, facing);
    } else {
        spot = approach;
    }
    if (spot) moveDriverFeetTo(player, spot.x, spot.y);

    player.isSeated = false;
    player.setVisible(true);
    const dir = player.direction || 'down';
    const animKey = `idle-${dir}`;
    if (player.anims.animationManager.exists(animKey)) player.anims.play(animKey, true);
    window.eventDispatcher?.emit?.('player_stood', { objectId: chair.objectId });
    return true;
}

/** A walkable spot next to a swivel chair, in front of it first. */
function standSpot(chair, facing) {
    const pfm = window.pathfindingManager;
    const b = chair.body;
    const cx = b ? b.center.x : chair.x + chair.width / 2;
    const cy = b ? b.center.y : chair.y + chair.height;
    const reach = (b ? Math.max(b.width, b.height) / 2 : 10) + 10;
    const start = COMPASS.indexOf(facing);
    for (const step of [0, 1, -1, 2, -2, 3, -3, 4]) {
        const a = (angleOf(COMPASS[(start + step + 8) % 8]) + 90) * Math.PI / 180; // compass 0 = south = +y
        const x = cx + Math.cos(a) * reach, y = cy + Math.sin(a) * reach;
        const cell = pfm?.findNearestWalkableWorldCell?.(x, y, 1);
        if (cell && Math.hypot(cell.x - x, cell.y - y) < 12) return { x: cell.x, y: cell.y };
    }
    return pfm?.findNearestWalkableWorldCell?.(cx, cy + reach, 3) || null;
}

/**
 * Called right after the normal player movement each frame. Returns true when
 * movement should be abandoned for this frame (unused for now).
 * Swivel: slows the roll and keeps the seat facing the way the player moves.
 */
export function afterPlayerMovement() {
    if (!state) return;
    const player = window.player;
    if (window.playerHealth?.isKO?.()) { standUp(); return; }
    if (state.seat.kind === 'swivel') {
        player.body.velocity.x *= ROLL_SPEED;
        player.body.velocity.y *= ROLL_SPEED;
    }
    if (player.anims.isPlaying) player.anims.stop(); // no walk/idle animation while seated
}

/** Static chairs: a move attempt hops the player off first. */
export function onMoveIntent() {
    if (state && state.seat.kind === 'static') standUp();
}

/** Position the chair, the seated image and armrest strips (scene postupdate). */
export function place() {
    if (!state) return;
    const player = window.player;
    const { chair, seat, image, overlays, footOffset } = state;
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

    const facing = state.facing;
    const frame = `sit_${facing}_frame_000`;
    if (image.frame.name !== frame) image.setFrame(frame);
    const sp = seatPoint(chair, seat, facing);
    const hip = SIT_HIP[facing];
    image.setPosition(Math.round(sp.x - hip[0]), Math.round(sp.y - hip[1]));
    image.setVisible(chair.visible);

    const rear = REAR.has(facing);
    image.setDepth(chair.depth + (rear ? -SEAT_DEPTH_STEP : SEAT_DEPTH_STEP));
    // The hidden driver keeps a depth too, for anything that reads it.
    player.setDepth(image.depth);

    const strips = (!rear && seat.kind === 'swivel' && seat.family.front?.[facing]) || [];
    overlays.forEach((o, i) => {
        const r = strips[i];
        if (!r) { o.setVisible(false); return; }
        if (o.texture.key !== chair.texture.key) o.setTexture(chair.texture.key);
        o.setPosition(chair.x, chair.y).setCrop(r[0], r[1], r[2], r[3])
            .setDepth(chair.depth + 2 * SEAT_DEPTH_STEP).setVisible(chair.visible);
    });
}

export function installSeating(scene) {
    scene.events.on('postupdate', place);
    scene.events.once('shutdown', () => { state = null; });
}

const seating = {
    seatSpec, isSeat, isStaticSeatTexture, hasSitFrames, canPlayerSit, trySit, standUp,
    isSeated, currentSeat, canRoll, afterPlayerMovement, onMoveIntent, place, installSeating,
    chairFacing, setChairFacing, snapFacing
};
window.seating = seating;
export default seating;
