/**
 * PersonChatPortraits - Portrait Rendering System
 * 
 * Renders character portraits using Phaser sprite frames at 4x zoom.
 * - Player portraits face right
 * - NPC portraits face left
 * 
 * @module person-chat-portraits
 */

import { ASSETS_PATH } from '../../config.js';
import { textToVisemes, scaleTimeline, holdTimeline, visemeAt, buildVisemeColumnMap, isBlinking, seedFrom } from './lip-sync.js';

// Sprite sheets with no derivable portrait (e.g. prop sprites like hospital beds).
// Remembered after the first failed lookup so later conversations skip the 404s.
const spritesWithoutTalkImage = new Set();

// spriteVisemes path → loaded sheet ({ image, frameSize, columns }) or null when it failed.
// Pending loads live in visemeSheetLoads so speaker switches never fetch a sheet twice.
const visemeSheets = new Map();
const visemeSheetLoads = new Map();

/**
 * Resolve a scenario asset path ("assets/…" or relative) to a URL.
 * @param {string} path
 * @returns {string}
 */
function resolveAssetUrl(path) {
    if (path.startsWith('/') || path.startsWith('http')) return path;
    return path.startsWith('assets/') ? `/break_escape/${path}` : `${ASSETS_PATH}/${path}`;
}

/**
 * Load a lip-sync viseme sheet: `<key>_visemes.png` (one row of frameSize×frameSize cells)
 * plus `<key>_visemes.json` beside it naming each column. Resolves to null on any failure.
 * @param {string} path - spriteVisemes value
 * @returns {Promise<Object|null>}
 */
function loadVisemeSheet(path) {
    if (visemeSheetLoads.has(path)) return visemeSheetLoads.get(path);

    const imageLoad = new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('image failed to load'));
        img.src = resolveAssetUrl(path);
    });
    const metaLoad = fetch(resolveAssetUrl(path.replace(/\.png$/i, '.json')))
        .then(r => { if (!r.ok) throw new Error(`JSON HTTP ${r.status}`); return r.json(); });

    const load = Promise.all([imageLoad, metaLoad]).then(([image, meta]) => {
        const frameSize = meta.frameSize || 128;
        const names = Array.isArray(meta.visemes) ? meta.visemes : [];
        const columns = Math.min(names.length, Math.floor(image.width / frameSize));
        if (columns < 1 || image.height < frameSize) throw new Error('sheet does not match its JSON');
        const sheet = { image, frameSize, columns, columnFor: buildVisemeColumnMap(names.slice(0, columns)) };
        visemeSheets.set(path, sheet);
        return sheet;
    }).catch(error => {
        console.warn(`⚠️ Viseme sheet unavailable (${path}): ${error.message} — using spriteTalk`);
        visemeSheets.set(path, null);
        return null;
    });
    visemeSheetLoads.set(path, load);
    return load;
}

export default class PersonChatPortraits {
    /**
     * Create portrait renderer
     * @param {Phaser.Game} game - Phaser game instance
     * @param {Object} npc - NPC data with sprite information
     * @param {HTMLElement} portraitContainer - Container for portrait canvas
     * @param {string} background - Optional background image path
     * @param {Object} options - Optional rendering tweaks
     * @param {boolean} options.noShift - Skip the 20% "look-away" horizontal shift (used for the
     *                                    small picture-in-picture self-view so the face stays centred)
     * @param {boolean} options.sizeToContainer - Size the canvas to THIS container instead of the
     *                                    full-screen #game-container (used for the PiP box)
     */
    constructor(game, npc, portraitContainer, background = null, options = {}) {
        this.game = game;
        this.npc = npc;
        this.portraitContainer = portraitContainer;
        this.backgroundPath = background; // Optional background image path
        this.noShift = !!options.noShift;             // PiP self-view: keep the face centred
        this.sizeToContainer = !!options.sizeToContainer; // PiP self-view: size to its own box
        this._resizeHandler = null;                   // Stored so destroy() can remove it (no leak)
        
        // Portrait settings
        this.spriteSize = 64; // Base sprite size
        this.zoomLevel = 4; // 4x zoom
        this.portraitWidth = this.spriteSize * this.zoomLevel; // 256px
        this.portraitHeight = this.spriteSize * this.zoomLevel; // 256px
        
        // Canvas and context
        this.canvas = null;
        this.ctx = null;
        
        // Background image
        this.backgroundImage = null; // Loaded background image
        this.parallaxStartTime = Date.now(); // Track time for parallax animation
        this.animationFrameId = null; // Track animation frame for cleanup
        
        // Sprite info
        this.spriteSheet = null;
        this.frameIndex = null;
        this.spriteTalkImage = null; // Loaded *_talk.png (single frame OR 2×2 spritesheet)
        this.talkImageSrc = null; // Resolved path: explicit spriteTalk or derived from spriteSheet
        this.useSpriteTalk = false; // Whether to use spriteTalk instead of spriteSheet
        this.flipped = false; // Whether to flip the sprite horizontally
        this.facingDirection = npc.id === 'player' ? 'right' : 'left';

        // TTS mouth animation
        this.ttsManager = null; // Set via setTTSManager() from the minigame
        this._loadingSpriteTalkImage = false; // Guard against duplicate loads
        this._lastRenderedTalkFrame = -1;  // Sentinel – forces first render
        this._narratorMode = false; // When true, suppress mouth animation (narrator lines)

        // Lip-sync mode (optional spriteVisemes sheet; replaces the 2×2 talk cycle when loaded)
        this.visemeSheet = null;      // Loaded sheet for the current speaker, or null
        this._visemesPending = false; // Sheet still loading: hold rendering so the talk image doesn't flash
        this._visemeTimeline = null;  // Cached timeline for the line now playing
        this._visemeTimelineKey = null;
        
        console.log(`🖼️ Portrait renderer created for NPC: ${npc.id}${background ? ` with background: ${background}` : ''}`);
    }
    
