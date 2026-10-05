// IMPORTANT: version must match all other imports of rooms.js — mismatched ?v= strings
// create separate module instances with separate rooms objects, causing state to diverge.
import { initializeRooms, calculateWorldBounds, calculateRoomPositions, createRoom, revealRoom, updatePlayerRoom, rooms } from './rooms.js';
import { createPlayer, updatePlayerMovement, movePlayerToPoint, facePlayerToward, startHoldWalk, stopHoldWalk, player } from './player.js';
import { initializePathfinder } from './pathfinding.js';
import { initializeInventory, processInitialInventoryItems } from '../systems/inventory.js';
import { checkObjectInteractions, setGameInstance, isObjectInInteractionRange } from '../systems/interactions.js';
import { createInfoLabel, updateInfoLabel } from '../ui/info-label.js';
import { showInteractionMenu, isInteractionMenuOpen, closeInteractionMenu } from '../ui/interaction-menu.js';
import { resolveObjectField } from '../utils/conditional-text.js';
import { introduceScenario } from '../utils/helpers.js';
import '../minigames/index.js';
import SoundManager from '../systems/sound-manager.js';
import { initPlayerHealth } from '../systems/player-health.js';
import { initNPCHostileSystem } from '../systems/npc-hostile.js';
import { COMBAT_CONFIG } from '../config/combat-config.js';
import { initCombatDebug } from '../utils/combat-debug.js';
import { DamageNumbersSystem } from '../systems/damage-numbers.js';
import { ScreenEffectsSystem } from '../systems/screen-effects.js';
import { SpriteEffectsSystem } from '../systems/sprite-effects.js';
import { AttackTelegraphSystem } from '../systems/attack-telegraph.js';
import { HealthUI } from '../ui/health-ui.js';
import { NPCHealthBars } from '../ui/npc-health-bars.js';
import { GameOverScreen } from '../ui/game-over-screen.js';
import { createPlayerHUD } from '../ui/hud.js';
import { PlayerCombat } from '../systems/player-combat.js';
import { NPCCombat } from '../systems/npc-combat.js';
import { ApiClient } from '../api-client.js'; // Import to ensure window.ApiClient is set
import { getTutorialManager } from '../systems/tutorial-manager.js';
import { TILE_SIZE, SPRITE_PADDING_BOTTOM_ATLAS, SPRITE_PADDING_BOTTOM_LEGACY, DOOR_INTERACTION_RANGE, INTERACTION_RANGE } from '../utils/constants.js';
import { initScenarioMusicEvents } from '../music/scenario-music-events.js';
import { ScenarioTimerUI } from '../ui/scenario-timer.js';  // [Phase 5] Countdown timer HUD widget
import { ScenarioTimerDispatcher } from '../ui/scenario-timer-dispatcher.js';  // [Phase 5] Timer event dispatcher
import { GameClock } from '../systems/game-clock.js';  // Elapsed game time (resumes after a reload) and the in-game clock
import { sightChallengeWatcher } from '../systems/npc-sight-challenge.js';  // Opt-in los.challengeOnSight guards
import { CommandBoardRecorder } from '../minigames/command-board/command-board-timeline.js';  // Board entries stamped as they happen
import { initLighting } from '../systems/lighting.js';
import { collectCharacterSprites, queueCharacterAtlases, ensureCharacterTexture } from '../systems/character-textures.js';

// Global variables that will be set by main.js
let gameScenario;

