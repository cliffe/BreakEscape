import { MinigameScene } from '../framework/base-minigame.js';
import { LockConfiguration } from './lock-configuration.js';
import { LockGraphics } from './lock-graphics.js';
import { KeyDataGenerator } from './key-data-generator.js';
import { KeySelection } from './key-selection.js';
import { KeyOperations } from './key-operations.js';
import { PinManagement } from './pin-management.js';
import { ToolManager } from './tool-manager.js';
import { KeyAnimation } from './key-animation.js';
import { HookMechanics } from './hook-mechanics.js';
import { LockLabels } from './label-layout.js';
import { PinVisuals } from './pin-visuals.js';
import { KeyInsertion } from './key-insertion.js';
import { KeyDrawing } from './key-drawing.js';
import { KeyPathDrawing } from './key-path-drawing.js';
import { KeyGeometry } from './key-geometry.js';
import { GameUtilities } from './game-utilities.js';
import MusicController from '../../music/music-controller.js';
import { wirePhaserGameSoundToBreakEscape } from '../../music/phaser-audio-bus.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { escapeHtml as escapeItemText } from '../../utils/escape-html.js';

// Item names and observations are scenario text: escaped before they reach HTML

// Phaser Lockpicking Minigame Scene implementation
// Smallest desktop zoom: labels still reach 16px on screen at it (the solver raises the font)
const LOCK_ZOOM_FLOOR = 0.5;
// Below this zoom the full-size item strip gives way to the compact one, when that gives the lock more
const LOCK_COMPACT_BELOW = 0.75;
// Big desktop windows (1600 wide and up). The lock only grows by whole zooms (a fraction above 1
// blurs the pixels), and with the full item strip above it a 2x lock (1200x800) does not fit at
// 1920x1080, so it would stay 1x in a mostly empty window. The compact strip is used when that
// unlocks a whole zoom of 2 or more. The window decides nothing here: the room is measured with
// each strip and the bigger zoom wins, as for LOCK_COMPACT_BELOW. Phones and short windows return
// before any of it.
// Smallest whole zoom a wide layout may be kept for
const LOCK_WIDE_MIN_ZOOM = 2;