    /**
     * Initialize portrait display in container
     * Creates canvas and renders sprite frame
     */
    init() {
        if (!this.portraitContainer) {
            console.warn('❌ Portrait container not found');
            return false;
        }
        
        try {
            // Create canvas
            this.canvas = document.createElement('canvas');
            
            this.canvas.className = 'person-chat-portrait';
            this.canvas.id = `portrait-${this.npc.id}`;
            this.ctx = this.canvas.getContext('2d');
            
            // Style canvas for pixel-art rendering
            this.canvas.style.imageRendering = 'pixelated';
            this.canvas.style.imageRendering = '-moz-crisp-edges';
            this.canvas.style.imageRendering = 'crisp-edges';
            this.canvas.style.display = 'block';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            
            // Add to container first so it has dimensions
            this.portraitContainer.innerHTML = '';
            this.portraitContainer.appendChild(this.canvas);
            
            // Get sprite sheet and frame
            this.setupSpriteInfo();
            
            // Load background image if provided
            if (this.backgroundPath) {
                this.loadBackgroundImage();
            }
            
            // Set canvas size after it's in the DOM (container now has dimensions)
            // Use a small delay to ensure container is fully laid out
            setTimeout(() => {
                this.updateCanvasSize();
                this.render();
            }, 0);
            
            // Also set initial size immediately (in case container is already sized)
            this.updateCanvasSize();
            this.render();
            
            // Handle window resize (store the handler so destroy() can remove it — no leak)
            this._resizeHandler = () => this.handleResize();
            window.addEventListener('resize', this._resizeHandler);
            
            // Parallax animation will start automatically when background image loads
            
            console.log(`✅ Portrait initialized for ${this.npc.id} (${this.canvas.width}x${this.canvas.height})`);
            return true;
        } catch (error) {
            console.error('❌ Error initializing portrait:', error);
            return false;
        }
    }
    
    /**
     * Calculate optimal integer scale factor for current container
     * Uses 16:9 aspect ratio (640x360) for landscape, 4:3 (640x480) for portrait
     * @returns {Object} Object with scale, baseWidth, and baseHeight
     */
    calculateOptimalScale() {
        // The PiP self-view sizes to its own small box; the full-screen portrait uses #game-container.
        const gameContainer = this.sizeToContainer ? null : document.getElementById('game-container');
        const container = gameContainer || this.portraitContainer;
        
        if (!container) {
            return { scale: 2, baseWidth: 640, baseHeight: 360 }; // Default fallback (landscape)
        }
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Determine orientation: landscape (width > height) or portrait (height > width)
        const isLandscape = containerWidth > containerHeight;
        
        // Base resolution based on orientation
        // 16:9 for landscape (HD widescreen), 4:3 for portrait
        const baseWidth = 640;
        const baseHeight = isLandscape ? 360 : 480; // 16:9 for landscape, 4:3 for portrait
        
        // Calculate scale factors for both dimensions
        const scaleX = containerWidth / baseWidth;
        const scaleY = containerHeight / baseHeight;
        
        // Use the smaller scale to maintain aspect ratio
        const maxScale = Math.min(scaleX, scaleY);
        
        // Find the best integer scale factor (prefer 2x or higher for pixel art)
        let bestScale = 2; // Minimum for good pixel art
        
        // Check integer scales from 2x up to the maximum that fits
        for (let scale = 2; scale <= Math.floor(maxScale); scale++) {
            const scaledWidth = baseWidth * scale;
            const scaledHeight = baseHeight * scale;
            
            // If this scale fits within the container, use it
            if (scaledWidth <= containerWidth && scaledHeight <= containerHeight) {
                bestScale = scale;
            } else {
                break; // Stop at the largest scale that fits
            }
        }
        
        return { scale: bestScale, baseWidth, baseHeight };
    }
    
