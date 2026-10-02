import { MinigameScene } from '../framework/base-minigame.js';
import { normaliseSample, ratingForQuality } from '../../systems/biometric-samples.js';
import { generatePrint, drawPrint } from '../dusting/fingerprint-generator.js';
import { drawSampleThumbnail } from './fingerprint-reader-minigame.js';
import { labelForSample, percent, FIELD_NOTES } from './fingerprint-reader-helpers.js';
import { applyArtSlot } from './fingerprint-art.js';
import { displayDashes } from '../../utils/display-dashes.js';

// A surface that has given a lift this good is done: the kit skips it.
const EXCELLENT_LIFT = 0.85;

// Biometrics Minigame Scene implementation (the fingerprint kit panel)
export class BiometricsMinigame extends MinigameScene {
    constructor(container, params) {
        // Ensure params is defined before calling parent constructor
        params = params || {};
        
        // Set default title if not provided
        params.title = 'Biometric Scanner';
        
        // Enable cancel button for biometrics minigame with custom text
        params.showCancel = true;
        params.cancelText = 'Close Scanner';
        
        super(container, params);
        
        this.item = params.item;
        this.searchingMode = false;
        this.highlightedObjects = [];
    }
    
    init() {
        // Call parent init to set up common components
        super.init();
        
        // Set container dimensions to be compact like the Bluetooth scanner
        this.container.className += ' biometrics-minigame-container';
        
        // Clear header content
        this.headerElement.innerHTML = '';
        
        // Configure game container with scanner background
        this.gameContainer.className += ' biometrics-minigame-game-container';
        
        // Create scanner interface
        this.createScannerInterface();
        
        // Show the samples already held
        this.updateBiometricsPanel();
    }
    
    createScannerInterface() {
        // Create expand/collapse toggle button
        const expandToggle = document.createElement('div');
        expandToggle.className = 'biometrics-expand-toggle';
        expandToggle.innerHTML = '▼';
        expandToggle.title = 'Expand/Collapse';
        expandToggle.setAttribute('role', 'button');
        expandToggle.setAttribute('tabindex', '0');
        expandToggle.setAttribute('aria-label', 'Expand or collapse the scanner panel');
        
        // Create scanner header
        const scannerHeader = document.createElement('div');
        scannerHeader.className = 'biometrics-scanner-header';
        scannerHeader.innerHTML = `
            <div class="biometrics-scanner-title">
                <img src="/break_escape/assets/objects/fingerprint.png" alt="Biometric Samples" class="scanner-icon">
                <span>Biometric Samples</span>
                <span class="samples-count-header">0 samples</span>
            </div>
            <div class="biometrics-scanner-status">
                <div class="scanner-indicator active"></div>
                <span>Ready</span>
            </div>
        `;
        
        // Create search room button (above samples list)
        const searchRoomContainer = document.createElement('div');
        searchRoomContainer.className = 'biometrics-search-room-container';
        searchRoomContainer.innerHTML = `
            <button id="search-room-btn" class="biometrics-action-btn">
                <span class="btn-icon btn-icon-search" aria-hidden="true"></span>
                <span class="btn-text">Search Room for Fingerprints</span>
            </button>
        `;
        
        // Create controls container (for expanded view)
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'biometrics-scanner-controls';
        controlsContainer.innerHTML = `
            <div class="biometrics-search-container">
                <input type="text" id="biometrics-search" placeholder="Search samples..." class="biometrics-search-input">
            </div>
            <div class="biometrics-categories">
                <div class="biometrics-category active" data-category="all">All</div>
                <div class="biometrics-category" data-category="fingerprint">Fingerprints</div>
            </div>
        `;
        
        // Create samples list container
        const samplesListContainer = document.createElement('div');
        samplesListContainer.className = 'biometrics-samples-list-container';
        samplesListContainer.innerHTML = `
            <div class="biometrics-samples-list-header">
                <span>Collected Samples</span>
                <div class="samples-count">0 samples</div>
            </div>
            <div class="biometrics-samples-list" id="biometrics-samples-list"></div>
        `;
        
        // Field notes: the three pattern types, drawn by the same generator as the prints
        const fieldNotes = document.createElement('details');
        fieldNotes.className = 'biometrics-field-notes';
        fieldNotes.innerHTML = '<summary>Field notes: pattern types</summary>';
        FIELD_NOTES.forEach(note => {
            const row = document.createElement('div');
            row.className = 'field-note';
            applyArtSlot(row, 'reference-card');
            const canvas = document.createElement('canvas');
            canvas.setAttribute('role', 'img');
            canvas.setAttribute('aria-label', `Example of a ${note.pattern} pattern`);
            canvas.dataset.pattern = note.pattern;
            const text = document.createElement('div');
            const name = document.createElement('strong');
            name.textContent = note.pattern;
            text.append(name, document.createTextNode(note.text));
            row.append(canvas, text);
            fieldNotes.appendChild(row);
        });
        this.fieldNotesElement = fieldNotes;
        this.addEventListener(fieldNotes, 'toggle', () => this.drawFieldNotes());
        
        // Create instructions
        const instructionsContainer = document.createElement('div');
        instructionsContainer.className = 'biometrics-scanner-instructions';
        instructionsContainer.innerHTML = `
            <div class="instruction-text">
                <strong>Instructions:</strong><br>
                • Use "Search Room" to highlight surfaces that carry prints<br>
                • Click a highlighted surface to dust it and lift the print<br>
                • Present a lift to a fingerprint reader to try to unlock it<br>
                • A cleaner lift reads more reliably
            </div>
        `;
        
        // Assemble the interface
        this.gameContainer.appendChild(expandToggle);
        this.gameContainer.appendChild(searchRoomContainer);
        this.gameContainer.appendChild(scannerHeader);
        this.gameContainer.appendChild(controlsContainer);
        this.gameContainer.appendChild(samplesListContainer);
        this.gameContainer.appendChild(fieldNotes);
        this.gameContainer.appendChild(instructionsContainer);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up expand/collapse functionality
        this.setupExpandToggle(expandToggle);
    }
    
