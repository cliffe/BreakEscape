import { GAME_CONFIG } from './utils/constants.js';
import { preload, create, update } from './core/game.js';
import { initializeNotifications } from './systems/notifications.js';
// Bluetooth scanner is now handled as a minigame
// Biometrics is now handled as a minigame
import { startLockpickingMinigame } from './systems/minigame-starters.js';
import { initializeDebugSystem } from './systems/debug.js';
import { initializeUI } from './ui/panels.js';
import { initializeModals } from './ui/modals.js';

// Import character registry system
import './systems/character-registry.js';

// Import minigame framework
import './minigames/index.js';

// Import NPC systems
import './systems/ink/ink-engine.js';
import NPCEventDispatcher from './systems/npc-events.js';
import NPCManager from './systems/npc-manager.js';
import NPCBarkSystem from './systems/npc-barks.js';
import NPCLazyLoader from './systems/npc-lazy-loader.js';
import './systems/npc-game-bridge.js'; // Bridge for NPCs to influence game state

// Import Objectives System
import { getObjectivesManager } from './systems/objectives-manager.js';

// Import Tutorial System
import { getTutorialManager } from './systems/tutorial-manager.js';

// Import Room State Sync System
import './systems/room-state-sync.js';

// Import global state sync (persists gameState.globalVariables to server every 30s)
import { StateSync } from './state-sync.js';

// Import Music Controller and Widget
import MusicController from './music/music-controller.js';
import { wirePhaserGameSoundToBreakEscape } from './music/phaser-audio-bus.js';
import { createMusicWidget } from './music/music-widget.js';
import { createVmControlsWidget } from './ui/vm-controls-widget.js';

// Global game variables
window.game = null;
window.gameScenario = null;
window.player = null;
window.cursors = null;
window.rooms = {};
window.currentRoom = null;
window.inventory = {
    items: [],
    container: null
};
window.objectsGroup = null;
window.wallsLayer = null;
window.discoveredRooms = new Set();
window.pathfinder = null;
window.currentPath = [];
window.isMoving = false;
window.targetPoint = null;
window.lastPathUpdateTime = 0;
window.stuckTimer = 0;
window.lastPosition = null;
window.stuckTime = 0;
window.currentPlayerRoom = null;
window.lastPlayerPosition = { x: 0, y: 0 };
window.gameState = {
    biometricSamples: [],
    biometricUnlocks: [],
    bluetoothDevices: [],
    notes: [],
    startTime: null,
    submittedFlags: []  // CTF flags that have been submitted
};
window.lastBluetoothScan = 0;