    /**
     * Update canvas size to match available container space with pixel-perfect scaling
     * Uses 16:9 aspect ratio for landscape, 4:3 for portrait
     */
    updateCanvasSize() {
        if (!this.canvas) return;
        
        // Calculate optimal scale and base resolution based on orientation
        const { scale: optimalScale, baseWidth, baseHeight } = this.calculateOptimalScale();
        
        // Set canvas internal resolution to scaled resolution for pixel-perfect rendering
        this.canvas.width = baseWidth * optimalScale;
        this.canvas.height = baseHeight * optimalScale;
        
        // CSS handles the display sizing (width/height 100% with object-fit: contain)
        // The canvas internal resolution is set above for pixel-perfect rendering
        
        const aspectRatio = baseWidth / baseHeight;
        const orientation = baseHeight === 360 ? 'landscape (16:9)' : 'portrait (4:3)';
        console.log(`🎨 Canvas scaled to ${optimalScale}x (${this.canvas.width}x${this.canvas.height}px internal, ${orientation}, fits container)`);
    }
    
    /**
     * Handle canvas resize on window resize
     */
    handleResize() {
        if (!this.canvas) return;
        
        try {
            this.updateCanvasSize();
            this.render();
        } catch (error) {
            console.error('❌ Error resizing portrait:', error);
        }
    }
    
    /**
     * Start the animation loop (handles both parallax and TTS mouth animation).
     */
    startParallaxAnimation() {
        if (this.animationFrameId) {
            return; // Already running
        }
        this._runAnimationLoop();
    }