    drawFieldNotes() {
        if (!this.fieldNotesElement?.open) return;
        this.fieldNotesElement.querySelectorAll('canvas').forEach(canvas => {
            if (canvas.dataset.drawn) return;
            canvas.dataset.drawn = '1';
            const print = generatePrint({ owner: `field-notes-${canvas.dataset.pattern}`, pattern: canvas.dataset.pattern, size: 64 });
            canvas.width = 64;
            canvas.height = 64;
            drawPrint(canvas.getContext('2d'), print, { scale: 1, ink: '#1b1b1b', background: '#e6e6dc' });
        });
    }
    
    setupEventListeners() {
        // Search functionality
        const biometricsSearch = document.getElementById('biometrics-search');
        if (biometricsSearch) {
            this.addEventListener(biometricsSearch, 'input', () => this.updateBiometricsPanel());
        }
        
        // Category filters
        const categories = this.gameContainer.querySelectorAll('.biometrics-category');
        categories.forEach(category => {
            this.addEventListener(category, 'click', () => {
                // Remove active class from all categories
                categories.forEach(c => c.classList.remove('active'));
                // Add active class to clicked category
                category.classList.add('active');
                // Update biometrics panel
                this.updateBiometricsPanel();
            });
        });
        
        // Search room button
        const searchRoomBtn = document.getElementById('search-room-btn');
        if (searchRoomBtn) {
            this.addEventListener(searchRoomBtn, 'click', () => this.toggleRoomSearching());
        }
    }
    