export class LockpickingMinigamePhaser extends MinigameScene {
    constructor(container, params) {
        super(container, params);
        
        // Ensure params is an object
        params = params || {};
        
        console.log('🎮 Lockpicking minigame constructor received params:', {
            predefinedPinHeights: params.predefinedPinHeights,
            difficulty: params.difficulty,
            pinCount: params.pinCount,
            lockableType: params.lockable?.doorProperties ? 'door' : params.lockable?.scenarioData ? 'item' : 'unknown'
        });
        
        this.lockable = params.lockable || 'default-lock';
        this.lockId = params.lockId || 'default_lock';
        this.difficulty = params.difficulty || 'medium';
        
        // Determine pin count: prioritize based on keyPins array length from scenario
        let pinCount = params.pinCount;
        let predefinedPinHeights = params.predefinedPinHeights;
        
        console.log('🔍 pinCount determination started:', {
            explicitPinCount: pinCount,
            predefinedPinHeights: predefinedPinHeights,
            difficulty: this.difficulty
        });
        
        // If predefinedPinHeights not in params, try to extract from lockable object
        if (!predefinedPinHeights && this.lockable) {
            console.log('🔍 Attempting to extract predefinedPinHeights from lockable object');
            if (this.lockable.doorProperties?.keyPins) {
                predefinedPinHeights = this.lockable.doorProperties.keyPins;
                console.log(`✓ Extracted predefinedPinHeights from lockable.doorProperties:`, predefinedPinHeights);
            } else if (this.lockable.scenarioData?.keyPins) {
                predefinedPinHeights = this.lockable.scenarioData.keyPins;
                console.log(`✓ Extracted predefinedPinHeights from lockable.scenarioData:`, predefinedPinHeights);
            } else if (this.lockable.keyPins) {
                predefinedPinHeights = this.lockable.keyPins;
                console.log(`✓ Extracted predefinedPinHeights from lockable.keyPins:`, predefinedPinHeights);
            } else {
                console.warn('⚠ Could not extract predefinedPinHeights from lockable object');
            }
        }
        
        // Store for use in pin management
        this.params = params;
        this.params.predefinedPinHeights = predefinedPinHeights;
        
        // If pinCount not explicitly provided, derive from predefinedPinHeights (keyPins from scenario)
        if (!pinCount && predefinedPinHeights && Array.isArray(predefinedPinHeights)) {
            pinCount = predefinedPinHeights.length;
            console.log(`✓ Determined pinCount ${pinCount} from predefinedPinHeights array length: [${predefinedPinHeights.join(', ')}]`);
        }
        
        // Fall back to difficulty-based pin count if still not set
        if (!pinCount) {
            pinCount = this.difficulty === 'easy' ? 3 : this.difficulty === 'medium' ? 4 : 5;
            console.log(`⚠ Using difficulty-based pinCount: ${pinCount} (difficulty: ${this.difficulty})`);
        }

        
        this.pinCount = pinCount;
        
        // Initialize global lock storage if it doesn't exist
        if (!window.lockConfigurations) {
            window.lockConfigurations = {};
        }
        
        // Initialize KeyDataGenerator module
        this.keyDataGen = new KeyDataGenerator(this);
        
        // Initialize KeySelection module
        this.keySelection = new KeySelection(this);
        
        // Initialize KeyOperations module
        this.keyOps = new KeyOperations(this);
        
        // Initialize PinManagement module
        this.pinMgmt = new PinManagement(this);
        
        // Initialize ToolManager module
        this.toolMgr = new ToolManager(this);
        
        // Initialize KeyAnimation module
        this.keyAnim = new KeyAnimation(this);
        
        // Initialize HookMechanics module
        this.hookMech = new HookMechanics(this);
        
        // Initialize PinVisuals module
        this.pinVisuals = new PinVisuals(this);
        
        // Initialize KeyInsertion module
        this.keyInsertion = new KeyInsertion(this);
        
        // Initialize KeyDrawing module
        this.keyDraw = new KeyDrawing(this);
        
        // Initialize KeyPathDrawing module
        this.keyPathDraw = new KeyPathDrawing(this);
        
        // Initialize KeyGeometry module
        this.keyGeom = new KeyGeometry(this);
        
        // Initialize GameUtilities module
        this.gameUtil = new GameUtilities(this);
        
        // Also try to load from localStorage for persistence across sessions
        if (!window.lockConfigurations[this.lockId]) {
            try {
                const savedConfigs = localStorage.getItem('lockConfigurations');
                if (savedConfigs) {
                    const parsed = JSON.parse(savedConfigs);
                    window.lockConfigurations = { ...window.lockConfigurations, ...parsed };
                }
            } catch (error) {
                console.warn('Failed to load lock configurations from localStorage:', error);
            }
        }
        
        // Threshold sensitivity for pin setting (1-10, higher = more sensitive)
        this.thresholdSensitivity = params.thresholdSensitivity || 5;
        
        // Whether to highlight binding order
        this.highlightBindingOrder = params.highlightBindingOrder !== undefined ? params.highlightBindingOrder : true;
        
        // Whether to highlight pin alignment (shear line proximity)
        this.highlightPinAlignment = params.highlightPinAlignment !== undefined ? params.highlightPinAlignment : true;
        
        // Lift speed parameter (can be set to fast values, but reasonable default for hard)
        this.liftSpeed = params.liftSpeed || (this.difficulty === 'hard' ? 1.2 : 1);
        
        // Key mode settings
        this.keyMode = params.keyMode || false;
        this.keyData = params.keyData || null; // Key data with cuts/ridges
        this.keyInsertionProgress = 0; // 0 = not inserted, 1 = fully inserted
        this.keyInserting = false;
        this.skipStartingKey = params.skipStartingKey || false; // Skip creating initial key if true
        this.keySelectionMode = false; // Track if we're in key selection mode
        
        // Mode switching settings
        this.canSwitchToPickMode = params.canSwitchToPickMode || false; // Allow switching from key to pick mode
        this.inventoryKeys = params.inventoryKeys || null; // Stored for mode switching
        this.requiredKeyId = params.requiredKeyId || null; // Track required key ID
        this.canSwitchToKeyMode = params.canSwitchToKeyMode || false; // Allow switching from lockpick to key mode
        this.availableKeys = params.availableKeys || null; // Keys available for mode switching
        
        // Sound effects
        this.sounds = {};
        
        // Track if any pin has been clicked (for hiding labels)
        this.pinClicked = false;
        
        // Log the configuration for debugging
        console.log('Lockpicking minigame config:', {
            lockable: this.lockable,
            difficulty: this.difficulty,
            pinCount: this.pinCount,
            passedPinCount: params.pinCount,
            thresholdSensitivity: this.thresholdSensitivity,
            highlightBindingOrder: this.highlightBindingOrder,
            highlightPinAlignment: this.highlightPinAlignment,
            liftSpeed: this.liftSpeed,
            canSwitchToPickMode: this.canSwitchToPickMode,
            canSwitchToKeyMode: this.canSwitchToKeyMode
        });
        
        this.pins = [];
        this.lockState = {
            tensionApplied: false,
            pinsSet: 0,
            currentPin: null
        };
        
        this.game = null;
        this.scene = null;
        
        // Initialize lock configuration module
        this.lockConfig = new LockConfiguration(this);
        
        // Initialize lock graphics module
        this.lockGraphics = new LockGraphics(this);
    }
    