// Preload function - loads all game assets
export function preload() {
    // Show loading text
    document.getElementById('loading').style.display = 'block';

    // Load tilemap files and regular tilesets first
    this.load.tilemapTiledJSON('room_reception', 'rooms/room_reception.json');
    this.load.tilemapTiledJSON('room_office', 'rooms/room_office.json');
    this.load.tilemapTiledJSON('room_ceo', 'rooms/room_ceo.json');
    this.load.tilemapTiledJSON('room_closet', 'rooms/room_closet.json');
    this.load.tilemapTiledJSON('room_servers', 'rooms/room_servers.json');

    // Load new variable-sized rooms for grid system
    this.load.tilemapTiledJSON('small_room_1x1gu', 'rooms/small_room_1x1gu.json');
    this.load.tilemapTiledJSON('small_room_storage_1x1gu', 'rooms/small_room_storage_1x1gu.json');
    this.load.tilemapTiledJSON('hall_1x2gu', 'rooms/hall_1x2gu.json');

    // Load additional office room variants
    this.load.tilemapTiledJSON('room_meeting', 'rooms/room_meeting.json'); // Meeting room layout
    this.load.tilemapTiledJSON('room_break', 'rooms/room_break.json'); // Meeting room layout variant
    this.load.tilemapTiledJSON('room_it', 'rooms/room_IT.json');     // IT office with servers and tech equipment
    this.load.tilemapTiledJSON('room_hospital_ward', 'rooms/room_hospital_ward.json'); // Large hospital ward (2x wide) for healthcare scenarios
    this.load.tilemapTiledJSON('room_battery_hall',  'rooms/room_battery_hall.json');  // SIS02: industrial lithium-ion battery storage hall
    this.load.tilemapTiledJSON('room_control_1x2gu', 'rooms/room_control_1x2gu.json'); // SIS02: SCADA control room (1x2 grid units)
    this.load.tilemapTiledJSON('room_archive_1x2gu', 'rooms/room_archive_1x2gu.json'); // SIS03: evidence archive / document storage room (1x2 grid units)
    this.load.tilemapTiledJSON('room_library_1x2gu', 'rooms/room_library_1x2gu.json'); // library / reading room (1x2 grid units)

    // Load small office 1x1 GU room variants
    // standard room with items along north wall, plus 2 variants with different item arrangements for variety
    this.load.tilemapTiledJSON('small_office_room1_1x1gu', 'rooms/small_office_room1_1x1gu.json');
    this.load.tilemapTiledJSON('small_office_room2_1x1gu', 'rooms/small_office_room2_1x1gu.json');
    this.load.tilemapTiledJSON('small_office_room3_1x1gu', 'rooms/small_office_room3_1x1gu.json');
    this.load.tilemapTiledJSON('small_office_room4_1x1gu', 'rooms/small_office_room4_1x1gu.json'); // Left-desk small office variant

    // Load small closet/utility room variants
    this.load.tilemapTiledJSON('small_room_closet_east_connections_only_1x1gu', 'rooms/small_room_closet_east_connections_only_1x1gu.json'); // Closet with east door only

    // Generated layout variants (existing tilesets/objects only)
    this.load.tilemapTiledJSON('room_security', 'rooms/room_security.json'); // Dual-desk security office
    this.load.tilemapTiledJSON('room_lab', 'rooms/room_lab.json');           // Tech/lab workbench room
    this.load.tilemapTiledJSON('room_hospital_office', 'rooms/room_hospital_office.json'); // Hospital admin office (room6)
    this.load.tilemapTiledJSON('room_hospital_office_it', 'rooms/room_hospital_office_it.json'); // Hospital IT department: desk bank, workbench, comms rack
    this.load.tilemapTiledJSON('room_hospital_office_cto', 'rooms/room_hospital_office_cto.json'); // Hospital executive office: one desk, meeting chairs, bookcases
    this.load.tilemapTiledJSON('room_hospital_office_security', 'rooms/room_hospital_office_security.json'); // Hospital security office: CCTV desk, key cabinet, lockers
    this.load.tilemapTiledJSON('room_hospital_cto_office', 'rooms/room_hospital_cto_office.json'); // Small hospital CTO office (room6)
    this.load.tilemapTiledJSON('room_hospital_reception', 'rooms/room_hospital_reception.json'); // Hospital reception (room6)
    this.load.tilemapTiledJSON('room_hospital_meeting', 'rooms/room_hospital_meeting.json'); // Hospital conference room (room6)
    this.load.tilemapTiledJSON('room_hospital_servers', 'rooms/room_hospital_servers.json'); // Hospital server room (room6)
    this.load.tilemapTiledJSON('room_hospital_hall', 'rooms/room_hospital_hall.json'); // Hospital corridor (2x1 GU, baked-in south wall)
    this.load.tilemapTiledJSON('room_hospital_hall_ward', 'rooms/room_hospital_hall_ward.json'); // Hospital corridor variant: trolley bed, IV pump, alarm panel
    this.load.tilemapTiledJSON('room_hospital_hall_waiting', 'rooms/room_hospital_hall_waiting.json'); // Hospital corridor variant: row of waiting seats
    this.load.tilemapTiledJSON('room_hospital_waiting_1x1gu', 'rooms/room_hospital_waiting_1x1gu.json'); // Small hospital waiting area / vestibule (1x1 GU)
    this.load.tilemapTiledJSON('room_hospital_storage_1x1gu', 'rooms/room_hospital_storage_1x1gu.json'); // Small hospital store room (1x1 GU)
    this.load.tilemapTiledJSON('room_hospital_staff', 'rooms/room_hospital_staff.json'); // Hospital night staff / handover room (room6, 2x2 GU, doors on all four sides)
    // University (campus) rooms, builder maps in scripts/generate_rooms.py (room_uni_*)
    this.load.tilemapTiledJSON('room_uni_foyer', 'rooms/room_uni_foyer.json'); // University foyer / atrium: crest, heritage display, recruiter's stand (2x2 GU)
    this.load.tilemapTiledJSON('room_uni_lab', 'rooms/room_uni_lab.json'); // Computer teaching lab: two benches of PCs, projector screen, whiteboard (2x2 GU)
    this.load.tilemapTiledJSON('room_uni_common', 'rooms/room_uni_common.json'); // Student common room: lockers, kitchenette, snack machine, sofa (2x2 GU)
    this.load.tilemapTiledJSON('room_uni_corridor', 'rooms/room_uni_corridor.json'); // University corridor: lockers, noticeboard, pigeonholes, drop box (2x1 GU, two visible floor rows)
    this.load.tilemapTiledJSON('room_uni_library', 'rooms/room_uni_library.json'); // Library front desk: shelves, issue desk, floor safe slot (2x1 GU, two visible floor rows)
    this.load.tilemapTiledJSON('room_uni_office', 'rooms/room_uni_office.json'); // Academic's office: door card, whiteboard slot, desk with PC (2x1 GU, two visible floor rows)
    this.load.tilemapTiledJSON('room_uni_workshop', 'rooms/room_uni_workshop.json'); // Maker space / workshop: scoreboard and build screens, island workbench (2x2 GU)
    this.load.tilemapTiledJSON('room_uni_lecture', 'rooms/room_uni_lecture.json'); // Lecture theatre: whiteboard, projector screen, bench and lectern, three tiered seat rows (4x2 GU)
    this.load.tilemapTiledJSON('room_uni_special', 'rooms/room_uni_special.json'); // Special Collections: bookcases, reading table on a rug, archive safe slot (2x2 GU)
    this.load.tilemapTiledJSON('room_uni_seminar', 'rooms/room_uni_seminar.json'); // Seminar room: whiteboard between blinds, long table, flip chart (2x2 GU)
    this.load.tilemapTiledJSON('room_uni_staff', 'rooms/room_uni_staff.json'); // Open-plan staff office: three desk pods, kitchenette, pigeonholes, photocopier (4x2 GU)

    // Load room images (now using smaller 32px scale images)
    this.load.image('room_reception', 'tiles/rooms/room1.png');
    this.load.image('room18', 'tiles/rooms/room18.png');
    this.load.image('room6', 'tiles/rooms/room6.png');
    this.load.image('room_hospital', 'tiles/rooms/room_hospital.png'); // clinical recolour of room6, same tile layout
    this.load.image('room_hospital_carpet', 'tiles/rooms/room_hospital_carpet.png'); // same walls, carpet tiles (offices, conference room)
    this.load.image('room_hospital_exec', 'tiles/rooms/room_hospital_exec.png'); // carpet with a rug under the desk (Dr Kim's office)
    this.load.image('room_hospital_raised', 'tiles/rooms/room_hospital_raised.png'); // same walls, raised access floor (server room)
    this.load.image('room_hospital_kitchen', 'tiles/rooms/room_hospital_kitchen.png'); // same walls, flecked kitchen safety vinyl (staff room)
    // University (campus) room sheets: room6 repainted, off-white walls and teal skirting (scripts/room_gen/make_uni_tileset.py)
    this.load.image('room_uni', 'tiles/rooms/room_uni.png'); // sheet vinyl (corridor)
    this.load.image('room_uni_carpet', 'tiles/rooms/room_uni_carpet.png'); // charcoal-blue carpet tiles (lab, offices, seminar room)
    this.load.image('room_uni_foyer', 'tiles/rooms/room_uni_foyer.png'); // terrazzo with a brass "M" inlay
    this.load.image('room_uni_lecture', 'tiles/rooms/room_uni_lecture.png'); // blue carpet, vinyl front strip, tier lines
    this.load.image('room_uni_common', 'tiles/rooms/room_uni_common.png'); // warm carpet, kitchenette vinyl patch
    this.load.image('room_uni_library', 'tiles/rooms/room_uni_library.png'); // deep green carpet
    this.load.image('room_uni_special', 'tiles/rooms/room_uni_special.png'); // oxblood carpet with a rug
    this.load.image('room_uni_workshop', 'tiles/rooms/room_uni_workshop.png'); // concrete, hazard line round the bench
    this.load.image('room14', 'tiles/rooms/room14.png');
    this.load.image('room19', 'tiles/rooms/room19.png');
    this.load.image('door_32', 'tiles/door_32.png');
    this.load.spritesheet('door_sheet', 'tiles/door_sheet_32.png', {
        frameWidth: 32,
        frameHeight: 64
    });

    // Load tileset images referenced by the new Tiled map
    this.load.image('office-updated', 'tiles/rooms/room1.png');
    this.load.image('door_sheet_32', 'tiles/door_sheet_32.png');

    // Load side door spritesheet for east/west doors (6 frames: closed, opening, open, etc.)
    this.load.spritesheet('door_side_sheet_32', 'tiles/door_side_sheet_32.png', {
        frameWidth: 32,
        frameHeight: 32
    });

    // Load hand frames for HUD interaction mode toggle (15 frames: open hand → fist → punch → back)
    this.load.spritesheet('hand_frames', 'icons/hand_frames.png', {
        frameWidth: 32,
        frameHeight: 32
    });
    
    // Load table tileset images
    this.load.image('desk-ceo1', 'tables/desk-ceo1.png');
    this.load.image('desk-ceo2', 'tables/desk-ceo2.png');
    this.load.image('desk1', 'tables/desk1.png');
    this.load.image('desk2', 'tables/desk2.png');
    this.load.image('desk3', 'tables/desk3.png');
    this.load.image('smalldesk1', 'tables/smalldesk1.png');
    this.load.image('smalldesk2', 'tables/smalldesk2.png');
    this.load.image('reception_table1', 'tables/reception_table1.png');
    this.load.image('hospital_desk1', 'tables/hospital_desk1.png');
    this.load.image('hospital_conference_table', 'tables/hospital_conference_table.png');
    this.load.image('hospital_desk2', 'tables/hospital_desk2.png');

    // Load object sprites - keeping existing ones for backward compatibility
    this.load.image('pc', 'objects/pc1.png');
    this.load.image('key', 'objects/key.png');
    this.load.image('key-ring', 'objects/key-ring.png');
    this.load.image('notes', 'objects/notes1.png');
    this.load.image('checklist', 'objects/checklist.png');
    this.load.image('phone', 'objects/phone1.png');
    this.load.image('suitcase', 'objects/suitcase-1.png');
    this.load.image('smartscreen', 'objects/smartscreen.png');
    this.load.image('photo', 'objects/picture1.png');
    this.load.image('safe', 'objects/safe1.png');
    this.load.image('book', 'objects/book1.png');
    this.load.image('book1', 'objects/book1.png'); // same image under its Tiled name, so an unclaimed book1 map sprite draws
    this.load.image('workstation', 'objects/workstation.png');
    this.load.image('lab-workstation', 'objects/lab-workstation.png');
    this.load.image('filing_cabinet', 'objects/filing_cabinet.png');
    this.load.image('bluetooth_scanner', 'objects/bluetooth_scanner.png');
    this.load.image('bluetooth', 'objects/bluetooth.png');
    this.load.image('tablet', 'objects/tablet.png');
    this.load.image('launch-device', 'objects/launch-device.png');
    this.load.image('fingerprint', 'objects/fingerprint_small.png');
    this.load.image('fingerprint-brush-red', 'objects/fingerprint-brush-red.png');
    this.load.image('lockpick', 'objects/lockpick.png');
    this.load.image('spoofing_kit', 'objects/office-misc-headphones.png');
    this.load.image('id_badge', 'objects/id_badge.png');
    this.load.image('text_file', 'objects/text_file.png');
    this.load.image('keyway', 'icons/keyway.png');
    this.load.image('password', 'icons/password.png');
    this.load.image('pin', 'icons/pin.png');
    this.load.image('talk', 'icons/talk.png');

    // Load RFID keycard and cloner assets
    this.load.image('keycard', 'objects/keycard.png');
    this.load.image('keycard-ceo', 'objects/keycard-ceo.png');
    this.load.image('keycard-security', 'objects/keycard-security.png');
    this.load.image('keycard-maintenance', 'objects/keycard-maintenance.png');
    this.load.image('rfid_cloner', 'objects/rfid_cloner.png');
    this.load.image('nfc-waves', 'icons/nfc-waves.png');

    // Load hospital object sprites (referenced by the objects tileset, tile ids 191-202)
    this.load.image('medical_cabinet1', 'objects/medical_cabinet1.png');
    this.load.image('medical_cabinet2', 'objects/medical_cabinet2.png');
    this.load.image('hospital_chair1', 'objects/hospital_chair1.png');
    this.load.image('hospital_chair2', 'objects/hospital_chair2.png');
    this.load.image('hospital_chair_north', 'objects/hospital_chair_north.png');
    this.load.image('hospital_chair_south', 'objects/hospital_chair_south.png');
    this.load.image('crash_cart1', 'objects/crash_cart1.png');
    this.load.image('crash_cart2', 'objects/crash_cart2.png');
    // 8-direction crash cart rotation frames — crash_cart1 swaps to these at runtime so it
    // rolls and spins like a swivel chair (see rooms.js / object-physics.js swivel handling).
    this.load.image('crash-cart-rotate1', 'objects/crash-cart-rotate1.png');
    this.load.image('crash-cart-rotate2', 'objects/crash-cart-rotate2.png');
    this.load.image('crash-cart-rotate3', 'objects/crash-cart-rotate3.png');
    this.load.image('crash-cart-rotate4', 'objects/crash-cart-rotate4.png');
    this.load.image('crash-cart-rotate5', 'objects/crash-cart-rotate5.png');
    this.load.image('crash-cart-rotate6', 'objects/crash-cart-rotate6.png');
    this.load.image('crash-cart-rotate7', 'objects/crash-cart-rotate7.png');
    this.load.image('crash-cart-rotate8', 'objects/crash-cart-rotate8.png');
    // 8-direction wheelchair rotation frames — wheelchair1 swaps to these the same way.
    for (let i = 1; i <= 8; i++) {
        this.load.image(`wheelchair-rotate${i}`, `objects/wheelchair-rotate${i}.png`);
    }
    // Linen cart, corridor IV stand, empty trolley bed and ward drug trolley: 8-direction frames for the same swap.
    for (const base of ['linen-cart-rotate', 'iv-stand-rotate', 'bed-empty-rotate', 'drug-trolley-rotate']) {
        for (let i = 1; i <= 8; i++) {
            this.load.image(`${base}${i}`, `objects/${base}${i}.png`);
        }
    }
    this.load.image('sanitizer_stand1', 'objects/sanitizer_stand1.png');
    this.load.image('sanitizer_stand2', 'objects/sanitizer_stand2.png');
    this.load.image('hospital_chart_board1', 'objects/hospital_chart_board1.png');
    this.load.image('hospital_chart_board2', 'objects/hospital_chart_board2.png');

    // Load new object sprites from Tiled map tileset
    // These are the key objects that appear in the new room_reception2.json
    this.load.image('fingerprint_kit', 'objects/fingerprint_kit.png');
    this.load.image('pin-cracker', 'objects/pin-cracker.png');
    this.load.image('pin-cracker-large', 'objects/pin-cracker-large.png');
    this.load.image('bin11', 'objects/bin11.png');
    this.load.image('bin10', 'objects/bin10.png');
    this.load.image('bin9', 'objects/bin9.png');
    this.load.image('bin8', 'objects/bin8.png');
    this.load.image('bin7', 'objects/bin7.png');
    this.load.image('bin6', 'objects/bin6.png');
    this.load.image('bin5', 'objects/bin5.png');
    this.load.image('bin4', 'objects/bin4.png');
    this.load.image('bin3', 'objects/bin3.png');
    this.load.image('bin2', 'objects/bin2.png');
    this.load.image('bin1', 'objects/bin1.png');
    
    // Suitcases
    this.load.image('suitcase21', 'objects/suitcase21.png');
    this.load.image('suitcase20', 'objects/suitcase20.png');
    this.load.image('suitcase19', 'objects/suitcase19.png');
    this.load.image('suitcase18', 'objects/suitcase18.png');
    this.load.image('suitcase17', 'objects/suitcase17.png');
    this.load.image('suitcase16', 'objects/suitcase16.png');
    this.load.image('suitcase15', 'objects/suitcase15.png');
    this.load.image('suitcase14', 'objects/suitcase14.png');
    this.load.image('suitcase13', 'objects/suitcase13.png');
    this.load.image('suitcase12', 'objects/suitcase12.png');
    this.load.image('suitcase11', 'objects/suitcase11.png');
    this.load.image('suitcase10', 'objects/suitcase10.png');
    this.load.image('suitcase9', 'objects/suitcase9.png');
    this.load.image('suitcase8', 'objects/suitcase8.png');
    this.load.image('suitcase7', 'objects/suitcase7.png');
    this.load.image('suitcase6', 'objects/suitcase6.png');
    this.load.image('suitcase5', 'objects/suitcase5.png');
    this.load.image('suitcase4', 'objects/suitcase4.png');
    this.load.image('suitcase3', 'objects/suitcase3.png');
    this.load.image('suitcase2', 'objects/suitcase2.png');
    this.load.image('suitcase-1', 'objects/suitcase-1.png');
    
    // Plants
    this.load.image('plant-flat-pot7', 'objects/plant-flat-pot7.png');
    this.load.image('plant-flat-pot6', 'objects/plant-flat-pot6.png');
    this.load.image('plant-flat-pot5', 'objects/plant-flat-pot5.png');
    this.load.image('plant-flat-pot4', 'objects/plant-flat-pot4.png');
    this.load.image('plant-flat-pot3', 'objects/plant-flat-pot3.png');
    this.load.image('plant-flat-pot2', 'objects/plant-flat-pot2.png');
    this.load.image('plant-flat-pot1', 'objects/plant-flat-pot1.png');
    
    // Office furniture
    this.load.image('outdoor-lamp4', 'objects/outdoor-lamp4.png');
    this.load.image('outdoor-lamp3', 'objects/outdoor-lamp3.png');
    this.load.image('outdoor-lamp2', 'objects/outdoor-lamp2.png');
    this.load.image('outdoor-lamp1', 'objects/outdoor-lamp1.png');
    this.load.image('plant-large10', 'objects/plant-large10.png');
    this.load.image('plant-large-displacement', 'objects/plant-large-displacement.png');
    this.load.image('lamp-stand5', 'objects/lamp-stand5.png');
    this.load.image('plant-large9', 'objects/plant-large9.png');
    this.load.image('plant-large8', 'objects/plant-large8.png');
    this.load.image('plant-large7', 'objects/plant-large7.png');
    this.load.image('plant-large6', 'objects/plant-large6.png');
    this.load.image('lamp-stand4', 'objects/lamp-stand4.png');
    this.load.image('plant-large5', 'objects/plant-large5.png');
    this.load.image('plant-large4', 'objects/plant-large4.png');
    this.load.image('plant-large3', 'objects/plant-large3.png');
    this.load.image('plant-large2', 'objects/plant-large2.png');
    this.load.image('lamp-stand3', 'objects/lamp-stand3.png');
    this.load.image('plant-large1', 'objects/plant-large1.png');
    this.load.image('lamp-stand2', 'objects/lamp-stand2.png');
    this.load.image('lamp-stand1', 'objects/lamp-stand1.png');
    
    // Pictures
    this.load.image('picture14', 'objects/picture14.png');
    this.load.image('picture13', 'objects/picture13.png');
    this.load.image('picture12', 'objects/picture12.png');
    this.load.image('picture11', 'objects/picture11.png');
    this.load.image('picture10', 'objects/picture10.png');
    this.load.image('picture9', 'objects/picture9.png');
    this.load.image('picture8', 'objects/picture8.png');
    this.load.image('picture7', 'objects/picture7.png');
    this.load.image('picture6', 'objects/picture6.png');
    this.load.image('picture5', 'objects/picture5.png');
    this.load.image('picture4', 'objects/picture4.png');
    this.load.image('picture3', 'objects/picture3.png');
    this.load.image('picture2', 'objects/picture2.png');
    this.load.image('picture1', 'objects/picture1.png');
    
    // Office misc items
    this.load.image('office-misc-smallplant2', 'objects/office-misc-smallplant2.png');
    this.load.image('office-misc-smallplant3', 'objects/office-misc-smallplant3.png');
    this.load.image('office-misc-smallplant4', 'objects/office-misc-smallplant4.png');
    this.load.image('office-misc-smallplant5', 'objects/office-misc-smallplant5.png');
    this.load.image('office-misc-box1', 'objects/office-misc-box1.png');
    this.load.image('office-misc-container', 'objects/office-misc-container.png');
    this.load.image('office-misc-lamp3', 'objects/office-misc-lamp3.png');
    this.load.image('office-misc-hdd6', 'objects/office-misc-hdd6.png');
    this.load.image('office-misc-speakers6', 'objects/office-misc-speakers6.png');
    this.load.image('office-misc-pencils6', 'objects/office-misc-pencils6.png');
    this.load.image('office-misc-fan2', 'objects/office-misc-fan2.png');
    this.load.image('office-misc-cup5', 'objects/office-misc-cup5.png');
    this.load.image('office-misc-hdd5', 'objects/office-misc-hdd5.png');
    this.load.image('office-misc-speakers5', 'objects/office-misc-speakers5.png');
    this.load.image('office-misc-cup4', 'objects/office-misc-cup4.png');
    this.load.image('office-misc-speakers4', 'objects/office-misc-speakers4.png');
    this.load.image('office-misc-pencils5', 'objects/office-misc-pencils5.png');

    this.load.image('office-misc-clock', 'objects/office-misc-clock.png');
    this.load.image('office-misc-fan', 'objects/office-misc-fan.png');
    this.load.image('office-misc-speakers3', 'objects/office-misc-speakers3.png');
    this.load.image('office-misc-camera', 'objects/office-misc-camera.png');
    this.load.image('office-misc-headphones', 'objects/office-misc-headphones.png');
    this.load.image('office-misc-hdd4', 'objects/office-misc-hdd4.png');
    this.load.image('office-misc-pencils4', 'objects/office-misc-pencils4.png');
    this.load.image('office-misc-cup3', 'objects/office-misc-cup3.png');
    this.load.image('office-misc-cup2', 'objects/office-misc-cup2.png');
    this.load.image('office-misc-speakers2', 'objects/office-misc-speakers2.png');
    this.load.image('office-misc-stapler', 'objects/office-misc-stapler.png');
    this.load.image('office-misc-hdd3', 'objects/office-misc-hdd3.png');
    this.load.image('office-misc-hdd2', 'objects/office-misc-hdd2.png');
    this.load.image('office-misc-pencils3', 'objects/office-misc-pencils3.png');
    this.load.image('office-misc-pencils2', 'objects/office-misc-pencils2.png');
    this.load.image('office-misc-pens', 'objects/office-misc-pens.png');
    this.load.image('office-misc-lamp2', 'objects/office-misc-lamp2.png');
    this.load.image('office-misc-hdd', 'objects/office-misc-hdd.png');
    this.load.image('office-misc-smallplant', 'objects/office-misc-smallplant.png');
    this.load.image('office-misc-pencils', 'objects/office-misc-pencils.png');
    this.load.image('office-misc-speakers', 'objects/office-misc-speakers.png');
    this.load.image('office-misc-cup', 'objects/office-misc-cup.png');
    this.load.image('office-misc-lamp', 'objects/office-misc-lamp.png');
    this.load.image('phone5', 'objects/phone5.png');
    this.load.image('phone4', 'objects/phone4.png');
    this.load.image('phone3', 'objects/phone3.png');
    this.load.image('phone2', 'objects/phone2.png');
    this.load.image('phone1', 'objects/phone1.png');
    
    // Bags and briefcases
    this.load.image('bag25', 'objects/bag25.png');
    this.load.image('bag24', 'objects/bag24.png');
    this.load.image('bag23', 'objects/bag23.png');
    this.load.image('bag22', 'objects/bag22.png');
    this.load.image('bag21', 'objects/bag21.png');
    this.load.image('bag20', 'objects/bag20.png');
    this.load.image('bag19', 'objects/bag19.png');
    this.load.image('bag18', 'objects/bag18.png');
    this.load.image('bag17', 'objects/bag17.png');
    this.load.image('bag16', 'objects/bag16.png');
    this.load.image('bag15', 'objects/bag15.png');
    this.load.image('bag14', 'objects/bag14.png');
    this.load.image('bag13', 'objects/bag13.png');
    this.load.image('bag12', 'objects/bag12.png');
    this.load.image('bag11', 'objects/bag11.png');
    this.load.image('bag10', 'objects/bag10.png');
    this.load.image('bag9', 'objects/bag9.png');
    this.load.image('bag8', 'objects/bag8.png');
    this.load.image('bag7', 'objects/bag7.png');
    this.load.image('bag6', 'objects/bag6.png');
    this.load.image('bag5', 'objects/bag5.png');
    this.load.image('bag4', 'objects/bag4.png');
    this.load.image('bag3', 'objects/bag3.png');
    this.load.image('bag2', 'objects/bag2.png');
    this.load.image('bag1', 'objects/bag1.png');
    
    // Briefcases
    this.load.image('briefcase-orange-1', 'objects/briefcase-orange-1.png');
    this.load.image('briefcase-yellow-1', 'objects/briefcase-yellow-1.png');
    this.load.image('briefcase13', 'objects/briefcase13.png');
    this.load.image('briefcase-purple-1', 'objects/briefcase-purple-1.png');
    this.load.image('briefcase-green-1', 'objects/briefcase-green-1.png');
    this.load.image('briefcase-blue-1', 'objects/briefcase-blue-1.png');
    this.load.image('briefcase-red-1', 'objects/briefcase-red-1.png');
    this.load.image('briefcase12', 'objects/briefcase12.png');
    this.load.image('briefcase11', 'objects/briefcase11.png');
    this.load.image('briefcase10', 'objects/briefcase10.png');
    this.load.image('briefcase9', 'objects/briefcase9.png');
    this.load.image('briefcase8', 'objects/briefcase8.png');
    this.load.image('briefcase7', 'objects/briefcase7.png');
    this.load.image('briefcase6', 'objects/briefcase6.png');
    this.load.image('briefcase5', 'objects/briefcase5.png');
    this.load.image('briefcase4', 'objects/briefcase4.png');
    this.load.image('briefcase3', 'objects/briefcase3.png');
    this.load.image('briefcase2', 'objects/briefcase2.png');
    this.load.image('briefcase1', 'objects/briefcase1.png');
    
    // Chairs
    this.load.image('chair-grey-4', 'objects/chair-grey-4.png');
    this.load.image('chair-grey-3', 'objects/chair-grey-3.png');
    this.load.image('chair-darkgreen-3', 'objects/chair-darkgreen-3.png');
    this.load.image('chair-grey-2', 'objects/chair-grey-2.png');
    this.load.image('chair-darkgray-1', 'objects/chair-darkgray-1.png');
    this.load.image('chair-darkgreen-2', 'objects/chair-darkgreen-2.png');
    this.load.image('chair-darkgreen-1', 'objects/chair-darkgreen-1.png');
    this.load.image('chair-grey-1', 'objects/chair-grey-1.png');
    this.load.image('chair-red-4', 'objects/chair-red-4.png');
    this.load.image('chair-red-3', 'objects/chair-red-3.png');
    this.load.image('chair-green-2', 'objects/chair-green-2.png');
    this.load.image('chair-green-1', 'objects/chair-green-1.png');
    this.load.image('chair-red-2', 'objects/chair-red-2.png');
    this.load.image('chair-red-1', 'objects/chair-red-1.png');
    this.load.image('chair-white-2', 'objects/chair-white-2.png');
    this.load.image('chair-white-1', 'objects/chair-white-1.png');
    
    // Keyboards
    this.load.image('keyboard8', 'objects/keyboard8.png');
    this.load.image('keyboard7', 'objects/keyboard7.png');
    this.load.image('keyboard6', 'objects/keyboard6.png');
    this.load.image('keyboard5', 'objects/keyboard5.png');
    this.load.image('keyboard4', 'objects/keyboard4.png');
    this.load.image('keyboard3', 'objects/keyboard3.png');
    this.load.image('keyboard2', 'objects/keyboard2.png');
    this.load.image('keyboard1', 'objects/keyboard1.png');
    
    // Safes
    this.load.image('safe5', 'objects/safe5.png');
    this.load.image('safe4', 'objects/safe4.png');
    this.load.image('safe3', 'objects/safe3.png');
    this.load.image('safe2', 'objects/safe2.png');
    this.load.image('safe1', 'objects/safe1.png');
    
    // Notes
    this.load.image('notes1', 'objects/notes1.png');
    this.load.image('notes2', 'objects/notes2.png');
    this.load.image('notes3', 'objects/notes3.png');
    this.load.image('notes4', 'objects/notes4.png');
    this.load.image('notes5', 'objects/notes5.png');

    
    // Servers and tech
    this.load.image('servers', 'objects/servers.png');
    this.load.image('servers4', 'objects/servers4.png');
    this.load.image('servers3', 'objects/servers3.png');
    this.load.image('servers2', 'objects/servers2.png');
    this.load.image('sofa1', 'objects/sofa1.png');
    this.load.image('plant-large13', 'objects/plant-large13.png');
    this.load.image('office-misc-lamp4', 'objects/office-misc-lamp4.png');
    this.load.image('chair-waiting-right-1', 'objects/chair-waiting-right-1.png');
    this.load.image('chair-waiting-left-1', 'objects/chair-waiting-left-1.png');
    this.load.image('plant-large12', 'objects/plant-large12.png');
    this.load.image('plant-large11', 'objects/plant-large11.png');
    
    // Load animated plant frames
    this.load.image('plant-large11-top-ani1', 'objects/plant-large11-top-ani1.png');
    this.load.image('plant-large11-top-ani2', 'objects/plant-large11-top-ani2.png');
    this.load.image('plant-large11-top-ani3', 'objects/plant-large11-top-ani3.png');
    this.load.image('plant-large11-top-ani4', 'objects/plant-large11-top-ani4.png');
    
    this.load.image('plant-large12-top-ani1', 'objects/plant-large12-top-ani1.png');
    this.load.image('plant-large12-top-ani2', 'objects/plant-large12-top-ani2.png');
    this.load.image('plant-large12-top-ani3', 'objects/plant-large12-top-ani3.png');
    this.load.image('plant-large12-top-ani4', 'objects/plant-large12-top-ani4.png');
    this.load.image('plant-large12-top-ani5', 'objects/plant-large12-top-ani5.png');
    
    this.load.image('plant-large13-top-ani1', 'objects/plant-large13-top-ani1.png');
    this.load.image('plant-large13-top-ani2', 'objects/plant-large13-top-ani2.png');
    this.load.image('plant-large13-top-ani3', 'objects/plant-large13-top-ani3.png');
    this.load.image('plant-large13-top-ani4', 'objects/plant-large13-top-ani4.png');
    this.load.image('pc1', 'objects/pc1.png');
    this.load.image('pc3', 'objects/pc3.png');
    this.load.image('pc4', 'objects/pc4.png');
    this.load.image('pc5', 'objects/pc5.png');
    this.load.image('pc6', 'objects/pc6.png');
    this.load.image('pc7', 'objects/pc7.png');
    this.load.image('pc8', 'objects/pc8.png');
    this.load.image('pc9', 'objects/pc9.png');
    this.load.image('pc10', 'objects/pc10.png');
    this.load.image('pc11', 'objects/pc11.png');
    this.load.image('pc12', 'objects/pc12.png');

    // VMs Launchers and Flag Stations
    this.load.image('vm-launcher', 'objects/vm-launcher.png');
    this.load.image('vm-launcher-kali', 'objects/vm-launcher-kali.png');
    this.load.image('vm-launcher-desktop', 'objects/vm-launcher-desktop.png');
    this.load.image('flag-station', 'objects/flag-station.png');

    // Bedside vital signs monitors (pole-mounted patient monitors, distinct from ehr-terminal minigame)
    // Variants: 1=green active waveform, 7=alarm/critical, 2-6=dark/offline screens
    this.load.image('vitals-monitor1', 'objects/vitals-monitor1.png');
    this.load.image('vitals-monitor2', 'objects/vitals-monitor2.png');
    this.load.image('vitals-monitor3', 'objects/vitals-monitor3.png');
    this.load.image('vitals-monitor4', 'objects/vitals-monitor4.png');
    this.load.image('vitals-monitor5', 'objects/vitals-monitor5.png');
    this.load.image('vitals-monitor6', 'objects/vitals-monitor6.png');
    this.load.image('vitals-monitor7', 'objects/vitals-monitor7.png');
    this.load.image('vitals-monitor8', 'objects/vitals-monitor8.png');
    this.load.image('vitals-monitor9', 'objects/vitals-monitor9.png');

    // Hospital ward furniture — loaded as spritesheets so frame 0 is accessible when used as NPC sprites
    this.load.spritesheet('bed1', 'objects/bed1.png', { frameWidth: 37, frameHeight: 72 });
    this.load.spritesheet('bed2', 'objects/bed2.png', { frameWidth: 36, frameHeight: 72 });
    this.load.spritesheet('bed3', 'objects/bed3.png', { frameWidth: 35, frameHeight: 78 });
    this.load.spritesheet('bed4', 'objects/bed4.png', { frameWidth: 35, frameHeight: 72 });
    this.load.spritesheet('bed_mr_pryce', 'objects/bed_mr_pryce.png', { frameWidth: 35, frameHeight: 72 }); // bed4 repainted as m02's Mr Pryce: olive skin, ventilator mask (PixelLab edit)
    this.load.spritesheet('bed5', 'objects/bed5.png', { frameWidth: 38, frameHeight: 72 });
    this.load.spritesheet('bed_ms_chen', 'objects/bed_ms_chen.png', { frameWidth: 38, frameHeight: 72 }); // bed5 repainted as m02's Ms Chen (PixelLab edit)
    this.load.spritesheet('bed_mr_ahmed', 'objects/bed_mr_ahmed.png', { frameWidth: 35, frameHeight: 72 }); // bed4 repainted as sis01's Mr Ahmed: light-brown skin, white beard, nasal cannula (hand-painted)
    this.load.spritesheet('bed_ms_okafor', 'objects/bed_ms_okafor.png', { frameWidth: 36, frameHeight: 72 }); // bed2 repainted as sis01's Ms Okafor: dark skin, satin bonnet, IV tape (hand-painted)
    this.load.spritesheet('bed_mrs_kowalski', 'objects/bed_mrs_kowalski.png', { frameWidth: 38, frameHeight: 72 }); // bed5 repainted as sis01's Mrs Kowalski: white hair, glasses, cardigan, gold cross (hand-painted)
    this.load.spritesheet('bed6', 'objects/bed6.png', { frameWidth: 46, frameHeight: 76 });
    this.load.image('curtain-divider', 'objects/curtain-divider.png');
    this.load.image('chart', 'objects/chart.png');
    this.load.image('chart2', 'objects/chart2.png');
    this.load.image('bed_empty', 'objects/bed_empty.png');

    // SIS02 Energy scenario assets
    this.load.image('emergency-button',    'objects/emergency-button.png');
    this.load.image('screens',             'objects/screens.png');
    this.load.image('batrack',             'objects/batrack.png');
    this.load.image('alarm_panel',         'objects/alarm_panel.png');
    this.load.image('sis_config_panel',    'objects/sis_config_panel.png');
    this.load.image('scada_historian',     'objects/scada_historian.png');
    this.load.image('log_filter_terminal', 'objects/log_filter_terminal.png');
    this.load.image('network_architecture','objects/network_architecture.png');
    this.load.image('thermometer', 'objects/thermometer.png');
    this.load.image('cable',       'objects/cable.png');

    // Minigame type sprites (placeholder pc.png until custom assets are ready)
    this.load.image('infusion_pump',           'objects/infusion_pump.png');
    // PixelLab Create Object batches (scripts/room_gen/import_pixellab_objects.py), tileset objects/hospital_extras
    this.load.image('iv_stand1', 'objects/iv_stand1.png');
    this.load.image('vending_machine1', 'objects/vending_machine1.png');
    this.load.image('supply_shelves1', 'objects/supply_shelves1.png');
    this.load.image('privacy_screen1', 'objects/privacy_screen1.png');
    this.load.image('stretcher1', 'objects/stretcher1.png');
    this.load.image('water_cooler1', 'objects/water_cooler1.png');
    this.load.image('wheelchair1', 'objects/wheelchair1.png');
    this.load.image('oxygen_cylinder1', 'objects/oxygen_cylinder1.png');
    this.load.image('linen_cart1', 'objects/linen_cart1.png');
    this.load.image('chairs_stacked1', 'objects/chairs_stacked1.png');
    this.load.image('monitor_stand1', 'objects/monitor_stand1.png');
    this.load.image('bedside_locker1', 'objects/bedside_locker1.png');
    this.load.image('coffee_station1', 'objects/coffee_station1.png');
    this.load.image('first_aid_cabinet1', 'objects/first_aid_cabinet1.png');
    this.load.image('instrument_trolley1', 'objects/instrument_trolley1.png');
    this.load.image('step_stool1', 'objects/step_stool1.png');
    this.load.image('mop_bucket1', 'objects/mop_bucket1.png');
    this.load.image('fire_extinguisher1', 'objects/fire_extinguisher1.png');
    this.load.image('wet_floor_sign1', 'objects/wet_floor_sign1.png');
    this.load.image('sharps_bin1', 'objects/sharps_bin1.png');
    this.load.image('first_aid_kit1', 'objects/first_aid_kit1.png');
    this.load.image('sanitiser_dispenser1', 'objects/sanitiser_dispenser1.png');
    this.load.image('pedal_bin1', 'objects/pedal_bin1.png');
    this.load.image('clinical_waste_bin1', 'objects/clinical_waste_bin1.png');
    this.load.image('medicine_fridge1', 'objects/medicine_fridge1.png');
    this.load.image('rota_board1', 'objects/rota_board1.png');
    this.load.image('xray_lightbox1', 'objects/xray_lightbox1.png');
    this.load.image('fire_alarm_point1', 'objects/fire_alarm_point1.png');
    this.load.image('exit_sign1', 'objects/exit_sign1.png');
    this.load.image('binders1', 'objects/binders1.png');
    this.load.image('gloves_box1', 'objects/gloves_box1.png');
    this.load.image('clipboard_chart1', 'objects/clipboard_chart1.png');
    this.load.image('stethoscope1', 'objects/stethoscope1.png');
    this.load.image('kettle1', 'objects/kettle1.png');
    this.load.image('mugs_tray1', 'objects/mugs_tray1.png');
    this.load.image('test_tube_rack1', 'objects/test_tube_rack1.png');
    this.load.image('doctors_bag1', 'objects/doctors_bag1.png');
    this.load.image('bp_monitor1', 'objects/bp_monitor1.png');
    this.load.image('sanitiser_bottle1', 'objects/sanitiser_bottle1.png');
    this.load.image('eye_chart1', 'objects/eye_chart1.png');
    this.load.image('kitchen_counter_sink1', 'objects/kitchen_counter_sink1.png');
    this.load.image('undercounter_fridge1', 'objects/undercounter_fridge1.png');
    this.load.image('microwave1', 'objects/microwave1.png');
    this.load.image('hot_water_boiler1', 'objects/hot_water_boiler1.png');
    this.load.image('soap_dispenser1', 'objects/soap_dispenser1.png');
    this.load.image('notice_board1', 'objects/notice_board1.png');
    this.load.image('dirty_mugs1', 'objects/dirty_mugs1.png');
    this.load.image('yellow_bin1', 'objects/yellow_bin1.png');
    this.load.image('notes6', 'objects/notes6.png');
    this.load.image('directory_sign1', 'objects/directory_sign1.png');
    this.load.image('whiteboard1', 'objects/whiteboard1.png');
    this.load.image('whiteboard2', 'objects/whiteboard2.png');
    this.load.image('key_cabinet1', 'objects/key_cabinet1.png');
    this.load.image('plaque1', 'objects/plaque1.png');
    this.load.image('power_panel1', 'objects/power_panel1.png');
    this.load.image('health_poster1', 'objects/health_poster1.png');
    this.load.image('health_poster2', 'objects/health_poster2.png');
    this.load.image('health_poster3', 'objects/health_poster3.png');
    this.load.image('health_poster4', 'objects/health_poster4.png');
    this.load.image('health_poster5', 'objects/health_poster5.png');
    this.load.image('health_poster6', 'objects/health_poster6.png');
    this.load.image('leaflet_holder1', 'objects/leaflet_holder1.png');
    this.load.image('magazine_rack1', 'objects/magazine_rack1.png');
    this.load.image('magazine_rack2', 'objects/magazine_rack2.png');
    this.load.image('toy_box1', 'objects/toy_box1.png');
    this.load.image('wall_clock1', 'objects/wall_clock1.png');
    this.load.image('server_rack1', 'objects/server_rack1.png');
    this.load.image('server_rack2', 'objects/server_rack2.png');
    this.load.image('ups_cabinet1', 'objects/ups_cabinet1.png');
    this.load.image('aircon_unit1', 'objects/aircon_unit1.png');
    this.load.image('staff_lockers1', 'objects/staff_lockers1.png');
    this.load.image('clinical_sink1', 'objects/clinical_sink1.png');
    this.load.image('sideboard1', 'objects/sideboard1.png');
    this.load.image('bedhead_panel1', 'objects/bedhead_panel1.png');
    this.load.image('bedhead_panel2', 'objects/bedhead_panel2.png');
    this.load.image('ppe_dispenser1', 'objects/ppe_dispenser1.png');
    this.load.image('fire_action_notice1', 'objects/fire_action_notice1.png');
    this.load.image('comms_cabinet1', 'objects/comms_cabinet1.png');
    this.load.image('no_smoking_sign1', 'objects/no_smoking_sign1.png');
    this.load.image('bedhead_unit1', 'objects/bedhead_unit1.png');
    this.load.image('cylinder_rack1', 'objects/cylinder_rack1.png');
    this.load.image('suppression_cylinders1', 'objects/suppression_cylinders1.png');
    this.load.image('cleaning_trolley1', 'objects/cleaning_trolley1.png');
    this.load.image('suppression_panel1', 'objects/suppression_panel1.png');
    this.load.image('aed_cabinet1', 'objects/aed_cabinet1.png');
    this.load.image('cctv_camera1', 'objects/cctv_camera1.png');
    this.load.image('nurse_call_display1', 'objects/nurse_call_display1.png');
    this.load.image('filing_cabinet_steel1', 'objects/filing_cabinet_steel1.png');
    this.load.image('binder_shelves1', 'objects/binder_shelves1.png');
    this.load.image('kvm_cart1', 'objects/kvm_cart1.png');
    this.load.image('checkin_kiosk1', 'objects/checkin_kiosk1.png');
    this.load.image('drinks_vending1', 'objects/drinks_vending1.png');
    this.load.image('cctv_monitors1', 'objects/cctv_monitors1.png');
    this.load.image('info_screen1', 'objects/info_screen1.png');
    this.load.image('handwash_poster1', 'objects/handwash_poster1.png');
    this.load.image('photocopier1', 'objects/photocopier1.png');
    this.load.image('coat_stand1', 'objects/coat_stand1.png');
    this.load.image('dishwasher1', 'objects/dishwasher1.png');
    this.load.image('shredder1', 'objects/shredder1.png');
    this.load.image('filing_cabinet_locked1', 'objects/filing_cabinet_locked1.png');
    this.load.image('hospital_chair_north2', 'objects/hospital_chair_north2.png');
    this.load.image('pigeonholes1', 'objects/pigeonholes1.png');
    this.load.image('network_rack1', 'objects/network_rack1.png');
    this.load.image('storage_array1', 'objects/storage_array1.png');
    this.load.image('tape_library1', 'objects/tape_library1.png');
    this.load.image('patient_hoist1', 'objects/patient_hoist1.png');
    this.load.image('drug_trolley1', 'objects/drug_trolley1.png');
    this.load.image('bedside_cabinet_slim1', 'objects/bedside_cabinet_slim1.png');
    this.load.image('security_monitor1', 'objects/security_monitor1.png');
    this.load.image('cable_tray1', 'objects/cable_tray1.png');
    this.load.image('year_planner1', 'objects/year_planner1.png');
    this.load.image('conference_screen1', 'objects/conference_screen1.png');
    this.load.image('flip_chart1', 'objects/flip_chart1.png');
    this.load.image('supply_boxes1', 'objects/supply_boxes1.png');
    this.load.image('wall_rail1', 'objects/wall_rail1.png');
    this.load.image('it_workbench1', 'objects/it_workbench1.png');
    this.load.image('exec_desk1', 'objects/exec_desk1.png');
    this.load.image('radio_charger1', 'objects/radio_charger1.png');
    this.load.image('window_blinds1', 'objects/window_blinds1.png');
    this.load.image('cctv_monitors2', 'objects/cctv_monitors2.png');
    this.load.image('wall_rail2', 'objects/wall_rail2.png');
    this.load.image('checkin_kiosk_locked1', 'objects/checkin_kiosk_locked1.png');
    this.load.image('uni_crest_sign1', 'objects/uni_crest_sign1.png');
    this.load.image('projector_screen1', 'objects/projector_screen1.png');
    this.load.image('drop_box1', 'objects/drop_box1.png');
    this.load.image('uni_directory1', 'objects/uni_directory1.png');
    this.load.image('uni_doorcard1', 'objects/uni_doorcard1.png');
    this.load.image('uni_sign_library1', 'objects/uni_sign_library1.png');
    this.load.image('uni_sign_special1', 'objects/uni_sign_special1.png');
    this.load.image('uni_timetable1', 'objects/uni_timetable1.png');
    this.load.image('uni_poster1', 'objects/uni_poster1.png');
    this.load.image('uni_poster2', 'objects/uni_poster2.png');
    this.load.image('uni_poster3', 'objects/uni_poster3.png');
    this.load.image('uni_poster4', 'objects/uni_poster4.png');
    this.load.image('uni_poster6', 'objects/uni_poster6.png');
    this.load.image('uni_poster7', 'objects/uni_poster7.png');
    this.load.image('cryptosecure_banner1', 'objects/cryptosecure_banner1.png');
    this.load.image('student_lockers1', 'objects/student_lockers1.png');
    this.load.image('student_locker1', 'objects/student_locker1.png');
    this.load.image('lecture_ledge1', 'objects/lecture_ledge1.png');
    this.load.image('lecture_ledge2', 'objects/lecture_ledge2.png');
    this.load.image('alarm_panel2', 'objects/alarm_panel2.png');
    this.load.image('pegboard_tools1', 'objects/pegboard_tools1.png');
    this.load.image('lectern1', 'objects/lectern1.png');
    this.load.image('book_trolley1', 'objects/book_trolley1.png');
    this.load.image('scope_cart1', 'objects/scope_cart1.png');
    this.load.image('lecture_seat_row1', 'objects/lecture_seat_row1.png');
    this.load.image('component_drawers1', 'objects/component_drawers1.png');
    this.load.image('robot_arm1', 'objects/robot_arm1.png');
    this.load.image('beanbag1', 'objects/beanbag1.png');
    this.load.image('stanchions1', 'objects/stanchions1.png');
    this.load.image('bankers_lamp1', 'objects/bankers_lamp1.png');
    this.load.image('pi_cluster1', 'objects/pi_cluster1.png');
    this.load.image('journal_stack1', 'objects/journal_stack1.png');
    this.load.image('soldering_iron1', 'objects/soldering_iron1.png');
    this.load.image('beanbag_orange1', 'objects/beanbag_orange1.png');
    this.load.image('beanbag_teal1', 'objects/beanbag_teal1.png');
    this.load.image('uni_sign_staff1', 'objects/uni_sign_staff1.png');
    this.load.image('uni_tv1', 'objects/uni_tv1.png');
    this.load.image('uni_certificate1', 'objects/uni_certificate1.png');
    this.load.image('uni_portrait1', 'objects/uni_portrait1.png');
    this.load.image('uni_bunting1', 'objects/uni_bunting1.png');
    this.load.image('uni_bunting2', 'objects/uni_bunting2.png');
    this.load.image('smartscreen2', 'objects/smartscreen2.png');
    this.load.image('uni_fountain1', 'objects/uni_fountain1.png');
    this.load.image('uni_radiator1', 'objects/uni_radiator1.png');
    this.load.image('uni_firedoor_sign1', 'objects/uni_firedoor_sign1.png');
    this.load.image('uni_dartboard1', 'objects/uni_dartboard1.png');
    this.load.image('uni_sign_returns1', 'objects/uni_sign_returns1.png');
    this.load.image('uni_sign_study1', 'objects/uni_sign_study1.png');
    this.load.image('uni_banner_soc1', 'objects/uni_banner_soc1.png');
    this.load.image('study_carrels1', 'objects/study_carrels1.png');
    this.load.image('periodicals_rack1', 'objects/periodicals_rack1.png');
    this.load.image('balloons1', 'objects/balloons1.png');
    this.load.image('freshers_stall2', 'objects/freshers_stall2.png');
    this.load.image('display_case3', 'objects/display_case3.png');
    this.load.image('plan_chest2', 'objects/plan_chest2.png');
    this.load.image('printer_3d2', 'objects/printer_3d2.png');
    this.load.image('foosball_table2', 'objects/foosball_table2.png');
    this.load.image('laser_cutter2', 'objects/laser_cutter2.png');
    this.load.image('it_workbench2', 'objects/it_workbench2.png');
    this.load.image('electronics_bench2', 'objects/electronics_bench2.png');
    this.load.image('cnc_mill2', 'objects/cnc_mill2.png');
    this.load.image('uni_sofa2', 'objects/uni_sofa2.png');
    this.load.image('uni_poster8', 'objects/uni_poster8.png');
    this.load.image('backup_recovery',         'objects/backup_recovery.png');
    this.load.image('dual_auth',               'objects/dual_auth.png');
    this.load.image('ehr-terminal',            'objects/ehr-terminal.png');
    this.load.image('network-segmentation-map','objects/network-segmentation-map.png');
    this.load.image('command_board',           'objects/command_board.png');
    this.load.image('siem_dashboard',          'objects/siem_dashboard.png');
    this.load.image('vpn_log_terminal',        'objects/vpn_log_terminal.png');
    this.load.image('drug_library_terminal',   'objects/drug_library_terminal.png');
    this.load.image('forensic_data_platform',  'objects/forensic_data_platform.png');
    this.load.image('coverage_decision_form',  'objects/coverage_decision_form.png');
    this.load.image('ncsc_brief',              'objects/ncsc_brief.png');

    
    // Laptops
    this.load.image('laptop7', 'objects/laptop7.png');
    this.load.image('laptop6', 'objects/laptop6.png');
    this.load.image('laptop5', 'objects/laptop5.png');
    this.load.image('laptop4', 'objects/laptop4.png');
    this.load.image('laptop3', 'objects/laptop3.png');
    this.load.image('laptop2', 'objects/laptop2.png');
    this.load.image('laptop1', 'objects/laptop1.png');
    
    // Chalkboards and bookcases
    this.load.image('chalkboard3', 'objects/chalkboard3.png');
    this.load.image('chalkboard2', 'objects/chalkboard2.png');
    this.load.image('chalkboard', 'objects/chalkboard.png');
    this.load.image('bookcase', 'objects/bookcase.png');
    
    // Spooky basement items
    this.load.image('spooky-splatter', 'objects/spooky-splatter.png');
    this.load.image('spooky-candles2', 'objects/spooky-candles2.png');
    this.load.image('spooky-candles', 'objects/spooky-candles.png');
    this.load.image('torch-left', 'objects/torch-left.png');
    this.load.image('torch-right', 'objects/torch-right.png');
    this.load.image('torch-1', 'objects/torch-1.png');

    // Load legacy character sprite sheets (64x64, frame-based)
    this.load.spritesheet('hacker', 'characters/hacker.png', {
        frameWidth: 64,
        frameHeight: 64
    });

    this.load.spritesheet('hacker-red', 'characters/hacker-red.png', {
        frameWidth: 64,
        frameHeight: 64
    });

    // Character atlases (80x80, atlas-based) are not listed here. Only the ones the
    // scenario uses are loaded: see queueCharacterAtlases below and
    // systems/character-textures.js. Each costs about 7 MB of texture memory.
    if (window.breakEscapeConfig?.playerSprite) {
        queueCharacterAtlases(this, [window.breakEscapeConfig.playerSprite]);
    }

    // Animated plant textures are loaded above
    
    // Load swivel chair rotation images
    this.load.image('chair-exec-rotate1', 'objects/chair-exec-rotate1.png');
    this.load.image('chair-exec-rotate2', 'objects/chair-exec-rotate2.png');
    this.load.image('chair-exec-rotate3', 'objects/chair-exec-rotate3.png');
    this.load.image('chair-exec-rotate4', 'objects/chair-exec-rotate4.png');
    this.load.image('chair-exec-rotate5', 'objects/chair-exec-rotate5.png');
    this.load.image('chair-exec-rotate6', 'objects/chair-exec-rotate6.png');
    this.load.image('chair-exec-rotate7', 'objects/chair-exec-rotate7.png');
    this.load.image('chair-exec-rotate8', 'objects/chair-exec-rotate8.png');
    
    // Load white chair rotation images
    this.load.image('chair-white-1-rotate1', 'objects/chair-white-1-rotate1.png');
    this.load.image('chair-white-1-rotate2', 'objects/chair-white-1-rotate2.png');
    this.load.image('chair-white-1-rotate3', 'objects/chair-white-1-rotate3.png');
    this.load.image('chair-white-1-rotate4', 'objects/chair-white-1-rotate4.png');
    this.load.image('chair-white-1-rotate5', 'objects/chair-white-1-rotate5.png');
    this.load.image('chair-white-1-rotate6', 'objects/chair-white-1-rotate6.png');
    this.load.image('chair-white-1-rotate7', 'objects/chair-white-1-rotate7.png');
    this.load.image('chair-white-1-rotate8', 'objects/chair-white-1-rotate8.png');
    
    this.load.image('chair-white-2-rotate1', 'objects/chair-white-2-rotate1.png');
    this.load.image('chair-white-2-rotate2', 'objects/chair-white-2-rotate2.png');
    this.load.image('chair-white-2-rotate3', 'objects/chair-white-2-rotate3.png');
    this.load.image('chair-white-2-rotate4', 'objects/chair-white-2-rotate4.png');
    this.load.image('chair-white-2-rotate5', 'objects/chair-white-2-rotate5.png');
    this.load.image('chair-white-2-rotate6', 'objects/chair-white-2-rotate6.png');
    this.load.image('chair-white-2-rotate7', 'objects/chair-white-2-rotate7.png');
    this.load.image('chair-white-2-rotate8', 'objects/chair-white-2-rotate8.png');

    // Load audio files
    // NPC system sounds
    this.load.audio('message_received', 'sounds/message_received.mp3');
    this.load.audio('phone_vibrate', 'sounds/phone_vibrate.mp3');
    this.load.audio('page_turn', 'sounds/page_turn.mp3');
    this.load.audio('message_sent', 'sounds/message_sent.mp3');
    this.load.audio('heartbeat', 'sounds/heartbeat.mp3');
    this.load.audio('footsteps', 'sounds/footsteps.mp3');
    this.load.audio('drawer_open', 'sounds/drawer_open.mp3');
    this.load.audio('rfid_unlock', 'sounds/rfid_unlock.mp3');
    
    // Initialize sound manager and preload all sounds
    // Store as window property so we can access it later in create()
    window.soundManagerPreload = new SoundManager(this);
    window.soundManagerPreload.preloadSounds();

    // Queue the scenario's character atlases as soon as its JSON arrives. Files added
    // while the loader is running join the same pass, so create() waits for them.
    this.load.once('filecomplete-json-gameScenarioJSON', (key, type, scenario) => {
        queueCharacterAtlases(this, collectCharacterSprites(scenario || this.cache.json.get('gameScenarioJSON')));
    });

    // Load scenario from Rails API endpoint if available, otherwise try URL parameter
    if (window.breakEscapeConfig?.apiBasePath) {
        // Load scenario from Rails API endpoint (returns filtered scenario for security)
        // Use absolute URL with origin to prevent Phaser baseURL from interfering
        const scenarioUrl = `${window.location.origin}${window.breakEscapeConfig.apiBasePath}/scenario`;
        this.load.json('gameScenarioJSON', scenarioUrl);
    } else {
        // Fallback to old behavior for standalone HTML files
        const urlParams = new URLSearchParams(window.location.search);
        let scenarioFile = urlParams.get('scenario') || 'scenarios/ceo_exfil.json';
        
        // Ensure scenario file has proper path prefix
        if (!scenarioFile.startsWith('scenarios/')) {
            scenarioFile = `scenarios/${scenarioFile}`;
        }
        
        // Ensure .json extension
        if (!scenarioFile.endsWith('.json')) {
            scenarioFile = `${scenarioFile}.json`;
        }
        
        // Add cache buster query parameter to prevent browser caching
        scenarioFile = `${scenarioFile}${scenarioFile.includes('?') ? '&' : '?'}v=${Date.now()}`;
        
        // Load the specified scenario
        this.load.json('gameScenarioJSON', scenarioFile);
    }
}