    /**
     * Unified animation loop handling both background parallax and TTS mouth animation.
     *
     * Parallax: re-renders for 2 s after speaker change.
     * Mouth:    re-renders only when the active talk-sheet frame index changes
     *           (~10 fps while speaking, one final render when speech stops).
     *
     * The loop polls cheaply at 60 fps while ttsManager is registered so it
     * reacts immediately when TTS starts, without requiring an external trigger.
     * @private
     */
    _runAnimationLoop() {
        const PARALLAX_DURATION = 2.0; // seconds

        const animate = () => {
            if (!this.canvas) {
                this.animationFrameId = null;
                return;
            }

            const elapsed = (Date.now() - this.parallaxStartTime) / 1000;
            const parallaxActive = !!this.backgroundImage && elapsed < PARALLAX_DURATION;

            // Mouth animation: only re-render when the frame index actually changes
            // (talk sheet ~5 fps while speaking, lip-sync once per viseme step;
            // once back to the rest frame when it stops)
            const currentFrame = this.visemeSheet ? this._getCurrentVisemeColumn() : this._getCurrentTalkFrame();
            const frameChanged = (this.visemeSheet || this._isTalkSheet()) &&
                                 currentFrame !== this._lastRenderedTalkFrame;

            if (parallaxActive || frameChanged) {
                this.render();
                this._lastRenderedTalkFrame = currentFrame;
            }

            // Keep loop alive while ttsManager is set (cheap boolean poll) or parallax runs
            if (this.ttsManager || parallaxActive) {
                this.animationFrameId = requestAnimationFrame(animate);
            } else {
                this.animationFrameId = null;
            }
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }
    
    /**
     * Stop parallax animation loop
     */
    stopParallaxAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * Reset and restart parallax animation (called when speaker changes)
     */
    resetParallaxAnimation() {
        // Stop current animation if running
        this.stopParallaxAnimation();
        
        // Reset start time to begin new animation
        this.parallaxStartTime = Date.now();
        
        // Restart animation if background is loaded
        if (this.backgroundImage) {
            this.startParallaxAnimation();
        }
    }
    
    /**
     * Resolve the talk portrait path for the current speaker.
     * Uses the explicit spriteTalk when set, otherwise derives it from the
     * spriteSheet using the {spriteSheet}_talk.png convention.
     * @returns {string|null} Path to try, or null when there is nothing to derive from
     * @private
     */
    _resolveTalkImageSrc() {
        if (this.npc.spriteTalk) return this.npc.spriteTalk;

        const sprite = this.npc.spriteSheet;
        if (!sprite || spritesWithoutTalkImage.has(sprite)) return null;

        // Legacy sprites use hyphen naming; all others follow {sprite}_talk.png
        const legacyMap = {
            'hacker': 'assets/characters/hacker-talk.png',
            'hacker-red': 'assets/characters/hacker-red-talk.png'
        };
        return legacyMap[sprite] || `assets/characters/${sprite}_talk.png`;
    }

    /**
     * Set up sprite sheet and frame information
     */
    setupSpriteInfo() {
        console.log(`🔍 setupSpriteInfo - this.npc.id: ${this.npc.id}, this.npc.spriteTalk: ${this.npc.spriteTalk}`);
        console.log(`🔍 setupSpriteInfo - full NPC object:`, this.npc);

        this._setupVisemeSheet();

        // Check for a talk portrait: explicit spriteTalk, or derived from spriteSheet
        const talkImageSrc = this._resolveTalkImageSrc();
        if (talkImageSrc) {
            console.log(`📸 Using talk image: ${talkImageSrc}${this.npc.spriteTalk ? '' : ' (derived from spriteSheet)'}`);
            this.talkImageSrc = talkImageSrc;
            this.useSpriteTalk = true;
            // Clear spriteTalkImage on speaker change to ensure correct dimensions are calculated
            // This ensures background scale is recalculated for each speaker's sprite size
            this.spriteTalkImage = null; // Will be loaded lazily on first render
            this._loadingSpriteTalkImage = false; // Reset lazy-load flag
            this._lastRenderedTalkFrame = -1;  // Force re-render after load
            this._headshotFallbackAttempted = false; // Reset fallback flag for new speaker
            this._baseTalkFallbackAttempted = false;
            // For NPCs with spriteTalk, flip the image to face right
            this.flipped = this.npc.id !== 'player';
            return;
        }
        
        // Otherwise use spriteSheet with frame
        console.log(`🔍 No talk image available, using spriteSheet`);
        this.useSpriteTalk = false;
        // Clear spriteTalkImage when switching to spriteSheet
        this.spriteTalkImage = null;
        this.talkImageSrc = null;
        
        if (this.npc.id === 'player') {
            // Player uses their sprite
            this.spriteSheet = 'hacker'; // Default player sprite
            // Use diagonal down-right frame (facing right/down)
            this.frameIndex = 20; // Diagonal down-right idle frame
            this.flipped = false; // Player not flipped
        } else {
            // NPC uses their configured sprite
            this.spriteSheet = this.npc.spriteSheet || 'hacker';
            // Use diagonal down-left frame (same frame as player's down-right, but flipped)
            this.frameIndex = 20; // Diagonal down idle frame
            this.flipped = true; // NPC is flipped to face left
        }
    }
    
    /**
     * Pick up the current speaker's spriteVisemes sheet (lip-sync mode), loading it if needed.
     * The player portrait is always static, so it never uses lip-sync.
     * @private
     */
    _setupVisemeSheet() {
        const path = this.npc.id !== 'player' ? this.npc.spriteVisemes : null;
        this._visemeTimeline = null;
        this._visemeTimelineKey = null;
        this.visemeSheet = null;
        this._visemesPending = false;
        if (!path) return;

        if (visemeSheets.has(path)) {
            this.visemeSheet = visemeSheets.get(path); // null when it failed before
            return;
        }

        this._visemesPending = true;
        loadVisemeSheet(path).then(sheet => {
            if (this.npc.spriteVisemes !== path || this.npc.id === 'player') return; // speaker changed meanwhile
            this.visemeSheet = sheet;
            this._visemesPending = false;
            this._lastRenderedTalkFrame = -1;
            this.render();
        });
    }

    /**
     * Returns which column of the viseme sheet to display this render cycle.
     * While TTS plays, the line's text is turned into a viseme timeline fitted to the audio's
     * loudness (tts.lipSync, see alignToEnvelope); before that is ready it is stretched over
     * the audio's duration and gated by the live level. The timeline is indexed by the audio
     * element's playback position. Reading the position each frame, rather than scheduling
     * timers, keeps it in step with pauses and skips and leaves nothing to clean up.
     * Shows "rest" when silent. Whenever the mouth is at rest (silent, or a pause in the
     * line) and the sheet has a "blink" column, the eyes shut briefly every few seconds.
     * @private
     */
    _getCurrentVisemeColumn() {
        const sheet = this.visemeSheet;
        if (!sheet) return 0; // sheet still loading for this speaker
        const rest = sheet.columnFor.rest;
        const blink = sheet.columnFor.blink;
        const restOrBlink = () =>
            (blink !== undefined && isBlinking(Date.now(), seedFrom(this.npc?.id)) ? blink : rest);
        const tts = this.ttsManager;
        if (this._narratorMode || !tts?.isPlaying() || !tts.currentText) return restOrBlink();

        const audio = tts.audio;
        const duration = audio && Number.isFinite(audio.duration) ? audio.duration * 1000 : null;
        // Prefer shapes fitted to the audio (TTSManager decodes each line); until that lands,
        // or if it failed, spread the text over the line and close the mouth in quiet moments.
        const aligned = tts.lipSync?.text === tts.currentText ? tts.lipSync.timeline : null;
        const key = `${duration}|${tts.currentText}|${aligned ? 'audio' : 'text'}`;
        if (key !== this._visemeTimelineKey) {
            this._visemeTimelineKey = key;
            this._visemeTimeline = aligned ||
                holdTimeline(scaleTimeline(textToVisemes(tts.currentText), duration));
        }
        let viseme = visemeAt(this._visemeTimeline, (audio?.currentTime || 0) * 1000);
        if (!aligned && tts._analyser && !tts.isSpeaking()) viseme = 'rest';
        const col = sheet.columnFor[viseme] ?? rest;
        return col === rest ? restOrBlink() : col;
    }

    /**
     * Register the TTSManager so mouth animation can be driven by real audio amplitude.
     * Call this after portrait initialisation from the parent minigame.
     * @param {TTSManager} manager
     */
    setTTSManager(manager) {
        this.ttsManager = manager;
        // Ensure the animation loop is running so it can pick up TTS starts
        if (this.canvas && !this.animationFrameId) {
            this._runAnimationLoop();
        }
    }

    /**
     * Returns true when the loaded spriteTalk image is a 2×2 spritesheet
     * (256×256 or any larger even-square image).  Single-frame images (128×128
     * or smaller) are treated as a static portrait without mouth animation.
     * @private
     */
    _isTalkSheet() {
        return !!this.spriteTalkImage &&
               this.spriteTalkImage.width >= 256 &&
               this.spriteTalkImage.width === this.spriteTalkImage.height &&
               this.spriteTalkImage.width % 2 === 0;
    }

    /**
     * Returns the logical frame size of the spriteTalk image.
     * For a 2×2 sheet this is half the image width; for a single frame it is the full width.
     * @private
     */
    _getTalkFrameSize() {
        if (this.visemeSheet) return this.visemeSheet.frameSize;
        if (!this.spriteTalkImage) return 0;
        return this._isTalkSheet()
            ? this.spriteTalkImage.width / 2
            : this.spriteTalkImage.width;
    }

    /**
     * Returns which frame of the 2×2 talk sheet to display this render cycle.
     *   Frame 0 – closed mouth  (top-left)     → shown when silent
     *   Frame 1 – open pose A   (top-right)     ┐
     *   Frame 2 – open pose B   (bottom-left)   ├ cycle while speaking (~10 fps)
     *   Frame 3 – open pose C   (bottom-right)  ┘
     * @private
     */
    _getCurrentTalkFrame() {
        if (!this._isTalkSheet()) return 0;
        if (this._narratorMode) return 0;
        if (this.npc.id === 'player') return 0; // player portrait is always static
        if (this.ttsManager?.isSpeaking()) {
            return (Math.floor(Date.now() / 200) % 3) + 1; // 1 → 2 → 3 → 1 …
        }
        return 0;
    }

    /**
     * Enable or disable narrator mode.
     * In narrator mode the portrait stays visible but mouth animation is suppressed.
     * @param {boolean} enabled
     */
    setNarratorMode(enabled) {
        this._narratorMode = !!enabled;
    }

    /**
     * Load background image if path is provided
     */
    loadBackgroundImage() {
        if (!this.backgroundPath) return;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            this.backgroundImage = img;
            console.log(`✅ Background image loaded: ${this.backgroundPath}`);
            // Re-render when background loads
            this.render();
            // Start parallax animation now that background is loaded
            this.startParallaxAnimation();
        };
        
        img.onerror = () => {
            console.error(`❌ Failed to load background image: ${this.backgroundPath}`);
            this.backgroundImage = null;
        };
        
        // Resolve path to full URL if relative
        let bgSrc = this.backgroundPath;
        if (!bgSrc.startsWith('/') && !bgSrc.startsWith('http')) {
            // Relative path - prepend appropriate base
            if (bgSrc.startsWith('assets/')) {
                bgSrc = `/break_escape/${bgSrc}`;
            } else {
                bgSrc = `${ASSETS_PATH}/${bgSrc}`;
            }
        }
        img.src = bgSrc;
    }
    