    /**
     * Test bridge state (see MinigameScene.getTestState).
     *
     * This minigame renders into its OWN nested Phaser canvas, so it has no DOM
     * button surface. It is still drivable:
     *
     *  - keyMode (player holds a key): a single click on the key zone runs the
     *    insertion animation, checks the cuts and completes the minigame by
     *    itself. `keyTarget` below is that click point in canvas pixels — pass
     *    it to __test.minigame.clickCanvas(x, y).
     *  - pick mode: pin-management.js binds digits 1-8 to select a pin and
     *    space to toggle tension, so __test.minigame.pressKey works. Whether a
     *    pin has set is still only shown visually, so blind picking is
     *    impractical — prefer the key route.
     *
     * NEVER return `this.lockable` or any other Phaser object from here: it is
     * a live sprite with circular references and JSON-serialising it throws
     * ("Converting circular structure to JSON"), which takes out the whole
     * getState() call.
     */
    getTestState() {
        const base = super.getTestState();

        let keyTarget = null;
        try {
            const zone = this.keyClickZone;
            const cam = this.scene?.cameras?.main;
            if (this.keyMode && zone && cam && typeof zone.getBounds === 'function') {
                const b = zone.getBounds();
                keyTarget = {
                    x: Math.round(b.centerX - cam.scrollX),
                    y: Math.round(b.centerY - cam.scrollY)
                };
            }
        } catch (err) {
            keyTarget = null;
        }

        // When the player holds more than one key, a SELECTION screen precedes
        // the insertion screen. Report each candidate's click point and label so
        // an agent never has to reach into the live Phaser scene tree to find
        // them (which is what happened before this existed).
        let keySelection = null;
        try {
            const container = this.keySelectionContainer;
            const cam = this.scene?.cameras?.main;
            if (container && cam && Array.isArray(container.list)) {
                const targets = container.list
                    .filter(child => child?.input?.enabled && typeof child.getBounds === 'function'
                                     && child.type !== 'Text')
                    .map((child) => {
                        const b = child.getBounds();
                        return {
                            x: Math.round(b.centerX - cam.scrollX),
                            y: Math.round(b.centerY - cam.scrollY),
                            width: Math.round(b.width),
                            height: Math.round(b.height)
                        };
                    })
                    // The container's own background is interactive too; drop
                    // anything that spans most of the container.
                    .filter(t => t.width < 300);
                // Labels are separate Text objects sitting under each key.
                const labels = container.list
                    .filter(child => child?.type === 'Text' && typeof child.text === 'string')
                    .map(t => t.text)
                    .filter(t => t && !/select|choose/i.test(t));
                if (targets.length) {
                    keySelection = targets.map((t, i) => ({ ...t, label: labels[i] ?? null }));
                }
            }
        } catch (err) {
            keySelection = null;
        }

        return {
            ...base,
            keySelection,
            // Plain strings/numbers only — see the warning above.
            lockableName: typeof this.lockable === 'string'
                ? this.lockable
                : (this.lockable?.scenarioData?.name ?? null),
            difficulty: this.difficulty,
            keyMode: !!this.keyMode,
            keyInserting: !!this.keyInserting,
            pinCount: (this.pins || []).length,
            pinsSet: (this.pins || []).filter(p => p?.isSet).length,
            nestedCanvas: true,
            keyTarget,
            hint: keySelection
                ? 'Key SELECTION screen: clickCanvas on the chosen keySelection[i] first; keyTarget appears afterwards.'
                : this.keyMode
                ? 'clickCanvas(keyTarget.x, keyTarget.y) inserts the key and completes the lock.'
                : 'Pick mode: pressKey("1")-("8") selects a pin, pressKey(" ") toggles tension. Pin state is visual only.'
        };
    }

    // Method to get the lock's pin configuration for key generation

    init() {
        super.init();
        
        // The X and Esc close through the shell's closeByPlayer(). There is no Cancel beside
        // the X: the old bottom button could only close as well, and its unused "reset the
        // pins" option was dropped (slice 7 R2 n1).

        this.headerElement.innerHTML = `
            <h3>Lockpicking</h3>
            <p>Apply tension and hold click on pins to lift them to the shear line</p>
        `;
        
        // Create the lockable item display section if item info is provided
        this.createLockableItemDisplay();
        
        this.setupPhaserGame();
    }
    
    createLockableItemDisplay() {
        // Create display for the locked item (door, chest, etc.)
        const itemName = this.params?.itemName || this.lockable || 'Locked Item';
        const itemImage = this.params?.itemImage || null;
        const itemObservations = this.params?.itemObservations || '';
        
        if (!itemImage) return; // Only create if image is provided
        
        // Create container for the item display
        const itemDisplayDiv = document.createElement('div');
        itemDisplayDiv.className = 'lockpicking-item-section';
        this._itemSection = itemDisplayDiv;
        itemDisplayDiv.innerHTML = `
            <img src="${escapeItemText(itemImage)}" 
                 alt="${escapeItemText(itemName)}" 
                 class="lockpicking-item-image">
            <div class="lockpicking-item-info">
                <h4>${escapeItemText(displayDashes(itemName))}</h4>
                ${itemObservations ? `<p>${escapeItemText(displayDashes(itemObservations))}</p>` : ''}
            </div>
        `;
        
        // Short windows clamp the observations to two lines (lockpicking.css): the full text is
        // in the title, and a click, tap or Enter/Space opens it in the strip. The text is a
        // button only while it overflows (or is open): _syncObsButton keeps that current.
        const obs = itemDisplayDiv.querySelector('.lockpicking-item-info p');
        const heading = itemDisplayDiv.querySelector('.lockpicking-item-info h4');
        if (heading) heading.title = heading.textContent;
        if (obs) {
            obs.title = obs.textContent;
            obs.id = 'lockpicking-observations';
            const more = document.createElement('span');
            more.className = 'lockpicking-obs-more';
            more.setAttribute('aria-hidden', 'true');
            obs.insertAdjacentElement('afterend', more);
            // As a button the observations are named by their own text (they can hold clues);
            // aria-expanded gives the state. No aria-label or aria-describedby: they would
            // replace the text as the name.
            this._obsEl = obs;
            this._obsMore = more;
            this._obsSection = itemDisplayDiv;
            const toggle = () => {
                if (obs.getAttribute('role') !== 'button') return;
                itemDisplayDiv.classList.toggle('lockpicking-info-expanded');
                this._syncObsButton();
                // The strip changed height (the paragraph goes from the 48px clamp to up to 96px,
                // or back): refit the lock to it. Sticky (relax false), so the toggle never
                // switches the strip back to the full size.
                this._fitLockZoom?.(false);
            };
            this._obsClick = toggle;
            this._obsKey = (e) => {
                if (obs.getAttribute('role') !== 'button') return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
            };
            obs.addEventListener('click', this._obsClick);
            obs.addEventListener('keydown', this._obsKey);
        }

        // Add mode switch button if applicable
        // Mode switch row: its own full-width line under the image and name (see lockpicking.css)
        if (this.canSwitchToPickMode && this.keyMode) {
            itemDisplayDiv.appendChild(this.toolMgr.buildPickButtonRow());
        } else if (this.canSwitchToKeyMode && !this.keyMode) {
            itemDisplayDiv.appendChild(this.toolMgr.buildKeyButtonRow());
        }
        
        // Insert before the game container
        this.gameContainer.parentElement.insertBefore(itemDisplayDiv, this.gameContainer);
    }
    