// Create function - sets up the game world and initializes all systems
export async function create() {
    // Hide loading text
    document.getElementById('loading').style.display = 'none';

    // Set game instance for interactions module early
    setGameInstance(this);

    // NPC lazy loading uses the scene to load any character atlas the boot list missed
    window.npcLazyLoader?.setScene(this);

    // Ensure gameScenario is loaded before proceeding
    if (!window.gameScenario) {
        window.gameScenario = this.cache.json.get('gameScenarioJSON');
    }
    gameScenario = window.gameScenario;
    
    console.log('🔍 Raw gameScenario loaded from cache:', gameScenario);
    if (gameScenario?.npcs && gameScenario.npcs.length > 0) {
        console.log('🔍 First NPC in loaded scenario:', gameScenario.npcs[0]);
        console.log('🔍 First NPC spriteTalk property:', gameScenario.npcs[0].spriteTalk);
    }
    
    // Safety check: if gameScenario is still not loaded, log error
    if (!gameScenario) {
        console.error('❌ ERROR: gameScenario failed to load. Check scenario file path.');
        console.error('   Scenario URL parameter may be incorrect.');
        console.error('   Use: scenario_select.html or direct scenario path');
        return;
    }
    
    // Initialize global narrative variables from scenario defaults
    if (gameScenario.globalVariables) {
        window.gameState.globalVariables = { ...gameScenario.globalVariables };
        console.log('🌐 Initialized global variables from scenario:', window.gameState.globalVariables);
    } else {
        window.gameState.globalVariables = {};
    }

    // Merge in server-saved global variables (from a resumed session).
    // Saved values take precedence over scenario defaults so that persistent
    // flags (e.g. briefing_played) survive page reloads.
    if (gameScenario.savedGlobalVariables && typeof gameScenario.savedGlobalVariables === 'object') {
        Object.assign(window.gameState.globalVariables, gameScenario.savedGlobalVariables);
        console.log('🌐 Merged saved global variables from server:', gameScenario.savedGlobalVariables);
    }
    
    // Restore saved notes from a previous session (includes player observations).
    // Deduplicate by id so notes added this session aren't lost if restore races with addNote.
    if (gameScenario.savedNotes && Array.isArray(gameScenario.savedNotes) && gameScenario.savedNotes.length > 0) {
        const existing = window.gameState.notes || [];
        const existingIds = new Set(existing.map(n => String(n.id)));
        for (const note of gameScenario.savedNotes) {
            if (!existingIds.has(String(note.id))) {
                existing.push(note);
                existingIds.add(String(note.id));
            }
        }
        window.gameState.notes = existing;
        console.log(`📝 Restored ${gameScenario.savedNotes.length} note(s) from server`);
    }

    // Restore lifted fingerprints (best per owner) so the reader has them after a reload.
    window.restoreBiometricSamples?.(gameScenario.savedBiometricSamples);

    // Restore NPC-local ink variables (met_x, first_meeting, ...) so an NPC's
    // next conversation restarts at its start knot with them set, the same as
    // re-talking without a reload. Inert until the manager provides the method.
    if (gameScenario.savedNpcInkVariables) {
        window.npcConversationStateManager?.importNpcInkVariables?.(gameScenario.savedNpcInkVariables);
    }

    // Restore which onceOnly / maxTriggers eventMapping handlers already fired, so a
    // reload doesn't replay one-shot cutscenes, barks and messages. Must run before
    // game_loaded, the first event mappings can react to.
    if (gameScenario.savedTriggeredEvents) {
        window.npcManager?.restoreTriggeredEvents?.(gameScenario.savedTriggeredEvents);
    }

    // Timed texts that were counting down at the last sync, and NPC-level timed
    // texts already delivered, so a reload neither loses nor repeats them (E12).
    if (gameScenario.savedTimedMessages) {
        window.npcManager?.restoreTimedMessages?.(gameScenario.savedTimedMessages);
    }

    // NPCs revealed or hidden by setVisible (eventMappings) before a reload. Applied when
    // each NPC registers, over behavior.initiallyHidden, since a onceOnly reveal doesn't
    // replay (N2).
    if (gameScenario.savedNpcVisibility) {
        window.npcManager?.restoreNpcVisibility?.(gameScenario.savedNpcVisibility);
    }

    // Game time: resumes from the elapsed time saved at the last sync, so scenario timers
    // don't restart on a reload (D14). Also the optional in-game clock (scenario.gameClock).
    window.gameClock = new GameClock({
        config: gameScenario.gameClock || null,
        saved: gameScenario.savedScenarioClock || null
    });

    // Scenarios with a command board (the server sends its config as commandBoard): record
    // its entries from game start, each stamped with the game time it happened, even while
    // the board is closed or its room isn't loaded. Anything true now but not yet recorded
    // (a save from before this, or a change after the last sync) is stamped now.
    window.commandBoardRecorder?.detach?.();
    window.commandBoardRecorder = null;
    if (gameScenario.commandBoard) {
        const clock = window.gameClock;
        window.commandBoardRecorder = new CommandBoardRecorder({
            config: gameScenario.commandBoard,
            saved: gameScenario.savedCommandBoardLog || [],
            initialGlobals: gameScenario.globalVariables || {},
            now: () => clock.elapsedMs()
        });
        window.commandBoardRecorder.reconcile(window.gameState.globalVariables);
        window.commandBoardRecorder.attach(window.eventDispatcher, () => window.gameState.globalVariables);
    }

    // Phone threads (texts, read state, story position). Applied to each contact as
    // it registers, which for phone NPCs is the starting room's NPC load below (E9).
    if (gameScenario.savedPhoneState) {
        window.npcManager?.restorePhoneState?.(gameScenario.savedPhoneState);
    }

    // Restore objectives state from server if available (passed via objectivesState)
    if (gameScenario.objectivesState) {
        window.gameState.objectives = gameScenario.objectivesState;
        console.log('📋 Restored objectives state from server');
    }
    
    // Restore submitted flags from server if available (for flag-station minigame)
    if (gameScenario.submittedFlags) {
        window.gameState.submittedFlags = gameScenario.submittedFlags;
        console.log('🏁 Restored submitted flags from server:', window.gameState.submittedFlags);
    } else {
        window.gameState.submittedFlags = [];
    }
    
    // Initialize objectives system AFTER scenario is loaded
    // This must happen in create() because gameScenario isn't available until now
    if (gameScenario.objectives && window.objectivesManager) {
        console.log('📋 Initializing objectives from scenario...');
        window.objectivesManager.initialize(gameScenario.objectives);
        
        // Create UI panel (dynamically import to avoid circular dependencies)
        import('../ui/objectives-panel.js').then(module => {
            window.objectivesPanel = new module.ObjectivesPanel(window.objectivesManager);
            console.log('✅ Objectives panel created');
        }).catch(err => {
            console.error('Failed to load objectives panel:', err);
        });
    }
    
    // Debug: log what we loaded
    console.log('🎮 Loaded gameScenario with rooms:', Object.keys(gameScenario?.rooms || {}));
    if (gameScenario?.rooms?.office1) {
        console.log('office1 room data:', gameScenario.rooms.office1);
    }

    // Calculate world bounds after scenario is loaded
    const worldBounds = calculateWorldBounds(this);
    
    // Set the physics world bounds
    this.physics.world.setBounds(
        worldBounds.x, 
        worldBounds.y, 
        worldBounds.width, 
        worldBounds.height
    );

    // The player atlas is normally queued in preload. In standalone mode (no
    // breakEscapeConfig) or if the scenario omits it, load it now.
    await ensureCharacterTexture(this,
        window.breakEscapeConfig?.playerSprite || window.gameScenario?.player?.spriteSheet || 'male_hacker_hood_v2');

    // Create player first like in original
    createPlayer(this);

    // Store player globally for access from other modules
    window.player = player;
    
    // Register player in global character registry for speaker resolution
    if (window.characterRegistry && window.player) {
        const playerData = {
            id: 'player',
            displayName: window.gameState?.playerName || window.gameScenario?.player?.displayName || 'Agent 0x00',
            spriteSheet: window.breakEscapeConfig?.playerSprite || window.gameScenario?.player?.spriteSheet || 'male_hacker_hood_v2',
            spriteTalk: (() => {
                const sprite = window.breakEscapeConfig?.playerSprite || window.gameScenario?.player?.spriteSheet || 'male_hacker_hood_v2';
                // Use the scenario's configured player.spriteTalk when it belongs to the played sprite
                // (the player's chosen sprite overrides the scenario's, and old scenarios carry a stale
                // default talk image, so a file for a different character is ignored)
                const configuredTalk = window.gameScenario?.player?.spriteTalk;
                if (configuredTalk) {
                    const stem = (configuredTalk.split('/').pop() || '').replace(/\.\w+$/, '').replace(/[_-]talk$/, '');
                    if (stem && stem === sprite.replace(/_v2$/, '')) return configuredTalk;
                }
                // Legacy sprites use hyphen naming; all others follow {sprite}_talk.png convention
                const legacyMap = { 'hacker': 'assets/characters/hacker-talk.png', 'hacker-red': 'assets/characters/hacker-red-talk.png' };
                return legacyMap[sprite] || `assets/characters/${sprite}_talk.png`;
            })(),
            metadata: {}
        };
        window.characterRegistry.setPlayer(playerData);
    }
    
    // Create door opening animation (for N/S doors)
    this.anims.create({
        key: 'door_open',
        frames: this.anims.generateFrameNumbers('door_sheet', { start: 0, end: 4 }),
        frameRate: 8,
        repeat: 0
    });

    // Create door top animation (6th frame)
    this.anims.create({
        key: 'door_top',
        frames: [{ key: 'door_sheet', frame: 5 }],
        frameRate: 1,
        repeat: 0
    });

    // Create side door opening animation (for E/W doors) - frames 2-5 (1-indexed) = frames 1-4 (0-indexed)
    this.anims.create({
        key: 'door_side_open',
        frames: this.anims.generateFrameNumbers('door_side_sheet_32', { start: 1, end: 4 }),
        frameRate: 8,
        repeat: 0
    });
    
    // Create plant bump animations
    this.anims.create({
        key: 'plant-large11-bump',
        frames: [
            { key: 'plant-large11-top-ani1' },
            { key: 'plant-large11-top-ani2' },
            { key: 'plant-large11-top-ani3' },
            { key: 'plant-large11-top-ani4' }
        ],
        frameRate: 8,
        repeat: 0
    });
    
    this.anims.create({
        key: 'plant-large12-bump',
        frames: [
            { key: 'plant-large12-top-ani1' },
            { key: 'plant-large12-top-ani2' },
            { key: 'plant-large12-top-ani3' },
            { key: 'plant-large12-top-ani4' },
            { key: 'plant-large12-top-ani5' }
        ],
        frameRate: 8,
        repeat: 0
    });
    
    this.anims.create({
        key: 'plant-large13-bump',
        frames: [
            { key: 'plant-large13-top-ani1' },
            { key: 'plant-large13-top-ani2' },
            { key: 'plant-large13-top-ani3' },
            { key: 'plant-large13-top-ani4' }
        ],
        frameRate: 8,
        repeat: 0
    });
    
    // Initialize rooms system after player exists
    initializeRooms(this);

    // Room lighting (only when the scenario opts in); before the first room is created
    initLighting(this, window.gameScenario);

    // Initialize NPC Behavior Manager (async lazy loading)
    if (window.npcManager) {
        import('../systems/npc-behavior.js')
            .then(module => {
                window.npcBehaviorManager = new module.NPCBehaviorManager(this, window.npcManager);
                console.log('✅ NPC Behavior Manager initialized');
                // NOTE: Individual behaviors registered per-room in rooms.js createNPCSpritesForRoom()
                // That skips NPCs whose sprites were created before this import finished
                // (the start room can win the race), so register those now.
                const mgr = window.npcBehaviorManager;
                for (const roomData of Object.values(window.rooms || {})) {
                    for (const sprite of roomData?.npcSprites || []) {
                        const id = sprite?.npcId;
                        if (!id || mgr.behaviors.has(id) || !sprite.active) continue;
                        const npc = window.npcManager.getNPC(id);
                        mgr.registerBehavior(id, sprite, npc?.behavior || {});
                    }
                }
            })
            .catch(error => {
                console.error('❌ Failed to initialize NPC Behavior Manager:', error);
            });
    }

    // Initialize combat systems
    COMBAT_CONFIG.validate();
    window.playerHealth = initPlayerHealth();
    window.npcHostileSystem = initNPCHostileSystem();
    // NPCs that turned hostile or were knocked out before a reload (E-B), before
    // any room's NPCs load; each behavior announces its restored hostility.
    if (gameScenario?.savedNpcHostility) {
        window.npcHostileSystem.restoreHostility(gameScenario.savedNpcHostility);
    }
    window.npcCombat = new NPCCombat(this);

    // Initialize feedback systems
    window.damageNumbers = new DamageNumbersSystem(this);
    window.screenEffects = new ScreenEffectsSystem(this);
    window.spriteEffects = new SpriteEffectsSystem(this);
    window.attackTelegraph = new AttackTelegraphSystem(this);

    // Initialize UI systems
    window.healthUI = new HealthUI();
    window.npcHealthBars = new NPCHealthBars(this);
    window.gameOverScreen = new GameOverScreen();
    
    initCombatDebug();
    console.log('✅ Combat systems ready');

    // Load starting room via API endpoint
    const roomPositions = calculateRoomPositions(this);
    const startRoomId = gameScenario.startRoom;
    const startingRoomPosition = roomPositions[startRoomId];
    
    if (!startingRoomPosition) {
        console.error('Failed to get starting room position');
        return;
    }
    
    try {
        // Fetch starting room data from API endpoint
        const gameId = window.breakEscapeConfig?.gameId;
        if (!gameId) {
            console.error('Game ID not available in breakEscapeConfig');
            return;
        }
        
        console.log(`Loading starting room ${startRoomId} from API...`);
        const response = await fetch(`/break_escape/games/${gameId}/room/${startRoomId}`);
        
        if (!response.ok) {
            console.error(`Failed to load starting room: ${response.status} ${response.statusText}`);
            return;
        }
        
        const data = await response.json();
        const startingRoomData = data.room;
        
        if (!startingRoomData) {
            console.error('No room data returned for starting room');
            return;
        }
        
        console.log(`✅ Received starting room data from API`);
        
        // Load NPCs for starting room BEFORE creating room visuals
        // This ensures phone NPCs are registered before processInitialInventoryItems() is called
        if (window.npcLazyLoader && startingRoomData) {
            try {
                await window.npcLazyLoader.loadNPCsForRoom(startRoomId, startingRoomData);
                console.log(`✅ Loaded NPCs for starting room: ${startRoomId}`);
            } catch (error) {
                console.error(`Failed to load NPCs for starting room ${startRoomId}:`, error);
                // Continue with room creation even if NPC loading fails
            }
        }
        
        createRoom(startRoomId, startingRoomData, startingRoomPosition);
        revealRoom(startRoomId);
    } catch (error) {
        console.error('Error loading starting room:', error);
        return;
    }
    
    // Position player in the starting room
    const startingRoom = rooms[gameScenario.startRoom];
    if (startingRoom) {
        let playerX, playerY;
        if (gameScenario.startPosition) {
            playerX = startingRoom.position.x + gameScenario.startPosition.x * TILE_SIZE;
            playerY = startingRoom.position.y + gameScenario.startPosition.y * TILE_SIZE;
        } else {
            playerX = startingRoom.position.x + 160; // Room width / 2 (320/2)
            playerY = startingRoom.position.y + 144; // Room height / 2 (288/2)
        }
        player.setPosition(playerX, playerY);
        console.log(`Player positioned at (${playerX}, ${playerY}) in starting room ${gameScenario.startRoom}`);
    }
    
    // Set up camera to follow player
    this.cameras.main.startFollow(player);
    
    // Door interactions are now handled by the door sprites themselves
    
    // Initialize pathfinder
    initializePathfinder(this);
    
    // Set up input handling
    this.input.on('pointerdown', (pointer) => {
        // Check if a minigame is currently running - if so, don't process main game clicks
        if (window.MinigameFramework && window.MinigameFramework.currentMinigame) {
            console.log('Minigame is running, ignoring main game click', {
                currentMinigame: window.MinigameFramework.currentMinigame,
                minigameType: window.MinigameFramework.currentMinigame.constructor.name
            });
            return;
        }
        
        // Convert screen coordinates to world coordinates
        const worldX = this.cameras.main.scrollX + pointer.x;
        const worldY = this.cameras.main.scrollY + pointer.y;
        
        // Check interaction mode - if in punch mode (jab or cross), just punch in the direction of click
        if (window.playerCombat) {
            const currentMode = window.playerCombat.getInteractionMode();
            if (currentMode === 'jab' || currentMode === 'cross') {
                // Calculate direction from player to click point
                const player = window.player;
                if (player) {
                    const dx = worldX - player.x;
                    const dy = worldY - player.y;
                    
                    // Calculate direction using same logic as NPCs
                    const absVX = Math.abs(dx);
                    const absVY = Math.abs(dy);
                    
                    let direction;
                    // Threshold: if one axis is > 2x the other, consider it pure cardinal
                    if (absVX > absVY * 2) {
                        direction = dx > 0 ? 'right' : 'left';
                    } else if (absVY > absVX * 2) {
                        direction = dy > 0 ? 'down' : 'up';
                    } else {
                        // Diagonal
                        if (dy > 0) {
                            direction = dx > 0 ? 'down-right' : 'down-left';
                        } else {
                            direction = dx > 0 ? 'up-right' : 'up-left';
                        }
                    }
                    
                    // Update player facing direction
                    player.lastDirection = direction;
                    
                    // Trigger punch animation (don't move)
                    window.playerCombat.punch();
                    if (window.getTutorialManager) window.getTutorialManager().notifyAttackedInCombatMode();
                }
                return; // Exit early - no movement or interaction in punch modes
            }
        }
        
        // A menu is already open — this tap is meant to dismiss it. Consume it so
        // it doesn't also move the player / trigger another interaction.
        if (isInteractionMenuOpen()) {
            closeInteractionMenu();
            return;
        }

        // If the tap lands near several interactable entities that are all within
        // reach (e.g. a memo lying right next to an NPC), don't guess — show a
        // disambiguation menu listing each by its observation text. This fixes the
        // "can't pick up items next to characters" problem, especially on touch.
        const nearbyInteractables = gatherInteractablesNearClick(worldX, worldY);
        if (nearbyInteractables.length > 1) {
            const nativeEvent = pointer.event || {};
            showInteractionMenu(nearbyInteractables, nativeEvent.clientX, nativeEvent.clientY);
            return;
        }
        // Exactly one in-reach interactable near the tap — act on it directly using
        // the same tap-slop tolerance as the menu, so the player doesn't have to land
        // the tap precisely on a small item to interact with it.
        if (nearbyInteractables.length === 1) {
            nearbyInteractables[0].onSelect();
            return;
        }

        // Check for NPC sprites at the clicked position first
        const npcAtPosition = findNPCAtPosition(worldX, worldY);
        if (npcAtPosition) {
            if (isObjectInInteractionRange(npcAtPosition)) {
                // NPC is in range - face toward them then interact.
                facePlayerToward(npcAtPosition.x, npcAtPosition.y);
                if (window.getTutorialManager) window.getTutorialManager().notifyPlayerInteracted();
                if (window.tryInteractWithNPC) {
                    window.tryInteractWithNPC(npcAtPosition);
                }
            } else {
                // NPC is out of range - move toward them, stopping just short.
                const spriteCenterToBottom = npcAtPosition.height * (1 - (npcAtPosition.originY || 0.5));
                const paddingOffset = npcAtPosition.isAtlas ? SPRITE_PADDING_BOTTOM_ATLAS : SPRITE_PADDING_BOTTOM_LEGACY;
                const npcBottomY = npcAtPosition.y + spriteCenterToBottom - paddingOffset;
                const dx = npcAtPosition.x - player.x;
                const dy = npcBottomY - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    const stopShortOffset = TILE_SIZE * 0.75;
                    const normalizedDx = dx / distance;
                    const normalizedDy = dy / distance;
                    movePlayerToPoint(npcAtPosition.x - normalizedDx * stopShortOffset,
                                      npcBottomY - normalizedDy * stopShortOffset);
                }
            }
            return;
        }
        
        // Check for objects at the clicked position
        const objectsAtPosition = findObjectsAtPosition(worldX, worldY);
        
        if (objectsAtPosition.length > 0) {
            const player = window.player;
            if (player) {
                for (const obj of objectsAtPosition) {
                    if (obj.interactable && window.handleObjectInteraction) {
                        if (isObjectInInteractionRange(obj)) {
                            // Object is in range - face toward it then interact directly.
                            // Click always targets the clicked object; no direction-based selection.
                            facePlayerToward(obj.x, obj.y);
                            if (window.getTutorialManager) window.getTutorialManager().notifyPlayerInteracted();
                            window.handleObjectInteraction(obj);
                        } else if (obj.isSwivelChair) {
                            // Chairs: move onto the clicked position (player sits/stands at the chair).
                            movePlayerToPoint(worldX, worldY);
                        } else {
                            // Object is out of range - walk until it's within reach.
                            // Reach is measured from the sprite centre (player.x/y) to obj.x/y
                            // (isObjectInInteractionRange), but movePlayerToPoint steers the
                            // feet (body centre, ~31px lower). Aim so the sprite centre ends
                            // half a reach from that point, then convert to a feet target;
                            // stopping 3/4 tile short of the object's base could leave the
                            // player just outside reach, where further taps did nothing.
                            const dx = obj.x - player.x;
                            const dy = obj.y - player.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance > 0) {
                                const stopShort = INTERACTION_RANGE / 2;
                                const centreX = obj.x - (dx / distance) * stopShort;
                                const centreY = obj.y - (dy / distance) * stopShort;
                                const footDx = player.body ? player.body.center.x - player.x : 0;
                                const footDy = player.body ? player.body.center.y - player.y : 0;
                                let target = { x: centreX + footDx, y: centreY + footDy };
                                // The straight-line aim can fall inside a wall or furniture (a
                                // noticeboard high on the back wall), and the pathfinder's snap
                                // to the nearest free cell may then leave the player just out of
                                // reach. Try stand points around the object and keep the one that
                                // ends in reach with the shortest walk.
                                const pfm = window.pathfindingManager;
                                if (pfm?.findNearestWalkableWorldCell) {
                                    const reachAfter = (p) => Math.hypot(p.x - footDx - obj.x, p.y - footDy - obj.y);
                                    const walk = (p) => Math.hypot(p.x - (player.x + footDx), p.y - (player.y + footDy));
                                    const aimed = pfm.findNearestWalkableWorldCell(target.x, target.y);
                                    if (!aimed || reachAfter(aimed) > INTERACTION_RANGE - 4) {
                                        let best = aimed, bestReach = aimed ? reachAfter(aimed) : Infinity, bestWalk = aimed ? walk(aimed) : Infinity;
                                        for (let a = 0; a < 16; a++) {
                                            const ang = (a / 16) * Math.PI * 2;
                                            for (const r of [8, 16, 24]) {
                                                const c = pfm.findNearestWalkableWorldCell(
                                                    obj.x + Math.cos(ang) * r + footDx, obj.y + Math.sin(ang) * r + footDy, 3);
                                                if (!c) continue;
                                                const ra = reachAfter(c), wk = walk(c);
                                                const ok = ra <= INTERACTION_RANGE - 4, bestOk = bestReach <= INTERACTION_RANGE - 4;
                                                if ((ok && (!bestOk || wk < bestWalk)) || (!ok && !bestOk && ra < bestReach)) {
                                                    best = c; bestReach = ra; bestWalk = wk;
                                                }
                                            }
                                        }
                                        if (best) target = best;
                                    }
                                }
                                movePlayerToPoint(target.x, target.y);
                            }
                        }
                        return; // Handled (either interact or move)
                    }
                }
            }
        }
        
        // Check for door sprites at the clicked position.
        // Doors are not in room.objects, so they fall through the object check above and
        // would otherwise cause the player to walk straight into the wall.
        const doorAtPosition = findDoorAtPosition(worldX, worldY);
        if (doorAtPosition) {
            const player = window.player;
            if (player) {
                const distance = Phaser.Math.Distance.Between(
                    player.x, player.y,
                    doorAtPosition.x, doorAtPosition.y
                );

                if (distance > DOOR_INTERACTION_RANGE) {
                    // Out of range — navigate to the nearest free tile on the player's
                    // side of the door rather than using a generic player→door vector.
                    // For N/S doors the wall is horizontal, so we offset vertically;
                    // for E/W doors the wall is vertical, so we offset horizontally.
                    const dir = doorAtPosition.doorProperties.direction;
                    let targetX, targetY;
                    if (dir === 'north' || dir === 'south') {
                        // Stop one tile from the bottom edge of the door (the interaction face).
                        // The sprite uses center-origin so bottom edge = y + TILE_SIZE/2.
                        // From the south: one tile below the bottom edge.
                        // From the north: one tile above the bottom edge (middle of sprite).
                        targetX = doorAtPosition.x;
                        targetY = player.y < doorAtPosition.y
                            ? doorAtPosition.y - TILE_SIZE / 2   // player is north of door
                            : doorAtPosition.y + TILE_SIZE;      // player is south of door
                    } else {
                        // E/W door: stop one tile to the player's X-side
                        targetX = player.x < doorAtPosition.x
                            ? doorAtPosition.x - TILE_SIZE   // player is west of door
                            : doorAtPosition.x + TILE_SIZE;  // player is east of door
                        targetY = doorAtPosition.y;
                    }
                    movePlayerToPoint(targetX, targetY);
                }
                // In-range case: the door zone already fired handleDoorInteraction — no action needed.
                return;
            }
        }

        // Check if player movement should be prevented (e.g., clicking on interactable items)
        if (window.preventPlayerMovement) {
            return;
        }
        
        // No interactable objects found or player out of range - allow movement.
        // Begin hold-to-walk tracking: if the button stays held, the player will
        // continuously walk toward the live cursor position (see updateHoldWalk).
        movePlayerToPoint(worldX, worldY);
        startHoldWalk();
    });

    // Releasing the press ends continuous hold-to-walk. pointerupoutside covers
    // the case where the release happens off-canvas.
    this.input.on('pointerup', () => stopHoldWalk());
    this.input.on('pointerupoutside', () => stopHoldWalk());
    
    // Initialize inventory
    initializeInventory();
    
    // Process initial inventory items
    processInitialInventoryItems();
    
    // Initialize HUD with interaction mode toggle AFTER inventory is ready
    window.playerHUD = createPlayerHUD(this);
    window.playerHUD.create();
    createInfoLabel();
    
    // Initialize sound manager - reuse the instance created in preload()
    if (window.soundManagerPreload) {
        // Reuse the sound manager that was created in preload
        window.soundManagerPreload.initializeSounds();
        window.soundManager = window.soundManagerPreload;
        delete window.soundManagerPreload; // Clean up temporary reference
    } else {
        // Fallback in case preload didn't run properly
        const soundManager = new SoundManager(this);
        soundManager.preloadSounds();
        soundManager.initializeSounds();
        window.soundManager = soundManager;
    }
    console.log('🔊 Sound Manager initialized');
    
    // Show introduction
    introduceScenario();

    // Check if tutorial should be shown
    checkAndShowTutorial();

    // Initialize physics debug display (visual debug off by default)
    if (window.initializePhysicsDebugDisplay) {
        window.initializePhysicsDebugDisplay();
    }

    // Wire scenario-defined music events before emitting game_loaded so that
    // e.g. the 'game_loaded' → 'cutscene' playlist trigger is already registered.
    if (gameScenario?.music) {
        initScenarioMusicEvents(gameScenario);
    }

    // Emit game_loaded event to trigger event-based timed conversations/messages
    if (window.eventDispatcher) {
        window.eventDispatcher.emit('game_loaded', {
            timestamp: Date.now(),
            startRoom: gameScenario.startRoom
        });
        console.log('📢 Emitted game_loaded event');
    }

    // [Phase 5] Initialize scenario timer UI (countdown widget for event timers)
    if (gameScenario?.timers && gameScenario.timers.length > 0) {
        window.scenarioTimerUI = new ScenarioTimerUI(this, gameScenario);
        console.log(`⏱️ Scenario timer UI initialized with ${gameScenario.timers.length} timer(s)`);
    } else if (ScenarioTimerUI) {
        // Even if no timers in scenario, create UI (will hide until timers are added)
        window.scenarioTimerUI = new ScenarioTimerUI(this, { timers: [] });
    }

    // [Phase 5] Initialize scenario timer dispatcher (fires timers and dispatches events)
    if (gameScenario?.timers && gameScenario.timers.length > 0) {
        // Resumes from its own saved elapsed time (normally the game clock's); a new game
        // starts with the game clock
        const savedTimers = gameScenario.savedScenarioClock?.timers || null;
        window.scenarioTimerDispatcher = new ScenarioTimerDispatcher(gameScenario, {
            startTime: Number.isFinite(savedTimers?.elapsedMs) ? undefined : window.gameClock?.startTime,
            saved: savedTimers
        });
        console.log(`⏱️ Scenario timer dispatcher initialized`);
    }

    // Store game reference globally
    window.game = this;
    // Title screen is self-managing: it observes #loading and closes via its own
    // safety timer once loading is done (see title-screen-minigame.js).
}