// Initialize the game
function initializeGame() {
    // Initialise music controller before Phaser so it owns the AudioContext
    MusicController.init();

    // Set up game configuration with scene functions.
    // Pass the shared AudioContext so Phaser SFX flows through the same audio graph.
    const config = {
        ...GAME_CONFIG,
        audio: {
            context: MusicController.context
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        },
        inventory: {
            items: [],
            display: null
        }
    };

    // Create the Phaser game instance
    window.game = new Phaser.Game(config);

    // Route Phaser Web Audio output through MusicController.sfxGain (SFX slider)
    const wireMainGameAudio = () => wirePhaserGameSoundToBreakEscape(window.game);
    window.game.events.once('ready', wireMainGameAudio);
    requestAnimationFrame(wireMainGameAudio);

    // Prevent default context menu on right-click
    window.game.canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // Initialize all systems
    initializeNotifications();
    // Bluetooth scanner and biometrics are now handled as minigames

    // Initialize NPC systems
    console.log('🎭 Initializing NPC systems...');
    window.eventDispatcher = new NPCEventDispatcher();

    // Show the title screen after eventDispatcher is created so that start()
    // can register the game_loaded listener directly — avoiding the fallback timer.
    if (window.startTitleScreenMinigame) {
        window.startTitleScreenMinigame({ autoCloseTimeout: 0, disableGameInput: false });
        console.log('🎬 Title screen started');
    }
    window.barkSystem = new NPCBarkSystem();
    window.npcManager = new NPCManager(window.eventDispatcher, window.barkSystem);
    window.npcLazyLoader = new NPCLazyLoader(window.npcManager);
    console.log('✅ NPC lazy loader initialized');
    
    // Start timed message system
    window.npcManager.startTimedMessages();

    // Start periodic global state sync (saves globalVariables to server every 30s)
    window.stateSync = new StateSync(30000);
    window.stateSync.start();
    
    console.log('✅ NPC systems initialized');
    
    if (window.npcBarkSystem) {
        window.npcBarkSystem.init();
    }
    
    // Initialize Objectives System (manager only - data comes later in game.js)
    console.log('📋 Initializing objectives manager...');
    window.objectivesManager = getObjectivesManager(window.eventDispatcher);
    console.log('✅ Objectives manager initialized');

    // Reload handler: if this game was already concluded, replay the conclusion screen
    // once the scene is fully loaded and objectives are available.
    if (window.breakEscapeConfig?.missionConcludedAt) {
        window.eventDispatcher.once('game_loaded', () => {
            const scenario = window.gameScenario;
            if (!scenario?.objectives) return;
            const conclusionAim = scenario.objectives.find(a => a.missionConclusion);
            if (!conclusionAim || !window.objectivesManager) return;
            console.log('🔁 Replaying mission conclusion screen on reload');
            window.objectivesManager.handleMissionConcluded(conclusionAim);
        });
    }
    
    // Make lockpicking function available globally
    window.startLockpickingMinigame = startLockpickingMinigame;
    
    initializeDebugSystem();

    // Dev-only test bridge (window.__test) for Playwright/agent-driven playtests.
    // Dynamically imported so production builds never fetch or parse it.
    if (window.breakEscapeConfig?.testBridge) {
        import('./systems/test-bridge/index.js')
            .then(({ installTestBridge }) => installTestBridge())
            .catch(err => console.warn('[BreakEscape] test bridge failed to load:', err));
    }

    initializeUI();
    initializeModals();

    // Mount music widget — retries internally until #player-hud-buttons is ready
    window.musicWidget = createMusicWidget();

    // Mount VM controls widget — only renders when vmSetPanelUrl is set (VM-backed missions)
    window.vmControlsWidget = createVmControlsWidget();

    // Activate VM set on game start/resume — POST directly to Hacktivity's
    // activate_and_start endpoint (same action the VM controls panel uses).
    // Fire-and-forget: quota failures and errors are non-fatal; the VM controls
    // widget shows current state and the player can activate manually via the HUD.
    const activateUrl = window.breakEscapeConfig?.hacktivityMode && window.breakEscapeConfig?.vmSetActivateUrl;
    if (activateUrl) {
        fetch(activateUrl, {
            method: 'POST',
            headers: { 'X-CSRF-Token': window.breakEscapeConfig.csrfToken },
            redirect: 'follow'
        }).catch(err => console.warn('[BreakEscape] VM set activate_and_start failed:', err));
    }

    // Pixel-perfect scaling. Each game pixel must cover a whole number of *device*
    // pixels, otherwise nearest-neighbour upscaling gives some columns one more
    // device pixel than their neighbours and, as the camera scrolls, those columns
    // shift: pixels look squashed or doubled. So pick an integer device-pixel scale,
    // size the game to cover the container at that scale (the visible world flexes a
    // little with the window rather than being stretched), and lay the canvas out on
    // device-pixel boundaries.
    const BASE_WIDTH = 640;
    const BASE_HEIGHT = 480;

    const applyPixelPerfectScale = () => {
        const container = document.getElementById('game-container');
        if (!game?.scale || !game.canvas || !container) return;

        const dpr = window.devicePixelRatio || 1;
        const deviceWidth = Math.round(container.clientWidth * dpr);
        const deviceHeight = Math.round(container.clientHeight * dpr);
        if (!deviceWidth || !deviceHeight) return;

        // Integer scale closest to covering a 640x480 view (what ENVELOP used to show)
        const scale = Math.max(1, Math.round(Math.max(deviceWidth / BASE_WIDTH, deviceHeight / BASE_HEIGHT)));
        const gameWidth = Math.ceil(deviceWidth / scale);
        const gameHeight = Math.ceil(deviceHeight / scale);

        // Centre the (slightly oversized) canvas by a whole number of device pixels;
        // the container's overflow:hidden crops the remainder.
        const canvas = game.canvas;
        canvas.style.position = 'absolute';
        canvas.style.left = `${-Math.floor((gameWidth * scale - deviceWidth) / 2) / dpr}px`;
        canvas.style.top = `${-Math.floor((gameHeight * scale - deviceHeight) / 2) / dpr}px`;
        canvas.style.imageRendering = 'pixelated';

        if (game.scale.width !== gameWidth || game.scale.height !== gameHeight) {
            game.scale.resize(gameWidth, gameHeight);
        }
        // CSS size = gameSize * zoom = exactly gameSize * scale device pixels.
        // setZoom also refreshes the input bounds for the new canvas rect.
        game.scale.setZoom(scale / dpr);

        console.log(`Pixel scale ${scale}x (dpr ${dpr}): game ${gameWidth}x${gameHeight}`);
    };

    let resizeTimer = null;
    const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applyPixelPerfectScale, 50);
    };
    // Browser zoom and moving between monitors change devicePixelRatio without
    // always firing 'resize' on the container's size.
    const watchDevicePixelRatio = () => {
        const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
        mq.addEventListener?.('change', () => {
            handleResize();
            watchDevicePixelRatio();
        }, { once: true });
    };
    watchDevicePixelRatio();
    const handleOrientationChange = handleResize;

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('fullscreenchange', handleOrientationChange);
    
    // Check for LOS visualization debug flag
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('debug-los') || urlParams.has('los')) {
        // Delay to ensure scene is ready
        setTimeout(() => {
            const mainScene = window.game?.scene?.scenes?.[0];
            if (mainScene && window.npcManager) {
                console.log('🔍 Enabling LOS visualization (from URL parameter)');
                window.npcManager.setLOSVisualization(true, mainScene);
            }
        }, 1000);
    }
    
    // Add console helper
    window.enableLOS = function() {
        console.log('🔍 enableLOS() called');
        console.log('   game:', !!window.game);
        console.log('   game.scene:', !!window.game?.scene);
        console.log('   scenes:', window.game?.scene?.scenes?.length ?? 0);
        
        const mainScene = window.game?.scene?.scenes?.[0];
        console.log('   mainScene:', !!mainScene, mainScene?.key);
        console.log('   npcManager:', !!window.npcManager);
        
        if (!mainScene) {
            console.error('❌ Could not get main scene');
            // Try to find any active scene
            if (window.game?.scene?.scenes) {
                for (let i = 0; i < window.game.scene.scenes.length; i++) {
                    console.log(`   Available scene[${i}]:`, window.game.scene.scenes[i].key, 'isActive:', window.game.scene.scenes[i].isActive());
                }
            }
            return;
        }
        
        if (!window.npcManager) {
            console.error('❌ npcManager not available');
            return;
        }
        
        console.log('🎯 Setting LOS visualization with scene:', mainScene.key);
        window.npcManager.setLOSVisualization(true, mainScene);
        console.log('✅ LOS visualization enabled');
    };
    
    window.disableLOS = function() {
        if (window.npcManager) {
            window.npcManager.setLOSVisualization(false);
            console.log('✅ LOS visualization disabled');
        } else {
            console.error('❌ npcManager not available');
        }
    };
    
    // Test graphics rendering
    window.testGraphics = function() {
        console.log('🧪 Testing graphics rendering...');
        const scene = window.game?.scene?.scenes?.[0];
        if (!scene) {
            console.error('❌ No scene found');
            return;
        }
        
        console.log('📊 Scene:', scene.key, 'Active:', scene.isActive());
        
        const test = scene.add.graphics();
        console.log('✅ Created graphics object:', {
            exists: !!test,
            hasScene: !!test.scene,
            depth: test.depth,
            alpha: test.alpha,
            visible: test.visible
        });
        
        test.fillStyle(0xff0000, 0.5);
        test.fillRect(100, 100, 50, 50);
        console.log('✅ Drew red square at (100, 100)');
        console.log('   If you see a RED SQUARE on screen, graphics rendering is working!');
        console.log('   If NOT, check browser console for errors');
        
        // Clean up after 5 seconds
        setTimeout(() => {
            test.destroy();
            console.log('🧹 Test graphics cleaned up');
        }, 5000);
    };
    
    // Get detailed LOS status
    window.losStatus = function() {
        console.log('📡 LOS System Status:');
        console.log('   Enabled:', window.npcManager?.losVisualizationEnabled ?? 'N/A');
        console.log('   NPCs loaded:', window.npcManager?.npcs?.size ?? 0);
        console.log('   Graphics objects:', window.npcManager?.losVisualizations?.size ?? 0);
        
        if (window.npcManager?.npcs?.size > 0) {
            for (const npc of window.npcManager.npcs.values()) {
                console.log(`   NPC: "${npc.id}"`);
                console.log(`      LOS enabled: ${npc.los?.enabled ?? false}`);
                console.log(`      Position: (${npc.sprite?.x.toFixed(0) ?? 'N/A'}, ${npc.sprite?.y.toFixed(0) ?? 'N/A'})`);
                console.log(`      Facing: ${npc.facingDirection ?? npc.direction ?? 'N/A'}°`);
            }
        }
    };
    
    // Initial setup
    applyPixelPerfectScale();
    setTimeout(applyPixelPerfectScale, 100);
}

// Guard: do not initialise the game when this page is loaded inside an iframe.
// This can happen if the vm_panel redirect chain accidentally loads the game's own
// show page into the vm-launcher's iframe, causing a second Phaser instance to start
// inside the overlay. Skipping here prevents that silent double-init.
if (window.self !== window.top) {
    console.warn('[BreakEscape] Game page loaded inside an iframe — skipping initialisation.');
} else {
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', initializeGame);

    // Export for global access
    window.initializeGame = initializeGame;
}