    setupPhaserGame() {
        // Create a container for the Phaser game
        this.gameContainer.innerHTML = `
            <div class="phaser-game-container" id="phaser-game-container"></div>
        `;
        
        // Create feedback element in the minigame container
        this.feedback = document.createElement('div');
        this.feedback.className = 'lockpick-feedback';
        this.gameContainer.appendChild(this.feedback);
        
        console.log('Setting up Phaser game...');
        
        // Create a custom Phaser scene
        const self = this;
        class LockpickingScene extends Phaser.Scene {
            constructor() {
                super({ key: 'LockpickingScene' });
            }
            
            preload() {
                // Load sound effects
                this.load.audio('key_unlock', 'sounds/key_unlock.mp3');
                this.load.audio('lockpick_binding', 'sounds/lockpick_binding.mp3');
                this.load.audio('lockpick_click', 'sounds/lockpick_click.mp3');
                this.load.audio('lockpick_overtension', 'sounds/lockpick_overtension.mp3');
                this.load.audio('lockpick_reset', 'sounds/lockpick_reset.mp3');
                this.load.audio('lockpick_set', 'sounds/lockpick_set.mp3');
                this.load.audio('lockpick_success', 'sounds/lockpick_success.mp3');
                this.load.audio('lockpick_tension', 'sounds/lockpick_tension.mp3');
                this.load.audio('lockpick_wrong', 'sounds/lockpick_wrong.mp3');
            }
            
            create() {
                console.log('Phaser scene create() called');
                // Store reference to the scene
                self.scene = this;

                // On mobile, scroll the camera so the cropped canvas window is centred
                // on the lock area rather than starting at game-world (0,0).
                if (self._portraitCameraOffset) {
                    this.cameras.main.setScroll(
                        self._portraitCameraOffset.x,
                        self._portraitCameraOffset.y
                    );
                }

                // Initialize sound effects
                self.sounds.keyUnlock = this.sound.add('key_unlock');
                self.sounds.binding = this.sound.add('lockpick_binding');
                self.sounds.click = this.sound.add('lockpick_click');
                self.sounds.overtension = this.sound.add('lockpick_overtension');
                self.sounds.reset = this.sound.add('lockpick_reset');
                self.sounds.set = this.sound.add('lockpick_set');
                self.sounds.success = this.sound.add('lockpick_success');
                self.sounds.tension = this.sound.add('lockpick_tension');
                self.sounds.wrong = this.sound.add('lockpick_wrong');
                
                // Create game elements
                self.lockGraphics.createLockBackground();
                self.lockGraphics.createTensionWrench();
                self.pinMgmt.createPins();
                self.lockGraphics.createHookPick();
                self.pinMgmt.createShearLine();
                // Labels at a readable size and clear of the pins (D219)
                self.lockLabels = new LockLabels(self);
                self.lockLabels.apply();
                self.lockLabels.watch();
                
                // Create key if in key mode and not skipping starting key
                if (self.keyMode && !self.skipStartingKey) {
                    self.keyOps.createKey();
                    self.toolMgr.hideLockpickingTools();
                    self.keyInsertion.updateFeedback("Click the key to insert it into the lock");
                } else if (self.keyMode && self.skipStartingKey) {
                    // Skip creating initial key, will show key selection instead
                    // But we still need to initialize keyData for the correct key
                    if (!self.keyData) {
                        self.keyDataGen.generateKeyDataFromPins();
                    }
                    self.toolMgr.hideLockpickingTools();
                    self.keyInsertion.updateFeedback("Select a key to begin");
                } else {
                    self.keyInsertion.updateFeedback("Apply tension first, then lift pins in binding order - only the binding pin can be set");
                }
                
                self.pinMgmt.setupInputHandlers();
                console.log('Phaser scene setup complete');
            }
            
            update() {
                if (self.update) {
                    self.update();
                }
            }
        }
        
        // Initialize Phaser game
        const config = {
            type: Phaser.AUTO,
            parent: 'phaser-game-container',
            width: 600,
            height: 400,
            backgroundColor: '#1a1a1a',
            scene: LockpickingScene,
            audio: {
                context: MusicController.context
            },
            loader: {
                baseURL: (window.breakEscapeConfig?.assetsPath || '/break_escape/assets') + '/'
            }
        };
        
        // Adjust canvas size for mobile to crop empty space
        // Lock is positioned from x=100 to x=500, y=50 to y=350 in the 600x400 game world.
        // Short windows (a landscape phone, 560px or less tall) get the same crop and Scale.FIT
        // whatever their width: the 400px lock cannot fit under the info row, so it scales down
        if (window.innerWidth <= 768 || window.innerHeight <= 560) {
            const isPortrait = window.innerHeight > window.innerWidth;

            if (isPortrait) {
                // Portrait: a canvas window over the lock and its labels (tension wrench,
                // pins, SHEAR LINE), which span about x=0..580; Scale.FIT shrinks it to the
                // screen. The old 400px window over x=80..480 cut the lock's right side and
                // the labels (critique A07). Camera is scrolled in create().
                config.width = 580;
                config.height = 340;
                this._portraitCameraOffset = { x: 0, y: 20 };
            } else {
                // Landscape: crop to the lock and its labels (x=0..580, y=30..370)
                config.width = 580;
                config.height = 340;
                this._portraitCameraOffset = { x: 0, y: 30 };
            }

            config.scale = {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            };
            // No upscaling past the crop's own 580x340 in a short landscape window (a short
            // desktop window is wider). Phaser 3.60 reads the flat maxWidth/maxHeight (a nested
            // scale.max is ignored). Not in portrait or a tall window: a cap there would leave
            // the canvas at 580 wide, left-aligned in a wider box.
            if (!isPortrait && window.innerHeight <= 560) {
                config.scale.maxWidth = 580;
                config.scale.maxHeight = 340;
            }
            // lockpicking.css lays the frame out for a fitted canvas only under this class, so
            // a lock opened at full size and resized short later keeps its scrolling frame
            this.gameContainer.querySelector?.('#phaser-game-container')?.classList.add('lockpicking-fit');
        }
        // What the boot gate chose, so a later resize can tell when it no longer holds
        this._lockFitApplied = LockpickingMinigamePhaser.lockFitState();
        
        try {
            this.game = new Phaser.Game(config);
            const wireLockAudio = () => wirePhaserGameSoundToBreakEscape(this.game);
            this.game.events.once('ready', wireLockAudio);
            requestAnimationFrame(wireLockAudio);
            this.scene = this.game.scene.getScene('LockpickingScene');
            console.log('Phaser game created, scene:', this.scene);
            this._watchLockZoom();
            this._watchLockBox();
            this._watchObs();
        } catch (error) {
            console.error('Error creating Phaser game:', error);
            this.keyInsertion.updateFeedback('Error loading Phaser game: ' + error.message);
        }
    }
    
    
    // Which layout a window gets: the phone crop with Scale.FIT (narrow or short windows), the
    // full 600x400 lock otherwise. The boot gate and the resize refit share this.
    static lockFitState(w = window.innerWidth, h = window.innerHeight) {
        if (!(w <= 768 || h <= 560)) return { fit: false, portrait: false, capped: false };
        const portrait = h > w;
        return { fit: true, portrait, capped: !portrait && h <= 560 };
    }