/**
 * Check if tutorial should be shown and display it if needed
 */
async function checkAndShowTutorial() {
    const tutorialManager = getTutorialManager();

    // Don't show tutorial if already completed or declined
    if (tutorialManager.hasCompletedTutorial() || tutorialManager.hasDeclinedTutorial()) {
        return;
    }

    // Wait a bit for the game to settle (after title screen, etc.)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Ask if player wants tutorial
    const wantsTutorial = await tutorialManager.showTutorialPrompt();

    if (wantsTutorial) {
        // Start the tutorial
        tutorialManager.start(() => {
            console.log('Tutorial completed');
        });
    }
}

// Update function - main game loop
export function update() {
    // Safety check: ensure player exists before running updates
    if (!window.player) {
        return;
    }
    
    // Update player movement
    updatePlayerMovement();
    
    // Update player room (check for room transitions)
    updatePlayerRoom();

    // Update NPC behaviors
    if (window.npcBehaviorManager) {
        window.npcBehaviorManager.update(this.time.now, this.time.delta);
    }

    // [Phase 5] Update scenario timers (fire timers and dispatch events)
    if (window.scenarioTimerDispatcher) {
        window.scenarioTimerDispatcher.update(Date.now());
    }

    if (window.lightingSystem) {
        window.lightingSystem.update(this.time.now);
    }

    // Update NPC LOS visualizations if enabled
    if (window.npcManager && window.npcManager.losVisualizationEnabled) {
        window.npcManager.updateLOSVisualizations(this);
    }

    // Check for object interactions
    checkObjectInteractions.call(this);

    // Update combat feedback systems
    if (window.damageNumbers) {
        window.damageNumbers.update();
    }
    if (window.attackTelegraph) {
        window.attackTelegraph.update();
    }
    if (window.npcHealthBars) {
        window.npcHealthBars.update();
    }
    if (window.playerHUD) {
        window.playerHUD.update();
    }

    // Check for player bump effect when walking over floor items
    if (window.createPlayerBumpEffect) {
        window.createPlayerBumpEffect();
    }
    
    // Check for plant bump effect when player walks near animated plants
    if (window.createPlantBumpEffect) {
        window.createPlantBumpEffect();
    }
    
    // Update swivel chair rotation based on movement
    if (window.updateSwivelChairRotation) {
        window.updateSwivelChairRotation();
    }
    
    updateInfoLabel();

    // Bluetooth device scanning is now handled by the minigame when active
}