    /**
     * PHASE 4.5: Change background to a new image
     * @param {string} newBackgroundPath - Path to new background image
     */
    setBackground(newBackgroundPath) {
        if (!newBackgroundPath) {
            console.warn('⚠️ setBackground: No background path provided');
            return;
        }
        
        this.backgroundPath = newBackgroundPath;
        this.backgroundImage = null; // Clear old image
        console.log(`🎨 Setting new background: ${newBackgroundPath}`);
        this.loadBackgroundImage();
    }
    
    /**
     * Draw background image at same pixel scale as character sprite
     * Fills the canvas while maintaining sprite's pixel scale (may extend beyond canvas if larger)
     * Aligns based on speaker position: right edge for NPCs (flipped), left edge for player (not flipped)
     * @param {number} spriteScale - The scale factor used for the sprite (must match sprite scale exactly)
     */
    drawBackground(spriteScale) {
        if (!this.backgroundImage || !this.ctx || !this.canvas || !spriteScale) return;
        
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const imgWidth = this.backgroundImage.width;
        const imgHeight = this.backgroundImage.height;
        
        // Use the exact same scale as the sprite
        let scale = spriteScale;
        
        // Calculate scaled dimensions using the sprite's scale
        let scaledWidth = imgWidth * scale;
        let scaledHeight = imgHeight * scale;
        
        // If background is smaller than canvas, scale it up to fill (cover style)
        // This ensures the background always fills the canvas while maintaining aspect ratio
        if (scaledWidth < canvasWidth || scaledHeight < canvasHeight) {
            const fillScaleX = canvasWidth / imgWidth;
            const fillScaleY = canvasHeight / imgHeight;
            const fillScale = Math.max(fillScaleX, fillScaleY); // Cover style to fill canvas
            scale = fillScale;
            scaledWidth = imgWidth * scale;
            scaledHeight = imgHeight * scale;
        }
        
        // Position based on speaker alignment to fill canvas:
        // - NPC (flipped, appears on right): align right edge to canvas right edge
        // - Player (not flipped, appears on left): align left edge to canvas left edge
        let x;
        if (this.flipped) {
            // NPC on right: align background's right edge to canvas right edge
            x = canvasWidth - scaledWidth;
        } else {
            // Player on left: align background's left edge to canvas left edge
            x = 0;
        }
        
        // Fill canvas vertically - center if larger, align to top if exactly filling
        let y;
        if (scaledHeight > canvasHeight) {
            // Background larger than canvas: center vertically (will extend above/below)
            y = (canvasHeight - scaledHeight) / 2;
        } else {
            // Background fills or is exactly canvas height: align to top
            y = 0;
        }
        
        // Calculate subtle parallax effect - move background towards sprite once and stop
        const elapsed = (Date.now() - this.parallaxStartTime) / 1000; // Time in seconds
        const parallaxDuration = 1.0; // Duration of movement in seconds
        const maxParallaxAmount = 10; // Maximum parallax offset in pixels
        
        // Calculate parallax amount: moves from 0 to maxParallaxAmount over duration, then stops
        let parallaxAmount = 0;
        if (elapsed < parallaxDuration) {
            // Ease-out animation: starts fast, slows down as it approaches target
            const progress = elapsed / parallaxDuration; // 0 to 1
            const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
            parallaxAmount = easedProgress * maxParallaxAmount;
        } else {
            // Movement complete, stay at max position
            parallaxAmount = maxParallaxAmount;
        }
        
        // Move background towards sprite (towards center)
        // NPC on right: move left (negative), Player on left: move right (positive)
        const parallaxOffset = this.flipped ? parallaxAmount : -parallaxAmount;
        x += parallaxOffset;
        
        // Draw background image at same pixel scale as sprite
        // Note: Canvas will clip anything outside its bounds, but background may extend beyond
        this.ctx.imageSmoothingEnabled = false; // Pixel-perfect rendering
        this.ctx.drawImage(
            this.backgroundImage,
            x, y, // Destination position (with parallax offset)
            scaledWidth, scaledHeight // Destination size (scaled to match sprite scale exactly)
        );
    }
    