    // A resize or rotation after the lock opened: the boot gate chose the crop or the full
    // lock for the old size. Debounced; a change of layout is re-applied to the live game.
    _watchLockRefit() {
        let timer = null;
        const refit = () => {
            clearTimeout(timer);
            timer = setTimeout(() => { this._lockRefitTimer = null; this._refitLock(); }, 120);
            this._lockRefitTimer = timer;
        };
        this._lockRefitOnResize = refit;
        window.addEventListener('resize', refit);
        window.addEventListener('orientationchange', refit);
    }

    _refitLock() {
        const game = this.game;
        const box = this.gameContainer?.querySelector?.('#phaser-game-container');
        if (!game?.scale || !box) return;
        const next = LockpickingMinigamePhaser.lockFitState();
        const prev = this._lockFitApplied || {};
        const same = prev.fit === next.fit && prev.portrait === next.portrait && prev.capped === next.capped;
        if (!same) {
            this._applyLockFit(game, box, next);
            this._lockFitApplied = next;
        }
        if (next.fit) {
            try { if (game.scale.getParentBounds?.()) game.scale.refresh(); } catch (e) { /* game gone */ }
        } else {
            this._fitLockZoom();
        }
        this._syncObsButton();
        this._scrollKeyPanelIntoView();
    }

    // Phaser's canvas size, scale mode, camera crop and the CSS class all follow the layout
    _applyLockFit(game, box, st) {
        const scale = game.scale;
        const unlimited = Number.MAX_VALUE;
        if (st.fit) {
            // The class first: the CSS re-lays the box out, and Phaser reads the box's size next
            box.style.maxWidth = '';
            box.classList.remove('lockpicking-zoomed');
            box.classList.add('lockpicking-fit');
            // The compact strip belongs to the desktop layout: the fitted layout has its own
            // rules, so a stale mark would leave the observations a dead expanded button (R2 m1).
            // The caller resyncs the observation button after this.
            this._itemSection?.classList?.remove('lockpicking-compact');
            this._lockCompact = false;
            this._portraitCameraOffset = { x: 0, y: st.portrait ? 20 : 30 };
            scale.scaleMode = Phaser.Scale.FIT;
            scale.autoCenter = Phaser.Scale.CENTER_BOTH;
            scale.zoom = 1;
            // The display Size was built for the boot mode: its aspect mode and parent decide
            // how setSize constrains the canvas, so they follow the scale mode
            scale.displaySize.setAspectMode(Phaser.Scale.FIT);
            scale.getParentBounds?.();
            if (scale.parentSize?.width > 0 && scale.parentSize?.height > 0) scale.displaySize.setParent(scale.parentSize);
            scale.displaySize.setMax(st.capped ? 580 : unlimited, st.capped ? 340 : unlimited);
            scale.setGameSize(580, 340);
            if (!this._lockBoxObserver) this._watchLockBox();
        } else {
            this._portraitCameraOffset = null;
            this._lockBoxObserver?.disconnect?.();
            this._lockBoxObserver = null;
            box.classList.remove('lockpicking-fit');
            scale.scaleMode = Phaser.Scale.NONE;
            scale.autoCenter = Phaser.Scale.NO_CENTER;
            scale.displaySize.setAspectMode(Phaser.Scale.NONE);
            scale.displaySize.setParent(null);
            scale.displaySize.setMax(unlimited, unlimited);
            const st2 = scale.canvas?.style;
            if (st2) { st2.marginLeft = ''; st2.marginTop = ''; }
            scale.zoom = 1;
            scale._resetZoom = true;
            scale.setGameSize(600, 400);
        }
        const off = this._portraitCameraOffset;
        this.scene?.cameras?.main?.setScroll?.(off ? off.x : 0, off ? off.y : 0);
        // setGameSize laid the labels out on the old scroll: lay out again on the new view
        try { this.lockLabels?.apply(); } catch (e) { /* scene gone */ }
        this._placeKeyPanel();
    }