// Bluetooth scanning is now handled by the minigame

// Helper functions

// Find all objects at a given world position
function findObjectsAtPosition(worldX, worldY) {
    const objectsAtPosition = [];
    
    // Check all rooms for objects at the given position
    Object.entries(window.rooms).forEach(([roomId, room]) => {
        if (room.objects) {
            Object.values(room.objects).forEach(obj => {
                if (obj && obj.active && obj.visible) {
                    // Check if the click is within the object's bounds
                    const objLeft = obj.x - obj.width * obj.originX;
                    const objRight = obj.x + obj.width * (1 - obj.originX);
                    const objTop = obj.y - obj.height * obj.originY;
                    const objBottom = obj.y + obj.height * (1 - obj.originY);
                    
                    if (worldX >= objLeft && worldX <= objRight && 
                        worldY >= objTop && worldY <= objBottom) {
                        objectsAtPosition.push(obj);
                    }
                }
            });
        }
    });
    
    // Sort by depth (highest depth first, so topmost objects are checked first)
    objectsAtPosition.sort((a, b) => (b.depth || 0) - (a.depth || 0));
    
    return objectsAtPosition;
}

// Interaction icons for the disambiguation menu. The hand sheet is a 4×4 grid of
// 32px frames (frame 0 = open hand, frame 6 = fist/jab), matching the HUD toggle.
function interactionIconsBase() {
    const assetsPath = window.breakEscapeConfig?.assetsPath || '/break_escape/assets';
    return `${assetsPath}/icons`;
}
function openHandIcon()  { return { src: `${interactionIconsBase()}/hand_frames.png`, frame: 0, cols: 4, cell: 32 }; }
function jabHandIcon()   { return { src: `${interactionIconsBase()}/hand_frames.png`, frame: 6, cols: 4, cell: 32 }; }
function talkIcon()      { return { src: `${interactionIconsBase()}/talk.png` }; }