    setupExpandToggle(expandToggle) {
        this.addEventListener(expandToggle, 'keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); expandToggle.click(); }
        });
        this.addEventListener(expandToggle, 'click', () => {
            const isExpanded = this.container.classList.contains('expanded');
            
            if (isExpanded) {
                // Collapse
                this.container.classList.remove('expanded');
                expandToggle.innerHTML = '▼';
                expandToggle.title = 'Expand';
            } else {
                // Expand
                this.container.classList.add('expanded');
                expandToggle.innerHTML = '▲';
                expandToggle.title = 'Collapse';
            }
        });
    }
    
    // The player's lifts, normalised. The samples module owns the list.
    getSamples() {
        const raw = window.getBiometricSamples?.() || window.gameState?.biometricSamples || [];
        return raw.map(normaliseSample).filter(Boolean);
    }
    
    toggleRoomSearching() {
        this.searchingMode = !this.searchingMode;
        const searchBtn = document.getElementById('search-room-btn');
        
        if (this.searchingMode) {
            // Start searching mode
            searchBtn.classList.add('active');
            searchBtn.querySelector('.btn-text').textContent = 'Stop Searching';
            this.highlightFingerprintObjects();
        } else {
            // Stop searching mode
            searchBtn.classList.remove('active');
            searchBtn.querySelector('.btn-text').textContent = 'Search Room for Fingerprints';
            this.clearHighlights();
        }
    }
    
    // True when the surface still has a print worth lifting (no excellent lift yet).
    surfaceNeedsLift(obj) {
        if (obj.scenarioData?.hasFingerprint !== true) return false;
        const objectId = obj.scenarioData?.id || obj.objectId;
        const best = window.bestLiftFromObject?.(objectId);
        return !(best && best.quality >= EXCELLENT_LIFT);
    }
    
    highlightFingerprintObjects() {
        // Clear existing highlights
        this.clearHighlights();
        
        // Find all objects in the current room that have fingerprints
        if (!window.currentPlayerRoom || !window.rooms[window.currentPlayerRoom] || !window.rooms[window.currentPlayerRoom].objects) {
            return;
        }
        
        const room = window.rooms[window.currentPlayerRoom];
        this.highlightedObjects = [];
        
        Object.values(room.objects).forEach(obj => {
            if (this.surfaceNeedsLift(obj)) {
                // Add red highlight effect to the object
                if (obj.setTint) {
                    obj.setTint(0xff0000); // Red tint for fingerprint objects
                    this.highlightedObjects.push(obj);
                }
                
                // Add a visual indicator
                this.addFingerprintIndicator(obj);
            }
        });
    }
    
    addFingerprintIndicator(obj) {
        // Create a fingerprint image indicator directly over the object
        if (obj.scene && obj.scene.add) {
            const indicator = obj.scene.add.image(obj.x, obj.y, 'fingerprint');
            indicator.setDepth(1000); // High depth to appear on top
            indicator.setOrigin(-0.25, 0);
            indicator.setTint(0xff0000); // Red tint
            
            // Add pulsing animation
            obj.scene.tweens.add({
                targets: indicator,
                alpha: { from: 1, to: 0.3 },
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
            
            // Store reference for cleanup
            obj.fingerprintIndicator = indicator;
        }
    }
    
    clearHighlights() {
        // Remove highlights from all objects
        this.highlightedObjects.forEach(obj => {
            if (obj.clearTint) {
                obj.clearTint();
            }
            if (obj.fingerprintIndicator) {
                obj.fingerprintIndicator.destroy();
                delete obj.fingerprintIndicator;
            }
        });
        this.highlightedObjects = [];
    }
    
    // Close the panel, then open the dusting minigame for this surface on the next tick.
    dustSurface(sprite) {
        this.complete(false);
        setTimeout(() => window.startDustingMinigame?.(sprite), 0);
    }
    
    updateBiometricsCount() {
        const total = this.getSamples().length;
        const header = this.gameContainer?.querySelector('.samples-count-header');
        if (header) header.textContent = `${total} sample${total !== 1 ? 's' : ''}`;
    }
    
    updateBiometricsPanel() {
        const biometricsContent = document.getElementById('biometrics-samples-list');
        if (!biometricsContent) return;
        
        const searchTerm = document.getElementById('biometrics-search')?.value?.toLowerCase() || '';
        const activeCategory = this.gameContainer.querySelector('.biometrics-category.active')?.dataset.category || 'all';
        
        // Filter samples based on search and category
        let filteredSamples = this.getSamples();
        
        // Apply category filter
        if (activeCategory === 'fingerprint') {
            filteredSamples = filteredSamples.filter(sample => sample.type === 'fingerprint');
        }
        
        // Apply search filter. Matches what the player can see, so an unidentified
        // print can't be searched by its owner's name.
        if (searchTerm) {
            filteredSamples = filteredSamples.filter(sample =>
                labelForSample(sample).toLowerCase().includes(searchTerm) ||
                (sample.pattern || '').toLowerCase().includes(searchTerm) ||
                sample.type.toLowerCase().includes(searchTerm)
            );
        }
        
        // Sort samples by quality (highest first)
        filteredSamples.sort((a, b) => b.quality - a.quality);
        
        // Update samples count in both header and list
        const samplesCount = this.gameContainer.querySelector('.samples-count');
        if (samplesCount) {
            samplesCount.textContent = `${filteredSamples.length} sample${filteredSamples.length !== 1 ? 's' : ''}`;
        }
        this.updateBiometricsCount();
        
        // Clear current content
        biometricsContent.innerHTML = '';
        
        // Add samples
        if (filteredSamples.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'sample-item';
            if (searchTerm) {
                empty.textContent = 'No samples match your search.';
            } else if (activeCategory !== 'all') {
                empty.textContent = `No ${activeCategory} samples found.`;
            } else {
                empty.textContent = 'No samples collected yet. Use "Search Room" to find surfaces with prints.';
            }
            biometricsContent.appendChild(empty);
            return;
        }
        
        filteredSamples.forEach(sample => {
            const sampleElement = document.createElement('div');
            sampleElement.className = 'sample-item has-thumb';
            sampleElement.dataset.id = sample.id || 'unknown';
            
            const thumb = document.createElement('canvas');
            thumb.className = 'sample-thumb';
            thumb.setAttribute('role', 'img');
            thumb.setAttribute('aria-label', `Lifted print, ${sample.pattern || 'unclassified'} pattern`);
            drawSampleThumbnail(thumb, sample);
            
            const rating = sample.rating || ratingForQuality(sample.quality);
            const body = document.createElement('div');
            body.className = 'sample-body';
            
            const header = document.createElement('div');
            header.className = 'sample-header';
            const name = document.createElement('strong');
            name.textContent = displayDashes(labelForSample(sample));
            const type = document.createElement('span');
            type.className = 'sample-type';
            type.textContent = sample.type;
            header.append(name, type);
            
            const details = document.createElement('div');
            details.className = 'sample-details';
            const quality = document.createElement('span');
            quality.className = `sample-quality quality-${rating.toLowerCase()}`;
            quality.textContent = `${rating} (${percent(sample.quality)}%)`;
            details.appendChild(quality);
            
            body.append(header, details);
            if (sample.pattern) {
                const pattern = document.createElement('div');
                pattern.className = 'sample-pattern';
                pattern.textContent = `Pattern: ${sample.pattern}`;
                body.appendChild(pattern);
            }
            
            sampleElement.append(thumb, body);
            biometricsContent.appendChild(sampleElement);
        });
    }
    
    start() {
        super.start();
        
        // Let samples lifted while the panel is open refresh it
        this._previousPanelHooks = {
            panel: window.updateBiometricsPanel,
            count: window.updateBiometricsCount
        };
        window.updateBiometricsPanel = () => this.updateBiometricsPanel();
        window.updateBiometricsCount = () => this.updateBiometricsCount();
        
        // Set up global interaction handler for fingerprint objects
        this.setupFingerprintInteractionHandler();
    }
    
    setupFingerprintInteractionHandler() {
        // Store the original interaction handler
        this.originalInteractionHandler = window.handleObjectInteraction;
        
        // Override the interaction handler: in search mode, a highlighted surface opens dusting
        window.handleObjectInteraction = (sprite) => {
            if (this.searchingMode && sprite.scenarioData && this.surfaceNeedsLift(sprite)) {
                this.dustSurface(sprite);
                return; // Don't call the original handler
            }
            
            // Call the original handler for all other interactions
            if (this.originalInteractionHandler) {
                this.originalInteractionHandler(sprite);
            }
        };
    }
    
    complete(success) {
        // Stop searching mode and clear highlights
        if (this.searchingMode) {
            this.toggleRoomSearching();
        }
        
        // Call parent complete with result
        super.complete(success, this.gameResult);
    }
    
    cleanup() {
        // Restore original interaction handler
        if (this.originalInteractionHandler) {
            window.handleObjectInteraction = this.originalInteractionHandler;
        }
        
        if (this._previousPanelHooks) {
            window.updateBiometricsPanel = this._previousPanelHooks.panel;
            window.updateBiometricsCount = this._previousPanelHooks.count;
            this._previousPanelHooks = null;
        }
        
        // Clear highlights
        this.clearHighlights();
        
        // Call parent cleanup
        super.cleanup();
    }
}

// Function to start the biometrics minigame
export function startBiometricsMinigame(item) {
    // Make sure the minigame is registered
    if (window.MinigameFramework && !window.MinigameFramework.registeredScenes['biometrics']) {
        window.MinigameFramework.registerScene('biometrics', BiometricsMinigame);
    }
    
    // Initialize the framework if not already done
    if (!window.MinigameFramework.mainGameScene && item && item.scene) {
        window.MinigameFramework.init(item.scene);
    }
    
    // Start the biometrics minigame with proper parameters
    const params = {
        title: 'Biometric Scanner',
        item: item,
        disableGameInput: false, // Allow player to move while scanner is open
        onComplete: (success, result) => {}
    };
    
    window.MinigameFramework.startMinigame('biometrics', null, params);
}