    // The key-selection panel follows the camera crop: a refit changes the crop, so its y is set
    // again by the same formula the builder used
    _placeKeyPanel() {
        const c = this.keySelectionContainer;
        if (!c || typeof c.setY !== 'function') return;
        c.setY(KeySelection.panelY(this._portraitCameraOffset, c.panelHeight || 160));
    }

    // With the key panel open the labels sit at the foot of the 600x400 lock, where the sticky
    // feedback line would cover them on a 1024 to 1366 wide desktop. Scroll the game area to its
    // end so the line sits below the canvas, in its own place, and nothing is covered.
    _scrollKeyPanelIntoView() {
        const area = this.gameContainer;
        if (!this.keySelectionContainer || !area) return;
        area.scrollTop = area.scrollHeight;
    }

    // The largest whole-number zoom at which the 600x400 lock fits the room it has (A09): 1 when
    // the window is small or the lock is cropped for a phone, 2 or more on a big window
    static wholeZoom(availW, availH, baseW = 600, baseH = 400) {
        const z = Math.floor(Math.min(availW / baseW, availH / baseH));
        return Number.isFinite(z) && z > 1 ? z : 1;
    }

    // The zoom for the room the lock has: a whole number when it fits at 1x or better, and a
    // fraction below 1 when the window leaves less than 600x400 (a long observation and a
    // feedback box under the lock at 1280x720). The canvas then shrinks, as it does on a
    // phone, instead of running past the window and being clipped. 0.5 is the floor: below
    // it the game area scrolls.
    static lockZoom(availW, availH, baseW = 600, baseH = 400) {
        const f = Math.min(availW / baseW, availH / baseH);
        if (!Number.isFinite(f) || f <= 0) return 1;
        if (f >= 1) return LockpickingMinigamePhaser.wholeZoom(availW, availH, baseW, baseH);
        return Math.max(LOCK_ZOOM_FLOOR, Math.floor(f * 100) / 100);
    }

    // True when the lock would need a zoom below LOCK_COMPACT_BELOW in this room: the item strip
    // then goes compact (if that frees more room). A whole zoom or a fraction at or above it
    // needs no compaction.
    static lockNeedsCompact(availW, availH, baseW = 600, baseH = 400) {
        const f = Math.min(availW / baseW, availH / baseH);
        return Number.isFinite(f) && f > 0 && f < LOCK_COMPACT_BELOW;
    }

    // Room for the canvas: the game area's width, and its height less the strips around the
    // canvas (item info, feedback)
    _lockRoom() {
        const area = this.gameContainer;
        const box = area?.querySelector?.('#phaser-game-container');
        if (!area || !box) return null;
        let others = 0;
        for (const el of area.children) {
            if (el === box) continue;
            const cs = window.getComputedStyle(el);
            others += el.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
        }
        const ar = window.getComputedStyle(area);
        const padX = (parseFloat(ar.paddingLeft) || 0) + (parseFloat(ar.paddingRight) || 0);
        const padY = (parseFloat(ar.paddingTop) || 0) + (parseFloat(ar.paddingBottom) || 0);
        return { w: area.clientWidth - padX, h: area.clientHeight - padY - others - 8 };
    }