/**
 * Gather every interactable entity (item, NPC, door) that is both within the
 * player's reach AND close to the tapped point, so the caller can offer a
 * disambiguation menu when more than one is found. Each candidate carries the
 * label/detail text to show and an onSelect handler that performs the interaction.
 *
 * @param {number} worldX - World X coordinate of the tap
 * @param {number} worldY - World Y coordinate of the tap
 * @returns {Array<{label:string, detail:?string, onSelect:Function}>}
 */
function gatherInteractablesNearClick(worldX, worldY) {
    const player = window.player;
    if (!player || !window.rooms) return [];

    const TAP_SLOP = TILE_SIZE;            // how close the tap must be to count
    const TAP_SLOP_SQ = TAP_SLOP * TAP_SLOP;
    const DOOR_RANGE_SQ = DOOR_INTERACTION_RANGE * DOOR_INTERACTION_RANGE;
    const candidates = [];

    // True if the tap is inside the sprite's bounds or within TAP_SLOP of its centre.
    const tapHits = (cx, cy, sprite) => {
        try {
            const b = sprite.getBounds();
            if (worldX >= b.left && worldX <= b.right &&
                worldY >= b.top && worldY <= b.bottom) return true;
        } catch (e) { /* graphics fallback — fall through to radial test */ }
        const dx = cx - worldX;
        const dy = cy - worldY;
        return dx * dx + dy * dy <= TAP_SLOP_SQ;
    };

    const koSystem = window.npcHostileSystem;

    Object.values(window.rooms).forEach(room => {
        // Items
        if (room.objects) {
            Object.values(room.objects).forEach(obj => {
                if (!obj.active || !obj.interactable || !obj.visible) return;
                if (!isObjectInInteractionRange(obj)) return;
                if (!tapHits(obj.x, obj.y, obj)) return;
                const data = obj.scenarioData || {};
                const name = data.name || obj.name || 'Item';
                const detail = resolveObjectField(data, 'observations', obj.observations || null);
                // Chairs are kicked (jab); everything else uses the open-hand interact icon.
                const icon = obj.isSwivelChair ? jabHandIcon() : openHandIcon();
                candidates.push({
                    label: name,
                    detail,
                    icon,
                    onSelect: () => {
                        facePlayerToward(obj.x, obj.y);
                        if (window.getTutorialManager) window.getTutorialManager().notifyPlayerInteracted();
                        if (window.handleObjectInteraction) window.handleObjectInteraction(obj);
                    }
                });
            });
        }

        // NPCs
        if (room.npcSprites && Array.isArray(room.npcSprites)) {
            room.npcSprites.forEach(sprite => {
                if (!sprite || sprite.destroyed || !sprite.visible || !sprite._isNPC) return;
                if (koSystem && sprite.npcId && koSystem.isNPCKO(sprite.npcId)) return;
                if (!isObjectInInteractionRange(sprite)) return;
                if (!tapHits(sprite.x, sprite.y, sprite)) return;
                const npc = sprite.npcId && window.npcManager
                    ? window.npcManager.getNPC(sprite.npcId) : null;
                const hostile = koSystem && sprite.npcId && koSystem.isNPCHostile(sprite.npcId);
                const name = npc?.displayName || sprite.npcId || 'Person';
                // Hostile NPCs are struck (jab icon); friendly NPCs show the chat icon.
                candidates.push({
                    label: name,
                    detail: npc?.observations || null,
                    icon: hostile ? jabHandIcon() : talkIcon(),
                    onSelect: () => {
                        facePlayerToward(sprite.x, sprite.y);
                        if (window.getTutorialManager) window.getTutorialManager().notifyPlayerInteracted();
                        if (window.tryInteractWithNPC) window.tryInteractWithNPC(sprite);
                    }
                });
            });
        }

        // Doors
        if (room.doorSprites && Array.isArray(room.doorSprites)) {
            room.doorSprites.forEach(door => {
                if (!door || !door.active || door.scene === null) return;
                if (!door.doorProperties || door.doorProperties.open) return;
                const ddx = door.x - player.x;
                const ddy = door.y - player.y;
                if (ddx * ddx + ddy * ddy > DOOR_RANGE_SQ) return;
                if (!tapHits(door.x, door.y, door)) return;
                candidates.push({
                    label: door.doorProperties.door_sign || 'Door',
                    detail: door.doorProperties.locked ? 'Locked' : null,
                    icon: openHandIcon(),
                    onSelect: () => {
                        if (window.handleDoorInteraction) window.handleDoorInteraction(door);
                    }
                });
            });
        }
    });

    return candidates;
}