    /**
     * Render the portrait using Phaser texture or spriteTalk image, scaled to fill canvas
     */
    render() {
        if (!this.canvas || !this.ctx) return;
        
        try {
            // console.log(`🎨 render() called - useSpriteTalk: ${this.useSpriteTalk}, spriteSheet: ${this.spriteSheet}`);
            
            // Clear canvas
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Lip-sync mode: draw the current viseme column
            if (this.visemeSheet) {
                const scale = this.calculateSpriteTalkScale();
                if (this.backgroundImage && scale) {
                    this.drawBackground(scale);
                }
                const size = this.visemeSheet.frameSize;
                this.drawPortraitFrame(this.visemeSheet.image,
                    this._getCurrentVisemeColumn() * size, 0, size, size);
                return;
            }
            // Viseme sheet still loading: keep the frame empty rather than flash the talk image
            if (this._visemesPending) {
                return;
            }

            // If using spriteTalk image, render that instead
            if (this.useSpriteTalk) {
                // console.log(`🎨 Rendering spriteTalk image path`);
                // Calculate sprite scale for spriteTalk
                const spriteTalkScale = this.calculateSpriteTalkScale();
                // Draw background with sprite scale if loaded
                if (this.backgroundImage && spriteTalkScale) {
                    this.drawBackground(spriteTalkScale);
                }
                this.renderSpriteTalkImage();
                return;
            }
            
            console.log(`🎨 Rendering spriteSheet path - spriteSheet: ${this.spriteSheet}, frame: ${this.frameIndex}`);
            
            // Get Phaser texture
            const texture = this.game.textures.get(this.spriteSheet);
            if (!texture || texture.key === '__MISSING') {
                console.warn(`⚠️ Texture not found: ${this.spriteSheet}`);
                this.renderPlaceholder();
                return;
            }
            
            // Get the frame
            const frame = texture.get(this.frameIndex);
            if (!frame) {
                console.warn(`⚠️ Frame ${this.frameIndex} not found in ${this.spriteSheet}`);
                this.renderPlaceholder();
                return;
            }
            
            // Get the source image
            const source = frame.source.image;
            
            // Calculate scaling to fit sprite within canvas while maintaining aspect ratio
            // Use Math.min to ensure full sprite is visible (contain style, not cover)
            const spriteWidth = frame.cutWidth;
            const spriteHeight = frame.cutHeight;
            const canvasWidth = this.canvas.width;
            const canvasHeight = this.canvas.height;
            
            let scaleX = canvasWidth / spriteWidth;
            let scaleY = canvasHeight / spriteHeight;
            let scale = Math.min(scaleX, scaleY); // Fit contain style - ensures full sprite visible
            
            // Draw background with sprite scale if loaded
            if (this.backgroundImage) {
                this.drawBackground(scale);
            }
            
            // Calculate position to center the sprite
            const scaledWidth = spriteWidth * scale;
            const scaledHeight = spriteHeight * scale;
            let x = (canvasWidth - scaledWidth) / 2;
            const y = (canvasHeight - scaledHeight) / 2;
            
            // Shift sprite 20% away from the direction they're facing
            // Shifting left works for both flipped and non-flipped due to coordinate transform
            // NPCs (flipped) appear on right, Player (not flipped) appears on left
            const shiftAmount = this.noShift ? 0 : canvasWidth * 0.2;
            x -= shiftAmount;
            
            // Draw the sprite frame scaled to fill canvas with optional flip
            this.ctx.imageSmoothingEnabled = false;
            
            if (this.flipped) {
                // Save current state, flip horizontally, draw, restore
                this.ctx.save();
                this.ctx.translate(canvasWidth / 2, 0);
                this.ctx.scale(-1, 1);
                this.ctx.drawImage(
                    source,
                    frame.cutX, frame.cutY, // Source position
                    frame.cutWidth, frame.cutHeight, // Source size
                    x - canvasWidth / 2, y, // Destination position
                    scaledWidth, scaledHeight // Destination size (scaled)
                );
                this.ctx.restore();
            } else {
                // Draw normally
                this.ctx.drawImage(
                    source,
                    frame.cutX, frame.cutY, // Source position
                    frame.cutWidth, frame.cutHeight, // Source size
                    x, y, // Destination position
                    scaledWidth, scaledHeight // Destination size (scaled)
                );
            }
            
        } catch (error) {
            console.error('❌ Error rendering portrait:', error);
            this.renderPlaceholder();
        }
    }
    