    // relax true (a window resize, the first passes after opening, fonts loading) measures from
    // the full-size strip and may drop compact again. relax false (the feedback line changing
    // height, the "+ MORE" toggle) may add compact but never removes it: a strip that flips
    // while the player holds a pick moves the lock out from under them (R1 M1). A fresh
    // attempt is a new minigame object, so it starts from the full strip.
    _fitLockZoom(relax = true) {
        const game = this.game;
        const box = this.gameContainer?.querySelector?.('#phaser-game-container');
        if (!game?.scale || !box || window.innerWidth <= 768 || window.innerHeight <= 560) return;
        // The layout the game is in decides, not the window: a refit is pending after a resize
        if (this._lockFitApplied?.fit) return;
        let room = this._lockRoom();
        if (!room) return;
        // The room measured decides whether the item strip stays full size: when the lock would
        // need a zoom under LOCK_COMPACT_BELOW (a short desktop window, a long observation, a tall
        // feedback box) the strip takes the compact form the short windows use (lockpicking.css,
        // .lockpicking-compact), which gives the lock about 250px more. Relax passes remeasure
        // from the full-size strip; sticky passes keep compact once it is on (see above).
        const sec = this._itemSection;
        const LZ = LockpickingMinigamePhaser.lockZoom;
        if (sec) {
            const sticky = !relax && !!this._lockCompact;
            sec.classList.remove('lockpicking-compact');
            if (sticky) sec.classList.add('lockpicking-compact');
            room = this._lockRoom() || room;
            if (!sticky) {
                const full = room;
                // Short room (LOCK_COMPACT_BELOW), or a roomy one (wide): the compact strip is
                // kept only when it really gives the lock a bigger zoom (for the roomy case, a whole
                // zoom of LOCK_WIDE_MIN_ZOOM or more)
                const short = LockpickingMinigamePhaser.lockNeedsCompact(full.w, full.h);
                const wide = LZ(full.w, full.h) >= 1;
                if (short || wide) {
                    sec.classList.add('lockpicking-compact');
                    room = this._lockRoom() || room;
                    const zc = LZ(room.w, room.h);
                    const keep = zc > LZ(full.w, full.h) && (short || zc >= LOCK_WIDE_MIN_ZOOM);
                    if (!keep) {
                        sec.classList.remove('lockpicking-compact');
                        room = full;
                    }
                }
            }
            const was = !!this._lockCompact;
            this._lockCompact = sec.classList.contains('lockpicking-compact');
            if (was !== this._lockCompact) this._syncObsButton();
        }
        const z = LockpickingMinigamePhaser.lockZoom(room.w, room.h);
        if (game.scale.zoom !== z) game.scale.setZoom(z);
        box.style.maxWidth = (600 * z) + 'px';
        box.classList.toggle('lockpicking-zoomed', z > 1);
    }

    // Phaser rereads the canvas's page position only on its resize interval, so a scroll of the
    // game area or the shell leaves the pointer mapped to the old place for up to half a second
    // (UI shell review m1). Reread it on the scroll itself.
    _watchLockScroll() {
        const update = () => { try { this.game?.scale?.updateBounds?.(); } catch (e) { /* game gone */ } };
        this._lockScrollUpdate = update;
        this._lockScrollEls = [this.gameContainer, this.container].filter(Boolean);
        this._lockScrollEls.forEach((el) => el.addEventListener('scroll', update, { passive: true }));
    }

    // The fitted lock's box changes size without the window resizing (the feedback line goes
    // from one line to two, the item info expands), and Phaser rereads it only every 500ms,
    // so the pointer would map to the old canvas place for that long. Refresh on the change.
    // Phaser 3.60's refresh() sizes from the stored parent size and only then rereads the
    // parent, so the canvas stays one change behind: read the parent bounds first.
    _watchLockBox() {
        const box = this.gameContainer?.querySelector?.('#phaser-game-container');
        if (!box || !box.classList?.contains('lockpicking-fit') || typeof ResizeObserver === 'undefined') return;
        this._lockBoxObserver = new ResizeObserver(() => {
            try {
                const s = this.game?.scale;
                if (s?.getParentBounds?.()) s.refresh();
            } catch (e) { /* game gone */ }
            this._syncObsButton();
        });
        this._lockBoxObserver.observe(box);
    }

    // The observations are a button (role, tab stop, aria-expanded; the accessible name is the
    // observation text itself) only while they can be opened: a short window or a compact strip,
    // and the two-line clamp hides text, or they are already open. Elsewhere they are plain text.
    _syncObsButton() {
        const obs = this._obsEl;
        const sec = this._obsSection;
        if (!obs || !sec) return;
        const short = window.innerHeight <= 560 || !!this._lockCompact;
        if (!short) sec.classList.remove('lockpicking-info-expanded');
        const expanded = sec.classList.contains('lockpicking-info-expanded');
        const active = short && (expanded || obs.scrollHeight > obs.clientHeight + 1);
        sec.classList.toggle('lockpicking-obs-overflow', active);
        if (active) {
            obs.setAttribute('role', 'button');
            obs.tabIndex = 0;
            obs.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            if (this._obsMore) this._obsMore.textContent = expanded ? '- LESS' : '+ MORE';
        } else {
            // Focus must not fall to the page when the button goes: hand it to the mode button,
            // or the minigame's X
            if (typeof document !== 'undefined' && document.activeElement === obs) {
                const root = this.container || document;
                const next = sec.querySelector('.lockpicking-mode-row button:not([disabled])')
                    || root.querySelector?.('#minigame-close') || document.getElementById('minigame-close');
                next?.focus?.();
            }
            ['role', 'aria-expanded'].forEach((a) => obs.removeAttribute(a));
            obs.removeAttribute('tabindex');
        }
    }