/**
 * Find an NPC sprite at the clicked position
 * @param {number} worldX - World X coordinate
 * @param {number} worldY - World Y coordinate
 * @returns {Object|null} NPC sprite if found, null otherwise
 */
function findNPCAtPosition(worldX, worldY) {
    let closestNPC = null;
    let closestDistance = Infinity;
    const koSystem = window.npcHostileSystem;

    // Check all rooms for NPC sprites at the given position
    Object.entries(window.rooms).forEach(([roomId, room]) => {
        if (room.npcSprites && Array.isArray(room.npcSprites)) {
            room.npcSprites.forEach(npcSprite => {
                if (npcSprite && !npcSprite.destroyed && npcSprite.visible) {
                    // Skip KO'd NPCs — they lie on the ground and shouldn't intercept
                    // clicks meant for movement past them.
                    if (koSystem && npcSprite.npcId && koSystem.isNPCKO(npcSprite.npcId)) return;
                    // Get NPC bounds
                    const bounds = npcSprite.getBounds();
                    
                    // Check if click is within bounds
                    if (worldX >= bounds.left && worldX <= bounds.right && 
                        worldY >= bounds.top && worldY <= bounds.bottom) {
                        // Calculate distance from click to NPC center
                        const dx = worldX - npcSprite.x;
                        const dy = worldY - npcSprite.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        // Keep the closest NPC
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestNPC = npcSprite;
                        }
                    }
                }
            });
        }
    });
    
    return closestNPC;
}