    /**
     * Render the spriteTalk portrait, selecting the correct frame from the 2×2
     * spritesheet based on current TTS amplitude (noise-gate).
     *
     * If the loaded image is a 2×2 sheet (≥256×256 square):
     *   - Frame 0 (top-left)  → closed mouth  – shown when TTS is silent
     *   - Frames 1-3 cycle    → talking poses  – shown while TTS amplitude > threshold
     * If the image is a single frame (< 256px), it is rendered as before.
     */
    renderSpriteTalkImage() {
        if (!this.ctx || !this.canvas) return;

        if (!this.spriteTalkImage) {
            this._startLoadingSpriteTalkImage();
            return;
        }

        this.drawSpriteTalkImage(this.spriteTalkImage, this._getCurrentTalkFrame());
    }

    /**
     * Begin loading the mouth-closed spriteTalk image (idempotent).
     * Called lazily the first time it is needed.
     * @private
     */
    _startLoadingSpriteTalkImage() {
        if (this._loadingSpriteTalkImage) return; // already in flight
        this._loadingSpriteTalkImage = true;

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            this.spriteTalkImage = img;
            this._loadingSpriteTalkImage = false;
            this._lastRenderedTalkFrame = -1; // force next loop tick to re-render
            // Trigger an immediate render so the portrait appears without waiting
            // for the next animation loop tick
            this.render();
        };

        img.onerror = () => {
            this._loadingSpriteTalkImage = false;
            // A redrawn <key>_v2 sprite without a talk sheet of its own uses the original
            // <key>_talk.png, as scenarios do explicitly for v2 NPCs (female_nurse1_v2)
            if (!this._baseTalkFallbackAttempted && this.talkImageSrc && /_v2_talk\.\w+$/.test(this.talkImageSrc)) {
                this._baseTalkFallbackAttempted = true;
                this.talkImageSrc = this.talkImageSrc.replace(/_v2_talk(\.\w+)$/, '_talk$1');
                this._startLoadingSpriteTalkImage();
                return;
            }
            // If _talk.png failed, try the _headshot.png equivalent before giving up
            if (!this._headshotFallbackAttempted && this.talkImageSrc && /[_-]talk\.\w+$/.test(this.talkImageSrc)) {
                this._headshotFallbackAttempted = true;
                this.talkImageSrc = this.talkImageSrc.replace(/[_-]talk(\.\w+)$/, '_headshot$1');
                this._startLoadingSpriteTalkImage();
                return;
            }
            console.warn(`⚠️ No talk image found for ${this.npc.id} (${this.talkImageSrc}), falling back to sprite`);
            // Only remember derived misses — an explicit spriteTalk is the author's call
            if (!this.npc.spriteTalk && this.npc.spriteSheet) {
                spritesWithoutTalkImage.add(this.npc.spriteSheet);
            }
            this.useSpriteTalk = false;
            this.spriteSheet = this.npc.spriteSheet || (this.npc.id === 'player' ? 'hacker' : 'hacker');
            this.frameIndex = 20;
            this.flipped = this.npc.id !== 'player';
            this.render();
        };