    _watchObs() {
        if (!this._obsEl) return;
        this._obsOnResize = () => this._syncObsButton();
        window.addEventListener('resize', this._obsOnResize);
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => this._syncObsButton());
        document.fonts?.ready?.then?.(() => this._syncObsButton());
    }

    // Measured with the fallback font the strip can wrap onto more lines than it will with
    // VT323 / GNF: fit again when the fonts arrive (R1 m2). Desktop path only.
    _fitOnFontsReady() {
        document.fonts?.ready?.then?.(() => { this._fitLockZoom(); this._syncObsButton(); });
    }

    // Everything the lock added outside its own DOM: the box observer, window and scroll listeners
    _releaseLockWatchers() {
        this._lockBoxObserver?.disconnect?.();
        this._lockBoxObserver = null;
        this._lockFeedbackObserver?.disconnect?.();
        this._lockFeedbackObserver = null;
        // Timers that would otherwise reach a destroyed scene
        clearInterval(this._keySelPoll);
        this._keySelPoll = null;
        clearTimeout(this._keyInsertTimer);
        this._keyInsertTimer = null;
        clearTimeout(this.keyRetryTimer);
        this.keyRetryTimer = null;
        if (this._lockZoomOnResize) window.removeEventListener('resize', this._lockZoomOnResize);
        if (this._lockRefitOnResize) {
            window.removeEventListener('resize', this._lockRefitOnResize);
            window.removeEventListener('orientationchange', this._lockRefitOnResize);
            this._lockRefitOnResize = null;
        }
        clearTimeout(this._lockRefitTimer);
        this._lockRefitTimer = null;
        if (this._obsOnResize) window.removeEventListener('resize', this._obsOnResize);
        this._obsOnResize = null;
        this._lockScrollEls?.forEach((el) => el.removeEventListener("scroll", this._lockScrollUpdate));
        if (this._obsEl) {
            if (this._obsClick) this._obsEl.removeEventListener('click', this._obsClick);
            if (this._obsKey) this._obsEl.removeEventListener('keydown', this._obsKey);
        }
    }

    // endMinigame and the displacement paths call cleanup() without complete(): release the
    // watchers and the Phaser game there too (complete() has already done both, harmlessly)
    cleanup() {
        this._releaseLockWatchers();
        this.lockLabels?.dispose();
        if (this.game) {
            try { this.game.destroy(true); } catch (e) { /* already gone */ }
            this.game = null;
        }
        super.cleanup();
    }

    _watchLockZoom() {
        this._watchLockScroll();
        this._watchLockRefit();
        if (window.innerWidth <= 768 || window.innerHeight <= 560) return;
        const fit = () => this._fitLockZoom();
        const fitSticky = () => this._fitLockZoom(false);
        this._lockZoomOnResize = fit;
        window.addEventListener('resize', fit);
        this._fitOnFontsReady();
        // The feedback box grows and shrinks with its text (one line to four) and takes room
        // from the lock, so the zoom follows it without a window resize
        if (typeof ResizeObserver !== 'undefined' && this.feedback) {
            this._lockFeedbackObserver = new ResizeObserver(() => fitSticky());
            this._lockFeedbackObserver.observe(this.feedback);
        }
        requestAnimationFrame(fit);
        setTimeout(fit, 300);
    }

    startWithKeySelection(inventoryKeys = null, correctKeyId = null) {
        // Start the minigame with key selection instead of a default key
        // inventoryKeys: array of keys from inventory (optional)
        // correctKeyId: ID of the correct key (optional)
        
        this.keySelectionMode = true; // Mark that we're in key selection mode
        
        // The Phaser scene is initialised asynchronously: its create() callback sets
        // this.scene, but that may not have fired by the time minigame-starters.js
        // calls us (500 ms after game creation).  Poll until the scene is ready.
        if (!this.scene) {
            clearInterval(this._keySelPoll);
            this._keySelPoll = setInterval(() => {
                if (this.scene) {
                    clearInterval(this._keySelPoll);
                    this._keySelPoll = null;
                    this._doStartWithKeySelection(inventoryKeys, correctKeyId);
                }
            }, 50);
            return;
        }

        this._doStartWithKeySelection(inventoryKeys, correctKeyId);
    }

    _doStartWithKeySelection(inventoryKeys, correctKeyId) {
        // Store the original inventory keys and correct key ID for use when retrying after wrong selection
        if (inventoryKeys && inventoryKeys.length > 0) {
            this.originalInventoryKeys = inventoryKeys;
            this.originalCorrectKeyId = correctKeyId;
            // Use provided inventory keys
            this.keySelection.createKeysFromInventory(inventoryKeys, correctKeyId);
        } else {
            // Generate random keys for challenge
            this.keySelection.createKeysForChallenge(correctKeyId || 'challenge_key');
        }
    }
    
    createKeyBladeCollision() {
        // Method moved to KeyOperations module - call via this.keyOps.createKeyBladeCollision()
        this.keyOps.createKeyBladeCollision();
    }
    
    update() {
        // Skip normal lockpicking logic if in key mode
        if (this.keyMode) {
            return;
        }
        
        if (this.lockState.currentPin && this.gameState.mouseDown) {
            this.pinMgmt.liftPin();
        }
        
        // Apply gravity when tension is not applied (but not when actively lifting)
        if (!this.lockState.tensionApplied && !this.gameState.mouseDown) {
            this.pinMgmt.applyGravity();
        }
        
        // Apply gravity to non-binding pins even with tension
        if (this.lockState.tensionApplied && !this.gameState.mouseDown) {
            this.pinMgmt.applyGravity();
        }
        
        // Check if all pins are correctly positioned when tension is applied
        if (this.lockState.tensionApplied) {
            this.pinMgmt.checkAllPinsCorrect();
        }
        
        // Hook return is now handled directly in pointerup event
    }
    
    complete(success) {
        if (this.game) {
            this._releaseLockWatchers();
            this.game.destroy(true);
            this.game = null;
        }
        if (success) {
            // Which way it opened: a key from key mode, or the pick (callers route on this)
            this.gameResult = { ...(this.gameResult || {}), method: this.keyMode ? 'key' : 'lockpick' };
        }
        super.complete(success, this.gameResult);
    }
    
} 