/**
 * Find a door sprite at the clicked position.
 * Door sprites live in room.doorSprites, not room.objects, so they are invisible
 * to findObjectsAtPosition.  We use sprite bounds for accurate hit-testing and
 * return the closest door whose bounding box contains the click point.
 *
 * @param {number} worldX - World X coordinate
 * @param {number} worldY - World Y coordinate
 * @returns {Object|null} Door sprite if found, null otherwise
 */
function findDoorAtPosition(worldX, worldY) {
    let closestDoor = null;
    let closestDistance = Infinity;

    Object.entries(window.rooms).forEach(([roomId, room]) => {
        if (!room.doorSprites || !Array.isArray(room.doorSprites)) return;

        room.doorSprites.forEach(doorSprite => {
            // Skip destroyed / inactive sprites
            if (!doorSprite || !doorSprite.active || doorSprite.scene === null) return;
            if (!doorSprite.doorProperties) return;

            try {
                const bounds = doorSprite.getBounds();
                if (worldX >= bounds.left && worldX <= bounds.right &&
                    worldY >= bounds.top  && worldY <= bounds.bottom) {
                    const dx = worldX - doorSprite.x;
                    const dy = worldY - doorSprite.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestDoor = doorSprite;
                    }
                }
            } catch (e) {
                // getBounds() may fail for graphics fallback objects — skip them
            }
        });
    });

    return closestDoor;
}

// Hide a room
function hideRoom(roomId) {
    if (window.rooms[roomId]) {
        const room = window.rooms[roomId];
        
        // Hide all layers
        Object.values(room.layers).forEach(layer => {
            if (layer && layer.setVisible) {
                layer.setVisible(false);
                layer.setAlpha(0);
            }
        });

        // Hide all objects (both active and inactive)
        if (room.objects) {
            Object.values(room.objects).forEach(obj => {
                if (obj && obj.setVisible) {
                    obj.setVisible(false);
                }
            });
        }
    }
}

 