        let imageSrc = this.talkImageSrc;
        if (!imageSrc) {
            this._loadingSpriteTalkImage = false;
            this.useSpriteTalk = false;
            return;
        }
        if (!imageSrc.startsWith('/') && !imageSrc.startsWith('http')) {
            imageSrc = imageSrc.startsWith('assets/')
                ? `/break_escape/${imageSrc}`
                : `${ASSETS_PATH}/${imageSrc}`;
        }
        img.src = imageSrc;
    }
    
    /**
     * Calculate contain-fit scale for the active talk frame against the canvas.
     * For a 2×2 spritesheet the scale is based on the per-frame size (half width/height),
     * keeping the rendered character the same size regardless of sheet dimensions.
     * @returns {number|null}
     */
    calculateSpriteTalkScale() {
        const frameSize = this._getTalkFrameSize();
        if (!frameSize || !this.canvas) return null;
        return Math.min(this.canvas.width / frameSize, this.canvas.height / frameSize);
    }

    /**
     * Draw one frame of the spriteTalk image (or the whole image for single-frame portraits).
     *
     * For a 2×2 spritesheet the frame layout is:
     *   col 0, row 0  →  frame 0 (top-left)
     *   col 1, row 0  →  frame 1 (top-right)
     *   col 0, row 1  →  frame 2 (bottom-left)
     *   col 1, row 1  →  frame 3 (bottom-right)
     *
     * @param {HTMLImageElement} img        - The loaded spriteTalk image
     * @param {number}           frameIndex - 0-3 for sheet; ignored for single-frame
     */
    drawSpriteTalkImage(img, frameIndex = 0) {
        // Determine source crop rectangle
        let srcX, srcY, srcW, srcH;
        if (this._isTalkSheet()) {
            srcW = img.width / 2;
            srcH = img.height / 2;
            srcX = (frameIndex % 2) * srcW;         // col 0 or 1
            srcY = Math.floor(frameIndex / 2) * srcH; // row 0 or 1
        } else {
            // Single-frame – use the whole image
            srcX = 0; srcY = 0; srcW = img.width; srcH = img.height;
        }
        this.drawPortraitFrame(img, srcX, srcY, srcW, srcH);
    }

    /**
     * Draw a source rectangle of a portrait image (talk sheet frame or viseme column)
     * contain-fitted to the canvas, shifted and flipped for the speaker's side.
     * @param {HTMLImageElement} img
     * @param {number} srcX
     * @param {number} srcY
     * @param {number} srcW
     * @param {number} srcH
     */
    drawPortraitFrame(img, srcX, srcY, srcW, srcH) {
        if (!this.ctx || !this.canvas) return;

        try {
            const canvasWidth = this.canvas.width;
            const canvasHeight = this.canvas.height;

            // Scale the frame to fit the canvas (contain style)
            const scale = Math.min(canvasWidth / srcW, canvasHeight / srcH);
            const scaledWidth = srcW * scale;
            const scaledHeight = srcH * scale;

            // Center, then shift 20% away from the direction the character faces
            // (skipped for the PiP self-view so the face stays centred in its small box)
            const shift = this.noShift ? 0 : canvasWidth * 0.2;
            let x = (canvasWidth - scaledWidth) / 2 - shift;
            const y = (canvasHeight - scaledHeight) / 2;

            this.ctx.imageSmoothingEnabled = false;

            if (this.flipped) {
                this.ctx.save();
                this.ctx.translate(canvasWidth / 2, 0);
                this.ctx.scale(-1, 1);
                this.ctx.drawImage(img,
                    srcX, srcY, srcW, srcH,                  // source crop
                    x - canvasWidth / 2, y, scaledWidth, scaledHeight); // dest
                this.ctx.restore();
            } else {
                this.ctx.drawImage(img,
                    srcX, srcY, srcW, srcH,                  // source crop
                    x, y, scaledWidth, scaledHeight);         // dest
            }
        } catch (error) {
            console.error('❌ Error drawing spriteTalk image:', error);
            this.renderPlaceholder();
        }
    }
    
    /**
     * Render a placeholder when sprite unavailable
     */
    renderPlaceholder() {
        if (!this.ctx || !this.canvas) return;
        
        // Draw colored rectangle
        this.ctx.fillStyle = this.npc.id === 'player' ? '#2d5a8f' : '#8f2d2d';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw label
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            this.npc.displayName || this.npc.id,
            this.canvas.width / 2,
            this.canvas.height / 2
        );
    }
    
    /**
     * PHASE 4: Clear the portrait canvas (for narrator mode without portrait)
     */
    clearPortrait() {
        if (!this.canvas || !this.ctx) return;
        
        // Clear canvas to black
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw placeholder text
        this.ctx.fillStyle = '#666';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            'Narrator',
            this.canvas.width / 2,
            this.canvas.height / 2
        );
        
        console.log('🖼️ Portrait cleared for narrator mode');
    }
    
    /**
     * Destroy portrait and cleanup
     */
    destroy() {
        // Stop parallax / mouth animation loop
        this.stopParallaxAnimation();

        // Remove the resize listener registered in init() (otherwise it leaks per conversation)
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }

        // Drop the ttsManager reference so the animation loop's keep-alive check goes false
        this.ttsManager = null;

        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.ctx = null;
        console.log(`✅ Portrait destroyed for ${this.npc.id}`);
    }
}
